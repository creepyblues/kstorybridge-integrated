// Test utility for search tracking - for development only
// This file helps verify that search events are properly formatted and sent to GA4

import { trackSearch } from './analytics';

/**
 * Test search tracking implementation
 * Run this in browser console to verify GA4 events
 */
export const testSearchTracking = () => {
  console.log('🧪 Testing Search Tracking Implementation...');
  
  // Test 1: Main search by buyer
  console.log('\n1️⃣ Testing main search by buyer...');
  trackSearch('korean webtoon romance', 15, {
    userType: 'buyer',
    searchContext: 'main',
    page: '/buyers/titles'
  });
  
  // Test 2: Favorites search
  console.log('\n2️⃣ Testing favorites search...');
  trackSearch('action drama', 8, {
    userType: 'buyer',
    searchContext: 'favorites',
    page: '/buyers/favorites'
  });
  
  // Test 3: Creator search
  console.log('\n3️⃣ Testing creator search...');
  trackSearch('my published titles', 3, {
    userType: 'creator',
    searchContext: 'main',
    page: '/creators/titles'
  });
  
  // Test 4: Zero results search
  console.log('\n4️⃣ Testing zero results search...');
  trackSearch('nonexistent content xyz', 0, {
    userType: 'buyer',
    searchContext: 'main',
    page: '/buyers/titles'
  });
  
  // Test 5: Search with special characters
  console.log('\n5️⃣ Testing search with special characters...');
  trackSearch('드라마 & 로맨스 2024', 12, {
    userType: 'buyer',
    searchContext: 'main',
    page: '/buyers/titles'
  });
  
  console.log('\n✅ All test search events sent!');
  console.log('📊 Check GA4 Real-time reports to verify events are received');
  console.log('🔍 Look for "search" events in GA4 with the above parameters');
  
  return 'Test completed - check GA4 real-time reports and browser network tab';
};

/**
 * Check if GA4 tracking is properly initialized
 */
export const checkGA4Status = () => {
  if (typeof window === 'undefined') {
    return 'Not in browser environment';
  }
  
  const status = {
    dataLayerExists: !!window.dataLayer,
    dataLayerLength: window.dataLayer?.length || 0,
    gtagExists: !!window.gtag,
    lastDataLayerEvent: window.dataLayer?.[window.dataLayer.length - 1]
  };
  
  console.log('📊 GA4 Status Check:', status);
  
  if (!window.dataLayer) {
    console.warn('⚠️ dataLayer not found - GA4/GTM may not be properly initialized');
  }
  
  if (!window.gtag) {
    console.warn('⚠️ gtag function not found - Google Analytics may not be loaded');
  }
  
  return status;
};

// Make functions available globally in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).testSearchTracking = testSearchTracking;
  (window as any).checkGA4Status = checkGA4Status;
  
  console.log('🔧 Search tracking test functions available:');
  console.log('   - testSearchTracking() - Send test search events');
  console.log('   - checkGA4Status() - Check GA4 initialization');
}