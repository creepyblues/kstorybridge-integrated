import { useState } from 'react';
import { Button } from '@kstorybridge/ui';
import { Input } from '@kstorybridge/ui';
import { Label } from '@kstorybridge/ui';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Eye, EyeOff } from 'lucide-react';

interface PasswordResetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PasswordResetModal({ isOpen, onClose }: PasswordResetModalProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { toast } = useToast();

  const validatePassword = (pwd: string): string[] => {
    const errors: string[] = [];
    
    if (pwd.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    if (!/(?=.*[a-z])/.test(pwd)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/(?=.*[A-Z])/.test(pwd)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/(?=.*\d)/.test(pwd)) {
      errors.push('Password must contain at least one number');
    }
    
    return errors;
  };

  // Check if we should use mock data for localhost development
  const shouldUseMockData = () => {
    const isLocalhost = window.location.hostname === 'localhost';
    const bypassEnabled = import.meta.env.VITE_DISABLE_AUTH_LOCALHOST === 'true';
    const isDev = import.meta.env.DEV;
    
    return isLocalhost && bypassEnabled && isDev;
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    try {
      // Validate new password
      const passwordErrors = validatePassword(newPassword);
      if (passwordErrors.length > 0) {
        const errorMsg = passwordErrors.join('. ');
        setErrorMessage(errorMsg);
        toast({
          title: "Password Requirements",
          description: errorMsg,
          variant: "destructive",
          duration: 8000
        });
        return;
      }

      // Check password confirmation
      if (newPassword !== confirmPassword) {
        const errorMsg = "Passwords do not match. Please try again.";
        setErrorMessage(errorMsg);
        toast({
          title: "Password Mismatch",
          description: errorMsg,
          variant: "destructive"
        });
        return;
      }

      // Check if new password is different from current
      if (newPassword === currentPassword) {
        const errorMsg = "New password must be different from your current password.";
        setErrorMessage(errorMsg);
        toast({
          title: "Same Password",
          description: errorMsg,
          variant: "destructive"
        });
        return;
      }

      // Show progress toast
      toast({
        title: "Updating Password...",
        description: "Please wait while we update your password.",
        duration: 3000
      });

      // Handle mock mode for localhost development
      if (shouldUseMockData()) {
        // Simulate async operation
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // For mock mode, just simulate success
        toast({
          title: "Password Updated Successfully!",
          description: "Your password has been changed successfully (mock mode).",
          duration: 6000
        });
        
        // Reset form and close modal
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setErrorMessage('');
        onClose();
        return;
      }

      // Update the password using Supabase
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        console.error('Password update error:', error);
        
        // Provide more specific error messages
        let errorMsg = error.message;
        if (error.message.includes('same password')) {
          errorMsg = "New password must be different from your current password.";
        } else if (error.message.includes('password')) {
          errorMsg = "Password update failed. Please check your password requirements and try again.";
        }
        
        setErrorMessage(errorMsg);
        toast({
          title: "Update Failed",
          description: errorMsg,
          variant: "destructive",
          duration: 6000
        });
      } else {
        console.log('Password update successful:', data);
        
        toast({
          title: "Password Updated Successfully!",
          description: "Your password has been changed successfully.",
          duration: 6000
        });
        
        // Reset form and close modal
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setErrorMessage('');
        onClose();
      }
    } catch (error) {
      console.error('Unexpected error during password update:', error);
      const errorMsg = "Something went wrong. Please try again.";
      setErrorMessage(errorMsg);
      toast({
        title: "Unexpected Error",
        description: errorMsg,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setErrorMessage('');
      onClose();
    }
  };

  // If not open, return null
  if (!isOpen) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 z-[9999] flex items-center justify-center transition-opacity duration-200"
      onClick={handleClose}
      style={{ 
        backdropFilter: 'blur(4px)'
      }}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-md w-[90vw] p-6 relative overflow-hidden transition-all duration-300"
        onClick={(e) => e.stopPropagation()}
        style={{ 
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100 transition-opacity"
          disabled={isLoading}
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          <span className="sr-only">Close</span>
        </button>

        {/* Header */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-midnight-ink mb-2">
            Change Password
          </h2>
          <p className="text-midnight-ink-600 text-sm">
            Update your account password. Make sure to use a strong password.
          </p>
        </div>

        {/* Error Message Display */}
        {errorMessage && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-red-800">
                  Password Update Error
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{errorMessage}</p>
                </div>
              </div>
              <div className="ml-auto pl-3">
                <button
                  type="button"
                  onClick={() => setErrorMessage('')}
                  className="inline-flex text-red-400 hover:text-red-500"
                >
                  <span className="sr-only">Dismiss</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handlePasswordUpdate} className="space-y-4">
          {/* Current Password Field */}
          <div className="space-y-2">
            <Label htmlFor="currentPassword" className="text-sm font-medium text-midnight-ink">
              Current Password
            </Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showCurrentPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="pr-12"
                placeholder="Enter current password"
                required
                disabled={isLoading}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                {showCurrentPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                )}
              </button>
            </div>
          </div>

          {/* New Password Field */}
          <div className="space-y-2">
            <Label htmlFor="newPassword" className="text-sm font-medium text-midnight-ink">
              New Password
            </Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="pr-12"
                placeholder="Enter new password"
                required
                disabled={isLoading}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                )}
              </button>
            </div>
            <div className="mt-2">
              <p className="text-xs text-midnight-ink-500 mb-2">
                Password requirements:
              </p>
              {newPassword && (
                <div className="space-y-1 text-xs">
                  {[
                    { test: newPassword.length >= 8, text: "At least 8 characters" },
                    { test: /(?=.*[a-z])/.test(newPassword), text: "One lowercase letter" },
                    { test: /(?=.*[A-Z])/.test(newPassword), text: "One uppercase letter" },
                    { test: /(?=.*\d)/.test(newPassword), text: "One number" }
                  ].map((req, index) => (
                    <div key={index} className={`flex items-center ${req.test ? 'text-green-600' : 'text-red-500'}`}>
                      <svg className="w-3 h-3 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        {req.test ? (
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        ) : (
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        )}
                      </svg>
                      {req.text}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Confirm New Password Field */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-sm font-medium text-midnight-ink">
              Confirm New Password
            </Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pr-12"
                placeholder="Confirm new password"
                required
                disabled={isLoading}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                )}
              </button>
            </div>
            {confirmPassword && (
              <div className="mt-2">
                <div className={`flex items-center text-xs ${newPassword === confirmPassword ? 'text-green-600' : 'text-red-500'}`}>
                  <svg className="w-3 h-3 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    {newPassword === confirmPassword ? (
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    ) : (
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    )}
                  </svg>
                  {newPassword === confirmPassword ? 'Passwords match' : 'Passwords do not match'}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3 space-y-3 space-y-reverse sm:space-y-0 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !currentPassword || !newPassword || !confirmPassword}
              className="w-full sm:w-auto bg-hanok-teal hover:bg-hanok-teal-600"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  <span>Updating...</span>
                </div>
              ) : (
                'Update Password'
              )}
            </Button>
          </div>

          {/* Progress indicator when loading */}
          {isLoading && (
            <div className="mt-4 text-center">
              <p className="text-sm text-midnight-ink-500">
                Please wait while we securely update your password...
              </p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}