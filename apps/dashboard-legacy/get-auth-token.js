/**
 * Enhanced Helper Script to Extract Supabase Auth Token
 *
 * Instructions:
 * 1. Open http://localhost:8081/buyers/chat in your browser
 * 2. Open Developer Console (F12 or Cmd+Option+I)
 * 3. Copy and paste this entire script into the console
 * 4. Press Enter
 * 5. Copy the token command that appears
 * 6. Run in terminal: SUPABASE_AUTH_TOKEN="your-token" node test-chatbot-improvements.js
 */

(async function() {
  console.log('🔑 Enhanced Token Extraction Starting...\n');
  console.log('📊 Debug: Searching for auth tokens...\n');

  try {
    // Method 1: Direct key access (fastest)
    const directKey = 'sb-dlrnrgcoguxlkkcitlpd-auth-token';
    const directValue = localStorage.getItem(directKey);

    if (directValue) {
      console.log('✅ Found direct key:', directKey);
      try {
        const parsed = JSON.parse(directValue);
        console.log('📊 Debug: JSON structure keys:', Object.keys(parsed).join(', '));

        // Check multiple possible paths
        let token = null;
        let expiresAt = null;

        if (parsed.access_token) {
          token = parsed.access_token;
          expiresAt = parsed.expires_at;
        } else if (parsed.session?.access_token) {
          token = parsed.session.access_token;
          expiresAt = parsed.session.expires_at;
        } else if (parsed.currentSession?.access_token) {
          token = parsed.currentSession.access_token;
          expiresAt = parsed.currentSession.expires_at;
        }

        if (token) {
          console.log('✅ Successfully extracted token!\n');
          console.log('📋 Copy this command and run in terminal:\n');
          console.log(`SUPABASE_AUTH_TOKEN="${token}" node test-chatbot-improvements.js\n`);
          if (expiresAt) {
            const expiry = typeof expiresAt === 'number' ? new Date(expiresAt * 1000) : new Date(expiresAt);
            console.log('⏰ Token expires at:', expiry.toLocaleString());
          }
          console.log('\n✨ Token ready to use!');
          return token;
        }
      } catch (e) {
        console.warn('⚠️ Could not parse direct key value:', e.message);
      }
    }

    // Method 2: Search all localStorage keys containing 'supabase'
    console.log('📊 Debug: Searching all localStorage keys...');
    const allKeys = Object.keys(localStorage);
    const supabaseKeys = allKeys.filter(key => key.toLowerCase().includes('supabase'));

    console.log(`📊 Debug: Found ${supabaseKeys.length} Supabase-related keys:`, supabaseKeys);

    for (const key of supabaseKeys) {
      const value = localStorage.getItem(key);
      try {
        const parsed = JSON.parse(value);

        // Recursively search for access_token
        const findToken = (obj, path = '') => {
          if (obj && typeof obj === 'object') {
            if (obj.access_token && typeof obj.access_token === 'string') {
              return { token: obj.access_token, expires: obj.expires_at, path };
            }
            for (const [k, v] of Object.entries(obj)) {
              const result = findToken(v, path ? `${path}.${k}` : k);
              if (result) return result;
            }
          }
          return null;
        };

        const result = findToken(parsed);
        if (result) {
          console.log(`✅ Found token in key: ${key} at path: ${result.path}\n`);
          console.log('📋 Copy this command and run in terminal:\n');
          console.log(`SUPABASE_AUTH_TOKEN="${result.token}" node test-chatbot-improvements.js\n`);
          if (result.expires) {
            const expiry = typeof result.expires === 'number' ? new Date(result.expires * 1000) : new Date(result.expires);
            console.log('⏰ Token expires at:', expiry.toLocaleString());
          }
          console.log('\n✨ Token ready to use!');
          return result.token;
        }
      } catch (e) {
        // Not JSON, skip
      }
    }

    // Method 3: Try Supabase client (if exposed globally)
    console.log('📊 Debug: Checking for global Supabase client...');
    if (typeof window !== 'undefined' && window.supabase) {
      console.log('✅ Found global Supabase client');
      const { data } = await window.supabase.auth.getSession();
      if (data?.session?.access_token) {
        const token = data.session.access_token;
        console.log('✅ Successfully extracted token from Supabase client!\n');
        console.log('📋 Copy this command and run in terminal:\n');
        console.log(`SUPABASE_AUTH_TOKEN="${token}" node test-chatbot-improvements.js\n`);
        console.log('⏰ Token expires at:', new Date(data.session.expires_at * 1000).toLocaleString());
        console.log('\n✨ Token ready to use!');
        return token;
      }
    }

    // No token found
    console.log('❌ No auth token found in any location.\n');
    console.log('🔍 Debugging Info:');
    console.log(`   - Total localStorage keys: ${allKeys.length}`);
    console.log(`   - Supabase keys found: ${supabaseKeys.length}`);
    console.log(`   - Global Supabase client: ${window.supabase ? 'YES' : 'NO'}`);
    console.log('\n📝 Troubleshooting Steps:');
    console.log('1. Make sure you are logged in');
    console.log('2. Refresh the page (Cmd+R or Ctrl+R)');
    console.log('3. Run this script again\n');

  } catch (error) {
    console.error('❌ Error during token extraction:', error.message);
    console.error('Stack:', error.stack);
  }
})();
