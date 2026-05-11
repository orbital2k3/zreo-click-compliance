import { supabaseAdmin } from '../lib/supabase';
import { aiAnalyzer } from '../services/aiAnalyzer';
import { docxGenerator } from '../services/docxGenerator';
import { refundPayment } from '../lib/stripeRefund';
import { sendRefundIssuedEmail, sendReportReadyEmail } from '../services/emailService';
const pdf = require('pdf-parse');

/**
 * Main report processing worker
 * Orchestrates: PDF extraction → AI analysis → DOCX generation → Storage upload → DB update
 */

export async function processReport(reportId: string): Promise<void> {
  try {
    console.log(`[ProcessReport] Starting report processing for ${reportId}`);

    // 1. Fetch report from database
    const { data: report, error: fetchError } = await supabaseAdmin
      .from('reports')
      .select('*')
      .eq('id', reportId)
      .single();

    if (fetchError || !report) {
      throw new Error(`Failed to fetch report: ${fetchError?.message}`);
    }

    const userId = report.user_id;
    const pdfPath = report.pdf_storage_path;
    const userEmail = report.user_email; // Assuming this field exists or we fetch it separately

    if (!pdfPath) {
      throw new Error('PDF storage path not set on report');
    }

    console.log(`[ProcessReport] Report ${reportId}: PDF path = ${pdfPath}`);

    // 2. Download PDF from Supabase Storage using service-role key
    console.log(`[ProcessReport] Downloading PDF from storage...`);
    const { data: pdfBuffer, error: downloadError } = await supabaseAdmin.storage
      .from('reports')
      .download(pdfPath);

    if (downloadError || !pdfBuffer) {
      throw new Error(`Failed to download PDF: ${downloadError?.message}`);
    }

    // 3. Extract text from PDF
    console.log(`[ProcessReport] Extracting text from PDF...`);
    const pdfData = await pdf(pdfBuffer);
    const pdfText = pdfData.text;

    if (!pdfText || pdfText.trim().length === 0) {
      throw new Error('Failed to extract text from PDF or PDF is empty');
    }

    console.log(`[ProcessReport] Extracted ${pdfText.length} characters from PDF`);

    // 4. Send to AI model and get analysis
    console.log(`[ProcessReport] Sending PDF to AI analyzer...`);
    const aiResponse = await aiAnalyzer.analyzePDF(pdfText);

    console.log(`[ProcessReport] AI analysis complete for vendor: ${aiResponse.vendor_name}`);

    // 5. Generate DOCX document
    console.log(`[ProcessReport] Generating DOCX report...`);
    const docxBuffer = await docxGenerator.generateReport(
      aiResponse,
      userEmail || 'unknown@example.com',
      reportId
    );

    // 6. Upload DOCX to Supabase Storage
    const docxPath = `reports/${userId}/${reportId}.docx`;
    console.log(`[ProcessReport] Uploading DOCX to storage at ${docxPath}...`);

    const { error: uploadError } = await supabaseAdmin.storage
      .from('reports')
      .upload(docxPath, docxBuffer, {
        contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`Failed to upload DOCX: ${uploadError.message}`);
    }

    // 7. Update report in database
    const now = new Date().toISOString();
    const { error: updateError } = await supabaseAdmin
      .from('reports')
      .update({
        status: 'ready',
        report_storage_path: docxPath,
        report_data: aiResponse,
        completed_at: now,
        updated_at: now,
      })
      .eq('id', reportId);

    if (updateError) {
      throw new Error(`Failed to update report status: ${updateError.message}`);
    }

    if (userEmail) {
      try {
        await sendReportReadyEmail(userEmail, aiResponse.vendor_name, reportId);
      } catch (emailError) {
        console.error(`[ProcessReport] Failed to send report-ready email for ${reportId}:`, emailError);
      }
    } else {
      console.warn(`[ProcessReport] Skipping report-ready email for ${reportId}: user email missing`);
    }

    console.log(`[ProcessReport] Report ${reportId} successfully processed and ready`);
  } catch (err) {
    console.error(`[ProcessReport] Error processing report ${reportId}:`, err);

    // On failure: Update status to 'failed' and trigger refund
    try {
      // Get report to fetch payment intent ID
      const { data: report } = await supabaseAdmin
        .from('reports')
        .select('stripe_payment_intent_id, user_id, user_email, vendor_name')
        .eq('id', reportId)
        .single();

      const errorMessage = err instanceof Error ? err.message : String(err);

      // Update report status to failed
      await supabaseAdmin
        .from('reports')
        .update({
          status: 'failed',
          error_message: errorMessage,
          updated_at: new Date().toISOString(),
        })
        .eq('id', reportId);

      console.log(`[ProcessReport] Report ${reportId} marked as failed`);

      // Trigger refund if payment intent exists
      if (report?.stripe_payment_intent_id) {
        console.log(`[ProcessReport] Initiating refund for payment intent ${report.stripe_payment_intent_id}`);
        const refundSuccess = await refundPayment(
          report.stripe_payment_intent_id,
          `Report processing failed: ${errorMessage}`
        );

        if (refundSuccess) {
          console.log(`[ProcessReport] Refund initiated successfully for report ${reportId}`);

          if (report?.user_email) {
            const vendorName = report.vendor_name || 'your vendor';
            try {
              await sendRefundIssuedEmail(report.user_email, vendorName);
            } catch (emailError) {
              console.error(`[ProcessReport] Failed to send refund-issued email for ${reportId}:`, emailError);
            }
          } else {
            console.warn(`[ProcessReport] Skipping refund-issued email for ${reportId}: user email missing`);
          }
        } else {
          console.error(`[ProcessReport] Refund failed for report ${reportId}`);
        }
      }
    } catch (cleanupErr) {
      console.error(`[ProcessReport] Error during failure cleanup:`, cleanupErr);
    }

    throw err; // Re-throw to queue handler
  }
}
