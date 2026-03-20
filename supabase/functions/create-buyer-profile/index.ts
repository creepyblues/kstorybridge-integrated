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

    // Get request data - support both snake_case (frontend) and camelCase field names
    const requestBody = await req.json()

    // Extract fields with fallback for both naming conventions
    const userId = requestBody.user_id || requestBody.userId
    const email = requestBody.email
    const fullName = requestBody.full_name || requestBody.fullName
    const buyerCompany = requestBody.buyer_company || requestBody.buyerCompany
    const buyerRole = requestBody.buyer_role || requestBody.buyerRole
    const linkedinUrl = requestBody.linkedin_url || requestBody.linkedinUrl
    const tier = requestBody.tier
    const requested = requestBody.requested
    // Newsletter consent
    const newsletterConsent = requestBody.newsletter_consent ?? requestBody.newsletterConsent ?? false
    // Trial tracking fields
    const trialSessionId = requestBody.trial_session_id || requestBody.trialSessionId

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
        // Newsletter consent
        newsletter_consent: newsletterConsent,
        newsletter_consented_at: newsletterConsent ? new Date().toISOString() : null,
        // Trial tracking
        trial_session_id: trialSessionId || null,
        came_from_trial: !!trialSessionId,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating buyer profile:', insertError)
      throw insertError
    }

    // If user came from trial, link the trial session to their account
    if (trialSessionId) {
      console.log('Linking trial session to user:', { trialSessionId, userId, email })

      const { error: trialLinkError } = await supabaseAdmin
        .from('trial_sessions')
        .update({
          converted: true,
          converted_at: new Date().toISOString(),
          user_id: userId,
          user_email: email.toLowerCase()
        })
        .eq('session_id', trialSessionId)

      if (trialLinkError) {
        // Log but don't fail - profile was created successfully
        console.error('Error linking trial session:', trialLinkError)
      } else {
        console.log('Trial session linked successfully')
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Buyer profile created successfully',
        profile: newProfile,
        trialLinked: !!trialSessionId
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