import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { sendPasswordResetEmail } from '@/lib/email';

const prisma = new PrismaClient();

export async function POST(req: Request) {
    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json({ error: "Email is required" }, { status: 400 });
        }

        // 1. Check if user exists
        const user = await prisma.user.findUnique({
            where: { email },
        });

        // Security: Don't reveal if user exists, but don't send email if they don't
        if (!user) {
            // Fake success to prevent enumeration
            return NextResponse.json({ success: true, message: "If that email exists, we sent a link." });
        }

        // 2. Generate Token
        const token = crypto.randomBytes(32).toString('hex');
        const expires = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

        // 3. Store in DB (Upsert to handle existing tokens)
        // Note: VerificationToken primary key is compound, but we can delete old ones first
        await prisma.verificationToken.deleteMany({
            where: { identifier: email }
        });

        await prisma.verificationToken.create({
            data: {
                identifier: email,
                token,
                expires
            }
        });

        // 4. Send Email
        const emailSent = await sendPasswordResetEmail(email, token);

        if (!emailSent) {
            return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: "If that email exists, we sent a link." });

    } catch (error) {
        console.error("Forgot Password Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
