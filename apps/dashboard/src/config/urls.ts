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
  console.log('🌐 DASHBOARD URL CONFIG: Environment check:', {
    VITE_WEBSITE_URL: import.meta.env.VITE_WEBSITE_URL,
    DEV: import.meta.env.DEV,
    MODE: import.meta.env.MODE
  });
  
  if (currentHostname.includes('vercel.app')) {
    // We're on Vercel - for now, use environment variables or hardcoded URLs
    // TODO: Set VITE_WEBSITE_URL environment variable in Vercel dashboard
    console.log('🌐 DASHBOARD URL CONFIG: On Vercel but no env var set, using fallback');
    return "https://kstorybridge.com";
  }
  
  if (currentHostname === 'dashboard.kstorybridge.com') {
    // We're on custom domain dashboard
    console.log('🌐 DASHBOARD URL CONFIG: On custom domain dashboard, using production website');
    return "https://kstorybridge.com";
  }
  
  // Production fallback
  console.log('🌐 DASHBOARD URL CONFIG: Using production fallback');
  const fallbackUrl = "https://kstorybridge.com";
  console.log('🌐 DASHBOARD URL CONFIG: Returning URL:', fallbackUrl);
  return fallbackUrl;
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