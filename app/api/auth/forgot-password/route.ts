import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { email } = await req.json();

        // TODO: Implement actual email sending logic here
        // For now, we simulate success to allow UI testing
        // You would typically generate a token, save it to DB, and send email via nodemailer

        console.log(`Password reset requested for: ${email}`);

        // Artificial delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        return NextResponse.json({ success: true, message: "If that email exists, we sent a link." });
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
