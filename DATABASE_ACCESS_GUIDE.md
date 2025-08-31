# Database Access Configuration Guide

## Current Status ✅
Your local server can successfully:
- ✅ Connect to Supabase database
- ✅ Read data from tables (titles, user_buyers)
- ✅ Use the anonymous key for public read operations

## To Enable Write Operations

### 1. Get Your Service Role Key
1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/dlrnrgcoguxlkkcitlpd/settings/api)
2. Navigate to **Settings > API**
3. Copy the **service_role** secret key (starts with `eyJ...`)
   - ⚠️ **IMPORTANT**: This key bypasses Row Level Security - keep it secret!

### 2. Add to Environment Variables

#### For Dashboard App:
Add to `apps/dashboard/.env.local`:
```env
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

#### For Admin App:
Add to `apps/admin/.env.local`:
```env
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

#### For Website App:
Add to `apps/website/.env.local`:
```env
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### 3. Update Your Code for Write Operations

#### Client-Side (React Components):
```typescript
// For authenticated user operations (respects RLS)
import { supabase } from "@/integrations/supabase/client";

// Insert example
const { data, error } = await supabase
  .from('titles')
  .insert({ 
    title_name_en: 'New Title',
    creator_id: user.id 
  });

// Update example
const { error } = await supabase
  .from('user_buyers')
  .update({ tier: 'pro' })
  .eq('email', user.email);
```

#### Server-Side (API Routes/Edge Functions):
```typescript
import { createClient } from '@supabase/supabase-js';

// Create service client (bypasses RLS)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Now you can perform any operation
const { data, error } = await supabase
  .from('titles')
  .insert({ /* your data */ });
```

### 4. Security Best Practices

#### ⚠️ NEVER expose service role key to client-side code
- ❌ Don't use in React components directly
- ❌ Don't include in client bundles
- ✅ Only use in server-side code (API routes, Edge Functions)

#### Use Authentication for User Operations
```typescript
// Authenticate user first
const { data: { user } } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
});

// Then perform operations as that user
const { data } = await supabase
  .from('user_favorites')
  .insert({ 
    user_id: user.id,
    title_id: 'some-uuid' 
  });
```

## Common Operations

### Add New Title (Admin Only)
```typescript
const { data, error } = await supabase
  .from('titles')
  .insert({
    title_name_en: 'Title Name',
    title_name_kr: '한글 제목',
    creator_id: adminUser.id,
    genre: ['drama', 'romance'],
    content_format: 'webtoon'
  })
  .select()
  .single();
```

### Update User Tier
```typescript
const { error } = await supabase
  .from('user_buyers')
  .update({ tier: 'pro' })
  .eq('email', 'user@example.com');
```

### Create User Favorite
```typescript
const { error } = await supabase
  .from('user_favorites')
  .insert({
    user_id: currentUser.id,
    title_id: titleId
  });
```

## Testing Your Configuration

Run the test script with service key:
```bash
SUPABASE_SERVICE_ROLE_KEY=your_key_here node test-database-connection.js
```

## Troubleshooting

### Permission Denied Errors
- Check if RLS is enabled for the table
- Ensure user is authenticated for user-specific operations
- Use service role key for admin operations

### Cannot Insert/Update
- Verify all required fields are provided
- Check foreign key constraints
- Ensure UUIDs are valid format

### Connection Issues
- Verify internet connectivity
- Check if Supabase project is active
- Confirm API keys are correct

## Need Help?
- Check [Supabase Documentation](https://supabase.com/docs)
- Review RLS policies in Supabase Dashboard
- Check `DATABASE_SCHEMA.md` for table structures