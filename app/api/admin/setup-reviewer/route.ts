import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: Request) {
    try {
        const email = "review@gpsonwaves.com";
        const password = "Review123!";
        const hashedPassword = await bcrypt.hash(password, 12);

        const user = await prisma.user.upsert({
            where: { email },
            update: {
                password: hashedPassword,
                isPro: true,
                emailVerified: new Date(),
            },
            create: {
                email,
                password: hashedPassword,
                isPro: true,
                emailVerified: new Date(),
            },
        });

        return NextResponse.json({
            success: true,
            message: `User ${user.email} created/updated with Pro status.`
        });
    } catch (error) {
        console.error("SETUP_REVIEWER_ERROR", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
