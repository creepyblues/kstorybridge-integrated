#!/usr/bin/env python3
"""
Simplified Toons.kr Scraper
Alternative approach using requests + BeautifulSoup for basic scraping
"""

import csv
import json
import requests
from bs4 import BeautifulSoup
import time
import re
import logging
from urllib.parse import urljoin, urlparse

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class SimpleToonsKrScraper:
    def __init__(self):
        self.base_url = "https://www.toons.kr"
        self.session = requests.Session()
        
        # Setup headers
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
        })

    def get_titles_from_api(self):
        """Try to find API endpoints or extract from page source"""
        titles = []
        
        # Try different potential endpoints
        api_endpoints = [
            "/api/toons",
            "/toons/list.json",
            "/api/webtoons",
            "/data/toons.json"
        ]
        
        for endpoint in api_endpoints:
            try:
                response = self.session.get(self.base_url + endpoint)
                if response.status_code == 200:
                    data = response.json()
                    if isinstance(data, list):
                        titles.extend(data)
                    elif isinstance(data, dict) and 'data' in data:
                        titles.extend(data['data'])
                    logger.info(f"Found API endpoint: {endpoint}")
                    break
            except:
                continue
        
        return titles

    def scrape_list_page(self):
        """Scrape the main list page"""
        try:
            response = self.session.get(self.base_url + "/toons/list")
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Find title links
            title_links = []
            
            # Try various selectors
            selectors = [
                'a[href*="/toons/"]',
                '.toon-item a',
                '.webtoon-item a',
                '.content-item a',
                '.title a'
            ]
            
            for selector in selectors:
                links = soup.select(selector)
                for link in links:
                    href = link.get('href')
                    if href and '/toons/' in href and '/toons/list' not in href:
                        full_url = urljoin(self.base_url, href)
                        if full_url not in title_links:
                            title_links.append(full_url)
            
            logger.info(f"Found {len(title_links)} titles from list page")
            return title_links
            
        except Exception as e:
            logger.error(f"Error scraping list page: {e}")
            return []

    def extract_title_details(self, url):
        """Extract details from title page"""
        try:
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            data = {
                'title': '',
                'url': url,
                'genre': '',
                'writer': '',
                'artist': '',
                'original': '',
                'featured': '',
                'pages': '',
                'characters': '',
                'synopsis': '',
                'cover_image': ''
            }
            
            # Extract title
            title_elem = soup.find('title')
            if title_elem:
                data['title'] = title_elem.get_text().replace(' - 툰즈', '').strip()
            
            # Try h1 if title is empty
            if not data['title']:
                h1 = soup.find('h1')
                if h1:
                    data['title'] = h1.get_text().strip()
            
            # Extract meta description as synopsis
            meta_desc = soup.find('meta', attrs={'name': 'description'})
            if meta_desc:
                data['synopsis'] = meta_desc.get('content', '').strip()
            
            # Extract og:image as cover
            og_image = soup.find('meta', attrs={'property': 'og:image'})
            if og_image:
                img_url = og_image.get('content', '')
                if img_url and not img_url.startswith('http'):
                    img_url = urljoin(self.base_url, img_url)
                data['cover_image'] = img_url
            
            # Look for info sections
            text_content = soup.get_text()
            
            # Extract genre
            genre_match = re.search(r'장르[:\s]*([^\n]+)', text_content)
            if genre_match:
                data['genre'] = genre_match.group(1).strip()
            
            # Extract writer
            writer_patterns = [r'글[:\s]*([^\n]+)', r'작가[:\s]*([^\n]+)']
            for pattern in writer_patterns:
                match = re.search(pattern, text_content)
                if match:
                    data['writer'] = match.group(1).strip()
                    break
            
            # Extract artist
            artist_match = re.search(r'그림[:\s]*([^\n]+)', text_content)
            if artist_match:
                data['artist'] = artist_match.group(1).strip()
            
            # Extract original
            original_match = re.search(r'원작[:\s]*([^\n]+)', text_content)
            if original_match:
                data['original'] = original_match.group(1).strip()
            
            # Check for featured/premium
            if any(word in text_content.lower() for word in ['featured', 'premium', '프리미엄']):
                data['featured'] = 'Yes'
            
            # Extract page/episode count
            page_match = re.search(r'(\d+)화', text_content)
            if page_match:
                data['pages'] = page_match.group(1)
            
            logger.info(f"Scraped: {data['title']}")
            return data
            
        except Exception as e:
            logger.error(f"Error scraping {url}: {e}")
            return {
                'title': 'ERROR',
                'url': url,
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

    def save_to_csv(self, data, filename='toons_simple.csv'):
        """Save to CSV"""
        fieldnames = [
            'title', 'url', 'genre', 'writer', 'artist', 'original',
            'featured', 'pages', 'characters', 'synopsis', 'cover_image'
        ]
        
        with open(filename, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            for row in data:
                clean_row = {k: v for k, v in row.items() if k in fieldnames}
                writer.writerow(clean_row)
        
        logger.info(f"Saved to {filename}")

    def run(self):
        """Main execution"""
        logger.info("Starting simple toons.kr scraper...")
        
        # Get title URLs
        title_urls = self.scrape_list_page()
        
        if not title_urls:
            logger.error("No titles found")
            return
        
        # Scrape each title
        results = []
        for i, url in enumerate(title_urls, 1):
            logger.info(f"Progress: {i}/{len(title_urls)}")
            
            data = self.extract_title_details(url)
            results.append(data)
            
            time.sleep(0.5)  # Rate limiting
        
        # Save results
        self.save_to_csv(results, 'toons_kr_simple.csv')
        
        with open('toons_kr_simple.json', 'w', encoding='utf-8') as f:
            json.dump(results, f, ensure_ascii=False, indent=2)
        
        successful = len([r for r in results if r['title'] != 'ERROR'])
        print(f"\nCompleted! {successful}/{len(results)} titles scraped successfully")

if __name__ == "__main__":
    scraper = SimpleToonsKrScraper()
    scraper.run()