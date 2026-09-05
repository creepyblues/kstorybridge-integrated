import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { lookupCreatorProfile, createCreatorProfileFromPending, EmailConflictError } from '@/lib/auth'
import { consumePostAuthRedirect } from '@/lib/postAuthRedirect'
import { trackSignin, trackSignup } from '@/utils/analytics'
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
    const oauthFlowIntent = sessionStorage.getItem('oauth_flow')

    try {
      const urlParams = new URLSearchParams(window.location.search)
      const type = urlParams.get('type')
      const tokenHash = urlParams.get('token_hash')
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
          // Verification links arrive with implicit-grant tokens in the URL hash. This client
          // is configured with flowType 'pkce', and supabase-js does NOT consume hash tokens in
          // that mode (observed on staging 2026-09-05: SIGNED_OUT / INITIAL_SESSION: none), so
          // establish the session ourselves from the hash.
          console.log('📧 Email verification (automatic)')
          const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''))
          const accessToken = hash.get('access_token')
          const refreshToken = hash.get('refresh_token')
          if (accessToken && refreshToken) {
            const { data, error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
            if (error) console.error('❌ setSession from verification hash failed:', error.message)
            else verifiedSession = data.session
            window.history.replaceState({}, '', window.location.pathname)
          }
          for (let attempt = 0; attempt < 6 && !verifiedSession; attempt++) {
            const { data: { session } } = await supabase.auth.getSession()
            verifiedSession = session
            if (!verifiedSession) await new Promise(r => setTimeout(r, 500))
          }
          if (!verifiedSession) console.warn('⚠️ No session after verification redirect; profile creation deferred to sign-in')
        }

        if (!verifiedSession?.user) {
          setStatus('Email verified! Redirecting to signin...')
          setTimeout(() => navigate('/signin?verified=true'), 1500)
          return
        }

        // Gate 2: the profile is created HERE, at the first authenticated moment, from
        // user_metadata.pending_creator_profile (the trigger that used to do this is gone).
        let lookup = await lookupCreatorProfile()
        if (lookup === 'missing') {
          const created = await createCreatorProfileFromPending()
          if (created.status === 'conflict') {
            trackSignup('failed', 'email', 'profile_creation_failed')
            setStatus(new EmailConflictError().message)
            await supabase.auth.signOut({ scope: 'local' })
            setTimeout(() => navigate('/signin'), 6000)
            return
          }
          if (created.status === 'created' || created.status === 'exists') {
            lookup = 'exists'
            if (created.status === 'created') {
              trackSignup('completed', 'email')
              const fullName = (created.profile?.full_name as string) || verifiedSession.user.user_metadata?.full_name || ''
              if (fullName && verifiedSession.user.email) {
                console.log('📧 New email signup user, sending welcome email')
                await sendWelcomeEmailOnce(fullName, verifiedSession.user.email)
              }
            }
          } else if (created.status === 'no_data') {
            // Nothing pending (e.g. a non-signup verification link): onboard via the form
            setStatus('Email verified! Please complete your profile...')
            navigate('/auth/complete-profile')
            return
          } else {
            console.error('❌ Deferred profile creation failed; user can retry by signing in', created)
            await supabase.auth.signOut({ scope: 'local' })
            setStatus('Email verified! Please sign in to finish setting up your account.')
            setTimeout(() => navigate('/signin?verified=true'), 2500)
            return
          }
        } else if (lookup === 'exists') {
          // Profile already present (e.g. re-clicked link): welcome only if brand new
          const { data: profile } = await supabase
            .from('user_creators')
            .select('full_name, created_at')
            .eq('id', verifiedSession.user.id)
            .single()
          if (profile && (Date.now() - new Date(profile.created_at).getTime()) / 60000 < 5) {
            await sendWelcomeEmailOnce(profile.full_name, verifiedSession.user.email!)
          }
        }

        if (lookup === 'exists') {
          // Verified and onboarded: land them in the app (same as the dashboard).
          setStatus('Email verified! Welcome to KStoryBridge...')
          navigate(consumePostAuthRedirect())
          return
        }

        // lookup === 'error': can't tell — fail closed, let SignIn retry
        await supabase.auth.signOut({ scope: 'local' })
        setStatus('Email verified! Please sign in to continue.')
        setTimeout(() => navigate('/signin?verified=true'), 1500)
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
        trackSignin('failed', 'google', 'oauth_session_failed')
        sessionStorage.removeItem('redirect_after_login')
        setStatus('Authentication failed. Please try again.')
        setTimeout(() => navigate('/signin'), 3000)
        return
      }

      console.log('✅ OAuth session established')

      // Clean up session storage
      sessionStorage.removeItem('oauth_flow')

      const profile = await lookupCreatorProfile()

      if (profile === 'error') {
        // Lookup failed (timeout / query error). The user may well have a profile;
        // never send them into profile creation on a guess.
        console.error('❌ Creator profile lookup failed')
        trackSignin('failed', 'google', 'profile_lookup_failed')
        setStatus("We couldn't verify your creator profile just now. Please try signing in again.")
        setTimeout(() => navigate('/signin'), 3000)
        return
      }

      if (profile === 'exists') {
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
        trackSignin('completed', 'google')

        // Slack notification for creator signin (fire-and-forget)
        if (session.user.email) {
          notifyCreatorSignin({
            email: session.user.email,
            authType: 'google',
            fullName: session.user.user_metadata?.full_name,
          }).catch(() => {})
        }
        setStatus('Welcome back! Redirecting...')
        navigate(consumePostAuthRedirect())
      } else {
        // No creator profile yet. If a pending signup namespace exists (email signup
        // verified elsewhere), create it now; otherwise onboard via the form regardless
        // of which button they used (new user, or buyer-only / Google-first account).
        const created = await createCreatorProfileFromPending()
        if (created.status === 'conflict') {
          trackSignin('failed', 'google', 'profile_creation_failed')
          setStatus(new EmailConflictError().message)
          await supabase.auth.signOut({ scope: 'local' })
          setTimeout(() => navigate('/signin'), 6000)
          return
        }
        if (created.status === 'created' || created.status === 'exists') {
          trackSignup('completed', 'google')
          setStatus('Welcome! Redirecting...')
          navigate(consumePostAuthRedirect())
          return
        }
        console.log('📝 No creator profile, redirecting to profile completion')
        if (oauthFlowIntent !== 'signup') trackSignup('attempted', 'google')
        setStatus('Please complete your profile...')
        navigate('/auth/complete-profile')
      }

    } catch (error: any) {
      console.error('❌ Auth callback error:', error)
      if (oauthFlowIntent === 'signup') {
        // OAuth signup completion is emitted only after the creator profile is stored.
        // This failure event keeps the signup funnel honest without sending error text.
        trackSignup('failed', 'google', 'oauth_callback_failed')
      } else {
        trackSignin('failed', 'google', 'oauth_callback_failed')
      }
      sessionStorage.removeItem('redirect_after_login')
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
