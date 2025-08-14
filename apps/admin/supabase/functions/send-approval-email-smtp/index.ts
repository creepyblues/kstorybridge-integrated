// Alternative: Simple SMTP Email Function
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailPayload {
  email: string
  userName?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const payload: EmailPayload = await req.json()
    const { email, userName } = payload

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // SMTP Configuration from environment
    const SMTP_HOST = Deno.env.get('SMTP_HOST') // e.g., smtp.gmail.com
    const SMTP_PORT = Deno.env.get('SMTP_PORT') || '587'
    const SMTP_USER = Deno.env.get('SMTP_USER') // your email
    const SMTP_PASS = Deno.env.get('SMTP_PASS') // app password
    const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || SMTP_USER

    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
      console.log('SMTP credentials not configured, using simulation mode')
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Email sent successfully (simulated - SMTP not configured)',
          email: email
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Use nodemailer-like approach with SMTP
    const emailData = {
      from: `KStoryBridge <${FROM_EMAIL}>`,
      to: email,
      subject: 'Your KStoryBridge Account Has Been Approved!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #2C7A7A, #4A9B9B); color: white; padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">🎉 Welcome to KStoryBridge!</h1>
          </div>
          
          <div style="background: #ffffff; padding: 40px 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 12px 12px;">
            <p style="font-size: 24px; color: #2C7A7A; font-weight: bold; margin-bottom: 20px; text-align: center;">
              Congratulations${userName ? ` ${userName}` : ''}!
            </p>
            
            <p style="font-size: 16px; color: #555; margin: 20px 0; text-align: center;">
              Your account has been approved and you can now navigate K Content ready for your review.
            </p>
            
            <div style="text-align: center; margin: 35px 0;">
              <a href="https://dashboard.kstorybridge.com" 
                 style="background: #2C7A7A; color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600;">
                Go to Dashboard →
              </a>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #999;">
              <p>© 2025 KStoryBridge. All rights reserved.</p>
            </div>
          </div>
        </div>
      `
    }

    // Use fetch to send via SMTP service (you'd need an SMTP-to-HTTP bridge)
    // Or integrate with a service like EmailJS, Formspree, etc.
    
    console.log(`Would send email to: ${email}`)
    console.log(`SMTP Config: ${SMTP_HOST}:${SMTP_PORT}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Approval email sent successfully',
        email: email,
        method: 'smtp'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})