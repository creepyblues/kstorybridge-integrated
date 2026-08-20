import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import {
  setAnalyticsUser,
  clearAnalyticsUser,
  isInternalTrafficMetadata,
} from '@/utils/analytics'
import {
  clearSessionActivity,
  initializeSessionActivity,
  markSessionExpired,
  SESSION_EXPIRED_EVENT,
} from '@/lib/sessionInactivity'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    console.log('🎯 AuthProvider: Initializing')
    let mounted = true
    let inactivitySignOutStarted = false

    const handleForcedExpiry = () => {
      if (!mounted) return
      clearAnalyticsUser()
      setSession(null)
      setUser(null)
      setLoading(false)
    }

    window.addEventListener(SESSION_EXPIRED_EVENT, handleForcedExpiry)

    const expireInactiveSession = () => {
      if (inactivitySignOutStarted) return
      inactivitySignOutStarted = true
      markSessionExpired()
      void supabase.auth.signOut({ scope: 'local' }).then(({ error }) => {
        if (error) console.error('[AuthProvider] Inactivity sign-out failed:', error)
      }).catch((error) => {
        console.error('[AuthProvider] Inactivity sign-out failed:', error)
      })
    }

    // Distinguish between OAuth (Google) and email verification callbacks
    // OAuth: has 'code=' + oauth_flow in sessionStorage → needs PKCE exchange
    // Email verification: has 'type=signup' or 'type=email' or 'token_hash=' → automatic session creation
    const urlParams = new URLSearchParams(window.location.search)
    const hasCode = urlParams.has('code')
    const type = urlParams.get('type')
    const hasTokenHash = urlParams.has('token_hash')
    const oauthFlowIntent = sessionStorage.getItem('oauth_flow')

    const isEmailVerification = window.location.pathname === '/auth/callback' && (type === 'signup' || type === 'email' || hasTokenHash)
    const isOAuthCallback = window.location.pathname === '/auth/callback' && hasCode && oauthFlowIntent && !isEmailVerification

    if (isOAuthCallback) {
      console.log('🔄 OAuth callback detected - skipping initial getSession() to allow PKCE exchange')
      // Auth state listener will catch the session after successful exchange
      setLoading(false)
    } else if (isEmailVerification) {
      console.log('📧 Email verification callback detected - allowing automatic session creation')
      // Let detectSessionInUrl handle the token_hash automatically
      // Auth state listener will catch the session after automatic exchange
      setLoading(false)
    } else {
      // Get initial session for normal page loads
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session && initializeSessionActivity() === 'expired') {
          expireInactiveSession()
          return
        }
        if (!mounted) return
        console.log('🎯 Initial session:', session ? 'Found' : 'None')
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)

        // Set GA4 user ID for cross-session tracking
        if (session?.user) {
          setAnalyticsUser(session.user.id, {
            type: 'creator',
            internal: isInternalTrafficMetadata(session.user.app_metadata),
          })
        } else {
          clearAnalyticsUser()
        }
      })
    }

    // ✅ SINGLE AUTH LISTENER - This is the ONLY listener in the entire app
    // No competing listeners = No race conditions
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('🎯 Auth state change:', _event, session ? 'Session exists' : 'No session')
      if (session && initializeSessionActivity() === 'expired') {
        expireInactiveSession()
        return
      }
      if (!mounted) return
      if (session) inactivitySignOutStarted = false
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)

      // Update GA4 user tracking on auth state change
      if (session?.user) {
        setAnalyticsUser(session.user.id, {
          type: 'creator',
          internal: isInternalTrafficMetadata(session.user.app_metadata),
        })
      } else {
        clearAnalyticsUser()
      }
    })

    // Cleanup on unmount
    return () => {
      console.log('🎯 AuthProvider: Cleaning up auth listener')
      mounted = false
      window.removeEventListener(SESSION_EXPIRED_EVENT, handleForcedExpiry)
      subscription.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    console.log('🔐 Signing out...')
    clearAnalyticsUser() // Clear GA4 user before sign out
    clearSessionActivity()
    await supabase.auth.signOut()
    setUser(null)
    setSession(null)
    // Redirect to sign in page
    window.location.href = '/signin'
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

/* eslint-disable react-refresh/only-export-components */
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
