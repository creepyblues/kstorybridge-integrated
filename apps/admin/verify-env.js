#!/usr/bin/env node

/**
 * Admin Environment Variables Verification Script
 * Checks if development environment variables are properly configured
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('🔍 Verifying Admin Portal environment configuration...\n');

// Check if .env.local exists
const envLocalPath = path.join(__dirname, '.env.local');
if (!fs.existsSync(envLocalPath)) {
    console.log('❌ .env.local file not found');
    console.log('   Run: cp .env.local.example .env.local');
    console.log('   Or run: ./setup-dev-env.sh\n');
    process.exit(1);
}

// Read and parse .env.local
const envContent = fs.readFileSync(envLocalPath, 'utf-8');
const envVars = {};

envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
        const [, key, value] = match;
        envVars[key] = value;
    }
});

console.log('📋 Environment Variables Status:\n');

// Check required variables
const requiredVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
    'VITE_DISABLE_AUTH_LOCALHOST',
    'VITE_DEV_ADMIN_EMAIL',
    'VITE_DEV_ADMIN_PASSWORD'
];

let allConfigured = true;

requiredVars.forEach(varName => {
    const value = envVars[varName];
    const hasValue = value && value !== 'your_admin_email_here' && value !== 'your_admin_password_here';
    
    if (hasValue) {
        if (varName.includes('PASSWORD')) {
            console.log(`✅ ${varName}: [CONFIGURED]`);
        } else {
            console.log(`✅ ${varName}: ${value}`);
        }
    } else {
        console.log(`❌ ${varName}: NOT CONFIGURED`);
        allConfigured = false;
    }
});

console.log('\n' + '='.repeat(50));

if (allConfigured) {
    console.log('✅ Environment is properly configured!');
    console.log('\n🚀 Ready to start development:');
    console.log('   npm run dev');
    console.log('   Open http://localhost:8082');
} else {
    console.log('❌ Environment configuration incomplete');
    console.log('\n🔧 Fix by running:');
    console.log('   ./setup-dev-env.sh');
    console.log('   or manually update .env.local');
}

console.log('\n⚠️  Security Note:');
console.log('   Development credentials only work on localhost');
console.log('   They are automatically blocked in production\n');