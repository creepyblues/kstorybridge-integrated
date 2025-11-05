import { useState, useEffect } from 'react'
import { MainLayout } from '@/components/layout/MainLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'

interface CreatorProfile {
  id: string
  email: string
  full_name: string
  pen_name?: string | null
  ip_owner_role?: string | null
  ip_owner_company?: string | null
  website_url?: string | null
  invitation_status?: string | null
  created_at: string
  updated_at: string
}

export default function Profile() {
  const { user, signOut } = useAuth()
  const { toast } = useToast()
  const [profile, setProfile] = useState<CreatorProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<Partial<CreatorProfile>>({})

  useEffect(() => {
    loadProfile()
  }, [user])

  const loadProfile = async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('user_creators')
        .select('*')
        .eq('id', user.id)
        .single()

      if (fetchError) throw fetchError

      setProfile(data)
      setFormData(data)
    } catch (err) {
      console.error('Error loading profile:', err)
      setError('Failed to load profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateProfile = async () => {
    if (!user?.id || !profile) return

    try {
      setUpdating(true)
      setError(null)

      const updateData = {
        pen_name: formData.pen_name,
        ip_owner_role: formData.ip_owner_role,
        ip_owner_company: formData.ip_owner_company,
        website_url: formData.website_url,
      }

      const { data, error: updateError } = await supabase
        .from('user_creators')
        .update(updateData)
        .eq('id', user.id)
        .select()
        .single()

      if (updateError) throw updateError

      setProfile(data)
      setFormData(data)
      setIsEditing(false)

      // Show success toast
      toast({
        title: 'Profile Updated',
        description: 'Your profile changes have been saved successfully',
      })
    } catch (err) {
      console.error('Error updating profile:', err)
      setError('Failed to update profile. Please try again.')

      // Show error toast
      toast({
        title: 'Update Failed',
        description: 'Failed to update profile. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setUpdating(false)
    }
  }

  const handleInputChange = (field: keyof CreatorProfile, value: string | null) => {
    setFormData(prev => ({
      ...prev,
      [field]: value || null,
    }))
  }

  const handleCancel = () => {
    setFormData(profile || {})
    setIsEditing(false)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const handleSignOut = async () => {
    await signOut()
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="max-w-4xl">
          <div className="flex items-center justify-center min-h-96">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (error && !profile) {
    return (
      <MainLayout>
        <div className="max-w-4xl">
          <Card className="bg-transparent border-red-300 shadow-none rounded-2xl">
            <CardContent className="p-8 text-center">
              <p className="text-red-600">{error}</p>
              <Button
                onClick={loadProfile}
                variant="outline"
                className="mt-4 border-gray-300 hover:bg-gray-100"
              >
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    )
  }

  if (!profile) {
    return (
      <MainLayout>
        <div className="max-w-4xl">
          <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl">
            <CardContent className="p-8 text-center">
              <p className="text-gray-600">Profile not found</p>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="max-w-4xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-black">Profile</h1>
            <p className="text-gray-600 mt-1">Manage your creator account information</p>
          </div>
        </div>

        {error && (
          <Card className="bg-transparent border-red-300 shadow-none rounded-2xl mb-6 sm:mb-8 lg:mb-12">
            <CardContent className="p-4">
              <p className="text-red-600 text-sm">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Profile Information Card */}
        <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl mb-6 sm:mb-8 lg:mb-12">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Creator Profile</CardTitle>
                <CardDescription>Your personal and professional information</CardDescription>
              </div>
              {!isEditing ? (
                <Button
                  onClick={() => setIsEditing(true)}
                  variant="outline"
                  className="border-gray-300 hover:bg-gray-100"
                >
                  Edit Profile
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    onClick={handleUpdateProfile}
                    disabled={updating}
                    variant="outline"
                    className="border-gray-300 hover:bg-gray-100"
                  >
                    {updating ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button
                    onClick={handleCancel}
                    variant="outline"
                    disabled={updating}
                    className="border-gray-300 hover:bg-gray-100"
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column - Basic Information */}
              <div className="space-y-6">
                {/* Full Name */}
                <div>
                  <Label className="text-sm font-semibold text-black mb-1">Full Name</Label>
                  <p className="text-gray-600 text-sm">{profile.full_name || 'Not specified'}</p>
                </div>

                {/* Email */}
                <div>
                  <Label className="text-sm font-semibold text-black mb-1">Email Address</Label>
                  <p className="text-gray-600 text-sm break-all">{profile.email}</p>
                </div>

                {/* Account Type */}
                <div>
                  <Label className="text-sm font-semibold text-black mb-1">Account Type</Label>
                  <p className="text-gray-600 text-sm">Content Creator</p>
                </div>

                {/* Pen Name */}
                <div>
                  <Label htmlFor="pen_name" className="text-sm font-semibold text-black mb-1">
                    Pen Name / Studio Name
                  </Label>
                  {isEditing ? (
                    <Input
                      id="pen_name"
                      value={formData.pen_name || ''}
                      onChange={(e) => handleInputChange('pen_name', e.target.value)}
                      placeholder="Enter your pen name or studio name"
                    />
                  ) : (
                    <p className="text-gray-600 text-sm">{profile.pen_name || 'Not specified'}</p>
                  )}
                </div>
              </div>

              {/* Right Column - Professional Information */}
              <div className="space-y-6">
                {/* Company */}
                <div>
                  <Label htmlFor="ip_owner_company" className="text-sm font-semibold text-black mb-1">
                    Company
                  </Label>
                  {isEditing ? (
                    <Input
                      id="ip_owner_company"
                      value={formData.ip_owner_company || ''}
                      onChange={(e) => handleInputChange('ip_owner_company', e.target.value)}
                      placeholder="Enter your company name"
                    />
                  ) : (
                    <p className="text-gray-600 text-sm">{profile.ip_owner_company || 'Not specified'}</p>
                  )}
                </div>

                {/* Role */}
                <div>
                  <Label className="text-sm font-semibold text-black mb-1">Role</Label>
                  {isEditing ? (
                    <Select
                      value={formData.ip_owner_role || ''}
                      onValueChange={(value) => handleInputChange('ip_owner_role', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select your role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="author">Author</SelectItem>
                        <SelectItem value="agent">Agent</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-gray-600 text-sm">
                      {profile.ip_owner_role
                        ? profile.ip_owner_role.charAt(0).toUpperCase() + profile.ip_owner_role.slice(1)
                        : 'Not specified'}
                    </p>
                  )}
                </div>

                {/* Website URL */}
                <div>
                  <Label htmlFor="website_url" className="text-sm font-semibold text-black mb-1">
                    Website URL
                  </Label>
                  {isEditing ? (
                    <Input
                      id="website_url"
                      value={formData.website_url || ''}
                      onChange={(e) => handleInputChange('website_url', e.target.value)}
                      placeholder="https://your-website.com"
                      type="url"
                    />
                  ) : (
                    <p className="text-gray-600 text-sm">
                      {profile.website_url ? (
                        <a
                          href={profile.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-black hover:text-gray-700 transition-colors break-all"
                        >
                          {profile.website_url}
                        </a>
                      ) : (
                        'Not specified'
                      )}
                    </p>
                  )}
                </div>

                {/* Member Since */}
                <div>
                  <Label className="text-sm font-semibold text-black mb-1">Member Since</Label>
                  <p className="text-gray-600 text-sm">
                    {profile.created_at ? formatDate(profile.created_at) : 'Not specified'}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Actions Section */}
        <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl">
          <CardHeader>
            <CardTitle>Account Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                type="button"
                onClick={handleSignOut}
                variant="outline"
                className="w-full sm:w-auto border-gray-300 hover:bg-gray-100 text-red-600"
              >
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
