#!/usr/bin/env node

/**
 * Debug Production OpenAI API
 * This script helps diagnose production API issues
 */

console.log('🔍 Debugging Production OpenAI API Issue\n');

const issues = [
  {
    issue: "API endpoint not deployed",
    symptoms: ["404 Not Found", "Cannot GET /api/openai-chat"],
    solution: "Ensure api/ folder is at root of your project and deployed",
    check: "Try visiting: https://your-domain.vercel.app/api/openai-chat (should return Method Not Allowed)"
  },
  {
    issue: "Environment variables not set",
    symptoms: ["Server configuration error", "Unauthorized", "API key not configured"],
    solution: "Check Vercel dashboard > Settings > Environment Variables",
    check: "Ensure OPENAI_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_KEY are set"
  },
  {
    issue: "CORS/Domain issue",
    symptoms: ["Access-Control-Allow-Origin", "CORS error"],
    solution: "Update allowedOrigins in api/openai-chat.ts",
    check: "Verify your production domain is in the allowedOrigins array"
  },
  {
    issue: "Serverless function timeout",
    symptoms: ["Function timeout", "502 Bad Gateway"],
    solution: "OpenAI API call taking too long",
    check: "Check OpenAI API status and your API key quota"
  },
  {
    issue: "JSON parsing error (current issue)",
    symptoms: ["Unexpected token 'A'", "not valid JSON"],
    solution: "API returning HTML error page instead of JSON",
    check: "Server error or misconfigured endpoint"
  }
];

console.log('🚨 Current Error Analysis:');
console.log('Error: "Unexpected token \'A\', \'A server e\'... is not valid JSON"');
console.log('This means the API is returning an HTML error page instead of JSON response.\n');

console.log('📋 Possible Causes & Solutions:\n');

issues.forEach((item, index) => {
  console.log(`${index + 1}. ${item.issue}`);
  console.log(`   Symptoms: ${item.symptoms.join(', ')}`);
  console.log(`   Solution: ${item.solution}`);
  console.log(`   Check: ${item.check}\n`);
});

console.log('🔧 Immediate Debugging Steps:\n');

console.log('1. Check if API endpoint is accessible:');
console.log('   Visit: https://dashboard.kstorybridge.com/api/openai-chat');
console.log('   Expected: {"error": "Method not allowed"} (405 status)');
console.log('   If you see HTML: API not deployed properly\n');

console.log('2. Check Vercel Function Logs:');
console.log('   Go to Vercel Dashboard > Functions');
console.log('   Look for /api/openai-chat function');
console.log('   Check recent invocations for errors\n');

console.log('3. Test with curl:');
console.log('   curl -X POST https://dashboard.kstorybridge.com/api/openai-chat \\');
console.log('     -H "Content-Type: application/json" \\');
console.log('     -H "Authorization: Bearer your-token" \\');
console.log('     -d \'{"query": "test"}\'');
console.log('   This will show the exact response\n');

console.log('4. Verify Environment Variables in Vercel:');
console.log('   - OPENAI_API_KEY (starts with sk-proj- or sk-)');
console.log('   - SUPABASE_URL (https://dlrnrgcoguxlkkcitlpd.supabase.co)');
console.log('   - SUPABASE_SERVICE_KEY (eyJhbGciOiJIUzI1NiIs...)');
console.log('   Make sure they\'re set for "Production" environment\n');

console.log('5. Check File Structure:');
console.log('   Your repo should have:');
console.log('   apps/dashboard/api/openai-chat.ts (NOT in src/)');
console.log('   This file must be at root level for Vercel to detect it\n');

console.log('🛠️  Quick Fixes to Try:\n');

console.log('A. Redeploy with verbose logging:');
console.log('   Add console.log statements to api/openai-chat.ts');
console.log('   Deploy and check Vercel function logs\n');

console.log('B. Test environment variables:');
console.log('   Add a test endpoint to verify env vars are loaded\n');

console.log('C. Check API route format:');
console.log('   Ensure api/openai-chat.ts exports default function handler\n');

console.log('✨ Most Likely Issue:');
console.log('The API endpoint is probably not deployed or returning a 404/500 error page');
console.log('instead of JSON. Check Vercel deployment logs first!\n');

console.log('Need help with specific error? Share:');
console.log('1. Vercel function logs');
console.log('2. Response when visiting /api/openai-chat directly');
console.log('3. Your project structure in Vercel dashboard');