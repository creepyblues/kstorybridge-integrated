import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { checkCreatorProfileExists } from '@/lib/auth'
import { trackLogin } from '@/utils/analytics'
import { sendWelcomeEmail } from '@/services/emailService'
import { notifyCreatorSignup, notifyCreatorSignin } from '@/utils/slack'

/**
 * Auth Callback Handler
 *
 * Handles TWO distinct flows:
 * 1. **OAuth (Google)**: Auto-login after OAuth redirect
 * 2. **Email Verification**: Just verify email, then redirect to signin
 *
 * CENTRALIZED WELCOME EMAIL:
 * - OAuth new users: After returning from CompleteProfile
 * - Email new users: After email verification (if profile just created)
 */

/**
 * Send welcome email with deduplication check
 * Uses sessionStorage to prevent duplicate emails within same session
 */
const sendWelcomeEmailOnce = async (userName: string, userEmail: string) => {
  const welcomeEmailKey = `welcome_email_sent_${userEmail}`

  // Check if already sent in this session
  if (sessionStorage.getItem(welcomeEmailKey)) {
    console.log('⚠️ Welcome email already sent in this session, skipping')
    return
  }

  try {
    await sendWelcomeEmail({
      userName,
      userEmail,
      accountType: 'creator',
      dashboardUrl: `${window.location.origin}/home`,
      loginUrl: `${window.location.origin}/signin`,
    })
    console.log('✅ Welcome email sent successfully')

    // Mark as sent in this session
    sessionStorage.setItem(welcomeEmailKey, 'true')
  } catch (emailError) {
    // Log but don't block flow if email fails
    console.warn('⚠️ Welcome email failed (non-blocking):', emailError)
  }
}

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

        let verifiedSession = null

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
          verifiedSession = result.data.session
        } else {
          // Let detectSessionInUrl handle automatic verification
          console.log('📧 Email verification (automatic)')
          const { data: { session } } = await supabase.auth.getSession()
          verifiedSession = session
        }

        // Send welcome email for new email signup users
        if (verifiedSession?.user) {
          const { data: profile } = await supabase
            .from('user_creators')
            .select('full_name, created_at')
            .eq('email', verifiedSession.user.email)
            .single()

          // Check if profile was just created (within last 5 minutes = new signup)
          if (profile) {
            const createdAt = new Date(profile.created_at)
            const now = new Date()
            const minutesSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60)

            if (minutesSinceCreation < 5) {
              console.log('📧 New email signup user, sending welcome email')
              await sendWelcomeEmailOnce(profile.full_name, verifiedSession.user.email!)
            }
          }
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
        // Check if this is a new user returning from profile completion
        const justCompletedProfile = sessionStorage.getItem('profile_completed')

        if (justCompletedProfile) {
          // New user just completed profile - send welcome email
          console.log('📧 New user completed profile, sending welcome email')
          sessionStorage.removeItem('profile_completed')

          const { data: profile } = await supabase
            .from('user_creators')
            .select('full_name, pen_name, ip_owner_role, ip_owner_company')
            .eq('email', session.user.email)
            .single()

          if (profile?.full_name && session.user.email) {
            await sendWelcomeEmailOnce(profile.full_name, session.user.email)

            // Slack notification for new OAuth creator signup (fire-and-forget)
            notifyCreatorSignup({
              fullName: profile.full_name,
              email: session.user.email,
              penName: profile.pen_name || '',
              ipOwnerRole: profile.ip_owner_role || '',
              company: profile.ip_owner_company,
              authType: 'google',
            }).catch(() => {})
          }
        }

        // Existing user - redirect to home
        console.log('✅ Existing user, redirecting to home')
        trackLogin('google')

        // Slack notification for creator signin (fire-and-forget)
        if (session.user.email) {
          notifyCreatorSignin({
            email: session.user.email,
            authType: 'google',
            fullName: session.user.user_metadata?.full_name,
          }).catch(() => {})
        }
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
