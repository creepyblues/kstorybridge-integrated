# Dashboard V2 - Final Deployment Steps

**Date**: 2025-11-02
**Status**: ✅ PR Merged - Vercel Building

---

## ✅ Completed Steps

### 1. Code Fixes & Documentation ✅
- Port configuration fixed (8086 → 8085)
- TypeScript build error fixed
- vercel.json created
- Complete documentation added

### 2. Edge Functions ✅
All 8 functions deployed and active:
- chat-orchestrator (v104)
- create-buyer-profile (v43)
- create-oauth-profile (v43)
- send-email (v60)
- create-checkout-session (v53)
- stripe-webhook (v65)
- create-billing-portal (v52)
- cancel-subscription (v1)

### 3. Supabase Configuration ✅
- OAuth redirect URL added: `https://dashboard-v2.kstorybridge.com/auth/callback`
- Stripe webhook configured
- Production secrets set:
  - STRIPE_SECRET_KEY (live mode)
  - STRIPE_PRICE_ID_PRO
  - STRIPE_WEBHOOK_SECRET
  - DASHBOARD_URL

### 4. Git & PR ✅
- All changes committed
- PR created and merged to main
- Branch: `dashboard-v2-production-deploy` → `main`

---

## 🔄 Current Status: Vercel Building

Vercel is now automatically building dashboard-v2 from the `main` branch.

### Monitor Build Status

**Option 1: Vercel Dashboard**
1. Go to: https://vercel.com/dashboard
2. Find your dashboard-v2 project
3. Click on the latest deployment
4. Watch build logs in real-time

**Option 2: Vercel CLI**
```bash
# If you have Vercel CLI installed
vercel ls dashboard-v2
```

### Expected Build Output
```
✓ TypeScript compilation successful
✓ Vite build complete
✓ Bundle size: ~426KB (gzipped: ~121KB)
✓ Deployment successful
```

---

## 📋 Next Steps (After Build Succeeds)

### Step 1: Verify Build Success

**Check Vercel Dashboard**:
- Build status should show **"Ready"** with green checkmark
- You'll get a temporary Vercel URL (e.g., `dashboard-v2-xxxx.vercel.app`)
- Click the URL to test the deployment

**Quick Smoke Test**:
1. Visit the Vercel URL
2. Verify the app loads
3. Check browser console for errors
4. Try navigating to `/signup` and `/signin`

---

### Step 2: Assign Custom Domain

**In Vercel Dashboard**:

1. Go to your dashboard-v2 project → **Settings** → **Domains**

2. Click **"Add Domain"**

3. Enter: `dashboard-v2.kstorybridge.com`

4. **DNS Configuration** (if you manage DNS):

   **Option A: Using Vercel's Nameservers** (Recommended)
   - Vercel will provide nameservers
   - Update your domain registrar to use Vercel's nameservers
   - Vercel handles SSL automatically

   **Option B: Using CNAME Record** (If DNS managed elsewhere)
   - Add CNAME record:
     ```
     Type: CNAME
     Name: dashboard-v2
     Value: cname.vercel-dns.com
     TTL: 3600 (or automatic)
     ```
   - Vercel will auto-provision SSL certificate

5. Wait for DNS propagation (can take 5-60 minutes)

6. Vercel will show **"Valid Configuration"** when ready

---

### Step 3: Post-Deployment Testing

Once `dashboard-v2.kstorybridge.com` is live, test these critical flows:

#### 1. OAuth Signup (3 min)
```
✓ Visit: https://dashboard-v2.kstorybridge.com/signup
✓ Click "Sign in with Google"
✓ Complete Google OAuth
✓ If new user: Fill profile form
✓ Should redirect to: /buyers/chat
✓ Verify: Profile created in database
```

#### 2. Email Signup (3 min)
```
✓ Visit: https://dashboard-v2.kstorybridge.com/signup
✓ Enter work email, password, company, role
✓ Submit form
✓ Should redirect to: /buyers/chat
✓ Verify: Profile created in database
```

#### 3. AI Chatbot (3 min)
```
✓ Visit: https://dashboard-v2.kstorybridge.com/buyers/chat
✓ Send message: "Show me romance titles"
✓ Should receive: Title cards with recommendations
✓ Check: Edge function logs for errors
```

#### 4. Stripe Checkout (5 min)
```
✓ Visit: https://dashboard-v2.kstorybridge.com/buyers/plan
✓ Click "Upgrade to Pro"
✓ Should redirect to: Stripe Checkout
✓ Complete payment (use test card if in test mode)
✓ Should redirect to: /buyers/checkout/success
✓ Verify: User tier updated to 'pro' in database
✓ Check: Stripe webhook fired successfully
```

#### 5. Title Discovery (2 min)
```
✓ Visit: https://dashboard-v2.kstorybridge.com/buyers/titles
✓ Search for titles
✓ Filter by genre/format
✓ Click title to view details
✓ Save title to favorites
✓ View saved titles at /buyers/saved
```

---

## 🔍 Monitoring & Troubleshooting

### Key Monitoring Points

**1. Vercel Dashboard**
- Build status and logs
- Function errors
- Performance metrics
- Real-time logs

**2. Supabase Dashboard**
```bash
# View edge function logs
npx supabase functions logs chat-orchestrator
npx supabase functions logs create-buyer-profile
npx supabase functions logs create-oauth-profile
npx supabase functions logs stripe-webhook
```

**3. Stripe Dashboard**
- Webhook delivery status
- Failed payments
- Subscription events
- Checkout sessions

**4. Browser Developer Tools**
- Console errors
- Network requests
- Failed API calls

---

## 🚨 Common Issues & Solutions

### Build Fails
**Issue**: TypeScript errors or build failures
**Solution**:
- Check Vercel build logs for specific errors
- Verify all dependencies are in package.json
- Ensure Node.js version matches (should be 18.x or higher)

### OAuth Fails
**Issue**: OAuth redirect doesn't work
**Solution**:
- Verify redirect URL in Supabase: `https://dashboard-v2.kstorybridge.com/auth/callback`
- Check browser console for CORS errors
- Ensure VITE_DASHBOARD_URL env var is correct in Vercel

### Stripe Checkout Fails
**Issue**: Checkout session doesn't create
**Solution**:
- Verify STRIPE_SECRET_KEY is set in Supabase secrets
- Check STRIPE_PRICE_ID_PRO is correct
- View edge function logs: `npx supabase functions logs create-checkout-session`

### Webhook Not Firing
**Issue**: Stripe webhook events not processing
**Solution**:
- Verify webhook URL in Stripe Dashboard
- Check STRIPE_WEBHOOK_SECRET is correct
- View webhook delivery attempts in Stripe Dashboard
- Check edge function logs: `npx supabase functions logs stripe-webhook`

### Domain Not Resolving
**Issue**: dashboard-v2.kstorybridge.com doesn't load
**Solution**:
- Check DNS propagation: https://www.whatsmydns.net/
- Verify CNAME record is correct
- Wait 5-60 minutes for DNS propagation
- Check Vercel domain status

---

## 📊 Success Metrics

After deployment, verify:

- [ ] Vercel build status: **Ready** ✅
- [ ] Custom domain active: `dashboard-v2.kstorybridge.com` ✅
- [ ] SSL certificate: Valid (green padlock) ✅
- [ ] OAuth signup: Working ✅
- [ ] Email signup: Working ✅
- [ ] AI chatbot: Responding ✅
- [ ] Stripe checkout: Processing ✅
- [ ] Webhook events: Firing ✅
- [ ] All page routes: Loading ✅
- [ ] No console errors: Clean ✅

---

## 🎉 Deployment Complete

Once all tests pass:

1. **Notify stakeholders** that dashboard-v2 is live
2. **Monitor** for first 24-48 hours for any issues
3. **Create Suite plan** in Stripe when ready (optional)
4. **Update marketing materials** with new URL
5. **Consider**: Gradual rollout or A/B testing with v1

---

## 📞 Support Resources

- **Vercel Docs**: https://vercel.com/docs
- **Supabase Docs**: https://supabase.com/docs
- **Stripe Docs**: https://stripe.com/docs
- **Project Documentation**: See `CLAUDE.md` and `README.md`

---

**Last Updated**: 2025-11-02
**Status**: Awaiting Vercel build completion
**Next Action**: Monitor Vercel build → Assign custom domain → Test production
