/**
 * Navigation utilities for account-type-aware routing
 */

export type AccountType = 'buyer' | 'ip_owner';

/**
 * Get the correct profile path based on account type
 */
export const getProfilePath = (accountType: AccountType): string => {
  return accountType === 'ip_owner' ? '/creators/profile' : '/buyers/profile';
};

/**
 * Get the correct home path based on account type
 */
export const getHomePath = (accountType: AccountType): string => {
  return accountType === 'ip_owner' ? '/creators/home' : '/buyers/home';
};

/**
 * Get the correct titles path based on account type
 */
export const getTitlesPath = (accountType: AccountType): string => {
  return accountType === 'ip_owner' ? '/creators/titles' : '/buyers/titles';
};

/**
 * Get the correct settings path based on account type
 */
export const getSettingsPath = (accountType: AccountType): string => {
  return accountType === 'ip_owner' ? '/creators/settings' : '/buyers/settings';
};

/**
 * Get the correct base path for account type
 */
export const getBasePath = (accountType: AccountType): string => {
  return accountType === 'ip_owner' ? '/creators' : '/buyers';
};