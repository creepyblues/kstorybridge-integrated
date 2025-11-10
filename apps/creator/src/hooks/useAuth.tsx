import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

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

    // Skip initial getSession() during OAuth callback to avoid interfering with PKCE exchange
    const isOAuthCallback = window.location.pathname === '/auth/callback' && window.location.search.includes('code=')

    if (isOAuthCallback) {
      console.log('🔄 OAuth callback detected - skipping initial getSession() to allow PKCE exchange')
      // Auth state listener will catch the session after successful exchange
      setLoading(false)
    } else {
      // Get initial session for normal page loads
      supabase.auth.getSession().then(({ data: { session } }) => {
        console.log('🎯 Initial session:', session ? 'Found' : 'None')
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
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
    })

    // Cleanup on unmount
    return () => {
      console.log('🎯 AuthProvider: Cleaning up auth listener')
      subscription.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    console.log('🔐 Signing out...')
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
