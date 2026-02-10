import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const smtpHost = process.env.SMTP_HOST || '';
const smtpPort = Number(process.env.SMTP_PORT) || 587;
const smtpUser = process.env.SMTP_USER || '';
const smtpPass = process.env.SMTP_PASS || '';
const fromEmail = process.env.FROM_EMAIL || smtpUser || 'no-reply@example.com';

let transporter: nodemailer.Transporter | null = null;

function createTransporter() {
  if (smtpHost && smtpUser && smtpPass) {
    return nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: { user: smtpUser, pass: smtpPass },
    });
  }
  // No SMTP configured, return null to allow fallback to test account
  return null;
}

transporter = createTransporter();

async function verifyTransporter() {
  if (!transporter) {
    console.warn('No SMTP transporter configured; debug endpoints will use Ethereal test account');
    return;
  }
  try {
    await transporter.verify();
    console.log('SMTP transporter verified successfully');
  } catch (err) {
    console.warn('SMTP transporter verification failed:', err);
  }
}

verifyTransporter();

function getOtpEmailHtml(otp: string, ttlMinutes: number): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ClinicConnect OTP</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #f5f5f5;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      border-radius: 8px;
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 40px 20px;
      text-align: center;
      color: #ffffff;
    }
    .header-logo {
      font-size: 28px;
      font-weight: bold;
      margin: 0;
      letter-spacing: -0.5px;
    }
    .content {
      padding: 40px 30px;
      text-align: center;
    }
    .greeting {
      font-size: 18px;
      color: #333333;
      margin-bottom: 24px;
      line-height: 1.6;
    }
    .otp-label {
      font-size: 12px;
      color: #666666;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 12px;
      font-weight: 600;
    }
    .otp-box {
      background-color: #f9f9f9;
      border: 2px solid #667eea;
      border-radius: 8px;
      padding: 30px;
      margin: 24px 0;
    }
    .otp-code {
      font-size: 48px;
      font-weight: bold;
      color: #667eea;
      letter-spacing: 4px;
      font-family: 'Courier New', monospace;
      margin: 0;
      word-break: break-all;
    }
    @media (max-width: 480px) {
      .otp-code {
        font-size: 32px;
        letter-spacing: 2px;
      }
      .otp-box {
        padding: 20px;
        margin: 16px 0;
      }
    }
    .validity {
      font-size: 14px;
      color: #e74c3c;
      margin-top: 20px;
      font-weight: 500;
    }
    .security-note {
      background-color: #f0f4ff;
      border-left: 4px solid #667eea;
      padding: 16px;
      margin: 24px 0;
      text-align: left;
      border-radius: 4px;
    }
    .security-note-title {
      font-weight: 600;
      color: #333333;
      margin-bottom: 8px;
      font-size: 14px;
    }
    .security-note-text {
      font-size: 13px;
      color: #666666;
      margin: 0;
      line-height: 1.5;
    }
    .footer {
      background-color: #f5f5f5;
      padding: 24px 30px;
      border-top: 1px solid #e0e0e0;
      text-align: center;
      font-size: 12px;
      color: #999999;
    }
    .footer-text {
      margin: 8px 0;
      line-height: 1.6;
    }
    .divider {
      height: 1px;
      background-color: #e0e0e0;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <h1 class="header-logo">ClinicConnect</h1>
    </div>

    <!-- Content -->
    <div class="content">
      <p class="greeting">Hello,</p>
      <p style="font-size: 16px; color: #555555; margin-bottom: 20px;">
        We received a request to access your ClinicConnect account. Use the code below to verify your identity.
      </p>

      <!-- OTP Box -->
      <div class="otp-box">
        <div class="otp-label">Your One-Time Password</div>
        <p class="otp-code">${otp}</p>
      </div>

      <!-- Validity -->
      <div class="validity">
        ⏱️ Valid for ${ttlMinutes} minutes only
      </div>

      <!-- Security Note -->
      <div class="security-note">
        <div class="security-note-title">🔒 Security Notice</div>
        <p class="security-note-text">
          Never share this code with anyone. ClinicConnect staff will never ask you for this code via email, phone, or message.
        </p>
      </div>

      <p style="font-size: 14px; color: #666666; margin-top: 30px;">
        If you didn't request this code, you can safely ignore this email.
      </p>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p class="footer-text">© 2026 ClinicConnect. All rights reserved.</p>
      <p class="footer-text">This is an automated message, please do not reply to this email.</p>
      <p class="footer-text">
        <a href="#" style="color: #667eea; text-decoration: none;">Contact Support</a> | 
        <a href="#" style="color: #667eea; text-decoration: none;">Privacy Policy</a>
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

export async function sendOtpEmail(to: string, otp: string, ttlMinutes = 10) {
  const subject = 'Your ClinicConnect OTP';
  const text = `Your ClinicConnect OTP is ${otp}. It is valid for ${ttlMinutes} minutes.`;
  const html = getOtpEmailHtml(otp, ttlMinutes);

  try {
    if (transporter) {
      console.log('[sendOtpEmail] Sending via configured SMTP');
      await transporter.sendMail({ from: fromEmail, to, subject, text, html });
      console.log('[sendOtpEmail] Email sent via SMTP');
      return { ok: true };
    }

    // Fallback to Ethereal test account for development
    console.log('[sendOtpEmail] Using Ethereal fallback (no SMTP configured)');
    const testAccount = await nodemailer.createTestAccount();
    const testTransport = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });
    const info = await testTransport.sendMail({ from: fromEmail, to, subject, text, html });
    const preview = nodemailer.getTestMessageUrl(info) || '';
    console.log('[sendOtpEmail] Ethereal preview URL:', preview);
    return { ok: true, preview };
  } catch (err) {
    console.error('[sendOtpEmail] Failed to send OTP email:', err);
    throw err;
  }
}

export async function sendTestEmail(to: string) {
  const testAccount = await nodemailer.createTestAccount();
  const testTransport = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: { user: testAccount.user, pass: testAccount.pass },
  });
  const info = await testTransport.sendMail({ from: fromEmail, to, subject: 'Test email from ClinicConnect', text: 'This is a test email', html: '<p>This is a test email</p>' });
  return nodemailer.getTestMessageUrl(info) || '';
}

function getContactEmailHtml(name: string, email: string, message: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Contact Form Submission</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #f5f5f5;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      border-radius: 8px;
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 40px 20px;
      text-align: center;
      color: #ffffff;
    }
    .header-logo {
      font-size: 28px;
      font-weight: bold;
      margin: 0;
      letter-spacing: -0.5px;
    }
    .content {
      padding: 40px 30px;
    }
    .section-title {
      font-size: 14px;
      color: #666666;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 12px;
      font-weight: 600;
    }
    .info-box {
      background-color: #f9f9f9;
      border-left: 4px solid #667eea;
      padding: 16px;
      margin-bottom: 20px;
      border-radius: 4px;
    }
    .info-label {
      font-size: 12px;
      color: #999999;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 6px;
      font-weight: 600;
    }
    .info-value {
      font-size: 16px;
      color: #333333;
      margin: 0;
      word-break: break-word;
    }
    .message-box {
      background-color: #f9f9f9;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 20px;
      margin: 24px 0;
      white-space: pre-wrap;
      word-wrap: break-word;
      color: #333333;
      font-size: 14px;
      line-height: 1.6;
    }
    .footer {
      background-color: #f5f5f5;
      padding: 24px 30px;
      border-top: 1px solid #e0e0e0;
      text-align: center;
      font-size: 12px;
      color: #999999;
    }
    .footer-text {
      margin: 8px 0;
      line-height: 1.6;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <h1 class="header-logo">ClinicConnect</h1>
      <p style="margin: 12px 0 0 0; font-size: 16px; opacity: 0.9;">New Contact Form Submission</p>
    </div>

    <!-- Content -->
    <div class="content">
      <p style="font-size: 16px; color: #555555; margin-bottom: 24px;">
        You have received a new message from your contact form.
      </p>

      <!-- Sender Info -->
      <div class="info-box">
        <div class="info-label">Name</div>
        <p class="info-value">${name}</p>
      </div>

      <div class="info-box">
        <div class="info-label">Email Address</div>
        <p class="info-value"><a href="mailto:${email}" style="color: #667eea; text-decoration: none;">${email}</a></p>
      </div>

      <!-- Message -->
      <div style="margin-top: 24px;">
        <div class="section-title">Message</div>
        <div class="message-box">${message}</div>
      </div>

      <p style="font-size: 13px; color: #999999; margin-top: 24px;">
        To reply to this message, click the email address above or use your email client to respond directly.
      </p>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p class="footer-text">© 2026 ClinicConnect. All rights reserved.</p>
      <p class="footer-text">This is an automated message from your contact form submission.</p>
    </div>
  </div>
</body>
</html>
  `;
}

export async function sendContactEmail(fromName: string, fromEmail: string, message: string) {
  const subject = `New Contact Form Submission from ${fromName}`;
  const text = `Name: ${fromName}\nEmail: ${fromEmail}\n\nMessage:\n${message}`;
  const html = getContactEmailHtml(fromName, fromEmail, message);
  const toEmail = 'miniprojecttt12@gmail.com'; // Admin email

  try {
    if (transporter) {
      console.log('[sendContactEmail] Sending via configured SMTP to', toEmail);
      await transporter.sendMail({ from: process.env.FROM_EMAIL || fromEmail, to: toEmail, subject, text, html });
      console.log('[sendContactEmail] Email sent via SMTP');
      return { ok: true };
    }

    // Fallback to Ethereal test account for development
    console.log('[sendContactEmail] Using Ethereal fallback (no SMTP configured)');
    const testAccount = await nodemailer.createTestAccount();
    const testTransport = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });
    const info = await testTransport.sendMail({ from: process.env.FROM_EMAIL || fromEmail, to: toEmail, subject, text, html });
    const preview = nodemailer.getTestMessageUrl(info) || '';
    console.log('[sendContactEmail] Ethereal preview URL:', preview);
    return { ok: true, preview };
  } catch (err) {
    console.error('[sendContactEmail] Failed to send contact email:', err);
    throw err;
  }
}

export default sendOtpEmail;

