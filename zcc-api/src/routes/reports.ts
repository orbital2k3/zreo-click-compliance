import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { authMiddleware } from '../middleware/auth';
import { supabaseAdmin } from '../lib/supabase';
import { stripe } from '../lib/stripe';

const router = Router();

/**
 * POST /api/reports/initiate
 * Initiates a new report upload session
 * - Creates report row with status 'pending_upload'
 * - Generates signed upload URL for PDF
 * Returns: { report_id, upload_url }
 */
router.post('/initiate', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { vendor_name } = req.body;
    const userId = req.user?.userId;

    // Validate input
    if (!vendor_name || typeof vendor_name !== 'string') {
      res.status(400).json({ error: 'vendor_name is required and must be a string' });
      return;
    }

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    // Create report row
    const { data: reports, error: insertError } = await supabaseAdmin
      .from('reports')
      .insert([
        {
          user_id: userId,
          title: `${vendor_name} Report`,
          status: 'pending_upload',
          amount_cents: 4900, // $49.00 default price (Task 2B will make this configurable)
          currency: 'usd',
        },
      ])
      .select()
      .single();

    if (insertError || !reports) {
      console.error('[Reports] Error creating report:', insertError);
      res.status(500).json({ error: 'Failed to create report' });
      return;
    }

    const reportId = reports.id;

    // Generate signed upload URL for PDF
    const uploadPath = `uploads/${userId}/${reportId}.pdf`;
    const { data: signedUrl, error: signError } = await supabaseAdmin.storage
      .from('reports')
      .createSignedUrl(uploadPath, 600); // 10 minutes expiry

    if (signError) {
      console.error('[Reports] Error generating signed URL:', signError);
      res.status(500).json({ error: 'Failed to generate upload URL' });
      return;
    }

    res.status(201).json({
      report_id: reportId,
      upload_url: signedUrl.signedUrl,
      vendor_name,
    });
  } catch (err) {
    console.error('[Reports] Unexpected error in /initiate:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/reports/:id/checkout
 * Validates report is ready for payment processing and creates Stripe Checkout Session
 * - Validates report exists and belongs to user
 * - Validates status is 'pending_upload'
 * - Checks PDF exists in storage
 * - Updates pdf_storage_path and status to 'pending_payment'
 * - Creates Stripe Checkout Session
 * - Stores stripe_session_id on report row
 * Returns: { report_id, status, checkout_url }
 */
router.post('/:id/checkout', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id: reportId } = req.params;
    const userId = req.user?.userId;
    const appUrl = process.env.APP_URL || 'http://localhost:5173';
    const stripePriceAmount = parseInt(process.env.STRIPE_PRICE_AMOUNT || '4900', 10); // Default: $49.00

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    // Fetch report to verify ownership and status
    const { data: report, error: fetchError } = await supabaseAdmin
      .from('reports')
      .select()
      .eq('id', reportId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !report) {
      res.status(404).json({ error: 'Report not found or access denied' });
      return;
    }

    // Validate status is 'pending_upload'
    if (report.status !== 'pending_upload') {
      res.status(400).json({
        error: `Invalid report status. Expected 'pending_upload', got '${report.status}'`,
      });
      return;
    }

    // Check if PDF exists in storage at expected path
    const uploadPath = `uploads/${userId}/${reportId}.pdf`;
    const { data: fileList, error: listError } = await supabaseAdmin.storage
      .from('reports')
      .list(`uploads/${userId}`, { limit: 1, search: `${reportId}.pdf` });

    if (listError) {
      console.error('[Reports] Error checking file existence:', listError);
      res.status(500).json({ error: 'Failed to verify PDF upload' });
      return;
    }

    // Verify file exists
    const fileExists = fileList && fileList.some((file) => file.name === `${reportId}.pdf`);
    if (!fileExists) {
      res.status(400).json({ error: 'PDF not found in storage. Please upload the PDF first.' });
      return;
    }

    // Create Stripe Checkout Session
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'SOC 2 Report Analysis',
              description: `Comprehensive security compliance analysis for report: ${report.title}`,
            },
            unit_amount: stripePriceAmount,
          },
          quantity: 1,
        } as any,
      ],
      success_url: `${appUrl}/report/${reportId}?status=success`,
      cancel_url: `${appUrl}/upload`,
      metadata: {
        report_id: String(reportId),
        user_id: String(userId),
      },
    });

    // Update report: set pdf_storage_path, stripe_session_id, and status to 'pending_payment'
    const { data: updatedReport, error: updateError } = await supabaseAdmin
      .from('reports')
      .update({
        pdf_storage_path: uploadPath,
        stripe_session_id: checkoutSession.id,
        status: 'pending_payment',
        updated_at: new Date().toISOString(),
      })
      .eq('id', reportId)
      .select()
      .single();

    if (updateError) {
      console.error('[Reports] Error updating report:', updateError);
      res.status(500).json({ error: 'Failed to update report status' });
      return;
    }

    res.json({
      report_id: updatedReport.id,
      status: updatedReport.status,
      pdf_storage_path: updatedReport.pdf_storage_path,
      checkout_url: checkoutSession.url,
    });
  } catch (err) {
    console.error('[Reports] Unexpected error in /checkout:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/reports
 * Returns all reports for the authenticated user, ordered by created_at DESC
 * Fields returned: id, vendor_id, title, status, created_at, completed_at
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { data: reports, error } = await supabaseAdmin
      .from('reports')
      .select('id, vendor_id, title, status, created_at, completed_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Reports] Query error:', error);
      res.status(500).json({ error: 'Failed to fetch reports' });
      return;
    }

    res.json({ reports: reports || [] });
  } catch (err) {
    console.error('[Reports] Unexpected error in GET /:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/reports/:id
 * Returns single report for status checking
 * Validates that the authenticated user owns this report
 * Fields returned: id, vendor_id, title, status, created_at, completed_at
 */
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { data: report, error } = await supabaseAdmin
      .from('reports')
      .select('id, vendor_id, title, status, created_at, completed_at')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error || !report) {
      console.error('[Reports] Report not found or access denied:', error);
      res.status(404).json({ error: 'Report not found' });
      return;
    }

    res.json({ report });
  } catch (err) {
    console.error('[Reports] Unexpected error in GET /:id:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/reports/:id/download
 * Generates signed download URL for the generated DOCX report
 * Auth required, user must own the report
 * Validates status is 'ready'
 * Returns: { download_url } with 5-minute expiry
 */
router.get('/:id/download', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { id: reportId } = req.params;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Fetch report and validate ownership and status
    const { data: report, error: fetchError } = await supabaseAdmin
      .from('reports')
      .select('id, user_id, status, report_storage_path')
      .eq('id', reportId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !report) {
      console.error('[Reports] Report not found or access denied:', fetchError);
      res.status(404).json({ error: 'Report not found' });
      return;
    }

    // Validate status is 'ready'
    if (report.status !== 'ready') {
      res.status(400).json({
        error: `Report not ready. Current status: ${report.status}. Please wait for processing to complete.`,
      });
      return;
    }

    // Validate report_storage_path exists
    if (!report.report_storage_path) {
      console.error('[Reports] Report storage path not set:', reportId);
      res.status(500).json({ error: 'Report storage path not configured' });
      return;
    }

    // Generate signed download URL with 5-minute expiry
    const { data: signedUrl, error: signError } = await supabaseAdmin.storage
      .from('reports')
      .createSignedUrl(report.report_storage_path, 300); // 5 minutes

    if (signError || !signedUrl) {
      console.error('[Reports] Error generating signed URL:', signError);
      res.status(500).json({ error: 'Failed to generate download URL' });
      return;
    }

    res.json({
      download_url: signedUrl.signedUrl,
      expires_in_seconds: 300,
    });
  } catch (err) {
    console.error('[Reports] Unexpected error in GET /:id/download:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
