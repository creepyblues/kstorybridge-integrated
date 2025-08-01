#!/usr/bin/env python3
"""
Debug script to find patterns on the third example page
"""

from naver_webtoon_selenium_scraper import NaverWebtoonSeleniumScraper
from selenium.webdriver.common.by import By
import re

def debug_third_example():
    """Debug what patterns are actually on the third example page"""
    scraper = None
    try:
        scraper = NaverWebtoonSeleniumScraper(headless=True)
        
        test_url = "https://comic.naver.com/webtoon/list?titleId=776601&tab=fri"
        
        print(f"Debugging patterns on: {test_url}")
        scraper.driver.get(test_url) 
        
        # Wait for page load
        import time
        time.sleep(3)
        
        # Get all text
        all_text = scraper.driver.find_element(By.TAG_NAME, "body").text
        
        print("\n=== Looking for expected author names ===")
        expected_names = ['이히', 'JP', '유진성']
        for name in expected_names:
            if name in all_text:
                # Find context around the name
                matches = []
                for match in re.finditer(re.escape(name), all_text):
                    start = max(0, match.start() - 50)
                    end = min(len(all_text), match.end() + 50)
                    context = all_text[start:end].replace('\n', ' ')
                    matches.append(context)
                
                print(f"\n'{name}' found in contexts:")
                for context in matches:
                    print(f"  ...{context}...")
            else:
                print(f"\n'{name}' NOT found in page text")
        
        print("\n=== Looking for tagline start ===")
        tagline_start = "무공에 미친 광마 이자하"
        if tagline_start in all_text:
            match = re.search(re.escape(tagline_start), all_text)
            if match:
                start = max(0, match.start() - 30)
                end = min(len(all_text), match.end() + 200)
                context = all_text[start:end].replace('\n', ' ')
                print(f"Found tagline context: ...{context}...")
        else:
            print(f"Tagline start '{tagline_start}' NOT found")
            
        print("\n=== Looking for author-related patterns ===")
        author_lines = []
        for line in all_text.split('\n'):
            line = line.strip()
            if any(keyword in line for keyword in ['글', '그림', '원작', '작가']) and len(line) < 100:
                author_lines.append(line)
        
        print("Lines with author keywords:")
        for line in author_lines[:10]:  # Show first 10
            print(f"  {line}")
            
        print("\n=== Testing current regex patterns ===")
        patterns_to_test = [
            r'([가-힣a-zA-Z]+)\s*∙?\s*글/그림',  # Current combined pattern
            r'그림\s*[:：]?\s*([가-힣a-zA-Z]+)',   # Art author pattern  
            r'글\s*[:：]?\s*([가-힣a-zA-Z]+)',     # Story author pattern
            r'원작\s*[:：]?\s*([가-힣a-zA-Z]+)',   # Original author pattern
            r'이히',  # Literal search for expected art author
            r'JP',    # Literal search for expected story author
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
    debug_third_example()