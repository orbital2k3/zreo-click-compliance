import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';

if (!stripeSecretKey) {
  console.warn('[Stripe] STRIPE_SECRET_KEY not configured');
}

/**
 * Stripe client initialized with STRIPE_SECRET_KEY
 * Used for creating payment intents, sessions, and verifying webhooks
 */
export const stripe = new Stripe(stripeSecretKey);
