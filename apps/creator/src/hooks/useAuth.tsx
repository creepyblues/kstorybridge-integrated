import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { setAnalyticsUser, clearAnalyticsUser } from '@/utils/analytics'

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
        console.log('🎯 Initial session:', session ? 'Found' : 'None')
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)

        // Set GA4 user ID for cross-session tracking
        if (session?.user) {
          setAnalyticsUser(session.user.id, { type: 'creator' })
        }
      })
    }

    // ✅ SINGLE AUTH LISTENER - This is the ONLY listener in the entire app
    // No competing listeners = No race conditions
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('🎯 Auth state change:', _event, session ? 'Session exists' : 'No session')
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)

      // Update GA4 user tracking on auth state change
      if (session?.user) {
        setAnalyticsUser(session.user.id, { type: 'creator' })
      } else {
        clearAnalyticsUser()
      }
    })

    // Cleanup on unmount
    return () => {
      console.log('🎯 AuthProvider: Cleaning up auth listener')
      subscription.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    console.log('🔐 Signing out...')
    clearAnalyticsUser() // Clear GA4 user before sign out
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
