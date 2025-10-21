# Slack Notification Integration Guide

This document provides comprehensive instructions for implementing Slack notifications for signup failures and other critical events in the KStoryBridge application.

## Overview

The Slack notification system sends real-time alerts to a Slack channel when users fail to sign up, helping the development team quickly identify and resolve issues.

### Features

- 🚨 **Real-time signup failure alerts** with detailed error analysis
- 🔍 **Automatic error categorization** with severity levels and suggested actions
- 🛡️ **Privacy protection** with email masking and no sensitive data logging
- 🌍 **Multi-environment support** with development/production controls
- 🔄 **Unified proxy system** using existing Supabase Edge Functions

## Architecture

### System Components

1. **Slack Notification Utility** (`src/utils/slackNotifications.ts`)
   - Core notification function with error analysis
   - Uses existing Supabase proxy for consistency
   - Privacy-focused data handling

2. **Integration Points**:
   - `SignupForm.tsx` - Email/password signup failures
   - `SignupForm.tsx` - OAuth profile creation failures  
   - `AuthCallbackPage.tsx` - OAuth email validation failures

3. **Existing Infrastructure**:
   - Supabase Edge Function: `slack-webhook-proxy`
   - Environment controls for development/production
   - Unified error handling and retry logic

## Implementation Steps

### 1. Core Notification Function

Create the main notification utility:

```typescript
// src/utils/slackNotifications.ts
export async function notifySignupFailure(data: SignupFailureData): Promise<void> {
  // Environment control
  const isDevelopment = import.meta.env.DEV;
  const enableDevNotifications = import.meta.env.VITE_SLACK_ENABLE_DEV === 'true';
  
  if (isDevelopment && !enableDevNotifications) {
    console.log('Slack notifications disabled in development. Set VITE_SLACK_ENABLE_DEV=true to enable.');
    return;
  }

  // Use existing Supabase proxy
  const SUPABASE_URL = "https://dlrnrgcoguxlkkcitlpd.supabase.co";
  const SUPABASE_ANON_KEY = "your_supabase_anon_key";
  const proxyUrl = `${SUPABASE_URL}/functions/v1/slack-webhook-proxy`;
  
  // Format data for proxy
  const notificationData = {
    event: 'Signup Failure',
    userType: data.accountType || 'unknown',
    fullName: 'Failed Signup Attempt',
    email: sanitizedEmail, // Privacy-masked
    authType: data.additionalContext?.authType || 'unknown',
    timestamp: data.timestamp,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    additionalInfo: {
      errorMessage: data.errorMessage,
      errorCode: data.errorCode,
      possibleReason: data.additionalContext?.possibleReason,
      suggestedAction: data.additionalContext?.suggestedAction,
      severity: data.additionalContext?.severity,
      // ... other context
    }
  };

  // Send via existing proxy
  const response = await fetch(proxyUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify(notificationData),
  });
}
```

### 2. Error Analysis Function

Implement automatic error categorization:

```typescript
export function analyzeSignupFailure(error: any): {
  possibleReason: string;
  suggestedAction: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
} {
  const errorMessage = error?.message?.toLowerCase() || '';
  const errorCode = error?.code || '';

  // Categorize common patterns
  if (errorCode === 'user_already_exists') {
    return {
      possibleReason: 'User attempted to sign up with an existing email',
      suggestedAction: 'User should try logging in or resetting password',
      severity: 'low'
    };
  }
  
  if (errorMessage.includes('database')) {
    return {
      possibleReason: 'Database connection or query error',
      suggestedAction: 'Check Supabase service status and logs',
      severity: 'critical'
    };
  }
  
  // ... additional patterns
}
```

### 3. Integration Points

#### A. Email/Password Signup Failures

```typescript
// In SignupForm.tsx handleSubmit()
if (error) {
  console.error('Signup error:', error);
  
  // Send Slack notification
  const analysis = analyzeSignupFailure(error);
  try {
    await notifySignupFailure({
      email: formData.email,
      accountType,
      errorMessage: error.message,
      errorCode: error.code,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      additionalContext: {
        authType: 'Email/Password',
        step: 'Supabase Auth Signup',
        ...analysis,
        metadata,
        fullError: JSON.stringify(error)
      }
    });
  } catch (slackError) {
    console.error('Failed to send signup failure notification:', slackError);
  }
}
```

#### B. OAuth Profile Creation Failures

```typescript
// In SignupForm.tsx OAuth profile creation
if (error) {
  console.error('Error creating buyer profile:', error);
  
  const analysis = analyzeSignupFailure(error);
  try {
    await notifySignupFailure({
      email: formData.email,
      accountType: 'buyer',
      errorMessage: error.message,
      errorCode: error.code,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      additionalContext: {
        authType: 'OAuth (Google)',
        step: 'Profile creation',
        ...analysis,
        fullError: JSON.stringify(error)
      }
    });
  } catch (slackError) {
    console.error('Failed to send OAuth signup failure notification:', slackError);
  }
}
```

#### C. OAuth Email Validation Failures

```typescript
// In AuthCallbackPage.tsx
import { notifySignupFailure, analyzeSignupFailure } from '../utils/slackNotifications';

if (!isWorkEmail(user.email)) {
  console.log('Personal email not allowed for buyer signup:', user.email);
  
  try {
    const mockError = {
      message: 'Personal email addresses are not allowed for buyer accounts',
      code: 'personal_email_rejected'
    };
    const analysis = analyzeSignupFailure(mockError);
    
    await notifySignupFailure({
      email: user.email,
      accountType: 'buyer',
      errorMessage: 'Personal email addresses are not allowed for buyer accounts.',
      errorCode: 'personal_email_rejected',
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      additionalContext: {
        authType: 'OAuth (Google)',
        step: 'Email validation in auth callback',
        rejectionReason: 'Personal email domain detected',
        emailDomain: user.email.split('@')[1],
        ...analysis
      }
    });
  } catch (slackError) {
    console.error('Failed to send personal email rejection notification:', slackError);
  }
}
```

### 4. Environment Configuration

#### Development Environment

```bash
# .env.local
VITE_SLACK_ENABLE_DEV=true  # Enable notifications in development
```

#### Production Environment

No additional environment variables needed - uses existing Slack webhook configuration through Supabase proxy.

## Key Implementation Principles

### 1. Use Existing Infrastructure

**✅ Correct Approach:**
- Leverage existing Supabase Edge Function proxy
- Use established authentication and error handling patterns
- Maintain consistency with successful signup notifications

**❌ Avoid:**
- Creating separate webhook URL configurations
- Direct Slack API calls that bypass existing proxy
- Duplicate notification systems

### 2. Privacy and Security

**Privacy Protection:**
```typescript
// Mask email addresses
const sanitizedEmail = data.email ? 
  data.email.replace(/^(.{2}).*(@.*)$/, '$1***$2') : 
  'Not provided';
```

**Security Measures:**
- Never log passwords or sensitive user data
- Use existing Supabase authentication
- Environment-controlled notification enabling

### 3. Error Handling

**Non-blocking Implementation:**
```typescript
try {
  await notifySignupFailure(/* ... */);
} catch (slackError) {
  console.error('Failed to send signup failure notification:', slackError);
  // Don't throw - don't let notification failures affect user experience
}
```

### 4. Comprehensive Coverage

**Signup Failure Points to Monitor:**
- Email/password authentication failures
- OAuth profile creation errors
- Email validation rejections
- Database connection issues
- Rate limiting events
- Invalid input validation

## Debugging and Testing

### Development Testing

1. **Enable development notifications:**
   ```bash
   # .env.local
   VITE_SLACK_ENABLE_DEV=true
   ```

2. **Test common failure scenarios:**
   - Existing email signup attempts
   - Personal email for buyer accounts (OAuth)
   - Invalid password formats
   - Network connectivity issues

3. **Monitor console for notification status:**
   ```javascript
   // Should see success confirmation
   console.log('Signup failure notification sent successfully');
   ```

### Production Monitoring

**Key Metrics to Track:**
- Notification delivery success rate
- Error categorization accuracy
- Response time for critical issues
- Pattern identification for recurring problems

## Notification Format

The system sends structured notifications with:

```json
{
  "event": "Signup Failure",
  "userType": "buyer/creator",
  "email": "us***@example.com",
  "errorMessage": "User already registered",
  "errorCode": "user_already_exists",
  "possibleReason": "User attempted to sign up with existing email",
  "suggestedAction": "User should try logging in or resetting password",
  "severity": "low",
  "authType": "Email/Password",
  "environment": "production",
  "timestamp": "2024-08-21T10:30:00Z"
}
```

## Extending the System

### Adding New Notification Types

1. **Define notification data interface:**
   ```typescript
   interface CustomFailureData extends SignupFailureData {
     customField?: string;
   }
   ```

2. **Create specific notification function:**
   ```typescript
   export async function notifyCustomFailure(data: CustomFailureData): Promise<void> {
     // Use same proxy pattern as notifySignupFailure
   }
   ```

3. **Add error analysis patterns:**
   ```typescript
   // Add to analyzeSignupFailure or create separate analyzer
   if (errorMessage.includes('custom_pattern')) {
     return {
       possibleReason: 'Custom failure reason',
       suggestedAction: 'Custom action',
       severity: 'medium'
     };
   }
   ```

### Adding New Integration Points

1. **Import notification utilities:**
   ```typescript
   import { notifySignupFailure, analyzeSignupFailure } from '../utils/slackNotifications';
   ```

2. **Add try/catch around notification call:**
   ```typescript
   try {
     await notifySignupFailure({
       // ... notification data
     });
   } catch (slackError) {
     console.error('Failed to send notification:', slackError);
   }
   ```

3. **Include contextual information:**
   ```typescript
   additionalContext: {
     authType: 'New Auth Method',
     step: 'Custom Step Name',
     customField: 'additional context',
     ...analysis
   }
   ```

## Best Practices

### 1. Consistent Error Context

Always provide:
- `authType` (Email/Password, OAuth, etc.)
- `step` (where in the process the error occurred)
- `timestamp` (ISO string format)
- `userAgent` (for debugging browser-specific issues)

### 2. Non-intrusive Implementation

- Notification failures should never affect user experience
- Use try/catch around all notification calls
- Log errors but don't throw exceptions

### 3. Privacy-first Approach

- Always mask email addresses in notifications
- Never include passwords or sensitive tokens
- Limit user agent string length to prevent data leakage

### 4. Environment Awareness

- Use `VITE_SLACK_ENABLE_DEV` for development control
- Test thoroughly in development before production deployment
- Monitor notification delivery in production

## Troubleshooting

### Common Issues

1. **Notifications not appearing in development:**
   - Check `VITE_SLACK_ENABLE_DEV=true` in `.env.local`
   - Restart development server after environment changes

2. **Proxy errors:**
   - Verify Supabase Edge Function is deployed and working
   - Check network connectivity and authentication

3. **Missing notifications for specific failure types:**
   - Ensure all failure paths include notification calls
   - Check console for error messages
   - Verify integration point coverage

### Debug Logging

For debugging, temporarily add detailed logging:

```typescript
console.log('Debug: About to send notification with data:', notificationData);
console.log('Debug: Proxy response status:', response.status);
```

Remember to remove debug logs after troubleshooting.

## Future Enhancements

### Potential Improvements

1. **Rate Limiting**: Prevent notification spam for repeated failures
2. **Batching**: Group similar failures within time windows
3. **Filtering**: Environment-specific notification rules
4. **Analytics**: Track notification patterns and system health
5. **Multi-channel**: Support different Slack channels for different error types

### Integration Opportunities

- **Monitoring Systems**: Connect to APM tools for comprehensive error tracking
- **User Support**: Automatic ticket creation for critical failures
- **Analytics**: Feed failure data into business intelligence systems

---

This integration provides a robust foundation for monitoring signup failures while maintaining privacy, security, and system reliability. The modular design allows for easy extension and customization based on evolving business needs.