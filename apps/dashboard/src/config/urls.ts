/**
 * URL configuration for different environments
 * Supports environment variables for flexible local testing
 */

export function getWebsiteUrl(): string {
  // Check for explicit environment variable override
  if (import.meta.env.VITE_WEBSITE_URL) {
    console.log('🌐 DASHBOARD URL CONFIG: Using VITE_WEBSITE_URL:', import.meta.env.VITE_WEBSITE_URL);
    return import.meta.env.VITE_WEBSITE_URL;
  }
  
  // Check if we're in development mode
  if (import.meta.env.DEV) {
    console.log('🌐 DASHBOARD URL CONFIG: Using dev website URL');
    return "http://localhost:5173"; // Default Vite port for website
  }
  
  // Check current hostname to determine if we're on a Vercel deployment
  const currentHostname = window.location.hostname;
  console.log('🌐 DASHBOARD URL CONFIG: Current hostname:', currentHostname);
  
  if (currentHostname.includes('vercel.app')) {
    // We're on Vercel, construct website URL based on current dashboard URL
    const websiteUrl = window.location.origin.replace('dashboard-', '').replace('dashboard.', '');
    console.log('🌐 DASHBOARD URL CONFIG: Detected Vercel, using website URL:', websiteUrl);
    return websiteUrl;
  }
  
  // Production fallback
  console.log('🌐 DASHBOARD URL CONFIG: Using production fallback');
  return "https://kstorybridge.com";
}

export function getDashboardUrl(): string {
  // Check for explicit environment variable override
  if (import.meta.env.VITE_DASHBOARD_URL) {
    return import.meta.env.VITE_DASHBOARD_URL;
  }
  
  // Check if we're in development mode
  if (import.meta.env.DEV) {
    return "http://localhost:8081"; // Dashboard dev port
  }
  
  // Check if we're on Vercel
  if (import.meta.env.VITE_VERCEL_URL) {
    return import.meta.env.VITE_VERCEL_URL;
  }
  
  // Production fallback
  return "https://dashboard.kstorybridge.com";
}