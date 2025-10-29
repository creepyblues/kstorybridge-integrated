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

      // Check if session already exists from automatic code exchange (detectSessionInUrl: true)
      let { data: { session } } = await supabase.auth.getSession()

      if (session) {
        console.log('✅ OAuth session found (automatic exchange):', session.user.email)
      } else {
        // If no session from automatic exchange, try explicit exchange as fallback
        const urlParams = new URLSearchParams(window.location.search)
        const code = urlParams.get('code')

        if (!code) {
          console.error('❌ No OAuth code found in URL and no existing session')
          setStatus('Invalid authentication request')
          setTimeout(() => navigate('/signin'), 2000)
          return
        }

        console.log('🔄 No automatic session, attempting explicit code exchange...')

        const result = await supabase.auth.exchangeCodeForSession(code)

        if (result.error) {
          console.error('❌ Code exchange error:', result.error)
          setStatus('Authentication failed: ' + result.error.message)
          setTimeout(() => navigate('/signin'), 3000)
          return
        }

        session = result.data.session

        if (!session) {
          console.error('❌ No session returned from code exchange')
          setStatus('Authentication failed: No session')
          setTimeout(() => navigate('/signin'), 2000)
          return
        }

        console.log('✅ OAuth session established (explicit exchange):', session.user.email)
      }

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
