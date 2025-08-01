// Debug utility for Google Analytics in browser console
// Use this to test GA tracking in development

declare global {
  interface Window {
    debugGA: {
      testPageView: () => void;
      testEvent: () => void;
      checkGAStatus: () => void;
      testPremiumRequest: () => void;
    };
  }
}

import { trackPageView, trackEvent, trackPremiumFeatureRequest } from './analytics';

// Debug functions to test GA tracking
export const debugGA = {
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

  checkGAStatus: () => {
    console.log('🔍 Checking GA status...');
    if (typeof window !== 'undefined') {
      console.log('- Window available:', true);
      console.log('- gtag function available:', !!window.gtag);
      console.log('- dataLayer available:', !!window.dataLayer);
      console.log('- GA_MEASUREMENT_ID from env:', import.meta.env.VITE_GA_MEASUREMENT_ID);
      
      if (window.gtag) {
        console.log('✅ Google Analytics is ready');
      } else {
        console.log('⚠️ Google Analytics not ready yet');
      }
    } else {
      console.log('❌ Window not available (SSR?)');
    }
  },

  testPremiumRequest: () => {
    console.log('🔍 Testing premium feature request tracking...');
    trackPremiumFeatureRequest('Debug Premium Feature');
    console.log('✅ Premium feature request tracked');
  }
};

// Make debug functions available in browser console
if (typeof window !== 'undefined') {
  window.debugGA = debugGA;
  console.log('🛠️ GA Debug utilities loaded. Use window.debugGA in console to test tracking.');
}