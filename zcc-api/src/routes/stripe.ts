import { Router, Request, Response } from 'express';
import { supabaseAdmin } from '../lib/supabase';
import { stripe } from '../lib/stripe';
import { jobQueue } from '../worker/queue';

const router = Router();

/**
 * POST /webhooks/stripe
 * Handles Stripe webhook events
 * - Verifies Stripe signature using raw body
 * - On checkout.session.completed: updates report status to 'processing' and stores payment intent ID
 */
router.post('/stripe', async (req: Request, res: Response): Promise<void> => {
  try {
    const signature = req.headers['stripe-signature'] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

    if (!webhookSecret) {
      console.warn('[Stripe Webhook] STRIPE_WEBHOOK_SECRET not configured');
      res.status(400).json({ error: 'Webhook secret not configured' });
      return;
    }

    if (!signature) {
      console.error('[Stripe Webhook] Missing stripe-signature header');
      res.status(400).json({ error: 'Missing stripe-signature header' });
      return;
    }

    // Verify Stripe signature
    // req.body is a Buffer because express.raw() middleware was applied to this route
    let event;
    try {
      const body = req.body instanceof Buffer ? req.body : Buffer.from(JSON.stringify(req.body));
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error('[Stripe Webhook] Signature verification failed:', err.message);
      res.status(400).json({ error: 'Invalid signature' });
      return;
    }

    // Handle checkout.session.completed event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any;
      const reportId = session.metadata?.report_id;
      const userId = session.metadata?.user_id;
      const paymentIntentId = session.payment_intent;

      if (!reportId || !userId) {
        console.warn('[Stripe Webhook] Missing metadata in session:', { reportId, userId });
        res.status(200).json({ acknowledged: true });
        return;
      }

      // Update report: set status to 'processing' and store payment intent ID
      const { error: updateError } = await supabaseAdmin
        .from('reports')
        .update({
          status: 'processing',
          stripe_payment_intent_id: paymentIntentId,
          payment_status: 'paid',
          updated_at: new Date().toISOString(),
        })
        .eq('id', reportId)
        .eq('user_id', userId);

      if (updateError) {
        console.error('[Stripe Webhook] Error updating report:', updateError);
        res.status(200).json({ acknowledged: true });
        return;
      }

      console.log(
        `[Stripe Webhook] Report ${reportId} updated to processing after successful payment`
      );

      // Enqueue report for AI analysis and DOCX generation
      jobQueue.enqueue(reportId);
    }

    // Always return 200 for webhook acknowledgment
    res.status(200).json({ acknowledged: true });
  } catch (err) {
    console.error('[Stripe Webhook] Unexpected error:', err);
    res.status(200).json({ acknowledged: true });
  }
});

export default router;
