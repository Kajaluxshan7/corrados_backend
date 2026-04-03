import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { getRequiredEnv } from '../config/env.validation';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;
  private readonly emailFrom: string;

  constructor() {
    // Read from validated env vars
    const host = getRequiredEnv('EMAIL_HOST');
    const port = Number(getRequiredEnv('EMAIL_PORT'));
    const user = getRequiredEnv('EMAIL_USER');
    const pass = getRequiredEnv('EMAIL_PASS');
    this.emailFrom = getRequiredEnv('EMAIL_FROM');

    // Create transport with validated credentials
    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // true for 465, false for other ports
      auth: {
        user,
        pass,
      },
    });

    // Verify transporter — failure is normal for Gmail app-passwords and does
    // NOT mean sending will fail. Never fall back to Ethereal (it silently
    // swallows emails instead of delivering them to real inboxes).
    (async () => {
      try {
        await this.transporter.verify();
        this.logger.log('SMTP transporter verified');
      } catch (err) {
        this.logger.warn(
          'SMTP transporter verify() failed — will still attempt to send (normal for Gmail app-passwords)',
          err,
        );
      }
    })();
  }

  private getAdminEmailWrapper(content: string): string {
    return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    body { margin: 0; padding: 0; width: 100% !important; background-color: #FDF8F4; }
    @media only screen and (max-width: 620px) {
      .email-container { width: 100% !important; }
      .content-padding { padding: 24px 20px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #FDF8F4; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #FDF8F4;">
    <tr>
      <td align="center" style="padding: 30px 10px;">
        <!--[if mso]>
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="580" align="center"><tr><td>
        <![endif]-->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="580" class="email-container" style="max-width: 580px; width: 100%; margin: 0 auto;">
          <!-- Header -->
          <tr>
            <td style="background-color: #BE5953; padding: 28px 32px; text-align: center; border-radius: 2px 2px 0 0;">
              <h1 style="margin: 0; font-size: 22px; font-weight: 700; color: #ffffff; letter-spacing: 1px;">CORRADO'S</h1>
              <p style="margin: 4px 0 0; font-size: 11px; color: rgba(255,255,255,0.85); letter-spacing: 2px; text-transform: uppercase;">Restaurant &amp; Bar &bull; Admin</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="background-color: #ffffff; border-left: 1px solid #E8E0D8; border-right: 1px solid #E8E0D8;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #2D2926; padding: 24px 32px; text-align: center; border-radius: 0 0 2px 2px;">
              <p style="margin: 0; font-size: 12px; color: rgba(255,255,255,0.7); line-height: 1.6;">
                Corrado's Restaurant &amp; Bar<br>
                38 Baldwin Street, Whitby, ON L1M 1A2<br>
                <a href="tel:+19056553100" style="color: rgba(255,255,255,0.7); text-decoration: none;">(905) 655-3100</a> &bull;
                <a href="mailto:corradosrestaurant@rogers.com" style="color: rgba(255,255,255,0.7); text-decoration: none;">corradosrestaurant@rogers.com</a>
              </p>
            </td>
          </tr>
        </table>
        <!--[if mso]>
        </td></tr></table>
        <![endif]-->
      </td>
    </tr>
  </table>
</body>
</html>`;
  }

  async sendResetPasswordEmail(
    to: string,
    name: string | undefined,
    resetUrl: string,
  ) {
    const displayName = name || 'Corrados Admin';
    const mailOptions = {
      from: this.emailFrom,
      to,
      subject: "Reset your Corrado's Admin password",
      text: `Hello ${displayName},\n\nWe received a request to reset your password for Corrado's Admin Dashboard. Use the link below to set a new password. This link will expire in 1 hour.\n\n${resetUrl}\n\nIf you did not request a password reset, you can safely ignore this email.\n\n─────────────────────────\nCorrado's Restaurant & Bar\n38 Baldwin Street, Whitby, ON L1M 1A2\n(905) 655-3100 | corradosrestaurant@rogers.com`,
      html: this.getAdminEmailWrapper(`
              <div class="content-padding" style="padding: 36px 32px;">
                <h2 style="margin: 0 0 8px; font-size: 20px; font-weight: 700; color: #2D2926;">Reset Your Password</h2>
                <div style="width: 40px; height: 3px; background-color: #BE5953; margin-bottom: 24px;"></div>
                <p style="margin: 0 0 16px; font-size: 15px; color: #2D2926; line-height: 1.6;">Hello <strong>${displayName}</strong>,</p>
                <p style="margin: 0 0 24px; font-size: 15px; color: #5C524D; line-height: 1.6;">We received a request to reset your password for the Corrado's Admin Dashboard. Click the button below to set a new password. This link will expire in <strong>1 hour</strong>.</p>
                <div style="text-align: center; margin: 28px 0;">
                  <a href="${resetUrl}" style="display: inline-block; background-color: #BE5953; color: #ffffff; padding: 14px 36px; text-decoration: none; font-size: 15px; font-weight: 600; border-radius: 2px; letter-spacing: 0.5px;">Reset Password</a>
                </div>
                <p style="margin: 0 0 8px; font-size: 13px; color: #5C524D; line-height: 1.5;">Or copy and paste this link into your browser:</p>
                <p style="margin: 0 0 24px; font-size: 13px; color: #BE5953; word-break: break-all; line-height: 1.5;">${resetUrl}</p>
                <div style="border-top: 1px solid #E8E0D8; padding-top: 20px; margin-top: 8px;">
                  <p style="margin: 0; font-size: 13px; color: #999; line-height: 1.5;">If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
                </div>
              </div>
      `),
    } as any;

    try {
      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(
        `Reset password email sent to ${to}. Info: ${JSON.stringify(info)}`,
      );
      const preview = nodemailer.getTestMessageUrl(info);
      if (preview) this.logger.log(`Preview URL: ${preview}`);
      return info;
    } catch (err) {
      this.logger.error('Failed to send reset email', err);
      throw err;
    }
  }

  async sendPasswordChangedConfirmation(to: string, name: string | undefined) {
    const displayName = name || 'Corrados Admin';
    const mailOptions = {
      from: this.emailFrom,
      to,
      subject: "Your Corrado's Admin password was changed",
      text: `Hello ${displayName},\n\nThis is a confirmation that your Corrado's Admin Dashboard password was successfully changed. If you did not perform this action, please contact support immediately.\n\n─────────────────────────\nCorrado's Restaurant & Bar\n38 Baldwin Street, Whitby, ON L1M 1A2\n(905) 655-3100 | corradosrestaurant@rogers.com`,
      html: this.getAdminEmailWrapper(`
              <div class="content-padding" style="padding: 36px 32px;">
                <h2 style="margin: 0 0 8px; font-size: 20px; font-weight: 700; color: #2D2926;">Password Changed</h2>
                <div style="width: 40px; height: 3px; background-color: #2C5530; margin-bottom: 24px;"></div>
                <p style="margin: 0 0 16px; font-size: 15px; color: #2D2926; line-height: 1.6;">Hello <strong>${displayName}</strong>,</p>
                <p style="margin: 0 0 24px; font-size: 15px; color: #5C524D; line-height: 1.6;">This is a confirmation that your Corrado's Admin Dashboard password was successfully changed.</p>
                <div style="background-color: #F5EDE4; border-left: 3px solid #BE5953; padding: 16px 20px; margin: 0 0 24px; border-radius: 0 2px 2px 0;">
                  <p style="margin: 0; font-size: 14px; color: #2D2926; line-height: 1.5;"><strong>Didn't make this change?</strong><br>If you did not perform this action, please contact support immediately to secure your account.</p>
                </div>
              </div>
      `),
    } as any;

    try {
      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(
        `Password changed confirmation email sent to ${to}. Info: ${JSON.stringify(info)}`,
      );
      return info;
    } catch (err) {
      this.logger.error('Failed to send confirmation email', err);
      // Don't block password reset even if mail fails
    }
  }

  async sendVerificationEmail(
    to: string,
    name: string,
    verificationUrl: string,
  ) {
    const displayName = name || 'Admin';
    const mailOptions = {
      from: this.emailFrom,
      to,
      subject: "Verify your Corrado's Restaurant Admin email address",
      text: `Hello ${displayName},\n\nWelcome to Corrado's Restaurant Admin Dashboard! Please verify your email address by clicking the link below. This link will expire in 10 minutes.\n\n${verificationUrl}\n\nIf you did not create an account, please ignore this email.\n\n─────────────────────────\nCorrado's Restaurant & Bar\n38 Baldwin Street, Whitby, ON L1M 1A2\n(905) 655-3100 | corradosrestaurant@rogers.com`,
      html: this.getAdminEmailWrapper(`
              <div class="content-padding" style="padding: 36px 32px;">
                <h2 style="margin: 0 0 8px; font-size: 20px; font-weight: 700; color: #2D2926;">Verify Your Email</h2>
                <div style="width: 40px; height: 3px; background-color: #BE5953; margin-bottom: 24px;"></div>
                <p style="margin: 0 0 16px; font-size: 15px; color: #2D2926; line-height: 1.6;">Hello <strong>${displayName}</strong>,</p>
                <p style="margin: 0 0 24px; font-size: 15px; color: #5C524D; line-height: 1.6;">Welcome to the Corrado's Restaurant Admin Dashboard! To complete your registration, please verify your email address by clicking the button below.</p>
                <div style="text-align: center; margin: 28px 0;">
                  <a href="${verificationUrl}" style="display: inline-block; background-color: #BE5953; color: #ffffff; padding: 14px 36px; text-decoration: none; font-size: 15px; font-weight: 600; border-radius: 2px; letter-spacing: 0.5px;">Verify Email Address</a>
                </div>
                <p style="margin: 0 0 8px; font-size: 13px; color: #5C524D; line-height: 1.5;">Or copy and paste this link into your browser:</p>
                <p style="margin: 0 0 24px; font-size: 13px; color: #BE5953; word-break: break-all; line-height: 1.5;">${verificationUrl}</p>
                <div style="border-top: 1px solid #E8E0D8; padding-top: 20px; margin-top: 8px;">
                  <p style="margin: 0; font-size: 13px; color: #999; line-height: 1.5;">This verification link will expire in <strong>10 minutes</strong>. If you didn't create this account, please ignore this email.</p>
                </div>
              </div>
      `),
    } as any;

    if (getRequiredEnv('NODE_ENV') !== 'production') {
      this.logger.debug(
        `Sending verification email to ${to} with url: ${verificationUrl}`,
      );
    }
    try {
      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(
        `Verification email sent to ${to}. Info: ${JSON.stringify(info)}`,
      );
      const preview = nodemailer.getTestMessageUrl(info);
      if (preview) this.logger.log(`Preview URL: ${preview}`);
      return info;
    } catch (err) {
      this.logger.error('Failed to send verification email', err);
      throw err;
    }
  }

  async sendVerificationSuccessEmail(to: string, name: string) {
    const displayName = name || 'Admin';
    const loginUrl = `${getRequiredEnv('ADMIN_FRONTEND_URL')}/login`;
    const mailOptions = {
      from: this.emailFrom,
      to,
      subject: "Email verified successfully - Corrado's Restaurant Admin",
      text: `Hello ${displayName},\n\nYour email has been successfully verified! You can now log in to the Corrado's Restaurant Admin Dashboard at ${loginUrl}.\n\n─────────────────────────\nCorrado's Restaurant & Bar\n38 Baldwin Street, Whitby, ON L1M 1A2\n(905) 655-3100 | corradosrestaurant@rogers.com`,
      html: this.getAdminEmailWrapper(`
              <div class="content-padding" style="padding: 36px 32px;">
                <div style="text-align: center; margin-bottom: 24px;">
                  <div style="display: inline-block; width: 56px; height: 56px; background-color: #2C5530; border-radius: 50%; line-height: 56px; text-align: center;">
                    <span style="color: #ffffff; font-size: 28px;">&#10003;</span>
                  </div>
                </div>
                <h2 style="margin: 0 0 8px; font-size: 20px; font-weight: 700; color: #2D2926; text-align: center;">Email Verified!</h2>
                <div style="width: 40px; height: 3px; background-color: #2C5530; margin: 0 auto 24px;"></div>
                <p style="margin: 0 0 16px; font-size: 15px; color: #2D2926; line-height: 1.6;">Hello <strong>${displayName}</strong>,</p>
                <p style="margin: 0 0 24px; font-size: 15px; color: #5C524D; line-height: 1.6;">Great news! Your email address has been successfully verified. You can now log in to your Corrado's Restaurant Admin Dashboard.</p>
                <div style="text-align: center; margin: 28px 0;">
                  <a href="${loginUrl}" style="display: inline-block; background-color: #BE5953; color: #ffffff; padding: 14px 36px; text-decoration: none; font-size: 15px; font-weight: 600; border-radius: 2px; letter-spacing: 0.5px;">Go to Dashboard</a>
                </div>
                <p style="margin: 0; font-size: 14px; color: #5C524D; text-align: center; line-height: 1.5;">Welcome to the team!</p>
              </div>
      `),
    } as any;

    try {
      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(
        `Verification success email sent to ${to}. Info: ${JSON.stringify(info)}`,
      );
      const preview = nodemailer.getTestMessageUrl(info);
      if (preview) this.logger.log(`Preview URL: ${preview}`);
      return info;
    } catch (err) {
      this.logger.error('Failed to send verification success email', err);
      // Don't block verification even if mail fails
    }
  }
}
