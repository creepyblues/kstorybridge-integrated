# Cover Image Extraction Script

This script automatically extracts cover images from title page URLs and updates the `title_image` field in the Titles table.

## Features

- 🔍 Scrapes title pages to find the largest/most relevant image
- 🎯 Filters out UI elements, icons, and small images
- 💾 Updates Supabase database with extracted image URLs
- 📊 Provides detailed logging and reporting
- 🛡️ Handles errors gracefully and skips already processed titles
- ⏱️ Respectful delays between requests

## Prerequisites

1. **Node.js** (version 14 or higher)
2. **Supabase Service Role Key** - Required for database access

## Setup

1. **Install dependencies:**
   ```bash
   cd /Users/sungholee/code/kstorybridge-monorepo/apps/dashboard
   npm install --save @supabase/supabase-js puppeteer
   ```

2. **Set up environment variable:**
   ```bash
   export SUPABASE_SERVICE_ROLE_KEY="your_service_role_key_here"
   ```
   
   You can find your service role key in Supabase Dashboard → Settings → API → service_role secret key

3. **Make script executable:**
   ```bash
   chmod +x extractCoverImages.js
   ```

## Usage

### Run the extraction script:
```bash
node extractCoverImages.js
```

### Or using npm:
```bash
npm run extract
```

## How It Works

1. **Fetches titles** from the database that have `title_url` but no `title_image`
2. **Opens each URL** using Puppeteer (headless browser)
3. **Analyzes all images** on the page:
   - Filters out small images (< 200x200 pixels)
   - Excludes UI elements (icons, logos, buttons)
   - Finds the largest image by area
4. **Updates database** with the extracted image URL
5. **Generates reports** with success/failure statistics

## Output Files

- `cover_extraction_log.txt` - Detailed execution log
- `cover_extraction_results.json` - Complete results in JSON format

## Error Handling

The script handles various scenarios:
- ✅ **Already has image** - Skips titles that already have `title_image`
- ⚠️ **No suitable image** - Logs when no appropriate image is found
- ❌ **Network errors** - Handles timeouts and connection issues
- 🔒 **Access denied** - Manages blocked requests gracefully

## Configuration

You can modify these settings in the script:

```javascript
// Minimum image dimensions
const MIN_WIDTH = 200;
const MIN_HEIGHT = 200;

// Request delay (milliseconds)
const DELAY_BETWEEN_REQUESTS = 2000;

// Page timeout (milliseconds)
const PAGE_TIMEOUT = 30000;
```

## Sample Output

```
[2024-07-24T10:30:15.123Z] 🚀 Initializing browser...
[2024-07-24T10:30:16.456Z] 📊 Fetching titles from database...
[2024-07-24T10:30:17.789Z] 📝 Found 25 titles with URLs

[1/25] Processing: Solo Leveling
[2024-07-24T10:30:20.123Z] 📄 Processing: Solo Leveling (https://example.com/solo-leveling)
[2024-07-24T10:30:23.456Z] ✅ Found cover image: https://example.com/images/solo-leveling-cover.jpg
[2024-07-24T10:30:24.789Z] 💾 Updated database for Solo Leveling

📊 EXTRACTION REPORT
==================================================
✅ Successfully extracted: 20
⏭️ Skipped (already had images): 3
❌ Failed: 2
📝 Total processed: 25
```

## Troubleshooting

### Common Issues:

1. **"SUPABASE_SERVICE_ROLE_KEY not found"**
   - Make sure you've exported the environment variable
   - Verify the key is correct from Supabase dashboard

2. **"Browser launch failed"**
   - Install required system dependencies for Puppeteer
   - On Linux: `sudo apt-get install -y chromium-browser`

3. **"No images found"**
   - Some websites block automated scraping
   - The page might load images dynamically after the script runs
   - Adjust timeout values if needed

4. **Rate limiting**
   - Increase delay between requests if getting blocked
   - Some sites may require custom headers or user agents

## Security Notes

- ⚠️ Never commit the service role key to version control
- 🔒 The script uses headless browsing for privacy
- 🛡️ Respectful delays prevent overwhelming target servers
- 📝 All activities are logged for audit purposes

## Support

If you encounter issues:
1. Check the log file for detailed error messages
2. Verify your Supabase connection and permissions
3. Test with a small subset of URLs first
4. Ensure target websites are accessible