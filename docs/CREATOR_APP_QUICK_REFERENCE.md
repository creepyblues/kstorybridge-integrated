# Creator App Separation - Quick Reference

**Status**: Phase 1 Complete (8/97 tasks done)
**Last Updated**: 2025-10-21

---

## 🚀 Quick Commands

```bash
# Development
npm run dev:creator          # Start creator app (localhost:8082)
npm run dev:dashboard        # Start dashboard app (localhost:8081)
npm run dev:website          # Start website (localhost:5173)

# Build
npm run build:creator        # Build creator app only
npm run build:all            # Build all apps

# Lint
npm run lint:all             # Lint all apps including creator
```

---

## 📁 File Structure

```
apps/
├── creator/                 # NEW: Creator dashboard app
│   ├── src/
│   │   ├── App.tsx          # Clean URLs (/home, /titles)
│   │   ├── components/
│   │   │   ├── CreatorProtectedLayout.tsx  # Creator route guard
│   │   │   └── layout/
│   │   │       └── CMSSidebar.tsx  # Creator-only menu
│   │   └── pages/
│   │       ├── CreatorHome.tsx
│   │       ├── CreatorAddTitlePage.tsx
│   │       ├── CreatorEditTitlePage.tsx
│   │       ├── CreatorTitleDetailNew.tsx
│   │       ├── CreatorSignupPage.tsx
│   │       ├── CreatorSigninPage.tsx
│   │       ├── Profile.tsx  # Shared
│   │       ├── News.tsx     # Shared
│   │       └── SendMessage.tsx  # Shared
│   ├── package.json         # Name: @kstorybridge/creator
│   └── vite.config.ts       # Port: 8082
│
├── dashboard/               # Buyer dashboard (will be cleaned up)
│   └── [Buyer-only code after cleanup]
│
└── website/                 # Marketing site
    └── [Updated creator links pending]
```

---

## 🔀 Routing Comparison

### Before (Dashboard App)
```
/creators/home               → Creator home
/creators/titles             → My titles
/creators/titles/add         → Add title
/creators/profile            → Profile
/buyers/chat                 → Buyer chat
/buyers/titles               → Buyer titles
```

### After (Separate Apps)
**Creator App** (`creator.kstorybridge.com`):
```
/home                        → Creator home
/titles                      → My titles
/titles/add                  → Add title
/profile                     → Profile
```

**Dashboard App** (`dashboard.kstorybridge.com`):
```
/buyers/chat                 → Buyer chat
/buyers/titles               → Buyer titles
/buyers/profile              → Buyer profile
```

---

## ✅ What's Done (Phase 1)

- [x] `apps/creator/` structure created
- [x] package.json configured (@kstorybridge/creator, port 8082)
- [x] Root scripts added (dev:creator, build:creator)
- [x] Buyer pages removed (11 files)
- [x] BuyerProtectedLayout deleted
- [x] App.tsx rewritten (creator-only routes)
- [x] CMSSidebar simplified (creator menu only)

---

## ⏳ What's Pending (Phases 2-12)

### Phase 2: Shared Code Extraction
- Extract Profile, News, TitleDetail, SendMessage to `packages/shared-components/`
- Extract useAccountType, useProfile to `packages/auth/`

### Phase 3: Cross-Domain Redirects ⚠️ CRITICAL
- Redirect buyers from creator app → dashboard.kstorybridge.com
- Redirect creators from dashboard app → creator.kstorybridge.com
- Add environment variables (VITE_DASHBOARD_URL, VITE_CREATOR_URL)

### Phase 4: Dashboard Cleanup
- Remove creator routes, pages, components from dashboard app
- Simplify sidebar to buyer-only

### Phase 5: Website Updates
- Update creator CTA links → creator.kstorybridge.com

### Phase 6: Infrastructure Setup ⚠️ CRITICAL
- Create Vercel project (kstorybridge-creator)
- Configure DNS (creator.kstorybridge.com)
- Update Supabase allowed origins

### Phase 7: OAuth Configuration ⚠️ CRITICAL
- Add creator.kstorybridge.com/auth/callback to:
  - Google OAuth
  - LinkedIn OAuth
  - Other providers

### Phases 8-12: Testing, Review, Documentation
- Unit tests for auth routing
- Code review (verify separation)
- Local testing (all 3 apps)
- Documentation updates
- Deployment guide

---

## 🚨 Critical Next Steps

1. **Phase 3: Cross-Domain Redirects** (MUST DO FIRST)
   - Without this, users can access wrong app
   - Estimated: 2-3 hours

2. **Phase 6: Infrastructure Setup** (REQUIRED FOR DEPLOYMENT)
   - Create Vercel project
   - Configure DNS
   - Estimated: 2-4 hours

3. **Phase 7: OAuth Config** (BLOCKS PRODUCTION AUTH)
   - Add callback URLs to all OAuth providers
   - Estimated: 1-2 hours

4. **Phase 10: Local Testing** (VALIDATE BEFORE DEPLOY)
   - Test all 3 apps running simultaneously
   - Verify cross-domain redirects
   - Estimated: 3-4 hours

---

## 🔧 Environment Variables

### Creator App (`.env.local`)
```bash
# Supabase (shared with dashboard)
VITE_SUPABASE_URL=https://dlrnrgcoguxlkkcitlpd.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Cross-domain redirects
VITE_DASHBOARD_URL=http://localhost:8081  # Dev
VITE_DASHBOARD_URL=https://dashboard.kstorybridge.com  # Prod (Vercel)
```

### Dashboard App (`.env.local` - ADD THIS)
```bash
# Cross-domain redirects (NEW)
VITE_CREATOR_URL=http://localhost:8082  # Dev
VITE_CREATOR_URL=https://creator.kstorybridge.com  # Prod (Vercel)
```

---

## 🧪 Testing Checklist

### Local Testing (Before Deployment)
```bash
# Terminal 1
npm run dev:website  # localhost:5173

# Terminal 2
npm run dev:dashboard  # localhost:8081

# Terminal 3
npm run dev:creator  # localhost:8082
```

**Test Scenarios**:
- [ ] Creator signup → redirects to localhost:8082/home
- [ ] Buyer signup → redirects to localhost:8081/buyers/chat
- [ ] Buyer tries localhost:8082/home → redirects to localhost:8081/buyers/chat
- [ ] Creator tries localhost:8081/buyers/chat → redirects to localhost:8082/home
- [ ] OAuth works on both apps
- [ ] Shared components (Profile, News) work identically

---

## 📊 Progress Summary

| Phase | Tasks | Completed | Progress |
|-------|-------|-----------|----------|
| 1: App Scaffolding | 8 | 8 | ✅ 100% |
| 2: Shared Code | 8 | 0 | ⏳ 0% |
| 3: Cross-Domain | 6 | 0 | ⚠️ 0% (CRITICAL) |
| 4: Dashboard Cleanup | 7 | 0 | ⏳ 0% |
| 5: Website Updates | 4 | 0 | ⏳ 0% |
| 6: Infrastructure | 12 | 0 | ⚠️ 0% (CRITICAL) |
| 7: OAuth Config | 6 | 0 | ⚠️ 0% (CRITICAL) |
| 8: Unit Tests | 8 | 0 | ⏳ 0% |
| 9: Code Review | 6 | 0 | ⏳ 0% |
| 10: Local Testing | 15 | 0 | ⚠️ 0% (CRITICAL) |
| 11: Documentation | 10 | 0 | ⏳ 0% |
| 12: Deployment Guide | 7 | 0 | ⏳ 0% |
| **TOTAL** | **97** | **8** | **8.2%** |

---

## 📝 Key Decisions

| Decision | Rationale |
|----------|-----------|
| Directory: `apps/creator/` | Shorter, cleaner name |
| Port: 8082 | Sequential after dashboard (8081) |
| Clean URLs (no `/creators`) | Professional appearance, easier marketing |
| Shared Supabase project | Avoid data duplication, simplify auth |
| Extract to `packages/` | DRY principle, avoid version drift |
| Separate Vercel projects | Independent deployment, scaling |

---

## 🔗 Full Documentation

See **[CREATOR_APP_SEPARATION_PROJECT.md](./CREATOR_APP_SEPARATION_PROJECT.md)** for:
- Complete phase-by-phase breakdown
- Detailed task lists with checkboxes
- Risk analysis & mitigation strategies
- Environment variable specifications
- OAuth provider configurations
- Testing procedures
- Deployment guide

---

## 💡 Tips

### Resuming Work
1. Review this document for current status
2. Check full project doc for detailed task lists
3. Start with Phase 3 (Critical: Cross-domain redirects)

### Common Issues
- **Port conflict**: Ensure 8082 is available (`lsof -i :8082`)
- **Import errors**: Run `npm install` in `apps/creator/`
- **Supabase connection**: Verify `.env.local` has correct keys
- **OAuth failures**: Check provider callback URL configuration

### Useful Commands
```bash
# Check what's running on ports
lsof -i :8081  # Dashboard
lsof -i :8082  # Creator
lsof -i :5173  # Website

# View creator app structure
tree apps/creator/src -L 2

# Search for buyer references in creator app
grep -r "buyer" apps/creator/src --ignore-case | grep -v node_modules

# Search for creator references in dashboard app
grep -r "creator" apps/dashboard/src --ignore-case | grep -v node_modules
```

---

**For detailed implementation guidance, see [CREATOR_APP_SEPARATION_PROJECT.md](./CREATOR_APP_SEPARATION_PROJECT.md)**

_Last updated: 2025-10-21_
