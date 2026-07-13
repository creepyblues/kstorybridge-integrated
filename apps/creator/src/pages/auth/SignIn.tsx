import { useState, useEffect } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { signInWithEmail, signInWithOAuth } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'
import { trackSignin } from '@/utils/analytics'

export default function SignIn() {
  const { t } = useTranslation(['auth', 'common'])
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showEmailVerificationAlert, setShowEmailVerificationAlert] = useState(false)
  const [unverifiedEmail, setUnverifiedEmail] = useState('')
  const [isResendingVerification, setIsResendingVerification] = useState(false)

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

  // Check if user is coming from signup or email verification
  useEffect(() => {
    trackSignin('viewed', 'email')
    const fromSignup = searchParams.get('from') === 'signup'
    const emailParam = searchParams.get('email')
    const verified = searchParams.get('verified') === 'true'

    // Show success message after email verification
    if (verified) {
      toast({
        title: "Email verified!",
        description: "Your email has been verified. Please sign in with your password.",
        duration: 5000
      })
    }

    // Show verification reminder after signup
    if (fromSignup && emailParam) {
      setUnverifiedEmail(emailParam)
      setFormData(prev => ({ ...prev, email: emailParam }))
      setShowEmailVerificationAlert(true)
    }
  }, [searchParams, toast])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    trackSignin('attempted', 'email')

    if (!formData.email || !formData.password) {
      setError('Please enter both email and password')
      trackSignin('failed', 'email', 'validation_required_fields')
      return
    }

    setLoading(true)

    try {
      await signInWithEmail(formData.email, formData.password)
      console.log('✅ Signin successful, redirecting to home')
      trackSignin('completed', 'email')
      const redirectUrl = sessionStorage.getItem('redirect_after_login') || '/home'
      sessionStorage.removeItem('redirect_after_login')
      navigate(redirectUrl)
    } catch (err: any) {
      console.error('❌ Signin error:', err)

      // Check for email not confirmed error (robust detection)
      const isEmailNotConfirmed =
        err.message?.toLowerCase().includes('email') &&
        (err.message?.toLowerCase().includes('not confirmed') ||
         err.message?.toLowerCase().includes('verification') ||
         err.message?.toLowerCase().includes('verify')) ||
        err.status === 400

      if (isEmailNotConfirmed) {
        setError('Please verify your email address before signing in.')
        setUnverifiedEmail(formData.email)
        setShowEmailVerificationAlert(true)
        trackSignin('failed', 'email', 'email_not_confirmed')
      } else {
        // Generic error for security (don't leak if email exists)
        setError('Invalid email or password')
        trackSignin('failed', 'email', 'auth_rejected')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleOAuthSignIn = async () => {
    setError(null)
    setLoading(true)
    trackSignin('attempted', 'google')

    try {
      await signInWithOAuth('signin')
      // User will be redirected to Google, then back to /auth/callback
      // Tracking will happen in AuthCallback component
    } catch (err: any) {
      console.error('❌ OAuth signin error:', err)
      setError(err.message || 'Failed to initiate Google signin')
      trackSignin('failed', 'google', 'oauth_start_failed')
      setLoading(false)
    }
  }

  const handleResendVerification = async () => {
    setIsResendingVerification(true)

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: unverifiedEmail,
      })

      if (error) {
        toast({
          title: "Resend failed",
          description: error.message,
          variant: "destructive"
        })
      } else {
        toast({
          title: "Verification email sent",
          description: "Please check your email for the verification link.",
          duration: 5000
        })
        setShowEmailVerificationAlert(false)
      }
    } catch (error) {
      toast({
        title: "Resend failed",
        description: "Failed to resend verification email",
        variant: "destructive"
      })
    } finally {
      setIsResendingVerification(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-porcelain-blue-50 p-4">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="space-y-1 pb-6">
          <CardTitle className="text-3xl font-bold text-midnight-ink">{t('auth:signIn.title')}</CardTitle>
          <CardDescription className="text-base text-midnight-ink-600">
            {t('auth:signIn.subtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Email Verification Alert */}
          {showEmailVerificationAlert && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <h3 className="font-semibold text-amber-800 mb-2">Verify Your Email</h3>
              <p className="text-sm text-amber-700 mb-3">
                {unverifiedEmail
                  ? `We've sent a verification link to ${unverifiedEmail}.`
                  : "We've sent a verification link to your email."}
              </p>
              {unverifiedEmail && (
                <div className="flex gap-2">
                  <Button
                    onClick={handleResendVerification}
                    disabled={isResendingVerification}
                    size="sm"
                    variant="outline"
                    className="border-amber-300 text-amber-700 hover:bg-amber-100"
                  >
                    {isResendingVerification ? 'Sending...' : 'Resend verification email'}
                  </Button>
                  <Button
                    onClick={() => setShowEmailVerificationAlert(false)}
                    size="sm"
                    variant="ghost"
                    className="text-amber-700 hover:bg-amber-100"
                  >
                    Dismiss
                  </Button>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-800 text-sm">
              {error}
            </div>
          )}

          {/* OAuth Signin */}
          <div>
            <Button
              type="button"
              className="w-full h-14 bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 shadow-sm text-base font-medium"
              onClick={handleOAuthSignIn}
              disabled={loading}
            >
              {loading ? (
                t('auth:oauth.redirect')
              ) : (
                <>
                  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  {t('auth:signIn.googleButton')}
                </>
              )}
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-3 text-gray-500">or</span>
            </div>
          </div>

          {/* Email Signin Form */}
          <form onSubmit={handleEmailSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t('auth:signIn.emailLabel')}</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder={t('auth:signIn.emailPlaceholder')}
                value={formData.email}
                onChange={handleInputChange}
                disabled={loading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t('auth:signIn.passwordLabel')}</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder={t('auth:signIn.passwordPlaceholder')}
                value={formData.password}
                onChange={handleInputChange}
                disabled={loading}
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full h-14 bg-hanok-teal hover:bg-hanok-teal/90 text-white text-base font-medium"
              disabled={loading}
            >
              {loading ? t('auth:signIn.submitting') : t('auth:signIn.submitButton')}
            </Button>
          </form>

          {/* Resend verification link (always visible) */}
          <div className="text-center text-sm">
            <button
              type="button"
              onClick={() => {
                if (formData.email) {
                  setUnverifiedEmail(formData.email)
                  setShowEmailVerificationAlert(true)
                } else {
                  toast({
                    title: "Email required",
                    description: "Please enter your email address first",
                    variant: "destructive"
                  })
                }
              }}
              className="text-gray-600 hover:text-hanok-teal underline"
            >
              Didn't receive verification email?
            </button>
          </div>

          <div className="text-center text-sm text-gray-600">
            {t('auth:signIn.noAccount')}{' '}
            <Link to="/signup" className="text-hanok-teal hover:text-hanok-teal/80 font-medium">
              {t('auth:signIn.signUpLink')}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
