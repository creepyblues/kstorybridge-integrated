export type AccountType = 'buyer' | 'creator';

export interface BuyerFormData {
  email: string;
  password: string;
  full_name: string;
  buyer_company: string;
  buyer_role: 'producer' | 'executive' | 'agent' | 'content_scout' | 'other';
  linkedin_url: string;
  tier?: 'basic' | 'invited' | 'pro' | 'suite';
  requested?: boolean;
}

export interface CreatorFormData {
  email: string;
  password: string;
  full_name: string;
  pen_name: string;
  ip_owner_role: 'author' | 'agent';
  ip_owner_company: string;
  website_url: string;
  invitation_status?: string;
}

export interface SignupState {
  isLoading: boolean;
  isGoogleLoading: boolean;
  isOAuthUser: boolean;
  oAuthUserId: string | null;
  rejectionAlert: {email: string; message: string} | null;
  passwordError: string | null;
  roleError: string | null;
}

export interface SignupCallbacks {
  onSubmit: () => Promise<void>;
  onGoogleSignup: () => Promise<void>;
  onDiscordSignup: () => Promise<void>;
}