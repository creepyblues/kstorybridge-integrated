/**
 * Admin-specific storage adapter to isolate admin authentication
 * from website and dashboard authentication
 */

export interface StorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/**
 * Create an isolated storage adapter for admin app with cross-tab synchronization
 * All keys are prefixed with 'admin-' to avoid conflicts
 */
export const createAdminStorage = (): StorageAdapter => {
  const ADMIN_PREFIX = 'admin-';
  
  return {
    getItem: (key: string): string | null => {
      try {
        const value = localStorage.getItem(`${ADMIN_PREFIX}${key}`);
        if (key.includes('auth-token') && value) {
          console.log(`🔑 AdminStorage: Retrieved ${key} from storage`);
        }
        return value;
      } catch (error) {
        console.error('AdminStorage getItem error:', error);
        return null;
      }
    },
    
    setItem: (key: string, value: string): void => {
      try {
        localStorage.setItem(`${ADMIN_PREFIX}${key}`, value);
        if (key.includes('auth-token')) {
          console.log(`🔐 AdminStorage: Stored ${key} in storage`);
          // Dispatch custom event for cross-tab sync
          window.dispatchEvent(new CustomEvent('admin-auth-change', { 
            detail: { key, action: 'set' }
          }));
        }
      } catch (error) {
        console.error('AdminStorage setItem error:', error);
      }
    },
    
    removeItem: (key: string): void => {
      try {
        localStorage.removeItem(`${ADMIN_PREFIX}${key}`);
        if (key.includes('auth-token')) {
          console.log(`🗑️ AdminStorage: Removed ${key} from storage`);
          // Dispatch custom event for cross-tab sync
          window.dispatchEvent(new CustomEvent('admin-auth-change', { 
            detail: { key, action: 'remove' }
          }));
        }
      } catch (error) {
        console.error('AdminStorage removeItem error:', error);
      }
    }
  };
};

/**
 * Get the admin storage instance
 */
export const adminStorage = createAdminStorage();

/**
 * Clear all admin-specific storage
 * Useful for debugging and clean logout
 */
export const clearAdminStorage = (): void => {
  try {
    const keys = Object.keys(localStorage);
    const adminKeys = keys.filter(key => key.startsWith('admin-'));
    
    adminKeys.forEach(key => {
      localStorage.removeItem(key);
    });
    
    console.log(`🧹 Cleared ${adminKeys.length} admin storage keys`);
  } catch (error) {
    console.error('Error clearing admin storage:', error);
  }
};

/**
 * Debug function to list all admin storage keys
 */
export const debugAdminStorage = (): void => {
  try {
    const keys = Object.keys(localStorage);
    const adminKeys = keys.filter(key => key.startsWith('admin-'));
    
    console.log('🔍 Admin Storage Debug:');
    console.log(`   Total admin keys: ${adminKeys.length}`);
    
    adminKeys.forEach(key => {
      const value = localStorage.getItem(key);
      const truncatedValue = value && value.length > 100 
        ? value.substring(0, 100) + '...' 
        : value;
      console.log(`   ${key}: ${truncatedValue}`);
    });
  } catch (error) {
    console.error('Error debugging admin storage:', error);
  }
};

// Make debug functions available globally in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).clearAdminStorage = clearAdminStorage;
  (window as any).debugAdminStorage = debugAdminStorage;
}