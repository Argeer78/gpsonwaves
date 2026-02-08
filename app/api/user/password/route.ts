
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { PrismaClient } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { currentPassword, newPassword } = body;

        if (!currentPassword || !newPassword) {
            return new NextResponse("Missing fields", { status: 400 });
        }

        // 1. Get current user password hash
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        if (!user || !user.password) {
            return new NextResponse("User not found or using OAuth", { status: 404 });
        }

        // 2. Verify current password
        const isValid = await bcrypt.compare(currentPassword, user.password);

        if (!isValid) {
            return new NextResponse("Incorrect current password", { status: 401 });
        }

        // 3. Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 12);

        // 4. Update password
        await prisma.user.update({
            where: { email: session.user.email },
            data: {
                password: hashedPassword,
            },
        });

        return NextResponse.json({ success: true, message: "Password updated" });

    } catch (error) {
        console.error("PASSWORD_UPDATE_ERROR", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
