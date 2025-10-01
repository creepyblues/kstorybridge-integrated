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
    const {
      userId,
      email,
      fullName,
      buyerCompany,
      buyerRole,
      linkedinUrl,
      tier,
      requested
    } = await req.json()

    console.log('Creating buyer profile for user:', { userId, email, fullName })

    // Validate required fields
    if (!userId || !email || !fullName || !buyerCompany || !buyerRole) {
      console.error('Missing required fields for buyer profile creation')
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required fields: userId, email, fullName, buyerCompany, and buyerRole are required'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Check if profile already exists
    const { data: existingProfile } = await supabaseAdmin
      .from('user_buyers')
      .select('id')
      .eq('id', userId)
      .single()

    if (existingProfile) {
      console.log('Buyer profile already exists for user:', userId)
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Buyer profile already exists',
          profileId: userId
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Create the buyer profile
    const { data: newProfile, error: insertError } = await supabaseAdmin
      .from('user_buyers')
      .insert({
        id: userId,
        email: email.toLowerCase(),
        full_name: fullName,
        buyer_company: buyerCompany,
        buyer_role: buyerRole,
        linkedin_url: linkedinUrl || null,
        tier: tier || 'basic',
        requested: requested || false,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating buyer profile:', insertError)
      throw insertError
    }

    console.log('Buyer profile created successfully:', newProfile)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Buyer profile created successfully',
        profile: newProfile
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in create-buyer-profile function:', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Unknown error occurred'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})