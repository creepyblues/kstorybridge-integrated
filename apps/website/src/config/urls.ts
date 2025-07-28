/**
 * URL configuration for different environments
 * Supports environment variables for flexible local testing
 */

export function getDashboardUrl(): string {
  // Check for explicit environment variable override
  if (import.meta.env.VITE_DASHBOARD_URL) {
    console.log('🌐 WEBSITE URL CONFIG: Using VITE_DASHBOARD_URL:', import.meta.env.VITE_DASHBOARD_URL);
    return import.meta.env.VITE_DASHBOARD_URL;
  }
  
  // Check if we're in development mode
  if (import.meta.env.DEV) {
    console.log('🌐 WEBSITE URL CONFIG: Using dev dashboard URL');
    return "http://localhost:8081"; // Dashboard dev port
  }
  
  // Check current hostname to determine if we're on a Vercel deployment
  const currentHostname = window.location.hostname;
  console.log('🌐 WEBSITE URL CONFIG: Current hostname:', currentHostname);
  
  if (currentHostname.includes('vercel.app')) {
    // We're on Vercel - for now, use environment variables or hardcoded URLs
    // TODO: Set VITE_DASHBOARD_URL environment variable in Vercel dashboard
    console.log('🌐 WEBSITE URL CONFIG: On Vercel but no env var set, using fallback');
    return "https://dashboard.kstorybridge.com";
  }
  
  // Production fallback
  console.log('🌐 WEBSITE URL CONFIG: Using production fallback');
  return "https://dashboard.kstorybridge.com";
}

export function getWebsiteUrl(): string {
  // Check for explicit environment variable override
  if (import.meta.env.VITE_WEBSITE_URL) {
    return import.meta.env.VITE_WEBSITE_URL;
  }
  
  // Check if we're in development mode
  if (import.meta.env.DEV) {
    return "http://localhost:5173"; // Default Vite port for website
  }
  
  // Check if we're on Vercel
  if (import.meta.env.VITE_VERCEL_URL) {
    const vercelUrl = import.meta.env.VITE_VERCEL_URL;
    // Remove dashboard subdomain if present
    return vercelUrl.replace('://dashboard.', '://');
  }
  
  // Production fallback
  return "https://kstorybridge.com";
}