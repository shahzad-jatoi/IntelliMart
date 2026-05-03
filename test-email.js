require('dotenv').config({path: './server/.env'});
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: { rejectUnauthorized: false }
});

transporter.verify(function(error, success) {
  if (error) {
    console.log("ERROR:", error);
  } else {
    console.log("SUCCESS: Server is ready to take our messages");
  }
});
