#!/usr/bin/env python3
"""
Debug version of the toons.kr scraper to investigate page structure
"""

import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
from selenium.common.exceptions import TimeoutException

def debug_toons_kr():
    """Debug the toons.kr page structure"""
    print("🔍 Starting debug session for toons.kr...")
    
    # Setup Chrome options
    chrome_options = Options()
    chrome_options.add_argument('--no-sandbox')
    chrome_options.add_argument('--disable-dev-shm-usage')
    chrome_options.add_argument('--disable-gpu')
    chrome_options.add_argument('--window-size=1920,1080')
    chrome_options.add_argument('--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36')
    
    # Don't run headless so we can see what's happening
    # chrome_options.add_argument('--headless')
    
    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=chrome_options)
    
    try:
        print("📱 Opening toons.kr...")
        driver.get("https://www.toons.kr")
        print(f"📄 Page title: {driver.title}")
        print(f"🌐 Current URL: {driver.current_url}")
        
        # Wait for page to load
        time.sleep(5)
        
        # Check if we're redirected or blocked
        if "toons.kr" not in driver.current_url:
            print(f"⚠️ Redirected to: {driver.current_url}")
        
        # Save page source for inspection
        with open('debug_page_source.html', 'w', encoding='utf-8') as f:
            f.write(driver.page_source)
        print("💾 Page source saved to debug_page_source.html")
        
        # Try to navigate to the list page
        print("📋 Navigating to /toons/list...")
        driver.get("https://www.toons.kr/toons/list")
        time.sleep(5)
        
        print(f"📄 List page title: {driver.title}")
        print(f"🌐 List page URL: {driver.current_url}")
        
        # Save list page source
        with open('debug_list_page_source.html', 'w', encoding='utf-8') as f:
            f.write(driver.page_source)
        print("💾 List page source saved to debug_list_page_source.html")
        
        # Try different selectors to find content
        selectors_to_try = [
            "a[href*='/toons/']",
            ".toon-item",
            ".webtoon-item", 
            ".content-item",
            "[data-title]",
            ".title",
            "div",
            "img",
            "a"
        ]
        
        print("\n🔍 Testing selectors:")
        for selector in selectors_to_try:
            try:
                elements = driver.find_elements(By.CSS_SELECTOR, selector)
                print(f"  {selector}: {len(elements)} elements found")
                
                # Show first few elements for context
                if elements and len(elements) > 0:
                    for i, elem in enumerate(elements[:3]):
                        try:
                            text = elem.get_attribute('outerHTML')[:100]
                            print(f"    [{i}]: {text}...")
                        except:
                            pass
            except Exception as e:
                print(f"  {selector}: Error - {e}")
        
        # Check for any anti-bot measures
        print("\n🛡️ Checking for anti-bot measures:")
        
        # Check for captcha
        captcha_selectors = [".captcha", "#captcha", "[class*='captcha']", "[id*='captcha']"]
        for selector in captcha_selectors:
            elements = driver.find_elements(By.CSS_SELECTOR, selector)
            if elements:
                print(f"  ⚠️ Possible captcha found: {selector}")
        
        # Check for cloudflare
        if "cloudflare" in driver.page_source.lower():
            print("  ⚠️ Cloudflare protection detected")
        
        # Check for bot detection messages
        bot_keywords = ["bot", "robot", "automation", "blocked", "access denied"]
        page_text = driver.page_source.lower()
        for keyword in bot_keywords:
            if keyword in page_text:
                print(f"  ⚠️ Found keyword '{keyword}' in page")
        
        # Take a screenshot
        driver.save_screenshot('debug_screenshot.png')
        print("📸 Screenshot saved to debug_screenshot.png")
        
        # Wait so you can see the browser
        print("\n⏳ Keeping browser open for 30 seconds for manual inspection...")
        print("   Check the browser window to see what's actually displayed")
        time.sleep(30)
        
    except Exception as e:
        print(f"❌ Error during debug: {e}")
        
        # Save error page source if possible
        try:
            with open('debug_error_page.html', 'w', encoding='utf-8') as f:
                f.write(driver.page_source)
            print("💾 Error page source saved to debug_error_page.html")
        except:
            pass
            
    finally:
        driver.quit()
        print("✅ Debug session completed")
        
        print("\n📋 Files created for analysis:")
        print("  - debug_page_source.html")
        print("  - debug_list_page_source.html") 
        print("  - debug_screenshot.png")
        print("  - debug_error_page.html (if error occurred)")

if __name__ == "__main__":
    debug_toons_kr()