#!/bin/bash

# Stripe Webhook Verification Script
# Helps verify webhook configuration is correct

echo "🔍 Stripe Webhook Configuration Verification"
echo "=============================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: Must run from project root directory${NC}"
    exit 1
fi

echo "📋 Checking Supabase Secrets..."
echo ""

# Get list of secrets (masked)
SECRETS=$(npx supabase secrets list --project-ref dlrnrgcoguxlkkcitlpd 2>&1)

if echo "$SECRETS" | grep -q "STRIPE_SECRET_KEY"; then
    echo -e "${GREEN}✅ STRIPE_SECRET_KEY${NC} - Set"
else
    echo -e "${RED}❌ STRIPE_SECRET_KEY${NC} - Missing"
fi

if echo "$SECRETS" | grep -q "STRIPE_PRICE_ID_PRO"; then
    echo -e "${GREEN}✅ STRIPE_PRICE_ID_PRO${NC} - Set"
else
    echo -e "${RED}❌ STRIPE_PRICE_ID_PRO${NC} - Missing"
fi

if echo "$SECRETS" | grep -q "STRIPE_WEBHOOK_SECRET"; then
    echo -e "${GREEN}✅ STRIPE_WEBHOOK_SECRET${NC} - Set"
else
    echo -e "${RED}❌ STRIPE_WEBHOOK_SECRET${NC} - Missing"
fi

echo ""
echo "📝 Checking config.toml..."
echo ""

if grep -q "\[functions.stripe-webhook\]" supabase/config.toml; then
    echo -e "${GREEN}✅ [functions.stripe-webhook]${NC} - Section exists"

    if grep -A 1 "\[functions.stripe-webhook\]" supabase/config.toml | grep -q "verify_jwt = false"; then
        echo -e "${GREEN}✅ verify_jwt = false${NC} - JWT bypass enabled"
    else
        echo -e "${RED}❌ verify_jwt${NC} - Not set to false"
    fi
else
    echo -e "${RED}❌ [functions.stripe-webhook]${NC} - Section missing"
fi

echo ""
echo "🌐 Webhook Endpoint Information:"
echo "================================"
echo ""
echo "Webhook URL:"
echo "https://dlrnrgcoguxlkkcitlpd.supabase.co/functions/v1/stripe-webhook"
echo ""
echo "Required Events:"
echo "  • checkout.session.completed"
echo "  • customer.subscription.created"
echo "  • customer.subscription.updated"
echo "  • customer.subscription.deleted"
echo "  • invoice.payment_succeeded"
echo "  • invoice.payment_failed"
echo "  • charge.refunded"
echo ""

echo -e "${YELLOW}📌 Next Steps:${NC}"
echo "1. Go to Stripe Dashboard: https://dashboard.stripe.com/webhooks"
echo "2. Make sure 'Test mode' is OFF (top right)"
echo "3. Add/update webhook endpoint with URL above"
echo "4. Select all 7 events listed above"
echo "5. Copy the signing secret (starts with whsec_)"
echo "6. If secret changed, update with:"
echo "   npx supabase secrets set STRIPE_WEBHOOK_SECRET=\"whsec_...\" --project-ref dlrnrgcoguxlkkcitlpd"
echo ""

echo -e "${YELLOW}🧪 Testing:${NC}"
echo "After setup, test by making a Pro subscription purchase at:"
echo "https://dashboard.kstorybridge.com/buyers/pricing"
echo ""
echo "Then check webhook deliveries at:"
echo "https://dashboard.stripe.com/webhooks"
echo ""
echo "And view function logs with:"
echo "npx supabase functions logs stripe-webhook --limit 20 --project-ref dlrnrgcoguxlkkcitlpd"
echo ""

echo "✅ Verification complete!"
