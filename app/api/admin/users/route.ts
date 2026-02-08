import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        // 1. Security Check: Must be Admin
        if (!session || !(session.user as any).isAdmin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 2. Fetch Users
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                image: true,
                isPro: true,
                isAdmin: true,
                createdAt: true,
                emailVerified: true
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 50 // Limit for now
        });

        // 3. Format for Frontend
        const formattedUsers = users.map(user => ({
            id: user.id,
            name: user.name || 'Unknown',
            email: user.email || 'No Email',
            role: user.isAdmin ? 'Admin' : user.isPro ? 'Pro' : 'Free',
            status: user.emailVerified ? 'Active' : 'Pending',
            joinDate: new Date(user.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            }),
            image: user.image
        }));

        return NextResponse.json(formattedUsers);

    } catch (error) {
        console.error("Admin API Error:", error);
        return NextResponse.json({ error: "Server Error" }, { status: 500 });
    }
}
