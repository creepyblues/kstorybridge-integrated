#!/usr/bin/env python3
"""
Debug script to find author patterns on the page
"""

from naver_webtoon_selenium_scraper import NaverWebtoonSeleniumScraper
from selenium.webdriver.common.by import By
import re

def debug_author_patterns():
    """Debug what author-related text is actually on the page"""
    scraper = None
    try:
        scraper = NaverWebtoonSeleniumScraper(headless=True)
        
        test_url = "https://comic.naver.com/webtoon/list?titleId=821793&tab=mon"
        
        print(f"Debugging author patterns on: {test_url}")
        scraper.driver.get(test_url) 
        
        # Wait for page load
        import time
        time.sleep(3)
        
        # Get all text
        all_text = scraper.driver.find_element(By.TAG_NAME, "body").text
        
        print("\n=== Looking for author-related keywords ===")
        author_keywords = ['글', '그림', '작가', '조석', '원작']
        for keyword in author_keywords:
            lines_with_keyword = [line.strip() for line in all_text.split('\n') if keyword in line]
            if lines_with_keyword:
                print(f"\nLines containing '{keyword}':")
                for line in lines_with_keyword[:5]:  # Show first 5 matches
                    print(f"  {line}")
        
        print("\n=== Looking for patterns around '조석' ===")
        if '조석' in all_text:
            # Find context around 조석
            import re
            matches = []
            for match in re.finditer('조석', all_text):
                start = max(0, match.start() - 50)
                end = min(len(all_text), match.end() + 50)
                context = all_text[start:end]
                matches.append(context.replace('\n', ' '))
            
            for context in matches:
                print(f"Context: ...{context}...")
        else:
            print("'조석' not found in page text")
            
        print("\n=== Searching for common author pattern variations ===")
        patterns_to_test = [
            r'글\s*[:：]?\s*([가-힣a-zA-Z]+)',
            r'그림\s*[:：]?\s*([가-힣a-zA-Z]+)',
            r'글/그림\s*[:：]?\s*([가-힣a-zA-Z]+)',
            r'작가\s*[:：]?\s*([가-힣a-zA-Z]+)',
            r'조석',
        ]
        
        for pattern in patterns_to_test:
            matches = re.findall(pattern, all_text)
            if matches:
                print(f"Pattern '{pattern}' found: {matches}")
            else:
                print(f"Pattern '{pattern}' found nothing")
                
    except Exception as e:
        print(f"Error debugging: {e}")
    finally:
        if scraper:
            scraper.close()

if __name__ == "__main__":
    debug_author_patterns()