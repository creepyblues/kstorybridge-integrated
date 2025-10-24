import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { signUpWithEmail, signInWithOAuth } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function SignUp() {
  const navigate = useNavigate()
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

      console.log('✅ Signup successful, redirecting to home')
      navigate('/home')
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create Creator Account</CardTitle>
          <CardDescription>Sign up to manage your content on KStoryBridge</CardDescription>
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
              variant="outline"
              className="w-full"
              onClick={handleOAuthSignUp}
              disabled={loading}
            >
              {loading ? (
                'Redirecting to Google...'
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
                  </svg>
                  Continue with Google
                </>
              )}
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-transparent px-2 text-gray-500">Or sign up with email</span>
            </div>
          </div>

          {/* Email Signup Form */}
          <form onSubmit={handleEmailSignUp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="creator@example.com"
                value={formData.email}
                onChange={handleInputChange}
                disabled={loading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="At least 6 characters"
                value={formData.password}
                onChange={handleInputChange}
                disabled={loading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password *</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Re-enter password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                disabled={loading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name *</Label>
              <Input
                id="full_name"
                name="full_name"
                type="text"
                placeholder="Your legal name"
                value={formData.full_name}
                onChange={handleInputChange}
                disabled={loading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pen_name">Pen Name / Studio Name *</Label>
              <Input
                id="pen_name"
                name="pen_name"
                type="text"
                placeholder="Your creator name"
                value={formData.pen_name}
                onChange={handleInputChange}
                disabled={loading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ip_owner_role">Role *</Label>
              <select
                id="ip_owner_role"
                name="ip_owner_role"
                value={formData.ip_owner_role}
                onChange={handleInputChange}
                disabled={loading}
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
                required
              >
                <option value="author">Author</option>
                <option value="agent">Agent</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ip_owner_company">Company (Optional)</Label>
              <Input
                id="ip_owner_company"
                name="ip_owner_company"
                type="text"
                placeholder="Your company or agency"
                value={formData.ip_owner_company}
                onChange={handleInputChange}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website_url">Website (Optional)</Label>
              <Input
                id="website_url"
                name="website_url"
                type="url"
                placeholder="https://yourwebsite.com"
                value={formData.website_url}
                onChange={handleInputChange}
                disabled={loading}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>

          <div className="text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/signin" className="text-black hover:underline font-medium">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
