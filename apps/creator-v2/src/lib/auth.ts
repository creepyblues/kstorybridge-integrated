import { supabase } from './supabase'

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

  // Step 2: Create creator profile
  try {
    await createCreatorProfile(authData.user.id, normalizedEmail, data)
    console.log('✅ Creator profile created successfully')
  } catch (profileError) {
    console.error('❌ Profile creation failed:', profileError)
    console.warn('⚠️ Orphaned auth user may exist. User should retry signup with same email.')
    // Note: Cannot delete auth user from client (requires service role key)
    // Supabase will return "User already exists" on retry, which is handled gracefully
    throw profileError
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

  const redirectUrl = `${window.location.origin}/auth/callback`
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

  // Step 1: Create creator profile
  try {
    await createCreatorProfile(user.id, user.email!, profileData)
    console.log('✅ Creator profile created')
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
      // Cleanup: Delete profile if metadata update fails
      await deleteCreatorProfile(user.id)
      throw metadataError
    }

    console.log('✅ Metadata updated successfully')
  } catch (error) {
    console.error('❌ OAuth profile completion failed:', error)
    throw error
  }

  return user
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Create creator profile in user_creators table
 */
async function createCreatorProfile(
  userId: string,
  email: string,
  profile: CreatorProfile
) {
  const { error } = await supabase.from('user_creators').insert({
    id: userId,
    email: email.toLowerCase(),
    full_name: profile.full_name,
    pen_name: profile.pen_name,
    ip_owner_role: profile.ip_owner_role,
    ip_owner_company: profile.ip_owner_company || null,
    website_url: profile.website_url || null,
    invitation_status: 'active',
  })

  if (error) {
    throw error
  }
}

/**
 * Delete creator profile (cleanup on failure)
 */
async function deleteCreatorProfile(userId: string) {
  await supabase.from('user_creators').delete().eq('id', userId)
}

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
