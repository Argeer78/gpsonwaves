import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST,
  port: Number(process.env.EMAIL_SERVER_PORT),
  secure: true, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
});

export const sendVerificationEmail = async (email: string, token: string) => {
  try {
    const info = await transporter.sendMail({
      from: `"GPSonWaves Captain" <${process.env.EMAIL_FROM}>`,
      to: email,
      subject: "Verify your GPSonWaves Account",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome Aboard! ⚓</h2>
          <p>Please verify your email address to continue.</p>
          <div style="background: #f4f4f4; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <span style="font-size: 24px; font-weight: bold; letter-spacing: 5px;">${token}</span>
          </div>
          <p>This code will expire in 1 hour.</p>
          <p>Smooth sailing,<br>The GPSonWaves Team</p>
        </div>
      `,
    });
    console.log("Message sent: %s", info.messageId);
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
};

export const sendWelcomeEmail = async (email: string, name: string) => {
  try {
    const info = await transporter.sendMail({
      from: `"GPSonWaves Captain" <${process.env.EMAIL_FROM}>`,
      to: email,
      subject: "Welcome to the Crew! ⚓",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome Aboard, ${name}! 🌊</h2>
          <p>Your account has been successfully verified.</p>
          <p>You can now:</p>
          <ul>
            <li>Save your favorite fishing spots</li>
            <li>Analyze weather and water conditions</li>
            <li>Plan your next trip with precision</li>
          </ul>
          <div style="margin: 20px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://gpsonwaves.com'}/dashboard" style="background: #0070f3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Go to Dashboard</a>
          </div>
          <p>Fair winds and following seas,<br>The GPSonWaves Team</p>
        </div>
      `,
    });
    console.log("Welcome email sent: %s", info.messageId);
    return true;
  } catch (error) {
    console.error("Error sending welcome email:", error);
    return false;
  }
};
