import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailPayload {
  email: string
  userName?: string
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

    // Parse request body
    const payload: EmailPayload = await req.json()
    const { email, userName } = payload

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create email content
    const emailSubject = 'Your KStoryBridge Account Has Been Approved!'
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #2C7A7A, #4A9B9B); color: white; padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
            .header h1 { margin: 0; font-size: 28px; }
            .content { background: #ffffff; padding: 40px 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 12px 12px; }
            .button-container { text-align: center; margin: 35px 0; }
            .cta-button { 
              background: #2C7A7A; 
              color: white !important; 
              padding: 16px 40px; 
              text-decoration: none; 
              border-radius: 8px; 
              display: inline-block;
              font-size: 16px;
              font-weight: 600;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              transition: all 0.3s ease;
            }
            .cta-button:hover { 
              background: #245d5d; 
              box-shadow: 0 6px 8px rgba(0, 0, 0, 0.15);
            }
            .congratulations { 
              font-size: 24px; 
              color: #2C7A7A; 
              font-weight: bold; 
              margin-bottom: 20px;
              text-align: center;
            }
            .message { 
              font-size: 16px; 
              color: #555; 
              margin: 20px 0;
              text-align: center;
            }
            .footer { 
              text-align: center; 
              margin-top: 30px; 
              padding-top: 20px;
              border-top: 1px solid #e0e0e0;
              font-size: 12px; 
              color: #999; 
            }
            .icon { font-size: 48px; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="icon">🎉</div>
              <h1>Welcome to KStoryBridge!</h1>
            </div>
            
            <div class="content">
              <p class="congratulations">Congratulations${userName ? ` ${userName}` : ''}!</p>
              
              <p class="message">
                Your account has been approved and you can now navigate K Content ready for your review.
              </p>
              
              <p class="message">
                Explore our curated collection of Korean stories, connect with creators, and discover content perfect for your needs.
              </p>
              
              <div class="button-container">
                <a href="https://dashboard.kstorybridge.com" class="cta-button">
                  Go to Dashboard →
                </a>
              </div>
              
              <p style="text-align: center; color: #777; font-size: 14px; margin-top: 30px;">
                If you have any questions, feel free to reach out to our support team.
              </p>
              
              <div class="footer">
                <p>© 2025 KStoryBridge. All rights reserved.</p>
                <p>This is an automated message. Please do not reply to this email.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `

    // For development/testing, log the email that would be sent
    console.log(`Sending approval email to: ${email}`)
    console.log(`Subject: ${emailSubject}`)

    // TODO: Integrate with actual email service (Resend, SendGrid, etc.)
    // For now, we'll simulate success
    
    // Example integration with Resend (uncomment when API key is available):
    /*
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    
    if (RESEND_API_KEY) {
      const resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'KStoryBridge <noreply@kstorybridge.com>',
          to: email,
          subject: emailSubject,
          html: emailHtml,
        }),
      })

      if (!resendResponse.ok) {
        const error = await resendResponse.text()
        throw new Error(`Failed to send email: ${error}`)
      }

      const result = await resendResponse.json()
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Approval email sent successfully',
          emailId: result.id
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }
    */

    // Simulated response for development
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Approval email sent successfully (simulated)',
        email: email,
        preview: {
          subject: emailSubject,
          note: 'Email service integration pending. In production, this will send a real email.'
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
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})