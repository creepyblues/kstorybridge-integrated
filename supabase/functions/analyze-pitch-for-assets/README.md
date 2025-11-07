# Edge Function: analyze-pitch-for-assets

**Feature**: Creative Asset Generation System
**Status**: Active (Phase 2)
**Created**: 2025-11-06
**Design**: Isolated - NO queries to existing tables

---

## 📋 Overview

This edge function analyzes pitch deck content and generates marketing asset ideas using GPT-4. It creates 10-15 detailed asset ideas across three categories:

1. **Social Media** - Instagram stories/posts, Facebook, Twitter, TikTok
2. **Ad Creatives** - Display ads, YouTube thumbnails, video ads
3. **Pitch Materials** - Concept art, key scenes, character cards, posters

Each asset idea includes:
- Detailed description of the visual
- **DALL-E 3 prompt** (100-200 words) ready for image generation
- Asset type, format, and category
- Estimated generation cost

---

## 🏗️ Architecture

### Isolated Design Principles

This function follows **complete isolation** from existing database structures:

- ✅ **NO database queries** to existing tables (titles, admin, etc.)
- ✅ **All data passed as parameters** from frontend
- ✅ **Single write operation**: Only inserts to `title_marketing_assets` table
- ✅ **Standalone operation**: Can work independently

### Data Flow

```
Frontend Request (with all context)
    ↓
Validate Input
    ↓
Build GPT-4 Prompt (using pitch analysis)
    ↓
Call OpenAI API
    ↓
Parse & Transform Response
    ↓
Insert to title_marketing_assets (ONLY)
    ↓
Return Success Response
```

---

## 📥 Request Format

### HTTP Method
`POST`

### Headers
```
Content-Type: application/json
Authorization: Bearer <SUPABASE_ANON_KEY>
```

### Request Body

```typescript
{
  // Title identification (passed from UI)
  "title_id": "123e4567-e89b-12d3-a456-426614174000",
  "title_name": "환생했더니 슬라임이었던 건에 대하여",

  // Pitch deck URL (Supabase Storage signed URL)
  "pitch_deck_url": "https://dlrnrgcoguxlkkcitlpd.supabase.co/storage/v1/object/sign/...",

  // Optional: Pre-extracted pitch analysis
  "pitch_analysis": {
    "characters": {
      "main_characters": [
        {
          "name": "김민준",
          "role": "Protagonist",
          "archetype": "Reluctant Hero",
          "description": "A 25-year-old office worker reincarnated as a slime"
        }
      ],
      "relationships": ["Master-servant dynamic", "Found family"]
    },
    "story": {
      "logline": "After dying, a salaryman is reborn as a slime in a fantasy world",
      "themes": ["Reincarnation", "Found family", "Power fantasy"],
      "setting": "Fantasy world inspired by Korean mythology"
    },
    "market": {
      "target_audience": "Male 18-35, fantasy/isekai fans",
      "comparable_titles": ["Solo Leveling", "The Beginning After The End"],
      "unique_selling_points": ["Korean cultural elements", "Slime protagonist"]
    }
  },

  // Admin context (from auth)
  "admin_email": "sungho@dadble.com"
}
```

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `title_id` | string | Title identifier (can be UUID string or any ID) |
| `title_name` | string | Title name for display |
| `pitch_deck_url` | string | Supabase Storage URL (signed, 24h expiry) |
| `admin_email` | string | Email of requesting admin (must be authorized) |

### Optional Fields

| Field | Type | Description |
|-------|------|-------------|
| `pitch_analysis` | object | Pre-extracted pitch analysis (recommended for better results) |

---

## 📤 Response Format

### Success Response (200)

```typescript
{
  "success": true,
  "data": {
    "title_id": "123e4567-e89b-12d3-a456-426614174000",
    "title_name": "환생했더니 슬라임이었던 건에 대하여",
    "assets_created": 15,
    "asset_ideas": [
      {
        "asset_category": "social_media",
        "asset_type": "instagram_story",
        "asset_format": "1080x1920",
        "description": "Main character transformation scene",
        "prompt_template": "Vertical composition (9:16 aspect ratio) showing a young Korean man...",
        "generation_api": "dall-e-3",
        "generation_model": "dall-e-3",
        "priority": 5,
        "estimated_cost": 0.04
      }
      // ... 14 more asset ideas
    ],
    "analysis_metadata": {
      "gpt4_cost": 0.065,
      "total_cost": 0.065,
      "analysis_duration_ms": 4523,
      "model_used": "gpt-4-turbo-preview",
      "tokens_used": {
        "prompt": 1250,
        "completion": 1800,
        "total": 3050
      },
      "pitch_analysis_used": true,
      "ideas_generated": 15
    }
  }
}
```

### Error Response (4xx/5xx)

```typescript
{
  "success": false,
  "error": {
    "code": "INVALID_INPUT",
    "message": "Missing or invalid title_id",
    "details": {} // Optional
  }
}
```

---

## 🔒 Authentication

### Authorized Admins

Only these email addresses can call this function:
- `sungho@dadble.com`
- `kevin@sandstoneartists.com`

To add a new admin, create a new database migration that updates the RLS policies.

### Authorization Flow

1. Frontend authenticates user with Supabase Auth
2. Frontend extracts `user.email` from session
3. Frontend includes `admin_email` in request body
4. Edge function validates email against authorized list
5. If unauthorized, returns `401 Unauthorized`

---

## 💰 Cost Estimates

### GPT-4 Analysis

| Model | Input Cost | Output Cost | Typical Total |
|-------|-----------|-------------|---------------|
| gpt-4-turbo-preview | $0.01/1K tokens | $0.03/1K tokens | $0.05-0.08 |

**Typical usage**:
- Prompt: ~1,200-1,500 tokens
- Completion: ~1,500-2,000 tokens
- **Total: ~$0.05-0.08 per analysis**

### Asset Generation (Future Phase)

| Model | Quality | Cost per Image |
|-------|---------|----------------|
| DALL-E 3 | Standard | $0.04 |
| DALL-E 3 | HD | $0.08 |

**Total cost for 15 assets**:
- Standard quality: 15 × $0.04 = **$0.60**
- HD quality: 15 × $0.08 = **$1.20**

**Complete workflow cost** (analysis + generation):
- Standard: $0.08 + $0.60 = **$0.68 per title**
- HD: $0.08 + $1.20 = **$1.28 per title**

---

## 📊 Response Data

### Asset Idea Structure

Each asset idea includes:

```typescript
{
  asset_category: 'social_media' | 'ad_creative' | 'pitch_material',
  asset_type: string,           // Specific type (e.g., 'instagram_story')
  asset_format: string,          // Dimensions (e.g., '1080x1920')
  description: string,           // What this asset represents (20-30 words)
  prompt_template: string,       // DALL-E 3 prompt (100-200 words)
  generation_api: 'dall-e-3' | 'openai-video',
  generation_model: 'dall-e-3' | 'dall-e-3-hd',
  priority: 1-5,                 // Higher = more important
  estimated_cost: number         // Estimated generation cost in USD
}
```

### Asset Categories

**Social Media** (5 ideas):
- `instagram_story` (1080x1920)
- `instagram_post` (1080x1080)
- `facebook_post` (1200x628)
- `twitter_post` (1200x675)
- `tiktok_video` (1080x1920)

**Ad Creative** (5 ideas):
- `display_ad` (300x250, 728x90, 1200x628)
- `youtube_thumbnail` (1280x720)
- `video_ad` (1920x1080)
- `banner_ad` (various)

**Pitch Material** (5 ideas):
- `concept_art` (1920x1080)
- `key_scene` (1920x1080)
- `character_card` (1080x1920)
- `mood_board` (1920x1080)
- `poster` (1080x1920)

---

## ⚠️ Error Codes

| Code | Status | Description | Solution |
|------|--------|-------------|----------|
| `INVALID_INPUT` | 400 | Missing/invalid request field | Check request format |
| `UNAUTHORIZED` | 401 | Admin email not authorized | Verify admin email |
| `PITCH_MISSING` | 400 | Pitch deck URL inaccessible | Check Storage URL, expiry |
| `COST_LIMIT_EXCEEDED` | 400 | Estimated cost > limit | Reduce asset count |
| `OPENAI_ERROR` | 500 | OpenAI API call failed | Check API key, retry |
| `DATABASE_ERROR` | 500 | Failed to insert asset ideas | Check table, RLS policies |
| `INTERNAL_ERROR` | 500 | Unexpected error | Check logs |

---

## 🧪 Testing

### Local Testing

1. **Set up environment variables**:
```bash
# In .env.local
SUPABASE_URL=https://dlrnrgcoguxlkkcitlpd.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
OPENAI_API_KEY=<your-openai-api-key>
```

2. **Run function locally**:
```bash
npx supabase functions serve analyze-pitch-for-assets --env-file .env.local
```

3. **Test with curl**:
```bash
curl -X POST http://localhost:54321/functions/v1/analyze-pitch-for-assets \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <SUPABASE_ANON_KEY>" \
  -d '{
    "title_id": "test-123",
    "title_name": "Test Title",
    "pitch_deck_url": "https://...",
    "admin_email": "sungho@dadble.com"
  }'
```

4. **Run test script**:
```bash
node test-analyze-pitch.js
```

### Test Cases

- ✅ Valid request with pitch_analysis
- ✅ Valid request without pitch_analysis
- ✅ Invalid admin email (unauthorized)
- ✅ Missing required fields
- ✅ Cost limit exceeded
- ✅ OpenAI API error handling
- ✅ Database insert failure

---

## 🚀 Deployment

### Prerequisites

1. **Supabase CLI** installed
2. **OpenAI API key** with GPT-4 access
3. **Supabase project** with `title_marketing_assets` table created

### Set Secrets

```bash
# Set OpenAI API key
npx supabase secrets set OPENAI_API_KEY=<your-key>

# Verify secrets
npx supabase secrets list
```

### Deploy Function

```bash
# Deploy to production
npx supabase functions deploy analyze-pitch-for-assets

# Verify deployment
npx supabase functions list
```

### Monitor Logs

```bash
# Real-time logs
npx supabase functions logs analyze-pitch-for-assets --tail

# Recent logs
npx supabase functions logs analyze-pitch-for-assets --limit 50
```

---

## 📁 File Structure

```
analyze-pitch-for-assets/
├── index.ts              # Main edge function handler
├── types.ts              # TypeScript type definitions
├── prompt-builder.ts     # GPT-4 prompt construction utilities
└── README.md            # This file
```

---

## 🔄 Integration Example

### Frontend Integration (React + Supabase)

```typescript
import { supabase } from '@/integrations/supabase/client';

async function analyzeTitle(
  titleId: string,
  titleName: string,
  pitchDeckUrl: string,
  pitchAnalysis?: object
) {
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase.functions.invoke('analyze-pitch-for-assets', {
    body: {
      title_id: titleId,
      title_name: titleName,
      pitch_deck_url: pitchDeckUrl,
      pitch_analysis: pitchAnalysis,
      admin_email: user?.email,
    },
  });

  if (error) {
    console.error('Analysis failed:', error);
    return null;
  }

  console.log(`Generated ${data.data.assets_created} asset ideas`);
  console.log(`Cost: $${data.data.analysis_metadata.total_cost.toFixed(4)}`);

  return data.data.asset_ideas;
}
```

---

## 📝 Database Impact

### Tables Modified

**`title_marketing_assets`** (ONLY):
- **Operation**: INSERT
- **Rows created**: 10-15 per function call
- **Data stored**: Asset ideas with status='pending'

### Tables Read

**NONE** - This function is completely isolated and does not query existing tables.

### RLS Policies

Function uses **service role key** to bypass RLS during inserts. RLS policies will apply when admins query the table from the frontend.

---

## 🎯 Performance

### Typical Execution Time

- **GPT-4 API call**: 3-5 seconds
- **Database insert**: <500ms
- **Total**: 4-6 seconds

### Optimization Notes

- Uses `gpt-4-turbo-preview` for fastest GPT-4 responses
- JSON mode enabled for structured output (faster parsing)
- Single batch insert for all asset ideas
- Exponential backoff retry (max 2 retries)
- 60-second timeout protection

---

## 🐛 Troubleshooting

### "UNAUTHORIZED" error
- Verify `admin_email` is in authorized list
- Check user is authenticated with Supabase Auth

### "OPENAI_ERROR" error
- Verify `OPENAI_API_KEY` secret is set
- Check OpenAI account has GPT-4 access
- Verify account has available credits

### "DATABASE_ERROR" error
- Verify `title_marketing_assets` table exists
- Check RLS policies don't block service role
- Verify table structure matches `MarketingAssetInsert` type

### Function timeout
- Check OpenAI API status
- Reduce asset count in config
- Check network connectivity

---

## 📚 Related Documentation

- **[Implementation Plan](../../../../docs/features/asset-generation/IMPLEMENTATION_PLAN.md)** - Complete feature roadmap
- **[Risk Assessment V2](../../../../docs/features/asset-generation/RISK_ASSESSMENT_V2_ISOLATED.md)** - Isolation design approval
- **[Database Migration](../../../../supabase/migrations/20251106100000_create_isolated_marketing_assets.sql)** - Table schema
- **[Storage Migration](../../../../supabase/migrations/20251106100001_setup_isolated_marketing_assets_storage.sql)** - Storage bucket setup

---

**Created**: 2025-11-06
**Status**: ✅ Active
**Phase**: Phase 2 - Backend (Asset Analysis)
