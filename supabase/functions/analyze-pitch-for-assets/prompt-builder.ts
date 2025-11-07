// GPT-4 Prompt Builder for Asset Generation Analysis
// Feature: Creative Asset Generation System
// Purpose: Build prompts that analyze pitch decks and generate DALL-E 3 prompts

import type {
  AnalyzePitchRequest,
  PitchAnalysis,
  AssetGenerationConfig,
  GPT4AssetAnalysisResponse,
} from './types.ts';

// ============================================================================
// SYSTEM PROMPT (Defines GPT-4's role and capabilities)
// ============================================================================

const SYSTEM_PROMPT = `You are an expert creative director specializing in marketing asset generation for Korean IP (webtoons, web novels, dramas).

Your task is to analyze pitch deck content and generate detailed DALL-E 3 image prompts for marketing assets across three categories:
1. **Social Media** - Instagram stories/posts, Facebook posts, Twitter posts, TikTok videos
2. **Ad Creatives** - Display ads, YouTube thumbnails, video ads, banners
3. **Pitch Materials** - Concept art, key scenes, character cards, mood boards, posters

# CRITICAL REQUIREMENTS:

## DALL-E 3 Prompt Best Practices:
- **Be specific and detailed** (100-200 words per prompt)
- **Describe visual elements**: Characters, setting, lighting, mood, color palette, composition
- **Include art style**: Photorealistic, anime-style, painterly, cinematic, etc.
- **Specify format**: Vertical, horizontal, square (matching asset_format)
- **Avoid text in images**: DALL-E 3 struggles with text rendering
- **Focus on single moments**: One clear scene or composition per prompt
- **Use vivid language**: "dramatic lighting", "intimate close-up", "sweeping vista"

## Asset Generation Strategy:
- **Prioritize character-driven visuals**: Characters are the most engaging elements
- **Vary perspectives**: Mix close-ups, medium shots, wide shots
- **Diverse moods**: From dramatic to lighthearted (matching story tone)
- **Format-appropriate**: Instagram stories are vertical (1080x1920), posts are square (1080x1080), ads are horizontal
- **Marketing-focused**: Images should intrigue, not spoil the story

## Output Format:
Return ONLY valid JSON matching this structure (no markdown, no explanations):
{
  "asset_ideas": [
    {
      "category": "social_media" | "ad_creative" | "pitch_material",
      "type": "instagram_story" | "instagram_post" | "poster" | etc.,
      "format": "1080x1920" | "1080x1080" | "1920x1080" | etc.,
      "description": "Brief description of what this asset represents (20-30 words)",
      "prompt": "Detailed DALL-E 3 prompt (100-200 words)",
      "priority": 1-5 (higher = more important),
      "notes": "Optional: Why this asset is effective"
    }
  ],
  "summary": "Optional: 1-2 sentence strategy overview"
}

Generate 10-15 diverse asset ideas that would effectively market this title to its target audience.`;

// ============================================================================
// USER PROMPT BUILDER
// ============================================================================

/**
 * Build the user prompt for GPT-4 analysis
 * Combines title information, pitch analysis, and generation config
 */
export function buildAnalysisPrompt(
  request: AnalyzePitchRequest,
  config: AssetGenerationConfig
): string {
  const sections: string[] = [];

  // Header
  sections.push(`# Title: ${request.title_name}`);
  sections.push(`Title ID: ${request.title_id}\n`);

  // Pitch Analysis (if available)
  if (request.pitch_analysis) {
    sections.push('# Pitch Analysis\n');
    sections.push(formatPitchAnalysis(request.pitch_analysis));
  } else {
    sections.push('# Pitch Deck\n');
    sections.push(`Pitch deck URL: ${request.pitch_deck_url}`);
    sections.push('Note: No structured pitch analysis available. Generate ideas based on title name and general Korean IP marketing best practices.\n');
  }

  // Generation Requirements
  sections.push('# Generation Requirements\n');
  sections.push(`**Social Media Assets**: Generate ${config.social_media_count} ideas`);
  sections.push(`- Instagram stories (1080x1920), posts (1080x1080)`);
  sections.push(`- Facebook posts (1200x628)`);
  sections.push(`- Twitter posts (1200x675)`);
  sections.push(`- TikTok video thumbnails (1080x1920)\n`);

  sections.push(`**Ad Creatives**: Generate ${config.ad_creative_count} ideas`);
  sections.push(`- Display ads (300x250, 728x90, 1200x628)`);
  sections.push(`- YouTube thumbnails (1280x720)`);
  sections.push(`- Video ad key frames (1920x1080)\n`);

  sections.push(`**Pitch Materials**: Generate ${config.pitch_material_count} ideas`);
  sections.push(`- Concept art (1920x1080)`);
  sections.push(`- Key scenes (1920x1080)`);
  sections.push(`- Character cards (1080x1920)`);
  sections.push(`- Posters (1080x1920)\n`);

  // Examples
  sections.push('# Example Asset Ideas\n');
  sections.push(getExampleAssets());

  // Final instruction
  sections.push('\n# Your Task\n');
  sections.push(`Analyze the pitch content above and generate ${config.social_media_count + config.ad_creative_count + config.pitch_material_count} diverse, marketing-effective asset ideas.`);
  sections.push('Return ONLY the JSON response. No markdown formatting, no code blocks, no explanations.');

  return sections.join('\n');
}

// ============================================================================
// PITCH ANALYSIS FORMATTER
// ============================================================================

/**
 * Format pitch analysis into readable text for GPT-4
 */
function formatPitchAnalysis(analysis: PitchAnalysis): string {
  const sections: string[] = [];

  // Characters
  if (analysis.characters) {
    sections.push('## Characters\n');

    if (analysis.characters.main_characters && analysis.characters.main_characters.length > 0) {
      sections.push('**Main Characters**:');
      analysis.characters.main_characters.forEach(char => {
        const parts = [];
        if (char.name) parts.push(`- **${char.name}**`);
        if (char.role) parts.push(`Role: ${char.role}`);
        if (char.archetype) parts.push(`Archetype: ${char.archetype}`);
        if (char.description) parts.push(`Description: ${char.description}`);
        sections.push(parts.join(' | '));
      });
      sections.push('');
    }

    if (analysis.characters.relationships && analysis.characters.relationships.length > 0) {
      sections.push('**Character Relationships**:');
      analysis.characters.relationships.forEach(rel => {
        sections.push(`- ${rel}`);
      });
      sections.push('');
    }
  }

  // Story
  if (analysis.story) {
    sections.push('## Story\n');

    if (analysis.story.logline) {
      sections.push(`**Logline**: ${analysis.story.logline}\n`);
    }

    if (analysis.story.premise) {
      sections.push(`**Premise**: ${analysis.story.premise}\n`);
    }

    if (analysis.story.themes && analysis.story.themes.length > 0) {
      sections.push(`**Themes**: ${analysis.story.themes.join(', ')}\n`);
    }

    if (analysis.story.conflicts && analysis.story.conflicts.length > 0) {
      sections.push(`**Key Conflicts**: ${analysis.story.conflicts.join(', ')}\n`);
    }

    if (analysis.story.narrative_structure) {
      sections.push(`**Narrative Structure**: ${analysis.story.narrative_structure}\n`);
    }

    if (analysis.story.setting) {
      sections.push(`**Setting**: ${analysis.story.setting}\n`);
    }
  }

  // Market
  if (analysis.market) {
    sections.push('## Market Positioning\n');

    if (analysis.market.target_audience) {
      sections.push(`**Target Audience**: ${analysis.market.target_audience}\n`);
    }

    if (analysis.market.comparable_titles && analysis.market.comparable_titles.length > 0) {
      sections.push(`**Comparable Titles**: ${analysis.market.comparable_titles.join(', ')}\n`);
    }

    if (analysis.market.unique_selling_points && analysis.market.unique_selling_points.length > 0) {
      sections.push('**Unique Selling Points**:');
      analysis.market.unique_selling_points.forEach(usp => {
        sections.push(`- ${usp}`);
      });
      sections.push('');
    }

    if (analysis.market.genre_blend && analysis.market.genre_blend.length > 0) {
      sections.push(`**Genre Blend**: ${analysis.market.genre_blend.join(', ')}\n`);
    }
  }

  // Source Material
  if (analysis.source_material) {
    sections.push('## Source Material\n');
    const sm = analysis.source_material;
    const parts = [];
    if (sm.platform) parts.push(`Platform: ${sm.platform}`);
    if (sm.views) parts.push(`Views: ${sm.views.toLocaleString()}`);
    if (sm.chapters) parts.push(`Chapters: ${sm.chapters}`);
    if (sm.rating) parts.push(`Rating: ${sm.rating}/10`);
    if (sm.completion_status) parts.push(`Status: ${sm.completion_status}`);
    sections.push(parts.join(' | '));
    sections.push('');
  }

  // Cultural Elements
  if (analysis.cultural_elements) {
    sections.push('## Cultural Elements\n');

    if (analysis.cultural_elements.korean_cultural_themes && analysis.cultural_elements.korean_cultural_themes.length > 0) {
      sections.push('**Korean Cultural Themes**:');
      analysis.cultural_elements.korean_cultural_themes.forEach(theme => {
        sections.push(`- ${theme}`);
      });
      sections.push('');
    }

    if (analysis.cultural_elements.cultural_authenticity_score !== undefined) {
      sections.push(`**Cultural Authenticity Score**: ${analysis.cultural_elements.cultural_authenticity_score}/10\n`);
    }
  }

  // Raw Pitch Text (fallback)
  if (analysis.raw_pitch_text && sections.length === 0) {
    sections.push('## Pitch Deck Content\n');
    sections.push(analysis.raw_pitch_text);
    sections.push('');
  }

  return sections.join('\n');
}

// ============================================================================
// EXAMPLE ASSETS
// ============================================================================

/**
 * Provide example asset ideas to guide GPT-4's output
 */
function getExampleAssets(): string {
  return `Example 1 - Instagram Story (Character Focus):
{
  "category": "social_media",
  "type": "instagram_story",
  "format": "1080x1920",
  "description": "Main character in dramatic moment showcasing their power",
  "prompt": "Vertical composition (9:16 aspect ratio) of a young Korean woman with long black hair in a flowing white hanbok, standing in a mystical forest with glowing blue spirits floating around her. Cinematic lighting from above creates dramatic shadows. Her eyes glow with ethereal blue light as she raises one hand, summoning magical energy. Photorealistic anime style, inspired by Studio Ghibli and Korean webtoon aesthetics. Rich color palette of deep blues, ethereal whites, and forest greens. Intimate medium shot focusing on her upper body and face. Magical realism atmosphere.",
  "priority": 5,
  "notes": "Character-driven content performs best on Instagram stories. This showcases visual appeal and hints at supernatural elements."
}

Example 2 - YouTube Thumbnail (Action Scene):
{
  "category": "ad_creative",
  "type": "youtube_thumbnail",
  "format": "1280x720",
  "description": "Climactic confrontation between protagonist and antagonist",
  "prompt": "Horizontal composition (16:9 aspect ratio) showing two characters facing off in a modern Seoul rooftop setting at night. Left side: A young male hero in casual streetwear, fists clenched, determination in his eyes. Right side: A mysterious figure in a black suit with glowing red eyes, smirking confidently. City lights of Seoul skyline in the background with N Seoul Tower visible. Dynamic lighting with neon signs casting red and blue glows. Tense atmosphere with electricity crackling between them. Cinematic Korean drama style, photorealistic with dramatic color grading. Wide shot capturing both characters and the epic scale of the confrontation.",
  "priority": 4,
  "notes": "Thumbnails need visual tension and clear composition to attract clicks. This creates intrigue about the conflict."
}

Example 3 - Concept Art (World-Building):
{
  "category": "pitch_material",
  "type": "concept_art",
  "format": "1920x1080",
  "description": "Establishing shot of the story's unique fantasy world",
  "prompt": "Horizontal landscape (16:9 aspect ratio) depicting a breathtaking fantasy version of Seoul where traditional Korean architecture (hanok with curved roofs, wooden pavilions) seamlessly blends with futuristic skyscrapers. Cherry blossoms float through the air mixing with holographic displays. A massive ancient tree grows through the center of the city, its glowing roots visible beneath glass streets. Golden hour lighting bathes everything in warm amber tones. People in mix of hanbok and modern fashion walk the streets. Flying vehicles hover between buildings adorned with neon hangul signage. Painterly digital art style, rich detail, inspired by concept art from Studio Mir and Korean webtoon backgrounds. Wide establishing shot showing the scale and uniqueness of this world.",
  "priority": 5,
  "notes": "Pitch materials need to showcase the unique visual world. This demonstrates the creative vision and production potential."
}

Follow this format and level of detail for all generated asset ideas.`;
}

// ============================================================================
// VALIDATION & PARSING
// ============================================================================

/**
 * Parse and validate GPT-4 response
 * Returns parsed response or throws error with details
 */
export function parseGPT4Response(responseText: string): GPT4AssetAnalysisResponse {
  try {
    // Remove markdown code blocks if present (sometimes GPT-4 adds them despite instructions)
    let cleanedText = responseText.trim();
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.replace(/^```json\n/, '').replace(/\n```$/, '');
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/^```\n/, '').replace(/\n```$/, '');
    }

    // Parse JSON
    const parsed = JSON.parse(cleanedText) as GPT4AssetAnalysisResponse;

    // Validate structure
    if (!parsed.asset_ideas || !Array.isArray(parsed.asset_ideas)) {
      throw new Error('Response missing "asset_ideas" array');
    }

    if (parsed.asset_ideas.length === 0) {
      throw new Error('Response contains zero asset ideas');
    }

    // Validate each asset idea
    parsed.asset_ideas.forEach((idea, index) => {
      if (!idea.category) {
        throw new Error(`Asset idea ${index} missing "category" field`);
      }
      if (!idea.type) {
        throw new Error(`Asset idea ${index} missing "type" field`);
      }
      if (!idea.format) {
        throw new Error(`Asset idea ${index} missing "format" field`);
      }
      if (!idea.description) {
        throw new Error(`Asset idea ${index} missing "description" field`);
      }
      if (!idea.prompt) {
        throw new Error(`Asset idea ${index} missing "prompt" field`);
      }

      // Validate category
      const validCategories = ['social_media', 'ad_creative', 'pitch_material'];
      if (!validCategories.includes(idea.category)) {
        throw new Error(`Asset idea ${index} has invalid category: ${idea.category}`);
      }
    });

    return parsed;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Failed to parse GPT-4 response as JSON: ${error.message}\n\nResponse: ${responseText.substring(0, 200)}...`);
    }
    throw error;
  }
}

// ============================================================================
// MESSAGE BUILDER FOR OPENAI API
// ============================================================================

/**
 * Build the complete message array for OpenAI Chat Completions API
 */
export function buildOpenAIMessages(
  request: AnalyzePitchRequest,
  config: AssetGenerationConfig
): Array<{ role: string; content: string }> {
  return [
    {
      role: 'system',
      content: SYSTEM_PROMPT,
    },
    {
      role: 'user',
      content: buildAnalysisPrompt(request, config),
    },
  ];
}

// ============================================================================
// COST ESTIMATION
// ============================================================================

/**
 * Estimate token count for prompt (rough approximation)
 * OpenAI typically counts ~1.3 tokens per word for English
 */
export function estimatePromptTokens(
  request: AnalyzePitchRequest,
  config: AssetGenerationConfig
): number {
  const messages = buildOpenAIMessages(request, config);
  const totalText = messages.map(m => m.content).join(' ');
  const wordCount = totalText.split(/\s+/).length;
  return Math.ceil(wordCount * 1.3); // Conservative estimate
}

/**
 * Estimate completion tokens based on config
 * Each asset idea is ~150-200 tokens
 */
export function estimateCompletionTokens(config: AssetGenerationConfig): number {
  const totalIdeas = config.social_media_count + config.ad_creative_count + config.pitch_material_count;
  return totalIdeas * 200; // 200 tokens per idea (conservative)
}

/**
 * Estimate total cost of GPT-4 analysis
 */
export function estimateAnalysisCost(
  request: AnalyzePitchRequest,
  config: AssetGenerationConfig
): number {
  const promptTokens = estimatePromptTokens(request, config);
  const completionTokens = estimateCompletionTokens(config);

  // GPT-4 Turbo pricing: $0.01/1K input, $0.03/1K output
  const inputCost = (promptTokens / 1000) * 0.01;
  const outputCost = (completionTokens / 1000) * 0.03;

  return inputCost + outputCost;
}
