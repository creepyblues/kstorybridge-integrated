# Deploy Creator Profile Edge Function

## Option 1: Deploy via Supabase CLI (if linked)

```bash
# First link to your project (if not already done)
npx supabase link --project-ref dlrnrgcoguxlkkcitlpd

# Deploy the function
npx supabase functions deploy create-creator-profile
```

## Option 2: Deploy via Supabase Dashboard

1. **Go to Supabase Dashboard** → Your Project → Edge Functions
2. **Create New Function** named `create-creator-profile`
3. **Copy the code** from `supabase/functions/create-creator-profile/index.ts`
4. **Deploy the function**

## Option 3: Manual Supabase CLI Setup

```bash
# Install Supabase CLI if not installed
npm install -g supabase

# Login to Supabase
npx supabase login

# Link to project
npx supabase link --project-ref dlrnrgcoguxlkkcitlpd

# Deploy function
npx supabase functions deploy create-creator-profile
```

## Test the Function

After deployment, you can test it by:

1. **OAuth Creator Signup** - Should automatically create profiles
2. **Manual API Call** (for testing):

```javascript
const { data, error } = await supabase.functions.invoke('create-creator-profile', {
  body: {
    userId: 'user-id-here',
    email: 'test@example.com',
    fullName: 'Test Creator',
    penName: 'Test Pen Name'
  }
})
```

## Expected Behavior

After deployment:
- ✅ OAuth creator signup automatically creates `user_creators` records
- ✅ Users redirect to `/creators/home` instead of getting stuck
- ✅ No more manual profile creation needed
- ✅ Fallback to signup completion if Edge Function fails