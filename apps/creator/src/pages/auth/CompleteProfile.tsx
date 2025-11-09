import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { completeOAuthProfile } from '@/lib/auth'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

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
      })

      console.log('✅ Profile completion successful, redirecting to home')
      navigate('/home')
    } catch (err: any) {
      console.error('❌ Profile completion error:', err)
      setError(err.message || 'Failed to complete profile. Please try again.')
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t('auth:completeProfile.title')}</CardTitle>
          <CardDescription>
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
              <Label htmlFor="full_name">{t('auth:signUp.fullNameLabel')} *</Label>
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
              <Label htmlFor="pen_name">{t('auth:completeProfile.penNameLabel')} *</Label>
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
              <Label htmlFor="ip_owner_role">{t('auth:completeProfile.roleLabel')} *</Label>
              <select
                id="ip_owner_role"
                name="ip_owner_role"
                value={formData.ip_owner_role}
                onChange={handleInputChange}
                disabled={loading}
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
                required
              >
                <option value="author">{t('auth:completeProfile.roleAuthor')}</option>
                <option value="agent">{t('auth:completeProfile.roleAgent')}</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ip_owner_company">{t('auth:completeProfile.companyLabel')}</Label>
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
              <Label htmlFor="website_url">{t('auth:completeProfile.websiteLabel')}</Label>
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

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t('auth:completeProfile.submitting') : t('auth:completeProfile.submitButton')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
