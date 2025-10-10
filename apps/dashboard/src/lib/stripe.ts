import { loadStripe } from '@stripe/stripe-js';

// Get Stripe publishable key from environment
const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

// Validate the Stripe key before loading
if (!stripeKey) {
  console.error('❌ STRIPE ERROR: VITE_STRIPE_PUBLISHABLE_KEY is not set in environment variables');
  console.error('💡 Please add VITE_STRIPE_PUBLISHABLE_KEY to your .env.local file');
}

if (stripeKey && !stripeKey.startsWith('pk_')) {
  console.error('❌ STRIPE ERROR: Invalid Stripe key format');
  console.error('💡 Stripe publishable keys must start with pk_test_ or pk_live_');
  console.error(`🔍 Current key starts with: ${stripeKey.substring(0, 10)}...`);
}

// Only load Stripe if we have a valid key
const stripePromise = stripeKey && stripeKey.startsWith('pk_')
  ? loadStripe(stripeKey)
  : Promise.resolve(null);

export default stripePromise;