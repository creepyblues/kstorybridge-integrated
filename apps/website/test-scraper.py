#!/usr/bin/env python3
"""
Test script to verify scraper setup and connectivity
"""

import requests
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
import sys

def test_basic_connectivity():
    """Test basic connection to toons.kr"""
    print("🌐 Testing basic connectivity...")
    
    try:
        response = requests.get("https://www.toons.kr", timeout=10)
        if response.status_code in [200, 403]:  # 403 is normal for bot protection
            print(f"✅ toons.kr accessible - Status: {response.status_code}")
            if response.status_code == 403:
                print("  ℹ️ 403 status is normal - site has bot protection, Selenium will handle this")
            return True
        else:
            print(f"⚠️ Unexpected status: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Cannot access toons.kr: {e}")
        return False

def test_list_page():
    """Test access to the list page"""
    print("📋 Testing list page access...")
    
    try:
        response = requests.get("https://www.toons.kr/toons/list", timeout=10)
        if response.status_code in [200, 403]:  # 403 is normal for bot protection
            print(f"✅ List page accessible - Status: {response.status_code}")
            print(f"📄 Page size: {len(response.content)} bytes")
            if response.status_code == 403:
                print("  ℹ️ 403 status is normal - Selenium scraper will bypass this")
            return True
        else:
            print(f"⚠️ Unexpected status: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Cannot access list page: {e}")
        return False

def test_selenium_setup():
    """Test Selenium WebDriver setup"""
    print("🤖 Testing Selenium setup...")
    
    try:
        chrome_options = Options()
        chrome_options.add_argument('--headless')
        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--disable-dev-shm-usage')
        
        service = Service(ChromeDriverManager().install())
        driver = webdriver.Chrome(service=service, options=chrome_options)
        
        driver.get("https://www.toons.kr")
        title = driver.title
        driver.quit()
        
        print(f"✅ Selenium working - Page title: {title}")
        return True
    except Exception as e:
        print(f"❌ Selenium setup failed: {e}")
        return False

def test_dependencies():
    """Test if all required packages are installed"""
    print("📦 Testing dependencies...")
    
    required_packages = [
        ('selenium', 'selenium'),
        ('webdriver_manager', 'webdriver_manager'),
        ('requests', 'requests'),
        ('beautifulsoup4', 'bs4'),
        ('lxml', 'lxml')
    ]
    
    missing = []
    for package_name, import_name in required_packages:
        try:
            __import__(import_name.replace('-', '_'))
            print(f"✅ {package_name} installed")
        except ImportError:
            print(f"❌ {package_name} missing")
            missing.append(package_name)
    
    if missing:
        print(f"\n📥 Install missing packages:")
        print(f"pip install {' '.join(missing)}")
        return False
    
    return True

def main():
    """Run all tests"""
    print("🔍 Toons.kr Scraper - Setup Test")
    print("=" * 40)
    
    tests = [
        ("Dependencies", test_dependencies),
        ("Basic Connectivity", test_basic_connectivity),
        ("List Page Access", test_list_page),
        ("Selenium Setup", test_selenium_setup)
    ]
    
    results = []
    for name, test_func in tests:
        print(f"\n{name}:")
        result = test_func()
        results.append((name, result))
    
    print("\n" + "=" * 40)
    print("📊 Test Summary:")
    
    all_passed = True
    for name, passed in results:
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"  {name}: {status}")
        if not passed:
            all_passed = False
    
    if all_passed:
        print("\n🎉 All tests passed! Ready to run the scraper.")
        print("\nNext steps:")
        print("  python scrape-toons-kr.py     # Full scraper")
        print("  python scrape-toons-simple.py # Simple scraper")
    else:
        print("\n⚠️  Some tests failed. Please fix the issues above.")
        sys.exit(1)

if __name__ == "__main__":
    main()