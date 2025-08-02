// Debug script for dashboard GTM - run in browser console

async function debugDashboardGTM() {
  console.log('🔍 Debugging Dashboard GTM Implementation...');
  
  // Check if GTM container is loaded
  console.log('1. GTM Container Check:');
  console.log('   - dataLayer exists:', typeof window.dataLayer !== 'undefined');
  console.log('   - dataLayer length:', window.dataLayer?.length || 0);
  console.log('   - GTM loaded:', typeof window.google_tag_manager !== 'undefined');
  
  if (window.google_tag_manager) {
    console.log('   - GTM containers:', Object.keys(window.google_tag_manager));
  }
  
  // Check dataLayer contents
  console.log('\n2. DataLayer Events:');
  if (window.dataLayer && window.dataLayer.length > 0) {
    window.dataLayer.forEach((event, index) => {
      console.log(`   ${index + 1}.`, event);
    });
  } else {
    console.log('   ❌ No dataLayer events found');
  }
  
  // Test analytics functions
  console.log('\n3. Testing Analytics Functions:');
  
  // Test page view
  try {
    const initialLength = window.dataLayer.length;
    
    // Import and test analytics if available
    console.log('   Testing manual page view...');
    window.dataLayer.push({
      'event': 'page_view',
      'page_title': 'Debug Test Page',
      'page_location': window.location.href,
      'page_path': '/debug-test',
      'app_section': 'dashboard'
    });
    
    console.log(`   ✅ Page view pushed. DataLayer length: ${initialLength} → ${window.dataLayer.length}`);
  } catch (error) {
    console.log('   ❌ Page view test failed:', error);
  }
  
  // Test custom event
  try {
    const initialLength = window.dataLayer.length;
    
    console.log('   Testing custom event...');
    window.dataLayer.push({
      'event': 'custom_event',
      'event_action': 'debug_test',
      'event_category': 'testing',
      'event_label': 'console_debug',
      'app_section': 'dashboard'
    });
    
    console.log(`   ✅ Custom event pushed. DataLayer length: ${initialLength} → ${window.dataLayer.length}`);
  } catch (error) {
    console.log('   ❌ Custom event test failed:', error);
  }
  
  // Check for GTM script
  console.log('\n4. GTM Script Verification:');
  const gtmScripts = document.querySelectorAll('script[src*="googletagmanager.com"]');
  console.log(`   - GTM scripts found: ${gtmScripts.length}`);
  
  gtmScripts.forEach((script, index) => {
    console.log(`   ${index + 1}. ${script.src}`);
  });
  
  // Check for GTM noscript
  const gtmNoscript = document.querySelector('noscript iframe[src*="googletagmanager.com"]');
  console.log(`   - GTM noscript fallback: ${!!gtmNoscript}`);
  
  // GTM Container ID verification
  console.log('\n5. Container ID Verification:');
  const gtmContainer = gtmScripts[0]?.src.match(/id=([^&]+)/)?.[1];
  console.log(`   - Detected Container ID: ${gtmContainer}`);
  console.log(`   - Expected Container ID: GTM-PZBC4XQT`);
  console.log(`   - Match: ${gtmContainer === 'GTM-PZBC4XQT' ? '✅' : '❌'}`);
  
  // Analytics utility check
  console.log('\n6. Analytics Utilities Check:');
  console.log('   - debugGTM function available:', typeof window.debugGTM !== 'undefined');
  
  if (typeof window.debugGTM !== 'undefined') {
    console.log('   Running debugGTM...');
    try {
      window.debugGTM.checkGTMStatus();
    } catch (error) {
      console.log('   Error running debugGTM:', error);
    }
  }
  
  console.log('\n🎯 Summary:');
  console.log('   - GTM Container: ' + (gtmContainer === 'GTM-PZBC4XQT' ? '✅ Correct' : '❌ Wrong/Missing'));
  console.log('   - DataLayer: ' + (window.dataLayer?.length > 0 ? '✅ Working' : '❌ Empty'));
  console.log('   - Events: ' + (window.dataLayer?.length > 2 ? '✅ Firing' : '⚠️ Limited'));
  
  console.log('\n💡 Next Steps:');
  if (gtmContainer === 'GTM-PZBC4XQT' && window.dataLayer?.length > 0) {
    console.log('   1. ✅ Technical implementation is working');
    console.log('   2. 🔧 Configure GA4 tags in GTM console');
    console.log('   3. 📊 Set up triggers and variables in GTM');
    console.log('   4. 🧪 Test with GTM Preview mode');
  } else {
    console.log('   1. ❌ Fix GTM container setup');
    console.log('   2. 🔄 Verify script loading');
    console.log('   3. 📋 Check dataLayer implementation');
  }
}

// Run the debug
debugDashboardGTM();

// Make available globally
window.debugDashboardGTM = debugDashboardGTM;
console.log('\n🛠️ Function available: debugDashboardGTM()');