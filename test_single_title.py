#!/usr/bin/env python3
"""
Test scraper fixes on a single title
"""

from naver_webtoon_selenium_scraper import NaverWebtoonSeleniumScraper
import json

def test_single_title():
    """Test the scraper on titleId=821793 to validate fixes"""
    scraper = None
    try:
        scraper = NaverWebtoonSeleniumScraper(headless=True)
        
        # Test the specific title from user's example
        test_url = "https://comic.naver.com/webtoon/list?titleId=821793&tab=mon"
        
        print(f"Testing scraper fixes on: {test_url}")
        result = scraper.scrape_title_info(test_url)
        
        print("\nResults:")
        print(f"Title: {result.get('title_name_kr')}")
        print(f"Art Author: {result.get('art_author')}")
        print(f"Story Author: {result.get('story_author')}")
        print(f"Likes: {result.get('likes')}")
        print(f"Age Rating: {result.get('age_rating')}")
        print(f"Tagline: {result.get('tagline', '')[:100]}...")
        print(f"Tags: {result.get('tags', [])}")
        
        # Save result for inspection
        with open('test_single_result.json', 'w', encoding='utf-8') as f:
            json.dump(result, f, ensure_ascii=False, indent=2)
        
        print("\nDetailed result saved to test_single_result.json")
        
        # Validate expected results
        expected = {
            'likes': 86571,
            'art_author': '조석',
            'story_author': '조석'
        }
        
        print("\nValidation:")
        for key, expected_value in expected.items():
            actual_value = result.get(key)
            status = "✓" if actual_value == expected_value else "✗"
            print(f"{status} {key}: expected '{expected_value}', got '{actual_value}'")
            
    except Exception as e:
        print(f"Error testing: {e}")
    finally:
        if scraper:
            scraper.close()

if __name__ == "__main__":
    test_single_title()