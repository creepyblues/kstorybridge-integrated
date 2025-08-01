#!/usr/bin/env python3
"""
Naver Webtoon Scraper
Scrapes title information from Naver Webtoon website
"""

import requests
from bs4 import BeautifulSoup
import json
import re
import time
from urllib.parse import urljoin, urlparse, parse_qs
from typing import List, Dict, Optional

class NaverWebtoonScraper:
    def __init__(self):
        self.base_url = "https://comic.naver.com"
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
            'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Referer': 'https://comic.naver.com/',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
        })
    
    def get_title_links(self, limit: Optional[int] = None) -> List[str]:
        """Get title links from the main webtoon page"""
        # Try multiple possible URLs for webtoon listings
        urls_to_try = [
            "https://comic.naver.com/webtoon",
            "https://comic.naver.com/webtoon/weekday",
            "https://comic.naver.com/index"
        ]
        
        for url in urls_to_try:
            try:
                print(f"Trying URL: {url}")
                response = self.session.get(url)
                response.raise_for_status()
                soup = BeautifulSoup(response.content, 'html.parser')
                
                # Debug: Print page title and some content
                title_tag = soup.find('title')
                print(f"Page title: {title_tag.get_text() if title_tag else 'No title found'}")
                
                # Find all links that match the pattern for webtoon titles
                title_links = []
                links = soup.find_all('a', href=True)
                print(f"Found {len(links)} total links on page")
                
                # Try different patterns for webtoon links
                patterns = [
                    '/webtoon/list',
                    'titleId=',
                    '/webtoon/detail'
                ]
                
                for link in links:
                    href = link['href']
                    for pattern in patterns:
                        if pattern in href and 'titleId=' in href:
                            # Clean the link by removing tab parameter
                            clean_url = self.clean_title_url(href)
                            if clean_url and clean_url not in title_links:
                                title_links.append(clean_url)
                                print(f"Found title link: {clean_url}")
                
                if title_links:
                    print(f"Found {len(title_links)} title links from {url}")
                    if limit:
                        title_links = title_links[:limit]
                    return title_links
                else:
                    print(f"No title links found on {url}")
                    
            except Exception as e:
                print(f"Error fetching from {url}: {e}")
                continue
        
        # If no links found, try some hardcoded examples for testing
        print("No links found from main pages, using sample links for testing...")
        # Try different URL structures that might work
        sample_links = [
            "https://comic.naver.com/webtoon/list.nhn?titleId=183559",
            "https://comic.naver.com/webtoon/list.nhn?titleId=626907", 
            "https://comic.naver.com/webtoon/list.nhn?titleId=570503",
            "https://comic.naver.com/webtoon/list.nhn?titleId=748105",
            "https://comic.naver.com/webtoon/list.nhn?titleId=819217"
        ]
        
        if limit:
            sample_links = sample_links[:limit]
        
        return sample_links
    
    def clean_title_url(self, url: str) -> str:
        """Remove tab parameter from URL"""
        if '&tab=' in url:
            url = url.split('&tab=')[0]
        
        # Ensure it's a full URL
        if url.startswith('/'):
            url = urljoin(self.base_url, url)
            
        return url
    
    def scrape_title_info(self, title_url: str) -> Dict:
        """Scrape detailed information from a title page"""
        try:
            print(f"Scraping: {title_url}")
            response = self.session.get(title_url)
            response.raise_for_status()
            soup = BeautifulSoup(response.content, 'html.parser')
            
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
            
            # Debug: Print page title
            page_title = soup.find('title')
            print(f"  Page title: {page_title.get_text() if page_title else 'No title'}")
            
            # Try multiple selectors for title image
            img_selectors = [
                'img.thumb',
                '.thumb img',
                '.ContentTitle img',
                '.comic_info img',
                'img[src*="thumb"]'
            ]
            
            for selector in img_selectors:
                img_element = soup.select_one(selector)
                if img_element and img_element.get('src'):
                    title_data['title_image'] = img_element['src']
                    print(f"  Found image: {title_data['title_image']}")
                    break
            
            # Try multiple selectors for title name
            title_selectors = [
                'h2.ContentTitle__title',
                '.ContentTitle h2',
                '.comic_info h2',
                'h2',
                '.title'
            ]
            
            for selector in title_selectors:
                title_element = soup.select_one(selector)
                if title_element:
                    title_text = title_element.get_text(strip=True)
                    if title_text and len(title_text) > 1:
                        title_data['title_name_kr'] = title_text
                        print(f"  Found title: {title_data['title_name_kr']}")
                        break
            
            # Look for author information in various formats
            all_text = soup.get_text()
            
            # Extract authors using regex patterns
            author_patterns = {
                'art_author': [r'그림\s*[:：]\s*([^/\n]+)', r'그림\s+([^/\n]+)'],
                'story_author': [r'글\s*[:：]\s*([^/\n]+)', r'글\s+([^/\n]+)'],
                'original_author_kr': [r'원작\s*[:：]\s*([^/\n]+)', r'원작\s+([^/\n]+)']
            }
            
            for field, patterns in author_patterns.items():
                for pattern in patterns:
                    match = re.search(pattern, all_text)
                    if match:
                        author_name = match.group(1).strip()
                        if author_name and len(author_name) < 50:  # Reasonable length check
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
            
            # Extract tagline/summary (look for longer text blocks)
            summary_elements = soup.find_all(['p', 'div', 'span'], string=re.compile(r'.{20,}'))
            for elem in summary_elements:
                text = elem.get_text(strip=True)
                if (text and len(text) > 20 and len(text) < 200 and 
                    not text.startswith('#') and 
                    '이용가' not in text and 
                    '관심' not in text):
                    title_data['tagline'] = text
                    print(f"  Found tagline: {text[:50]}...")
                    break
            
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
            
            # Rate limiting - wait 1 second between requests
            if i < len(title_links) - 1:
                time.sleep(1)
        
        return results

def main():
    """Main function to run the scraper"""
    scraper = NaverWebtoonScraper()
    
    print("Starting Naver Webtoon scraper...")
    print("Scraping first 10 titles for validation...")
    
    results = scraper.scrape_titles(limit=10)
    
    # Save results to JSON file
    output_file = "naver_webtoon_titles.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    
    print(f"\nScraping complete! Results saved to {output_file}")
    print(f"Successfully scraped {len(results)} titles")
    
    # Display summary of first few results
    for i, title in enumerate(results[:3]):
        print(f"\nTitle {i+1}:")
        print(f"  Name: {title.get('title_name_kr', 'N/A')}")
        print(f"  Authors: Art: {title.get('art_author', 'N/A')}, Story: {title.get('story_author', 'N/A')}")
        print(f"  Age Rating: {title.get('age_rating', 'N/A')}")
        print(f"  Tags: {title.get('tags', [])}")

if __name__ == "__main__":
    main()