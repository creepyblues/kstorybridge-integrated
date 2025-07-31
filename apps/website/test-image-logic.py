#!/usr/bin/env python3
"""
Simple test to demonstrate the image scoring logic
"""

def score_image_url(src):
    """Score an image URL based on the new algorithm"""
    score = 0
    
    # High priority for secure S3 URLs (main content images)
    if 'prod-files-secure.s3.us-west-2.amazonaws.com' in src:
        score += 100
    
    # High priority for Notion API images with blockId (processed images)
    if 'oopy.lazyrockets.com/api/v2/notion/image' in src and 'blockId=' in src:
        score += 90
    
    # Medium priority for other AWS/CDN images
    elif any(pattern in src for pattern in ['amazonaws.com', 'cloudfront', 'cdn.']):
        score += 50
    
    # Prefer larger images based on file size indicators in URL
    if any(size_indicator in src for size_indicator in ['large', 'full', 'original', '1200', '800']):
        score += 15
    
    return score

def main():
    print("🔍 Testing Image Scoring Logic")
    print("=" * 50)
    
    # Test URLs based on the example
    test_urls = [
        # The logo URL (should get lower score)
        "https://oopy.lazyrockets.com/api/rest/cdn/image/ebb49060-f1f9-4631-8126-661c77d5fc27.png",
        
        # The target cover image URL (should get higher score)
        "https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fprod-files-secure.s3.us-west-2.amazonaws.com%2F782801ca-3dcc-4751-8a08-4267aa829022%2F6d423e3e-9858-436f-80c6-dcfa7bd7d497%2F3bdf1cc2-5ab6-4557-b0df-9d0399a48021.png&blockId=accfd3ca-4bfe-4752-99ac-9ce830af9b47",
        
        # Other potential URLs for comparison
        "https://prod-files-secure.s3.us-west-2.amazonaws.com/some-image.png",
        "https://example.com/cdn/image.jpg",
        "https://cloudfront.net/image.png"
    ]
    
    print("📊 Scoring Results:")
    print("-" * 50)
    
    results = []
    for url in test_urls:
        score = score_image_url(url)
        results.append((score, url))
        print(f"Score: {score:3d} | {url[:80]}{'...' if len(url) > 80 else ''}")
    
    print("\n🏆 Best Image (highest score):")
    print("-" * 30)
    best_score, best_url = max(results)
    print(f"Score: {best_score}")
    print(f"URL: {best_url}")
    
    print("\n✅ Algorithm Analysis:")
    print("-" * 25)
    if 'blockId=' in best_url and 'oopy.lazyrockets.com/api/v2/notion/image' in best_url:
        print("✅ SUCCESS: The algorithm correctly identifies the Notion API image with blockId!")
        print("✅ This is the high-quality processed cover image you wanted.")
    else:
        print("⚠️  The algorithm might need adjustment.")
    
    return best_url

if __name__ == "__main__":
    best_image = main()
    print(f"\n🎯 Final Result: {best_image}")