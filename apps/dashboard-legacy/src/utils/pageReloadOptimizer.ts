/**
 * Page Reload Optimizer
 * 
 * Detects page reloads and optimizes authentication flow to prevent
 * database connection issues and improve performance.
 */

export class PageReloadOptimizer {
  private static instance: PageReloadOptimizer;
  private isPageReload: boolean = false;
  private reloadTimestamp: number = 0;
  
  private constructor() {
    this.detectPageReload();
  }
  
  public static getInstance(): PageReloadOptimizer {
    if (!PageReloadOptimizer.instance) {
      PageReloadOptimizer.instance = new PageReloadOptimizer();
    }
    return PageReloadOptimizer.instance;
  }
  
  private detectPageReload(): void {
    try {
      // Method 1: Performance Navigation API (most reliable)
      if (performance.navigation && performance.navigation.type === 1) {
        this.isPageReload = true;
        console.log('🔄 Page Reload Detected: Performance Navigation API');
      }
      
      // Method 2: Check performance timing
      const perfEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (perfEntry && perfEntry.type === 'reload') {
        this.isPageReload = true;
        console.log('🔄 Page Reload Detected: Performance Timing API');
      }
      
      // Method 3: Session storage fallback
      const lastVisit = sessionStorage.getItem('last_page_visit');
      const currentTime = Date.now();
      
      if (lastVisit && (currentTime - parseInt(lastVisit)) < 2000) {
        this.isPageReload = true;
        console.log('🔄 Page Reload Detected: Session Storage Timing');
      }
      
      // Store current visit time
      sessionStorage.setItem('last_page_visit', currentTime.toString());
      this.reloadTimestamp = currentTime;
      
    } catch (error) {
      console.warn('⚠️ Page reload detection failed:', error);
      this.isPageReload = false;
    }
  }
  
  public isReload(): boolean {
    return this.isPageReload;
  }
  
  public getOptimalStrategy(): {
    preferCache: boolean;
    skipHealthChecks: boolean;
    useAsyncOperations: boolean;
    reduceDatabaseQueries: boolean;
  } {
    if (this.isPageReload) {
      return {
        preferCache: true,           // Use cached data aggressively
        skipHealthChecks: true,      // Skip immediate health checks
        useAsyncOperations: true,    // Move operations off critical path
        reduceDatabaseQueries: true  // Minimize database load
      };
    }
    
    return {
      preferCache: false,
      skipHealthChecks: false,
      useAsyncOperations: false,
      reduceDatabaseQueries: false
    };
  }
  
  public shouldOptimizeForReload(operation: 'auth' | 'accountType' | 'healthCheck'): boolean {
    if (!this.isPageReload) return false;
    
    const timeSinceReload = Date.now() - this.reloadTimestamp;
    
    // Apply optimizations for first 5 seconds after reload
    if (timeSinceReload > 5000) return false;
    
    switch (operation) {
      case 'auth':
        return true;  // Always optimize auth on reload
      case 'accountType':
        return true;  // Always prefer cache for account type
      case 'healthCheck':
        return true;  // Skip immediate health checks
      default:
        return false;
    }
  }
  
  public logOptimization(operation: string, action: string): void {
    if (this.isPageReload) {
      console.log(`⚡ Page Reload Optimization: ${operation} - ${action}`);
    }
  }
}

// Export singleton instance
export const pageReloadOptimizer = PageReloadOptimizer.getInstance();