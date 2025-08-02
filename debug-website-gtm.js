// Debug script for website GTM tracking
// Run this in the browser console while on the website

async function debugWebsiteGTM() {
  console.log('🔍 Debugging website GTM tracking...');
  
  // Check if GTM dataLayer is available
  if (typeof window.dataLayer === 'undefined') {
    console.log('❌ dataLayer not available');
    return;
  }
  
  console.log('✅ dataLayer available:', window.dataLayer.length, 'events');
  
  // Show current dataLayer contents
  console.log('📊 Current dataLayer events:');
  window.dataLayer.forEach((event, index) => {
    console.log(`${index + 1}.`, event);
  });
  
  // Test manual event push
  console.log('🧪 Testing manual event push...');
  window.dataLayer.push({
    'event': 'test_website_tracking',
    'test_action': 'manual_debug',
    'app_section': 'website',
    'timestamp': new Date().toISOString()
  });
  
  console.log('✅ Test event pushed. New dataLayer length:', window.dataLayer.length);
  
  // Check for GTM container script
  const gtmScript = document.querySelector('script[src*="googletagmanager.com/gtm.js"]');
  console.log('📝 GTM script loaded:', !!gtmScript);
  
  if (gtmScript) {
    console.log('🔗 GTM script URL:', gtmScript.src);
  }
  
  // Check for noscript iframe
  const gtmNoScript = document.querySelector('noscript iframe[src*="googletagmanager.com/ns.html"]');
  console.log('📝 GTM noscript fallback:', !!gtmNoScript);
  
  // Test analytics utility functions if available
  if (typeof window.trackPageView !== 'undefined') {
    console.log('🧪 Testing trackPageView...');
    window.trackPageView('/debug-test', 'Debug Test Page');
  } else {
    console.log('⚠️ trackPageView function not available globally');
  }
  
  console.log('🔍 Debug complete. Check GTM Preview mode to see events.');
}

// Test page view tracking
function testPageViewTracking() {
  console.log('🧪 Testing page view tracking...');
  if (window.dataLayer) {
    window.dataLayer.push({
      'event': 'page_view',
      'page_title': 'Debug Test Page',
      'page_location': window.location.href,
      'page_path': '/debug-test',
      'app_section': 'website'
    });
    console.log('✅ Page view event pushed');
  }
}

// Test button click tracking
function testButtonClickTracking() {
  console.log('🧪 Testing button click tracking...');
  if (window.dataLayer) {
    window.dataLayer.push({
      'event': 'custom_event',
      'event_action': 'button_click',
      'event_category': 'engagement',
      'event_label': 'Debug Test Button (header)',
      'app_section': 'website'
    });
    console.log('✅ Button click event pushed');
  }
}

// Test signup tracking
function testSignupTracking() {
  console.log('🧪 Testing signup tracking...');
  if (window.dataLayer) {
    window.dataLayer.push({
      'event': 'sign_up',
      'method': 'email',
      'user_type': 'buyer',
      'app_section': 'website'
    });
    console.log('✅ Signup event pushed');
  }
}

// Auto-run the debug function
debugWebsiteGTM().catch(console.error);

// Make test functions available globally
window.debugWebsiteGTM = debugWebsiteGTM;
window.testPageViewTracking = testPageViewTracking;
window.testButtonClickTracking = testButtonClickTracking;
window.testSignupTracking = testSignupTracking;

console.log('💡 Available test functions:');
console.log('- debugWebsiteGTM() - Full debug analysis');
console.log('- testPageViewTracking() - Test page view events');
console.log('- testButtonClickTracking() - Test button click events');
console.log('- testSignupTracking() - Test signup events');