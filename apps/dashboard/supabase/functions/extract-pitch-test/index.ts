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

    console.log(`📄 Starting pitch extraction for title: ${title_id}, test_mode: ${test_mode} [v6-upsert-fix]`)

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

    // Step 2: Download PDF from storage
    const pdfPath = `${title_id}/pitch.pdf`
    console.log(`⬇️ Downloading PDF from: pitch-pdfs/${pdfPath}`)

    const { data: pdfBlob, error: downloadError } = await supabase.storage
      .from('pitch-pdfs')
      .download(pdfPath)

    if (downloadError || !pdfBlob) {
      console.error('❌ PDF download error:', downloadError)
      return new Response(
        JSON.stringify({
          success: false,
          error: `Failed to download PDF: ${downloadError?.message || 'Unknown error'}`
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`✅ PDF downloaded, size: ${pdfBlob.size} bytes`)

    // Step 3: Extract text from PDF using Python microservice
    const pdfExtractorUrl = Deno.env.get('PDF_EXTRACTOR_URL')
    let extractedText = ''

    if (pdfExtractorUrl) {
      try {
        console.log(`📤 Sending PDF to Python extractor service...`)

        const extractResponse = await fetch(pdfExtractorUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/pdf'
          },
          body: pdfBlob
        })

        if (extractResponse.ok) {
          const extractData = await extractResponse.json()

          if (extractData.success && extractData.text) {
            extractedText = extractData.text
            console.log(`✅ Text extracted: ${extractedText.length} characters (using ${extractData.library_used})`)
          } else {
            console.warn(`⚠️ Python extractor returned no text, using fallback`)
            extractedText = generateFallbackText(title, pdfBlob.size)
          }
        } else {
          console.error(`❌ Python extractor HTTP error: ${extractResponse.status}`)
          extractedText = generateFallbackText(title, pdfBlob.size)
        }
      } catch (extractError) {
        console.error(`❌ Python extractor failed:`, extractError)
        console.log(`⚠️ Falling back to placeholder extraction`)
        extractedText = generateFallbackText(title, pdfBlob.size)
      }
    } else {
      console.warn(`⚠️ PDF_EXTRACTOR_URL not configured, using fallback`)
      extractedText = generateFallbackText(title, pdfBlob.size)
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

    const analysisPrompt = `Analyze this pitch deck text and extract structured information.

Return ONLY valid JSON (no markdown, no code blocks) in this exact format:
{
  "summary": "2-3 sentence executive summary of the story",
  "highlights": ["key highlight 1", "key highlight 2", "key highlight 3"],
  "comparable_titles": ["comparable title 1", "comparable title 2"],
  "target_audience": "description of target demographic",
  "production": {
    "budget": "budget if mentioned or null",
    "timeline": "timeline if mentioned or null",
    "format": "series/feature/limited series/etc or null"
  },
  "selling_points": ["unique selling point 1", "unique selling point 2"]
}

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
            content: 'You are a pitch deck analyzer. Return ONLY valid JSON, no markdown formatting.'
          },
          {
            role: 'user',
            content: analysisPrompt
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3
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

    // Step 5: Save to title_content_analysis (if not test mode)
    let savedToDb = false
    if (!test_mode) {
      console.log(`💾 Saving to database...`)

      const { error: upsertError } = await supabase
        .from('title_content_analysis')
        .upsert({
          title_id: title_id,
          semantic_tags: analysis.highlights || [],
          mood_analysis: {
            pitch_summary: analysis.summary || '',
            production_budget: analysis.production?.budget,
            production_timeline: analysis.production?.timeline,
            production_format: analysis.production?.format
          },
          plot_elements: analysis.comparable_titles || [],
          target_demographics: {
            description: analysis.target_audience || '',
            source: 'pitch_deck'
          },
          keyword_density: (analysis.selling_points || []).reduce((acc: any, point: string, idx: number) => ({
            ...acc,
            [point]: 1.0 - (idx * 0.1)
          }), {}),
          search_boost_factor: 1.2, // 20% boost for titles with extracted pitch data
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
