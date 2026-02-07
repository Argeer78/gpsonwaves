import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { sendWelcomeEmail } from "@/lib/mail";

const prisma = new PrismaClient();

export async function POST(req: Request) {
    try {
        const { email, code } = await req.json();

        if (!email || !code) {
            return new NextResponse("Missing email or code", { status: 400 });
        }

        // Find token using 'identifier' (email) + 'token' (code)
        // Note: Schema has @@unique([identifier, token])
        const verificationToken = await prisma.verificationToken.findUnique({
            where: {
                identifier_token: {
                    identifier: email,
                    token: code,
                },
            },
        });

        if (!verificationToken) {
            return new NextResponse("Invalid code", { status: 400 });
        }

        // Check if expired
        if (new Date() > verificationToken.expires) {
            return new NextResponse("Code expired", { status: 400 });
        }

        // Verify User
        const user = await prisma.user.update({
            where: { email },
            data: {
                emailVerified: new Date(),
            },
        });

        // Delete token (or keep for logs? usually delete)
        await prisma.verificationToken.delete({
            where: {
                identifier_token: {
                    identifier: email,
                    token: code,
                },
            },
        });

        // Send Welcome Email (Non-blocking)
        try {
            await sendWelcomeEmail(email, user.name || 'Captain');
        } catch (e) {
            console.error("Failed to send welcome email", e);
        }

        return NextResponse.json({ success: true, user });
    } catch (error) {
        console.error("VERIFY_ERROR", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
