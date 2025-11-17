import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { checkCreatorProfileExists } from '@/lib/auth'
import { sendWelcomeEmail } from '@/services/emailService'
import { trackLogin, trackSignup } from '@/utils/analytics'

/**
 * Send welcome email in background (fire-and-forget)
 * Does not block user redirect
 */
async function sendWelcomeEmailInBackground(userId: string) {
  try {
    const { data: profile } = await supabase
      .from('user_creators')
      .select('full_name, email')
      .eq('id', userId)
      .single()

    if (profile) {
      await sendWelcomeEmail({
        userName: profile.full_name,
        userEmail: profile.email,
        accountType: 'creator',
        dashboardUrl: `${window.location.origin}/home`,
        loginUrl: `${window.location.origin}/signin`,
      })
      console.log('✅ Welcome email sent in background')
    }
  } catch (error) {
    // Log but don't throw - this runs in background
    console.warn('⚠️ Welcome email failed (background):', error)
  }
}

export default function AuthCallback() {
  const navigate = useNavigate()
  const [status, setStatus] = useState<string>('Processing authentication...')

  useEffect(() => {
    handleCallback()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /**
   * Wait for session with exponential backoff
   * Replaces arbitrary timeouts with retry logic
   */
  const waitForSession = async (maxAttempts = 5, initialDelay = 200): Promise<any> => {
    for (let i = 0; i < maxAttempts; i++) {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        console.log(`✅ Session found after ${i + 1} attempt(s)`)
        return session
      }

      if (i < maxAttempts - 1) {
        const delay = initialDelay * Math.pow(2, i) // 200ms, 400ms, 800ms, 1600ms, 3200ms
        console.log(`⏳ No session yet, waiting ${delay}ms before retry ${i + 2}/${maxAttempts}`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
    return null
  }

  const handleCallback = async () => {
    try {
      const urlParams = new URLSearchParams(window.location.search)
      const code = urlParams.get('code')
      const hasCode = !!code
      const type = urlParams.get('type')
      const hasTokenHash = urlParams.has('token_hash')

      // Check if this is an OAuth flow by looking for oauth_flow in sessionStorage
      const oauthFlowIntent = sessionStorage.getItem('oauth_flow')

      // Distinguish between email verification and OAuth by code length
      // Email verification: token_hash is ~150+ characters
      // OAuth: authorization code is ~40-60 characters
      const codeLength = code?.length || 0
      const isLikelyTokenHash = codeLength > 100 // token_hash is much longer

      // Email verification indicators:
      // - Has code parameter BUT NO oauth_flow in sessionStorage (fresh browser session)
      // - Explicit type params (signup, email, recovery, invite)
      // - token_hash parameter present
      // - Code is very long (token_hash format)
      //
      // KEY INSIGHT: Email verification starts with NO browser context (user clicks link in email)
      // so absence of oauth_flow is a strong indicator
      const isEmailVerification =
        (hasCode && !oauthFlowIntent) ||  // Fresh session with code = email verification
        type === 'signup' ||
        type === 'email' ||
        type === 'recovery' ||
        type === 'invite' ||
        hasTokenHash ||
        isLikelyTokenHash

      // OAuth indicators (must have ALL of these):
      // - Code parameter present
      // - oauth_flow in sessionStorage (user initiated OAuth - we stored this during OAuth initiation)
      // - NOT detected as email verification by other indicators
      // - Code is short (OAuth format)
      const isOAuthFlow =
        hasCode &&
        oauthFlowIntent &&
        !isLikelyTokenHash &&
        !(type === 'signup' || type === 'email' || type === 'recovery' || type === 'invite' || hasTokenHash)

      const isDev = import.meta.env.DEV
      console.log('🔐 Auth callback: Processing...', {
        pathname: window.location.pathname,
        isEmailVerification,
        isOAuthFlow,
        type,
        codeLength: isDev ? codeLength : (codeLength > 0 ? 'present' : 'none'),
        hasTokenHash: isDev ? hasTokenHash : !!hasTokenHash,
        oauthFlowIntent: isDev ? oauthFlowIntent : !!oauthFlowIntent,
        timestamp: new Date().toISOString()
      })

      // Wait for automatic session exchange with exponential backoff
      let session = await waitForSession()

      if (session) {
        // Automatic session exchange succeeded (typically OAuth)
        const flowType = isEmailVerification ? 'email verification' : isOAuthFlow ? 'OAuth' : 'unknown'
        const isDev = import.meta.env.DEV
        console.log(`✅ ${flowType} session found (automatic exchange):`, {
          email: isDev ? session.user.email : session.user.email?.substring(0, 3) + '***',
          provider: session.user.app_metadata?.provider
        })
      } else if (isEmailVerification) {
        // Email verification: Two possible flows
        // 1. Direct token_hash: URL has token_hash parameter (legacy/direct links)
        // 2. Pre-processed code: Supabase /auth/v1/verify already processed token, redirects with code
        const tokenHash = urlParams.get('token_hash')
        const code = urlParams.get('code')
        const type = urlParams.get('type') || 'email'

        const isDev = import.meta.env.DEV

        if (tokenHash) {
          // Flow 1: Direct token_hash - manual verifyOtp required
          console.log('📧 Email verification (token_hash): Calling verifyOtp...', {
            type,
            tokenHashLength: isDev ? tokenHash.length : '[REDACTED]'
          })

          const result = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: type as any, // 'email' | 'signup' | 'recovery' | 'email_change'
          })

          if (result.error) {
            console.error('❌ Email verification error:', result.error.message)
            setStatus('Email verification failed. Please try signing in with your password.')
            setTimeout(() => navigate('/signin'), 3000)
            return
          }

          if (!result.data.session) {
            console.error('❌ Email verification: No session returned')
            setStatus('Email verification failed. Please try signing in.')
            setTimeout(() => navigate('/signin'), 3000)
            return
          }

          session = result.data.session
          console.log('✅ Email verification successful (manual verifyOtp)')
        } else if (code) {
          // Flow 2: Pre-processed code - Supabase already verified, use PKCE exchange
          console.log('📧 Email verification (code): Attempting PKCE exchange...', {
            codeLength: isDev ? code.length : '[REDACTED]'
          })

          const result = await supabase.auth.exchangeCodeForSession(code)

          if (result.error) {
            console.error('❌ Email verification PKCE exchange error:', result.error.message)
            setStatus('Email verification failed. Please try signing in with your password.')
            setTimeout(() => navigate('/signin'), 3000)
            return
          }

          session = result.data.session

          if (!session) {
            console.error('❌ No session returned from email verification PKCE exchange')
            setStatus('Email verification failed: No session')
            setTimeout(() => navigate('/signin'), 2000)
            return
          }

          console.log('✅ Email verification successful (PKCE exchange)')
        } else {
          // No token_hash or code - invalid verification link
          console.error('❌ Email verification: No token_hash or code parameter found')
          setStatus('Email verification failed: Invalid verification link')
          setTimeout(() => navigate('/signin'), 3000)
          return
        }
      } else if (isOAuthFlow) {
        // OAuth flow: No automatic session, try explicit PKCE exchange as fallback
        const code = urlParams.get('code')

        if (!code) {
          console.error('❌ OAuth flow: No code found in URL and no existing session')
          setStatus('Invalid authentication request')
          setTimeout(() => navigate('/signin'), 2000)
          return
        }

        const isDev = import.meta.env.DEV
        console.log('🔄 OAuth flow: Attempting explicit PKCE exchange...', {
          codeLength: isDev ? code.length : '[REDACTED]',
          storageKey: 'sb-dlrnrgcoguxlkkcitlpd-auth-token-creator'
        })

        const result = await supabase.auth.exchangeCodeForSession(code)

        if (result.error) {
          console.error('❌ OAuth PKCE exchange error:', result.error.message)
          setStatus('Authentication failed. Please try again.')
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

        console.log('✅ OAuth session established (explicit PKCE exchange)')
      } else {
        // Email verification or unknown flow: No session after retries
        console.error('❌ No session created after multiple retries')
        setStatus('Email verification failed. Please try signing in with your password.')
        setTimeout(() => navigate('/signin'), 3000)
        return
      }

      // Check if this is a signup or signin by checking for existing profile
      const profileExists = await checkCreatorProfileExists()

      // Get the original flow intent from sessionStorage
      const oauthFlow = sessionStorage.getItem('oauth_flow')
      sessionStorage.removeItem('oauth_flow')

      console.log('🔍 Profile exists:', profileExists, '| Original flow:', oauthFlow)

      if (profileExists) {
        // Existing user signing in - check if this is first signin after email verification
        const type = urlParams.get('type') // Supabase adds type=signup for email verification

        // Check if user just verified their email (type=signup indicates email verification redirect)
        if (type === 'signup' || type === 'email') {
          console.log('📧 Email verification detected, sending welcome email in background')

          // Send welcome email in background (fire-and-forget, don't await)
          sendWelcomeEmailInBackground(session.user.id)
        }

        // Existing user signing in
        console.log('✅ Existing user, redirecting to home')

        // Track successful login (OAuth)
        trackLogin('google')

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
