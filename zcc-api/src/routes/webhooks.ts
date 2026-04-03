import { Router } from 'express';
import multer from 'multer';

const router = Router();
const upload = multer(); // For parsing multipart email inbound webhooks

/**
 * Handle inbound emails from Postmark/SendGrid
 * This endpoint receives a vendor SOC 2 report as an attachment.
 */
router.post('/email-inbound', upload.any(), async (req, res) => {
  try {
    const { From, Subject } = req.body;
    const attachments = (req as any).files;

    console.log(`[Webhook] Mail from ${From}. Attachments: ${attachments?.length || 0}`);

    if (!attachments || attachments.length === 0) {
      return res.status(200).send('No attachments found. Skipping.');
    }

    // Identify the SOC 2 PDF from attachments
    const reportFile = attachments.find((f: any) => 
      f.mimetype === 'application/pdf' || f.originalname.toLowerCase().includes('soc')
    );

    if (reportFile) {
      console.log(`[Parser] Routing ${reportFile.originalname} to Agent Pipeline...`);
      // TODO: Trigger ParserAgent service
    }

    res.status(200).send('OK');
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

export default router;
