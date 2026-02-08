import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(req: Request) {
    try {
        const { token, password } = await req.json();

        if (!token || !password) {
            return NextResponse.json({ error: "Missing token or password" }, { status: 400 });
        }

        // 1. Verify Token
        const verificationToken = await prisma.verificationToken.findUnique({
            where: { token },
        });

        if (!verificationToken) {
            return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
        }

        // 2. Check Expiry
        if (new Date() > verificationToken.expires) {
            // Delete expired token
            await prisma.verificationToken.delete({ where: { token } });
            return NextResponse.json({ error: "Token expired" }, { status: 400 });
        }

        // 3. Find User
        const user = await prisma.user.findUnique({
            where: { email: verificationToken.identifier },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // 4. Hash New Password
        const hashedPassword = await bcrypt.hash(password, 10);

        // 5. Update User & Delete Token
        await prisma.$transaction([
            prisma.user.update({
                where: { id: user.id },
                data: { password: hashedPassword },
            }),
            prisma.verificationToken.delete({
                where: { token },
            }),
        ]);

        return NextResponse.json({ success: true, message: "Password updated successfully" });

    } catch (error) {
        console.error("Reset Password API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
