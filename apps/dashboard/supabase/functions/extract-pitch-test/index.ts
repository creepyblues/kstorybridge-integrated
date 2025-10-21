import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ExtractRequest {
  title_id: string;
  test_mode?: boolean; // If true, don't save to DB (preview only)
}

interface ExtractionResult {
  success: boolean;
  data?: {
    extracted_text: string;
    full_text_length: number;
    analysis: {
      summary: string;
      highlights: string[];
      comparable_titles: string[];
      target_audience: string;
      production: {
        budget: string | null;
        timeline: string | null;
        format: string | null;
      };
      selling_points: string[];
    };
    cost: number;
    tokens_used: {
      input: number;
      output: number;
    };
    saved_to_db: boolean;
  };
  error?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Parse request
    const { title_id, test_mode = false } = await req.json() as ExtractRequest

    if (!title_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing title_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`📄 Starting pitch extraction for title: ${title_id}, test_mode: ${test_mode} [v7-comprehensive-extraction]`)

    // Step 1: Verify title exists and has pitch URL
    const { data: title, error: titleError } = await supabase
      .from('titles')
      .select('title_id, title_name_en, title_name_kr, pitch')
      .eq('title_id', title_id)
      .single()

    if (titleError || !title || !title.pitch) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Title not found or missing pitch deck'
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`✅ Title found: ${title.title_name_en || title.title_name_kr}`)
    console.log(`📎 Pitch URL: ${title.pitch}`)

    // Step 2: Create signed URL for PDF access (no size limits)
    const pdfPath = `${title_id}/pitch.pdf`
    console.log(`🔗 Creating signed URL for: pitch-pdfs/${pdfPath}`)

    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('pitch-pdfs')
      .createSignedUrl(pdfPath, 300) // 5-minute expiry

    if (signedUrlError || !signedUrlData?.signedUrl) {
      console.error('❌ Signed URL creation error:', signedUrlError)
      return new Response(
        JSON.stringify({
          success: false,
          error: `Failed to create signed URL: ${signedUrlError?.message || 'Unknown error'}`
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`✅ Signed URL created (valid for 5 minutes)`)

    // Step 3: Extract text from PDF using Python microservice with signed URL
    const pdfExtractorUrl = Deno.env.get('PDF_EXTRACTOR_URL')
    let extractedText = ''
    let pdfSize = 0

    if (pdfExtractorUrl) {
      try {
        console.log(`📤 Sending signed URL to Python extractor service...`)

        const extractResponse = await fetch(pdfExtractorUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            pdf_url: signedUrlData.signedUrl
          })
        })

        if (extractResponse.ok) {
          const extractData = await extractResponse.json()

          if (extractData.success && extractData.text) {
            extractedText = extractData.text
            pdfSize = extractData.pdf_size || 0
            console.log(`✅ Text extracted: ${extractedText.length} characters from ${(pdfSize / 1024 / 1024).toFixed(2)} MB PDF (using ${extractData.library_used})`)
          } else {
            console.warn(`⚠️ Python extractor returned no text, using fallback`)
            extractedText = generateFallbackText(title, pdfSize)
          }
        } else {
          console.error(`❌ Python extractor HTTP error: ${extractResponse.status}`)
          const errorText = await extractResponse.text()
          console.error(`❌ Error details: ${errorText}`)
          extractedText = generateFallbackText(title, 0)
        }
      } catch (extractError) {
        console.error(`❌ Python extractor failed:`, extractError)
        console.log(`⚠️ Falling back to placeholder extraction`)
        extractedText = generateFallbackText(title, 0)
      }
    } else {
      console.warn(`⚠️ PDF_EXTRACTOR_URL not configured, using fallback`)
      extractedText = generateFallbackText(title, 0)
    }

    // Fallback text generator function
    function generateFallbackText(title: any, size: number): string {
      return `[PDF Text Extraction Placeholder - Fallback Mode]

Title: ${title.title_name_en || title.title_name_kr}
PDF Size: ${(size / 1024 / 1024).toFixed(2)} MB

Note: Real PDF extraction service unavailable. Using fallback placeholder.

This is a placeholder for the actual pitch deck content. In production:
- Full text would be extracted from all PDF pages
- Tables, bullet points, and formatted content would be preserved
- Image captions and charts would be included

[End of fallback text - ${size} bytes PDF]`
    }

    // Step 4: Analyze with OpenAI GPT-4
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'OpenAI API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const analysisPrompt = `You are an expert pitch deck analyzer specializing in Korean IP (webtoons, web novels, manhwa) for film/TV adaptation. Analyze the pitch deck text comprehensively and extract ALL available information into structured JSON format.

Return ONLY valid JSON (no markdown code blocks, no explanations) in this exact structure:

{
  "story_world": {
    "setting": "Primary location/world (e.g., Modern Seoul, Historical Joseon, Fantasy realm)",
    "time_period": "When story takes place",
    "world_building": ["unique world element 1", "element 2", "element 3"]
  },

  "characters": [
    {
      "name": "Character name (if mentioned)",
      "role": "protagonist/antagonist/supporting",
      "archetype": "Character type (e.g., cold male lead, tsundere, chaebol heir, strong female lead)",
      "description": "2-3 sentence character description",
      "key_traits": ["trait 1", "trait 2"],
      "relationships": ["relationship dynamics with other characters"]
    }
  ],

  "themes_and_tone": {
    "primary_themes": ["main theme 1", "theme 2", "theme 3"],
    "emotional_tone": "Overall emotional feel (e.g., dark and suspenseful, heartwarming, bittersweet)",
    "visual_style": "Visual/artistic direction mentioned (e.g., noir, pastel romantic, gritty realistic)",
    "mood_keywords": ["mood descriptor 1", "descriptor 2", "descriptor 3"]
  },

  "story_elements": {
    "logline": "One-sentence compelling hook",
    "plot_summary": "4-5 sentence detailed synopsis",
    "key_plot_points": ["major story beat 1", "beat 2", "beat 3"],
    "genre_blend": ["primary genre", "secondary genre"],
    "narrative_structure": "How story is told (linear/flashback-heavy/multi-timeline/episodic)"
  },

  "market_positioning": {
    "target_audience": {
      "age_range": "Target age demographic",
      "gender_skew": "Primary audience gender",
      "psychographics": "Audience interests/preferences"
    },
    "comparable_titles": [
      {
        "title": "Comparable work name",
        "platform": "Where it aired/published",
        "similarity": "Why it's comparable"
      }
    ],
    "platform_fit": ["Streaming platform 1", "Platform 2"],
    "territory_potential": ["Geographic market 1", "market 2"]
  },

  "production_details": {
    "format": "8-episode series/16-episode series/feature film/limited series",
    "estimated_episodes": "Number if mentioned, else null",
    "budget_range": "Budget if mentioned, else null",
    "timeline": "Production timeline if mentioned, else null",
    "adaptation_type": "webtoon adaptation/novel adaptation/original/etc"
  },

  "source_material": {
    "original_platform": "Naver Webtoon/Kakao Page/RIDI/Wattpad/Manta Comics/etc or null",
    "metrics": {
      "views": "Number if shown, else null",
      "likes": "Number if shown, else null",
      "chapters": "Total chapters/episodes if shown, else null",
      "rating": "User rating if mentioned, else null"
    },
    "serialization_status": "completed/ongoing/null",
    "awards_recognition": ["Award 1", "recognition 2"]
  },

  "korean_cultural_elements": [
    "Specific Korean cultural reference 1 (e.g., hanok architecture, Korean food, historical periods, K-pop, chaebol culture, Korean language elements)",
    "Cultural element 2",
    "Element 3"
  ],

  "ip_value": {
    "franchise_potential": "high/medium/low",
    "merchandising_opportunities": ["potential category 1", "category 2"],
    "cross_media_potential": ["games", "merchandise", "sequels", "spin-offs"],
    "unique_selling_points": [
      "USP 1 - what makes this IP unique and marketable",
      "USP 2",
      "USP 3",
      "USP 4",
      "USP 5"
    ]
  },

  "creative_team": {
    "author_writer": "Name if mentioned, else null",
    "illustrator_artist": "Name if mentioned, else null",
    "credentials": ["Previous work 1", "award/recognition 2"],
    "studio_publisher": "Publishing house or production studio, else null"
  },

  "rights_availability": {
    "available_rights": ["adaptation rights", "distribution", "merchandising"],
    "territories_available": ["Region 1", "Region 2"],
    "exclusivity_notes": "Any exclusivity information mentioned"
  },

  "content_classification": {
    "maturity_rating": "all ages/teen (13+)/mature (18+)",
    "content_warnings": ["violence", "sexual content", "dark themes", "substance use"],
    "complexity_score": 7,
    "accessibility_notes": "Any mentioned accessibility features"
  },

  "additional_highlights": [
    "Any other notable information not captured above",
    "Marketing angles mentioned",
    "Special features or bonuses"
  ]
}

INSTRUCTIONS:
- Extract EVERY piece of information you can find in the deck
- If a field has no information in the deck, use null or empty array []
- For arrays, include ALL items found (don't limit to 2-3)
- Pay special attention to Korean cultural context
- Extract exact numbers when shown (views, likes, chapters, budget)
- Capture all character details if character profiles are shown
- Note visual/artistic style descriptions
- Include all comparable titles mentioned
- complexity_score: Rate 1-10 based on story sophistication (1=very simple, 10=very complex)
- Be thorough - pitch decks often have 15-20 slides of detailed info

Pitch deck text:
${extractedText}`

    console.log(`🤖 Calling OpenAI GPT-4 for analysis...`)

    const gptResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are an expert pitch deck analyzer specializing in Korean IP (webtoons, web novels, manhwa) for film/TV adaptation. You understand Korean cultural context, webtoon industry conventions, and K-drama/K-content adaptation markets. Return ONLY valid JSON, no markdown formatting.'
          },
          {
            role: 'user',
            content: analysisPrompt
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
        max_tokens: 4096
      })
    })

    if (!gptResponse.ok) {
      const errorText = await gptResponse.text()
      console.error('❌ OpenAI API error:', errorText)
      return new Response(
        JSON.stringify({
          success: false,
          error: `OpenAI API error: ${gptResponse.status}`
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const gptData = await gptResponse.json()
    console.log(`✅ GPT-4 analysis complete`)

    // Parse the analysis
    const analysis = JSON.parse(gptData.choices[0].message.content)

    // Calculate cost (GPT-4o pricing: $0.0025/1K input, $0.01/1K output)
    const inputTokens = gptData.usage.prompt_tokens
    const outputTokens = gptData.usage.completion_tokens
    const cost = (inputTokens * 0.0025 / 1000) + (outputTokens * 0.01 / 1000)

    console.log(`💰 API Cost: $${cost.toFixed(4)} (${inputTokens} input + ${outputTokens} output tokens)`)

    // Helper function to calculate processing confidence based on populated fields
    function calculateConfidence(analysis: any): number {
      let score = 0
      if (analysis.characters?.length > 0) score += 0.15
      if (analysis.story_elements?.plot_summary) score += 0.15
      if (analysis.themes_and_tone?.primary_themes?.length > 0) score += 0.15
      if (analysis.market_positioning?.comparable_titles?.length > 0) score += 0.15
      if (analysis.source_material?.metrics?.views || analysis.source_material?.metrics?.chapters) score += 0.10
      if (analysis.korean_cultural_elements?.length > 0) score += 0.10
      if (analysis.ip_value?.unique_selling_points?.length > 0) score += 0.10
      if (analysis.content_classification?.complexity_score) score += 0.10
      return Math.min(score, 1.0)
    }

    // Step 5: Save to title_content_analysis (if not test mode)
    let savedToDb = false
    if (!test_mode) {
      console.log(`💾 Saving to database...`)

      // Combine themes and mood keywords for semantic tags
      const semanticTags = [
        ...(analysis.themes_and_tone?.primary_themes || []),
        ...(analysis.themes_and_tone?.mood_keywords || []),
        ...(analysis.story_elements?.genre_blend || [])
      ]

      // Extract character archetypes
      const characterTypes = (analysis.characters || [])
        .map((char: any) => char.archetype)
        .filter((archetype: string) => archetype && archetype !== 'null')

      // Build comprehensive keyword density from selling points and themes
      const allKeywords = [
        ...(analysis.ip_value?.unique_selling_points || []),
        ...(analysis.themes_and_tone?.primary_themes || [])
      ]
      const keywordDensity = allKeywords.reduce((acc: any, keyword: string, idx: number) => ({
        ...acc,
        [keyword]: 1.0 - (idx * 0.05)  // Gentler decay for more keywords
      }), {})

      const { error: upsertError } = await supabase
        .from('title_content_analysis')
        .upsert({
          title_id: title_id,

          // ✅ NEW: Store complete GPT-4 analysis in JSONB (100% data preservation)
          pitch_analysis: analysis,

          // Semantic analysis (legacy field mapping - kept for backward compatibility)
          semantic_tags: semanticTags,
          mood_analysis: {
            pitch_summary: analysis.story_elements?.plot_summary || '',
            logline: analysis.story_elements?.logline || '',
            emotional_tone: analysis.themes_and_tone?.emotional_tone || '',
            visual_style: analysis.themes_and_tone?.visual_style || '',
            narrative_structure: analysis.story_elements?.narrative_structure || '',
            production_budget: analysis.production_details?.budget_range,
            production_timeline: analysis.production_details?.timeline,
            production_format: analysis.production_details?.format,
            franchise_potential: analysis.ip_value?.franchise_potential,
            source_platform: analysis.source_material?.original_platform,
            source_views: analysis.source_material?.metrics?.views,
            source_chapters: analysis.source_material?.metrics?.chapters
          },
          character_types: characterTypes,
          plot_elements: analysis.story_elements?.key_plot_points || [],
          cultural_elements: analysis.korean_cultural_elements || [],

          // Content metrics
          complexity_score: analysis.content_classification?.complexity_score || null,
          content_quality_score: null, // Not extracted from pitch decks
          reading_time_minutes: null, // Not applicable for pitch decks

          // Audience analysis
          target_demographics: {
            ...analysis.market_positioning?.target_audience,
            comparable_titles: analysis.market_positioning?.comparable_titles || [],
            platform_fit: analysis.market_positioning?.platform_fit || [],
            territory_potential: analysis.market_positioning?.territory_potential || [],
            source: 'pitch_deck'
          },
          content_warnings: analysis.content_classification?.content_warnings || [],
          accessibility_features: [], // Not typically in pitch decks

          // Search optimization
          keyword_density: keywordDensity,
          search_boost_factor: 1.5, // 50% boost for titles with extracted pitch data

          // Processing metadata
          analysis_version: '2.0', // Enhanced extraction version
          processed_by: 'openai-gpt-4o',
          processing_confidence: calculateConfidence(analysis),

          updated_at: new Date().toISOString()
        }, {
          onConflict: 'title_id'  // Update existing record if title_id already exists
        })

      if (upsertError) {
        console.error('❌ Database save error:', upsertError)
        return new Response(
          JSON.stringify({
            success: false,
            error: `Failed to save to database: ${upsertError.message}`
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      savedToDb = true
      console.log(`✅ Data saved to title_content_analysis`)
    } else {
      console.log(`🧪 Test mode: Skipping database save`)
    }

    // Step 6: Return results
    const result: ExtractionResult = {
      success: true,
      data: {
        extracted_text: extractedText.substring(0, 500) + '...',
        full_text_length: extractedText.length,
        analysis,
        cost,
        tokens_used: {
          input: inputTokens,
          output: outputTokens
        },
        saved_to_db: savedToDb
      }
    }

    console.log(`✅ Extraction complete for ${title.title_name_en || title.title_name_kr}`)

    return new Response(
      JSON.stringify(result),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('❌ Extraction error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
