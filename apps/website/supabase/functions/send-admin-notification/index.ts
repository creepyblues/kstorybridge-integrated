import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestPayload {
  requestId: string
  titleId: string
  userId: string
  type: string
  requestorName: string
  titleName: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Only allow POST method
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

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

    // Parse request body
    const payload: RequestPayload = await req.json()
    const { requestId, titleId, userId, type, requestorName, titleName } = payload

    if (!requestId || !titleId || !userId || !type || !requestorName || !titleName) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get all active admin emails
    const { data: admins, error: adminError } = await supabaseAdmin
      .from('admin')
      .select('email, full_name')
      .eq('active', true)

    if (adminError) {
      console.error('Error fetching admins:', adminError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch admin list' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (!admins || admins.length === 0) {
      console.log('No active admins found')
      return new Response(
        JSON.stringify({ message: 'No active admins to notify' }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get request details for email
    const { data: requestDetails, error: requestError } = await supabaseAdmin
      .from('request')
      .select('created_at')
      .eq('id', requestId)
      .single()

    if (requestError) {
      console.error('Error fetching request details:', requestError)
    }

    const requestDate = requestDetails?.created_at 
      ? new Date(requestDetails.created_at).toLocaleString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          timeZoneName: 'short'
        })
      : new Date().toLocaleString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          timeZoneName: 'short'
        })

    // Create email content
    const emailSubject = `New ${type === 'pitch' ? 'Pitch Deck' : 'Contact'} Request - ${titleName}`
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #2C7A7A, #4A9B9B); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .info-box { background: white; padding: 20px; margin: 15px 0; border-radius: 6px; border-left: 4px solid #2C7A7A; }
            .label { font-weight: bold; color: #2C7A7A; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎬 KStoryBridge Admin Notification</h1>
              <p>New ${type === 'pitch' ? 'Pitch Deck' : 'Contact'} Request Received</p>
            </div>
            
            <div class="content">
              <p>Hello,</p>
              <p>A new ${type === 'pitch' ? 'pitch deck' : 'contact'} request has been submitted on the KStoryBridge platform.</p>
              
              <div class="info-box">
                <p><span class="label">Requestor:</span> ${requestorName}</p>
                <p><span class="label">Title:</span> ${titleName}</p>
                <p><span class="label">Request Type:</span> ${type === 'pitch' ? 'Pitch Deck Request' : 'Contact Creator Request'}</p>
                <p><span class="label">Request Date:</span> ${requestDate}</p>
                <p><span class="label">Request ID:</span> ${requestId}</p>
              </div>
              
              <p>Please review this request in the admin panel and take appropriate action.</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://admin.kstorybridge.com" 
                   style="background: #2C7A7A; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Open Admin Panel
                </a>
              </div>
            </div>
            
            <div class="footer">
              <p>This is an automated notification from KStoryBridge Admin System</p>
              <p>© 2025 KStoryBridge. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `

    // Send emails to all active admins
    const emailPromises = admins.map(async (admin) => {
      try {
        // Use Supabase's built-in email functionality or integrate with your email service
        // For now, we'll use a placeholder approach since Supabase Auth's email is primarily for auth
        // In production, you'd want to integrate with SendGrid, Resend, or similar service
        
        console.log(`Sending email to admin: ${admin.email}`)
        console.log(`Subject: ${emailSubject}`)
        console.log(`Request details: ${requestorName} requested ${type} for "${titleName}" on ${requestDate}`)
        
        // TODO: Replace with actual email service integration
        // Example with Resend:
        // const resendResponse = await fetch('https://api.resend.com/emails', {
        //   method: 'POST',
        //   headers: {
        //     'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        //     'Content-Type': 'application/json',
        //   },
        //   body: JSON.stringify({
        //     from: 'noreply@kstorybridge.com',
        //     to: admin.email,
        //     subject: emailSubject,
        //     html: emailHtml,
        //   }),
        // })
        
        return { success: true, email: admin.email }
      } catch (error) {
        console.error(`Failed to send email to ${admin.email}:`, error)
        return { success: false, email: admin.email, error: error.message }
      }
    })

    const results = await Promise.all(emailPromises)
    const successful = results.filter(r => r.success).length
    const failed = results.filter(r => !r.success).length

    console.log(`Email notification results: ${successful} successful, ${failed} failed`)

    return new Response(
      JSON.stringify({ 
        message: `Admin notification processed`,
        results: {
          successful,
          failed,
          totalAdmins: admins.length,
          details: results
        }
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