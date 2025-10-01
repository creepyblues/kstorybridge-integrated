/**
 * Navigation utilities for account-type-aware routing
 */

export type AccountType = 'buyer' | 'creator';

/**
 * Get the correct profile path based on account type
 */
export const getProfilePath = (accountType: AccountType): string => {
  return accountType === 'creator' ? '/creators/profile' : '/buyers/profile';
};

/**
 * Get the correct home path based on account type
 */
export const getHomePath = (accountType: AccountType): string => {
  return accountType === 'creator' ? '/creators/home' : '/buyers/chat';
};

/**
 * Get the correct titles path based on account type
 */
export const getTitlesPath = (accountType: AccountType): string => {
  return accountType === 'creator' ? '/creators/titles' : '/buyers/titles';
};

/**
 * Get the correct settings path based on account type
 */
export const getSettingsPath = (accountType: AccountType): string => {
  return accountType === 'creator' ? '/creators/settings' : '/buyers/settings';
};

/**
 * Get the correct base path for account type
 */
export const getBasePath = (accountType: AccountType): string => {
  return accountType === 'creator' ? '/creators' : '/buyers';
};