import { supabase } from './supabase'
import { createCreatorViaEdgeFunction } from '../services/emailSignupEdgeFunction'
import { sendWelcomeEmail } from '../services/emailService'

// Types
export interface CreatorProfile {
  full_name: string
  pen_name: string
  ip_owner_role: 'author' | 'agent'
  ip_owner_company?: string
  website_url?: string
}

export interface SignUpData extends CreatorProfile {
  email: string
  password: string
}

// ============================================================================
// EMAIL AUTHENTICATION
// ============================================================================

/**
 * Sign up with email and password
 * Sets account_type='creator' DURING signup (not after)
 */
export async function signUpWithEmail(data: SignUpData) {
  // Validate inputs
  if (!data.email || !data.password || !data.full_name || !data.pen_name) {
    throw new Error('Missing required fields')
  }
  if (data.password.length < 6) {
    throw new Error('Password must be at least 6 characters')
  }
  if (!data.email.includes('@')) {
    throw new Error('Invalid email format')
  }
  if (!['author', 'agent'].includes(data.ip_owner_role)) {
    throw new Error('Invalid role')
  }

  // Normalize email
  const normalizedEmail = data.email.toLowerCase().trim()

  console.log('🔐 Starting email signup for:', normalizedEmail)

  // Step 1: Sign up with Supabase Auth
  // ✅ KEY IMPROVEMENT: Set account_type DURING signup
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: normalizedEmail,
    password: data.password,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`, // ✅ Redirect to creator app
      data: {
        account_type: 'creator', // ✅ Set during signup, not after
        full_name: data.full_name,
      },
    },
  })

  if (authError) {
    console.error('❌ Auth signup error:', authError)
    throw authError
  }

  if (!authData.user) {
    throw new Error('No user returned from signup')
  }

  console.log('✅ Auth signup successful, user ID:', authData.user.id)

  // Step 2: Create creator profile via edge function
  // Edge function uses service role key to bypass RLS timing issues
  try {
    const result = await createCreatorViaEdgeFunction({
      id: authData.user.id,
      email: normalizedEmail,
      full_name: data.full_name,
      pen_name: data.pen_name,
      ip_owner_role: data.ip_owner_role,
      ip_owner_company: data.ip_owner_company || null,
      website_url: data.website_url || null,
    })

    if (!result.success) {
      throw new Error(result.error || 'Profile creation failed')
    }

    console.log('✅ Creator profile created successfully via edge function')
  } catch (profileError) {
    console.error('❌ Profile creation failed:', profileError)
    console.warn('⚠️ Orphaned auth user may exist. User should retry signup with same email.')
    // Note: Cannot delete auth user from client (requires service role key)
    // Supabase will return "User already exists" on retry, which is handled gracefully
    throw profileError
  }

  // Step 3: Send welcome email (non-blocking)
  // Email failures won't prevent signup completion
  try {
    await sendWelcomeEmail({
      userName: data.full_name,
      userEmail: normalizedEmail,
      accountType: 'creator',
      dashboardUrl: `${window.location.origin}/home`,
      loginUrl: `${window.location.origin}/signin`,
    })
  } catch (emailError) {
    // Log but don't fail signup if email fails
    console.warn('⚠️ Welcome email failed (non-blocking):', emailError)
  }

  return { user: authData.user, session: authData.session }
}

/**
 * Sign in with email and password
 */
export async function signInWithEmail(email: string, password: string) {
  console.log('🔐 Starting email signin for:', email)

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    console.error('❌ Signin error:', error)
    throw error
  }

  console.log('✅ Signin successful')
  return { user: data.user, session: data.session }
}

// ============================================================================
// OAUTH AUTHENTICATION
// ============================================================================

/**
 * Initiate OAuth signin/signup with Google
 * Stores flow type in sessionStorage to handle callback correctly
 */
export async function signInWithOAuth(flow: 'signup' | 'signin') {
  console.log('🔐 Starting OAuth flow:', flow)

  // Store flow type for callback handler
  sessionStorage.setItem('oauth_flow', flow)

  // Explicit domain handling for multi-environment OAuth redirects
  // Bypasses Supabase Site URL configuration which may default to dashboard
  const isStaging = window.location.hostname === 'creator-v2.kstorybridge.com'
  const isProduction = window.location.hostname === 'creator.kstorybridge.com'

  const redirectUrl = isStaging
    ? 'https://creator-v2.kstorybridge.com/auth/callback'
    : isProduction
    ? 'https://creator.kstorybridge.com/auth/callback'
    : `${window.location.origin}/auth/callback`  // Localhost

  console.log('🔗 OAuth redirect URL:', redirectUrl)

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUrl,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  })

  if (error) {
    console.error('❌ OAuth initiation error:', error)
    throw error
  }

  return data
}

/**
 * Complete OAuth profile after Google redirect
 * Only called for NEW users during signup flow
 */
export async function completeOAuthProfile(profileData: CreatorProfile) {
  console.log('🔐 Completing OAuth profile')

  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    console.error('❌ No authenticated user found:', userError)
    throw new Error('No authenticated user')
  }

  console.log('👤 User found:', user.id)

  // Step 1: Create creator profile via edge function
  // Edge function uses service role key to bypass any RLS issues
  try {
    const result = await createCreatorViaEdgeFunction({
      id: user.id,
      email: user.email!,
      full_name: profileData.full_name,
      pen_name: profileData.pen_name,
      ip_owner_role: profileData.ip_owner_role,
      ip_owner_company: profileData.ip_owner_company || null,
      website_url: profileData.website_url || null,
    })

    if (!result.success) {
      throw new Error(result.error || 'Profile creation failed')
    }

    console.log('✅ Creator profile created via edge function')
  } catch (profileError) {
    console.error('❌ Profile creation failed:', profileError)
    throw profileError
  }

  // Step 2: Set account_type in user metadata
  // This is a SINGLE updateUser call, no race conditions
  try {
    const { error: metadataError } = await supabase.auth.updateUser({
      data: { account_type: 'creator' },
    })

    if (metadataError) {
      console.error('❌ Metadata update failed:', metadataError)
      throw metadataError
    }

    console.log('✅ Metadata updated successfully')
  } catch (error) {
    console.error('❌ OAuth profile completion failed:', error)
    throw error
  }

  // Step 3: Send welcome email (non-blocking)
  // Email failures won't prevent OAuth signup completion
  try {
    await sendWelcomeEmail({
      userName: profileData.full_name,
      userEmail: user.email!,
      accountType: 'creator',
      dashboardUrl: `${window.location.origin}/home`,
      loginUrl: `${window.location.origin}/signin`,
    })
  } catch (emailError) {
    // Log but don't fail OAuth completion if email fails
    console.warn('⚠️ Welcome email failed (non-blocking):', emailError)
  }

  return user
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if creator profile exists
 */
export async function checkCreatorProfileExists(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('user_creators')
    .select('id')
    .eq('id', userId)
    .single()

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = not found
    console.error('Error checking profile:', error)
  }

  return !!data
}

/**
 * Sign out
 */
export async function signOut() {
  console.log('🔐 Signing out')
  const { error } = await supabase.auth.signOut()
  if (error) {
    console.error('❌ Signout error:', error)
    throw error
  }
  console.log('✅ Signed out successfully')
}
