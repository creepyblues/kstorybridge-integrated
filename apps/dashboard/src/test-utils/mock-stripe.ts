/**
 * Mock Stripe Utilities
 *
 * Simulate Stripe webhooks and checkout sessions for testing payment flows
 * without actually charging cards or hitting Stripe API.
 *
 * Usage:
 *   import { mockStripeWebhook, mockCheckoutSession } from '@/test-utils/mock-stripe';
 *
 *   const webhook = mockStripeWebhook('checkout.session.completed', {
 *     customer_email: 'test@example.com',
 *     subscription_tier: 'pro'
 *   });
 */

export type StripeTier = 'basic' | 'pro' | 'suite';

export interface MockStripeCustomer {
  id: string;
  email: string;
  name: string;
  created: number;
}

export interface MockStripeSubscription {
  id: string;
  customer: string;
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  current_period_start: number;
  current_period_end: number;
  plan: {
    id: string;
    product: string;
    amount: number;
    currency: string;
    interval: 'month' | 'year';
  };
}

export interface MockStripeCheckoutSession {
  id: string;
  customer: string;
  customer_email: string;
  subscription: string;
  mode: 'subscription' | 'payment';
  status: 'complete' | 'open' | 'expired';
  payment_status: 'paid' | 'unpaid' | 'no_payment_required';
}

/**
 * Generate mock Stripe customer ID
 */
export function generateMockCustomerId(): string {
  return `cus_test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate mock Stripe subscription ID
 */
export function generateMockSubscriptionId(): string {
  return `sub_test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate mock Stripe checkout session ID
 */
export function generateMockSessionId(): string {
  return `cs_test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get Stripe price ID for tier (test mode)
 */
export function getStripePriceId(tier: StripeTier): string {
  const priceIds = {
    basic: 'price_test_basic_free',
    pro: 'price_test_pro_monthly',
    suite: 'price_test_suite_monthly',
  };
  return priceIds[tier];
}

/**
 * Get subscription amount for tier (in cents)
 */
export function getSubscriptionAmount(tier: StripeTier): number {
  const amounts = {
    basic: 0,
    pro: 4900, // $49/month
    suite: 9900, // $99/month
  };
  return amounts[tier];
}

/**
 * Create mock Stripe customer
 */
export function createMockCustomer(email: string, name?: string): MockStripeCustomer {
  return {
    id: generateMockCustomerId(),
    email,
    name: name || email.split('@')[0],
    created: Math.floor(Date.now() / 1000),
  };
}

/**
 * Create mock Stripe subscription
 */
export function createMockSubscription(
  customerId: string,
  tier: StripeTier,
  status: MockStripeSubscription['status'] = 'active'
): MockStripeSubscription {
  const now = Math.floor(Date.now() / 1000);
  const oneMonthLater = now + (30 * 24 * 60 * 60);

  return {
    id: generateMockSubscriptionId(),
    customer: customerId,
    status,
    current_period_start: now,
    current_period_end: oneMonthLater,
    plan: {
      id: getStripePriceId(tier),
      product: `prod_${tier}`,
      amount: getSubscriptionAmount(tier),
      currency: 'usd',
      interval: 'month',
    },
  };
}

/**
 * Create mock Stripe checkout session
 */
export function createMockCheckoutSession(
  customerEmail: string,
  tier: StripeTier,
  customerId?: string,
  subscriptionId?: string
): MockStripeCheckoutSession {
  return {
    id: generateMockSessionId(),
    customer: customerId || generateMockCustomerId(),
    customer_email: customerEmail,
    subscription: subscriptionId || generateMockSubscriptionId(),
    mode: 'subscription',
    status: 'complete',
    payment_status: 'paid',
  };
}

/**
 * Create mock Stripe webhook event
 */
export function mockStripeWebhook(
  eventType:
    | 'checkout.session.completed'
    | 'customer.subscription.created'
    | 'customer.subscription.updated'
    | 'customer.subscription.deleted'
    | 'invoice.payment_succeeded'
    | 'invoice.payment_failed',
  options: {
    customer_email: string;
    subscription_tier?: StripeTier;
    customer_id?: string;
    subscription_id?: string;
    subscription_status?: MockStripeSubscription['status'];
  }
) {
  const {
    customer_email,
    subscription_tier = 'pro',
    customer_id,
    subscription_id,
    subscription_status = 'active',
  } = options;

  const customerId = customer_id || generateMockCustomerId();
  const subId = subscription_id || generateMockSubscriptionId();

  const baseEvent = {
    id: `evt_test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    object: 'event',
    api_version: '2023-10-16',
    created: Math.floor(Date.now() / 1000),
    type: eventType,
    livemode: false,
  };

  switch (eventType) {
    case 'checkout.session.completed':
      return {
        ...baseEvent,
        data: {
          object: createMockCheckoutSession(
            customer_email,
            subscription_tier,
            customerId,
            subId
          ),
        },
      };

    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      return {
        ...baseEvent,
        data: {
          object: createMockSubscription(customerId, subscription_tier, subscription_status),
        },
      };

    case 'customer.subscription.deleted':
      return {
        ...baseEvent,
        data: {
          object: {
            ...createMockSubscription(customerId, subscription_tier, 'canceled'),
            status: 'canceled',
            canceled_at: Math.floor(Date.now() / 1000),
          },
        },
      };

    case 'invoice.payment_succeeded':
      return {
        ...baseEvent,
        data: {
          object: {
            id: `in_test_${Date.now()}`,
            customer: customerId,
            customer_email,
            subscription: subId,
            amount_paid: getSubscriptionAmount(subscription_tier),
            currency: 'usd',
            status: 'paid',
            paid: true,
          },
        },
      };

    case 'invoice.payment_failed':
      return {
        ...baseEvent,
        data: {
          object: {
            id: `in_test_${Date.now()}`,
            customer: customerId,
            customer_email,
            subscription: subId,
            amount_due: getSubscriptionAmount(subscription_tier),
            currency: 'usd',
            status: 'open',
            paid: false,
            attempt_count: 1,
          },
        },
      };

    default:
      throw new Error(`Unsupported webhook event type: ${eventType}`);
  }
}

/**
 * Simulate Stripe webhook signature (for testing webhook handlers)
 */
export function generateMockWebhookSignature(payload: any, secret: string = 'whsec_test_secret'): string {
  // In real implementation, this would use crypto.createHmac
  // For testing, we just return a mock signature
  const timestamp = Math.floor(Date.now() / 1000);
  const payloadString = JSON.stringify(payload);
  return `t=${timestamp},v1=mock_signature_${payloadString.length}`;
}

/**
 * Test Stripe checkout flow end-to-end
 */
export async function simulateStripeCheckout(
  customerEmail: string,
  tier: StripeTier,
  onWebhookReceived?: (webhook: any) => void
): Promise<{
  session: MockStripeCheckoutSession;
  customer: MockStripeCustomer;
  subscription: MockStripeSubscription;
  webhookEvents: any[];
}> {
  console.log(`[MOCK STRIPE] Simulating checkout for ${customerEmail} (${tier} tier)`);

  // Step 1: Create customer
  const customer = createMockCustomer(customerEmail);
  console.log(`[MOCK STRIPE] Created customer: ${customer.id}`);

  // Step 2: Create subscription
  const subscription = createMockSubscription(customer.id, tier);
  console.log(`[MOCK STRIPE] Created subscription: ${subscription.id}`);

  // Step 3: Create checkout session
  const session = createMockCheckoutSession(
    customerEmail,
    tier,
    customer.id,
    subscription.id
  );
  console.log(`[MOCK STRIPE] Created checkout session: ${session.id}`);

  // Step 4: Generate webhook events
  const webhookEvents = [
    mockStripeWebhook('checkout.session.completed', {
      customer_email: customerEmail,
      subscription_tier: tier,
      customer_id: customer.id,
      subscription_id: subscription.id,
    }),
    mockStripeWebhook('customer.subscription.created', {
      customer_email: customerEmail,
      subscription_tier: tier,
      customer_id: customer.id,
      subscription_id: subscription.id,
    }),
    mockStripeWebhook('invoice.payment_succeeded', {
      customer_email: customerEmail,
      subscription_tier: tier,
      customer_id: customer.id,
      subscription_id: subscription.id,
    }),
  ];

  console.log(`[MOCK STRIPE] Generated ${webhookEvents.length} webhook events`);

  // Trigger webhook callback if provided
  if (onWebhookReceived) {
    for (const event of webhookEvents) {
      console.log(`[MOCK STRIPE] Triggering webhook: ${event.type}`);
      onWebhookReceived(event);
      // Simulate delay between webhooks
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  console.log(`[MOCK STRIPE] ✅ Checkout simulation complete`);

  return {
    session,
    customer,
    subscription,
    webhookEvents,
  };
}

/**
 * Test Stripe subscription cancellation
 */
export function simulateSubscriptionCancellation(
  customerEmail: string,
  customerId: string,
  subscriptionId: string,
  tier: StripeTier = 'pro'
) {
  console.log(`[MOCK STRIPE] Simulating subscription cancellation: ${subscriptionId}`);

  const webhook = mockStripeWebhook('customer.subscription.deleted', {
    customer_email: customerEmail,
    subscription_tier: tier,
    customer_id: customerId,
    subscription_id: subscriptionId,
  });

  console.log(`[MOCK STRIPE] ✅ Cancellation webhook generated`);

  return webhook;
}

/**
 * Common test scenarios
 */
export const MOCK_STRIPE_SCENARIOS = {
  /**
   * Happy path: User upgrades from basic to pro
   */
  UPGRADE_TO_PRO: (email: string) =>
    simulateStripeCheckout(email, 'pro'),

  /**
   * Happy path: User upgrades to suite
   */
  UPGRADE_TO_SUITE: (email: string) =>
    simulateStripeCheckout(email, 'suite'),

  /**
   * Payment failed scenario
   */
  PAYMENT_FAILED: (email: string, tier: StripeTier = 'pro') =>
    mockStripeWebhook('invoice.payment_failed', {
      customer_email: email,
      subscription_tier: tier,
    }),

  /**
   * Subscription cancelled
   */
  CANCEL_SUBSCRIPTION: (email: string, customerId: string, subscriptionId: string) =>
    simulateSubscriptionCancellation(email, customerId, subscriptionId),
};
