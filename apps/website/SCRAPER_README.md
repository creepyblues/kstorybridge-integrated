# Toons.kr Web Scraper

This directory contains scripts to scrape all titles from https://www.toons.kr/toons/list with their detailed information.

## Files

- `scrape-toons-kr.py` - Main scraper with Selenium (handles infinite scroll)
- `scrape-toons-simple.py` - Simple scraper with requests/BeautifulSoup
- `requirements.txt` - Python dependencies
- `SCRAPER_README.md` - This file

## Features

The scraper extracts the following information for each title:
- **Title** - Name of the webtoon
- **URL** - Link to the title detail page  
- **Genre** - Genre classification
- **Writer** (글) - Author/writer name
- **Artist** (그림) - Artist/illustrator name
- **Original** (원작) - Original work reference
- **Featured** - Whether it's a featured/premium title
- **Pages** - Number of episodes/chapters
- **Characters** - Main characters
- **Synopsis** (시놉시스) - Plot summary
- **Cover Image** - URL to cover image

## Setup

1. **Install Python 3.8+**

2. **Install Chrome Browser** (required for Selenium version)

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Alternative setup with virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

## Usage

### Option 1: Full Scraper (Recommended)
Handles infinite scroll and gets all titles:

```bash
python scrape-toons-kr.py
```

This will:
- Open Chrome browser (visible by default)
- Scroll through the entire list to load all titles
- Extract detailed information from each title page
- Save progress every 50 titles
- Generate final CSV and JSON files

**Output files:**
- `toons_kr_titles_final.csv` - Main CSV output
- `toons_kr_titles_backup.json` - JSON backup
- `toons_scraper.log` - Detailed logs
- `toons_kr_titles_progress_N.csv` - Progress checkpoints

### Option 2: Simple Scraper
Faster but may miss titles that require scrolling:

```bash
python scrape-toons-simple.py
```

**Output files:**
- `toons_kr_simple.csv` - CSV output
- `toons_kr_simple.json` - JSON backup

## Configuration

### Headless Mode
To run without showing browser window, edit `scrape-toons-kr.py`:
```python
# Uncomment this line in setup_driver():
chrome_options.add_argument('--headless')
```

### Rate Limiting
Adjust delays in the script:
```python
time.sleep(1)  # Delay between requests (seconds)
```

### Progress Saves
Change how often progress is saved:
```python
if i % 50 == 0:  # Save every 50 titles
```

## CSV Output Format

The generated CSV will have these columns:

| Column | Description |
|--------|-------------|
| title | Webtoon title |
| url | Detail page URL |
| genre | Genre classification |
| writer | Author name (글) |
| artist | Artist name (그림) |
| original | Original work (원작) |
| featured | Featured status |
| pages | Episode count |
| characters | Main characters |
| synopsis | Plot summary (시놉시스) |
| cover_image | Cover image URL |

## Troubleshooting

### Common Issues

1. **Chrome Driver Issues**
   - The script auto-downloads ChromeDriver
   - Make sure Chrome browser is installed
   - Try updating Chrome to latest version

2. **No Titles Found**
   - Website structure may have changed
   - Check if toons.kr is accessible
   - Verify selectors in the script

3. **Rate Limiting/Blocking**
   - Increase delays between requests
   - Use different User-Agent strings
   - Run during off-peak hours

4. **Memory Issues**
   - Close other applications
   - Use progress saving feature
   - Process in smaller batches

### Error Recovery

If the scraper crashes:
1. Check `toons_scraper.log` for errors
2. Look for progress files: `toons_kr_titles_progress_N.csv`
3. Restart from where it left off by modifying the script

### Website Changes

If toons.kr changes their HTML structure:
1. Inspect the page source
2. Update CSS selectors in the script
3. Adjust regex patterns for text extraction

## Legal Notice

⚠️ **Important**: This scraper is for educational purposes only. Please:
- Respect the website's robots.txt
- Don't overload their servers
- Follow their terms of service
- Consider API alternatives if available
- Use scraped data responsibly

## Performance Tips

- Run during off-peak hours
- Use headless mode for faster execution
- Adjust delays based on server response
- Monitor system resources
- Save progress frequently

## Example Usage

```bash
# Basic scraping
python scrape-toons-kr.py

# Check progress
tail -f toons_scraper.log

# View results
head -20 toons_kr_titles_final.csv
```

The scraper will provide real-time progress updates and a final summary of successful vs failed extractions.