const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');

router.post('/', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ message: 'Name, email and message are required' });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"IntelliMart Contact" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      replyTo: email,
      subject: `[IntelliMart Contact] ${subject || 'New Message'} - from ${name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #111417; color: #e1e2e7; padding: 24px; border: 1px solid #323538;">
          <div style="background: #FCD535; color: #3b2f00; padding: 12px 16px; font-weight: 700; font-size: 16px; margin-bottom: 20px;">
            IntelliMart — New Contact Message
          </div>
          <p style="margin: 8px 0;"><strong style="color: #FCD535;">Name:</strong> ${name}</p>
          <p style="margin: 8px 0;"><strong style="color: #FCD535;">Email:</strong> <a href="mailto:${email}" style="color: #3fe397;">${email}</a></p>
          <p style="margin: 8px 0;"><strong style="color: #FCD535;">Subject:</strong> ${subject || 'N/A'}</p>
          <hr style="border: none; border-top: 1px solid #323538; margin: 16px 0;" />
          <p style="margin: 8px 0;"><strong style="color: #FCD535;">Message:</strong></p>
          <p style="margin: 8px 0; line-height: 1.6; white-space: pre-wrap;">${message}</p>
          <hr style="border: none; border-top: 1px solid #323538; margin: 16px 0;" />
          <p style="color: #999079; font-size: 12px;">Sent from IntelliMart contact form at ${new Date().toLocaleString()}</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    res.json({ message: 'Message sent successfully' });
  } catch (err) {
    console.error('Contact form error:', err.message);
    // Fallback: log to console
    console.log('\n=== CONTACT FORM MESSAGE ===');
    console.log(`From: ${req.body.name} <${req.body.email}>`);
    console.log(`Subject: ${req.body.subject || 'N/A'}`);
    console.log(`Message: ${req.body.message}`);
    console.log('============================\n');
    // Still return success so user doesn't get frustrated
    res.json({ message: 'Message received' });
  }
});

module.exports = router;
