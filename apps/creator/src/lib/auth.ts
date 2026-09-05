import { supabase } from './supabase'
import { recordSessionActivity } from './sessionInactivity'
import { createCreatorViaEdgeFunction } from '../services/emailSignupEdgeFunction'
import { sendWelcomeEmail } from '../services/emailService'
import { notifyCreatorSignup } from '../utils/slack'

// Types
export interface CreatorProfile {
  full_name: string
  pen_name: string
  ip_owner_role: 'author' | 'agent'
  ip_owner_company?: string
  website_url?: string
  newsletter_consent?: boolean
}

export interface SignUpData extends CreatorProfile {
  email: string
  password: string
  newsletter_consent?: boolean
}

// ============================================================================
// INPUT SANITIZATION HELPERS
// ============================================================================

/**
 * Sanitize text input to prevent XSS
 * Removes HTML tags and limits length
 */
function sanitizeText(text: string, maxLength: number = 100): string {
  return text
    .trim()
    .replace(/[<>]/g, '') // Remove potential XSS chars
    .substring(0, maxLength)
}

/**
 * Validate email format with regex
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
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
  if (!isValidEmail(data.email)) {
    throw new Error('Invalid email format')
  }
  if (!['author', 'agent'].includes(data.ip_owner_role)) {
    throw new Error('Invalid role')
  }

  // Normalize and sanitize inputs
  const normalizedEmail = data.email.toLowerCase().trim()
  const sanitizedData = {
    full_name: sanitizeText(data.full_name, 100),
    pen_name: sanitizeText(data.pen_name, 100),
    ip_owner_role: data.ip_owner_role,
    ip_owner_company: data.ip_owner_company ? sanitizeText(data.ip_owner_company, 200) : undefined,
    website_url: data.website_url ? sanitizeText(data.website_url, 500) : undefined,
  }

  const isDev = import.meta.env.DEV
  console.log('🔐 Starting email signup for:', isDev ? normalizedEmail : normalizedEmail.substring(0, 3) + '***')

  // Step 1: Sign up with Supabase Auth
  // ✅ KEY IMPROVEMENT: Set account_type DURING signup
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: normalizedEmail,
    password: data.password,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`, // ✅ Redirect to creator app
      data: {
        account_type: 'creator', // ✅ Set during signup, not after
        full_name: sanitizedData.full_name,
        newsletter_consent: data.newsletter_consent ?? false,
      },
    },
  })

  if (authError) {
    if (isDuplicateSignupError(authError)) {
      // Never tell the browser the email exists; SignUp shows the same generic copy.
      console.log('ℹ️ Email signup: duplicate email (explicit error)')
      return { status: 'duplicate' as const, user: null, session: null }
    }
    console.error('❌ Auth signup error:', authError)
    throw authError
  }

  if (!authData.user) {
    throw new Error('No user returned from signup')
  }

  if (isObfuscatedDuplicateSignup(authData.user)) {
    // Hosted Supabase (enumeration protection on) returns a fake user with a random
    // id and identities: [] for an existing email. Do NOT create a profile for it.
    console.log('ℹ️ Email signup: duplicate email (obfuscated response)')
    return { status: 'duplicate' as const, user: null, session: null }
  }

  console.log('✅ Auth signup successful, user ID:', isDev ? authData.user.id : authData.user.id.substring(0, 8) + '...')

  // Step 2: Create creator profile via edge function
  // Edge function uses service role key to bypass RLS timing issues
  try {
    const result = await createCreatorViaEdgeFunction({
      id: authData.user.id,
      email: normalizedEmail,
      full_name: sanitizedData.full_name,
      pen_name: sanitizedData.pen_name,
      ip_owner_role: sanitizedData.ip_owner_role,
      ip_owner_company: sanitizedData.ip_owner_company || null,
      website_url: sanitizedData.website_url || null,
      newsletter_consent: data.newsletter_consent ?? false,
    })

    if (!result.success) {
      throw new Error(result.error || 'Profile creation failed')
    }

    console.log('✅ Creator profile created successfully via edge function')

    // Send Slack notification (fire-and-forget)
    notifyCreatorSignup({
      fullName: sanitizedData.full_name,
      email: normalizedEmail,
      penName: sanitizedData.pen_name,
      ipOwnerRole: sanitizedData.ip_owner_role,
      company: sanitizedData.ip_owner_company,
      authType: 'email',
    }).catch(() => {}) // Silently ignore errors
  } catch (profileError) {
    console.error('❌ Profile creation failed:', profileError)
    console.warn('⚠️ Orphaned auth user may exist. User should retry signup with same email.')
    // Note: Cannot delete auth user from client (requires service role key)
    // Supabase will return "User already exists" on retry, which is handled gracefully
    throw profileError
  }

  // Note: Welcome email will be sent after email verification (in AuthCallback)
  // See AuthCallback.tsx for centralized welcome email logic
  return { status: 'created' as const, user: authData.user, session: authData.session }
}

/**
 * Supabase auth error for an email that already has an account.
 * Only seen when enumeration protection is OFF; hosted currently has it ON.
 */
export function isDuplicateSignupError(error: { code?: string; message?: string } | null | undefined): boolean {
  if (!error) return false
  return error.code === 'user_already_exists' || /already (registered|exists)/i.test(error.message || '')
}

/**
 * With enumeration protection ON, signUp() for an existing confirmed email returns
 * a fake user: random id, `identities: []`, no session, no error. A real
 * confirmation-required signup returns `identities.length === 1` (verified against
 * the hosted project 2026-09-05). `session === null` is NOT a discriminator.
 */
export function isObfuscatedDuplicateSignup(user: { identities?: unknown[] | null } | null | undefined): boolean {
  return !!user && Array.isArray(user.identities) && user.identities.length === 0
}

/**
 * Sign in with email and password
 */
export async function signInWithEmail(email: string, password: string) {
  const isDev = import.meta.env.DEV
  console.log('🔐 Starting email signin for:', isDev ? email : email.substring(0, 3) + '***')
  recordSessionActivity()

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
  recordSessionActivity()

  // Store flow type for callback handler
  sessionStorage.setItem('oauth_flow', flow)

  // Explicit domain handling for multi-environment OAuth redirects
  // Bypasses Supabase Site URL configuration which may default to dashboard
  const isStaging = window.location.hostname === 'creator-staging.kstorybridge.com'
  const isProduction = window.location.hostname === 'creator.kstorybridge.com'

  const redirectUrl = isStaging
    ? 'https://creator-staging.kstorybridge.com/auth/callback'
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

  // Validate and sanitize inputs
  if (!profileData.full_name || !profileData.pen_name || !profileData.ip_owner_role) {
    throw new Error('Missing required profile fields')
  }
  if (!['author', 'agent'].includes(profileData.ip_owner_role)) {
    throw new Error('Invalid role')
  }

  const sanitizedData = {
    full_name: sanitizeText(profileData.full_name, 100),
    pen_name: sanitizeText(profileData.pen_name, 100),
    ip_owner_role: profileData.ip_owner_role,
    ip_owner_company: profileData.ip_owner_company ? sanitizeText(profileData.ip_owner_company, 200) : undefined,
    website_url: profileData.website_url ? sanitizeText(profileData.website_url, 500) : undefined,
  }

  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user?.email) {
    console.error('❌ No authenticated user found:', userError)
    throw new Error('No authenticated user')
  }

  const isDev = import.meta.env.DEV
  console.log('👤 User found:', isDev ? user.id : user.id.substring(0, 8) + '...')

  // Step 1: Create creator profile via edge function
  // Edge function uses service role key to bypass any RLS issues
  try {
    const result = await createCreatorViaEdgeFunction({
      id: user.id,
      email: user.email!,
      full_name: sanitizedData.full_name,
      pen_name: sanitizedData.pen_name,
      ip_owner_role: sanitizedData.ip_owner_role,
      ip_owner_company: sanitizedData.ip_owner_company || null,
      website_url: sanitizedData.website_url || null,
      newsletter_consent: profileData.newsletter_consent ?? false,
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
      data: { account_type: 'creator', newsletter_consent: profileData.newsletter_consent ?? false },
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

  // Note: Welcome email will be sent after returning from CompleteProfile (in AuthCallback)
  // See AuthCallback.tsx for centralized welcome email logic
  return user
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/** Result of a profile-existence lookup. Never collapse 'error' into 'missing'. */
export type ProfileLookup = 'exists' | 'missing' | 'error'

const PROFILE_LOOKUP_TIMEOUT_MS = 10000

/**
 * Look up the creator profile for the currently authenticated user.
 * SECURITY: id-scoped (`user_creators.id = auth user id`), never by email —
 * a Google identity auto-linked onto an existing auth user shares the id.
 *
 * 'error' covers no-session, query errors and timeouts. Callers must treat it
 * as "unknown" (retry UI), never as "missing" (which would push an existing
 * creator into profile creation).
 */
export async function lookupCreatorProfile(): Promise<ProfileLookup> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      console.error('Error getting authenticated user:', userError)
      return 'error'
    }

    const query = supabase
      .from('user_creators')
      .select('id')
      .eq('id', user.id)
      .maybeSingle() as unknown as Promise<{ data: unknown; error: { message: string } | null }>

    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Profile lookup timed out')), PROFILE_LOOKUP_TIMEOUT_MS),
    )
    const { data, error } = await Promise.race([query, timeout])

    if (error) {
      console.error('Error checking profile:', error)
      return 'error'
    }
    return data ? 'exists' : 'missing'
  } catch (err) {
    console.error('Profile lookup failed:', err)
    return 'error'
  }
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
