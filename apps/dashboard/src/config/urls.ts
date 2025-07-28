/**
 * URL configuration for different environments
 * Supports environment variables for flexible local testing
 */

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
    // Replace dashboard subdomain with www or root domain
    const vercelUrl = import.meta.env.VITE_VERCEL_URL;
    if (vercelUrl.includes('dashboard-')) {
      return vercelUrl.replace('dashboard-', '');
    }
    // If it's a custom domain, replace dashboard. with www.
    return vercelUrl.replace('dashboard.', 'www.');
  }
  
  // Production fallback
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