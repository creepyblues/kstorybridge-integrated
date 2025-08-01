#!/usr/bin/env python3
"""
Naver Webtoon Scraper using Selenium
Scrapes title information from Naver Webtoon website using browser automation
"""

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.common.exceptions import TimeoutException, NoSuchElementException
import json
import re
import time
from typing import List, Dict, Optional

class NaverWebtoonSeleniumScraper:
    def __init__(self, headless: bool = True):
        self.base_url = "https://comic.naver.com"
        self.driver = None
        self.setup_driver(headless)
    
    def setup_driver(self, headless: bool):
        """Setup Chrome WebDriver"""
        chrome_options = Options()
        if headless:
            chrome_options.add_argument("--headless")
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--disable-blink-features=AutomationControlled")
        chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
        chrome_options.add_experimental_option('useAutomationExtension', False)
        chrome_options.add_argument("--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
        
        try:
            self.driver = webdriver.Chrome(options=chrome_options)
            self.driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
        except Exception as e:
            print(f"Error setting up Chrome driver: {e}")
            print("Please make sure ChromeDriver is installed: brew install chromedriver")
            raise
    
    def get_title_links(self, limit: Optional[int] = None) -> List[str]:
        """Get title links from the main webtoon page"""
        urls_to_try = [
            "https://comic.naver.com/webtoon/weekday",
            "https://comic.naver.com/webtoon"
        ]
        
        for url in urls_to_try:
            try:
                print(f"Trying URL: {url}")
                self.driver.get(url)
                
                # Wait for page to load
                WebDriverWait(self.driver, 10).until(
                    EC.presence_of_element_located((By.TAG_NAME, "body"))
                )
                
                # Look for webtoon links
                title_links = []
                
                # Try different selectors for webtoon links
                selectors = [
                    "a[href*='titleId=']",
                    "a[href*='webtoon/list']",
                    ".thumb a",
                    ".title a"
                ]
                
                for selector in selectors:
                    try:
                        elements = self.driver.find_elements(By.CSS_SELECTOR, selector)
                        print(f"Found {len(elements)} elements with selector '{selector}'")
                        
                        for element in elements:
                            href = element.get_attribute('href')
                            if href and 'titleId=' in href:
                                clean_url = self.clean_title_url(href)
                                if clean_url and clean_url not in title_links:
                                    title_links.append(clean_url)
                                    print(f"Found title link: {clean_url}")
                    except Exception as e:
                        print(f"Error with selector {selector}: {e}")
                        continue
                
                if title_links:
                    print(f"Found {len(title_links)} title links from {url}")
                    if limit:
                        title_links = title_links[:limit]
                    return title_links
                    
            except Exception as e:
                print(f"Error fetching from {url}: {e}")
                continue
        
        # Fallback to sample links for testing
        print("No links found, using sample links for testing...")
        sample_links = [
            "https://comic.naver.com/webtoon/list?titleId=183559",  # 신의 탑 (Tower of God)
            "https://comic.naver.com/webtoon/list?titleId=626907",  # 외모지상주의 (Lookism)
            "https://comic.naver.com/webtoon/list?titleId=570503",  # 여신강림 (True Beauty)
            "https://comic.naver.com/webtoon/list?titleId=748105",  # 화산귀환 (Return of the Mount Hua Sect)
            "https://comic.naver.com/webtoon/list?titleId=819217",  # 가비지타임 (Garbage Time)
            "https://comic.naver.com/webtoon/list?titleId=22897",   # 마음의소리 (Sound of Heart)
            "https://comic.naver.com/webtoon/list?titleId=335885",  # 갓 오브 하이스쿨 (The God of High School)
            "https://comic.naver.com/webtoon/list?titleId=597447",  # 독립일기 (Independence Log)
            "https://comic.naver.com/webtoon/list?titleId=679519",  # 유미의 세포들 (Yumi's Cells)  
            "https://comic.naver.com/webtoon/list?titleId=710751"   # 나 혼자만 레벨업 (Solo Leveling)
        ]
        
        if limit:
            sample_links = sample_links[:limit]
        
        return sample_links
    
    def clean_title_url(self, url: str) -> str:
        """Remove tab parameter from URL"""
        if '&tab=' in url:
            url = url.split('&tab=')[0]
        return url
    
    def scrape_title_info(self, title_url: str) -> Dict:
        """Scrape detailed information from a title page"""
        try:
            print(f"Scraping: {title_url}")
            self.driver.get(title_url)
            
            # Wait for page to load
            WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.TAG_NAME, "body"))
            )
            
            # Additional wait to let JavaScript execute
            time.sleep(3)
            
            # Optional: Take a screenshot for debugging (disabled for speed)
            # screenshot_path = f"debug_screenshot_{title_url.split('titleId=')[1]}.png" 
            # self.driver.save_screenshot(screenshot_path)
            # print(f"  Screenshot saved: {screenshot_path}")
            
            title_data = {
                'url': title_url,
                'title_image': None,
                'title_name_kr': None,
                'art_author': None,
                'story_author': None,
                'original_author_kr': None,
                'likes': None,
                'tagline': None,
                'tags': [],
                'age_rating': None
            }
            
            # Extract title image - look for large images that could be covers
            all_images = self.driver.find_elements(By.TAG_NAME, "img")
            print(f"  Found {len(all_images)} images total")
            
            for img in all_images:
                src = img.get_attribute('src')
                alt = img.get_attribute('alt') or ""
                
                # Look for cover/thumbnail images
                if (src and ('thumb' in src.lower() or 'cover' in src.lower() or 
                            'title' in alt.lower() or '썸네일' in alt)):
                    title_data['title_image'] = src
                    print(f"  Found cover image: {src}")
                    break
            
            # Fallback to specific selectors
            if not title_data['title_image']:
                img_selectors = [
                    ".thumb img",
                    ".cover img", 
                    ".titleImg img",
                    "img[alt*='썸네일']",
                    ".comic_info .thumb img"
                ]
                
                for selector in img_selectors:
                    try:
                        img_element = self.driver.find_element(By.CSS_SELECTOR, selector)
                        src = img_element.get_attribute('src')
                        if src:
                            title_data['title_image'] = src
                            print(f"  Found image with selector '{selector}': {src}")
                            break
                    except NoSuchElementException:
                        continue
            
            # Extract title name
            title_selectors = [
                "h1",
                "h2", 
                ".comicinfo .detail h2",
                ".comic_info h2",
                ".title_area h2",
                "h2.title",
                ".titleArea h2",
                ".ContentTitle h2",
                ".WebtoonTitleHeader h1"
            ]
            
            # First, let's see what h1 and h2 elements exist
            all_h1_h2 = self.driver.find_elements(By.CSS_SELECTOR, "h1, h2")
            print(f"  Found {len(all_h1_h2)} h1/h2 elements:")
            for i, elem in enumerate(all_h1_h2[:5]):  # Show first 5
                text = elem.text.strip()
                if text:
                    print(f"    {i+1}: {text[:50]}...")
            
            # Look for the actual webtoon title from the h1/h2 elements we found
            for elem in all_h1_h2:
                text = elem.text.strip()
                # Skip navigation elements and look for actual webtoon titles
                if (text and len(text) > 2 and len(text) < 100 and 
                    'NAVER' not in text and '웹툰' not in text and 
                    '웹소설' not in text and '시리즈' not in text and
                    '관련 상품' not in text and '작가의 다른 작품' not in text and
                    '독자들이 많이 본' not in text):
                    # Clean up the title by removing status indicators
                    clean_title = re.sub(r'\n(휴재|완결|신작|UP).*$', '', text).strip()
                    title_data['title_name_kr'] = clean_title
                    print(f"  Found title: {clean_title}")
                    break
            
            # Fallback to selectors if no title found
            if not title_data['title_name_kr']:
                for selector in title_selectors:
                    try:
                        title_element = self.driver.find_element(By.CSS_SELECTOR, selector)
                        title_text = title_element.text.strip()
                        if title_text and len(title_text) > 2:
                            title_data['title_name_kr'] = title_text
                            print(f"  Found title with selector '{selector}': {title_text}")
                            break
                    except NoSuchElementException:
                        continue
            
            # Get all text content for pattern matching
            all_text = self.driver.find_element(By.TAG_NAME, "body").text
            
            # Debug: Look for specific author patterns in the text
            print(f"  Looking for author information...")
            
            # Extract authors using regex patterns with more specific matching
            author_patterns = {
                'art_author': [
                    r'그림\s*[:：]\s*([가-힣a-zA-Z\s]+?)(?=\s|$|\n|/|그림|글|원작)',
                    r'그림\s+([가-힣a-zA-Z\s]+?)(?=\s|$|\n|/|그림|글|원작)'
                ],
                'story_author': [
                    r'글\s*[:：]\s*([가-힣a-zA-Z\s]+?)(?=\s|$|\n|/|그림|글|원작)',
                    r'글\s+([가-힣a-zA-Z\s]+?)(?=\s|$|\n|/|그림|글|원작)'
                ],
                'original_author_kr': [
                    r'원작\s*[:：]\s*([가-힣a-zA-Z\s]+?)(?=\s|$|\n|/|그림|글|원작)',
                    r'원작\s+([가-힣a-zA-Z\s]+?)(?=\s|$|\n|/|그림|글|원작)'
                ]
            }
            
            for field, patterns in author_patterns.items():
                for pattern in patterns:
                    matches = re.findall(pattern, all_text)
                    for match in matches:
                        author_name = match.strip()
                        # Filter out unwanted text
                        if (author_name and len(author_name) > 1 and len(author_name) < 50 and 
                            not re.match(r'^\d+화', author_name) and
                            '완결' not in author_name and '휴재' not in author_name and
                            '이벤트' not in author_name and '안내' not in author_name and
                            '확인' not in author_name and '필요' not in author_name and
                            '당첨' not in author_name):
                            title_data[field] = author_name
                            print(f"  Found {field}: {author_name}")
                            break
                if title_data[field]:
                    break
            
            # Extract likes
            like_patterns = [r'\+관심\s*(\d+)', r'관심\s*(\d+)', r'좋아요\s*(\d+)']
            for pattern in like_patterns:
                like_match = re.search(pattern, all_text)
                if like_match:
                    title_data['likes'] = int(like_match.group(1))
                    print(f"  Found likes: {title_data['likes']}")
                    break
            
            # Extract age rating
            age_patterns = [r'(\d+)세\s*이용가', r'(\d+)세\s*관람가']
            for pattern in age_patterns:
                age_match = re.search(pattern, all_text)
                if age_match:
                    title_data['age_rating'] = f"{age_match.group(1)}세 이용가"
                    print(f"  Found age rating: {title_data['age_rating']}")
                    break
            
            # Extract tags
            tag_matches = re.findall(r'#[가-힣a-zA-Z0-9_]+', all_text)
            if tag_matches:
                title_data['tags'] = list(set(tag_matches))
                print(f"  Found tags: {title_data['tags']}")
            
            # Extract summary/tagline
            summary_selectors = [
                ".detail .summary",
                ".comic_info .summary", 
                ".description",
                ".intro"
            ]
            
            for selector in summary_selectors:
                try:
                    summary_element = self.driver.find_element(By.CSS_SELECTOR, selector)
                    summary_text = summary_element.text.strip()
                    if summary_text and len(summary_text) > 10:
                        title_data['tagline'] = summary_text
                        print(f"  Found tagline: {summary_text[:50]}...")
                        break
                except NoSuchElementException:
                    continue
            
            return title_data
            
        except Exception as e:
            print(f"Error scraping title {title_url}: {e}")
            return {'url': title_url, 'error': str(e)}
    
    def scrape_titles(self, limit: int = 10) -> List[Dict]:
        """Scrape multiple titles with rate limiting"""
        title_links = self.get_title_links(limit)
        print(f"Found {len(title_links)} title links")
        
        results = []
        for i, link in enumerate(title_links):
            print(f"Scraping title {i+1}/{len(title_links)}: {link}")
            title_data = self.scrape_title_info(link)
            results.append(title_data)
            
            # Rate limiting
            if i < len(title_links) - 1:
                time.sleep(2)
        
        return results
    
    def close(self):
        """Close the webdriver"""
        if self.driver:
            self.driver.quit()

def main():
    """Main function to run the scraper"""
    scraper = None
    try:
        scraper = NaverWebtoonSeleniumScraper(headless=False)  # Set to False to see browser
        
        print("Starting Naver Webtoon Selenium scraper...")
        print("Scraping first 10 titles for validation...")
        
        results = scraper.scrape_titles(limit=10)
        
        # Save results to JSON file
        output_file = "naver_webtoon_selenium_results.json"
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(results, f, ensure_ascii=False, indent=2)
        
        print(f"\nScraping complete! Results saved to {output_file}")
        print(f"Successfully scraped {len(results)} titles")
        
        # Display summary
        for i, title in enumerate(results[:3]):
            print(f"\nTitle {i+1}:")
            print(f"  Name: {title.get('title_name_kr', 'N/A')}")
            print(f"  Authors: Art: {title.get('art_author', 'N/A')}, Story: {title.get('story_author', 'N/A')}")
            print(f"  Age Rating: {title.get('age_rating', 'N/A')}")
            print(f"  Tags: {title.get('tags', [])}")
            print(f"  Error: {title.get('error', 'None')}")
            
    except Exception as e:
        print(f"Error running scraper: {e}")
    finally:
        if scraper:
            scraper.close()

if __name__ == "__main__":
    main()