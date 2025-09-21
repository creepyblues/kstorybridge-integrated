import { Input } from '@kstorybridge/ui';
import { Label } from '@kstorybridge/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@kstorybridge/ui';
import type { CreatorFormData } from './types';

interface CreatorSignupFormProps {
  formData: CreatorFormData;
  onChange: (data: Partial<CreatorFormData>) => void;
  passwordError: string | null;
  roleError?: string | null;
  hidePassword?: boolean;
}

export const CreatorSignupForm: React.FC<CreatorSignupFormProps> = ({
  formData,
  onChange,
  passwordError,
  roleError = null,
  hidePassword = false
}) => {
  const handleChange = (field: keyof CreatorFormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    onChange({ [field]: e.target.value });
  };

  const handleRoleChange = (value: string) => {
    onChange({ ip_owner_role: value as CreatorFormData['ip_owner_role'] });
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
          readOnly={hidePassword} // Read-only for OAuth completion
          className={`mt-1 ${hidePassword ? 'bg-gray-100' : ''}`}
        />
      </div>

      <div>
        <Label htmlFor="pen_name">Pen Name / Studio Name <span className="text-red-500">*</span></Label>
        <Input
          id="pen_name"
          type="text"
          value={formData.pen_name}
          onChange={handleChange('pen_name')}
          required
          className="mt-1"
          placeholder="Your creative/professional name"
        />
      </div>

      <div>
        <Label htmlFor="ip_owner_role">Role <span className="text-red-500">*</span></Label>
        <Select
          value={formData.ip_owner_role}
          onValueChange={handleRoleChange}
          required
        >
          <SelectTrigger id="ip_owner_role" className="mt-1">
            <SelectValue placeholder="Select your role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="author">Author</SelectItem>
            <SelectItem value="agent">Agent</SelectItem>
          </SelectContent>
        </Select>
        {roleError && (
          <p className="text-red-500 text-sm mt-1">{roleError}</p>
        )}
      </div>

      <div>
        <Label htmlFor="ip_owner_company">Company (Optional)</Label>
        <Input
          id="ip_owner_company"
          type="text"
          value={formData.ip_owner_company}
          onChange={handleChange('ip_owner_company')}
          className="mt-1"
          placeholder="Your company or studio"
        />
      </div>

      <div>
        <Label htmlFor="website_url">Website URL (Optional)</Label>
        <Input
          id="website_url"
          type="url"
          value={formData.website_url}
          onChange={handleChange('website_url')}
          placeholder="https://yourwebsite.com"
          className="mt-1"
        />
      </div>
    </div>
  );
};
