# Manual Testing Guide: "New Chat" Button Enhancement

**Feature**: Enhanced "New Chat" button with session isolation
**Files Modified**:
- `/apps/dashboard/src/pages/Chat.tsx` (lines 1661-1681)
- `/apps/dashboard/src/__tests__/Chat.NewChatButton.test.tsx` (new test file)

**Date**: 2025-10-23
**Tester**: _________________

---

## Pre-Test Checklist

- [ ] Dashboard app running on http://localhost:8081
- [ ] Logged in as buyer account
- [ ] Browser DevTools Console open (to monitor session logs)
- [ ] Clear browser cache/cookies for fresh start

---

## Test 1: Basic "New Chat" Functionality

**Objective**: Verify "New Chat" clears conversation and UI state

### Steps:
1. Navigate to `/buyers/chat`
2. Send 3-4 messages to the chatbot:
   - "Tell me about romantic stories"
   - "What about fantasy?"
   - "Show me action titles"
3. Observe messages displayed in UI
4. Click **"New Chat"** button (top right)

### Expected Results:
- ✅ All messages disappear from screen
- ✅ Input field is cleared
- ✅ Empty state UI appears (search prompts visible)
- ✅ No error messages in console

### Actual Results:
- [ ] PASS / [ ] FAIL

**Notes**: _______________________________________________

---

## Test 2: Session Isolation

**Objective**: Verify new session is created after "New Chat"

### Steps:
1. Complete Test 1 (conversation exists)
2. Open Browser DevTools → Console
3. Click **"New Chat"** button
4. Look for console log: `🔄 handleSendMessage called:`
5. Send a new message: "Tell me about thriller stories"
6. Monitor console for session creation logs

### Expected Results:
- ✅ Console shows new session being created (`ensureSession` called)
- ✅ AI response does NOT reference previous conversation
- ✅ Response is fresh, no context from old messages

### How to verify session isolation:
```
Example - OLD BEHAVIOR (BAD):
User: "Tell me about thriller stories"
AI: "In addition to the romantic and fantasy titles I mentioned earlier, here are some thrillers..."
      ↑ This should NOT happen after "New Chat"

Example - NEW BEHAVIOR (GOOD):
User: "Tell me about thriller stories"
AI: "Here are some thriller titles for you..."
     ↑ No reference to previous conversation
```

### Actual Results:
- [ ] PASS / [ ] FAIL

**Console logs observed**: _______________________________________________

---

## Test 3: Database Session Verification

**Objective**: Verify database shows separate sessions

### Steps:
1. Note the current timestamp
2. Send 2 messages in first conversation
3. Click **"New Chat"**
4. Send 2 messages in second conversation
5. Check Supabase database:
   - Open: https://app.supabase.com/project/dlrnrgcoguxlkkcitlpd
   - Navigate to: Table Editor → `chat_sessions`
   - Filter by your user email

### Expected Results:
- ✅ Two separate session records exist
- ✅ Each session has different `id`
- ✅ Session 1 has messages from first conversation
- ✅ Session 2 has messages from second conversation
- ✅ Sessions are NOT linked

### Actual Results:
- [ ] PASS / [ ] FAIL

**Session IDs observed**:
- Session 1: _______________________________________________
- Session 2: _______________________________________________

---

## Test 4: History Loading Isolation

**Objective**: Verify "Load history" doesn't pull old messages

### Steps:
1. Send 10+ messages in first conversation
2. Click **"New Chat"**
3. Send 1 new message
4. Scroll up and click **"Load N older messages"** button

### Expected Results:
- ✅ "Load history" button either:
  - Shows "No history found" message, OR
  - Only loads messages from current (new) session
- ✅ Old conversation messages do NOT appear

### Actual Results:
- [ ] PASS / [ ] FAIL

**Notes**: _______________________________________________

---

## Test 5: Edge Case - Streaming Interruption

**Objective**: Verify "New Chat" clears streaming state

### Steps:
1. Send a complex query that takes 3-5 seconds to stream:
   - "Tell me about all the romantic fantasy stories with strong female leads"
2. **While AI is still typing/streaming**, click **"New Chat"**
3. Observe UI behavior

### Expected Results:
- ✅ Streaming stops immediately
- ✅ Messages clear from screen
- ✅ No partial streaming response remains visible
- ✅ Input field is re-enabled and empty
- ✅ No console errors

### Actual Results:
- [ ] PASS / [ ] FAIL

**Notes**: _______________________________________________

---

## Test 6: Edge Case - Rapid Multiple Clicks

**Objective**: Verify "New Chat" handles rapid clicks gracefully

### Steps:
1. Send 3 messages
2. Click **"New Chat"** button 5 times rapidly (as fast as possible)
3. Observe UI and console

### Expected Results:
- ✅ UI remains stable (no flickering)
- ✅ Messages cleared properly
- ✅ No console errors
- ✅ No duplicate session creation attempts

### Actual Results:
- [ ] PASS / [ ] FAIL

**Notes**: _______________________________________________

---

## Test 7: Edge Case - Empty State Click

**Objective**: Verify "New Chat" works on empty state

### Steps:
1. Navigate to `/buyers/chat` (fresh page load)
2. Immediately click **"New Chat"** (before sending any messages)
3. Observe behavior

### Expected Results:
- ✅ No errors thrown
- ✅ UI remains in empty state
- ✅ Still able to send messages normally

### Actual Results:
- [ ] PASS / [ ] FAIL

**Notes**: _______________________________________________

---

## Test 8: Preserved State (Performance)

**Objective**: Verify title cache is preserved for performance

### Steps:
1. Send query: "Show me fantasy titles"
2. Observe title cards with images loading
3. Click **"New Chat"**
4. Send query: "Show me fantasy titles" (same query)
5. Observe title card image loading speed

### Expected Results:
- ✅ Images load faster on second query (cached)
- ✅ No re-fetch of title metadata
- ✅ Same titles displayed consistently

### Actual Results:
- [ ] PASS / [ ] FAIL

**Loading time comparison**:
- First query: ______ seconds
- Second query: ______ seconds

---

## Test 9: Feedback Integration

**Objective**: Verify feedback features work after "New Chat"

### Steps:
1. Send message: "Tell me about romantic stories"
2. Wait for AI response with title cards
3. Click **"New Chat"**
4. Send new message: "Show me action titles"
5. Try clicking title cards
6. Try clicking suggested queries (if present)

### Expected Results:
- ✅ Title cards are clickable
- ✅ Title detail pages open in new tab
- ✅ Suggested queries work and execute
- ✅ Feedback buttons (thumbs up/down) work if present

### Actual Results:
- [ ] PASS / [ ] FAIL

**Notes**: _______________________________________________

---

## Test 10: Premium Popup Reset

**Objective**: Verify premium popup doesn't carry over

### Steps:
1. (If basic tier user) Try to trigger premium popup somehow
2. If popup appears, leave it open
3. Click **"New Chat"**
4. Observe popup state

### Expected Results:
- ✅ Premium popup closes when "New Chat" is clicked
- ✅ No popup state carries over to new conversation

### Actual Results:
- [ ] PASS / [ ] FAIL / [ ] N/A (couldn't trigger popup)

**Notes**: _______________________________________________

---

## Regression Tests

### Regression 1: User Logout/Login Still Works
**Steps**:
1. Click "New Chat" button
2. Logout from dashboard
3. Login again
4. Navigate to `/buyers/chat`

**Expected**: ✅ Chat loads normally, no errors

**Actual**: [ ] PASS / [ ] FAIL

---

### Regression 2: Navigation Still Works
**Steps**:
1. Send messages in chat
2. Click "New Chat"
3. Navigate to `/buyers/titles`
4. Navigate back to `/buyers/chat`

**Expected**: ✅ Chat loads in empty state (not old conversation)

**Actual**: [ ] PASS / [ ] FAIL

---

### Regression 3: Auth Callback Still Works
**Steps**:
1. Logout
2. Login via OAuth (Google/Microsoft if configured)
3. Verify redirect to dashboard
4. Navigate to chat

**Expected**: ✅ Chat loads normally for authenticated user

**Actual**: [ ] PASS / [ ] FAIL

---

## Console Monitoring Checklist

### During testing, watch for these console logs:

**Expected logs (GOOD)**:
- ✅ `🔄 handleSendMessage called:` (when sending message)
- ✅ `🎯 Using Standard Mode (OpenAI GPT-4...)` (orchestrator used)
- ✅ `✅ Search complete:` (vector search completed)
- ✅ `📋 Conversation history prepared:` (context built)

**Unexpected errors (BAD)**:
- ❌ `Failed to initialize chat session`
- ❌ `No active session` (should auto-create)
- ❌ `TypeError: Cannot read property...` (null safety issue)
- ❌ Any React warnings about setState on unmounted component

---

## Performance Checklist

### Monitor these metrics during testing:

1. **Response Time**:
   - First message (new session): ______ seconds
   - Subsequent messages: ______ seconds
   - After "New Chat": ______ seconds

2. **Memory Usage** (Chrome DevTools → Performance Monitor):
   - Before "New Chat": ______ MB
   - After "New Chat": ______ MB
   - Memory leak observed? [ ] YES / [ ] NO

3. **Network Requests** (DevTools → Network tab):
   - Session creation API called: [ ] YES / [ ] NO
   - Duplicate requests after "New Chat": [ ] YES / [ ] NO

---

## Bug Reporting Template

If any test fails, report using this format:

```
BUG: [Brief Description]

Test Failed: [Test Number and Name]

Steps to Reproduce:
1.
2.
3.

Expected Result:
[What should happen]

Actual Result:
[What actually happened]

Console Errors:
[Paste any console errors]

Screenshots:
[Attach screenshots if applicable]

Browser: [Chrome/Firefox/Safari] Version: _______
Environment: [localhost/staging/production]
User: [email used for testing]
```

---

## Sign-Off

**Date Tested**: _______________
**Tester Name**: _______________
**Overall Result**: [ ] ALL TESTS PASSED / [ ] SOME TESTS FAILED

**Summary of Failures** (if any):
_______________________________________________
_______________________________________________
_______________________________________________

**Approval for Production**: [ ] YES / [ ] NO / [ ] WITH FIXES

**Signature**: _______________

---

## Automated Test Verification

Before manual testing, verify automated tests pass:

```bash
cd /Users/sungholee/code/kstorybridge/apps/dashboard
npm test -- Chat.NewChatButton.test.tsx
```

**Expected**: ✅ 23 tests passed
**Actual**: [ ] PASS / [ ] FAIL

---

## Next Steps After Testing

1. [ ] All manual tests passed
2. [ ] All automated tests passed
3. [ ] No console errors observed
4. [ ] Performance acceptable
5. [ ] Ready for staging deployment
6. [ ] Ready for production deployment

**Staging URL**: https://dashboard-staging-*.vercel.app
**Production URL**: https://dashboard.kstorybridge.com
