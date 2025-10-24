# Creator App V2 - Product Requirements Document

**Version**: 2.0
**Status**: Planning
**Created**: 2025-10-23
**Last Updated**: 2025-10-23

---

## Executive Summary

Creator App V2 is a complete rebuild of the creator-focused platform, designed specifically for Korean content creators (webtoon artists, web novel authors, agents) to manage their IP catalog and connect with media buyers. This rebuild eliminates OAuth authentication issues and removes all dashboard/buyer dependencies.

---

## Core Features

### 1. Authentication
**Priority**: P0 (Critical)

#### Email/Password Authentication
- Sign up with email and password
- Sign in with email and password
- Password reset flow
- Email verification

#### Google OAuth Authentication
- Sign up with Google
- Sign in with Google
- Profile completion after OAuth signup

#### Requirements
- account_type='creator' set DURING signup (not after)
- Single auth listener (no race conditions)
- Simple error messages
- Session persists across page reloads
- Automatic token refresh

---

### 2. Title Management
**Priority**: P0 (Critical)

#### Title List (`/titles`)
- View all titles created by the logged-in creator
- Search and filter titles
- Sort by creation date, views, likes
- Quick actions (edit, view details)

#### Add Title (`/titles/add`)
- Form fields:
  - Title name (KR and EN)
  - Description
  - Synopsis
  - Genre
  - Content format (webtoon, web novel, etc.)
  - Author information
  - Cover image upload
  - Pitch deck upload (PDF)
  - Source URL
  - Tags

#### Edit Title (`/titles/:id/edit`)
- Edit all title fields
- Update cover image
- Update pitch deck
- Save changes

#### Title Detail (`/titles/:id`)
- View complete title information
- View pitch deck (if uploaded)
- View analytics (views, likes, rating)
- View buyer requests for this title

---

### 3. Profile Management
**Priority**: P0 (Critical)

#### Creator Profile (`/profile`)
- Display fields:
  - Full name
  - Pen name
  - Email
  - Role (Author / Agent)
  - Company (optional)
  - Website URL (optional)
  - Account creation date
  - Invitation status

- Editable fields:
  - Full name
  - Pen name
  - Role
  - Company
  - Website URL

---

### 4. Request Management
**Priority**: P1 (High)

#### My Requests (`/requests`)
- View all buyer inquiries for creator's titles
- Filter by title
- Sort by date
- Mark as read/unread
- Respond to requests (future)

---

### 5. News Feed
**Priority**: P2 (Medium)

#### News (`/news`)
- View platform updates
- View announcements
- Sort by date
- Read full articles

---

### 6. Communication
**Priority**: P2 (Medium)

#### Send Message (`/send-message`)
- Contact platform administrators
- Submit support tickets
- Report issues

---

### 7. Documentation
**Priority**: P2 (Medium)

#### Documentation Pages (`/docs/*`)
- View platform documentation
- Database schema
- User journey
- Messaging documentation
- UX dashboard

---

## Technical Requirements

### Frontend Stack
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Routing**: React Router v6
- **UI Components**: shadcn/ui + Radix UI
- **Styling**: Tailwind CSS
- **State Management**: TanStack Query + React Context
- **Forms**: React Hook Form + Zod

### Backend / Database
- **Backend**: Supabase
- **Database**: PostgreSQL (via Supabase)
- **Storage**: Supabase Storage
- **Edge Functions**: Supabase Functions

### Key Dependencies
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "@supabase/supabase-js": "^2.39.0",
    "@tanstack/react-query": "^5.0.0",
    "react-hook-form": "^7.48.0",
    "zod": "^3.22.0",
    "@radix-ui/react-*": "latest",
    "tailwindcss": "^3.3.0"
  }
}
```

---

## Database Schema

### Tables Used

#### `user_creators`
```sql
CREATE TABLE user_creators (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT UNIQUE NOT NULL,
  pen_name TEXT NOT NULL,
  full_name TEXT NOT NULL,
  ip_owner_role TEXT NOT NULL CHECK (ip_owner_role IN ('author', 'agent')),
  ip_owner_company TEXT,
  website_url TEXT,
  invitation_status TEXT DEFAULT 'invited' CHECK (invitation_status IN ('invited', 'active', 'pending')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `titles`
Main table for content catalog. Fields include:
- Basic: title_id, title_name_kr, title_name_en, description, synopsis
- Authors: author, story_author, art_author
- Content: genre, content_format, chapters, completed, tags
- Media: title_image, title_url, pitch
- Metrics: views, likes, rating, rating_count
- Ownership: creator_id (FK to user_creators.id)
- Timestamps: created_at, updated_at

#### `requests` (buyer inquiries)
- Request information from buyers
- Linked to titles
- Status tracking

#### `news`
- Platform announcements
- Updates for creators

---

## Edge Functions Used

### Creator-Specific Functions
1. **create-creator-profile** - Creates creator profile during signup
2. **extract-pitch-test** - Extracts data from pitch deck PDFs
3. **send-email** - Sends transactional emails

### Shared Functions (OK to use)
- Edge functions are shared across apps via Supabase
- No code duplication needed

---

## Storage Buckets Used

### `titles`
- **Purpose**: Store title cover images
- **Access**: Public read, authenticated write (RLS)
- **File types**: Images (PNG, JPG, WebP)
- **Path pattern**: `{creator_id}/{title_id}/cover.{ext}`

### `pitch_decks`
- **Purpose**: Store pitch deck PDFs
- **Access**: Authenticated only (RLS)
- **File types**: PDF only
- **Path pattern**: `{creator_id}/{title_id}/pitch.pdf`

---

## Authentication Flow

### Email Signup Flow
1. User fills signup form (email, password, pen_name, role, etc.)
2. Call `supabase.auth.signUp()` with metadata:
   ```typescript
   await supabase.auth.signUp({
     email,
     password,
     options: {
       data: {
         account_type: 'creator',  // ✅ Set during signup
         full_name
       }
     }
   })
   ```
3. Create profile in `user_creators` table
4. Redirect to `/home`

### OAuth Signup Flow
1. User clicks "Sign up with Google"
2. Store context: `sessionStorage.setItem('oauth_flow', 'signup')`
3. Redirect to Google OAuth
4. Google redirects back to `/auth/callback?code=...`
5. Exchange code for session
6. Redirect to `/signup/complete` form
7. User fills profile form (pen_name, role, etc.)
8. Create profile in `user_creators`
9. Set metadata via `updateUser()` (single call)
10. Redirect to `/home`

### Email Signin Flow
1. User fills signin form (email, password)
2. Call `supabase.auth.signInWithPassword()`
3. Redirect to `/home`

### OAuth Signin Flow
1. User clicks "Sign in with Google"
2. Store context: `sessionStorage.setItem('oauth_flow', 'signin')`
3. Redirect to Google OAuth
4. Google redirects back to `/auth/callback?code=...`
5. Exchange code for session
6. Verify profile exists in `user_creators`
7. Redirect to `/home`

---

## UI/UX Requirements

### Design System
- **Font**: SF Pro (system default)
- **Primary Color**: Hanok Teal (#4C9C9B)
- **Card Style**: Transparent background, gray-300 border, rounded-2xl, no shadow
- **Button Style**: Outline variant, gray-300 border, light gray hover
- **Typography**: Black text for primary content, gray for secondary

### Components to Reuse
From current creator app (working well):
- `CMSSidebar` - Main navigation for creators
- `StandardButton` - Consistent button styling
- `StandardCard` - Consistent card styling
- `ErrorBoundary` - Error handling
- shadcn/ui components (Button, Input, Card, etc.)

### Responsive Design
- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px)
- Sidebar collapses on mobile

---

## Security Requirements

### Authentication
- Passwords must be hashed (handled by Supabase)
- JWT tokens for session management
- Automatic token refresh
- Secure session storage

### Authorization
- Row Level Security (RLS) on all tables
- Creators can only:
  - View/edit their own profile
  - View/edit titles they created
  - View requests for their titles

### Data Protection
- All API calls use authenticated requests
- No sensitive data in localStorage
- HTTPS only in production

---

## Performance Requirements

- Page load time: < 3 seconds
- Time to interactive: < 5 seconds
- Auth operations: < 30 seconds
- Image optimization: WebP format, lazy loading
- Code splitting: Lazy load routes

---

## Testing Requirements

### Unit Tests
- Auth service functions
- Form validation
- Data transformations

### Integration Tests
- Complete signup flow (email + OAuth)
- Complete signin flow (email + OAuth)
- Title CRUD operations
- Profile updates

### E2E Tests
- Happy path: Signup → Add Title → View Titles → Profile
- Error cases: Network errors, validation errors

---

## Deployment Requirements

### Environments
- **Development**: http://localhost:8082
- **Production**: https://creator.kstorybridge.com

### Build Configuration
- Vite production build
- Environment variables via Vercel
- Source maps disabled in production

### Required Environment Variables
```bash
VITE_SUPABASE_URL=https://dlrnrgcoguxlkkcitlpd.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### OAuth Configuration
**Google OAuth Console**:
- Authorized redirect URIs:
  - http://localhost:8082/auth/callback (development)
  - https://creator.kstorybridge.com/auth/callback (production)

**Supabase Auth Settings**:
- Site URL: https://creator.kstorybridge.com
- Redirect URLs: Same as above

---

## Success Metrics

### Authentication
- Email signup success rate: > 95%
- OAuth signup success rate: > 95%
- Signup completion time: < 2 minutes
- Zero OAuth timeout errors

### User Engagement
- Title creation rate: Track % of creators who add at least 1 title
- Profile completion rate: Track % of creators who complete profile
- Return rate: Track % of creators who return within 7 days

### Performance
- Average page load time: < 3 seconds
- 95th percentile page load time: < 5 seconds
- Error rate: < 1%

---

## Future Enhancements (Out of Scope for V2)

- [ ] Real-time notifications
- [ ] Direct messaging with buyers
- [ ] Analytics dashboard (views, likes over time)
- [ ] Bulk title import
- [ ] Advanced search/filters
- [ ] Collaboration features (multiple creators per title)
- [ ] Payment integration for creators

---

## Migration from V1

### What to Keep
- All title data (no migration needed - same database)
- All creator profiles (no migration needed - same table)
- Edge functions (shared via Supabase)
- UI components that work well

### What to Rewrite
- Authentication system (completely new)
- Auth context/hooks (simplified)
- OAuth callback handler (simplified)
- Session management (trust Supabase)

### What to Remove
- Buyer-related code
- Dashboard dependencies
- Complex session health checks
- Multiple auth listeners
- Shared abstractions with dashboard

---

## Dependencies on Other Systems

### Supabase
- **Database**: Shared with dashboard app (same project)
- **Auth**: Shared auth system
- **Storage**: Shared storage buckets
- **Edge Functions**: Shared functions

### External Services
- **Google OAuth**: For social login
- **Vercel**: For deployment and hosting

---

## Open Questions

- [ ] Should we migrate existing creator accounts or require re-signup?
  - **Decision**: No migration needed - same database, just new UI

- [ ] Do we need email verification for email signups?
  - **Decision**: Yes, use Supabase's built-in email verification

- [ ] Should we add rate limiting for API calls?
  - **Decision**: Defer to Phase 2 if needed

---

## Appendix

### File Structure
```
apps/creator-v2/
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.ts
├── index.html
├── public/
│   └── docs/ (documentation files)
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── SignIn.tsx
│   │   │   ├── SignUp.tsx
│   │   │   ├── CompleteProfile.tsx
│   │   │   ├── ForgotPassword.tsx
│   │   │   └── AuthCallback.tsx
│   │   ├── Home.tsx
│   │   ├── Titles.tsx
│   │   ├── TitleDetail.tsx
│   │   ├── AddTitle.tsx
│   │   ├── EditTitle.tsx
│   │   ├── MyRequests.tsx
│   │   ├── Profile.tsx
│   │   ├── News.tsx
│   │   ├── SendMessage.tsx
│   │   ├── Docs.tsx
│   │   └── NotFound.tsx
│   ├── components/
│   │   ├── layout/
│   │   │   ├── CMSSidebar.tsx
│   │   │   └── ProtectedLayout.tsx
│   │   ├── ui/ (shadcn components)
│   │   └── [feature-specific components]
│   ├── lib/
│   │   ├── supabase.ts (Supabase client)
│   │   └── auth.ts (Auth service)
│   ├── hooks/
│   │   ├── useAuth.tsx (Auth context)
│   │   └── use-toast.tsx
│   └── utils/
│       └── [utility functions]
```

### References
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [React Router Documentation](https://reactrouter.com/)
- [shadcn/ui Documentation](https://ui.shadcn.com/)

---

**Document Status**: ✅ Complete
**Current Phase**: Phase 3 Complete (60% total progress)
**Next Step**: Manual Testing → Phase 4 (Feature Migration)

## Code Review & Testing

**Code Review**: Completed ✅
- See `apps/creator-v2/CODE_REVIEW_PHASE_2_3.md` for detailed findings
- All critical issues fixed (input validation, error boundary, loading states)
- Overall Grade: B+ (Very Good, Production Ready with fixes applied)

**Testing Status**: Infrastructure Ready ✅
- See `apps/creator-v2/TESTING_STATUS.md` for manual testing checklist
- Unit test framework configured (vitest + @testing-library)
- 19 manual tests defined for email auth, OAuth, session management, and UI
- Requires manual testing with real Supabase project before Phase 4
