import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY || '';
const appUrl = process.env.APP_URL || 'http://localhost:3000';
const fromAddress = process.env.EMAIL_FROM_ADDRESS || 'noreply@zeroclick.ai';

const resend = resendApiKey ? new Resend(resendApiKey) : null;

function wrapTemplate(title: string, bodyHtml: string): string {
  return `
  <!doctype html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${title}</title>
    </head>
    <body style="margin:0;padding:0;background:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#e2e8f0;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0f172a;padding:24px 12px;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#111827;border:1px solid #1f2937;border-radius:12px;overflow:hidden;">
              <tr>
                <td style="padding:24px;background:linear-gradient(135deg,#1d4ed8,#0ea5e9);">
                  <div style="font-size:14px;letter-spacing:0.6px;text-transform:uppercase;color:#dbeafe;font-weight:700;">Zero Click Compliance</div>
                  <h1 style="margin:10px 0 0 0;font-size:24px;line-height:1.2;color:#f8fafc;">${title}</h1>
                </td>
              </tr>
              <tr>
                <td style="padding:24px;">
                  ${bodyHtml}
                </td>
              </tr>
              <tr>
                <td style="padding:18px 24px;border-top:1px solid #1f2937;color:#94a3b8;font-size:12px;line-height:1.5;">
                  You are receiving this email because a SOC 2 review update was requested in your Zero Click Compliance account.
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>`;
}

export async function sendReportReadyEmail(
  email: string,
  vendor_name: string,
  report_id: string
): Promise<void> {
  try {
    if (!resend) {
      console.error('[EmailService] RESEND_API_KEY is missing; cannot send report-ready email');
      return;
    }

    const subject = `Your SOC 2 review for ${vendor_name} is ready`;
    const reportLink = `${appUrl.replace(/\/$/, '')}/report/${report_id}`;

    const html = wrapTemplate(
      'Report Ready',
      `
      <p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:#cbd5e1;">Your SOC 2 review for <strong style="color:#f8fafc;">${vendor_name}</strong> is complete and ready for download.</p>
      <p style="margin:0 0 22px 0;font-size:15px;line-height:1.6;color:#cbd5e1;">Open your report using the secure link below.</p>
      <a href="${reportLink}" style="display:inline-block;padding:12px 18px;background:#22d3ee;color:#0f172a;text-decoration:none;font-weight:700;border-radius:8px;font-size:14px;">Download Report</a>
      <p style="margin:22px 0 0 0;font-size:13px;line-height:1.6;color:#94a3b8;word-break:break-all;">If the button does not work, copy and paste this URL into your browser:<br/>${reportLink}</p>
      `
    );

    await resend.emails.send({
      from: fromAddress,
      to: email,
      subject,
      html,
    });

    console.log(`[EmailService] Report-ready email sent to ${email} for report ${report_id}`);
  } catch (error) {
    console.error('[EmailService] Failed to send report-ready email:', error);
    throw error;
  }
}

export async function sendRefundIssuedEmail(
  email: string,
  vendor_name: string
): Promise<void> {
  try {
    if (!resend) {
      console.error('[EmailService] RESEND_API_KEY is missing; cannot send refund-issued email');
      return;
    }

    const subject = `Refund issued for ${vendor_name} SOC 2 review`;

    const html = wrapTemplate(
      'Refund Issued',
      `
      <p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:#cbd5e1;">We were unable to complete the SOC 2 review for <strong style="color:#f8fafc;">${vendor_name}</strong>.</p>
      <p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:#cbd5e1;">A refund has been issued to your original payment method. Depending on your bank, it may take a few business days to appear.</p>
      <p style="margin:0;font-size:15px;line-height:1.6;color:#cbd5e1;">If you need help, reply to this email and our team will assist you.</p>
      `
    );

    await resend.emails.send({
      from: fromAddress,
      to: email,
      subject,
      html,
    });

    console.log(`[EmailService] Refund-issued email sent to ${email}`);
  } catch (error) {
    console.error('[EmailService] Failed to send refund-issued email:', error);
    throw error;
  }
}