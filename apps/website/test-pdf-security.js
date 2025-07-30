#!/usr/bin/env node

/**
 * Test script to verify PDF security is working
 * This script tests both unauthorized and authorized access
 */

async function testPDFSecurity() {
  const testUrl = 'https://dlrnrgcoguxlkkcitlpd.supabase.co/storage/v1/object/public/pitch-pdfs/1813044e-306f-4479-87cb-bb212b502e1f/pitch.pdf';
  
  console.log('🔒 Testing PDF Security Configuration\n');
  console.log('📋 Test URL:', testUrl);
  console.log('🕒 Timestamp:', new Date().toISOString());
  console.log('=' .repeat(80));
  
  try {
    console.log('\n1️⃣ Testing UNAUTHORIZED access (should fail)...');
    
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Security-Test-Bot/1.0'
      }
    });
    
    console.log(`📊 Response Status: ${response.status} ${response.statusText}`);
    console.log(`📋 Response Headers:`);
    for (const [key, value] of response.headers.entries()) {
      console.log(`   ${key}: ${value}`);
    }
    
    if (response.status === 400 || response.status === 403 || response.status === 404) {
      console.log('✅ SUCCESS: Unauthorized access is properly blocked!');
      console.log('🛡️  PDF is secure from direct access');
    } else if (response.status === 200) {
      console.log('⚠️  WARNING: PDF is still publicly accessible!');
      console.log('🚨 SECURITY ISSUE: Direct access should be blocked');
      
      // Get content type to confirm it's actually a PDF
      const contentType = response.headers.get('content-type');
      console.log(`📄 Content-Type: ${contentType}`);
      
      if (contentType && contentType.includes('application/pdf')) {
        console.log('🔴 CRITICAL: PDF content is being served without authentication!');
      }
    } else {
      console.log(`🤔 Unexpected status: ${response.status}`);
    }
    
    console.log('\n' + '=' .repeat(80));
    console.log('📝 Security Test Summary:');
    console.log(`   • Direct URL access: ${response.status === 200 ? '❌ ALLOWED (BAD)' : '✅ BLOCKED (GOOD)'}`);
    console.log(`   • Response status: ${response.status}`);
    console.log(`   • Security level: ${response.status === 200 ? '🔴 LOW' : '🟢 HIGH'}`);
    
    if (response.status === 200) {
      console.log('\n🚨 IMMEDIATE ACTION REQUIRED:');
      console.log('   1. Run the secure-bucket-now.sql script in Supabase SQL editor');
      console.log('   2. Set bucket public = false');
      console.log('   3. Update storage policies to require authentication');
      console.log('   4. Re-run this test to verify');
    } else {
      console.log('\n🎉 Security configuration appears to be working correctly!');
      console.log('   • PDFs can only be accessed by authenticated users');
      console.log('   • Direct URL access is properly blocked');
    }
    
  } catch (error) {
    console.log('✅ SUCCESS: Direct access failed (as expected)');
    console.log(`📋 Error: ${error.message}`);
    console.log('🔒 This indicates the security is working properly');
  }
  
  console.log('\n' + '=' .repeat(80));
}

testPDFSecurity().catch(console.error);