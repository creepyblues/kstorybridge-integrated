import type { BuyerFormData, CreatorFormData } from './types';

/**
 * Password validation function
 */
export const validatePassword = (password: string): string | null => {
  if (password.length < 6) {
    return "Password must be at least 6 characters long";
  }

  // Check for at least one lowercase letter
  if (!/[a-z]/.test(password)) {
    return "Password must contain at least one lowercase letter";
  }

  // Check for at least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    return "Password must contain at least one uppercase letter";
  }

  // Check for at least one number
  if (!/[0-9]/.test(password)) {
    return "Password must contain at least one number";
  }

  // Check for at least one special character
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~]/.test(password)) {
    return "Password must contain at least one special character";
  }

  return null;
};

/**
 * Validate buyer form data
 */
export const validateBuyerForm = (formData: BuyerFormData): string | null => {
  if (!formData.email.trim()) return "Email is required";
  if (!formData.password.trim()) return "Password is required";
  if (!formData.full_name.trim()) return "Full name is required";
  if (!formData.buyer_company.trim()) return "Company is required";
  if (!formData.buyer_role.trim()) return "Role is required";

  // Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(formData.email)) {
    return "Please enter a valid email address";
  }

  // Password validation
  const passwordError = validatePassword(formData.password);
  if (passwordError) return passwordError;

  return null;
};

/**
 * Validate creator form data
 */
export const validateCreatorForm = (formData: CreatorFormData): string | null => {
  if (!formData.email.trim()) return "Email is required";
  if (!formData.password.trim()) return "Password is required";
  if (!formData.full_name.trim()) return "Full name is required";
  if (!formData.pen_name.trim()) return "Pen name is required";
  if (!formData.ip_owner_role) return "Role is required";

  // Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(formData.email)) {
    return "Please enter a valid email address";
  }

  // Password validation
  const passwordError = validatePassword(formData.password);
  if (passwordError) return passwordError;

  return null;
};

/**
 * Check for blocked email domains
 */
export const isBlockedEmail = (email: string): boolean => {
  const blockedDomains = ['dadble.com', 'sandstoneartists.com'];
  const domain = email.split('@')[1]?.toLowerCase();
  return blockedDomains.includes(domain);
};

/**
 * Validate role selection for buyer
 */
export const validateBuyerRole = (role: string): string | null => {
  const validRoles = [
    'producer',
    'executive',
    'agent',
    'content_scout',
    'other'
  ];

  if (!validRoles.includes(role)) {
    return "Please select a valid role";
  }

  return null;
};

/**
 * Normalize creator role input to the enum or default to author
 */
export const normalizeCreatorRole = (role?: string | null): 'author' | 'agent' => {
  if (!role) {
    return 'author'; // Default to 'author' since role is now required
  }

  const normalized = role.trim().toLowerCase();
  return normalized === 'author' || normalized === 'agent' ? normalized : 'author';
};

/**
 * Validate role selection for creator
 */
export const validateCreatorRole = (role: string): string | null => {
  if (!role || !role.trim()) {
    return "Please select a role";
  }

  const normalizedRole = normalizeCreatorRole(role);
  if (!normalizedRole) {
    return "Please select a valid role";
  }

  return null;
};
