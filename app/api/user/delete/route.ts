import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function DELETE(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // Delete user (Prisma cascade will handle sessions, accounts, etc.)
        await prisma.user.delete({
            where: {
                email: session.user.email,
            },
        });

        // The session will effectively be invalidated because the user record is gone,
        // but the client-side will also handle sign-out.
        return NextResponse.json({ success: true, message: "Account deleted successfully" });
    } catch (error) {
        console.error("DELETE_ACCOUNT_ERROR", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
