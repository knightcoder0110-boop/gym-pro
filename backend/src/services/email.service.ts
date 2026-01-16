import { Resend } from 'resend';

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Email configuration
 * For local testing, use Resend's onboarding domain: onboarding@resend.dev
 * For production, add and verify your custom domain in Resend dashboard
 */
const EMAIL_CONFIG = {
  from: process.env.EMAIL_FROM || 'GymPro <onboarding@resend.dev>',
  replyTo: process.env.EMAIL_REPLY_TO || undefined,
};

/**
 * Email templates for different notification types
 */
const emailTemplates = {
  welcome: (data: {
    memberName: string;
    gymName: string;
    memberId: string;
    planName: string;
    startDate: string;
    endDate: string;
  }) => ({
    subject: `Welcome to ${data.gymName}! 🎉`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to ${data.gymName}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
          .cta-button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Welcome to ${data.gymName}! 💪</h1>
        </div>
        <div class="content">
          <p>Hi <strong>${data.memberName}</strong>,</p>
          <p>Welcome to the ${data.gymName} family! We're thrilled to have you join us on your fitness journey.</p>
          
          <div class="info-box">
            <h3>Your Membership Details</h3>
            <p><strong>Member ID:</strong> ${data.memberId}</p>
            <p><strong>Plan:</strong> ${data.planName}</p>
            <p><strong>Start Date:</strong> ${data.startDate}</p>
            <p><strong>Valid Until:</strong> ${data.endDate}</p>
          </div>
          
          <p>Here's what you can do next:</p>
          <ul>
            <li>📱 Download our app and use your Member ID to check-in</li>
            <li>📅 Explore our class schedule and book your first session</li>
            <li>💪 Meet with a trainer to discuss your fitness goals</li>
          </ul>
          
          <p>If you have any questions, don't hesitate to reach out to our front desk.</p>
          
          <p>Let's crush those fitness goals together!</p>
          
          <p>Best regards,<br>The ${data.gymName} Team</p>
        </div>
        <div class="footer">
          <p>This email was sent to you because you registered at ${data.gymName}.</p>
        </div>
      </body>
      </html>
    `,
  }),

  paymentConfirmation: (data: {
    memberName: string;
    gymName: string;
    amount: number;
    currency: string;
    paymentDate: string;
    paymentMethod: string;
    invoiceNumber?: string;
    description: string;
  }) => ({
    subject: `Payment Received - ${data.currency} ${data.amount.toLocaleString()}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment Confirmation</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .amount { font-size: 36px; font-weight: bold; color: #10b981; margin: 20px 0; }
          .receipt { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .receipt-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
          .receipt-row:last-child { border-bottom: none; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Payment Received ✓</h1>
        </div>
        <div class="content">
          <p>Hi <strong>${data.memberName}</strong>,</p>
          <p>Thank you for your payment! Here's your receipt:</p>
          
          <div class="receipt">
            <div class="amount">${data.currency} ${data.amount.toLocaleString()}</div>
            <div class="receipt-row">
              <span>Description</span>
              <strong>${data.description}</strong>
            </div>
            <div class="receipt-row">
              <span>Payment Method</span>
              <strong>${data.paymentMethod}</strong>
            </div>
            <div class="receipt-row">
              <span>Date</span>
              <strong>${data.paymentDate}</strong>
            </div>
            ${data.invoiceNumber ? `
            <div class="receipt-row">
              <span>Invoice #</span>
              <strong>${data.invoiceNumber}</strong>
            </div>
            ` : ''}
          </div>
          
          <p>Keep this email as your payment confirmation.</p>
          
          <p>Thank you for being a valued member!</p>
          
          <p>Best regards,<br>The ${data.gymName} Team</p>
        </div>
        <div class="footer">
          <p>This is an automated payment confirmation from ${data.gymName}.</p>
        </div>
      </body>
      </html>
    `,
  }),

  expiryReminder: (data: {
    memberName: string;
    gymName: string;
    planName: string;
    expiryDate: string;
    daysLeft: number;
    renewalLink?: string;
  }) => ({
    subject: data.daysLeft === 0 
      ? `⚠️ Your ${data.gymName} membership expires today!`
      : `Your ${data.gymName} membership expires in ${data.daysLeft} day${data.daysLeft > 1 ? 's' : ''}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Membership Expiry Reminder</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, ${data.daysLeft <= 1 ? '#ef4444, #dc2626' : '#f59e0b, #d97706'}); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .alert-box { background: ${data.daysLeft <= 1 ? '#fef2f2' : '#fffbeb'}; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${data.daysLeft <= 1 ? '#ef4444' : '#f59e0b'}; }
          .cta-button { display: inline-block; background: #667eea; color: white; padding: 14px 35px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${data.daysLeft === 0 ? '⚠️ Expires Today!' : `⏰ ${data.daysLeft} Day${data.daysLeft > 1 ? 's' : ''} Left`}</h1>
        </div>
        <div class="content">
          <p>Hi <strong>${data.memberName}</strong>,</p>
          
          <div class="alert-box">
            <strong>Your ${data.planName} membership ${data.daysLeft === 0 ? 'expires today' : `will expire on ${data.expiryDate}`}!</strong>
          </div>
          
          <p>Don't let your fitness journey take a break! Renew your membership to continue enjoying:</p>
          <ul>
            <li>✓ Full access to gym equipment</li>
            <li>✓ Group fitness classes</li>
            <li>✓ All the facilities you love</li>
          </ul>
          
          <p style="text-align: center;">
            <a href="${data.renewalLink || '#'}" class="cta-button">Renew Now</a>
          </p>
          
          <p>Visit our front desk or renew online to keep your momentum going!</p>
          
          <p>Stay fit,<br>The ${data.gymName} Team</p>
        </div>
        <div class="footer">
          <p>You're receiving this because your membership is expiring soon.</p>
        </div>
      </body>
      </html>
    `,
  }),

  classBookingConfirmation: (data: {
    memberName: string;
    gymName: string;
    className: string;
    instructorName: string;
    classDate: string;
    classTime: string;
    location: string;
  }) => ({
    subject: `Class Booked: ${data.className} on ${data.classDate}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Class Booking Confirmation</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .class-card { background: white; padding: 25px; border-radius: 12px; margin: 20px 0; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
          .class-title { font-size: 24px; font-weight: bold; color: #6366f1; margin-bottom: 15px; }
          .class-detail { display: flex; align-items: center; margin: 12px 0; }
          .class-detail .icon { font-size: 20px; margin-right: 12px; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Class Booked! 🎯</h1>
        </div>
        <div class="content">
          <p>Hi <strong>${data.memberName}</strong>,</p>
          <p>Great choice! Your class has been confirmed:</p>
          
          <div class="class-card">
            <div class="class-title">${data.className}</div>
            <div class="class-detail">
              <span class="icon">📅</span>
              <span><strong>Date:</strong> ${data.classDate}</span>
            </div>
            <div class="class-detail">
              <span class="icon">⏰</span>
              <span><strong>Time:</strong> ${data.classTime}</span>
            </div>
            <div class="class-detail">
              <span class="icon">👤</span>
              <span><strong>Instructor:</strong> ${data.instructorName}</span>
            </div>
            <div class="class-detail">
              <span class="icon">📍</span>
              <span><strong>Location:</strong> ${data.location}</span>
            </div>
          </div>
          
          <p><strong>Reminder:</strong> Please arrive 5-10 minutes early to get set up.</p>
          
          <p>See you there!</p>
          
          <p>Best,<br>The ${data.gymName} Team</p>
        </div>
        <div class="footer">
          <p>Need to cancel? Please do so at least 2 hours before the class.</p>
        </div>
      </body>
      </html>
    `,
  }),
};

export type EmailTemplateType = keyof typeof emailTemplates;

export const emailService = {
  /**
   * Send welcome email to new member
   */
  async sendWelcomeEmail(data: {
    to: string;
    memberName: string;
    gymName: string;
    memberId: string;
    planName: string;
    startDate: string;
    endDate: string;
  }) {
    const template = emailTemplates.welcome({
      memberName: data.memberName,
      gymName: data.gymName,
      memberId: data.memberId,
      planName: data.planName,
      startDate: data.startDate,
      endDate: data.endDate,
    });

    return this.sendEmail({
      to: data.to,
      subject: template.subject,
      html: template.html,
    });
  },

  /**
   * Send payment confirmation email
   */
  async sendPaymentConfirmation(data: {
    to: string;
    memberName: string;
    gymName: string;
    amount: number;
    currency: string;
    paymentDate: string;
    paymentMethod: string;
    invoiceNumber?: string;
    description: string;
  }) {
    const template = emailTemplates.paymentConfirmation(data);

    return this.sendEmail({
      to: data.to,
      subject: template.subject,
      html: template.html,
    });
  },

  /**
   * Send membership expiry reminder
   */
  async sendExpiryReminder(data: {
    to: string;
    memberName: string;
    gymName: string;
    planName: string;
    expiryDate: string;
    daysLeft: number;
    renewalLink?: string;
  }) {
    const template = emailTemplates.expiryReminder(data);

    return this.sendEmail({
      to: data.to,
      subject: template.subject,
      html: template.html,
    });
  },

  /**
   * Send class booking confirmation
   */
  async sendClassBookingConfirmation(data: {
    to: string;
    memberName: string;
    gymName: string;
    className: string;
    instructorName: string;
    classDate: string;
    classTime: string;
    location: string;
  }) {
    const template = emailTemplates.classBookingConfirmation(data);

    return this.sendEmail({
      to: data.to,
      subject: template.subject,
      html: template.html,
    });
  },

  /**
   * Core email sending function
   */
  async sendEmail(params: {
    to: string | string[];
    subject: string;
    html: string;
    text?: string;
  }) {
    try {
      const { data, error } = await resend.emails.send({
        from: EMAIL_CONFIG.from,
        to: params.to,
        subject: params.subject,
        html: params.html,
        text: params.text,
        replyTo: EMAIL_CONFIG.replyTo,
      });

      if (error) {
        console.error('Email send error:', error);
        throw new Error(error.message);
      }

      console.log('Email sent successfully:', data?.id);
      return { success: true, id: data?.id };
    } catch (error) {
      console.error('Failed to send email:', error);
      throw error;
    }
  },
};

export default emailService;
