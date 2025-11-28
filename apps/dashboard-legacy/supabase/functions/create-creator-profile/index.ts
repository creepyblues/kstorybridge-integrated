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

    // Create the creator profile
    const { data: newProfile, error: insertError } = await supabaseAdmin
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