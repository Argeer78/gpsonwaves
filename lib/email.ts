import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_SERVER_HOST,
    port: Number(process.env.EMAIL_SERVER_PORT),
    secure: true, // true for 465, false for others
    auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD,
    },
});

export async function sendPasswordResetEmail(email: string, token: string) {
    const resetLink = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;

    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h2 style="color: #0f172a;">Reset Your Password</h2>
        <p>Hello,</p>
        <p>We received a request to reset your password for GPSonWaves. If you didn't make this request, you can safely ignore this email.</p>
        <p>Click the button below to reset your password:</p>
        <a href="${resetLink}" style="display: inline-block; background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 16px 0;">Reset Password</a>
        <p style="font-size: 12px; color: #64748b; margin-top: 24px;">Or copy and paste this link into your browser:<br>${resetLink}</p>
    </div>
    `;

    try {
        await transporter.sendMail({
            from: `"GPSonWaves Support" <${process.env.EMAIL_FROM}>`,
            to: email,
            subject: 'Reset Your Password - GPSonWaves',
            html,
        });
        console.log(`Email sent to ${email}`);
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        return false;
    }
}
