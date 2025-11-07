# Edge Function: generate-asset

**Feature**: Creative Asset Generation System - Image Generation
**Status**: Active (Phase 3)
**Created**: 2025-11-06
**Design**: Isolated - Only queries `title_marketing_assets` table

---

## 📋 Overview

Generates images from marketing asset prompts using OpenAI's DALL-E 3 API. Downloads the generated image and uploads it to Supabase Storage.

**Workflow:**
1. Fetch asset record from `title_marketing_assets`
2. Update status to `generating`
3. Call DALL-E 3 API with prompt
4. Download generated image
5. Upload to Supabase Storage (`marketing-assets` bucket)
6. Update asset record with results

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
  "asset_id": "123e4567-e89b-12d3-a456-426614174000",  // Required
  "admin_email": "sungho@dadble.com",                   // Required
  "custom_prompt": "Optional custom prompt...",         // Optional
  "use_hd": false                                       // Optional (default: false)
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `asset_id` | string | ✅ | UUID of asset from `title_marketing_assets` table |
| `admin_email` | string | ✅ | Authorized admin email |
| `custom_prompt` | string | ❌ | Override prompt_template from database |
| `use_hd` | boolean | ❌ | Use DALL-E 3 HD quality ($0.08 vs $0.04) |

---

## 📤 Response Format

### Success Response (200)

```typescript
{
  "success": true,
  "data": {
    "asset_id": "123e4567-e89b-12d3-a456-426614174000",
    "image_url": "https://dlrnrgcoguxlkkcitlpd.supabase.co/storage/v1/object/public/marketing-assets/...",
    "signed_url": "https://dlrnrgcoguxlkkcitlpd.supabase.co/storage/v1/object/sign/marketing-assets/...",
    "storage_path": "title-123/instagram_story-1699564800000.png",
    "generation_cost": 0.04,
    "generation_model": "dall-e-3",
    "generation_duration_ms": 15234,
    "generation_attempts": 1
  }
}
```

### Error Response (4xx/5xx)

```typescript
{
  "success": false,
  "error": {
    "code": "ASSET_NOT_FOUND",
    "message": "Asset not found"
  }
}
```

---

## 💰 Cost Estimates

### DALL-E 3 Pricing (as of 2025-11-06)

| Size | Standard | HD |
|------|----------|-----|
| 1024x1024 | $0.040 | $0.080 |
| 1024x1792 | $0.080 | $0.120 |
| 1792x1024 | $0.080 | $0.120 |

### Format Mapping

- **Vertical** (stories, character cards): `1024x1792`
- **Horizontal** (ads, thumbnails): `1792x1024`
- **Square** (posts): `1024x1024`

---

## 🔒 Authorization

**Authorized Admins:**
- `sungho@dadble.com`
- `kevin@sandstoneartists.com`

---

## ⚠️ Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `INVALID_INPUT` | 400 | Missing/invalid request field |
| `UNAUTHORIZED` | 401 | Admin email not authorized |
| `ASSET_NOT_FOUND` | 404 | Asset ID not found in database |
| `ASSET_ALREADY_GENERATED` | 400 | Asset already has image |
| `DALLE_API_ERROR` | 500 | DALL-E 3 API call failed |
| `IMAGE_DOWNLOAD_ERROR` | 500 | Failed to download image |
| `STORAGE_UPLOAD_ERROR` | 500 | Failed to upload to storage |
| `DATABASE_ERROR` | 500 | Database operation failed |

---

## 🔄 Retry Logic

- **Max attempts**: 3
- **Backoff**: Exponential (1s, 2s, 4s)
- **Tracked in DB**: `generation_attempts` field

---

## 🧪 Testing

```bash
# Test script
node scripts/test-generate-asset.js
```

---

## 🚀 Deployment

```bash
# Deploy function
npx supabase functions deploy generate-asset --no-verify-jwt

# Monitor logs (Supabase Dashboard)
https://supabase.com/dashboard/project/dlrnrgcoguxlkkcitlpd/functions/generate-asset/logs
```

---

## 📁 File Structure

```
generate-asset/
├── index.ts              # Main handler
├── types.ts              # TypeScript types
├── dalle-client.ts       # DALL-E 3 API client
├── storage-client.ts     # Supabase Storage utilities
└── README.md            # This file
```

---

**Status**: ✅ Ready for deployment
**Phase**: Phase 3 - Backend (Asset Generation)
