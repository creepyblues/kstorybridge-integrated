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
                
                # Additional wait for dynamic content
                time.sleep(3)
                
                # Look for "요일별 전체 웹툰" section first
                title_links = []
                weekday_section_found = False
                
                try:
                    # Find the "요일별 전체 웹툰" heading or similar
                    page_text = self.driver.find_element(By.TAG_NAME, "body").text
                    if "요일별 전체 웹툰" in page_text or "요일별" in page_text:
                        print("Found weekday section indicator")
                        weekday_section_found = True
                except:
                    print("Weekday section text not found, proceeding with general search")
                
                # Get all links that contain titleId
                all_links = self.driver.find_elements(By.CSS_SELECTOR, "a[href*='titleId=']")
                print(f"Found {len(all_links)} total links with titleId")
                
                # If we found weekday section, try to filter links that appear after it
                if weekday_section_found:
                    # Look for elements containing "요일별" text
                    try:
                        weekday_elements = self.driver.find_elements(By.XPATH, "//*[contains(text(), '요일별')]")
                        if weekday_elements:
                            weekday_element = weekday_elements[0]
                            print(f"Found weekday section element: {weekday_element.text[:50]}...")
                            
                            # Get all titleId links that come after this element in the DOM
                            following_links = self.driver.find_elements(By.XPATH, 
                                f"//*[contains(text(), '요일별')]/following::*//a[contains(@href, 'titleId=')]")
                            print(f"Found {len(following_links)} links after weekday section")
                            
                            if following_links:
                                all_links = following_links  # Get all available titles, no limit
                    except Exception as e:
                        print(f"Error finding weekday section: {e}")
                
                # Process the links
                for element in all_links:
                    try:
                        href = element.get_attribute('href')
                        if href and 'titleId=' in href and '/webtoon/list' in href:
                            # Keep the entire URL including &tab= parameters
                            if href not in title_links:
                                title_links.append(href)
                                print(f"Found title link: {href}")
                    except Exception as e:
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
            "https://comic.naver.com/webtoon/list?titleId=710751",  # 나 혼자만 레벨업 (Solo Leveling)
            "https://comic.naver.com/webtoon/list?titleId=654774",  # 참교육 (True Education)
            "https://comic.naver.com/webtoon/list?titleId=758037",  # 재벌집 막내아들 (The Youngest Son of a Conglomerate)
            "https://comic.naver.com/webtoon/list?titleId=783054",  # 김부장 (Manager Kim)
            "https://comic.naver.com/webtoon/list?titleId=779809",  # 나노마신 (Nano Machine)
            "https://comic.naver.com/webtoon/list?titleId=822042",  # 템빨 (Item Mall)
            "https://comic.naver.com/webtoon/list?titleId=818093",  # 내가 키운 S급들 (The S-Classes That I Raised)
            "https://comic.naver.com/webtoon/list?titleId=796268",  # 갓겜 (God Game)
            "https://comic.naver.com/webtoon/list?titleId=747269",  # 싸움독학 (Viral Hit)
            "https://comic.naver.com/webtoon/list?titleId=789766",  # 견습 용사 알바 신청서 (Part-time Hero)
            "https://comic.naver.com/webtoon/list?titleId=759833",  # 나는 계급장이다 (I Am the Rank)
            "https://comic.naver.com/webtoon/list?titleId=671674",  # 하이브 (Hive)
            "https://comic.naver.com/webtoon/list?titleId=725110",  # 프리스트 (Priest)
            "https://comic.naver.com/webtoon/list?titleId=799893",  # 체인소우맨 (Chainsaw Man)
            "https://comic.naver.com/webtoon/list?titleId=832351",  # 무한전생 (Infinite Reincarnation)
            "https://comic.naver.com/webtoon/list?titleId=839004",  # 아가씨를 부탁해 (Please Take Care of the Lady)
            "https://comic.naver.com/webtoon/list?titleId=815094",  # 스위트홈 (Sweet Home)
            "https://comic.naver.com/webtoon/list?titleId=789766",  # 견습 용사 알바 신청서
            "https://comic.naver.com/webtoon/list?titleId=794456",  # 킬러분식 (Killer Snack Bar)
            "https://comic.naver.com/webtoon/list?titleId=822856",  # 헬창 (Hell Chang)
            "https://comic.naver.com/webtoon/list?titleId=836447"   # 윈드브레이커 (Wind Breaker)
        ]
        
        if limit:
            sample_links = sample_links[:limit]
        
        return sample_links
    
    def clean_title_url(self, url: str) -> str:
        """Keep the URL as is, including tab parameter"""
        # Just ensure it's a full URL
        if url.startswith('/'):
            url = urljoin(self.base_url, url)
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
            # Handle combined 글/그림 (same person for art and story) - name appears BEFORE 글/그림
            combined_author_match = re.search(r'([가-힣a-zA-Z]+)\s*∙?\s*글/그림', all_text)
            if combined_author_match:
                author_name = combined_author_match.group(1).strip()
                if author_name and len(author_name) < 20:  # Korean names are typically shorter
                    title_data['art_author'] = author_name
                    title_data['story_author'] = author_name
                    print(f"  Found combined art/story author: {author_name}")
            else:
                # Try individual patterns if no combined author found
                author_patterns = {
                    'art_author': [
                        # Format: "name ∙ 그림" (name before role)
                        r'([가-힣a-zA-Z]+)\s*∙\s*그림',
                        # Format: "그림: name" or "그림 name" (role before name)
                        r'그림\s*[:：]?\s*([가-힣a-zA-Z]+)(?=\s|$|\n|/|그림|글|원작|전체연령|세\s*이용가)',
                        r'그림\s+([가-힣a-zA-Z]+)(?=\s|$|\n|/|그림|글|원작|전체연령|세\s*이용가)'
                    ],
                    'story_author': [
                        # Format: "name ∙ 글" (name before role)
                        r'([가-힣a-zA-Z]+)\s*∙\s*글',
                        # Format: "글: name" or "글 name" (role before name)
                        r'글\s*[:：]?\s*([가-힣a-zA-Z]+)(?=\s|$|\n|/|그림|글|원작|전체연령|세\s*이용가)',
                        r'글\s+([가-힣a-zA-Z]+)(?=\s|$|\n|/|그림|글|원작|전체연령|세\s*이용가)'
                    ]
                }
                
                for field, patterns in author_patterns.items():
                    found_author = False
                    for pattern in patterns:
                        if found_author:  # Skip remaining patterns if we already found a valid author
                            break
                        matches = re.findall(pattern, all_text)
                        for match in matches:
                            author_name = match.strip()
                            # Filter out unwanted text - Korean names are typically 2-4 characters
                            if (author_name and len(author_name) > 1 and len(author_name) < 20 and 
                                not re.match(r'^\d+화', author_name) and
                                '완결' not in author_name and '휴재' not in author_name and
                                '이벤트' not in author_name and '안내' not in author_name and
                                '확인' not in author_name and '필요' not in author_name and
                                '당첨' not in author_name and '월요웹툰' not in author_name and
                                '금요웹툰' not in author_name):
                                title_data[field] = author_name
                                print(f"  Found {field}: {author_name}")
                                found_author = True
                                break
            
            # Extract original author
            original_author_patterns = [
                # Format: "name ∙ 원작" (name before role)
                r'([가-힣a-zA-Z]+)\s*∙\s*원작',
                # Format: "원작: name" or "원작 name" (role before name)
                r'원작\s*[:：]?\s*([가-힣a-zA-Z\s]+?)(?=\s|$|\n|전체연령|세\s*이용가|글|그림)',
                r'원작\s+([가-힣a-zA-Z\s]+?)(?=\s|$|\n|전체연령|세\s*이용가|글|그림)'
            ]
            
            for pattern in original_author_patterns:
                matches = re.findall(pattern, all_text)
                for match in matches:
                    author_name = match.strip()
                    if (author_name and len(author_name) > 1 and len(author_name) < 50 and 
                        not re.match(r'^\d+화', author_name)):
                        title_data['original_author_kr'] = author_name
                        print(f"  Found original_author_kr: {author_name}")
                        break
                if title_data['original_author_kr']:
                    break
            
            # Extract likes - handle numbers with commas
            like_patterns = [r'\+관심\s*([\d,]+)', r'관심\s*([\d,]+)', r'좋아요\s*([\d,]+)']
            for pattern in like_patterns:
                like_match = re.search(pattern, all_text)
                if like_match:
                    # Remove commas and convert to int
                    likes_str = like_match.group(1).replace(',', '')
                    title_data['likes'] = int(likes_str)
                    print(f"  Found likes: {title_data['likes']}")
                    break
            
            # Extract age rating
            age_patterns = [
                r'전체연령가',  # All ages
                r'(\d+)세\s*이용가', 
                r'(\d+)세\s*관람가'
            ]
            for pattern in age_patterns:
                age_match = re.search(pattern, all_text)
                if age_match:
                    if pattern == r'전체연령가':
                        title_data['age_rating'] = "전체연령가"
                    else:
                        title_data['age_rating'] = f"{age_match.group(1)}세 이용가"
                    print(f"  Found age rating: {title_data['age_rating']}")
                    break
            
            # Extract tags
            tag_matches = re.findall(r'#[가-힣a-zA-Z0-9_]+', all_text)
            if tag_matches:
                title_data['tags'] = list(set(tag_matches))
                print(f"  Found tags: {title_data['tags']}")
            
            # Extract tagline/summary - text between age rating and hashtags
            # First try to find text that appears between age rating and tags (most accurate)
            tagline_patterns = [
                # Pattern: age_rating ... tagline ... #tags
                r'(?:전체연령가|(?:\d+)세\s*이용가)\s+([^#]*?)(?=\s*#|$)',
                # Long multi-paragraph storylines (for webtoons like the third example) 
                r'무공에 미친[^#]{50,800}(?=#|$)',  # Specific pattern for martial arts stories
                r'([가-힣][^#]{100,800}(?:\.|\?)(?:\s*[가-힣][^#]{50,400}(?:\.|\?))*)',  # Multi-sentence Korean descriptions
                r'\"([^\"]{20,300})\"',  # Text in quotes - expanded range
                r'\"([^\"]*(?:\([^)]*\))*[^\"]{20,300})\"',  # Text in quotes with parentheses  
                r'나는\s+([^.]{30,200}\.)',  # Text starting with "나는" (I am/I...)
                r'그\w*\s+([^.]{30,200}\.)',  # Text starting with "그" (He/She/It...)
                r'([^.]{30,200}\.[^.]{30,200}\.)',  # Multi-sentence description
            ]
            
            for pattern in tagline_patterns:
                tagline_matches = re.findall(pattern, all_text, re.DOTALL)
                for match in tagline_matches:
                    text = match.strip()
                    # Filter out unwanted matches
                    if (text and len(text) > 30 and len(text) < 300 and 
                        not text.startswith('#') and 
                        '이용가' not in text and '관심' not in text and
                        '글/그림' not in text and '원작' not in text and
                        'https://' not in text and 'www.' not in text and
                        '공지사항' not in text and '웹툰' not in text and
                        'NAVER' not in text):
                        # Clean up the text
                        clean_text = re.sub(r'\s+', ' ', text).strip()
                        if clean_text:
                            title_data['tagline'] = clean_text
                            print(f"  Found tagline: {clean_text[:50]}...")
                            break
                if title_data['tagline']:
                    break
            
            # Fallback: try CSS selectors
            if not title_data['tagline']:
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
                        if summary_text and len(summary_text) > 30:
                            title_data['tagline'] = summary_text
                            print(f"  Found tagline (CSS): {summary_text[:50]}...")
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
            
            # Rate limiting - optimized for large scale scraping
            if i < len(title_links) - 1:
                time.sleep(0.5)  # Reduced delay for faster scraping
                
            # Progress indicator and intermediate saving for large scraping runs
            if (i + 1) % 10 == 0:
                print(f"Progress: {i+1}/{len(title_links)} titles completed ({((i+1)/len(title_links)*100):.1f}%)")
                
            # Save intermediate results every 50 titles to prevent data loss
            if (i + 1) % 50 == 0:
                temp_output = f"naver_webtoon_partial_{i+1}.json"
                with open(temp_output, 'w', encoding='utf-8') as f:
                    json.dump(results, f, ensure_ascii=False, indent=2)
                print(f"  💾 Intermediate results saved to {temp_output}")
        
        return results
    
    def close(self):
        """Close the webdriver"""
        if self.driver:
            self.driver.quit()

def main():
    """Main function to run the scraper"""
    scraper = None
    try:
        scraper = NaverWebtoonSeleniumScraper(headless=True)  # Run in headless mode for speed
        
        print("Starting Naver Webtoon Selenium scraper...")
        print("Scraping ALL available titles with enhanced parser...")
        
        results = scraper.scrape_titles(limit=None)  # Remove limit to scrape all titles
        
        # Save results to JSON file
        output_file = "naver_webtoon_all_titles.json"
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(results, f, ensure_ascii=False, indent=2)
        
        print(f"\n🎉 Scraping complete! Results saved to {output_file}")
        print(f"Successfully scraped {len(results)} titles")
        
        # Generate summary statistics
        successful_titles = [r for r in results if r.get('title_name_kr') and r.get('title_name_kr') != '네이버']
        titles_with_images = [r for r in successful_titles if r.get('title_image')]
        titles_with_authors = [r for r in successful_titles if r.get('art_author') or r.get('story_author')]
        titles_with_taglines = [r for r in successful_titles if r.get('tagline')]
        titles_with_likes = [r for r in successful_titles if r.get('likes')]
        
        print(f"\n📊 Summary Statistics:")
        print(f"  Total titles processed: {len(results)}")
        print(f"  Valid webtoon titles: {len(successful_titles)}")
        print(f"  Titles with cover images: {len(titles_with_images)} ({len(titles_with_images)/len(successful_titles)*100:.1f}%)")
        print(f"  Titles with author info: {len(titles_with_authors)} ({len(titles_with_authors)/len(successful_titles)*100:.1f}%)")
        print(f"  Titles with taglines: {len(titles_with_taglines)} ({len(titles_with_taglines)/len(successful_titles)*100:.1f}%)")
        print(f"  Titles with like counts: {len(titles_with_likes)} ({len(titles_with_likes)/len(successful_titles)*100:.1f}%)")
        
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