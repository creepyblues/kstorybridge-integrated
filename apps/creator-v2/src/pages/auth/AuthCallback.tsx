import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { checkCreatorProfileExists } from '@/lib/auth'

export default function AuthCallback() {
  const navigate = useNavigate()
  const [status, setStatus] = useState<string>('Processing authentication...')

  useEffect(() => {
    handleCallback()
  }, [])

  const handleCallback = async () => {
    try {
      console.log('🔐 OAuth callback: Processing...')

      // Exchange the OAuth code for a session
      // Supabase automatically handles this when detectSessionInUrl is true
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError) {
        console.error('❌ Session error:', sessionError)
        setStatus('Authentication failed')
        setTimeout(() => navigate('/signin'), 2000)
        return
      }

      if (!session) {
        console.error('❌ No session found')
        setStatus('No session found')
        setTimeout(() => navigate('/signin'), 2000)
        return
      }

      console.log('✅ Session found:', session.user.id)

      // Check if this is a signup or signin by checking for existing profile
      const profileExists = await checkCreatorProfileExists(session.user.id)

      // Get the original flow intent from sessionStorage
      const oauthFlow = sessionStorage.getItem('oauth_flow')
      sessionStorage.removeItem('oauth_flow')

      console.log('🔍 Profile exists:', profileExists, '| Original flow:', oauthFlow)

      if (profileExists) {
        // Existing user signing in
        console.log('✅ Existing user, redirecting to home')
        setStatus('Welcome back! Redirecting...')
        navigate('/home')
      } else {
        // New user signing up - needs to complete profile
        console.log('📝 New user, redirecting to profile completion')
        setStatus('Please complete your profile...')
        navigate('/auth/complete-profile')
      }
    } catch (error: any) {
      console.error('❌ OAuth callback error:', error)
      setStatus('Authentication failed: ' + error.message)
      setTimeout(() => navigate('/signin'), 3000)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-black mb-4"></div>
        <p className="text-lg text-black">{status}</p>
      </div>
    </div>
  )
}
