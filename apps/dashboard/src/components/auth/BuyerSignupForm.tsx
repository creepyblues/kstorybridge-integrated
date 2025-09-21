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
}

export const BuyerSignupForm: React.FC<BuyerSignupFormProps> = ({
  formData,
  onChange,
  passwordError,
  roleError,
  hidePassword = false
}) => {
  const handleChange = (field: keyof BuyerFormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    onChange({ [field]: e.target.value });
  };

  const handleRoleChange = (value: string) => {
    onChange({ buyer_role: value });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="email">Email</Label>
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
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={formData.password}
            onChange={handleChange('password')}
            required
            className="mt-1"
          />
          {passwordError && (
            <p className="text-red-500 text-sm mt-1">{passwordError}</p>
          )}
        </div>
      )}

      <div>
        <Label htmlFor="full_name">Full Name</Label>
        <Input
          id="full_name"
          type="text"
          value={formData.full_name}
          onChange={handleChange('full_name')}
          required
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="buyer_company">Company</Label>
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
        <Label htmlFor="buyer_role">Role</Label>
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