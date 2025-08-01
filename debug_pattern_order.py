#!/usr/bin/env python3
"""
Debug the order and results of pattern matching for the third example
"""

from naver_webtoon_selenium_scraper import NaverWebtoonSeleniumScraper
from selenium.webdriver.common.by import By
import re

def debug_pattern_order():
    """Debug exactly which patterns match what for each author field"""
    scraper = None
    try:
        scraper = NaverWebtoonSeleniumScraper(headless=True)
        
        test_url = "https://comic.naver.com/webtoon/list?titleId=776601&tab=fri"
        
        print(f"Debugging pattern order on: {test_url}")
        scraper.driver.get(test_url) 
        
        # Wait for page load
        import time
        time.sleep(3)
        
        # Get all text
        all_text = scraper.driver.find_element(By.TAG_NAME, "body").text
        
        print("\n=== Testing each author pattern individually ===")
        
        # Test art_author patterns
        art_patterns = [
            r'([가-힣a-zA-Z]+)\s*∙\s*그림',  # Format: "name ∙ 그림"
            r'그림\s*[:：]?\s*([가-힣a-zA-Z]+)(?=\s|$|\n|/|그림|글|원작|전체연령|세\s*이용가)',  # Format: "그림: name"
            r'그림\s+([가-힣a-zA-Z]+)(?=\s|$|\n|/|그림|글|원작|전체연령|세\s*이용가)'
        ]
        
        print("\nArt Author patterns:")
        for i, pattern in enumerate(art_patterns):
            matches = re.findall(pattern, all_text)
            print(f"  Pattern {i+1} '{pattern}': {matches}")
        
        # Test story_author patterns  
        story_patterns = [
            r'([가-힣a-zA-Z]+)\s*∙\s*글',  # Format: "name ∙ 글"
            r'글\s*[:：]?\s*([가-힣a-zA-Z]+)(?=\s|$|\n|/|그림|글|원작|전체연령|세\s*이용가)',  # Format: "글: name"
            r'글\s+([가-힣a-zA-Z]+)(?=\s|$|\n|/|그림|글|원작|전체연령|세\s*이용가)'
        ]
        
        print("\nStory Author patterns:")
        for i, pattern in enumerate(story_patterns):
            matches = re.findall(pattern, all_text)
            print(f"  Pattern {i+1} '{pattern}': {matches}")
        
        # Test original_author patterns
        original_patterns = [
            r'([가-힣a-zA-Z]+)\s*∙\s*원작',  # Format: "name ∙ 원작"
            r'원작\s*[:：]?\s*([가-힣a-zA-Z\s]+?)(?=\s|$|\n|전체연령|세\s*이용가|글|그림)',
            r'원작\s+([가-힣a-zA-Z\s]+?)(?=\s|$|\n|전체연령|세\s*이용가|글|그림)'
        ]
        
        print("\nOriginal Author patterns:")
        for i, pattern in enumerate(original_patterns):
            matches = re.findall(pattern, all_text)
            print(f"  Pattern {i+1} '{pattern}': {matches}")
            
        print("\n=== Expected vs Pattern Results ===")
        print("Expected: art_author='이히', story_author='JP', original_author_kr='유진성'")
        print("Context: 'JP ∙ 글 이히 ∙ 그림 유진성 ∙ 원작'")
        
        print("\nPattern analysis:")
        print("- 'JP ∙ 글' should match story_author pattern 1: ([가-힣a-zA-Z]+)\\s*∙\\s*글")
        print("- '이히 ∙ 그림' should match art_author pattern 1: ([가-힣a-zA-Z]+)\\s*∙\\s*그림") 
        print("- '유진성 ∙ 원작' should match original_author pattern 1: ([가-힣a-zA-Z]+)\\s*∙\\s*원작")
        
    except Exception as e:
        print(f"Error debugging: {e}")
    finally:
        if scraper:
            scraper.close()

if __name__ == "__main__":
    debug_pattern_order()