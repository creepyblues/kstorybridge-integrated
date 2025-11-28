# Auth Callback Debug Tracking

## Issue
User `hyobinsungho@gmail.com` exists in database as creator but auth callback shows "No creator profile found."

## Database Verification
✅ Profile exists in `user_creators` table:
- ID: `404fac2f-9b6a-4fdf-90b0-e6b611c4aec1`
- Email: `hyobinsungho@gmail.com`

## Debug Logging Added

### 1. Session Payload Logging
```
🔎 SIMPLE CALLBACK: Session payload:
- userId, email, originalEmail, normalizedEmail
- metadataAccountType, appMetadata, userMetadata
```

### 2. Account Type Resolution Logging
```
🔍 SIMPLE CALLBACK: Account type resolution starting:
- urlParams, userMetadataType, userMetadataTypeType
- URL param account_type
- Session storage account_type
- User metadata account_type
```

### 3. Flow Routing Logging
```
🚦 SIMPLE CALLBACK: Flow routing decision:
- isSignin, isSignup, accountType
- willEnterSigninFlow, willEnterSignupFlow, willEnterFallback
```

### 4. Branch Entry Logging
```
🚨 SIMPLE CALLBACK: ENTERING [BRANCH NAME] BRANCH
```

### 5. Profile Check Logging
```
🔍 SIMPLE CALLBACK: DETAILED PROFILE CHECK STARTING:
- tableName, accountType, userId
- originalEmail, normalizedEmail, emailType
```

## Key Questions to Answer

1. **What account_type is resolved?** (should be 'creator')
2. **Which flow branch is entered?** (should be signin flow or fallback)
3. **What email normalization happens?** (should be lowercase)
4. **Which database table is queried?** (should be user_creators)
5. **What are the exact query parameters?** (id vs email lookup)

## Expected Fix Areas

- Account type not being detected from user metadata
- Email case sensitivity in database queries
- Flow routing logic not entering correct branch
- Profile lookup using wrong parameters

## Next Steps

1. Run auth callback with new logging
2. Identify which branch is actually taken
3. Fix the specific issue found
4. Remove debug logging after fix