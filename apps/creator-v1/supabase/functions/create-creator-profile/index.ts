import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client with service role (bypasses RLS)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get request data
    const { userId, email, fullName, penName, ipOwnerRole, ipOwnerCompany, websiteUrl } = await req.json()

    console.log('Creating creator profile for user:', { userId, email, fullName })

    // Check if profile already exists
    const { data: existingProfile } = await supabaseAdmin
      .from('user_creators')
      .select('id')
      .eq('id', userId)
      .single()

    if (existingProfile) {
      console.log('Creator profile already exists for user:', userId)
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Creator profile already exists',
          profileId: userId
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Retry logic for handling foreign key timing issues
    const maxRetries = 3
    const retryDelays = [500, 1000, 2000] // ms: 0.5s, 1s, 2s

    let newProfile
    let insertError

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      // Add delay before retry attempts (not on first attempt)
      if (attempt > 0) {
        console.log(`Retry attempt ${attempt}/${maxRetries} after ${retryDelays[attempt - 1]}ms delay...`)
        await new Promise(resolve => setTimeout(resolve, retryDelays[attempt - 1]))
      }

      // Check if auth user exists in auth.users table
      const { data: authUser, error: authCheckError } = await supabaseAdmin.auth.admin.getUserById(userId)

      if (authCheckError || !authUser) {
        if (attempt < maxRetries) {
          console.log(`Auth user not found yet (attempt ${attempt + 1}/${maxRetries + 1}), will retry...`)
          continue
        } else {
          throw new Error(`Auth user not found: ${authCheckError?.message || 'User does not exist'}`)
        }
      }

      console.log(`Auth user confirmed (attempt ${attempt + 1}), creating profile...`)

      // Create the creator profile
      const result = await supabaseAdmin
        .from('user_creators')
        .insert({
          id: userId,
          email: email,
          full_name: fullName || '',
          pen_name: penName || null,
          ip_owner_role: ipOwnerRole ? ipOwnerRole as 'author' | 'agent' : null,
          ip_owner_company: ipOwnerCompany || null,
          website_url: websiteUrl || null,
        })
        .select()
        .single()

      newProfile = result.data
      insertError = result.error

      // If successful, break out of retry loop
      if (!insertError) {
        console.log(`✅ Profile created successfully on attempt ${attempt + 1}`)
        break
      }

      // If it's a foreign key constraint error and we have retries left, continue
      if (insertError?.message?.includes('foreign key constraint') && attempt < maxRetries) {
        console.log(`Foreign key constraint error on attempt ${attempt + 1}, retrying...`)
        continue
      }

      // For any other error or last attempt, throw
      if (attempt === maxRetries) {
        console.error('Error creating creator profile after all retries:', insertError)
        throw insertError
      }
    }

    if (insertError) {
      console.error('Error creating creator profile:', insertError)
      throw insertError
    }

    console.log('Creator profile created successfully:', newProfile)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Creator profile created successfully',
        profile: newProfile
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in create-creator-profile function:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})