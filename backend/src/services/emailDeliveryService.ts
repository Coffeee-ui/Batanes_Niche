import { settings } from '../core/config';

export class EmailDeliveryService {
  static async sendOtpEmail(toEmail: string, otpCode: string): Promise<boolean> {
    const subject = `[${settings.APP_NAME}] Your Password Reset Code`;
    const bodyText =
      `Hello,\n\n` +
      `You requested a password reset for your ${settings.APP_NAME} account.\n\n` +
      `Your 6-digit reset code is: ${otpCode}\n\n` +
      `This code will expire in 15 minutes. If you did not request this, please ignore this email.\n\n` +
      `Sincerely,\n${settings.APP_NAME} Support Team`;

    const apiKey = process.env.RESEND_API_KEY;
    const fromEmail = settings.MAIL_FROM || 'onboarding@resend.dev';

    if (!apiKey) {
      console.log(
        `[EMAIL_SIMULATION] Password reset OTP sent to ${toEmail}. OTP Code: ${otpCode} (Simulation mode)`
      );
      return true;
    }

    try {
      const response = await fetch('https://resend.com', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `${settings.MAIL_FROM_NAME} <${fromEmail}>`,
          to: [toEmail],
          subject,
          text: bodyText,
        }),
      });

      if (!response.ok) {
        const errorDetails = await response.text();
        console.error(`Failed to dispatch OTP email to ${toEmail}:`, errorDetails);
        return false;
      }

      console.log(`Successfully sent OTP email to ${toEmail}`);
      return true;
    } catch (exc) {
      console.error(`Failed to dispatch OTP email to ${toEmail}:`, exc);
      return false;
    }
  }
}