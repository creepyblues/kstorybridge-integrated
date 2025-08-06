#!/usr/bin/env python3
"""
Focused Webtoon Scraper for KakaoPage and NAVER Series
Extracts title, views, likes, and completion status from specific platforms
"""

import requests
from bs4 import BeautifulSoup
import pandas as pd
import json
import time
import random
import re
from datetime import datetime
import logging
from urllib.parse import urlparse
import os

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('webtoon_scraper.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class WebtoonScraper:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
        })
        self.results = []
        
    def delay(self, min_seconds=1, max_seconds=3):
        """Add random delay between requests to be respectful"""
        delay_time = random.uniform(min_seconds, max_seconds)
        time.sleep(delay_time)
        
    def clean_text(self, text):
        """Clean and normalize text"""
        if not text:
            return ""
        # Remove extra whitespace and normalize
        text = re.sub(r'\s+', ' ', text.strip())
        return text
        
    def parse_korean_number(self, text):
        """Parse Korean number format (e.g., '4.1만' -> 41000, '3.2천' -> 3200)"""
        if not text or not isinstance(text, str):
            return 0
            
        text = text.strip()
        
        # Handle '만' (10,000)
        if '만' in text:
            number = text.replace('만', '')
            try:
                return int(float(number) * 10000)
            except ValueError:
                return 0
                
        # Handle '천' (1,000)
        elif '천' in text:
            number = text.replace('천', '')
            try:
                return int(float(number) * 1000)
            except ValueError:
                return 0
                
        # Handle plain numbers
        else:
            try:
                return int(float(text))
            except ValueError:
                return 0
                
    def extract_korean_numbers_from_text(self, text):
        """Extract Korean numbers from text using regex"""
        # Pattern to match Korean numbers: digits + optional decimal + optional 만/천
        pattern = r'(\d+\.?\d*)(만|천)?'
        matches = re.findall(pattern, text)
        
        results = []
        for match in matches:
            number_str = match[0]
            unit = match[1] if len(match) > 1 else ''
            full_number = number_str + unit
            parsed_value = self.parse_korean_number(full_number)
            results.append({
                'text': full_number,
                'value': parsed_value,
                'original': full_number
            })
        return results
        
    def scrape_naver_series(self, url):
        """Scrape NAVER Series webtoon page"""
        try:
            logger.info(f"Scraping NAVER Series: {url}")
            response = self.session.get(url)
            response.raise_for_status()
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Extract title
            title = ""
            title_selectors = [
                'h2.title', 'h3.title', '.title', 'h1', 
                '.webtoon_title', '.series_title', '.product_title'
            ]
            for selector in title_selectors:
                title_elem = soup.select_one(selector)
                if title_elem:
                    title = self.clean_text(title_elem.get_text())
                    break
                    
            # If no title found, try to extract from meta tags
            if not title:
                meta_title = soup.find('meta', property='og:title')
                if meta_title:
                    title = meta_title.get('content', '')
                    
            # Extract all text and find Korean numbers
            all_text = soup.get_text()
            korean_numbers = self.extract_korean_numbers_from_text(all_text)
            
            # Extract views (downloads in NAVER Series)
            views = 0
            # Look for download count patterns
            download_patterns = [
                r'(\d+\.?\d*)(만|천)?\s*다운로드',
                r'다운로드\s*(\d+\.?\d*)(만|천)?',
                r'(\d+\.?\d*)(만|천)?\s*회',
                r'조회\s*(\d+\.?\d*)(만|천)?'
            ]
            
            for pattern in download_patterns:
                matches = re.findall(pattern, all_text, re.IGNORECASE)
                if matches:
                    for match in matches:
                        number_str = match[0]
                        unit = match[1] if len(match) > 1 else ''
                        full_number = number_str + unit
                        views = self.parse_korean_number(full_number)
                        if views > 0:
                            logger.info(f"Found views: {full_number} -> {views}")
                            break
                    if views > 0:
                        break
                        
            # Extract likes (interest/follow count)
            likes = 0
            # Look for interest/like count patterns
            like_patterns = [
                r'(\d+\.?\d*)(만|천)?\s*관심',
                r'관심\s*(\d+\.?\d*)(만|천)?',
                r'(\d+\.?\d*)(만|천)?\s*좋아요',
                r'좋아요\s*(\d+\.?\d*)(만|천)?'
            ]
            
            for pattern in like_patterns:
                matches = re.findall(pattern, all_text, re.IGNORECASE)
                if matches:
                    for match in matches:
                        number_str = match[0]
                        unit = match[1] if len(match) > 1 else ''
                        full_number = number_str + unit
                        likes = self.parse_korean_number(full_number)
                        if likes > 0:
                            logger.info(f"Found likes: {full_number} -> {likes}")
                            break
                    if likes > 0:
                        break
                        
            # Extract completion status
            completed = "연재중"  # Default to ongoing
            if '완결' in all_text:
                completed = '완결'
                logger.info(f"Found completion status: {completed}")
            elif '연재중' in all_text:
                completed = '연재중'
                logger.info(f"Found completion status: {completed}")
                        
            return {
                'title_url': url,
                'title_name_kr': title,
                'views': views,
                'likes': likes,
                'completed': completed
            }
            
        except Exception as e:
            logger.error(f"Error scraping NAVER Series {url}: {e}")
            return {
                'title_url': url,
                'title_name_kr': 'Error',
                'views': 0,
                'likes': 0,
                'completed': 'Error'
            }
            
    def scrape_kakao_page(self, url):
        """Scrape KakaoPage webtoon page"""
        try:
            logger.info(f"Scraping KakaoPage: {url}")
            response = self.session.get(url)
            response.raise_for_status()
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Extract title
            title = ""
            title_selectors = [
                'h1.title', 'h2.title', 'h3.title', '.title', 
                '.webtoon_title', '.content_title', '.product_title'
            ]
            for selector in title_selectors:
                title_elem = soup.select_one(selector)
                if title_elem:
                    title = self.clean_text(title_elem.get_text())
                    break
                    
            # If no title found, try to extract from meta tags
            if not title:
                meta_title = soup.find('meta', property='og:title')
                if meta_title:
                    title = meta_title.get('content', '')
                    
            # Extract all text and find Korean numbers
            all_text = soup.get_text()
            korean_numbers = self.extract_korean_numbers_from_text(all_text)
            
            # Extract views
            views = 0
            # Look for view count patterns
            view_patterns = [
                r'(\d+\.?\d*)(만|천)?\s*조회',
                r'조회\s*(\d+\.?\d*)(만|천)?',
                r'(\d+\.?\d*)(만|천)?\s*뷰',
                r'뷰\s*(\d+\.?\d*)(만|천)?'
            ]
            
            for pattern in view_patterns:
                matches = re.findall(pattern, all_text, re.IGNORECASE)
                if matches:
                    for match in matches:
                        number_str = match[0]
                        unit = match[1] if len(match) > 1 else ''
                        full_number = number_str + unit
                        views = self.parse_korean_number(full_number)
                        if views > 0:
                            logger.info(f"Found views: {full_number} -> {views}")
                            break
                    if views > 0:
                        break
                        
            # Extract likes (rating in KakaoPage)
            likes = 0
            # Look for rating patterns
            rating_patterns = [
                r'평점\s*(\d+\.?\d*)',
                r'(\d+\.?\d*)\s*평점',
                r'별점\s*(\d+\.?\d*)',
                r'(\d+\.?\d*)\s*별점'
            ]
            
            for pattern in rating_patterns:
                matches = re.findall(pattern, all_text, re.IGNORECASE)
                if matches:
                    for match in matches:
                        try:
                            likes = float(match)
                            logger.info(f"Found rating: {match} -> {likes}")
                            break
                        except ValueError:
                            continue
                    if likes > 0:
                        break
                        
            # Extract completion status
            completed = "연재중"  # Default to ongoing
            if '완결' in all_text:
                completed = '완결'
                logger.info(f"Found completion status: {completed}")
            elif '연재중' in all_text:
                completed = '연재중'
                logger.info(f"Found completion status: {completed}")
                        
            return {
                'title_url': url,
                'title_name_kr': title,
                'views': views,
                'likes': likes,
                'completed': completed
            }
            
        except Exception as e:
            logger.error(f"Error scraping KakaoPage {url}: {e}")
            return {
                'title_url': url,
                'title_name_kr': 'Error',
                'views': 0,
                'likes': 0,
                'completed': 'Error'
            }
            
    def scrape_url(self, url):
        """Determine platform and scrape accordingly"""
        parsed_url = urlparse(url)
        
        if 'series.naver.com' in parsed_url.netloc:
            return self.scrape_naver_series(url)
        elif 'page.kakao.com' in parsed_url.netloc:
            return self.scrape_kakao_page(url)
        else:
            logger.warning(f"Unknown platform for URL: {url}")
            return {
                'title_url': url,
                'title_name_kr': 'Unknown Platform',
                'views': 0,
                'likes': 0,
                'completed': 'Unknown'
            }
            
    def scrape_urls(self, urls):
        """Scrape multiple URLs"""
        logger.info(f"Starting to scrape {len(urls)} URLs...")
        
        for i, url in enumerate(urls, 1):
            logger.info(f"Processing URL {i}/{len(urls)}: {url}")
            
            result = self.scrape_url(url)
            self.results.append(result)
            
            # Add delay between requests
            if i < len(urls):  # Don't delay after the last request
                self.delay()
                
        logger.info(f"Completed scraping {len(self.results)} URLs")
        
    def save_results(self, filename=None):
        """Save results to CSV file"""
        if not filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"webtoon_data_{timestamp}"
            
        # Save as CSV
        df = pd.DataFrame(self.results)
        csv_filename = f"{filename}.csv"
        df.to_csv(csv_filename, index=False, encoding='utf-8')
        logger.info(f"Results saved to CSV: {csv_filename}")
        
        # Print summary
        print(f"\n📊 Scraping Summary:")
        print(f"   Total URLs scraped: {len(self.results)}")
        print(f"   CSV file: {csv_filename}")
        
        if self.results:
            # Show sample data
            print(f"\n📝 Results Preview:")
            for i, result in enumerate(self.results[:3], 1):
                print(f"   {i}. {result['title_name_kr']} - Views: {result['views']:,}, Likes: {result['likes']}, Status: {result['completed']}")
                
            # Show statistics
            successful_scrapes = [r for r in self.results if r['title_name_kr'] not in ['Error', 'Unknown Platform']]
            print(f"\n📈 Statistics:")
            print(f"   Successful scrapes: {len(successful_scrapes)}/{len(self.results)}")
            
            if successful_scrapes:
                total_views = sum(r['views'] for r in successful_scrapes)
                avg_likes = sum(r['likes'] for r in successful_scrapes) / len(successful_scrapes)
                print(f"   Total views: {total_views:,}")
                print(f"   Average likes: {avg_likes:.2f}")

def main():
    """Main function to run the scraper"""
    print("🚀 Starting Focused Webtoon Scraper...")
    print("=" * 50)
    
    # Test URLs
    test_urls = [
        "https://series.naver.com/comic/detail.series?productNo=6393990",
        "https://series.naver.com/comic/detail.series?productNo=9478408",
        "https://series.naver.com/comic/detail.series?productNo=6362438",
        "https://page.kakao.com/content/53764524",
        "https://page.kakao.com/content/58439503?orderby=asc",
        "https://page.kakao.com/content/56453386",
        "https://page.kakao.com/content/67242927"
    ]
    
    scraper = WebtoonScraper()
    
    try:
        # Scrape the test URLs
        scraper.scrape_urls(test_urls)
        
        # Save results
        scraper.save_results()
        
        print("\n✅ Scraping completed successfully!")
        
    except KeyboardInterrupt:
        print("\n⚠️  Scraping interrupted by user")
        if scraper.results:
            scraper.save_results("webtoon_data_interrupted")
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        print(f"\n❌ Error occurred: {e}")
        if scraper.results:
            scraper.save_results("webtoon_data_error")

if __name__ == "__main__":
    main() 