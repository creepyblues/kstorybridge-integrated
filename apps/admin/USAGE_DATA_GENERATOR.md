# Data Generator Scraper Usage Guide

This document explains how to use the `data_generator_scraper` script to automatically populate missing title data using the scraper system.

## Overview

The data generator scraper script finds titles with missing data fields (views, likes, audience, age_rating) and uses the existing scraper API to populate them, generating SQL update queries for batch database updates.

## Prerequisites

1. Backend scraper API must be running on port 3001
   ```bash
   cd backend && npm start
   ```

2. Admin app dependencies must be installed
   ```bash
   cd apps/admin && npm install
   ```

## Usage

### Basic Commands

```bash
# Run from apps/admin directory
cd apps/admin

# Basic usage - process all missing data
npm run generate:scraper-data

# Dry run - test without database changes
npm run generate:scraper-data:dry-run

# Limit processing to 10 titles
npm run generate:scraper-data:limit

# Process only specific fields
npm run generate:scraper-data:views
npm run generate:scraper-data:likes
```

### Advanced Usage

```bash
# Custom field combinations
node scripts/data_generator_scraper.js --field=views,likes --limit=5 --dry-run

# Process only audience and age rating
node scripts/data_generator_scraper.js --field=audience,age_rating --limit=20
```

## Command Line Options

| Option | Description | Example |
|--------|-------------|---------|
| `--dry-run` | Test mode - no database changes | `--dry-run` |
| `--limit=N` | Process only N titles | `--limit=10` |
| `--field=fields` | Comma-separated fields to target | `--field=views,likes` |

### Supported Fields

- `views` - View counts from Korean platforms
- `likes` - Like/heart counts  
- `audience` - Target audience information
- `age_rating` - Age rating (전체이용가, 15세 이용가, etc.)

## Supported Platforms

The script works with titles from these Korean content platforms:

- **Naver Series** (`series.naver.com`) - ✅ Full support
- **Naver Comics** (`comic.naver.com`) - ✅ Working
- **KakaoPage** (`page.kakao.com`) - ✅ Working  
- **Kakao Webtoon** (`webtoon.kakao.com`) - ⚠️ Partial support

## Output

### Console Output

The script provides detailed progress information:

```
🚀 Starting Data Generator Scraper
===================================
🧪 DRY RUN MODE - No database changes will be made

🏥 Checking scraper API health...
✅ Scraper API is healthy

🔍 Finding titles with missing data...
Target fields: views, likes, audience, age_rating
✅ Found 25 titles with missing data
📊 Processing 10 titles (limit applied)

📝 Processing (1/10): 웹툰 제목
🔗 URL: https://series.naver.com/comic/detail.series?productNo=123456
📋 Missing fields: views, likes
📡 Calling scraper API for: https://series.naver.com/...
✅ Scraping successful (confidence: 95%)
📊 Extracted fields: views, likes, age_rating
✨ Found views: 137000
✨ Found likes: 15000
```

### SQL File Generation

The script generates SQL update queries in a timestamped file:

```sql
-- title_updates_2025-08-11T10-30-45-123Z.sql

-- $1 = 137000
-- $2 = 15000
-- $3 = '2025-08-11T10:30:45.123Z'
-- Update 웹툰 제목 (title-uuid-here)
UPDATE titles 
SET views = $1, likes = $2, updated_at = $3
WHERE title_id = 'title-uuid-here';
```

### Results Summary

```
📊 PROCESSING SUMMARY
=====================
✅ Successful: 8
❌ Failed: 2
📈 Success Rate: 80.0%

📋 Fields Updated:
  • views: 6 titles
  • likes: 5 titles
  • audience: 3 titles
  • age_rating: 4 titles

❌ Failure Reasons:
  • unsupported_url: 1
  • scraping_failed: 1
```

## Workflow

### 1. Development/Testing Phase

```bash
# Test with a small sample first
npm run generate:scraper-data:dry-run -- --limit=3

# Check the console output for any issues
# Verify the scraper API is working correctly
```

### 2. Production Run

```bash
# Process a larger batch
npm run generate:scraper-data -- --limit=20

# Review the generated SQL file
# Test the SQL queries on a staging database first
```

### 3. Database Update

1. Review the generated `.sql` file
2. Test queries on staging database
3. Execute in Supabase SQL Editor:
   ```sql
   -- Copy and paste the generated queries
   UPDATE titles SET views = 137000, likes = 15000, updated_at = '2025-08-11T10:30:45.123Z' WHERE title_id = 'uuid-here';
   ```
4. Verify the updated data in the admin interface

## Error Handling

### Common Issues

**API Not Available:**
```
❌ Scraper API is not available at: http://localhost:3001/api/scraper
💡 Make sure the backend server is running:
   cd backend && npm start
```

**Unsupported URLs:**
- Script skips titles with URLs not supported by scrapers
- Only processes Korean platform URLs
- Shows reason as `unsupported_url`

**Network Errors:**
- Automatic retry with 2-second delays between requests
- Detailed error logging for debugging
- Graceful handling of temporary failures

### Rate Limiting

The script includes built-in rate limiting:
- 2-second delay between API calls
- Prevents overwhelming the scraper service
- Allows for stable, long-running operations

## Environment Configuration

### Required Environment Variables

```bash
# Backend scraper API URL (optional - defaults to localhost:3001)
VITE_SCRAPER_API_URL=http://localhost:3001/api/scraper

# Supabase configuration (optional - has defaults)
VITE_SUPABASE_URL=https://dlrnrgcoguxlkkcitlpd.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Custom Configuration

Create `.env.local` in `apps/admin/`:
```bash
VITE_SCRAPER_API_URL=https://your-scraper-api.com/api/scraper
```

## Best Practices

### 1. Start Small
Always test with `--dry-run` and `--limit=5` first to verify the script works correctly.

### 2. Gradual Processing  
Process titles in batches (10-20 at a time) rather than all at once to avoid overwhelming the system.

### 3. Backup Data
Before running SQL updates, backup the titles table or test on staging first.

### 4. Monitor Performance
The script shows processing time and success rates - use this to optimize batch sizes.

### 5. Field-Specific Processing
Use `--field=views,likes` to focus on specific missing data types when needed.

## Integration with Existing Scraper System

The data generator leverages the existing scraper infrastructure documented in `SCRAPER_CONTEXT.md`:

- Uses same API endpoints (`/api/scraper/scrape`)
- Supports all four Korean platforms
- Handles Korean number conversion automatically
- Provides same confidence scoring and field extraction
- Uses identical error handling patterns

This ensures consistency with manual scraping operations in the admin interface.

## Troubleshooting

### Script Won't Start
```bash
# Check dependencies
cd apps/admin && npm install

# Verify node version
node --version  # Should be 18+
```

### No Titles Found
```bash
# Check database connection
node -e "console.log('DB URL:', process.env.VITE_SUPABASE_URL)"

# Verify titles exist with missing data
# Check field filtering logic
```

### Scraper API Errors
```bash
# Test API directly
curl -X POST http://localhost:3001/api/scraper/health

# Check backend logs
cd backend && npm start
```

### Generated SQL Issues
- Review parameterized queries for syntax
- Test individual UPDATE statements first
- Check UUID formats and field names

## Next Steps

After successful data generation:

1. **Verify Results**: Check updated titles in admin interface
2. **Quality Check**: Review scraped data for accuracy
3. **Cleanup**: Archive or delete generated SQL files
4. **Schedule**: Consider running periodically for new titles
5. **Monitor**: Track success rates and adjust batch sizes