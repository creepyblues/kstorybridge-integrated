#!/usr/bin/env python3
"""
Test improved tagline extraction on titles that previously had null taglines
"""

from naver_webtoon_selenium_scraper import NaverWebtoonSeleniumScraper
import json

def test_tagline_improvements():
    """Test improved tagline extraction on titles that had null taglines before"""
    scraper = None
    try:
        scraper = NaverWebtoonSeleniumScraper(headless=True)
        
        # Test titles that previously had null taglines
        test_urls = [
            "https://comic.naver.com/webtoon/list?titleId=733074&tab=mon",  # 백수세끼
            "https://comic.naver.com/webtoon/list?titleId=654774&tab=mon",  # 소녀의 세계
            "https://comic.naver.com/webtoon/list?titleId=758037&tab=mon",  # 참교육
        ]
        
        results = []
        for url in test_urls:
            print(f"\nTesting improved tagline extraction on: {url}")
            result = scraper.scrape_title_info(url)
            results.append(result)
            
            print(f"Title: {result.get('title_name_kr')}")
            print(f"Age Rating: {result.get('age_rating')}")
            print(f"Tagline: {result.get('tagline', 'None')[:100]}...")
            print(f"Tags: {result.get('tags', [])[:3]}...")  # Show first 3 tags
        
        # Save results for inspection
        with open('test_tagline_improvements_result.json', 'w', encoding='utf-8') as f:
            json.dump(results, f, ensure_ascii=False, indent=2)
        
        print(f"\nDetailed results saved to test_tagline_improvements_result.json")
        
        # Summary
        successful_taglines = sum(1 for r in results if r.get('tagline'))
        print(f"\nSummary: {successful_taglines}/{len(results)} titles now have taglines")
            
    except Exception as e:
        print(f"Error testing: {e}")
    finally:
        if scraper:
            scraper.close()

if __name__ == "__main__":
    test_tagline_improvements()