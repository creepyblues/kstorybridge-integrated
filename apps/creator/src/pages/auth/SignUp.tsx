import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { signUpWithEmail, signInWithOAuth } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'

export default function SignUp() {
  const { t } = useTranslation(['auth', 'common'])
  const navigate = useNavigate()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    pen_name: '',
    ip_owner_role: 'author' as 'author' | 'agent',
    ip_owner_company: '',
    website_url: '',
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validation
    if (!formData.email || !formData.password || !formData.full_name || !formData.pen_name) {
      setError('Please fill in all required fields')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    try {
      await signUpWithEmail({
        email: formData.email,
        password: formData.password,
        full_name: formData.full_name,
        pen_name: formData.pen_name,
        ip_owner_role: formData.ip_owner_role,
        ip_owner_company: formData.ip_owner_company || undefined,
        website_url: formData.website_url || undefined,
      })

      console.log('✅ Signup successful, showing confirmation message')

      // Show success toast
      toast({
        title: "Account Created!",
        description: "Please check your email to confirm your account.",
      })

      // Sign out to force email verification
      await supabase.auth.signOut()

      // Redirect to signin with email parameter
      navigate(`/signin?from=signup&email=${encodeURIComponent(formData.email)}`, { replace: true })
    } catch (err: any) {
      console.error('❌ Signup error:', err)
      setError(err.message || 'Failed to sign up. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleOAuthSignUp = async () => {
    setError(null)
    setLoading(true)

    try {
      await signInWithOAuth('signup')
      // User will be redirected to Google, then back to /auth/callback
    } catch (err: any) {
      console.error('❌ OAuth signup error:', err)
      setError(err.message || 'Failed to initiate Google signup')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-porcelain-blue-50 p-4">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="space-y-1 pb-6">
          <CardTitle className="text-3xl font-bold text-midnight-ink">{t('auth:signUp.title')}</CardTitle>
          <CardDescription className="text-base text-midnight-ink-600">
            {t('auth:signUp.subtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-800 text-sm">
              {error}
            </div>
          )}

          {/* OAuth Signup */}
          <div>
            <Button
              type="button"
              className="w-full h-14 bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 shadow-sm text-base font-medium"
              onClick={handleOAuthSignUp}
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
                  {t('auth:signUp.googleButton')}
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

          {/* Email Signup Form */}
          <form onSubmit={handleEmailSignUp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-900">
                {t('auth:signUp.emailLabel')} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder={t('auth:signUp.emailPlaceholder')}
                value={formData.email}
                onChange={handleInputChange}
                disabled={loading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-900">
                {t('auth:signUp.passwordLabel')} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder={t('auth:signUp.passwordPlaceholder')}
                value={formData.password}
                onChange={handleInputChange}
                disabled={loading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-900">
                {t('auth:signUp.passwordLabel')} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder={t('auth:signUp.passwordPlaceholder')}
                value={formData.confirmPassword}
                onChange={handleInputChange}
                disabled={loading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="full_name" className="text-sm font-medium text-gray-900">
                {t('auth:signUp.fullNameLabel')} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="full_name"
                name="full_name"
                type="text"
                placeholder={t('auth:signUp.fullNamePlaceholder')}
                value={formData.full_name}
                onChange={handleInputChange}
                disabled={loading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pen_name" className="text-sm font-medium text-gray-900">
                {t('auth:signUp.penNameLabel')} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="pen_name"
                name="pen_name"
                type="text"
                placeholder={t('auth:signUp.penNamePlaceholder')}
                value={formData.pen_name}
                onChange={handleInputChange}
                disabled={loading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ip_owner_role" className="text-sm font-medium text-gray-900">
                {t('auth:signUp.roleLabel')} <span className="text-red-500">*</span>
              </Label>
              <select
                id="ip_owner_role"
                name="ip_owner_role"
                value={formData.ip_owner_role}
                onChange={handleInputChange}
                disabled={loading}
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hanok-teal"
                required
              >
                <option value="author">{t('auth:signUp.roleAuthor')}</option>
                <option value="agent">{t('auth:signUp.roleAgent')}</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ip_owner_company" className="text-sm font-medium text-gray-900">
                {t('auth:signUp.companyLabel')}
              </Label>
              <Input
                id="ip_owner_company"
                name="ip_owner_company"
                type="text"
                placeholder={t('auth:signUp.companyPlaceholder')}
                value={formData.ip_owner_company}
                onChange={handleInputChange}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website_url" className="text-sm font-medium text-gray-900">
                {t('auth:signUp.websiteLabel')}
              </Label>
              <Input
                id="website_url"
                name="website_url"
                type="url"
                placeholder={t('auth:signUp.websitePlaceholder')}
                value={formData.website_url}
                onChange={handleInputChange}
                disabled={loading}
              />
            </div>

            <Button
              type="submit"
              className="w-full h-14 bg-hanok-teal hover:bg-hanok-teal/90 text-white text-base font-medium"
              disabled={loading}
            >
              {loading ? t('auth:signUp.submitting') : t('auth:signUp.submitButton')}
            </Button>
          </form>

          <div className="text-center text-sm text-gray-600">
            {t('auth:signUp.alreadyHaveAccount')}{' '}
            <Link to="/signin" className="text-hanok-teal hover:text-hanok-teal/80 font-medium">
              {t('auth:signUp.signInLink')}
            </Link>
          </div>

          {/* Legal Links */}
          <div className="text-center text-xs text-gray-600 pt-4 border-t border-gray-200">
            By signing up, you agree to our{' '}
            <a
              href="https://kstorybridge.com/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sunrise-coral-600 hover:text-sunrise-coral-700 underline"
            >
              Terms of Use
            </a>
            {' '}and{' '}
            <a
              href="https://kstorybridge.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sunrise-coral-600 hover:text-sunrise-coral-700 underline"
            >
              Privacy Policy
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
