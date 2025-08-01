#!/usr/bin/env python3
"""
Test scraper fixes on the third example (titleId=776601)
"""

from naver_webtoon_selenium_scraper import NaverWebtoonSeleniumScraper
import json

def test_third_example():
    """Test the scraper on titleId=776601 to validate fixes work for the third example"""
    scraper = None
    try:
        scraper = NaverWebtoonSeleniumScraper(headless=True)
        
        # Test the specific title from user's third example
        test_url = "https://comic.naver.com/webtoon/list?titleId=776601&tab=fri"
        
        print(f"Testing scraper fixes on third example: {test_url}")
        result = scraper.scrape_title_info(test_url)
        
        print("\nResults:")
        print(f"Title: {result.get('title_name_kr')}")
        print(f"Art Author: {result.get('art_author')}")
        print(f"Story Author: {result.get('story_author')}")
        print(f"Original Author: {result.get('original_author_kr')}")
        print(f"Likes: {result.get('likes')}")
        print(f"Age Rating: {result.get('age_rating')}")
        print(f"Tagline: {result.get('tagline', '')[:200]}...")
        print(f"Tags: {result.get('tags', [])}")
        
        # Save result for inspection
        with open('test_third_example_result.json', 'w', encoding='utf-8') as f:
            json.dump(result, f, ensure_ascii=False, indent=2)
        
        print("\nDetailed result saved to test_third_example_result.json")
        
        # Validate expected results from third example
        expected = {
            'art_author': '이히',
            'story_author': 'JP',
            'original_author_kr': '유진성',
            'likes': 565139,
            'age_rating': '15세 이용가',
            'tagline_contains': '무공에 미친 광마 이자하'
        }
        
        print("\nValidation:")
        for key, expected_value in expected.items():
            if key == 'tagline_contains':
                actual_value = result.get('tagline', '')
                status = "✓" if expected_value in str(actual_value) else "✗"
                print(f"{status} tagline contains '{expected_value}': {status == '✓'}")
            else:
                actual_value = result.get(key)
                status = "✓" if actual_value == expected_value else "✗"
                print(f"{status} {key}: expected '{expected_value}', got '{actual_value}'")
            
    except Exception as e:
        print(f"Error testing: {e}")
    finally:
        if scraper:
            scraper.close()

if __name__ == "__main__":
    test_third_example()