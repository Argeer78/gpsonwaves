
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { PrismaClient } from "@prisma/client";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

export async function PATCH(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { name, boatSettings, preferences } = body;

        // Update user in database
        const updatedUser = await prisma.user.update({
            where: {
                email: session.user.email,
            },
            data: {
                name,
                boatSettings, // Prisma handles JSON automatically
                preferences,
            },
        });

        return NextResponse.json({ success: true, user: updatedUser });

    } catch (error) {
        console.error("PROFILE_UPDATE_ERROR", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
