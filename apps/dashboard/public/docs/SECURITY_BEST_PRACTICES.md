# Security Best Practices

**Last Updated:** 2025-01-17
**Critical Priority:** ALWAYS follow these practices to protect credentials and sensitive data

---

## 🚨 CRITICAL: Credential Management

### ❌ NEVER Commit These Files
```bash
# These files should NEVER be committed to git:
.env                    # Local environment variables
*.env                   # Any environment files without explicit approval
*secret*               # Any files containing "secret" in the name
*key.json              # API key files
*.pem, *.p12, *.pfx    # Certificate files
api-keys/              # API key directories
secrets/               # Secret directories
```

### ✅ Safe to Commit
```bash
# These environment files are safe (public configuration only):
.env.example           # Example files with placeholder values
.env.development       # Development URLs and feature flags
.env.production        # Production URLs and feature flags
.env.staging          # Staging configuration
.env.testing          # Testing configuration
```

### 🔑 Credential Types and Handling

#### High-Risk Credentials (NEVER commit)
- **OpenAI API Keys** (`sk-proj-...`) - Cost money, rate limits, usage tracking
- **Supabase Service Role Keys** - Full database access, bypass RLS
- **Private certificates** (`.pem`, `.p12`, `.pfx`) - Authentication credentials
- **Database passwords** - Direct database access
- **Third-party API secrets** - Resend, Slack, etc.

#### Medium-Risk Credentials (Public but document properly)
- **Supabase Anon Keys** - Used in frontend, rate-limited, RLS-protected
- **Public API endpoints** - No authentication, but document usage

#### Safe Configuration (OK to commit)
- **Feature flags** (`VITE_FEATURE_ENABLED=true`)
- **Public URLs** (`VITE_DASHBOARD_URL=https://dashboard.example.com`)
- **Environment identifiers** (`NODE_ENV=production`)

---

## 🛡️ Implementation Guidelines

### Local Development Setup

#### Step 1: Copy Example Files
```bash
# For each app, copy the example file
cp apps/dashboard/.env.local.example apps/dashboard/.env.local
cp api-server/.env.example api-server/.env

# Never commit the copied .env files!
```

#### Step 2: Fill in Credentials
```bash
# In your local .env files, add real values:
OPENAI_API_KEY=sk-proj-your-real-key-here
SUPABASE_SERVICE_ROLE_KEY=your-real-service-role-key
```

#### Step 3: Verify Gitignore
```bash
# Check that your .env files are ignored:
git status --porcelain | grep -E "\.env"

# Should return empty (no .env files tracked)
```

### Production Deployment

#### Vercel Environment Variables
```bash
# Set these in Vercel dashboard (NOT as VITE_ prefixed):
OPENAI_API_KEY=sk-proj-production-key
SUPABASE_SERVICE_ROLE_KEY=production-service-role-key
RESEND_API_KEY=re_production-key
```

#### Supabase Edge Functions
```bash
# Set secrets using Supabase CLI:
supabase secrets set OPENAI_API_KEY=sk-proj-production-key
supabase secrets set RESEND_API_KEY=re_production-key
```

---

## 🔍 Security Audit Checklist

### Before Every Commit
- [ ] Run `git status --porcelain | grep -E "\.env"` (should be empty)
- [ ] Check `git diff --cached` for any keys starting with `sk-`, `re_`, or long base64 strings
- [ ] Verify no files in `secrets/` or `api-keys/` directories are staged
- [ ] Confirm example files only contain placeholder values

### Regular Security Reviews
- [ ] Audit committed files: `git grep -i "sk-\|eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\." | grep -v "example\|placeholder"`
- [ ] Check for accidentally committed credentials in git history
- [ ] Review access permissions for API keys and rotate if needed
- [ ] Verify production secrets are set correctly in deployment platforms

---

## 🚨 Incident Response

### If Credentials Are Accidentally Committed

#### Immediate Actions (within 1 hour)
1. **Rotate compromised credentials immediately**
   - OpenAI: Generate new API key, delete old one
   - Supabase: Regenerate service role key
   - Third-party services: Rotate API keys

2. **Remove from git history**
   ```bash
   # Remove file from tracking
   git rm --cached path/to/sensitive/file

   # Add to .gitignore
   echo "path/to/sensitive/file" >> .gitignore

   # Commit the removal
   git commit -m "Remove sensitive credentials from tracking"
   ```

3. **Update production secrets**
   - Deploy new credentials to all environments
   - Verify applications work with new credentials
   - Monitor for any access using old credentials

#### Follow-up Actions (within 24 hours)
- Audit git history for other potential leaks
- Review and update .gitignore patterns
- Update documentation and team processes
- Consider using git history rewriting tools if needed

---

## 📋 Developer Checklist

### Initial Setup
- [ ] Copy `.env.example` files to `.env` (local only)
- [ ] Obtain necessary API keys from team leads
- [ ] Verify `.env` files are gitignored
- [ ] Test local development environment

### Daily Development
- [ ] Never commit files containing real API keys
- [ ] Use example files to document required variables
- [ ] Keep local .env files updated with latest variables
- [ ] Use placeholder values in documentation

### Before Code Review
- [ ] Double-check no sensitive files are included
- [ ] Verify example files have placeholder values
- [ ] Test that application works without committed secrets
- [ ] Update documentation if new environment variables added

---

## 🔗 Related Documentation

- [`AUTH_DOCUMENTATION.md`](./AUTH_DOCUMENTATION.md) - Authentication flow and configuration
- [`CLAUDE.md`](./CLAUDE.md) - Development guidelines and patterns
- [`EMAIL_POLICY_DOCUMENTATION.md`](./EMAIL_POLICY_DOCUMENTATION.md) - Email service configuration
- [`.gitignore`](./.gitignore) - Files excluded from git tracking

---

## 📞 Emergency Contacts

If you discover a security issue:

1. **DO NOT** commit or push the issue
2. **Immediately** contact team leads
3. **Rotate** any compromised credentials
4. **Document** the incident for future prevention

Remember: Security is everyone's responsibility! 🛡️