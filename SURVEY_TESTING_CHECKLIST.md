# Survey Feature Testing Checklist

**Date**: 2025-10-25
**Feature**: 5-Step Title Questionnaire
**Dev Server**: http://localhost:8085
**Route**: `/titles/add-survey`

---

## Pre-Testing Setup ✅

- ✅ Dev server running on port 8085
- ✅ Build successful (no TypeScript errors)
- ✅ All 12 key files verified present
- ✅ Route configuration added to App.tsx

---

## Testing Instructions

### Step 1: Access the Survey

1. **Navigate to**: http://localhost:8085/titles/add-survey
2. **Expected**:
   - If not logged in → Redirected to `/signin`
   - If logged in → Survey page loads with Step 1

**Checklist**:
- [ ] Survey page loads without errors
- [ ] Progress bar shows "Step 1 of 5"
- [ ] Auto-save indicator visible (top right)
- [ ] "Add New Title" header displayed
- [ ] Form fields render correctly

---

### Step 2: Test Step 1 (Basic Info)

**Fields to Test**:
- [ ] "Is this an official English title?" checkbox works
- [ ] Radio group for title type (official/translation) works
- [ ] Korean title inputs accept text
- [ ] English title inputs accept text
- [ ] Rights holder name/company inputs work
- [ ] Platform section allows adding/removing platforms
- [ ] Platform dropdown shows 12 options (Naver, Kakao, etc.)
- [ ] Platform URL accepts text
- [ ] Views/Subscribers accept numbers with formatting
- [ ] "Next" button enabled
- [ ] "Previous" button disabled (Step 1)

**Test Cases**:
1. Add a platform → Click "Add Platform" → Fill fields → Verify added
2. Remove a platform → Click X → Verify removed
3. Click "Next" → Should move to Step 2 (no validation errors)

---

### Step 3: Test Step 2 (Story Details) - REQUIRED FIELDS

**Fields to Test**:
- [ ] Inspiration textarea accepts text
- [ ] Comparable titles: Add/remove works
- [ ] Important issues textarea accepts text
- [ ] **Setting description (REQUIRED)** - Red asterisk shown
- [ ] World lore textarea accepts text
- [ ] Supernatural concepts textarea accepts text
- [ ] **Character details (REQUIRED)** - Red asterisk shown
- [ ] Character: Add/remove works
- [ ] Character demographics dropdowns work
- [ ] Character background/traits/arc textareas work

**Test Cases**:
1. **Validation Test**: Click "Next" without filling required fields
   - [ ] Error shown: "Setting description is required (minimum 10 characters)"
   - [ ] Error shown: "At least one character is required"
   - [ ] Cannot proceed to Step 3

2. **Fill Required Fields**:
   - [ ] Add setting description (>10 chars)
   - [ ] Add at least 1 character with name
   - [ ] Click "Next" → Should move to Step 3

---

### Step 4: Test Step 3 (Narrative) - CONDITIONAL VALIDATION

**Fields to Test**:
- [ ] **Story structure (REQUIRED)** - Red asterisk shown
- [ ] Completed checkbox works
- [ ] **Planned ending (REQUIRED if not completed)** - Conditional asterisk
- [ ] Narrative arc textarea accepts text
- [ ] Character counter shows for story structure (min 100 chars)

**Test Cases**:
1. **Validation Test - Ongoing Title**:
   - [ ] Leave "Completed" unchecked
   - [ ] Click "Next" without story structure
   - [ ] Error: "Story structure is required (minimum 100 characters)"
   - [ ] Add story structure (>100 chars)
   - [ ] Click "Next" without planned ending
   - [ ] Error: "Planned ending is required for ongoing titles (minimum 50 characters)"
   - [ ] Add planned ending (>50 chars)
   - [ ] Click "Next" → Should move to Step 4

2. **Validation Test - Completed Title**:
   - [ ] Check "Completed"
   - [ ] Add story structure (>100 chars)
   - [ ] Planned ending NOT required
   - [ ] Click "Next" → Should move to Step 4

---

### Step 5: Test Step 4 (Materials) - Optional

**Fields to Test**:
- [ ] File upload drag-drop zone visible
- [ ] Document type dropdown shows 6 types
- [ ] File upload button works
- [ ] "Shareable with NDA" checkbox works
- [ ] External link section: Add/remove works
- [ ] Link URL validates format
- [ ] Link type dropdown works
- [ ] Link shareable checkbox works

**Test Cases**:
1. **File Upload** (if Supabase Storage configured):
   - [ ] Drag file → Verify upload progress
   - [ ] Upload completes → File shown in list
   - [ ] File size validation (>10MB should fail)
   - [ ] MIME type validation (only PDF/Word/Excel/TXT)

2. **External Links**:
   - [ ] Click "Add External Link"
   - [ ] Enter invalid URL → Validation error
   - [ ] Enter valid URL → Saves successfully
   - [ ] Remove link → Deleted from list

3. **Skip Section**:
   - [ ] Click "Next" without uploading anything
   - [ ] Should move to Step 5 (no validation errors)

---

### Step 6: Test Step 5 (Profile) - Optional

**Fields to Test**:
- [ ] Awards: Add/remove works
- [ ] Sales records textarea accepts text
- [ ] Merchandise deals textarea accepts text
- [ ] Print editions checkbox works
- [ ] Print edition details (conditional) appears when checked
- [ ] Media coverage textarea accepts text
- [ ] Celebrity endorsements textarea accepts text
- [ ] Creator profile: Total titles (number input)
- [ ] Creator profile: Total views (text input)
- [ ] Notable works: Add/remove works
- [ ] Creator awards: Add/remove works
- [ ] Industry recognition textarea accepts text

**Test Cases**:
1. **Add Achievements**:
   - [ ] Add awards → Verify added to list
   - [ ] Add notable works → Verify added
   - [ ] Add creator awards → Verify added
   - [ ] All dynamic arrays working

2. **Submit Button**:
   - [ ] "Submit Title" button visible (not "Next")
   - [ ] Button enabled (no more validation)

---

### Step 7: Test Auto-Save Functionality

**Test Cases**:
1. **Automatic Save**:
   - [ ] Fill form in Step 1
   - [ ] Wait 30 seconds
   - [ ] Auto-save indicator shows "Saving..."
   - [ ] After save: Shows "Saved" with green checkmark
   - [ ] Timestamp updates ("Last saved X min ago")

2. **Manual Save**:
   - [ ] Click "Save Draft Now" button
   - [ ] Auto-save triggers immediately
   - [ ] Status indicator updates

3. **Draft Resume**:
   - [ ] Fill form partially (e.g., Steps 1-2)
   - [ ] Wait for auto-save
   - [ ] Refresh page (F5)
   - [ ] Should reload at Step 2 with data restored
   - [ ] All form values preserved

4. **Draft Cleanup**:
   - [ ] Complete survey and submit
   - [ ] Draft should be deleted from database
   - [ ] Verify in title_drafts table (should be empty for that user)

---

### Step 8: Test Navigation

**Test Cases**:
1. **Sequential Navigation**:
   - [ ] Step 1 → Click "Next" → Goes to Step 2
   - [ ] Step 2 → Click "Next" → Goes to Step 3 (if valid)
   - [ ] Step 3 → Click "Previous" → Goes to Step 2
   - [ ] Step 5 → Click "Previous" → Goes to Step 4

2. **Direct Navigation** (Progress Bar Clicks):
   - [ ] Click "Step 2" circle → Goes to Step 2 (if valid)
   - [ ] Click "Step 1" circle → Goes to Step 1 (always works)
   - [ ] Cannot jump ahead if current step invalid

3. **Scroll Behavior**:
   - [ ] After navigation → Page scrolls to top

---

### Step 9: Test Form Submission

**Prerequisites**:
- Fill all required fields:
  - Step 2: Setting description + 1 character
  - Step 3: Story structure + planned ending (if ongoing)

**Test Cases**:
1. **Validate Before Submit**:
   - [ ] Missing required fields → Alert shown
   - [ ] Cannot submit with errors

2. **Successful Submission**:
   - [ ] Click "Submit Title"
   - [ ] Loading indicator shown ("Submitting...")
   - [ ] Success alert shown
   - [ ] Redirected to `/titles`
   - [ ] New title appears in list
   - [ ] Draft deleted from title_drafts

3. **Database Verification**:
   - [ ] Check `titles` table → New record with questionnaire fields
   - [ ] Check `title_platforms` table → Platform records created
   - [ ] Check `title_documents` table → Document records created (if uploaded)
   - [ ] Check `title_drafts` table → Draft deleted

---

### Step 10: Test Error Handling

**Test Cases**:
1. **Network Errors**:
   - [ ] Disconnect internet
   - [ ] Try to save draft → Error indicator shown
   - [ ] Try to submit → Error alert shown

2. **Validation Errors**:
   - [ ] Character name empty → Error shown
   - [ ] Story structure <100 chars → Error shown
   - [ ] Invalid URL format → Error shown

3. **File Upload Errors**:
   - [ ] File >10MB → Error message shown
   - [ ] Invalid file type (.exe, .zip) → Error message shown

---

### Step 11: Test Responsive Design

**Test Cases**:
1. **Mobile (< 768px)**:
   - [ ] Progress bar shows as horizontal bar (not circles)
   - [ ] Form fields stack vertically
   - [ ] Buttons full width
   - [ ] Touch targets large enough

2. **Tablet (768px - 1024px)**:
   - [ ] Progress bar shows step circles
   - [ ] Grid layouts work (2 columns where appropriate)

3. **Desktop (> 1024px)**:
   - [ ] Max width container (4xl)
   - [ ] Comfortable spacing
   - [ ] Progress circles with labels

---

## Known Issues / Limitations

1. **File Upload**: Currently returns mock URL (needs Supabase Storage finalization)
2. **Title Name**: Uses placeholder "New Title" (needs parent form integration)
3. **Title Image**: Not captured yet (needs image upload component)

---

## Database Testing

### Check Migrations Applied

```sql
-- Verify new tables exist
SELECT tablename FROM pg_tables
WHERE tablename IN ('title_platforms', 'title_documents', 'title_drafts');

-- Verify new columns added to titles
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'titles'
AND column_name IN ('is_official_english_title', 'character_details', 'story_structure');
```

### Check Data After Submission

```sql
-- Check title created with questionnaire data
SELECT title_id, title_name_en, is_official_english_title,
       character_details, story_structure
FROM titles
WHERE creator_id = '<YOUR_USER_ID>'
ORDER BY created_at DESC LIMIT 1;

-- Check platforms created
SELECT * FROM title_platforms
WHERE title_id = '<TITLE_ID>';

-- Check documents created
SELECT * FROM title_documents
WHERE title_id = '<TITLE_ID>';

-- Check draft deleted
SELECT * FROM title_drafts
WHERE creator_id = '<YOUR_USER_ID>';
```

---

## Performance Testing

**Metrics to Track**:
- [ ] Initial page load: < 2 seconds
- [ ] Step navigation: < 500ms
- [ ] Auto-save latency: < 1 second
- [ ] Form submission: < 3 seconds
- [ ] Draft resume: < 1 second

**Tools**:
- Browser DevTools → Network tab
- Browser DevTools → Performance tab
- Lighthouse audit

---

## Browser Compatibility

Test on:
- [ ] Chrome (latest) - Desktop
- [ ] Chrome (latest) - Mobile
- [ ] Safari (latest) - Desktop
- [ ] Safari (latest) - iOS
- [ ] Firefox (latest) - Desktop
- [ ] Edge (latest) - Desktop

---

## Accessibility Testing

**Checklist**:
- [ ] All form fields have labels
- [ ] Required fields have asterisks
- [ ] Error messages are clear and visible
- [ ] Keyboard navigation works (Tab/Shift+Tab)
- [ ] Focus states visible
- [ ] Screen reader friendly (test with VoiceOver/NVDA)
- [ ] Color contrast meets WCAG AA standards

---

## Regression Testing (Dashboard)

**CRITICAL**: Verify dashboard still works after migrations

**Test**:
- [ ] Dashboard loads: `/buyers/home`
- [ ] AI Chatbot works: `/chat`
- [ ] Titles list loads: `/buyers/titles`
- [ ] Title detail loads: `/buyers/titles/:id`
- [ ] No errors in console
- [ ] No database errors in logs

---

## Sign-Off

**Tester Name**: _________________
**Date**: _________________
**Environment**: [ ] Local [ ] Staging [ ] Production
**Overall Status**: [ ] Pass [ ] Fail [ ] Pass with Issues

**Notes**:
___________________________________________________________________
___________________________________________________________________
___________________________________________________________________

---

## Next Steps After Testing

1. **If All Tests Pass**:
   - Deploy to staging environment
   - Run full regression tests
   - Get stakeholder approval
   - Deploy to production

2. **If Issues Found**:
   - Document issues in detail
   - Create bug tickets
   - Fix critical issues
   - Re-test
   - Repeat until all pass

---

**Testing Documentation Created**: 2025-10-25
**Survey Feature Version**: 1.0
**Ready for**: Local Testing → Staging → Production
