import { stripe } from './stripe';

/**
 * Stripe Refund Helper
 * Handles payment refunds for failed reports
 */

/**
 * Refund a payment using the payment intent ID
 * @param paymentIntentId - Stripe Payment Intent ID
 * @param reason - Reason for refund (e.g., 'Report processing failed')
 * @returns Promise<boolean> - True if refund succeeded, false otherwise
 */
export async function refundPayment(
  paymentIntentId: string,
  reason: string
): Promise<boolean> {
  try {
    if (!paymentIntentId) {
      console.error('[Stripe Refund] Payment intent ID is required');
      return false;
    }

    console.log(
      `[Stripe Refund] Initiating refund for payment intent: ${paymentIntentId}`
    );

    // Create refund
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      reason: 'requested_by_customer', // Stripe refund reason code
      metadata: {
        app_reason: reason,
        timestamp: new Date().toISOString(),
      },
    });

    if (refund.status === 'succeeded') {
      console.log(
        `[Stripe Refund] Refund successful. Refund ID: ${refund.id}`
      );
      return true;
    } else if (refund.status === 'pending') {
      console.log(
        `[Stripe Refund] Refund pending. Refund ID: ${refund.id}`
      );
      return true;
    } else {
      console.error(
        `[Stripe Refund] Refund failed with status: ${refund.status}`
      );
      return false;
    }
  } catch (err) {
    console.error('[Stripe Refund] Error processing refund:', err);
    return false;
  }
}
