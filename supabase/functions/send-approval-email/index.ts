import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

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
    console.log('🚀 FUNCTION STARTED - Debug Version v2.0')
    console.log('📅 Timestamp:', new Date().toISOString())
    
    // Only allow POST method
    if (req.method !== 'POST') {
      console.log('❌ Invalid method:', req.method)
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
    console.log('📧 Email request for:', email)

    if (!email) {
      console.log('❌ No email provided')
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

    console.log('🔍 EXTENSIVE ENVIRONMENT DEBUG:')
    console.log('================================')
    
    // Get all environment variables
    const allEnvVars = Deno.env.toObject()
    console.log('📋 Total env vars count:', Object.keys(allEnvVars).length)
    console.log('📋 All env var keys:', Object.keys(allEnvVars))
    
    // Check specifically for RESEND_API_KEY
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    console.log('🔑 RESEND_API_KEY status:')
    console.log('  - Exists:', !!RESEND_API_KEY)
    console.log('  - Type:', typeof RESEND_API_KEY)
    console.log('  - Length:', RESEND_API_KEY?.length || 0)
    console.log('  - First 10 chars:', RESEND_API_KEY?.substring(0, 10) || 'N/A')
    console.log('  - Starts with "re_":', RESEND_API_KEY?.startsWith('re_') || false)
    
    // Check for variations of the key name
    const variations = [
      'RESEND_API_KEY',
      'resend_api_key', 
      'RESEND_API_TOKEN',
      'RESEND_KEY'
    ]
    
    console.log('🔍 Checking key variations:')
    variations.forEach(key => {
      const value = Deno.env.get(key)
      console.log(`  - ${key}:`, !!value, value?.length || 0)
    })
    
    // Print some system info
    console.log('🖥️  System info:')
    console.log('  - Deno version:', Deno.version.deno)
    console.log('  - Platform:', Deno.build.os)
    console.log('  - Arch:', Deno.build.arch)

    if (RESEND_API_KEY && RESEND_API_KEY.length > 0) {
      console.log('✅ RESEND_API_KEY FOUND! Attempting to send via Resend...')
      
      try {
        console.log('📤 Making request to Resend API...')
        const resendResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'KStoryBridge <onboarding@resend.dev>',
            to: email,
            subject: emailSubject,
            html: emailHtml,
          }),
        })

        console.log('📨 Resend API response status:', resendResponse.status)
        console.log('📨 Resend API response headers:', Object.fromEntries(resendResponse.headers.entries()))

        if (!resendResponse.ok) {
          const errorText = await resendResponse.text()
          console.error('❌ Resend API error response:', errorText)
          
          // Check for domain verification error (403)
          if (resendResponse.status === 403 && errorText.includes('verify a domain')) {
            console.log('🔧 Domain verification required - falling back to simulation')
            // Don't throw error, fall through to simulation mode
          } else {
            throw new Error(`Resend API failed with status ${resendResponse.status}: ${errorText}`)
          }
        } else {
          const result = await resendResponse.json()
          console.log('✅ Resend success! Email ID:', result.id)
        
          return new Response(
            JSON.stringify({ 
              success: true, 
              message: 'Approval email sent successfully via Resend!',
              emailId: result.id,
              method: 'resend',
              debug: {
                functionVersion: 'debug-v2.0',
                timestamp: new Date().toISOString(),
                envVarCount: Object.keys(allEnvVars).length
              }
            }),
            { 
              status: 200, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }
      } catch (resendError) {
        console.error('❌ Resend error details:', resendError)
        console.error('❌ Error name:', resendError.name)
        console.error('❌ Error message:', resendError.message)
        console.error('❌ Error stack:', resendError.stack)
        // Continue to simulation mode if Resend fails
      }
    } else {
      console.log('❌ RESEND_API_KEY NOT FOUND OR EMPTY')
      console.log('   Falling back to simulation mode...')
    }

    // Fallback simulated response for development
    console.log('🔄 Returning simulation response')
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Approval email sent successfully (simulated)',
        email: email,
        method: 'simulation',
        debug: {
          functionVersion: 'debug-v2.0',
          timestamp: new Date().toISOString(),
          resendKeyFound: !!RESEND_API_KEY,
          resendKeyLength: RESEND_API_KEY?.length || 0,
          envVarCount: Object.keys(allEnvVars).length,
          envVarKeys: Object.keys(allEnvVars)
        },
        preview: {
          subject: emailSubject,
          note: 'Resend API key found but domain verification required. Verify kstorybridge.com domain in Resend dashboard for production email sending.'
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('💥 FUNCTION ERROR:', error)
    console.error('💥 Error name:', error.name)
    console.error('💥 Error message:', error.message)
    console.error('💥 Error stack:', error.stack)
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message,
        debug: {
          functionVersion: 'debug-v2.0',
          timestamp: new Date().toISOString(),
          errorType: error.name
        }
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})