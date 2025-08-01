#!/usr/bin/env python3
"""
Test scraper fixes on the first example (titleId=818780)
"""

from naver_webtoon_selenium_scraper import NaverWebtoonSeleniumScraper
import json

def test_first_example():
    """Test the scraper on titleId=818780 to validate fixes work for both examples"""
    scraper = None
    try:
        scraper = NaverWebtoonSeleniumScraper(headless=True)
        
        # Test the specific title from user's first example
        test_url = "https://comic.naver.com/webtoon/list?titleId=818780&tab=mon"
        
        print(f"Testing scraper fixes on first example: {test_url}")
        result = scraper.scrape_title_info(test_url)
        
        print("\nResults:")
        print(f"Title: {result.get('title_name_kr')}")
        print(f"Art Author: {result.get('art_author')}")
        print(f"Story Author: {result.get('story_author')}")
        print(f"Original Author: {result.get('original_author_kr')}")
        print(f"Likes: {result.get('likes')}")
        print(f"Age Rating: {result.get('age_rating')}")
        print(f"Tagline: {result.get('tagline', '')}")
        print(f"Tags: {result.get('tags', [])}")
        
        # Save result for inspection
        with open('test_first_example_result.json', 'w', encoding='utf-8') as f:
            json.dump(result, f, ensure_ascii=False, indent=2)
        
        print("\nDetailed result saved to test_first_example_result.json")
        
        # Validate expected results from first example
        expected = {
            'art_author': '혜림',
            'story_author': '혜림',
            'original_author_kr': '댄킴',
            'age_rating': '전체연령가',
            'tagline': '나는 빚을 갚기 위해 당장 할 수 있는 일을 선택했고, 그게 내겐 영업이었다. 그리고 내게 다시 한 번의 기회가 주어졌다.'
        }
        
        print("\nValidation:")
        for key, expected_value in expected.items():
            actual_value = result.get(key)
            if key == 'tagline':
                # For tagline, check if expected text is contained in actual
                status = "✓" if expected_value in str(actual_value or '') else "✗"
            else:
                status = "✓" if actual_value == expected_value else "✗"
            print(f"{status} {key}: expected '{expected_value}', got '{actual_value}'")
            
    except Exception as e:
        print(f"Error testing: {e}")
    finally:
        if scraper:
            scraper.close()

if __name__ == "__main__":
    test_first_example()