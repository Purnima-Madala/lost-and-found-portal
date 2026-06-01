const nodemailer = require('nodemailer');

// Use Ethereal for testing (fake email service)
let transporter = null;

const getTransporter = async () => {
  if (!transporter) {
    const testAccount = await nodemailer.createTestAccount();
    console.log('📧 Ethereal Email Account Created:');
    console.log(`   User: ${testAccount.user}`);
    console.log(`   Pass: ${testAccount.pass}`);
    console.log(`   Preview URL: https://ethereal.email/login`);
    
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
  }
  return transporter;
};

// Generate random verification code
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send verification email
const sendVerificationEmail = async (email, code) => {
  const mailTransporter = await getTransporter();
  
  const mailOptions = {
    from: '"Lost & Found Portal" <test@ethereal.email>',
    to: email,
    subject: 'Verify Your Email - Lost & Found Portal',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Email Verification</h2>
        <p>Your verification code is:</p>
        <h1 style="background-color: #f3f4f6; padding: 20px; text-align: center; font-size: 32px;">${code}</h1>
        <p>This code expires in 10 minutes.</p>
        <p>Welcome to the Lost & Found Portal!</p>
        <hr>
        <p style="color: #666; font-size: 12px;">This is a test email from Ethereal. In production, use real SMTP.</p>
      </div>
    `
  };
  
  const info = await mailTransporter.sendMail(mailOptions);
  console.log('\n📨 Email sent!');
  console.log(`   To: ${email}`);
  console.log(`   Verification Code: ${code}`);
  console.log(`   Preview URL: ${nodemailer.getTestMessageUrl(info)}\n`);
  
  return info;
};

module.exports = { generateVerificationCode, sendVerificationEmail };