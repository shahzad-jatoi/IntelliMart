const nodemailer = require('nodemailer');

// Create transporter using Gmail App Password
// For production, use a proper email service (SendGrid, Mailgun, etc.)
const createTransporter = () => {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // Use TLS (STARTTLS)
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

/**
 * Send OTP verification email
 * @param {string} to - recipient email
 * @param {string} otp - 6-digit OTP code
 */
const sendOtpEmail = async (to, otp) => {
  const transporter = createTransporter();

  const mailOptions = {
    from: `"IntelliMart" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'IntelliMart - Email Verification Code',
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #060b18; color: #e0e7ef; border-radius: 16px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #00d4ff 0%, #7b61ff 100%); padding: 28px 32px;">
          <h1 style="margin: 0; font-size: 22px; color: #060b18; font-weight: 800; letter-spacing: -0.5px;">IntelliMart</h1>
          <p style="margin: 4px 0 0; font-size: 13px; color: rgba(6,11,24,0.7);">AI-Powered Product Classification</p>
        </div>
        <div style="padding: 32px;">
          <h2 style="margin: 0 0 12px; font-size: 18px; color: #fff;">Verify Your Email</h2>
          <p style="margin: 0 0 24px; font-size: 14px; color: #8892a4; line-height: 1.6;">
            Enter the following verification code to complete your registration on IntelliMart:
          </p>
          <div style="background: rgba(0,212,255,0.06); border: 1px solid rgba(0,212,255,0.15); border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
            <span style="font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #00d4ff; font-family: 'Courier New', monospace;">${otp}</span>
          </div>
          <p style="margin: 0; font-size: 12px; color: #5a6474; line-height: 1.5;">
            This code expires in 10 minutes. If you didn't request this, please ignore this email.
          </p>
        </div>
        <div style="padding: 16px 32px; border-top: 1px solid rgba(255,255,255,0.06); text-align: center;">
          <p style="margin: 0; font-size: 11px; color: #3a4454;">IntelliMart -- 4th Semester BSAI Project</p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`[OTP] Email sent to ${to}`);
    return true;
  } catch (error) {
    // If email fails, log OTP to console so registration can still proceed
    console.log(`\n========================================`);
    console.log(`[OTP] Email delivery failed - showing OTP in console`);
    console.log(`[OTP] Email: ${to}`);
    console.log(`[OTP] Code: ${otp}`);
    console.log(`========================================\n`);
    return true; // Don't block registration
  }
};

/**
 * Send order confirmation email
 */
const sendOrderEmail = async (to, order) => {
  const transporter = createTransporter();

  const itemsHtml = order.items.map(item => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid rgba(255,255,255,0.06); color: #e0e7ef; font-size: 13px;">${item.title}</td>
      <td style="padding: 8px; border-bottom: 1px solid rgba(255,255,255,0.06); color: #8892a4; font-size: 13px; text-align: center;">${item.quantity}</td>
      <td style="padding: 8px; border-bottom: 1px solid rgba(255,255,255,0.06); color: #00d4ff; font-size: 13px; text-align: right;">$${(item.price * item.quantity).toFixed(2)}</td>
    </tr>
  `).join('');

  const mailOptions = {
    from: `"IntelliMart" <${process.env.EMAIL_USER}>`,
    to,
    subject: `IntelliMart - Order Confirmed #${order._id.toString().slice(-8).toUpperCase()}`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #060b18; color: #e0e7ef; border-radius: 16px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #00d4ff 0%, #7b61ff 100%); padding: 28px 32px;">
          <h1 style="margin: 0; font-size: 22px; color: #060b18; font-weight: 800;">Order Confirmed</h1>
        </div>
        <div style="padding: 32px;">
          <p style="color: #8892a4; font-size: 14px;">Order #${order._id.toString().slice(-8).toUpperCase()}</p>
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
            <thead><tr>
              <th style="text-align: left; padding: 8px; color: #5a6474; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Item</th>
              <th style="text-align: center; padding: 8px; color: #5a6474; font-size: 11px; text-transform: uppercase;">Qty</th>
              <th style="text-align: right; padding: 8px; color: #5a6474; font-size: 11px; text-transform: uppercase;">Total</th>
            </tr></thead>
            <tbody>${itemsHtml}</tbody>
          </table>
          <div style="text-align: right; margin-top: 16px; padding-top: 16px; border-top: 1px solid rgba(0,212,255,0.15);">
            <span style="font-size: 18px; font-weight: 800; color: #00d4ff;">Total: $${order.totalAmount.toFixed(2)}</span>
          </div>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('[Email] Order confirmation failed:', error.message);
  }
};

module.exports = { sendOtpEmail, sendOrderEmail };
