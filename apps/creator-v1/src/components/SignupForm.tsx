// Legacy SignupForm component - now a wrapper around modular components
import { SignupFormContainer } from './auth/SignupFormContainer';
import type { AccountType } from './auth/types';

interface SignupFormProps {
  accountType: AccountType;
}

const SignupForm = ({ accountType }: SignupFormProps) => {
  return <SignupFormContainer accountType={accountType} />;
};

export default SignupForm;