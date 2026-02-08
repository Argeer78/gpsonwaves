import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !(session.user as any).isAdmin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Parallel Data Fetching
        const [totalUsers, proUsers, recentUsers] = await Promise.all([
            prisma.user.count(),
            prisma.user.count({ where: { isPro: true } }),
            prisma.user.findMany({
                take: 5,
                orderBy: { createdAt: 'desc' },
                select: { name: true, createdAt: true }
            })
        ]);

        // Revenue (Mock for now, $0 if no subscription system active)
        const revenue = proUsers * 10; // Assuming $10/mo

        return NextResponse.json({
            users: {
                total: totalUsers,
                pro: proUsers,
                growth: "+100%" // Placeholder until we track historical data
            },
            revenue: {
                total: revenue,
                growth: "+0%"
            },
            activity: recentUsers.map(u => ({
                msg: `New user joined: ${u.name || 'someone'}`,
                time: new Date(u.createdAt).toLocaleTimeString(),
                type: 'user'
            }))
        });

    } catch (error) {
        console.error("Admin Stats Error:", error);
        return NextResponse.json({ error: "Server Error" }, { status: 500 });
    }
}
