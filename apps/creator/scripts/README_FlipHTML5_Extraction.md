# FlipHTML5 Data Extraction Scripts

This directory contains scripts to extract structured data from FlipHTML5 publications, specifically targeting the 2025 Webtoon English Directory at: https://online.fliphtml5.com/ohjyz/lczp/

## Available Scripts

### 1. `extractFlipHTML5Data.js` (Advanced Puppeteer-based)
Uses Puppeteer to render pages and extract content from the DOM.

**Features:**
- Full browser rendering
- JavaScript execution
- Advanced content extraction
- Pattern matching for titles and metadata
- Image and link extraction

**Usage:**
```bash
# Install dependencies first
cd scripts
npm install puppeteer

# Run with default settings (pages 10-85)
node extractFlipHTML5Data.js

# Test with dry run (no file output)
node extractFlipHTML5Data.js --dry-run

# Custom page range
node extractFlipHTML5Data.js --start=10 --end=20 --output=sample.json

# Quick test (5 pages only)
node extractFlipHTML5Data.js --start=10 --end=15 --dry-run
```

### 2. `extractFlipHTML5Simple.js` (HTTP-based API Explorer)
Attempts to find and use FlipHTML5 API endpoints for data extraction.

**Features:**
- No browser dependencies
- Fast execution
- API endpoint discovery
- Direct JSON data extraction
- Lightweight approach

**Usage:**
```bash
# Run the simple extractor
node extractFlipHTML5Simple.js

# Test mode
node extractFlipHTML5Simple.js --dry-run

# Custom output file
node extractFlipHTML5Simple.js --output=api_data.json
```

## Command Line Options

### Common Options
- `--dry-run`: Test mode, no files are saved
- `--output=filename.json`: Specify output file name

### Advanced Script Options (`extractFlipHTML5Data.js`)
- `--start=N`: Starting page number (default: 10)
- `--end=N`: Ending page number (default: 85)

## Output Format

Both scripts generate JSON files with the following structure:

```json
{
  "summary": {
    "extractedAt": "2025-01-20T19:00:00.000Z",
    "source": "https://online.fliphtml5.com/ohjyz/lczp/",
    "totalPages": 76,
    "successfulPages": 74,
    "failedPages": 2,
    "totalTitlesFound": 150,
    "processingTimeMs": 45000
  },
  "pages": [
    {
      "page": 10,
      "url": "https://online.fliphtml5.com/ohjyz/lczp/#p=10",
      "timestamp": "2025-01-20T19:00:15.000Z",
      "titles": [
        {
          "text": "Sample Webtoon Title",
          "pattern": "title_pattern"
        }
      ],
      "metadata": {
        "author": ["Author Name"],
        "genre": ["Romance", "Drama"],
        "status": ["Ongoing"]
      },
      "rawText": "Full page text content...",
      "images": [
        {
          "src": "image_url",
          "alt": "alt_text",
          "title": "title_text"
        }
      ]
    }
  ],
  "allTitles": [
    {
      "title": "Unique Title 1",
      "source": "fliphtml5_extraction"
    }
  ]
}
```

## Data Extraction Patterns

The scripts look for various patterns to identify titles and metadata:

### Title Patterns
- `Title: [title text]`
- `제목: [title text]` (Korean)
- Sentences starting with capital letters
- Title case phrases
- Text between specific delimiters

### Metadata Patterns
- Author/작가: Author names
- Genre/장르: Content genres
- Status/상태: Publication status
- Year/연도: Publication year
- Chapters/화수: Chapter count
- Rating/평점: User ratings

## Troubleshooting

### Common Issues

1. **Puppeteer Installation Fails**
   ```bash
   # On macOS with Apple Silicon
   PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true npm install puppeteer
   
   # Then install Chromium manually
   npx puppeteer browsers install chrome
   ```

2. **Access Denied / Rate Limiting**
   - Increase delays between requests
   - Use `--dry-run` mode for testing
   - Check FlipHTML5 terms of service

3. **Empty Results**
   - Try the simple HTTP-based script first
   - Check if the publication is publicly accessible
   - Verify the publication ID and book ID in URLs

4. **Memory Issues**
   - Reduce page range (`--start` and `--end`)
   - Process in smaller batches
   - Close other applications

### Performance Tips

1. **For Large Extractions (76 pages)**
   - Run during off-peak hours
   - Use `--dry-run` first to test
   - Consider processing in batches

2. **For Testing**
   - Start with small ranges: `--start=10 --end=15`
   - Use dry run mode: `--dry-run`
   - Check one successful page before full run

## Examples

### Quick Test
```bash
# Test 5 pages to see what data is available
node extractFlipHTML5Simple.js --dry-run
```

### Full Extraction
```bash
# Extract all pages 10-85 (production run)
node extractFlipHTML5Data.js --output=webtoon_directory_2025.json
```

### Batch Processing
```bash
# Process in smaller batches to avoid timeouts
node extractFlipHTML5Data.js --start=10 --end=30 --output=batch1.json
node extractFlipHTML5Data.js --start=31 --end=55 --output=batch2.json
node extractFlipHTML5Data.js --start=56 --end=85 --output=batch3.json
```

## Legal Considerations

- Ensure compliance with FlipHTML5 terms of service
- Respect rate limits and server resources
- Only extract publicly accessible content
- Use extracted data responsibly
- Consider reaching out to content owners for permission

## Integration with KStoryBridge

The extracted JSON data can be imported into the KStoryBridge database using the existing title import scripts. The format matches the expected structure for title data in the dashboard application.

---

**Note:** These scripts are for educational and research purposes. Always respect website terms of service and copyright laws when extracting data from online publications.