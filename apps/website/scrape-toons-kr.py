#!/usr/bin/env python3
"""
Toons.kr Web Scraper
Scrapes all titles from https://www.toons.kr/toons/list with infinite scroll
and extracts detailed information from each title's detail page.
"""

import csv
import time
import json
import requests
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from webdriver_manager.chrome import ChromeDriverManager
from urllib.parse import urljoin, urlparse
import re
import logging

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('toons_scraper.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class ToonsKrScraper:
    def __init__(self):
        self.base_url = "https://www.toons.kr"
        self.list_url = "https://www.toons.kr/toons/list"
        self.driver = None
        self.scraped_titles = []
        self.session = requests.Session()
        
        # Setup session headers
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
        })

    def setup_driver(self):
        """Setup Chrome WebDriver with appropriate options"""
        chrome_options = Options()
        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--disable-dev-shm-usage')
        chrome_options.add_argument('--disable-gpu')
        chrome_options.add_argument('--window-size=1920,1080')
        chrome_options.add_argument('--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36')
        
        # Optional: Run headless (uncomment to hide browser window)
        # chrome_options.add_argument('--headless')
        
        service = Service(ChromeDriverManager().install())
        self.driver = webdriver.Chrome(service=service, options=chrome_options)
        self.driver.implicitly_wait(10)
        logger.info("Chrome WebDriver initialized")

    def scroll_and_load_all_titles(self):
        """Scroll down to load all titles with infinite scroll"""
        logger.info("Starting to scrape titles list...")
        self.driver.get(self.list_url)
        
        # Wait for initial content to load
        WebDriverWait(self.driver, 20).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, ".toon-item, .webtoon-item, .content-item, [data-title], .title"))
        )
        
        titles = set()
        last_count = 0
        no_change_count = 0
        max_no_change = 5
        
        while no_change_count < max_no_change:
            # Scroll to bottom
            self.driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
            time.sleep(3)
            
            # Try multiple selectors for title elements
            title_selectors = [
                "a[href*='/toons/']",
                ".toon-item a",
                ".webtoon-item a", 
                ".content-item a",
                "[data-title] a",
                ".title a"
            ]
            
            current_titles = set()
            for selector in title_selectors:
                try:
                    elements = self.driver.find_elements(By.CSS_SELECTOR, selector)
                    for element in elements:
                        href = element.get_attribute('href')
                        if href and '/toons/' in href and '/toons/list' not in href:
                            current_titles.add(href)
                except Exception as e:
                    continue
            
            titles.update(current_titles)
            
            logger.info(f"Found {len(titles)} unique titles so far...")
            
            if len(titles) == last_count:
                no_change_count += 1
                logger.info(f"No new titles found. Attempt {no_change_count}/{max_no_change}")
            else:
                no_change_count = 0
                last_count = len(titles)
            
            # Additional wait for dynamic content
            time.sleep(2)
        
        logger.info(f"Finished scrolling. Total unique titles found: {len(titles)}")
        return list(titles)

    def extract_title_details(self, title_url):
        """Extract detailed information from a title's detail page"""
        try:
            logger.info(f"Scraping details for: {title_url}")
            
            # Use requests session for faster scraping
            response = self.session.get(title_url, timeout=15)
            response.raise_for_status()
            html_content = response.text
            
            # Parse with basic string operations for speed
            title_data = {
                'url': title_url,
                'title': self.extract_text_between(html_content, '<title>', '</title>').replace(' - 툰즈', '').strip(),
                'genre': '',
                'writer': '',  # 글
                'artist': '',  # 그림
                'original': '',  # 원작
                'featured': '',
                'pages': '',
                'characters': '',
                'synopsis': '',  # 시놉시스
                'cover_image': ''
            }
            
            # Extract genre
            genre_patterns = [
                r'장르[:\s]*([^<\n]+)',
                r'genre[:\s]*([^<\n]+)',
                r'<meta name="genre" content="([^"]+)"'
            ]
            title_data['genre'] = self.extract_with_patterns(html_content, genre_patterns)
            
            # Extract writer (글)
            writer_patterns = [
                r'글[:\s]*([^<\n]+)',
                r'작가[:\s]*([^<\n]+)',
                r'writer[:\s]*([^<\n]+)',
                r'<meta name="author" content="([^"]+)"'
            ]
            title_data['writer'] = self.extract_with_patterns(html_content, writer_patterns)
            
            # Extract artist (그림)
            artist_patterns = [
                r'그림[:\s]*([^<\n]+)',
                r'artist[:\s]*([^<\n]+)',
                r'illustrator[:\s]*([^<\n]+)'
            ]
            title_data['artist'] = self.extract_with_patterns(html_content, artist_patterns)
            
            # Extract original (원작)
            original_patterns = [
                r'원작[:\s]*([^<\n]+)',
                r'original[:\s]*([^<\n]+)',
                r'based on[:\s]*([^<\n]+)'
            ]
            title_data['original'] = self.extract_with_patterns(html_content, original_patterns)
            
            # Extract synopsis (시놉시스)
            synopsis_patterns = [
                r'시놉시스[:\s]*</?\w*>\s*([^<]+)',
                r'synopsis[:\s]*</?\w*>\s*([^<]+)',
                r'줄거리[:\s]*</?\w*>\s*([^<]+)',
                r'<meta name="description" content="([^"]+)"',
                r'<p class="synopsis">([^<]+)</p>',
                r'<div class="synopsis">([^<]+)</div>'
            ]
            title_data['synopsis'] = self.extract_with_patterns(html_content, synopsis_patterns)
            
            # Extract cover image
            image_patterns = [
                r'<meta property="og:image" content="([^"]+)"',
                r'<img[^>]+src="([^"]+)"[^>]*cover',
                r'<img[^>]+class="[^"]*cover[^"]*"[^>]+src="([^"]+)"',
                r'<img[^>]+src="([^"]+)"[^>]*class="[^"]*cover',
                r'cover.*?src="([^"]+)"',
                r'thumbnail.*?src="([^"]+)"'
            ]
            cover_url = self.extract_with_patterns(html_content, image_patterns)
            if cover_url and not cover_url.startswith('http'):
                cover_url = urljoin(self.base_url, cover_url)
            title_data['cover_image'] = cover_url
            
            # Extract additional metadata
            if 'featured' in html_content.lower() or 'premium' in html_content.lower():
                title_data['featured'] = 'Yes'
            
            # Extract page count if available
            page_patterns = [
                r'(\d+)화',
                r'(\d+)편',
                r'(\d+) pages?',
                r'총 (\d+)화'
            ]
            title_data['pages'] = self.extract_with_patterns(html_content, page_patterns)
            
            # Extract characters if available
            char_patterns = [
                r'등장인물[:\s]*([^<\n]+)',
                r'characters?[:\s]*([^<\n]+)',
                r'주요 인물[:\s]*([^<\n]+)'
            ]
            title_data['characters'] = self.extract_with_patterns(html_content, char_patterns)
            
            # Clean up extracted data
            for key, value in title_data.items():
                if isinstance(value, str):
                    title_data[key] = self.clean_text(value)
            
            logger.info(f"Successfully scraped: {title_data['title']}")
            return title_data
            
        except Exception as e:
            logger.error(f"Error scraping {title_url}: {str(e)}")
            return {
                'url': title_url,
                'title': 'ERROR',
                'genre': '',
                'writer': '',
                'artist': '',
                'original': '',
                'featured': '',
                'pages': '',
                'characters': '',
                'synopsis': '',
                'cover_image': '',
                'error': str(e)
            }

    def extract_text_between(self, text, start, end):
        """Extract text between two markers"""
        try:
            start_idx = text.find(start)
            if start_idx == -1:
                return ''
            start_idx += len(start)
            end_idx = text.find(end, start_idx)
            if end_idx == -1:
                return ''
            return text[start_idx:end_idx].strip()
        except:
            return ''

    def extract_with_patterns(self, text, patterns):
        """Extract text using regex patterns"""
        for pattern in patterns:
            try:
                match = re.search(pattern, text, re.IGNORECASE | re.MULTILINE)
                if match:
                    result = match.group(1).strip()
                    if result and result != '':
                        return result
            except:
                continue
        return ''

    def clean_text(self, text):
        """Clean extracted text"""
        if not text:
            return ''
        
        # Remove HTML tags
        text = re.sub(r'<[^>]+>', '', text)
        # Remove extra whitespace
        text = ' '.join(text.split())
        # Remove special characters at start/end
        text = text.strip('.,;:!?-_')
        
        return text.strip()

    def save_to_csv(self, titles_data, filename='toons_kr_titles.csv'):
        """Save scraped data to CSV file"""
        fieldnames = [
            'title', 'url', 'genre', 'writer', 'artist', 'original', 
            'featured', 'pages', 'characters', 'synopsis', 'cover_image'
        ]
        
        with open(filename, 'w', newline='', encoding='utf-8') as csvfile:
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            writer.writeheader()
            
            for data in titles_data:
                # Filter out error field if present
                row_data = {k: v for k, v in data.items() if k in fieldnames}
                writer.writerow(row_data)
        
        logger.info(f"Data saved to {filename}")

    def run(self):
        """Main scraping workflow"""
        try:
            logger.info("Starting Toons.kr scraper...")
            
            # Setup WebDriver
            self.setup_driver()
            
            # Get all title URLs
            title_urls = self.scroll_and_load_all_titles()
            
            if not title_urls:
                logger.error("No titles found. Please check the website structure.")
                return
            
            logger.info(f"Starting detailed scraping for {len(title_urls)} titles...")
            
            # Scrape details for each title
            titles_data = []
            for i, url in enumerate(title_urls, 1):
                logger.info(f"Progress: {i}/{len(title_urls)}")
                
                title_data = self.extract_title_details(url)
                titles_data.append(title_data)
                
                # Rate limiting
                time.sleep(1)
                
                # Save progress every 50 titles
                if i % 50 == 0:
                    self.save_to_csv(titles_data, f'toons_kr_titles_progress_{i}.csv')
                    logger.info(f"Progress saved: {i} titles processed")
            
            # Save final results
            self.save_to_csv(titles_data, 'toons_kr_titles_final.csv')
            
            # Save backup JSON
            with open('toons_kr_titles_backup.json', 'w', encoding='utf-8') as f:
                json.dump(titles_data, f, ensure_ascii=False, indent=2)
            
            logger.info(f"Scraping completed! Total titles: {len(titles_data)}")
            
            # Print summary
            successful = len([t for t in titles_data if t.get('title') != 'ERROR'])
            errors = len(titles_data) - successful
            
            print(f"\n=== SCRAPING SUMMARY ===")
            print(f"Total URLs found: {len(title_urls)}")
            print(f"Successfully scraped: {successful}")
            print(f"Errors: {errors}")
            print(f"Success rate: {(successful/len(titles_data)*100):.1f}%")
            print(f"Output files:")
            print(f"  - toons_kr_titles_final.csv")
            print(f"  - toons_kr_titles_backup.json")
            print(f"  - toons_scraper.log")
            
        except Exception as e:
            logger.error(f"Fatal error: {str(e)}")
            raise
        finally:
            if self.driver:
                self.driver.quit()
                logger.info("WebDriver closed")

def main():
    """Entry point"""
    scraper = ToonsKrScraper()
    scraper.run()

if __name__ == "__main__":
    main()