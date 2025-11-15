import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { checkCreatorProfileExists } from '@/lib/auth'
import { sendWelcomeEmail } from '@/services/emailService'

export default function AuthCallback() {
  const navigate = useNavigate()
  const [status, setStatus] = useState<string>('Processing authentication...')

  useEffect(() => {
    handleCallback()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleCallback = async () => {
    try {
      const urlParams = new URLSearchParams(window.location.search)
      const hasCode = urlParams.has('code')
      const type = urlParams.get('type')
      const hasTokenHash = urlParams.has('token_hash')

      // Check if this is an OAuth flow by looking for oauth_flow in sessionStorage
      const oauthFlowIntent = sessionStorage.getItem('oauth_flow')

      // Email verification: has type=signup or type=email (or sometimes just a code with no type)
      // OAuth: has code + oauth_flow in sessionStorage
      const isEmailVerification = type === 'signup' || type === 'email' || hasTokenHash
      const isOAuthFlow = hasCode && oauthFlowIntent && !isEmailVerification

      console.log('🔐 Auth callback: Processing...', {
        pathname: window.location.pathname,
        isEmailVerification,
        isOAuthFlow,
        type,
        hasTokenHash,
        oauthFlowIntent,
        timestamp: new Date().toISOString()
      })

      // Small delay to ensure automatic exchange completes
      // For OAuth: allows PKCE exchange | For email: allows token processing
      await new Promise(resolve => setTimeout(resolve, 500))

      // Check if session already exists from automatic exchange (detectSessionInUrl: true)
      let { data: { session } } = await supabase.auth.getSession()

      if (session) {
        const flowType = isEmailVerification ? 'email verification' : isOAuthFlow ? 'OAuth' : 'unknown'
        console.log(`✅ ${flowType} session found (automatic exchange):`, {
          email: session.user.email,
          provider: session.user.app_metadata?.provider
        })
      } else if (isOAuthFlow) {
        // OAuth flow: No automatic session, try explicit PKCE exchange as fallback
        const code = urlParams.get('code')

        if (!code) {
          console.error('❌ OAuth flow: No code found in URL and no existing session')
          setStatus('Invalid authentication request')
          setTimeout(() => navigate('/signin'), 2000)
          return
        }

        console.log('🔄 OAuth flow: No automatic session, attempting explicit PKCE exchange...', {
          codeLength: code.length,
          storageKey: 'sb-dlrnrgcoguxlkkcitlpd-auth-token-creator'
        })

        const result = await supabase.auth.exchangeCodeForSession(code)

        if (result.error) {
          console.error('❌ OAuth PKCE exchange error:', result.error)
          setStatus('Authentication failed: ' + result.error.message)
          setTimeout(() => navigate('/signin'), 3000)
          return
        }

        session = result.data.session

        if (!session) {
          console.error('❌ No session returned from OAuth PKCE exchange')
          setStatus('Authentication failed: No session')
          setTimeout(() => navigate('/signin'), 2000)
          return
        }

        console.log('✅ OAuth session established (explicit PKCE exchange):', session.user.email)
      } else if (isEmailVerification || (hasCode && !session)) {
        // Email verification flow: Wait a bit longer for automatic session
        console.log('📧 Email verification flow: Waiting for automatic session...')
        await new Promise(resolve => setTimeout(resolve, 1000))

        const { data: { session: retrySession } } = await supabase.auth.getSession()
        if (retrySession) {
          session = retrySession
          console.log('✅ Email verification session found after retry:', session.user.email)
        } else {
          console.error('❌ Email verification: No automatic session created')
          setStatus('Email verification failed. Please try signing in.')
          setTimeout(() => navigate('/signin'), 3000)
          return
        }
      } else {
        // Unknown flow type
        console.error('❌ Unknown callback type')
        setStatus('Invalid authentication request')
        setTimeout(() => navigate('/signin'), 2000)
        return
      }

      // Check if this is a signup or signin by checking for existing profile
      const profileExists = await checkCreatorProfileExists(session.user.id)

      // Get the original flow intent from sessionStorage
      const oauthFlow = sessionStorage.getItem('oauth_flow')
      sessionStorage.removeItem('oauth_flow')

      console.log('🔍 Profile exists:', profileExists, '| Original flow:', oauthFlow)

      if (profileExists) {
        // Existing user signing in - check if this is first signin after email verification
        const urlParams = new URLSearchParams(window.location.search)
        const type = urlParams.get('type') // Supabase adds type=signup for email verification

        // Check if user just verified their email (type=signup indicates email verification redirect)
        if (type === 'signup' || type === 'email') {
          console.log('📧 Email verification detected, sending welcome email')

          // Send welcome email (non-blocking)
          try {
            const { data: profile } = await supabase
              .from('user_creators')
              .select('full_name, email')
              .eq('id', session.user.id)
              .single()

            if (profile) {
              await sendWelcomeEmail({
                userName: profile.full_name,
                userEmail: profile.email,
                accountType: 'creator',
                dashboardUrl: `${window.location.origin}/home`,
                loginUrl: `${window.location.origin}/signin`,
              })
              console.log('✅ Welcome email sent after email verification')
            }
          } catch (emailError) {
            // Log but don't block signin if email fails
            console.warn('⚠️ Welcome email failed (non-blocking):', emailError)
          }
        }

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
