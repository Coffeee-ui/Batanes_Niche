import nodemailer from 'nodemailer';
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

    if (!settings.MAIL_USERNAME || !settings.MAIL_PASSWORD) {
      console.log(
        `[EMAIL_SIMULATION] Password reset OTP sent to ${toEmail}. OTP Code: ${otpCode} (Simulation mode)`
      );
      return true;
    }

    try {
      const transporter = nodemailer.createTransport({
        host: settings.MAIL_HOST,
        port: settings.MAIL_PORT,
        secure: settings.MAIL_SSL_TLS,
        auth: {
          user: settings.MAIL_USERNAME,
          pass: settings.MAIL_PASSWORD,
        },
      });

      await transporter.sendMail({
        from: `"${settings.MAIL_FROM_NAME}" <${settings.MAIL_FROM}>`,
        to: toEmail,
        subject,
        text: bodyText,
      });

      console.log(`Successfully sent OTP email to ${toEmail}`);
      return true;
    } catch (exc) {
      console.error(`Failed to dispatch OTP email to ${toEmail}:`, exc);
      return false;
    }
  }
}
