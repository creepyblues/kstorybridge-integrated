import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { completeOAuthProfile } from '@/lib/auth'
import { consumePostAuthRedirect } from '@/lib/postAuthRedirect'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { trackCreatorProfileCompleted, trackSignup } from '@/utils/analytics'

export default function CompleteProfile() {
  const { t } = useTranslation(['auth', 'common'])
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    full_name: user?.user_metadata?.full_name || '',
    pen_name: '',
    ip_owner_role: 'author' as 'author' | 'agent',
    ip_owner_company: '',
    website_url: '',
    newsletter_consent: true,
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validation
    if (!formData.full_name || !formData.pen_name) {
      setError('Please fill in all required fields')
      return
    }

    setLoading(true)

    try {
      await completeOAuthProfile({
        full_name: formData.full_name,
        pen_name: formData.pen_name,
        ip_owner_role: formData.ip_owner_role,
        ip_owner_company: formData.ip_owner_company || undefined,
        website_url: formData.website_url || undefined,
        newsletter_consent: formData.newsletter_consent,
      })

      console.log('✅ Profile completion successful')

      // Track successful OAuth signup completion
      trackCreatorProfileCompleted()
      trackSignup('completed', 'google')

      // Set flag for AuthCallback to send welcome email
      // (Centralized welcome email logic in AuthCallback.tsx)
      sessionStorage.setItem('profile_completed', 'true')

      console.log('📍 Redirecting to home')
      navigate(consumePostAuthRedirect())
    } catch (err: any) {
      console.error('❌ Profile completion error:', err)
      setError(err.message || 'Failed to complete profile. Please try again.')
      trackSignup('failed', 'google', 'profile_creation_failed')
    } finally {
      setLoading(false)
    }
  }

  // Redirect if no user
  if (!user) {
    navigate('/signin')
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-porcelain-blue-50 p-4">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="space-y-1 pb-6">
          <CardTitle className="text-3xl font-bold text-midnight-ink">{t('auth:completeProfile.title')}</CardTitle>
          <CardDescription className="text-base text-midnight-ink-600">
            {t('auth:completeProfile.subtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-800 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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
                {t('auth:completeProfile.penNameLabel')} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="pen_name"
                name="pen_name"
                type="text"
                placeholder={t('auth:completeProfile.penNamePlaceholder')}
                value={formData.pen_name}
                onChange={handleInputChange}
                disabled={loading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ip_owner_role" className="text-sm font-medium text-gray-900">
                {t('auth:completeProfile.roleLabel')} <span className="text-red-500">*</span>
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
                <option value="author">{t('auth:completeProfile.roleAuthor')}</option>
                <option value="agent">{t('auth:completeProfile.roleAgent')}</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ip_owner_company" className="text-sm font-medium text-gray-900">
                {t('auth:completeProfile.companyLabel')}
              </Label>
              <Input
                id="ip_owner_company"
                name="ip_owner_company"
                type="text"
                placeholder={t('auth:completeProfile.companyPlaceholder')}
                value={formData.ip_owner_company}
                onChange={handleInputChange}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website_url" className="text-sm font-medium text-gray-900">
                {t('auth:completeProfile.websiteLabel')}
              </Label>
              <Input
                id="website_url"
                name="website_url"
                type="url"
                placeholder={t('auth:completeProfile.websitePlaceholder')}
                value={formData.website_url}
                onChange={handleInputChange}
                disabled={loading}
              />
            </div>

            <div className="flex items-start gap-2">
              <input
                id="newsletter_consent"
                name="newsletter_consent"
                type="checkbox"
                checked={formData.newsletter_consent}
                onChange={(e) => setFormData({ ...formData, newsletter_consent: e.target.checked })}
                disabled={loading}
                className="mt-1 h-4 w-4 rounded border-gray-300"
              />
              <label htmlFor="newsletter_consent" className="text-sm text-gray-600">
                I agree to receive product updates and newsletters from KStoryBridge.{' '}
                <a
                  href="https://kstorybridge.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sunrise-coral hover:text-sunrise-coral/80 underline"
                >
                  Privacy Policy
                </a>
              </label>
            </div>

            <Button
              type="submit"
              className="w-full h-14 bg-hanok-teal hover:bg-hanok-teal/90 text-white text-base font-medium"
              disabled={loading}
            >
              {loading ? t('auth:completeProfile.submitting') : t('auth:completeProfile.submitButton')}
            </Button>
          </form>

          {/* Legal Links */}
          <div className="text-center text-xs text-gray-600 pt-4 border-t border-gray-200">
            By completing your profile, you agree to our{' '}
            <a
              href="https://kstorybridge.com/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sunrise-coral hover:text-sunrise-coral/80 underline"
            >
              Terms of Use
            </a>
            {' '}and{' '}
            <a
              href="https://kstorybridge.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sunrise-coral hover:text-sunrise-coral/80 underline"
            >
              Privacy Policy
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
