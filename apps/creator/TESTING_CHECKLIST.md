# Creator V2 - Testing Checklist

**Status**: 🚧 In Progress
**Started**: 2025-10-24
**Environment**: Local Development (http://localhost:8083)

---

## 🎯 Testing Scope

### Phase 5.1: Local Manual Testing
Complete functional testing of all Creator V2 features before deployment.

**Success Criteria:**
- All auth flows complete successfully
- All CRUD operations work correctly
- No console errors or warnings
- Responsive design works on mobile/tablet/desktop
- Error messages are user-friendly

---

## ✅ Testing Checklist

### 1. Authentication Flows

#### 1.1 Email Signup
- [ ] Navigate to http://localhost:8083/signup
- [ ] Fill out signup form:
  - [ ] Email (valid format required)
  - [ ] Password (6+ characters)
  - [ ] Full name
  - [ ] Pen name
  - [ ] IP Owner Role (author/agent)
- [ ] Submit form
- [ ] **Expected**: Redirect to /home with authenticated session
- [ ] **Expected**: User profile created in user_creators table
- [ ] **Expected**: user_metadata.account_type = 'creator'
- [ ] **Status**: ⏳ Pending

**Test Data:**
```
Email: test-creator-1@example.com
Password: test123
Full Name: Test Creator One
Pen Name: TC1
Role: Author
```

#### 1.2 Email Signin
- [ ] Sign out from current session
- [ ] Navigate to http://localhost:8083/signin
- [ ] Enter credentials from 1.1
- [ ] **Expected**: Redirect to /home
- [ ] **Expected**: Session persists across page reloads
- [ ] **Status**: ⏳ Pending

#### 1.3 OAuth Signup (Google)
- [ ] Navigate to http://localhost:8083/signup
- [ ] Click "Sign up with Google"
- [ ] **Expected**: Google OAuth consent screen
- [ ] Select Google account
- [ ] **Expected**: Redirect to /auth/callback
- [ ] **Expected**: Exchange code for session (no hanging!)
- [ ] **Expected**: Redirect to /complete-profile (if new user)
- [ ] Fill out profile completion form:
  - [ ] Full name
  - [ ] Pen name
  - [ ] IP Owner Role
- [ ] Submit
- [ ] **Expected**: Redirect to /home
- [ ] **Expected**: user_metadata.account_type = 'creator'
- [ ] **Status**: ⏳ Pending

**Notes:**
- OAuth callback URL must be registered in Google Console
- Development: http://localhost:8083/auth/callback

#### 1.4 OAuth Signin (Google)
- [ ] Sign out
- [ ] Navigate to http://localhost:8083/signin
- [ ] Click "Sign in with Google"
- [ ] Select same Google account from 1.3
- [ ] **Expected**: Redirect to /auth/callback
- [ ] **Expected**: Redirect to /home (skip profile completion)
- [ ] **Expected**: Session restored correctly
- [ ] **Status**: ⏳ Pending

#### 1.5 Session Persistence
- [ ] Sign in successfully
- [ ] Reload page (Ctrl+R / Cmd+R)
- [ ] **Expected**: User remains signed in
- [ ] **Expected**: No redirect to /signin
- [ ] Close browser tab
- [ ] Open new tab to http://localhost:8083
- [ ] **Expected**: User remains signed in
- [ ] **Status**: ⏳ Pending

#### 1.6 Sign Out
- [ ] While signed in, navigate to /profile
- [ ] Click "Sign Out" button
- [ ] **Expected**: Redirect to /signin
- [ ] **Expected**: Session cleared
- [ ] Try to access /home directly
- [ ] **Expected**: Redirect to /signin
- [ ] **Status**: ⏳ Pending

---

### 2. Title Management

#### 2.1 View Title List (Empty State)
- [ ] Sign in as creator with no titles
- [ ] Navigate to /titles
- [ ] **Expected**: "No titles yet" message
- [ ] **Expected**: "Add New Title" button visible
- [ ] **Status**: ⏳ Pending

#### 2.2 Add New Title
- [ ] Click "Add New Title" button (or navigate to /titles/add)
- [ ] Fill out ALL form fields:
  - **Basic Information:**
    - [ ] English Title (required)
    - [ ] Korean Title (required)
    - [ ] Title URL (required)
    - [ ] Cover Image URL (required)
  - **Content Classification:**
    - [ ] Genre (required dropdown)
    - [ ] Content Format (dropdown)
    - [ ] Tags (comma-separated)
    - [ ] Keywords (comma-separated)
    - [ ] Tone
  - **Credits:**
    - [ ] Story Author (required)
    - [ ] Art Author
    - [ ] Author (general)
    - [ ] Writer
    - [ ] Illustrator
  - **Content Details:**
    - [ ] Number of Chapters
    - [ ] Series Completed (checkbox)
    - [ ] Tagline
    - [ ] Synopsis (textarea)
    - [ ] Description (textarea)
    - [ ] Notes (textarea)
  - **Rights & Business:**
    - [ ] Rights Owner
    - [ ] Rights Available
    - [ ] Perfect For
    - [ ] Target Audience
    - [ ] Comparable Titles (comps)
- [ ] Submit form
- [ ] **Expected**: Redirect to title detail page (/titles/:id)
- [ ] **Expected**: Title appears in database
- [ ] **Expected**: creator_id = current user's id
- [ ] **Status**: ⏳ Pending

**Test Data:**
```
English Title: Test Webtoon One
Korean Title: 테스트 웹툰 하나
Title URL: https://example.com/test-webtoon-1
Cover Image: https://picsum.photos/400/600
Story Author: Test Author
Genre: Fantasy
Content Format: Webtoon
Tags: magic, adventure, comedy
Synopsis: A test webtoon about testing features.
```

#### 2.3 View Title List (With Titles)
- [ ] Navigate to /titles
- [ ] **Expected**: Grid of title cards
- [ ] **Expected**: Cover image displayed (or placeholder)
- [ ] **Expected**: Title name, author, genre visible
- [ ] **Expected**: View count and chapter count visible
- [ ] **Expected**: Click on card navigates to detail page
- [ ] **Status**: ⏳ Pending

#### 2.4 View Title Detail
- [ ] Click on a title from the list
- [ ] **Expected**: Navigate to /titles/:id
- [ ] **Expected**: All title information displayed:
  - [ ] Cover image (large)
  - [ ] Title names (EN + KR)
  - [ ] Authors (story + art)
  - [ ] Stats (views, chapters, status)
  - [ ] Genre, format, tone
  - [ ] Synopsis, tagline
  - [ ] Business information (rights, audience, comps)
  - [ ] Keywords/tags as badges
  - [ ] Notes section (if present)
- [ ] **Expected**: "Edit" button visible
- [ ] **Expected**: "View Original" link opens in new tab
- [ ] **Status**: ⏳ Pending

#### 2.5 Edit Title
- [ ] On title detail page, click "Edit" button
- [ ] **Expected**: Navigate to /titles/:id/edit
- [ ] **Expected**: Form pre-populated with existing data
- [ ] Modify some fields:
  - [ ] Update synopsis
  - [ ] Add tags
  - [ ] Change chapters count
  - [ ] Toggle "Series Completed"
- [ ] Click "Save Changes"
- [ ] **Expected**: Redirect to title detail page
- [ ] **Expected**: Changes reflected immediately
- [ ] **Expected**: Database updated
- [ ] **Status**: ⏳ Pending

#### 2.6 Edit Title - Permission Check
- [ ] Try to edit a title created by another creator
  - (Create title with creator_id = different user ID)
- [ ] Navigate to /titles/:id/edit
- [ ] **Expected**: "You do not have permission to edit this title" error
- [ ] **Expected**: Cannot modify the title
- [ ] **Status**: ⏳ Pending

#### 2.7 Delete Title (Service Only)
- [ ] Open browser console
- [ ] Import titlesService
- [ ] Call `titlesService.deleteTitle(titleId)`
- [ ] **Expected**: Title deleted from database
- [ ] **Expected**: Refresh /titles page, title no longer appears
- [ ] **Status**: ⏳ Pending

**Note**: Delete UI button not yet implemented - testing service layer only.

---

### 3. Profile Management

#### 3.1 View Profile
- [ ] Navigate to /profile
- [ ] **Expected**: Display all creator information:
  - [ ] Full name
  - [ ] Email address
  - [ ] Account type ("Content Creator")
  - [ ] Pen name
  - [ ] Company
  - [ ] Role (Author/Agent)
  - [ ] Website URL (clickable link)
  - [ ] Member since date
- [ ] **Status**: ⏳ Pending

#### 3.2 Edit Profile
- [ ] On profile page, click "Edit Profile"
- [ ] **Expected**: Form fields become editable
- [ ] Modify fields:
  - [ ] Pen name
  - [ ] Company
  - [ ] Role (dropdown)
  - [ ] Website URL
- [ ] Click "Save Changes"
- [ ] **Expected**: "Saving..." button text
- [ ] **Expected**: Profile updated in database
- [ ] **Expected**: Form exits edit mode
- [ ] **Expected**: Changes displayed immediately
- [ ] **Status**: ⏳ Pending

#### 3.3 Cancel Edit
- [ ] Click "Edit Profile"
- [ ] Modify some fields
- [ ] Click "Cancel"
- [ ] **Expected**: Form exits edit mode
- [ ] **Expected**: Changes discarded
- [ ] **Expected**: Original values restored
- [ ] **Status**: ⏳ Pending

---

### 4. Protected Routes

#### 4.1 Unauthenticated Access
- [ ] Sign out completely
- [ ] Try to access protected routes directly:
  - [ ] /home
  - [ ] /titles
  - [ ] /titles/add
  - [ ] /profile
- [ ] **Expected**: All redirect to /signin
- [ ] **Expected**: After signin, redirect to originally requested page
- [ ] **Status**: ⏳ Pending

#### 4.2 Root Redirect
- [ ] Sign out
- [ ] Navigate to http://localhost:8083/
- [ ] **Expected**: Redirect to /signin
- [ ] Sign in
- [ ] Navigate to http://localhost:8083/
- [ ] **Expected**: Redirect to /home
- [ ] **Status**: ⏳ Pending

---

### 5. Navigation & UI

#### 5.1 Sidebar Navigation
- [ ] Sign in successfully
- [ ] **Expected**: CMSSidebar visible on left (desktop)
- [ ] Click each menu item:
  - [ ] Home → /home
  - [ ] Titles → /titles
  - [ ] Profile → /profile
  - [ ] Requests → /requests
  - [ ] News → /news
- [ ] **Expected**: Active route highlighted
- [ ] **Expected**: Smooth navigation
- [ ] **Status**: ⏳ Pending

#### 5.2 Mobile Responsiveness
- [ ] Open Chrome DevTools
- [ ] Toggle device toolbar (mobile view)
- [ ] Test on different screen sizes:
  - [ ] Mobile (375px)
  - [ ] Tablet (768px)
  - [ ] Desktop (1024px)
- [ ] **Expected**: Sidebar collapses on mobile
- [ ] **Expected**: All forms remain usable
- [ ] **Expected**: Title cards stack properly
- [ ] **Expected**: No horizontal scrolling
- [ ] **Status**: ⏳ Pending

#### 5.3 Error Messages
- [ ] Test invalid form submissions:
  - [ ] Signup with invalid email format
  - [ ] Signup with short password (<6 chars)
  - [ ] Add title with missing required fields
  - [ ] Add title with invalid URL
- [ ] **Expected**: User-friendly error messages
- [ ] **Expected**: Field-specific validation messages
- [ ] **Expected**: No console errors
- [ ] **Status**: ⏳ Pending

---

### 6. Console Checks

#### 6.1 Browser Console
- [ ] Open browser console (F12)
- [ ] Navigate through all pages
- [ ] **Expected**: No errors (red messages)
- [ ] **Expected**: No critical warnings
- [ ] **Expected**: Auth logs show single listener
- [ ] **Status**: ⏳ Pending

#### 6.2 Network Tab
- [ ] Open Network tab
- [ ] Perform actions (signup, create title, etc.)
- [ ] **Expected**: All API calls succeed (200/201 status)
- [ ] **Expected**: No CORS errors
- [ ] **Expected**: No 401 unauthorized errors
- [ ] **Expected**: No 500 server errors
- [ ] **Status**: ⏳ Pending

---

## 📊 Test Results Summary

| Category | Total Tests | Passed | Failed | Pending |
|----------|-------------|--------|--------|---------|
| Authentication | 6 | 0 | 0 | 6 |
| Title Management | 7 | 0 | 0 | 7 |
| Profile Management | 3 | 0 | 0 | 3 |
| Protected Routes | 2 | 0 | 0 | 2 |
| Navigation & UI | 3 | 0 | 0 | 3 |
| Console Checks | 2 | 0 | 0 | 2 |
| **TOTAL** | **23** | **0** | **0** | **23** |

---

## 🐛 Issues Found

### Critical Issues
*None yet*

### Non-Critical Issues
*None yet*

### Enhancements
*None yet*

---

## 📝 Test Environment

### Browser
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)

### Device
- [ ] Desktop (macOS)
- [ ] Tablet (iPad)
- [ ] Mobile (iPhone)

### Database
- **Supabase Project**: dlrnrgcoguxlkkcitlpd
- **Environment**: Development
- **Test Users**: Will be created during testing

---

## ✅ Sign-Off

- [ ] All tests passed
- [ ] No critical issues
- [ ] Ready for deployment

**Tested By**: _________________
**Date**: _________________
**Sign-Off**: _________________

---

**Next Steps After Testing:**
1. Document any bugs/issues found
2. Fix critical issues
3. Proceed to Phase 5.2: Deployment Setup
