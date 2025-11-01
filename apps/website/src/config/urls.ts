/**
 * URL configuration for different environments
 * Supports environment variables for flexible local testing
 */

export function getDashboardUrl(): string {
  // Check if we're in development mode FIRST (highest priority for local testing)
  if (import.meta.env.DEV) {
    console.log('🌐 WEBSITE URL CONFIG: Using dev dashboard URL');
    return "http://localhost:8081"; // Dashboard dev port
  }

  // Check for explicit environment variable override (staging/production only)
  if (import.meta.env.VITE_DASHBOARD_URL) {
    console.log('🌐 WEBSITE URL CONFIG: Using VITE_DASHBOARD_URL:', import.meta.env.VITE_DASHBOARD_URL);
    return import.meta.env.VITE_DASHBOARD_URL;
  }

  // Check current hostname to determine if we're on a Vercel deployment
  const currentHostname = window.location.hostname;
  console.log('🌐 WEBSITE URL CONFIG: Current hostname:', currentHostname);
  console.log('🌐 WEBSITE URL CONFIG: Environment variables:', {
    VITE_DASHBOARD_URL: import.meta.env.VITE_DASHBOARD_URL,
    DEV: import.meta.env.DEV,
    MODE: import.meta.env.MODE
  });

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

export function getCreatorUrl(): string {
  // Check if we're in development mode FIRST (highest priority for local testing)
  if (import.meta.env.DEV) {
    console.log('🌐 WEBSITE URL CONFIG: Using dev creator URL');
    return "http://localhost:8083"; // Creator dev port
  }

  // Check for explicit environment variable override (staging/production only)
  if (import.meta.env.VITE_CREATOR_URL) {
    console.log('🌐 WEBSITE URL CONFIG: Using VITE_CREATOR_URL:', import.meta.env.VITE_CREATOR_URL);
    return import.meta.env.VITE_CREATOR_URL;
  }

  // Check current hostname to determine if we're on a Vercel deployment
  const currentHostname = window.location.hostname;
  console.log('🌐 WEBSITE URL CONFIG: Current hostname:', currentHostname);

  if (currentHostname.includes('vercel.app')) {
    console.log('🌐 WEBSITE URL CONFIG: On Vercel but no env var set, using fallback');
    return "https://creator.kstorybridge.com";
  }

  // Production fallback
  console.log('🌐 WEBSITE URL CONFIG: Using production fallback');
  return "https://creator.kstorybridge.com";
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