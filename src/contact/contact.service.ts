import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { getRequiredEnv, getOptionalEnv } from '../config/env.validation';
import { CreateContactDto } from './dto';
import { Attachment } from 'nodemailer/lib/mailer';
// Subject labels for better readability
const subjectLabels: Record<string, string> = {
  general: 'General Inquiry',
  reservation: 'Party Reservation',
  event: 'Event Inquiry',
  catering: 'Catering Request',
  feedback: 'Feedback',
  careers: 'Careers Application',
  other: 'Other Inquiry',
};

// Subject types that should use events/reservations email
const EVENT_SUBJECT_TYPES = ['reservation', 'event'];

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);
  private primaryTransporter: nodemailer.Transporter;
  private eventsTransporter: nodemailer.Transporter | null = null;
  private readonly primaryEmailFrom: string;
  private readonly eventsEmailFrom: string;
  private readonly pubEmails: string[]; // Support multiple pub emails for general inquiries
  private readonly eventsEmails: string[]; // Support multiple emails for events/reservations
  private readonly backendPublicUrl: string;
  private readonly logoUrl: string;
  private hasEventsTransporter: boolean; // Changed from readonly - can be updated if verification fails

  constructor() {
    // Read primary email settings from validated env vars
    const host = getRequiredEnv('EMAIL_HOST');
    const port = Number(getRequiredEnv('EMAIL_PORT'));
    const user = getRequiredEnv('EMAIL_USER');
    const pass = getRequiredEnv('EMAIL_PASS');
    this.primaryEmailFrom = getRequiredEnv('EMAIL_FROM');

    // Read optional events/reservations email settings
    const eventsHost = getOptionalEnv('EMAIL_EVENTS_HOST');
    const eventsPort = getOptionalEnv('EMAIL_EVENTS_PORT');
    const eventsUser = getOptionalEnv('EMAIL_EVENTS_USER');
    const eventsPass = getOptionalEnv('EMAIL_EVENTS_PASS');
    const eventsFrom = getOptionalEnv('EMAIL_EVENTS_FROM');

    // Check if events email is configured
    this.hasEventsTransporter = !!(
      eventsHost &&
      eventsPort &&
      eventsUser &&
      eventsPass &&
      eventsFrom
    );
    this.eventsEmailFrom = eventsFrom || this.primaryEmailFrom;

    // Log configuration status
    this.logger.log(`Events SMTP configured: ${this.hasEventsTransporter}`);
    if (this.hasEventsTransporter) {
      this.logger.log(`Events SMTP user: ${eventsUser}`);
      this.logger.log(`Events email from: ${this.eventsEmailFrom}`);
    }

    // Parse multiple pub emails (comma-separated)
    const pubEmailsRaw = getRequiredEnv('RESTAURANT_CONTACT_EMAIL');
    this.pubEmails = pubEmailsRaw
      .split(',')
      .map((email) => email.trim())
      .filter((email) => email.length > 0);

    if (this.pubEmails.length === 0) {
      throw new Error(
        'RESTAURANT_CONTACT_EMAIL must contain at least one valid email address',
      );
    }

    // Parse multiple events emails (comma-separated, optional - falls back to pubEmails)
    const eventsEmailsRaw = getOptionalEnv('RESTAURANT_EVENTS_CONTACT_EMAIL');
    if (eventsEmailsRaw) {
      this.eventsEmails = eventsEmailsRaw
        .split(',')
        .map((email) => email.trim())
        .filter((email) => email.length > 0);
      if (this.eventsEmails.length === 0) {
        this.eventsEmails = this.pubEmails; // Fallback to pub emails
      }
    } else {
      this.eventsEmails = this.pubEmails; // Fallback to pub emails
    }

    this.backendPublicUrl = getRequiredEnv('BACKEND_PUBLIC_URL');
    this.logoUrl = `${this.backendPublicUrl}/uploads/assets/corrados-logo.png`;

    // Create primary transport with validated credentials
    this.primaryTransporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // true for 465, false for other ports
      auth: {
        user,
        pass,
      },
    });

    // Create events transport if configured
    if (this.hasEventsTransporter) {
      this.eventsTransporter = nodemailer.createTransport({
        host: eventsHost,
        port: Number(eventsPort),
        secure: Number(eventsPort) === 465,
        auth: {
          user: eventsUser,
          pass: eventsPass,
        },
      });
    }

    // Verify transporters - run verification but don't block constructor
    // The verification is for logging purposes only, transporters work without verification
    this.verifyTransporters();
  }

  /**
   * Verify SMTP transporters (non-blocking, for logging purposes)
   */
  private async verifyTransporters(): Promise<void> {
    // Verify primary transporter — verification failure does NOT mean sending
    // will fail (Gmail app-passwords routinely fail verify() but send fine).
    // Never swap to Ethereal: that silently swallows real emails.
    try {
      await this.primaryTransporter.verify();
      this.logger.log('Primary SMTP transporter verified');
    } catch (err) {
      this.logger.warn(
        'Primary SMTP transporter verify() failed — will still attempt to send (this is normal for Gmail app-passwords)',
        err,
      );
    }

    // Verify events transporter if configured
    // IMPORTANT: Do NOT set eventsTransporter to null on verification failure
    // Gmail often fails verification but still works for sending emails
    if (this.eventsTransporter) {
      try {
        await this.eventsTransporter.verify();
        this.logger.log('Events SMTP transporter verified successfully');
        this.logger.log(
          `Events transporter will be used for: ${EVENT_SUBJECT_TYPES.join(', ')}`,
        );
      } catch (err) {
        // Log warning but DO NOT disable the transporter
        // Many SMTP servers fail verification but work fine for sending
        this.logger.warn(
          'Events SMTP transporter verification failed (this may be normal for some SMTP servers)',
          err,
        );
        this.logger.log(
          'Events transporter will still be used - verification failure does not mean sending will fail',
        );
      }
    }
  }

  /**
   * Get the appropriate transporter based on subject type
   */
  private getTransporter(subject: string): nodemailer.Transporter {
    if (EVENT_SUBJECT_TYPES.includes(subject) && this.eventsTransporter) {
      return this.eventsTransporter;
    }
    return this.primaryTransporter;
  }

  /**
   * Get the appropriate email from address based on subject type
   * Uses eventsTransporter check to ensure consistency with getTransporter
   */
  private getEmailFrom(subject: string): string {
    if (EVENT_SUBJECT_TYPES.includes(subject) && this.eventsTransporter) {
      return this.eventsEmailFrom;
    }
    return this.primaryEmailFrom;
  }

  /**
   * Get the appropriate recipient emails based on subject type
   */
  private getRecipientEmails(subject: string): string[] {
    if (EVENT_SUBJECT_TYPES.includes(subject)) {
      return this.eventsEmails;
    }
    return this.pubEmails;
  }

  async submitContactForm(
    contactDto: CreateContactDto,
    cvFile?: Express.Multer.File,
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    const { name, email, subject } = contactDto;
    const isReservation = subject === 'reservation';
    const subjectLabel = subjectLabels[subject] || 'Contact Form Submission';

    try {
      // Send notification email to pub (with CV attachment if present)
      await this.sendPubNotification(contactDto, subjectLabel, cvFile);

      // Send confirmation email to customer
      await this.sendCustomerConfirmation(contactDto, subjectLabel);

      this.logger.log(
        `Contact form submitted successfully: ${name} (${email}) - ${subjectLabel}`,
      );

      return {
        success: true,
        message: isReservation
          ? 'Reservation request received. We will confirm your booking shortly.'
          : 'Thank you for your message. We will get back to you within 24 hours.',
      };
    } catch (error) {
      this.logger.error('Failed to process contact form:', error);
      throw new InternalServerErrorException(
        'We could not send your message right now. Please try again in a few minutes, or contact us directly by phone or email.',
      );
    }
  }

  /**
   * Generate the common email header with logo
   */
  private getEmailHeader(subtitle: string): string {
    return `
          <!-- Header - warm cream with branding -->
          <tr>
            <td align="center" style="background-color: #FFFCF8; padding: 36px 32px 28px; border-bottom: 1px solid rgba(42,21,9,0.06);">
              <img src="${this.logoUrl}" alt="Corrado\'s Restaurant" width="48" style="width: 48px; height: auto; margin-bottom: 12px;" />
              <p style="margin: 0; font-size: 14px; font-weight: 700; color: #2D2926; letter-spacing: 3px; text-transform: uppercase; font-family: Georgia, 'Times New Roman', serif;">Corrado\'s</p>
              <p style="margin: 6px 0 0; font-size: 11px; color: #BE5953; letter-spacing: 1.5px; text-transform: uppercase; font-weight: 500;">
                ${subtitle}
              </p>
            </td>
          </tr>
          <!-- Accent line -->
          <tr>
            <td style="height: 3px; background: linear-gradient(90deg, #FDF8F4, #BE5953, #C9A96E, #BE5953, #FDF8F4);"></td>
          </tr>
    `;
  }

  /**
   * Generate the common email footer
   */
  private getEmailFooter(): string {
    return `
          <!-- Footer -->
          <tr>
            <td style="background-color: #F5EDE4; padding: 28px 36px; border-top: 1px solid rgba(45,41,38,0.06);">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding-bottom: 18px;">
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 0 6px;">
                          <a href="https://www.facebook.com/people/Corrados-Restaurant/100064117086171/" style="display: inline-block; text-decoration: none;" title="Facebook">
                            <img src="${this.backendPublicUrl}/uploads/assets/icon-facebook.svg" width="30" height="30" alt="Facebook" style="display: block; border: 0;" />
                          </a>
                        </td>
                        <td style="padding: 0 6px;">
                          <a href="https://www.instagram.com/corrados.restaurant/" style="display: inline-block; text-decoration: none;" title="Instagram">
                            <img src="${this.backendPublicUrl}/uploads/assets/icon-instagram.svg" width="30" height="30" alt="Instagram" style="display: block; border: 0;" />
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="height: 1px; background-color: rgba(45,41,38,0.08);"></td>
                </tr>
                <tr>
                  <td align="center" style="padding: 18px 0 14px;">
                    <p style="margin: 0 0 4px; font-size: 12px; font-weight: 600; color: #5C524D; letter-spacing: 0.3px;">Corrado\'s Restaurant &amp; Bar</p>
                    <p style="margin: 0 0 2px; font-size: 12px; color: rgba(45,41,38,0.45);">38 Baldwin Street, Whitby, ON L1M 1A2</p>
                    <p style="margin: 0; font-size: 12px; color: rgba(45,41,38,0.45);">
                      <a href="tel:+19056553100" style="color: rgba(45,41,38,0.45); text-decoration: none;">(905) 655-3100</a>&ensp;&#183;&ensp;
                      <a href="mailto:corradosrestaurant@rogers.com" style="color: rgba(45,41,38,0.45); text-decoration: none;">corradosrestaurant@rogers.com</a>
                    </p>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top: 2px;">
                    <p style="margin: 0; font-size: 11px; line-height: 1.6; color: rgba(45,41,38,0.3);">
                      &copy; ${new Date().getFullYear()} Corrado's Restaurant &amp; Bar. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
    `;
  }

  /**
   * Get base email wrapper
   */
  private getEmailWrapper(content: string): string {
    return `
<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>Corrado\'s Restaurant</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
  <style>
    body, table, td { margin: 0; padding: 0; }
    body { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table { border-spacing: 0; border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { border: 0; line-height: 100%; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; max-width: 100%; }
    a { color: #BE5953; text-decoration: none; }
    @media only screen and (max-width: 620px) {
      .email-container { width: 100% !important; }
      .content-pad { padding-left: 20px !important; padding-right: 20px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #FDF8F4; font-family: 'Segoe UI', -apple-system, Helvetica, Arial, sans-serif; word-spacing: normal;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #FDF8F4; padding: 40px 16px 48px;">
    <tr>
      <td align="center">
        <table role="presentation" class="email-container" width="560" cellpadding="0" cellspacing="0" style="max-width: 560px; width: 100%; background-color: #ffffff; border-radius: 4px; overflow: hidden; box-shadow: 0 2px 24px rgba(45,41,38,0.08);">
          ${content}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
  }

  private async sendPubNotification(
    contactDto: CreateContactDto,
    subjectLabel: string,
    cvFile?: Express.Multer.File,
  ): Promise<void> {
    const {
      name,
      email,
      phone,
      subject,
      reservationDate,
      reservationTime,
      guestCount,
      position,
      message,
    } = contactDto;
    const isReservation = subject === 'reservation';
    const isCareers = subject === 'careers';

    // Build reservation details section
    let reservationDetailsHtml = '';
    if (isReservation) {
      reservationDetailsHtml = `
        <div style="background: #FDF8F4; padding: 24px; border-radius: 4px; margin: 24px 0; border-left: 3px solid #BE5953;">
          <h3 style="color: #2D2926; margin: 0 0 18px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 2px; font-weight: 600;">Party Reservation Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 10px 0; color: #5C524D; font-weight: 600; width: 140px; font-size: 14px; border-bottom: 1px solid #E8E0D8;">Requested Date</td>
              <td style="padding: 10px 0; color: #2D2926; font-size: 14px; border-bottom: 1px solid #E8E0D8;">${reservationDate || 'Not specified'}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #5C524D; font-weight: 600; font-size: 14px; border-bottom: 1px solid #E8E0D8;">Requested Time</td>
              <td style="padding: 10px 0; color: #2D2926; font-size: 14px; border-bottom: 1px solid #E8E0D8;">${reservationTime || 'Not specified'}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #5C524D; font-weight: 600; font-size: 14px;">Number of Guests</td>
              <td style="padding: 10px 0; color: #2D2926; font-size: 14px;">${guestCount || 'Not specified'}</td>
            </tr>
          </table>
        </div>
      `;
    }

    // Build careers details section
    let careersDetailsHtml = '';
    if (isCareers) {
      const cvAttachmentNote = cvFile
        ? `
            <tr>
              <td style="padding: 10px 0; color: #5C524D; font-weight: 600; width: 140px; font-size: 14px;">CV/Resume</td>
              <td style="padding: 10px 0; color: #2D2926; font-size: 14px;">
                <span style="background: #2C5530; color: #fff; padding: 4px 12px; border-radius: 2px; font-size: 12px; font-weight: 600;">📎 ${cvFile.originalname}</span>
              </td>
            </tr>
          `
        : '';

      careersDetailsHtml = `
        <div style="background: #FDF8F4; padding: 24px; border-radius: 4px; margin: 24px 0; border-left: 3px solid #BE5953;">
          <h3 style="color: #2D2926; margin: 0 0 18px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 2px; font-weight: 600;">Application Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 10px 0; color: #5C524D; font-weight: 600; width: 140px; font-size: 14px; ${cvFile ? 'border-bottom: 1px solid #E8E0D8;' : ''}">Position Applied</td>
              <td style="padding: 10px 0; color: #2D2926; font-size: 14px; font-weight: 500; ${cvFile ? 'border-bottom: 1px solid #E8E0D8;' : ''}">${position || 'Not specified'}</td>
            </tr>
            ${cvAttachmentNote}
          </table>
        </div>
      `;
    }

    const emailSubject = isReservation
      ? `New Party Reservation Request - ${name}`
      : isCareers
        ? `New Careers Application - ${name} (${position || 'Position not specified'})`
        : `New ${subjectLabel} - ${name}`;

    const textContent = `
NEW ${isReservation ? 'PARTY RESERVATION REQUEST' : isCareers ? 'CAREERS APPLICATION' : 'CONTACT FORM SUBMISSION'}
─────────────────────────────────────────

CONTACT INFORMATION
Name: ${name}
Email: ${email}
Phone: ${phone || 'Not provided'}
Subject: ${subjectLabel}
${
  isReservation
    ? `
RESERVATION DETAILS
Date: ${reservationDate || 'Not specified'}
Time: ${reservationTime || 'Not specified'}
Guests: ${guestCount || 'Not specified'}
`
    : ''
}${
      isCareers
        ? `
APPLICATION DETAILS
Position: ${position || 'Not specified'}${cvFile ? `\nCV/Resume: ${cvFile.originalname} (attached)` : ''}
`
        : ''
    }
MESSAGE
${message}

─────────────────────────────────────────
Received: ${new Date().toLocaleString('en-CA', { timeZone: 'America/Toronto' })}
Corrado\'s Restaurant Contact Form
    `;

    const htmlContent = this.getEmailWrapper(`
          ${this.getEmailHeader(isReservation ? 'New Party Reservation' : isCareers ? 'New Careers Application' : 'New Contact Message')}

          <!-- Content -->
          <tr>
            <td class="content-pad" style="padding: 40px 35px;">
              <!-- Contact Info Card -->
              <div style="background: #FDF8F4; padding: 24px; border-radius: 4px; margin-bottom: 24px;">
                <h3 style="color: #2D2926; margin: 0 0 18px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 2px; font-weight: 600;">${isCareers ? 'Applicant' : 'Contact'} Information</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 10px 0; color: #5C524D; font-weight: 600; width: 100px; font-size: 14px; border-bottom: 1px solid #E8E0D8;">Name</td>
                    <td style="padding: 10px 0; color: #2D2926; font-weight: 500; font-size: 14px; border-bottom: 1px solid #E8E0D8;">${name}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; color: #5C524D; font-weight: 600; font-size: 14px; border-bottom: 1px solid #E8E0D8;">Email</td>
                    <td style="padding: 10px 0; border-bottom: 1px solid #E8E0D8;"><a href="mailto:${email}" style="color: #BE5953; text-decoration: none; font-size: 14px;">${email}</a></td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; color: #5C524D; font-weight: 600; font-size: 14px; border-bottom: 1px solid #E8E0D8;">Phone</td>
                    <td style="padding: 10px 0; color: #2D2926; font-size: 14px; border-bottom: 1px solid #E8E0D8;">${phone ? `<a href="tel:${phone}" style="color: #BE5953; text-decoration: none;">${phone}</a>` : '<span style="color: #5C524D;">Not provided</span>'}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; color: #5C524D; font-weight: 600; font-size: 14px;">Subject</td>
                    <td style="padding: 10px 0;"><span style="background: #BE5953; color: #ffffff; padding: 4px 14px; border-radius: 2px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">${subjectLabel}</span></td>
                  </tr>
                </table>
              </div>

              ${reservationDetailsHtml}
              ${careersDetailsHtml}

              <!-- Message Card -->
              <div style="background: #FFFCF8; padding: 24px; border-radius: 4px; border: 1px solid #E8E0D8;">
                <h3 style="color: #2D2926; margin: 0 0 16px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 2px; font-weight: 600;">Message</h3>
                <p style="color: #5C524D; line-height: 1.8; margin: 0; white-space: pre-wrap; font-size: 14px;">${message}</p>
              </div>

              <!-- Quick Actions -->
              <div style="margin-top: 30px; text-align: center;">
                <a href="mailto:${email}?subject=Re: ${encodeURIComponent(subjectLabel)}" style="display: inline-block; background: #BE5953; color: #ffffff; padding: 14px 32px; border-radius: 2px; text-decoration: none; font-weight: 600; margin: 6px; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">Reply via Email</a>
                ${phone ? `<a href="tel:${phone}" style="display: inline-block; background: #2D2926; color: #ffffff; padding: 14px 32px; border-radius: 2px; text-decoration: none; font-weight: 600; margin: 6px; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">Call ${name.split(' ')[0]}</a>` : ''}
              </div>

              <!-- Timestamp -->
              <p style="color: #5C524D; margin: 30px 0 0 0; font-size: 12px; text-align: center; border-top: 1px solid #E8E0D8; padding-top: 20px;">
                Received on ${new Date().toLocaleString('en-CA', { timeZone: 'America/Toronto', dateStyle: 'full', timeStyle: 'short' })}
              </p>
            </td>
          </tr>

          ${this.getEmailFooter()}
    `);

    // Prepare attachments array if CV file is present
    const attachments: Attachment[] = [];
    if (cvFile) {
      attachments.push({
        filename: cvFile.originalname,
        content: cvFile.buffer,
        contentType: cvFile.mimetype,
      });
      this.logger.log(
        `Attaching CV file: ${cvFile.originalname} (${cvFile.size} bytes)`,
      );
    }

    // Get the appropriate transporter and email from based on subject
    const transporter = this.getTransporter(subject);
    const emailFrom = this.getEmailFrom(subject);

    this.logger.log(
      `Using ${EVENT_SUBJECT_TYPES.includes(subject) && this.eventsTransporter ? 'events' : 'primary'} transporter for subject: ${subject}`,
    );

    // Get the appropriate recipient emails based on subject type
    const recipientEmails = this.getRecipientEmails(subject);

    this.logger.log(
      `Sending to ${EVENT_SUBJECT_TYPES.includes(subject) ? 'events' : 'general'} recipient list: ${recipientEmails.length} recipient(s)`,
    );

    // Send individual emails to each recipient for better deliverability
    const sendPromises = recipientEmails.map(async (recipientEmail) => {
      const mailOptions = {
        from: emailFrom,
        to: recipientEmail,
        replyTo: email,
        subject: emailSubject,
        text: textContent,
        html: htmlContent,
        attachments, // Include CV file if present
      };

      try {
        const info = await transporter.sendMail(mailOptions);
        this.logger.log(
          `Notification email sent to ${recipientEmail}. Info: ${JSON.stringify(info)}`,
        );
        const preview = nodemailer.getTestMessageUrl(info);
        if (preview) this.logger.log(`Preview URL: ${preview}`);
        return { success: true, email: recipientEmail };
      } catch (error) {
        this.logger.error(
          `Failed to send notification email to ${recipientEmail}:`,
          error,
        );
        return { success: false, email: recipientEmail, error };
      }
    });

    const results = await Promise.all(sendPromises);
    const failedEmails = results.filter((r) => !r.success);

    if (failedEmails.length === recipientEmails.length) {
      // All emails failed
      throw new InternalServerErrorException(
        'We could not send your message right now. Please try again in a few minutes, or contact us directly by phone or email.',
      );
    }

    if (failedEmails.length > 0) {
      this.logger.warn(
        `Some notification emails failed: ${failedEmails.map((f) => f.email).join(', ')}`,
      );
    }

    this.logger.log(
      `Notification emails sent to ${results.filter((r) => r.success).length}/${recipientEmails.length} recipient(s)`,
    );
  }

  private async sendCustomerConfirmation(
    contactDto: CreateContactDto,
    subjectLabel: string,
  ): Promise<void> {
    const {
      name,
      email,
      subject,
      reservationDate,
      reservationTime,
      guestCount,
      position,
      message,
    } = contactDto;
    const isReservation = subject === 'reservation';
    const isCareers = subject === 'careers';

    // Build reservation confirmation section
    let reservationConfirmHtml = '';
    if (isReservation) {
      reservationConfirmHtml = `
        <div style="background: #FDF8F4; padding: 28px; border-radius: 4px; margin: 28px 0; border: 1px dashed #BE5953;">
          <h3 style="color: #2D2926; margin: 0 0 22px 0; font-size: 14px; text-align: center; text-transform: uppercase; letter-spacing: 2px; font-weight: 600;">Your Reservation Request</h3>
          <table style="width: 100%; border-collapse: collapse; max-width: 320px; margin: 0 auto;">
            <tr>
              <td style="padding: 12px 0; color: #5C524D; font-weight: 600; text-align: left; font-size: 14px; border-bottom: 1px solid #E8E0D8;">Date</td>
              <td style="padding: 12px 0; color: #2D2926; font-weight: 500; text-align: right; font-size: 14px; border-bottom: 1px solid #E8E0D8;">${reservationDate || 'To be confirmed'}</td>
            </tr>
            <tr>
              <td style="padding: 12px 0; color: #5C524D; font-weight: 600; text-align: left; font-size: 14px; border-bottom: 1px solid #E8E0D8;">Time</td>
              <td style="padding: 12px 0; color: #2D2926; font-weight: 500; text-align: right; font-size: 14px; border-bottom: 1px solid #E8E0D8;">${reservationTime || 'To be confirmed'}</td>
            </tr>
            <tr>
              <td style="padding: 12px 0; color: #5C524D; font-weight: 600; text-align: left; font-size: 14px;">Party Size</td>
              <td style="padding: 12px 0; color: #2D2926; font-weight: 500; text-align: right; font-size: 14px;">${guestCount || 'To be confirmed'} guests</td>
            </tr>
          </table>
          <p style="color: #5C524D; font-size: 13px; text-align: center; margin: 22px 0 0 0; font-style: italic;">
            We will confirm your reservation within a few hours during business hours.
          </p>
        </div>
      `;
    }

    // Build careers confirmation section
    let careersConfirmHtml = '';
    if (isCareers) {
      careersConfirmHtml = `
        <div style="background: #FDF8F4; padding: 28px; border-radius: 4px; margin: 28px 0; border: 1px dashed #BE5953;">
          <h3 style="color: #2D2926; margin: 0 0 22px 0; font-size: 14px; text-align: center; text-transform: uppercase; letter-spacing: 2px; font-weight: 600;">Your Application</h3>
          <table style="width: 100%; border-collapse: collapse; max-width: 320px; margin: 0 auto;">
            <tr>
              <td style="padding: 12px 0; color: #5C524D; font-weight: 600; text-align: left; font-size: 14px;">Position</td>
              <td style="padding: 12px 0; color: #2D2926; font-weight: 500; text-align: right; font-size: 14px;">${position || 'Not specified'}</td>
            </tr>
          </table>
          <p style="color: #5C524D; font-size: 13px; text-align: center; margin: 22px 0 0 0; font-style: italic;">
            Our team will review your application and contact you soon.
          </p>
        </div>
      `;
    }

    const emailSubject = isReservation
      ? `Reservation Request Received - Corrado's Restaurant`
      : isCareers
        ? `Application Received - Corrado's Restaurant`
        : `Message Received - Corrado's Restaurant`;

    const htmlContent = this.getEmailWrapper(`
          ${this.getEmailHeader(isReservation ? 'Reservation Request Received' : isCareers ? 'Application Received' : 'Message Received')}

          <!-- Content -->
          <tr>
            <td class="content-pad" style="padding: 45px 35px;">
              <p style="color: #2D2926; font-size: 18px; margin: 0 0 8px 0; font-family: Georgia, 'Times New Roman', serif;">Dear ${name},</p>

              <p style="color: #5C524D; line-height: 1.85; font-size: 15px; margin: 20px 0 28px 0;">
                ${
                  isReservation
                    ? "Thank you for your party reservation request at Corrado's Restaurant. We have received your booking details and our team will review and confirm your reservation shortly."
                    : isCareers
                      ? "Thank you for your interest in joining the Corrado's Restaurant team. We have received your application and our hiring team will review it carefully."
                      : "Thank you for reaching out to Corrado's Restaurant. We have received your message and our team will respond within 24 hours."
                }
              </p>

              ${reservationConfirmHtml}
              ${careersConfirmHtml}

              <!-- What they sent -->
              <div style="background: #FFFCF8; padding: 24px; border-radius: 4px; border: 1px solid #E8E0D8; margin: 28px 0;">
                <p style="color: #5C524D; font-weight: 600; margin: 0 0 12px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Your Message</p>
                <p style="color: #5C524D; line-height: 1.75; margin: 0; font-style: italic; font-size: 14px;">"${message}"</p>
              </div>

              <!-- Contact Info -->
              <div style="background: #FDF8F4; padding: 28px; border-radius: 4px; text-align: center; margin-top: 32px;">
                <p style="color: #2D2926; font-weight: 600; margin: 0 0 18px 0; font-size: 15px;">Need to reach us sooner?</p>
                <table style="width: 100%; max-width: 320px; margin: 0 auto; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #5C524D; font-size: 14px;">Phone</td>
                    <td style="padding: 8px 0; text-align: right;"><a href="tel:+19056553100" style="color: #BE5953; text-decoration: none; font-weight: 500; font-size: 14px;">(905) 655-3100</a></td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #5C524D; font-size: 14px;">Email</td>
                    <td style="padding: 8px 0; text-align: right;"><a href="mailto:corradosrestaurant@rogers.com" style="color: #BE5953; text-decoration: none; font-weight: 500; font-size: 14px;">corradosrestaurant@rogers.com</a></td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #5C524D; font-size: 14px;">Address</td>
                    <td style="padding: 8px 0; text-align: right; color: #2D2926; font-size: 14px;">38 Baldwin Street, Whitby</td>
                  </tr>
                </table>
              </div>

              <p style="color: #5C524D; line-height: 1.8; font-size: 15px; margin: 35px 0 0 0; text-align: center;">
                We look forward to ${isReservation ? "welcoming you to Corrado's Restaurant" : 'connecting with you'}.
              </p>

              <p style="color: #2D2926; font-size: 15px; margin: 25px 0 0 0; text-align: center;">
                Warm regards,<br>
                <span style="color: #5C524D; font-weight: 500;">The Corrado's Restaurant Team</span>
              </p>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding: 0 35px 40px 35px; text-align: center;">
              <a href="https://corradosrestaurant.com" style="display: inline-block; background: #BE5953; color: #ffffff; padding: 16px 42px; border-radius: 2px; text-decoration: none; font-weight: 600; font-size: 13px; letter-spacing: 1px; text-transform: uppercase;">
                Visit Our Website
              </a>
            </td>
          </tr>

          ${this.getEmailFooter()}
    `);

    const textContent = `
Dear ${name},

${
  isReservation
    ? "Thank you for your party reservation request at Corrado's Restaurant. We have received your booking details and our team will review and confirm your reservation shortly."
    : isCareers
      ? "Thank you for your interest in joining the Corrado's Restaurant team. We have received your application and our hiring team will review it carefully."
      : "Thank you for reaching out to Corrado's Restaurant. We have received your message and our team will respond within 24 hours."
}

${
  isReservation
    ? `
YOUR RESERVATION REQUEST
─────────────────────────
Date: ${reservationDate || 'To be confirmed'}
Time: ${reservationTime || 'To be confirmed'}
Party Size: ${guestCount || 'To be confirmed'} guests

We will confirm your reservation within a few hours during business hours.
`
    : isCareers
      ? `
YOUR APPLICATION
─────────────────────────
Position: ${position || 'Not specified'}

Our team will review your application and contact you soon.
`
      : ''
}

YOUR MESSAGE
─────────────────────────
"${message}"


NEED TO REACH US SOONER?
─────────────────────────
Phone: (905) 655-3100
Email: corradosrestaurant@rogers.com
Address: 38 Baldwin Street, Whitby, ON

We look forward to ${isReservation ? "welcoming you to Corrado's Restaurant" : 'connecting with you'}.

Warm regards,
The Corrado's Restaurant Team

─────────────────────────
Corrado's Restaurant & Bar
38 Baldwin Street, Whitby, ON L1M 1A2
corradosrestaurant.com
    `;

    // Get the appropriate transporter and email from based on subject
    const transporter = this.getTransporter(subject);
    const emailFrom = this.getEmailFrom(subject);

    const mailOptions = {
      from: emailFrom,
      to: email,
      subject: emailSubject,
      text: textContent,
      html: htmlContent,
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      this.logger.log(
        `Customer confirmation email sent to ${email}. Info: ${JSON.stringify(info)}`,
      );
      const preview = nodemailer.getTestMessageUrl(info);
      if (preview) this.logger.log(`Preview URL: ${preview}`);
    } catch (error) {
      this.logger.error('Failed to send customer confirmation email:', error);
      // Don't throw - pub notification is more important
    }
  }
}
