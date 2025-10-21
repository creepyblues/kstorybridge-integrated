# Comprehensive Authentication Test Plan

## Test Environment Setup
- Dashboard: http://localhost:8082
- Website: http://localhost:5173 (if needed for cross-domain testing)
- Database: Supabase project dlrnrgcoguxlkkcitlpd
- Test Date: 2025-08-28

## Test Categories

### 1. EMAIL SIGNUP FLOWS

#### 1.1 Buyer Email Signup - New User
**Test Steps:**
1. Navigate to `/signup/buyer`
2. Fill form with valid email (test+buyer1@example.com)
3. Complete all required fields (company, role)
4. Submit form
5. Check email verification flow
6. Verify user_buyers table entry
7. Check tier assignment (should be 'basic')
8. Test login after verification

**Expected Results:**
- Profile created in user_buyers table
- Default tier: 'basic'
- Email verification sent
- User can login after verification

#### 1.2 Creator Email Signup - New User  
**Test Steps:**
1. Navigate to `/signup/creator`
2. Fill form with valid email (test+creator1@example.com)
3. Complete all required fields (pen name)
4. Submit form
5. Check email verification flow
6. Verify user_ipowners table entry
7. Check invitation_status assignment
8. Test login after verification

**Expected Results:**
- Profile created in user_ipowners table
- Default invitation_status: 'invited'
- Email verification sent
- User can login after verification

#### 1.3 Email Signup - Duplicate Email
**Test Steps:**
1. Try signing up with existing email
2. Verify error handling
3. Check no duplicate profiles created

### 2. OAUTH SIGNUP FLOWS

#### 2.1 Google OAuth Signup - Buyer (New User)
**Test Steps:**
1. Navigate to `/signup/buyer`
2. Click "Continue with Google"
3. Complete Google OAuth flow
4. Verify redirect to profile completion
5. Check URL parameters (complete=true, user_id, email)
6. Fill additional profile info
7. Submit "Complete Profile"
8. Verify user_buyers table entry
9. Check redirect to buyer dashboard

**Expected Results:**
- OAuth creates auth.users entry
- Redirects to profile completion form
- Profile completion creates user_buyers entry
- Default tier: 'basic'
- Redirects to `/buyers/titles`

#### 2.2 Google OAuth Signup - Creator (New User)
**Test Steps:**
1. Navigate to `/signup/creator`  
2. Click "Continue with Google"
3. Complete Google OAuth flow
4. Verify redirect to profile completion
5. Fill additional profile info
6. Submit "Complete Profile"
7. Verify user_ipowners table entry
8. Check redirect to creator dashboard

**Expected Results:**
- Profile completion creates user_ipowners entry
- Default invitation_status: 'invited'
- Redirects to `/creators/titles`

#### 2.3 OAuth Signup - Existing OAuth User
**Test Steps:**
1. Complete OAuth signup once
2. Try OAuth signup again with same Google account
3. Verify redirect flow for existing user

### 3. PROFILE COMPLETION FLOWS

#### 3.1 OAuth Profile Completion - Valid Data
**Test Steps:**
1. Complete OAuth flow to profile completion page
2. Verify pre-filled email field
3. Fill all required fields with valid data
4. Submit form
5. Check database insertion
6. Verify success redirect

#### 3.2 OAuth Profile Completion - Missing Required Fields
**Test Steps:**
1. Reach profile completion page
2. Leave required fields empty
3. Submit form
4. Verify validation errors
5. Check no database insertion occurs

#### 3.3 OAuth Profile Completion - Session Expiry
**Test Steps:**
1. Reach profile completion page
2. Wait for session to potentially expire
3. Submit form
4. Check session handling and error messages

### 4. DATABASE OPERATIONS

#### 4.1 user_buyers Table Operations
**Test Data Verification:**
```sql
SELECT id, email, full_name, buyer_company, buyer_role, tier, linkedin_url, created_at
FROM user_buyers 
WHERE email = 'test_email@example.com';
```

**Verify:**
- All fields populated correctly
- Default tier = 'basic'
- Timestamps set
- No duplicate entries

#### 4.2 user_ipowners Table Operations  
**Test Data Verification:**
```sql
SELECT id, email, full_name, pen_name, ip_owner_role, ip_owner_company, 
       website_url, invitation_status, created_at
FROM user_ipowners 
WHERE email = 'test_email@example.com';
```

**Verify:**
- All fields populated correctly
- pen_name field used (not legacy field)
- Default invitation_status = 'invited'
- Timestamps set

#### 4.3 auth.users Table Verification
**Test Data Verification:**
```sql
SELECT id, email, email_confirmed_at, raw_user_meta_data, created_at
FROM auth.users 
WHERE email = 'test_email@example.com';
```

**Verify:**
- Metadata stored correctly
- Email confirmation status
- Account type in metadata

### 5. REDIRECT FLOWS & TIER SYSTEM

#### 5.1 Buyer Tier-Based Redirects
**Test Scenarios:**
- tier = 'basic' → `/buyers/titles`
- tier = 'pro' → `/buyers/titles`
- tier = 'suite' → `/buyers/titles`
- tier = 'invited' → `/invited`

#### 5.2 Creator Status-Based Redirects
**Test Scenarios:**
- invitation_status = 'accepted' → `/creators/titles`
- invitation_status = 'invited' → `/creator/invited`

#### 5.3 AuthCallback Page Logic
**Test Steps:**
1. Trigger auth callback with various user states
2. Verify profile lookups work correctly
3. Check redirect logic for each scenario
4. Test error handling for missing profiles

### 6. CROSS-DOMAIN & SESSION HANDLING

#### 6.1 Session Persistence
**Test Steps:**
1. Complete signup on one domain
2. Navigate to dashboard domain  
3. Verify session maintains
4. Check auth state consistency

#### 6.2 CORS & Domain Configuration
**Test Steps:**
1. Test OAuth redirects between domains
2. Verify environment variable handling
3. Check localhost vs production URLs

### 7. ERROR SCENARIOS & EDGE CASES

#### 7.1 Network Failures
**Test Steps:**
1. Simulate network errors during signup
2. Test partial form submissions
3. Verify error recovery

#### 7.2 Database Constraint Violations
**Test Steps:**
1. Test with invalid enum values
2. Test with null constraints
3. Test with duplicate unique fields

#### 7.3 Invalid Form Data
**Test Scenarios:**
- Invalid email formats
- Password too short
- Special characters in names
- Very long input values
- Script injection attempts

#### 7.4 Session Edge Cases
**Test Steps:**
1. Expired OAuth sessions
2. Corrupted session data
3. Missing user metadata
4. Invalid user IDs in URLs

### 8. PERFORMANCE & CONCURRENCY

#### 8.1 Concurrent Signups
**Test Steps:**
1. Multiple simultaneous signups
2. Race conditions in profile creation
3. Database lock handling

#### 8.2 Large Form Data
**Test Steps:**
1. Maximum length inputs
2. Unicode characters
3. Form submission timeouts

### 9. SECURITY TESTS

#### 9.1 XSS Prevention
**Test Steps:**
1. Script tags in form fields
2. HTML injection attempts
3. URL parameter manipulation

#### 9.2 CSRF Protection
**Test Steps:**
1. Cross-site request forgery attempts
2. Token validation

#### 9.3 SQL Injection
**Test Steps:**
1. SQL injection in form fields
2. Parameter manipulation

### 10. CLEANUP & VALIDATION

#### 10.1 Test Data Cleanup
**Cleanup Queries:**
```sql
-- Clean up test users
DELETE FROM user_buyers WHERE email LIKE 'test%@example.com';
DELETE FROM user_ipowners WHERE email LIKE 'test%@example.com';
DELETE FROM auth.users WHERE email LIKE 'test%@example.com';
```

#### 10.2 Data Integrity Checks
**Validation Queries:**
```sql
-- Check for orphaned records
SELECT * FROM user_buyers WHERE id NOT IN (SELECT id FROM auth.users);
SELECT * FROM user_ipowners WHERE id NOT IN (SELECT id FROM auth.users);

-- Check for missing profiles
SELECT * FROM auth.users u 
WHERE u.id NOT IN (SELECT id FROM user_buyers) 
AND u.id NOT IN (SELECT id FROM user_ipowners);
```

## Test Execution Order

1. **Environment Setup** - Start servers, verify database connection
2. **Database Baseline** - Record current state, prepare test data
3. **Email Signup Tests** - Run all email-based signup scenarios
4. **OAuth Signup Tests** - Run all OAuth-based signup scenarios  
5. **Profile Completion** - Test OAuth profile completion flows
6. **Database Validation** - Verify all database operations
7. **Redirect Testing** - Test all redirect scenarios
8. **Error Scenarios** - Test edge cases and error handling
9. **Security Testing** - Run security-focused tests
10. **Cleanup & Reporting** - Clean test data, generate report

## Success Criteria

✅ **All signup flows complete successfully**
✅ **Database entries created correctly**  
✅ **Proper tier/status assignments**
✅ **Correct redirect flows**
✅ **Error handling works properly**
✅ **No data corruption or orphaned records**
✅ **Security measures in place**
✅ **Performance within acceptable limits**

## Test Tools & Utilities

- Browser Developer Tools
- Database query tools
- Network monitoring
- Authentication testing utilities
- Automated test scripts (if needed)