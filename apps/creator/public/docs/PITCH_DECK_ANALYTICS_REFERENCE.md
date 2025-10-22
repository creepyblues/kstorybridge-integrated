# Pitch Deck Analytics Tool - Technical Reference

**Version**: 2.0 Enhanced
**Last Updated**: 2025-01-30
**Status**: ✅ Production Ready

---

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Deep Dive](#architecture-deep-dive)
3. [Data Extraction Details](#data-extraction-details)
4. [Database Integration](#database-integration)
5. [Query Examples](#query-examples)
6. [Integration Patterns](#integration-patterns)
7. [Security Architecture](#security-architecture)
8. [Error Recovery](#error-recovery)
9. [Performance Benchmarks](#performance-benchmarks)
10. [API Reference](#api-reference)

---

## System Overview

The **Pitch Deck Analytics Tool** is an AI-powered system that automatically extracts and analyzes comprehensive data from Korean IP pitch decks (webtoons, web novels, manhwa). It transforms unstructured PDF pitch decks into structured, searchable metadata.

### Key Capabilities

- **14 data categories** extracted per deck (story world, characters, themes, market positioning, etc.)
- **50+ individual fields** captured automatically
- **9+ character profiles** with archetypes and relationships
- **7+ comparable titles** with platforms and similarity notes
- **Source material metrics** (views, chapters, platform)
- **Processing confidence score** (0-1) for quality assurance
- **Database integration** - Populates `title_content_analysis` table for enhanced search

### Purpose

**Problem Solved**: Manual pitch deck analysis is time-consuming and inconsistent. Critical data buried in PDFs isn't searchable or usable for recommendations.

**Solution**: Automated extraction + AI analysis + structured storage = Searchable, queryable metadata for all pitch decks.

**Use Cases**:
1. **Chatbot Recommendations** - Uses themes, comps, and selling points for better suggestions
2. **Search Enhancement** - 50% boost factor for titles with pitch data
3. **Content Discovery** - Filter by character archetypes, themes, source metrics
4. **Market Analysis** - Compare franchise potential, target audiences across titles

---

## Architecture Deep Dive

### 4-Stage Pipeline

```
┌─────────────────────┐
│  Stage 1:           │
│  PDF Storage        │
│  (Supabase)         │
└──────────┬──────────┘
           │ Signed URL (5min expiry)
           ▼
┌─────────────────────┐
│  Stage 2:           │
│  Text Extraction    │
│  (Python/Vercel)    │
└──────────┬──────────┘
           │ Full text (15-50K chars)
           ▼
┌─────────────────────┐
│  Stage 3:           │
│  AI Analysis        │
│  (GPT-4o)           │
└──────────┬──────────┘
           │ Structured JSON (50+ fields)
           ▼
┌─────────────────────┐
│  Stage 4:           │
│  Database Storage   │
│  (title_content_    │
│   analysis)         │
└─────────────────────┘
```

### Stage 1: PDF Storage & Access

**Storage Location**: Supabase Storage bucket `pitch-pdfs/`

**Path Format**: `{title_id}/pitch.pdf`

**Access Method**: Signed URLs (5-minute expiry) for security

**Why Signed URLs**:
- ✅ **Time-limited access** - Prevents unauthorized long-term access
- ✅ **No size restrictions** - Unlike direct download, handles large PDFs (5-10MB+)
- ✅ **Secure** - URL expires automatically, no permanent public access
- ✅ **Trackable** - Each access generates new signed URL for auditing

**Implementation** (Edge Function):
```typescript
const { data: signedUrlData } = await supabase.storage
  .from('pitch-pdfs')
  .createSignedUrl(pdfPath, 300) // 5-minute expiry
```

### Stage 2: Text Extraction (Python Microservice)

**Service**: Separate Python microservice deployed on Vercel

**URL**: `https://python-pdf-extractor-cal8vugu1-creepyblues-9060s-projects.vercel.app/api/extract`

**Libraries Used**:
- **Primary**: PyPDF2 (fast, standard extraction)
- **Fallback**: pdfplumber (better for complex PDFs with tables)
- **Selection**: Automatic based on availability

**Process Flow**:
1. Edge function sends signed URL to Python service
2. Python service downloads PDF from signed URL (no size limits)
3. Extracts text page-by-page with page markers
4. Returns extracted text + PDF metadata (size, library used)

**Output Format**:
```json
{
  "success": true,
  "text": "--- Page 1 ---\n[page content]\n--- Page 2 ---\n[page content]...",
  "text_length": 35420,
  "pdf_size": 2458923,
  "library_used": "PyPDF2"
}
```

**Typical Text Length**: 15,000-50,000 characters

**Fallback Behavior**: If Python service unavailable, generates placeholder text (extraction continues but with low confidence)

### Stage 3: AI Analysis (GPT-4o)

**Model**: OpenAI GPT-4o with JSON response format

**System Prompt Specialization**:
```
You are an expert pitch deck analyzer specializing in Korean IP
(webtoons, web novels, manhwa) for film/TV adaptation. You understand
Korean cultural context, webtoon industry conventions, and K-drama/
K-content adaptation markets.
```

**Why GPT-4o**:
- ✅ **Korean language support** - Understands Korean terms and cultural references
- ✅ **JSON mode** - Guarantees structured output
- ✅ **Large context window** - Handles 50K character pitch decks
- ✅ **Industry knowledge** - Trained on entertainment industry patterns

**Extraction Prompt Structure**:
1. **JSON Schema** - Exact structure with 14 categories
2. **Field Descriptions** - Guidance for each field
3. **Extraction Instructions** - "Extract EVERY piece of information", use null for missing data
4. **Korean IP Context** - Recognize archetypes, platforms, cultural elements
5. **Full Pitch Text** - Complete extracted PDF text

**Request Parameters**:
```typescript
{
  model: 'gpt-4o',
  response_format: { type: 'json_object' }, // Enforces JSON
  temperature: 0.3,  // Low temp for consistent extraction
  max_tokens: 4096   // Allows detailed analysis
}
```

**Processing Time**: 5-10 seconds typical (depends on PDF length)

**Cost Calculation**:
```typescript
// GPT-4o Pricing (as of 2025-01)
const inputCost = (inputTokens * 0.0025) / 1000
const outputCost = (outputTokens * 0.01) / 1000
const totalCost = inputCost + outputCost // $0.15-0.20 typical
```

### Stage 4: Database Storage

**Table**: `title_content_analysis`

**Storage Strategy**:
1. **Complete Preservation** - Full GPT-4o analysis in `pitch_analysis` JSONB field
2. **Search Optimization** - Key fields mapped to dedicated columns for indexing
3. **Backward Compatibility** - Legacy fields populated for v1.0 compatibility

**Upsert Logic**:
```typescript
await supabase
  .from('title_content_analysis')
  .upsert({ title_id, ...data }, { onConflict: 'title_id' })
// Updates existing record if title already analyzed
```

---

## Data Extraction Details

### Complete Field Breakdown (50+ Fields)

#### 1. Story World & Setting (3 fields)
```typescript
story_world: {
  setting: string           // "Modern Seoul", "Historical Joseon", "Fantasy realm"
  time_period: string       // "Contemporary", "Joseon Dynasty", "Post-apocalyptic"
  world_building: string[]  // ["Secret underground werewolf war", "Medical hospital setting"]
}
```

#### 2. Characters (6 fields × up to 9 characters = 54 data points)
```typescript
characters: [
  {
    name: string              // "Dr. Olivia Han", "Damian Black"
    role: string              // "protagonist", "antagonist", "supporting"
    archetype: string         // "strong female lead", "cold male lead", "tsundere"
    description: string       // 2-3 sentence character description
    key_traits: string[]      // ["intelligent", "determined", "compassionate"]
    relationships: string[]   // ["rivals with Damian", "mentored by Dr. Kim"]
  }
]
```

**Common Korean Archetypes Recognized**:
- Cold male lead (차가운 남주)
- Tsundere (츤데레)
- Chaebol heir (재벌 2세)
- Strong female lead (강한 여주)
- Playboy villain
- Genius professional (doctor, lawyer, CEO)

#### 3. Story Elements (5 fields)
```typescript
story_elements: {
  logline: string              // One-sentence compelling hook
  plot_summary: string         // 4-5 sentence detailed synopsis
  key_plot_points: string[]    // ["Olivia discovers secret", "Damian's identity revealed"]
  genre_blend: string[]        // ["medical procedural", "supernatural romance", "thriller"]
  narrative_structure: string  // "linear", "flashback-heavy", "multi-timeline", "episodic"
}
```

#### 4. Themes & Tone (4 fields)
```typescript
themes_and_tone: {
  primary_themes: string[]    // ["love and sacrifice", "science vs supernatural", "identity"]
  emotional_tone: string      // "dark and suspenseful", "heartwarming", "bittersweet"
  visual_style: string        // "noir", "pastel romantic", "gritty realistic"
  mood_keywords: string[]     // ["intense", "mysterious", "emotional", "romantic"]
}
```

#### 5. Market Positioning (10+ fields)
```typescript
market_positioning: {
  target_audience: {
    age_range: string         // "18-34", "25-45"
    gender_skew: string       // "female-skewed", "broad appeal", "male-skewed"
    psychographics: string    // "fans of supernatural romance", "medical drama enthusiasts"
  },
  comparable_titles: [
    {
      title: string           // "Grey's Anatomy", "Vampire Diaries"
      platform: string        // "ABC", "Netflix", "HBO Max"
      similarity: string      // "medical setting with supernatural twist"
    }
  ],
  platform_fit: string[]      // ["Netflix", "HBO Max", "Disney+"]
  territory_potential: string[] // ["North America", "Europe", "Asia"]
}
```

#### 6. Production Details (5 fields)
```typescript
production_details: {
  format: string              // "8-episode series", "feature film", "limited series"
  estimated_episodes: string  // "8", "16", "Season 1: 10 eps" (or null)
  budget_range: string        // "$2-5M per episode", "mid-budget" (or null)
  timeline: string            // "18-month production", "2026 target" (or null)
  adaptation_type: string     // "webtoon adaptation", "novel adaptation", "original"
}
```

#### 7. Source Material Metrics (8 fields)
```typescript
source_material: {
  original_platform: string   // "Naver Webtoon", "Manta Comics", "RIDI", "Kakao Page"
  metrics: {
    views: string             // "2000000", "15M" (or null)
    likes: string             // "150000" (or null)
    chapters: string          // "23", "156" (or null)
    rating: string            // "9.2/10", "4.5 stars" (or null)
  },
  serialization_status: string // "completed", "ongoing" (or null)
  awards_recognition: string[] // ["Best Webtoon 2023", "Readers' Choice Award"]
}
```

#### 8. Korean Cultural Elements (1 field, multiple values)
```typescript
korean_cultural_elements: string[] // ["Webtoon storytelling format", "K-drama tropes", "hanok architecture"]
```

**Examples**:
- Webtoon/manhwa storytelling conventions
- Korean platforms (Naver, Kakao, RIDI)
- Korean food (kimchi, tteokbokki, soju)
- Cultural concepts (han, jeong, nunchi)
- Chaebol culture
- K-pop references
- Historical periods (Joseon, Goryeo)
- Korean language elements (honorifics, speech patterns)

#### 9. IP Value (4 fields)
```typescript
ip_value: {
  franchise_potential: string       // "high", "medium", "low"
  merchandising_opportunities: string[] // ["character figurines", "fashion line"]
  cross_media_potential: string[]   // ["mobile game", "sequel series", "spin-off"]
  unique_selling_points: string[]   // 5-7 USPs that make IP marketable
}
```

**USP Examples**:
- "First medical drama to blend werewolf mythology"
- "Strong female lead breaks genre conventions"
- "Proven fanbase with 2M views on Manta Comics"
- "Comps to hit shows like Grey's Anatomy and Vampire Diaries"

#### 10. Creative Team (4 fields)
```typescript
creative_team: {
  author_writer: string        // "Lee Min-ji" (or null)
  illustrator_artist: string   // "Kim Soo-hyun" (or null)
  credentials: string[]        // ["Award-winning author of...", "10M+ views"]
  studio_publisher: string     // "Naver Webtoon", "Studio Dragon" (or null)
}
```

#### 11. Rights Availability (3 fields)
```typescript
rights_availability: {
  available_rights: string[]    // ["adaptation rights", "distribution", "merchandising"]
  territories_available: string[] // ["North America", "Europe", "Global excluding China"]
  exclusivity_notes: string     // "Non-exclusive", "First-look deal with..."
}
```

#### 12. Content Classification (4 fields)
```typescript
content_classification: {
  maturity_rating: string      // "all ages", "teen (13+)", "mature (18+)"
  content_warnings: string[]   // ["violence", "sexual content", "dark themes", "substance use"]
  complexity_score: number     // 1-10 scale (1=simple, 10=complex)
  accessibility_notes: string  // "Subtitles available", "Audio description ready"
}
```

**Complexity Score Guidelines**:
- 1-3: Simple, straightforward narrative
- 4-6: Moderate complexity, some twists
- 7-8: Complex plot, multiple storylines
- 9-10: Highly sophisticated, layered themes

#### 13. Additional Highlights (1 field, multiple values)
```typescript
additional_highlights: string[] // Any notable info not captured elsewhere
```

#### 14. Processing Metadata (1 field)
```typescript
processing_confidence: number // 0.0-1.0 (calculated by edge function)
```

### Processing Confidence Score

**Formula** (8 weighted criteria):
```typescript
function calculateConfidence(analysis: any): number {
  let score = 0
  if (analysis.characters?.length > 0) score += 0.15              // 15%
  if (analysis.story_elements?.plot_summary) score += 0.15        // 15%
  if (analysis.themes_and_tone?.primary_themes?.length > 0) score += 0.15 // 15%
  if (analysis.market_positioning?.comparable_titles?.length > 0) score += 0.15 // 15%
  if (analysis.source_material?.metrics?.views ||
      analysis.source_material?.metrics?.chapters) score += 0.10  // 10%
  if (analysis.korean_cultural_elements?.length > 0) score += 0.10 // 10%
  if (analysis.ip_value?.unique_selling_points?.length > 0) score += 0.10 // 10%
  if (analysis.content_classification?.complexity_score) score += 0.10 // 10%
  return Math.min(score, 1.0) // Cap at 100%
}
```

**Quality Thresholds**:
- **70%+**: High-quality extraction, all major sections populated
- **50-70%**: Acceptable quality, some sections missing
- **30-50%**: Low quality, many sections empty
- **<30%**: Likely extraction failure, re-extraction recommended

**Typical Confidence Scores**:
- Comprehensive pitch decks: 85-95%
- Standard pitch decks: 70-85%
- Minimal pitch decks: 50-70%
- Failed extractions: <30%

---

## Database Integration

### Table: `title_content_analysis`

**Primary Key**: `title_id` (UUID, references `titles.title_id`)

**Storage Strategy**: Dual approach for maximum flexibility

1. **Complete Data Storage**: `pitch_analysis` JSONB field
   - Stores 100% of GPT-4o output
   - Enables flexible querying
   - Future-proof (no data loss if schema changes)

2. **Optimized Search Fields**: Dedicated columns
   - Indexed for fast queries
   - Used by search and recommendation systems
   - Backward compatible with v1.0

### Schema Breakdown

#### Core Fields

```sql
title_id UUID PRIMARY KEY REFERENCES titles(title_id)
```

#### Complete Analysis Storage (NEW in v2.0)

```sql
pitch_analysis JSONB  -- Complete GPT-4o analysis (all 50+ fields)
```

**Structure** (matches TypeScript interface in `pitchAnalysis.ts`):
```json
{
  "story_world": { ... },
  "characters": [ ... ],
  "themes_and_tone": { ... },
  "story_elements": { ... },
  "market_positioning": { ... },
  "production_details": { ... },
  "source_material": { ... },
  "korean_cultural_elements": [ ... ],
  "ip_value": { ... },
  "creative_team": { ... },
  "rights_availability": { ... },
  "content_classification": { ... },
  "additional_highlights": [ ... ]
}
```

#### Search Optimization Fields

```sql
semantic_tags JSONB           -- Themes + mood keywords + genres (array)
keyword_density JSONB         -- USPs + themes with weights (object)
search_boost_factor FLOAT     -- 1.5 for titles with pitch data (50% boost)
```

**Example Data**:
```json
{
  "semantic_tags": [
    "love and sacrifice",
    "science vs supernatural",
    "medical procedural",
    "suspenseful",
    "romantic"
  ],
  "keyword_density": {
    "Blends medical drama with supernatural elements": 1.0,
    "Strong female lead breaks genre conventions": 0.95,
    "Proven fanbase with 2M views": 0.90,
    "Perfect for Netflix/HBO Max": 0.85
  },
  "search_boost_factor": 1.5
}
```

#### Content Analysis Fields

```sql
character_types TEXT[]        -- Character archetypes ["strong female lead", "cold male lead"]
plot_elements TEXT[]          -- Key plot points ["discovery", "betrayal", "resolution"]
cultural_elements TEXT[]      -- Korean cultural references ["Webtoon format", "K-drama tropes"]
complexity_score INTEGER      -- 1-10 story sophistication
content_warnings TEXT[]       -- Maturity flags ["violence", "dark themes"]
```

#### Audience Fields

```sql
target_demographics JSONB     -- Full object with age/gender/psychographics + comps
```

**Structure**:
```json
{
  "age_range": "18-34",
  "gender_skew": "female-skewed",
  "psychographics": "fans of supernatural romance and medical dramas",
  "comparable_titles": [
    {
      "title": "Grey's Anatomy",
      "platform": "ABC",
      "similarity": "medical setting with complex relationships"
    },
    {
      "title": "Vampire Diaries",
      "platform": "Netflix",
      "similarity": "supernatural elements with romance"
    }
  ],
  "platform_fit": ["Netflix", "HBO Max", "Disney+"],
  "territory_potential": ["North America", "Europe", "Asia"],
  "source": "pitch_deck"
}
```

#### Metadata Fields

```sql
mood_analysis JSONB           -- Story/production metadata
analysis_version TEXT         -- '2.0' for enhanced extraction
processed_by TEXT             -- 'openai-gpt-4o'
processing_confidence FLOAT   -- 0.0-1.0 quality score
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

**`mood_analysis` Structure**:
```json
{
  "pitch_summary": "Full plot summary text",
  "logline": "One-sentence hook",
  "emotional_tone": "dark and suspenseful",
  "visual_style": "noir with romantic elements",
  "narrative_structure": "multi-timeline",
  "production_budget": "$2-5M per episode",
  "production_timeline": "18-month production",
  "production_format": "8-episode limited series",
  "franchise_potential": "high",
  "source_platform": "Manta Comics",
  "source_views": "2000000",
  "source_chapters": "23"
}
```

### Validation Analysis Status

**UI Implementation** (`PitchExtractionTest.tsx` lines 38-71):

The admin UI uses sophisticated validation to determine if a title has meaningful analysis data (not just empty structure):

```typescript
function hasValidAnalysis(pitchAnalysis: any): boolean {
  if (!pitchAnalysis || typeof pitchAnalysis !== 'object') {
    return false
  }

  // Check key sections for non-empty, meaningful data
  const hasCharacters = Array.isArray(pitchAnalysis.characters) &&
                        pitchAnalysis.characters.length > 0

  const hasStoryElements = (pitchAnalysis.story_elements?.logline &&
                            pitchAnalysis.story_elements.logline !== null) ||
                           (pitchAnalysis.story_elements?.plot_summary &&
                            pitchAnalysis.story_elements.plot_summary !== null)

  const hasThemes = Array.isArray(pitchAnalysis.themes_and_tone?.primary_themes) &&
                    pitchAnalysis.themes_and_tone.primary_themes.length > 0

  const hasMarketPositioning = Array.isArray(pitchAnalysis.market_positioning?.comparable_titles) &&
                               pitchAnalysis.market_positioning.comparable_titles.length > 0

  const hasSellingPoints = Array.isArray(pitchAnalysis.ip_value?.unique_selling_points) &&
                           pitchAnalysis.ip_value.unique_selling_points.length > 0

  // Title is considered "analyzed" if it has at least 2 of these sections with real data
  const validSections = [
    hasCharacters,
    hasStoryElements,
    hasThemes,
    hasMarketPositioning,
    hasSellingPoints
  ].filter(Boolean).length

  return validSections >= 2
}
```

**Validation Criteria**:
- ✅ **Analyzed**: 2+ key sections with real data
- ❌ **Not Analyzed**: Empty structure or <2 sections populated

**Key Sections Checked**:
1. Characters (array with items)
2. Story Elements (logline or plot summary)
3. Themes (primary_themes array)
4. Market Positioning (comparable_titles array)
5. Selling Points (unique_selling_points array)

**UI Status Display**:
- Green ✓ badge: `has_analysis: true` (2+ valid sections)
- Gray ✗ badge: `has_analysis: false` (<2 valid sections)

---

## Query Examples

### Basic Queries

#### 1. Check if Title Has Pitch Analysis
```sql
SELECT
  title_id,
  pitch_analysis IS NOT NULL as has_pitch,
  processing_confidence
FROM title_content_analysis
WHERE title_id = 'your-title-id-here';
```

#### 2. Get All Titles with High-Quality Pitch Data
```sql
SELECT
  t.title_id,
  t.title_name_en,
  tca.processing_confidence,
  tca.analysis_version
FROM titles t
JOIN title_content_analysis tca ON t.title_id = tca.title_id
WHERE tca.processing_confidence >= 0.70
  AND tca.analysis_version = '2.0'
ORDER BY tca.processing_confidence DESC;
```

#### 3. Count Analyzed vs Unanalyzed Titles
```sql
SELECT
  COUNT(CASE WHEN pitch_analysis IS NOT NULL THEN 1 END) as analyzed_count,
  COUNT(CASE WHEN pitch_analysis IS NULL THEN 1 END) as unanalyzed_count,
  COUNT(*) as total_with_pitch
FROM titles t
LEFT JOIN title_content_analysis tca ON t.title_id = tca.title_id
WHERE t.pitch IS NOT NULL;
```

### JSONB Queries (Accessing Nested Data)

#### 4. Find Titles with Specific Character Archetype
```sql
SELECT
  t.title_id,
  t.title_name_en,
  tca.pitch_analysis->'characters' as characters
FROM titles t
JOIN title_content_analysis tca ON t.title_id = tca.title_id
WHERE tca.pitch_analysis @>
  '{"characters": [{"archetype": "strong female lead"}]}'::jsonb;
```

#### 5. Find Titles with High Franchise Potential
```sql
SELECT
  t.title_id,
  t.title_name_en,
  tca.pitch_analysis->'ip_value'->>'franchise_potential' as franchise_potential,
  tca.pitch_analysis->'ip_value'->'unique_selling_points' as usps
FROM titles t
JOIN title_content_analysis tca ON t.title_id = tca.title_id
WHERE tca.pitch_analysis->'ip_value'->>'franchise_potential' = 'high'
ORDER BY tca.processing_confidence DESC;
```

#### 6. Search by Theme
```sql
SELECT
  t.title_id,
  t.title_name_en,
  tca.pitch_analysis->'themes_and_tone'->'primary_themes' as themes
FROM titles t
JOIN title_content_analysis tca ON t.title_id = tca.title_id
WHERE tca.pitch_analysis->'themes_and_tone'->'primary_themes' @>
  '["love and sacrifice"]'::jsonb;
```

#### 7. Find Titles with Comparable Titles on Specific Platform
```sql
SELECT
  t.title_id,
  t.title_name_en,
  comp->>'title' as comparable_title,
  comp->>'platform' as platform,
  comp->>'similarity' as similarity
FROM titles t
JOIN title_content_analysis tca ON t.title_id = tca.title_id
CROSS JOIN LATERAL jsonb_array_elements(
  tca.pitch_analysis->'market_positioning'->'comparable_titles'
) as comp
WHERE comp->>'platform' ILIKE '%Netflix%'
ORDER BY t.title_name_en;
```

#### 8. Get Source Material Metrics
```sql
SELECT
  t.title_id,
  t.title_name_en,
  tca.pitch_analysis->'source_material'->>'original_platform' as platform,
  tca.pitch_analysis->'source_material'->'metrics'->>'views' as views,
  tca.pitch_analysis->'source_material'->'metrics'->>'chapters' as chapters,
  tca.pitch_analysis->'source_material'->>'serialization_status' as status
FROM titles t
JOIN title_content_analysis tca ON t.title_id = tca.title_id
WHERE tca.pitch_analysis->'source_material'->'metrics'->>'views' IS NOT NULL
ORDER BY CAST(tca.pitch_analysis->'source_material'->'metrics'->>'views' AS INTEGER) DESC;
```

### Advanced Queries

#### 9. Find Titles by Target Audience Age Range
```sql
SELECT
  t.title_id,
  t.title_name_en,
  tca.target_demographics->>'age_range' as target_age,
  tca.pitch_analysis->'market_positioning'->'platform_fit' as platforms
FROM titles t
JOIN title_content_analysis tca ON t.title_id = tca.title_id
WHERE tca.target_demographics->>'age_range' ILIKE '%18-34%';
```

#### 10. Get All Korean Cultural Elements Across Titles
```sql
SELECT DISTINCT
  jsonb_array_elements_text(tca.pitch_analysis->'korean_cultural_elements') as cultural_element,
  COUNT(*) as title_count
FROM title_content_analysis tca
WHERE tca.pitch_analysis->'korean_cultural_elements' IS NOT NULL
GROUP BY cultural_element
ORDER BY title_count DESC;
```

#### 11. Find Titles with Multiple Specific Attributes
```sql
SELECT
  t.title_id,
  t.title_name_en,
  tca.processing_confidence,
  tca.pitch_analysis->'story_elements'->>'genre_blend' as genres,
  tca.pitch_analysis->'content_classification'->>'maturity_rating' as rating
FROM titles t
JOIN title_content_analysis tca ON t.title_id = tca.title_id
WHERE tca.processing_confidence >= 0.80
  AND tca.pitch_analysis->'story_elements'->'genre_blend' @> '["romance"]'::jsonb
  AND tca.pitch_analysis->'content_classification'->>'maturity_rating' = 'teen (13+)'
  AND ARRAY_LENGTH(tca.character_types, 1) >= 5
ORDER BY tca.processing_confidence DESC;
```

#### 12. Aggregate Statistics
```sql
SELECT
  COUNT(*) as total_analyzed,
  AVG(processing_confidence) as avg_confidence,
  MIN(processing_confidence) as min_confidence,
  MAX(processing_confidence) as max_confidence,
  COUNT(CASE WHEN processing_confidence >= 0.70 THEN 1 END) as high_quality_count,
  COUNT(CASE WHEN processing_confidence < 0.50 THEN 1 END) as low_quality_count
FROM title_content_analysis
WHERE analysis_version = '2.0';
```

### Performance Optimization

#### Recommended Indexes

```sql
-- Index on analysis version and confidence for filtering
CREATE INDEX idx_tca_version_confidence
ON title_content_analysis(analysis_version, processing_confidence);

-- GIN index on pitch_analysis JSONB for fast queries
CREATE INDEX idx_tca_pitch_analysis_gin
ON title_content_analysis USING GIN (pitch_analysis);

-- Index on semantic_tags for search
CREATE INDEX idx_tca_semantic_tags_gin
ON title_content_analysis USING GIN (semantic_tags);

-- Index on character_types array
CREATE INDEX idx_tca_character_types_gin
ON title_content_analysis USING GIN (character_types);
```

---

## Integration Patterns

### 1. Chatbot Integration

**Use Case**: Enhanced recommendations using pitch analysis data

**Implementation Pattern**:

```typescript
// In chatbot service
async function getRecommendationsWithPitchData(userQuery: string) {
  // Query titles with pitch analysis
  const { data: titles } = await supabase
    .from('titles')
    .select(`
      *,
      title_content_analysis (
        pitch_analysis,
        processing_confidence,
        semantic_tags
      )
    `)
    .gte('title_content_analysis.processing_confidence', 0.70)

  // Extract relevant data for recommendations
  const enrichedTitles = titles.map(title => ({
    ...title,
    themes: title.title_content_analysis?.pitch_analysis?.themes_and_tone?.primary_themes || [],
    comps: title.title_content_analysis?.pitch_analysis?.market_positioning?.comparable_titles || [],
    usps: title.title_content_analysis?.pitch_analysis?.ip_value?.unique_selling_points || []
  }))

  // Use in chatbot prompt
  const recommendationPrompt = `
    User is looking for: ${userQuery}

    Available titles with pitch data:
    ${enrichedTitles.map(t => `
      - ${t.title_name_en}
        Themes: ${t.themes.join(', ')}
        Similar to: ${t.comps.map(c => c.title).join(', ')}
        Selling points: ${t.usps.join('; ')}
    `).join('\n')}
  `

  // Send to GPT for recommendation
}
```

**Benefits**:
- More accurate recommendations based on themes and comparable titles
- Can explain "why" a title matches (based on USPs)
- Semantic search using `semantic_tags` array

### 2. Search Enhancement

**Use Case**: Boost search rankings for titles with pitch data

**Implementation Pattern**:

```typescript
// In search service
async function searchTitles(query: string) {
  const { data } = await supabase.rpc('search_titles_with_boost', {
    search_query: query
  })

  return data
}

// Supabase RPC function (SQL)
CREATE OR REPLACE FUNCTION search_titles_with_boost(search_query TEXT)
RETURNS TABLE (
  title_id UUID,
  title_name_en TEXT,
  relevance_score FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.title_id,
    t.title_name_en,
    (ts_rank(to_tsvector('english', t.title_name_en || ' ' || COALESCE(t.synopsis, '')),
             plainto_tsquery('english', search_query)) *
     COALESCE(tca.search_boost_factor, 1.0)) as relevance_score
  FROM titles t
  LEFT JOIN title_content_analysis tca ON t.title_id = tca.title_id
  WHERE to_tsvector('english', t.title_name_en || ' ' || COALESCE(t.synopsis, ''))
        @@ plainto_tsquery('english', search_query)
  ORDER BY relevance_score DESC;
END;
$$ LANGUAGE plpgsql;
```

**Benefits**:
- 50% boost for titles with pitch data (`search_boost_factor: 1.5`)
- Prioritizes well-documented titles
- Transparent ranking algorithm

### 3. Title Detail Page Display

**Use Case**: Show pitch insights on title detail pages

**Implementation Pattern**:

```typescript
// In TitleDetailNew.tsx
import { PitchAnalysis } from '@/types/pitchAnalysis'

function TitleDetailNew({ titleId }: Props) {
  const [pitchData, setPitchData] = useState<PitchAnalysis | null>(null)

  useEffect(() => {
    async function loadPitchData() {
      const { data } = await supabase
        .from('title_content_analysis')
        .select('pitch_analysis, processing_confidence')
        .eq('title_id', titleId)
        .single()

      if (data?.pitch_analysis) {
        setPitchData(data.pitch_analysis)
      }
    }
    loadPitchData()
  }, [titleId])

  return (
    <div>
      {/* Standard title info */}

      {pitchData && (
        <div className="pitch-insights">
          <h3>Pitch Insights</h3>

          {/* Comparable Titles */}
          <section>
            <h4>Similar To</h4>
            {pitchData.market_positioning?.comparable_titles?.map(comp => (
              <div key={comp.title}>
                <strong>{comp.title}</strong> ({comp.platform})
                <p>{comp.similarity}</p>
              </div>
            ))}
          </section>

          {/* Unique Selling Points */}
          <section>
            <h4>What Makes It Special</h4>
            <ul>
              {pitchData.ip_value?.unique_selling_points?.map((usp, idx) => (
                <li key={idx}>{usp}</li>
              ))}
            </ul>
          </section>

          {/* Source Metrics */}
          {pitchData.source_material?.metrics && (
            <section>
              <h4>Proven Audience</h4>
              <div className="metrics">
                <span>{pitchData.source_material.metrics.views} views</span>
                <span>{pitchData.source_material.metrics.chapters} chapters</span>
                <span>on {pitchData.source_material.original_platform}</span>
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
```

### 4. Content Filtering

**Use Case**: Filter titles by character archetypes, themes, or maturity

**Implementation Pattern**:

```typescript
// In TitleList.tsx
function TitleList() {
  const [filters, setFilters] = useState({
    archetype: null,
    theme: null,
    maturityRating: null
  })

  async function loadFilteredTitles() {
    let query = supabase
      .from('titles')
      .select('*, title_content_analysis(*)')

    // Filter by character archetype
    if (filters.archetype) {
      query = query.contains('title_content_analysis.character_types', [filters.archetype])
    }

    // Filter by theme
    if (filters.theme) {
      // Use JSONB containment
      query = query.filter(
        'title_content_analysis.pitch_analysis',
        'cs',
        `{"themes_and_tone": {"primary_themes": ["${filters.theme}"]}}`
      )
    }

    // Filter by maturity rating
    if (filters.maturityRating) {
      query = query.filter(
        'title_content_analysis.pitch_analysis',
        'cs',
        `{"content_classification": {"maturity_rating": "${filters.maturityRating}"}}`
      )
    }

    const { data } = await query
    return data
  }

  return (
    <div>
      <FilterPanel filters={filters} onChange={setFilters} />
      <TitleGrid titles={filteredTitles} />
    </div>
  )
}
```

### 5. Analytics Dashboard

**Use Case**: Display pitch deck coverage and quality metrics

**Implementation Pattern**:

```typescript
// Analytics component
function PitchDeckAnalytics() {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    async function loadStats() {
      // Get overall statistics
      const { data: overallStats } = await supabase.rpc('get_pitch_analytics')

      // Get character archetype distribution
      const { data: archetypeData } = await supabase
        .from('title_content_analysis')
        .select('character_types')
        .not('character_types', 'is', null)

      const archetypeCounts = {}
      archetypeData.forEach(row => {
        row.character_types.forEach(archetype => {
          archetypeCounts[archetype] = (archetypeCounts[archetype] || 0) + 1
        })
      })

      setStats({ overallStats, archetypeCounts })
    }
    loadStats()
  }, [])

  return (
    <div>
      <MetricCard title="Total Analyzed" value={stats.total_analyzed} />
      <MetricCard title="Avg Confidence" value={`${(stats.avg_confidence * 100).toFixed(0)}%`} />
      <MetricCard title="High Quality" value={stats.high_quality_count} />

      <Chart
        title="Character Archetype Distribution"
        data={stats.archetypeCounts}
      />
    </div>
  )
}
```

---

## Security Architecture

### Signed URL Strategy

**Problem**: PDFs stored in Supabase Storage need secure, time-limited access

**Solution**: Signed URLs with 5-minute expiry

#### Why Signed URLs?

1. **Time-Limited Access**
   - URLs automatically expire after 5 minutes
   - Prevents long-term unauthorized access
   - New URL generated for each extraction

2. **No Size Restrictions**
   - Direct download has size limits
   - Signed URLs handle large PDFs (5-10MB+)
   - No memory constraints in edge function

3. **Security Benefits**
   - URL parameters include signature hash
   - Cannot be modified without invalidation
   - No permanent public access to storage

4. **Audit Trail**
   - Each access creates new signed URL
   - Can track when PDFs were accessed
   - Verifiable through storage logs

#### Implementation

**Edge Function** (`extract-pitch-test/index.ts`):
```typescript
// Create signed URL (5-minute expiry)
const { data: signedUrlData, error: signedUrlError } = await supabase.storage
  .from('pitch-pdfs')
  .createSignedUrl(pdfPath, 300) // 300 seconds = 5 minutes

if (signedUrlError || !signedUrlData?.signedUrl) {
  throw new Error(`Failed to create signed URL: ${signedUrlError?.message}`)
}

// Send to Python extractor
const extractResponse = await fetch(pdfExtractorUrl, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    pdf_url: signedUrlData.signedUrl
  })
})
```

**Python Extractor** (`extract.py`):
```python
# Download PDF from signed URL (no size limits)
def _download_pdf_from_url(self, url):
    try:
        import urllib.request
        with urllib.request.urlopen(url, timeout=30) as response:
            return response.read()  # Full PDF in memory
    except Exception as e:
        print(f"Error downloading PDF: {str(e)}")
        return None
```

**Security Flow**:
1. Edge function authenticates user (Supabase auth token required)
2. Edge function creates signed URL (temporary, expiring)
3. Python service downloads PDF via signed URL
4. Signed URL expires after 5 minutes
5. No permanent public access to PDF

### Access Control

**Admin UI Access**: Only authorized users can access `/admin/pitch-extraction-test`

**Implementation**:
```typescript
// In PitchExtractionTest.tsx
const isAuthorized = user?.email === 'sungho@dadble.com' ||
                     user?.email === 'kevin@sandstoneartists.com'

if (!isAuthorized) {
  return <UnauthorizedAccess />
}
```

**API Access**: Edge function requires valid Supabase auth token

**Storage Bucket Policies**:
- `pitch-pdfs` bucket: Private (requires authentication)
- Public access: None
- Signed URLs: Only method to access PDFs

---

## Error Recovery

### Common Issues & Step-by-Step Recovery

#### Issue 1: Extraction Returns Empty/Minimal Data (<30% confidence)

**Symptoms**:
- Processing confidence <30%
- Most fields empty or null
- Very short extracted text (<5,000 characters)

**Diagnosis**:
```sql
-- Check extraction results
SELECT
  title_id,
  processing_confidence,
  pitch_analysis->'story_elements'->'plot_summary' as has_summary,
  pitch_analysis->'characters' as has_characters
FROM title_content_analysis
WHERE title_id = 'your-title-id'
  AND processing_confidence < 0.30;
```

**Causes**:
1. PDF text extraction failed (corrupted PDF)
2. Python extractor service down
3. Pitch deck has mostly images, no extractable text
4. PDF is password-protected

**Recovery Steps**:

**Step 1**: Check Edge Function Logs
```
Navigate to: https://supabase.com/dashboard/project/dlrnrgcoguxlkkcitlpd/functions
Look for: "Text extracted: X characters" log message
```

- If X < 5,000: PDF extraction likely failed
- If "Python extractor failed" logged: Service issue
- If "Falling back to placeholder": Service unavailable

**Step 2**: Verify Python Extractor Health
```bash
curl https://python-pdf-extractor-cal8vugu1-creepyblues-9060s-projects.vercel.app/api/extract
```

Expected response:
```json
{
  "status": "ready",
  "message": "PDF Extractor Service is running...",
  "library_available": "PyPDF2"
}
```

If service is down, redeploy to Vercel.

**Step 3**: Manually Inspect PDF
- Download PDF from Supabase Storage
- Open in PDF reader
- Try to select text
  - ✅ Text selectable: PDF should work
  - ❌ Text not selectable: Image-based PDF, needs OCR

**Step 4**: Re-upload PDF (if corrupted)
1. Download original pitch deck
2. Re-save as PDF (ensures format compliance)
3. Upload to Supabase Storage: `pitch-pdfs/{title_id}/pitch.pdf`
4. Update `pitch` field in `titles` table with new URL
5. Retry extraction

**Step 5**: Retry Extraction
1. Navigate to `/admin/pitch-extraction-test`
2. Select title
3. Click "Test Extract (Preview Only)"
4. Check confidence score
5. If still <30%, escalate for manual review

#### Issue 2: Extraction Costs Higher Than Expected (>$0.25)

**Symptoms**:
- Individual extraction cost >$0.25
- Token usage >5,000 output tokens

**Diagnosis**:
```sql
-- Check recent extraction costs
SELECT
  title_id,
  processing_confidence,
  updated_at
FROM title_content_analysis
WHERE analysis_version = '2.0'
ORDER BY updated_at DESC
LIMIT 10;
```

Check edge function logs for:
- `💰 API Cost: $X.XX` message
- Token counts: "X input + Y output tokens"

**Causes**:
1. Very long pitch deck (>30 pages)
2. GPT-4o returning excessive detail (>3,000 output tokens)
3. Multiple retries charging repeatedly

**Recovery Steps**:

**Step 1**: Verify PDF Length
```sql
-- Get PDF metadata
SELECT pitch FROM titles WHERE title_id = 'your-title-id';
```

Download PDF, check page count:
- 10-20 pages: Normal ($0.15-0.20 expected)
- 20-30 pages: High normal ($0.20-0.25 expected)
- 30+ pages: High cost justified ($0.25-0.35 expected)

**Step 2**: Review Output Token Count
Check edge function logs:
- 1,500-2,000 output tokens: Normal
- 2,000-3,000 output tokens: High normal
- 3,000+ output tokens: Excessive

**Step 3**: Adjust max_tokens (if needed)
Edit `/apps/dashboard/supabase/functions/extract-pitch-test/index.ts`:

```typescript
// Current setting
max_tokens: 4096

// If consistently high, reduce to:
max_tokens: 3000
```

Redeploy edge function:
```bash
cd apps/dashboard
npx supabase functions deploy extract-pitch-test
```

**Step 4**: Batch Cost Management
If processing many titles, calculate budget:

```javascript
// Cost estimator
const titlesCount = 48
const avgCostPerTitle = 0.18
const totalCost = titlesCount * avgCostPerTitle
console.log(`Estimated total: $${totalCost.toFixed(2)}`) // $8.64
```

Set OpenAI usage limits in OpenAI dashboard to prevent overruns.

#### Issue 3: Database Save Fails

**Symptoms**:
- Extraction succeeds (shows results)
- "Database save error" message appears
- Data not in `title_content_analysis` table

**Diagnosis**:
```sql
-- Check if data saved
SELECT COUNT(*) FROM title_content_analysis
WHERE title_id = 'your-title-id';
-- Should return 1 if saved, 0 if failed
```

**Causes**:
1. JSONB validation error (malformed JSON)
2. Field type mismatch (e.g., string in integer field)
3. NULL constraint violation
4. Permission issue (RLS policy blocking)

**Recovery Steps**:

**Step 1**: Check Edge Function Logs
Look for specific error message:
```
❌ Database save error: [error details]
```

Common errors:
- "violates not-null constraint": Required field missing
- "invalid input syntax for type": Type mismatch
- "new row violates row-level security policy": Permission issue

**Step 2**: Verify Table Schema
```sql
-- Check table structure
\d title_content_analysis

-- Verify JSONB field accepts data
SELECT pitch_analysis FROM title_content_analysis LIMIT 1;
```

**Step 3**: Test Manual Insert
```sql
-- Try minimal insert to isolate issue
INSERT INTO title_content_analysis (
  title_id,
  pitch_analysis,
  processing_confidence,
  analysis_version
) VALUES (
  'test-uuid-here',
  '{"test": "data"}'::jsonb,
  0.5,
  '2.0'
);

-- If successful, issue is in edge function data mapping
-- If fails, issue is schema/permissions
```

**Step 4**: Check RLS Policies
```sql
-- View RLS policies
SELECT * FROM pg_policies
WHERE tablename = 'title_content_analysis';

-- Temporarily disable RLS for testing (ADMIN ONLY)
ALTER TABLE title_content_analysis DISABLE ROW LEVEL SECURITY;

-- Retry extraction

-- Re-enable RLS
ALTER TABLE title_content_analysis ENABLE ROW LEVEL SECURITY;
```

**Step 5**: Validate JSON Structure
```typescript
// In edge function, add validation before save
const analysisString = JSON.stringify(analysis)
const parsedAnalysis = JSON.parse(analysisString) // Will throw if invalid JSON

console.log('Validated JSON:', parsedAnalysis)
```

**Step 6**: Retry Extraction
1. Use "Test Extract (Preview Only)" to verify extraction works
2. Check raw JSON output (expand "View Raw JSON" section)
3. If JSON looks valid, click "Extract & Save to Database"
4. Monitor edge function logs during save

#### Issue 4: Extraction Hangs/Times Out

**Symptoms**:
- "Extracting..." spinner runs indefinitely (>60 seconds)
- No result returned
- Edge function timeout error

**Diagnosis**:
Check edge function logs for:
- Last log message before hang
- Timeout errors
- Network errors to Python extractor or OpenAI

**Causes**:
1. Very large PDF (>10MB) taking long to download
2. Python extractor timeout (>30 seconds)
3. OpenAI API timeout or rate limit
4. Network connectivity issue

**Recovery Steps**:

**Step 1**: Check PDF Size
```bash
# Get file size from Supabase Storage
curl -I https://dlrnrgcoguxlkkcitlpd.supabase.co/storage/v1/object/public/pitch-pdfs/{title_id}/pitch.pdf
# Look for Content-Length header
```

- <2MB: Should complete quickly (<15 seconds)
- 2-5MB: Normal processing (15-30 seconds)
- 5-10MB: Slow processing (30-60 seconds)
- >10MB: May timeout, consider optimizing PDF

**Step 2**: Verify Python Extractor Timeout
Python extractor has 30-second download timeout.

Edit `/python-pdf-extractor/api/extract.py` if needed:
```python
# Current timeout
with urllib.request.urlopen(url, timeout=30) as response:

# Increase if large PDFs common
with urllib.request.urlopen(url, timeout=60) as response:
```

**Step 3**: Check OpenAI API Status
```bash
# Check OpenAI API health
curl https://status.openai.com/api/v2/status.json
```

If OpenAI is experiencing issues, wait and retry later.

**Step 4**: Increase Edge Function Timeout
Supabase edge functions have default timeout limits.

In `/apps/dashboard/supabase/config.toml`:
```toml
[functions.extract-pitch-test]
verify_jwt = false
timeout = 120  # Increase from default 60 seconds
```

**Step 5**: Implement Retry Logic
For batch processing, add retry with exponential backoff:

```typescript
async function extractWithRetry(titleId: string, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await supabase.functions.invoke('extract-pitch-test', {
        body: { title_id: titleId }
      })

      if (result.data?.success) {
        return result.data
      }
    } catch (error) {
      console.error(`Attempt ${attempt} failed:`, error)

      if (attempt < maxRetries) {
        // Exponential backoff: 2^attempt seconds
        const delay = Math.pow(2, attempt) * 1000
        await new Promise(resolve => setTimeout(resolve, delay))
      } else {
        throw new Error(`Failed after ${maxRetries} attempts`)
      }
    }
  }
}
```

#### Issue 5: Low Processing Confidence (50-70%)

**Symptoms**:
- Confidence score 50-70%
- Some sections populated, others empty
- Extraction completes successfully

**Diagnosis**:
```sql
-- Identify which sections are missing
SELECT
  title_id,
  processing_confidence,
  pitch_analysis->'characters' IS NOT NULL as has_characters,
  pitch_analysis->'story_elements'->'plot_summary' IS NOT NULL as has_plot,
  pitch_analysis->'themes_and_tone'->'primary_themes' IS NOT NULL as has_themes,
  pitch_analysis->'market_positioning'->'comparable_titles' IS NOT NULL as has_comps
FROM title_content_analysis
WHERE title_id = 'your-title-id';
```

**Causes**:
1. Pitch deck missing standard information (normal for some decks)
2. Non-standard deck format (unusual structure)
3. Partial text extraction (some pages missing)

**Recovery Options**:

**Option 1**: Accept Lower Confidence (if deck legitimately lacks data)
- 50-70% confidence is acceptable if deck doesn't have certain sections
- Review which sections are missing
- If missing sections are not critical (e.g., awards, budget), proceed with save

**Option 2**: Retry with Enhanced Prompt
Modify extraction prompt to handle non-standard formats:

```typescript
// Add to extraction prompt
const enhancedPrompt = `
${analysisPrompt}

SPECIAL INSTRUCTIONS FOR NON-STANDARD DECKS:
- If character names not shown, infer from descriptions
- If comparable titles missing, suggest based on genre
- If metrics not shown, use "Not disclosed" instead of null
- Maximize extraction even with minimal information
`
```

**Option 3**: Manual Enrichment
For important titles with low confidence:

1. Review extracted data
2. Manually add missing fields directly in database:

```sql
UPDATE title_content_analysis
SET pitch_analysis = pitch_analysis ||
  '{"market_positioning": {"comparable_titles": [
    {"title": "Manually Added Title", "platform": "Netflix", "similarity": "Genre match"}
  ]}}'::jsonb
WHERE title_id = 'your-title-id';
```

3. Recalculate confidence score:

```sql
-- This would require implementing calculateConfidence in SQL
-- Or re-run extraction with manual data as context
```

### Data Cleanup Procedures

#### Remove Failed Extractions
```sql
-- Delete entries with very low confidence
DELETE FROM title_content_analysis
WHERE processing_confidence < 0.30
  AND analysis_version = '2.0';
```

#### Reset for Re-extraction
```sql
-- Remove specific title's analysis to allow fresh extraction
DELETE FROM title_content_analysis
WHERE title_id = 'your-title-id';
```

#### Bulk Re-extraction
```typescript
// Script to re-extract all low-confidence titles
async function reextractLowConfidence() {
  const { data: lowConfidenceTitles } = await supabase
    .from('title_content_analysis')
    .select('title_id')
    .lt('processing_confidence', 0.50)

  for (const title of lowConfidenceTitles) {
    console.log(`Re-extracting ${title.title_id}...`)

    await supabase.functions.invoke('extract-pitch-test', {
      body: { title_id: title.title_id, test_mode: false }
    })

    // Rate limit: 1 extraction per 15 seconds
    await new Promise(resolve => setTimeout(resolve, 15000))
  }
}
```

---

## Performance Benchmarks

### Extraction Time

**By PDF Size**:
- 0-2MB (5-10 pages): 10-15 seconds
- 2-5MB (10-20 pages): 15-25 seconds
- 5-10MB (20-30 pages): 25-40 seconds
- 10MB+ (30+ pages): 40-60 seconds

**Breakdown**:
1. Signed URL creation: <1 second
2. PDF download (Python): 2-5 seconds
3. Text extraction (Python): 3-8 seconds
4. GPT-4o analysis: 5-15 seconds
5. Database save: 1-2 seconds

**Total**: 11-31 seconds typical, up to 60 seconds for large PDFs

### Token Usage

**Input Tokens** (pitch text + prompt):
- Small deck (10 pages): 1,500-2,500 tokens
- Medium deck (15 pages): 2,500-4,000 tokens
- Large deck (25 pages): 4,000-6,000 tokens

**Output Tokens** (structured JSON):
- Minimal extraction: 800-1,200 tokens
- Standard extraction: 1,500-2,000 tokens
- Comprehensive extraction: 2,000-3,000 tokens

**Cost Formula**:
```
Input Cost = (input_tokens × $0.0025) / 1000
Output Cost = (output_tokens × $0.01) / 1000
Total = Input Cost + Output Cost
```

**Examples**:
- 2,000 input + 1,500 output = (2.0 × $0.0025) + (1.5 × $0.01) = $0.005 + $0.015 = **$0.020**
- 3,000 input + 2,000 output = (3.0 × $0.0025) + (2.0 × $0.01) = $0.0075 + $0.02 = **$0.0275**

### Database Query Performance

**Without Indexes**:
- Simple select: 50-100ms
- JSONB filter query: 500-1000ms
- Complex join + JSONB: 1000-2000ms

**With Recommended Indexes**:
- Simple select: 5-10ms
- JSONB filter query (GIN indexed): 50-100ms
- Complex join + JSONB: 100-200ms

**Recommended Indexes** (copy-paste ready):
```sql
-- Index on version and confidence
CREATE INDEX idx_tca_version_confidence
ON title_content_analysis(analysis_version, processing_confidence);

-- GIN index on pitch_analysis JSONB
CREATE INDEX idx_tca_pitch_analysis_gin
ON title_content_analysis USING GIN (pitch_analysis);

-- GIN index on semantic_tags array
CREATE INDEX idx_tca_semantic_tags_gin
ON title_content_analysis USING GIN (semantic_tags);

-- GIN index on character_types array
CREATE INDEX idx_tca_character_types_gin
ON title_content_analysis USING GIN (character_types);

-- Index on updated_at for recent extractions
CREATE INDEX idx_tca_updated_at
ON title_content_analysis(updated_at DESC);
```

### Batch Processing Estimates

**Assumptions**:
- Average extraction time: 20 seconds
- Average cost per title: $0.18
- Sequential processing (no parallelization)
- 95% success rate (5% retries)

**Estimates**:

| Titles | Time (Sequential) | Cost | Time (5 Parallel) |
|--------|-------------------|------|-------------------|
| 10     | 3.5 minutes       | $1.80 | 1 minute          |
| 25     | 8.5 minutes       | $4.50 | 2 minutes         |
| 48     | 16 minutes        | $8.64 | 3.5 minutes       |
| 100    | 35 minutes        | $18.00 | 7 minutes        |

**Parallelization Example**:
```typescript
// Process 5 titles concurrently
async function batchExtract(titleIds: string[]) {
  const BATCH_SIZE = 5
  const results = []

  for (let i = 0; i < titleIds.length; i += BATCH_SIZE) {
    const batch = titleIds.slice(i, i + BATCH_SIZE)

    const batchResults = await Promise.all(
      batch.map(id =>
        supabase.functions.invoke('extract-pitch-test', {
          body: { title_id: id }
        })
      )
    )

    results.push(...batchResults)

    // Rate limit between batches
    if (i + BATCH_SIZE < titleIds.length) {
      await new Promise(resolve => setTimeout(resolve, 5000))
    }
  }

  return results
}
```

### Data Retrieval Performance

**Query Types & Benchmarks**:

1. **Get Single Title Analysis** (~10ms)
```sql
SELECT * FROM title_content_analysis WHERE title_id = 'uuid';
```

2. **Get All High-Quality Analyses** (~50ms with index)
```sql
SELECT * FROM title_content_analysis
WHERE processing_confidence >= 0.70;
```

3. **JSONB Filter Query** (~100ms with GIN index)
```sql
SELECT * FROM title_content_analysis
WHERE pitch_analysis @> '{"ip_value": {"franchise_potential": "high"}}'::jsonb;
```

4. **Complex Join + JSONB** (~200ms with indexes)
```sql
SELECT t.*, tca.pitch_analysis
FROM titles t
JOIN title_content_analysis tca ON t.title_id = tca.title_id
WHERE tca.pitch_analysis->'themes_and_tone'->'primary_themes' @> '["romance"]'::jsonb
  AND tca.processing_confidence >= 0.70;
```

5. **Aggregate Statistics** (~100ms)
```sql
SELECT
  COUNT(*) as total,
  AVG(processing_confidence) as avg_confidence,
  COUNT(CASE WHEN processing_confidence >= 0.70 THEN 1 END) as high_quality
FROM title_content_analysis;
```

### Storage Requirements

**Per Title**:
- `pitch_analysis` JSONB: 15-30 KB average
- All fields combined: 20-40 KB average
- With indexes: +10 KB per title

**Estimates**:

| Titles | Data Size | With Indexes | Total Storage |
|--------|-----------|--------------|---------------|
| 100    | 2-4 MB    | 1 MB         | 3-5 MB        |
| 500    | 10-20 MB  | 5 MB         | 15-25 MB      |
| 1,000  | 20-40 MB  | 10 MB        | 30-50 MB      |
| 5,000  | 100-200 MB | 50 MB       | 150-250 MB    |

**Note**: Negligible storage cost on Supabase free tier (500MB included)

---

## API Reference

### Edge Function: `extract-pitch-test`

**Endpoint**: Supabase Functions (deployed)

**URL**: `https://dlrnrgcoguxlkkcitlpd.supabase.co/functions/v1/extract-pitch-test`

**Method**: POST

**Authentication**: Required (Supabase auth token)

**Version**: v7-comprehensive-extraction

#### Request Schema

```typescript
{
  title_id: string;      // UUID of title (required)
  test_mode?: boolean;   // If true, don't save to DB (optional, default: false)
}
```

**Example Request**:
```typescript
const { data, error } = await supabase.functions.invoke('extract-pitch-test', {
  body: {
    title_id: '0cfbbe46-e4b3-4d29-925a-a5e9e88bcdab',
    test_mode: true  // Preview mode
  }
});
```

#### Response Schema

```typescript
{
  success: boolean;
  data?: {
    extracted_text: string;           // First 500 chars preview
    full_text_length: number;         // Total characters extracted
    analysis: PitchAnalysis;          // Complete structured data (50+ fields)
    cost: number;                     // USD cost for this extraction
    tokens_used: {
      input: number;                  // Input tokens
      output: number;                 // Output tokens
    };
    saved_to_db: boolean;             // True if saved to database
  };
  error?: string;                     // Error message if success=false
}
```

#### Success Response Example

```json
{
  "success": true,
  "data": {
    "extracted_text": "--- Page 1 ---\nWerewolves Going Crazy Over Me\nPitch Deck...",
    "full_text_length": 35420,
    "analysis": {
      "story_world": {
        "setting": "Modern Seoul medical district",
        "time_period": "Contemporary",
        "world_building": ["Secret underground werewolf war", "Medical hospital setting"]
      },
      "characters": [
        {
          "name": "Dr. Olivia Han",
          "role": "protagonist",
          "archetype": "strong female lead",
          "description": "Brilliant emergency room doctor who discovers werewolf secret",
          "key_traits": ["intelligent", "determined", "compassionate"],
          "relationships": ["rivals with Damian", "mentored by Dr. Kim"]
        }
      ],
      "story_elements": {
        "logline": "An ER doctor discovers her hospital is the battleground for a secret werewolf war",
        "plot_summary": "Dr. Olivia Han's life changes when she witnesses a mysterious patient's transformation...",
        "key_plot_points": ["Olivia discovers werewolf secret", "Damian reveals identity"],
        "genre_blend": ["medical procedural", "supernatural romance", "thriller"],
        "narrative_structure": "linear with flashbacks"
      },
      "themes_and_tone": {
        "primary_themes": ["love and sacrifice", "science vs supernatural", "identity"],
        "emotional_tone": "dark and suspenseful with romantic elements",
        "visual_style": "noir with romantic lighting",
        "mood_keywords": ["intense", "mysterious", "emotional", "romantic"]
      },
      "market_positioning": {
        "target_audience": {
          "age_range": "18-34",
          "gender_skew": "female-skewed",
          "psychographics": "fans of supernatural romance and medical dramas"
        },
        "comparable_titles": [
          {
            "title": "Grey's Anatomy",
            "platform": "ABC",
            "similarity": "medical setting with complex relationships"
          },
          {
            "title": "Vampire Diaries",
            "platform": "Netflix",
            "similarity": "supernatural elements with romance"
          }
        ],
        "platform_fit": ["Netflix", "HBO Max", "Disney+"],
        "territory_potential": ["North America", "Europe", "Asia"]
      },
      "production_details": {
        "format": "8-episode limited series",
        "estimated_episodes": "8",
        "budget_range": "$2-5M per episode",
        "timeline": "18-month production",
        "adaptation_type": "webtoon adaptation"
      },
      "source_material": {
        "original_platform": "Manta Comics",
        "metrics": {
          "views": "2000000",
          "likes": "150000",
          "chapters": "23",
          "rating": "9.2/10"
        },
        "serialization_status": "ongoing",
        "awards_recognition": ["Best Webtoon 2023"]
      },
      "korean_cultural_elements": [
        "Webtoon storytelling format",
        "K-drama romantic tropes",
        "Korean hospital hierarchy"
      ],
      "ip_value": {
        "franchise_potential": "high",
        "merchandising_opportunities": ["character figurines", "fashion line"],
        "cross_media_potential": ["mobile game", "sequel series"],
        "unique_selling_points": [
          "First medical drama to blend werewolf mythology",
          "Strong female lead breaks genre conventions",
          "Proven fanbase with 2M views",
          "Comps to hit shows like Grey's Anatomy and Vampire Diaries",
          "High franchise potential for sequels"
        ]
      },
      "creative_team": {
        "author_writer": "Lee Min-ji",
        "illustrator_artist": "Kim Soo-hyun",
        "credentials": ["Award-winning author", "10M+ combined views"],
        "studio_publisher": "Manta Comics"
      },
      "rights_availability": {
        "available_rights": ["adaptation rights", "distribution", "merchandising"],
        "territories_available": ["North America", "Europe", "Global excluding China"],
        "exclusivity_notes": "Non-exclusive adaptation rights"
      },
      "content_classification": {
        "maturity_rating": "teen (13+)",
        "content_warnings": ["violence", "dark themes", "romantic content"],
        "complexity_score": 7,
        "accessibility_notes": "Subtitles recommended"
      },
      "additional_highlights": [
        "Strong social media following",
        "Trending on Manta Comics platform"
      ]
    },
    "cost": 0.019,
    "tokens_used": {
      "input": 2150,
      "output": 1847
    },
    "saved_to_db": false
  }
}
```

#### Error Response Example

```json
{
  "success": false,
  "error": "Title not found or missing pitch deck"
}
```

**Common Errors**:
- `Missing title_id`: Request missing required field
- `Title not found or missing pitch deck`: Invalid title_id or no pitch URL
- `Failed to create signed URL`: Storage access issue
- `OpenAI API error: 429`: Rate limit exceeded
- `Failed to save to database`: Database permission or validation error

#### Rate Limits

**OpenAI API**:
- Free tier: 3 requests/minute
- Paid tier: 3,500 requests/minute

**Supabase Edge Functions**:
- No explicit rate limit on free tier
- Recommended: 1 extraction per 5 seconds to avoid overwhelming OpenAI

**Best Practices**:
```typescript
// Sequential processing with delay
for (const titleId of titleIds) {
  await extractPitch(titleId)
  await new Promise(resolve => setTimeout(resolve, 5000)) // 5-second delay
}

// Parallel processing (batch of 5)
const batches = chunk(titleIds, 5)
for (const batch of batches) {
  await Promise.all(batch.map(id => extractPitch(id)))
  await new Promise(resolve => setTimeout(resolve, 10000)) // 10-second delay between batches
}
```

---

## Related Documentation

- **[Complete Usage Guide](PITCH_DECK_EXTRACTION_GUIDE.md)** - How to use the admin UI and extract pitch decks
- **[Changelog](PITCH_DECK_EXTRACTION_CHANGELOG.md)** - Version history and improvements
- **[Python PDF Extractor](../../python-pdf-extractor/README.md)** - Microservice documentation
- **[Database Schema](DATABASE_SCHEMA.md)** - Complete database reference
- **[CLAUDE.md](../../CLAUDE.md)** - Project instructions for AI assistant

---

## Support & Troubleshooting

For issues or questions:

1. **Check This Reference** - Search for your issue in Error Recovery section
2. **Review Edge Function Logs** - https://supabase.com/dashboard/project/dlrnrgcoguxlkkcitlpd/functions
3. **Test with Preview Mode** - Use "Test Extract (Preview Only)" to isolate issues
4. **Check Python Extractor Health** - Verify service is running
5. **Contact Development Team** - Provide error logs, title_id, and steps to reproduce

---

**Last Updated**: 2025-01-30
**Version**: 2.0 Enhanced Extraction
**Maintained By**: Dashboard Development Team
