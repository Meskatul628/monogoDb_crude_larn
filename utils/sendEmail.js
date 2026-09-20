const nodemailer = require("nodemailer");

// 📧 Nodemailer দিয়ে ইমেইল পাঠানোর হেলপার মেথড
const sendEmail = async (options) => {
  // ১. Transporter তৈরি করা (Gmail/SMTP Server)
  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, // Gmail App Password
    },
  });

  // ২. ইমেইল এর বিষয়বস্তু সাজানো
  const mailOptions = {
    from: `"Auth Service" <${process.env.EMAIL_USER}>`,
    to: options.email,
    subject: options.subject,
    html: options.htmlMessage,
  };

  // ৩. ইমেইল সেন্ড করা
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
