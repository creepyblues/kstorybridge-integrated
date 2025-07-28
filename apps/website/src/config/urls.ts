/**
 * URL configuration for different environments
 * Supports environment variables for flexible local testing
 */

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
    const vercelUrl = import.meta.env.VITE_VERCEL_URL;
    // If we're on the main site, add dashboard subdomain
    if (!vercelUrl.includes('dashboard')) {
      return vercelUrl.replace('://', '://dashboard.');
    }
    return vercelUrl;
  }
  
  // Production fallback
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