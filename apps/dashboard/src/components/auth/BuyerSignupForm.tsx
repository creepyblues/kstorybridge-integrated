import { Input } from '@kstorybridge/ui';
import { Label } from '@kstorybridge/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@kstorybridge/ui';
import type { BuyerFormData } from './types';

interface BuyerSignupFormProps {
  formData: BuyerFormData;
  onChange: (data: Partial<BuyerFormData>) => void;
  passwordError: string | null;
  roleError: string | null;
  hidePassword?: boolean;
  showRoleValidation?: boolean;
}

export const BuyerSignupForm: React.FC<BuyerSignupFormProps> = ({
  formData,
  onChange,
  passwordError,
  roleError,
  hidePassword = false,
  showRoleValidation = false
}) => {
  const handleChange = (field: keyof BuyerFormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    onChange({ [field]: e.target.value });
    // Clear custom validity when user types
    e.target.setCustomValidity('');
  };

  const validatePassword = (password: string, inputElement: HTMLInputElement) => {
    if (!password) {
      inputElement.setCustomValidity('Password is required');
      return false;
    } else if (password.length < 6) {
      inputElement.setCustomValidity('Password must be at least 6 characters long');
      return false;
    } else if (!/[a-z]/.test(password)) {
      inputElement.setCustomValidity('Password must contain at least one lowercase letter');
      return false;
    } else if (!/[A-Z]/.test(password)) {
      inputElement.setCustomValidity('Password must contain at least one uppercase letter');
      return false;
    } else if (!/[0-9]/.test(password)) {
      inputElement.setCustomValidity('Password must contain at least one number');
      return false;
    } else if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~]/.test(password)) {
      inputElement.setCustomValidity('Password must contain at least one special character');
      return false;
    } else {
      inputElement.setCustomValidity('');
      return true;
    }
  };

  const handlePasswordInvalid = (e: React.InvalidEvent<HTMLInputElement>) => {
    validatePassword(formData.password, e.target);
  };

  const handlePasswordBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (formData.password && formData.password.length > 0) {
      const isValid = validatePassword(formData.password, e.target);
      if (!isValid) {
        e.target.reportValidity(); // Show browser validation popup
      }
    }
  };

  const handleRoleChange = (value: string) => {
    onChange({ buyer_role: value });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={handleChange('email')}
          required
          readOnly={hidePassword} // Read-only for OAuth completion
          className={`mt-1 ${hidePassword ? 'bg-gray-100' : ''}`}
        />
      </div>

      {!hidePassword && (
        <div>
          <Label htmlFor="password">Password <span className="text-red-500">*</span></Label>
          <Input
            id="password"
            type="password"
            value={formData.password}
            onChange={handleChange('password')}
            onBlur={handlePasswordBlur}
            onInvalid={handlePasswordInvalid}
            required
            className="mt-1"
          />
          <p className="text-sm text-gray-700 mt-1.5 mb-1">
            Password must be at least 6 characters and include: uppercase letter, lowercase letter, number, and special character
          </p>
          {passwordError && (
            <p className="text-red-500 text-sm mt-1">{passwordError}</p>
          )}
        </div>
      )}

      <div>
        <Label htmlFor="full_name">Full Name <span className="text-red-500">*</span></Label>
        <Input
          id="full_name"
          type="text"
          value={formData.full_name}
          onChange={handleChange('full_name')}
          required
          readOnly={hidePassword} // Read-only for OAuth completion
          className={`mt-1 ${hidePassword ? 'bg-gray-100' : ''}`}
        />
      </div>

      <div>
        <Label htmlFor="buyer_company">Company <span className="text-red-500">*</span></Label>
        <Input
          id="buyer_company"
          type="text"
          value={formData.buyer_company}
          onChange={handleChange('buyer_company')}
          required
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="buyer_role">Role <span className="text-red-500">*</span></Label>
        <Select onValueChange={handleRoleChange} value={formData.buyer_role}>
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Select your role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="producer">Producer</SelectItem>
            <SelectItem value="executive">Executive</SelectItem>
            <SelectItem value="agent">Agent</SelectItem>
            <SelectItem value="content_scout">Content Scout</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-sm text-gray-700 mt-1.5 mb-1">
          Please select your primary role in content acquisition
        </p>
        {(!formData.buyer_role && showRoleValidation) && (
          <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
            <span>⚠️</span>
            Please select your role
          </p>
        )}
        {roleError && (
          <p className="text-red-500 text-sm mt-1">{roleError}</p>
        )}
      </div>

      <div>
        <Label htmlFor="linkedin_url">LinkedIn URL (Optional)</Label>
        <Input
          id="linkedin_url"
          type="url"
          value={formData.linkedin_url}
          onChange={handleChange('linkedin_url')}
          placeholder="https://linkedin.com/in/yourprofile"
          className="mt-1"
        />
      </div>
    </div>
  );
};