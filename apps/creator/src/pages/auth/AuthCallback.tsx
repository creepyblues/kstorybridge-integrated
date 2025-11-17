import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { checkCreatorProfileExists } from '@/lib/auth'
import { trackLogin } from '@/utils/analytics'

/**
 * Auth Callback Handler
 *
 * Handles TWO distinct flows:
 * 1. **OAuth (Google)**: Auto-login after OAuth redirect
 * 2. **Email Verification**: Just verify email, then redirect to signin
 */
export default function AuthCallback() {
  const navigate = useNavigate()
  const [status, setStatus] = useState<string>('Processing...')

  useEffect(() => {
    handleCallback()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleCallback = async () => {
    try {
      const urlParams = new URLSearchParams(window.location.search)
      const type = urlParams.get('type')
      const tokenHash = urlParams.get('token_hash')
      const oauthFlowIntent = sessionStorage.getItem('oauth_flow')

      // Determine flow type
      const isEmailVerification =
        type === 'signup' ||
        type === 'email' ||
        type === 'recovery' ||
        type === 'invite' ||
        tokenHash ||
        !oauthFlowIntent  // No OAuth intent = email verification

      console.log('🔐 Auth callback:', {
        type,
        hasTokenHash: !!tokenHash,
        hasOAuthIntent: !!oauthFlowIntent,
        isEmailVerification
      })

      // ============================================================================
      // EMAIL VERIFICATION: Just verify, don't auto-login
      // ============================================================================
      if (isEmailVerification) {
        console.log('📧 Email verification flow detected')

        if (tokenHash) {
          // Manual verification with token_hash
          const result = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: (type as any) || 'email',
          })

          if (result.error) {
            console.error('❌ Email verification error:', result.error.message)
            setStatus('Email verification failed. Please try again.')
            setTimeout(() => navigate('/signin'), 3000)
            return
          }

          console.log('✅ Email verified successfully')
        } else {
          // Let detectSessionInUrl handle automatic verification
          console.log('📧 Email verification (automatic)')
        }

        // Email verified - redirect to signin
        setStatus('Email verified! Redirecting to signin...')
        setTimeout(() => {
          navigate('/signin?verified=true')
        }, 1500)
        return
      }

      // ============================================================================
      // OAUTH FLOW: Auto-login and redirect to app
      // ============================================================================
      console.log('🔄 OAuth flow detected')
      setStatus('Completing OAuth signin...')

      // Wait briefly for detectSessionInUrl to complete
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Get session (should be created by detectSessionInUrl)
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()

      if (sessionError || !session) {
        console.error('❌ OAuth session error:', sessionError)
        setStatus('Authentication failed. Please try again.')
        setTimeout(() => navigate('/signin'), 3000)
        return
      }

      console.log('✅ OAuth session established')

      // Clean up session storage
      sessionStorage.removeItem('oauth_flow')

      // Check if profile exists
      const profileExists = await checkCreatorProfileExists()

      if (profileExists) {
        // Existing user - redirect to home
        console.log('✅ Existing user, redirecting to home')
        trackLogin('google')
        setStatus('Welcome back! Redirecting...')
        navigate('/home')
      } else {
        // New user - redirect to profile completion
        console.log('📝 New user, redirecting to profile completion')
        setStatus('Please complete your profile...')
        navigate('/auth/complete-profile')
      }

    } catch (error: any) {
      console.error('❌ Auth callback error:', error)
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
