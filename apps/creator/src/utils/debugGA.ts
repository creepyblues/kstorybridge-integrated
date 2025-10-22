// Debug utility for Google Tag Manager in browser console
// Use this to test GTM tracking in development

declare global {
  interface Window {
    debugGTM: {
      testPageView: () => void;
      testEvent: () => void;
      checkGTMStatus: () => void;
      testPremiumRequest: () => void;
      viewDataLayer: () => void;
    };
  }
}

import { trackPageView, trackEvent, trackPremiumFeatureRequest } from './analytics';

// Debug functions to test GTM tracking
export const debugGTM = {
  testPageView: () => {
    console.log('🔍 Testing page view tracking...');
    trackPageView('/test-page', 'Debug Test Page');
    console.log('✅ Page view tracked');
  },

  testEvent: () => {
    console.log('🔍 Testing custom event tracking...');
    trackEvent('debug_test', 'testing', 'console_test', 1);
    console.log('✅ Custom event tracked');
  },

  checkGTMStatus: () => {
    console.log('🔍 Checking GTM status...');
    if (typeof window !== 'undefined') {
      console.log('- Window available:', true);
      console.log('- dataLayer available:', !!window.dataLayer);
      console.log('- dataLayer length:', window.dataLayer?.length || 0);
      console.log('- GTM Container ID:', 'GTM-PZBC4XQT');
      
      if (window.dataLayer && window.dataLayer.length > 0) {
        console.log('✅ Google Tag Manager is ready');
      } else {
        console.log('⚠️ Google Tag Manager not ready yet');
      }
    } else {
      console.log('❌ Window not available (SSR?)');
    }
  },

  testPremiumRequest: () => {
    console.log('🔍 Testing premium feature request tracking...');
    trackPremiumFeatureRequest('Debug Premium Feature');
    console.log('✅ Premium feature request tracked');
  },

  viewDataLayer: () => {
    console.log('🔍 Current dataLayer contents:');
    if (typeof window !== 'undefined' && window.dataLayer) {
      console.table(window.dataLayer);
    } else {
      console.log('❌ dataLayer not available');
    }
  }
};

// Make debug functions available in browser console
if (typeof window !== 'undefined') {
  window.debugGTM = debugGTM;
  console.log('🛠️ GTM Debug utilities loaded. Use window.debugGTM in console to test tracking.');
}