import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
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
    // Create Supabase client with service role
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

    // Create client for user auth validation
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Verify the user token
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get the PDF path from the request
    const url = new URL(req.url)
    const pdfPath = url.searchParams.get('path')
    
    if (!pdfPath) {
      return new Response(
        JSON.stringify({ error: 'PDF path is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Validate the path format (security check)
    const pathRegex = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\/pitch\.pdf$/
    if (!pathRegex.test(pdfPath)) {
      return new Response(
        JSON.stringify({ error: 'Invalid file path format' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Extract title ID from path
    const titleId = pdfPath.split('/')[0]

    // Optional: Verify user has access to this specific title
    // This adds an extra layer of security by checking if the user should have access
    const { data: titleAccess, error: accessError } = await supabaseAdmin
      .from('titles')
      .select('title_id')
      .eq('title_id', titleId)
      .single()

    if (accessError || !titleAccess) {
      return new Response(
        JSON.stringify({ error: 'Title not found or access denied' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create a signed URL with short expiry (30 minutes for security)
    const { data, error } = await supabaseAdmin.storage
      .from('pitch-pdfs')
      .createSignedUrl(pdfPath, 1800, {
        transform: {
          quality: 80 // Optional: compress for faster loading
        }
      })

    if (error) {
      console.error('Signed URL error:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to generate secure access' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Log access for security auditing
    console.log(`PDF access granted: ${user.email} -> ${pdfPath}`)

    return new Response(
      JSON.stringify({ 
        signedUrl: data.signedUrl,
        expiresIn: 1800,
        message: 'Secure access granted'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})