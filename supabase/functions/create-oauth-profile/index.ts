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
    const { account_type, user_id, profile_data } = await req.json()

    // Validate required fields
    if (!account_type || !user_id || !profile_data) {
      console.error('Missing required fields for OAuth profile creation')
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required fields: account_type, user_id, and profile_data are required'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (account_type === 'buyer') {
      // Handle buyer profile creation
      const {
        id,
        email,
        full_name,
        buyer_company,
        buyer_role,
        linkedin_url,
        tier,
        requested
      } = profile_data

      // Validate buyer-specific required fields
      if (!email || !full_name) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Missing required buyer fields: email and full_name are required'
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      // Check if buyer profile already exists
      const { data: existingBuyer } = await supabaseAdmin
        .from('user_buyers')
        .select('id')
        .eq('id', user_id)
        .single()

      if (existingBuyer) {
        return new Response(
          JSON.stringify({
            success: true,
            message: 'Buyer profile already exists',
            userExists: true,
            profile: existingBuyer
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      // Create the buyer profile
      const { data: newBuyerProfile, error: buyerError } = await supabaseAdmin
        .from('user_buyers')
        .insert({
          id: user_id,
          email: email.toLowerCase(),
          full_name: full_name,
          buyer_company: buyer_company,
          buyer_role: buyer_role,
          linkedin_url: linkedin_url || null,
          tier: tier || 'basic',
          requested: requested || false,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (buyerError) {
        console.error('Error creating buyer profile:', buyerError)
        throw buyerError
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Buyer profile created successfully',
          userExists: false,
          profile: newBuyerProfile
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )

    } else if (account_type === 'creator') {
      // Handle creator profile creation
      const {
        id,
        email,
        full_name,
        pen_name,
        ip_owner_role,
        ip_owner_company,
        website_url,
        invitation_status
      } = profile_data

      // Validate creator-specific required fields
      if (!email || !full_name || !pen_name) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Missing required creator fields: email, full_name, and pen_name are required'
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      // Check if creator profile already exists
      const { data: existingCreator } = await supabaseAdmin
        .from('user_creators')
        .select('id')
        .eq('id', user_id)
        .single()

      if (existingCreator) {
        return new Response(
          JSON.stringify({
            success: true,
            message: 'Creator profile already exists',
            userExists: true,
            profile: existingCreator
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      // Create the creator profile
      const { data: newCreatorProfile, error: creatorError } = await supabaseAdmin
        .from('user_creators')
        .insert({
          id: user_id,
          email: email.toLowerCase(),
          full_name: full_name,
          pen_name: pen_name,
          ip_owner_role: ip_owner_role || null,
          ip_owner_company: ip_owner_company || null,
          website_url: website_url || null,
          invitation_status: invitation_status || 'invited',
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (creatorError) {
        console.error('Error creating creator profile:', creatorError)
        throw creatorError
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Creator profile created successfully',
          userExists: false,
          profile: newCreatorProfile
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )

    } else {
      // Invalid account type
      return new Response(
        JSON.stringify({
          success: false,
          error: `Invalid account_type: ${account_type}. Must be 'buyer' or 'creator'`
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

  } catch (error) {
    console.error('Error in create-oauth-profile function:', error)

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