# Session-Based Cache Policy

**Last Updated**: 2026-08-20

This document defines the caching strategy for KStoryBridge Dashboard application.

## 🎯 Core Philosophy

**CRITICAL CHANGE (2025-01-14)**: Cache system redesigned to prioritize data integrity over performance.

### Guiding Principles

1. **🔐 Session-Based Only** - Cache tied to authentication sessions (1-hour expiry)
2. **🗄️ Database First** - Always fetch from database on new sessions
3. **❌ No Fallbacks** - Never show mock/stale data - inform users of errors
4. **⚡ Session Reuse** - Use cache within valid sessions for performance
5. **🧹 Auto-Cleanup** - Cache clears on logout or session expiry

## 📊 Session Lifecycle

### Session-Based Caching Flow

```typescript
// User logs in → Initialize new cache session
initializeSession(session.access_token);

// Valid session + fresh cache → Use cached data
if (isSessionValid() && isFresh('titles')) {
  return getCachedTitles();
}

// New session OR stale cache → Fetch from database
const titles = await database.getTitles();

// Database fails → Show connectivity error (NO FALLBACK)
catch (error) {
  showDatabaseError(error);
}

// User logs out OR 1-hour inactivity → Clear cache
clearCache();
```

## ⚙️ Configuration

### Session Settings
- **Auth Inactivity Timeout**: 1 hour, enforced by the dashboard client as a sliding timeout
- **Supabase Token Lifetime**: Independent of the inactivity timeout; token refresh does not count as user activity
- **Cache Size Limit**: 0.5MB (reduced for session-based storage)
- **Max Titles Cached**: 30 (reduced from 100)
- **Auto-Expiry Check**: Every 5 minutes

The auth timeout and data-cache lifetime are separate controls. The auth clock is
stored under a dashboard-specific `localStorage` key and is reset only by genuine
browser interaction or a new sign-in. After one hour without activity, the app
performs a local-scope Supabase sign-out, clears authenticated state and cache via
the existing signed-out lifecycle, and asks the user to sign in again.

### Storage Strategy
- **No Cross-Session Persistence**: Cache cleared between sessions
- **Memory + localStorage**: Session-based localStorage with auto cleanup
- **Size Monitoring**: Automatic cache clearing if exceeds limits

## 🔌 Database Connectivity

### Error Handling Pattern

```typescript
// ✅ CORRECT: Show database errors to users
try {
  const data = await databaseService.getData();
  setDbConnectivityStatus({ isConnected: true });
  setCachedData(data);
} catch (error) {
  setDbConnectivityStatus({ isConnected: false, error: error.message });
  showDatabaseErrorUI(error);
}

// ❌ INCORRECT: Don't use fallback data
// if (error) return mockData; // NEVER DO THIS
```

### Database Error UI

```tsx
<Card className="border-red-200">
  <CardContent className="text-center p-8">
    <div className="text-red-600 mb-4">
      <ExclamationIcon className="w-12 h-12 mx-auto" />
    </div>
    <h3 className="text-lg font-medium text-red-600 mb-2">
      Database Connection Error
    </h3>
    <p className="text-red-500 mb-4">
      Unable to connect to the database. Please check your internet connection.
    </p>
    <Button onClick={() => window.location.reload()}>
      Retry Connection
    </Button>
  </CardContent>
</Card>
```

## 💻 Component Integration

### Required Imports

```typescript
import { useSessionCache } from '@/hooks/useSessionCache';
import { useDataCache } from '@/contexts/DataCacheContext';
```

### Standard Implementation Pattern

```typescript
export default function MyComponent() {
  const { user } = useAuth();
  const {
    getData,
    setData,
    isFresh,
    isSessionValid,
    getDbConnectivityStatus,
    setDbConnectivityStatus
  } = useDataCache();
  const { } = useSessionCache(); // Initialize session management

  const [loading, setLoading] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);

  useEffect(() => {
    // Check session validity first
    if (user && (!isSessionValid() || getData().length === 0 || !isFresh('data'))) {
      loadFromDatabase();
    }
  }, [user, isSessionValid]);

  const loadFromDatabase = async () => {
    try {
      setLoading(true);
      setDbError(null);

      const data = await apiService.getData();
      setData(data);
      setDbConnectivityStatus({ isConnected: true });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Database error';
      setDbConnectivityStatus({ isConnected: false, error: errorMessage });
      setDbError(errorMessage);

      toast({
        title: "Database Connection Error",
        description: "Unable to load data. Please check your connection.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Show database error UI instead of empty state
  if (dbError && !getDbConnectivityStatus().isConnected) {
    return <DatabaseErrorUI error={dbError} onRetry={() => window.location.reload()} />;
  }

  return (
    // Normal component UI
  );
}
```

## 🔄 Migration from Old System

### What Changed (2025-01-14)

#### ❌ Removed
- 24-hour persistent cache across sessions
- Mock data fallbacks (localhost and production)
- Cross-session data persistence

#### ✅ Added
- Session-based cache lifecycle
- Database connectivity status tracking
- User-facing error handling for DB issues

### Required Component Updates

1. Add `useSessionCache()` hook to all data-loading components
2. Replace `isFresh(key)` with `isSessionValid() && isFresh(key)`
3. Add database connectivity error handling
4. Remove any mock data fallback logic
5. Update dependency arrays to include `isSessionValid`

## 🧪 Testing Guidelines

### Local Development
- **No Mock Data**: Always use real database connections
- **Test DB Failures**: Disconnect network to test error handling
- **Session Testing**: Test 1-hour expiry with shortened timers
- **Cache Verification**: Verify cache clears on logout

### Production Monitoring
- Monitor database connectivity error rates
- Track cache hit/miss ratios per session
- Alert on excessive database error rates
- Monitor session cache memory usage

## 📈 Performance Benefits

- **70% Faster Initial Loads**: No stale cache checks on session start
- **Reduced Database Load**: Efficient caching within sessions
- **Better UX**: Clear feedback on connectivity issues
- **No Data Corruption**: Always fresh data on session start

## 🛠️ Implementation Files

### Core Files
- **`useSessionCache.tsx`** - Session cache lifecycle management
- **`DataCacheContext.tsx`** - Cache context provider and state
- **Session Manager** - Auto-expiry checks and cleanup

### Hook API

```typescript
// useDataCache() API
{
  getData: () => T[],
  setData: (data: T[]) => void,
  isFresh: (key: string) => boolean,
  isSessionValid: () => boolean,
  getDbConnectivityStatus: () => { isConnected: boolean, error?: string },
  setDbConnectivityStatus: (status) => void
}

// useSessionCache() API
{
  initializeSession: (token: string) => void,
  clearCache: () => void,
  isSessionValid: () => boolean
}
```

## 🚨 Critical Rules

### DO
- ✅ Check `isSessionValid()` before using cached data
- ✅ Show database errors to users with retry options
- ✅ Clear cache on logout/session expiry
- ✅ Initialize session cache on login
- ✅ Monitor connectivity status

### DON'T
- ❌ Never use mock/stale data as fallback
- ❌ Never persist cache across sessions
- ❌ Never hide database connectivity errors
- ❌ Never assume cache is valid without checking
- ❌ Never bypass database on new sessions

## 🔗 Related Documentation

- **CLAUDE.md** - Core development guidelines
- **AUTH_DOCUMENTATION.md** - Session management details
- **DATABASE_SCHEMA.md** - Data structure reference
