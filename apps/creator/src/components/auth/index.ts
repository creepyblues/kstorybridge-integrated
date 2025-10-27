export { SignupFormContainer } from './SignupFormContainer';
export { BuyerSignupForm } from './BuyerSignupForm';
export { CreatorSignupForm } from './CreatorSignupForm';
export { OAuthProviders } from './OAuthProviders';

export type {
  AccountType,
  BuyerFormData,
  CreatorFormData,
  SignupState,
  SignupCallbacks
} from './types';

export {
  validatePassword,
  validateBuyerForm,
  validateCreatorForm,
  isBlockedEmail,
  validateBuyerRole
} from './validation';

export {
  signupBuyer,
  signupCreator,
  handleOAuthSignup
} from './signupService';