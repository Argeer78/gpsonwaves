'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUser } from '@/context/UserContext';
import { Shield, Users, DollarSign, Activity, ChevronLeft } from 'lucide-react';
import { AdminStatsCard } from '@/components/admin/AdminStatsCard';
import { AdminUserTable } from '@/components/admin/AdminUserTable';

export default function AdminPage() {
    const { user, isLoading } = useUser();
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [stats, setStats] = useState<any>(null);

    useEffect(() => {
        if (!isLoading) {
            if (!user || !user.email || user.email.toLowerCase() !== 'sgouros2305@gmail.com') {
                router.push('/');
            } else if (!isAuthorized) {
                setIsAuthorized(true);
            }
        }
    }, [user, isLoading, router, isAuthorized]);

    // Fetch Stats
    useEffect(() => {
        async function fetchStats() {
            try {
                const res = await fetch('/api/admin/stats');
                if (res.ok) {
                    const data = await res.json();
                    setStats(data);
                }
            } catch (error) {
                console.error("Failed to fetch stats", error);
            }
        }
        if (isAuthorized) fetchStats();
    }, [isAuthorized]);


    if (isLoading || !isAuthorized) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a0a] pt-24 pb-12 px-4 md:px-8 font-sans">
            <div className="space-y-8 w-full" style={{ maxWidth: '1200px', margin: '0 auto' }}>

                {/* Header */}
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/"
                            className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-white/70 hover:text-white transition-colors flex items-center gap-2"
                            title="Return to Map"
                        >
                            <ChevronLeft size={20} />
                            <span className="text-sm font-medium">Back</span>
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold text-white font-outfit mb-1">Admin Dashboard (v2.2)</h1>
                            <p className="text-white/50 text-sm">Overview of platform statistics and user activity</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <span className="px-3 py-1 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full text-xs font-medium flex items-center gap-2">
                            <Shield size={14} /> Global Admin
                        </span>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <AdminStatsCard
                        title="Total Users"
                        value={stats ? stats.users.total.toString() : "..."}
                        change={stats ? stats.users.growth : "..."}
                        isPositive={true}
                        icon={Users}
                    />
                    <AdminStatsCard
                        title="Pro Subscribers"
                        value={stats ? stats.users.pro.toString() : "..."}
                        change="0%"
                        isPositive={true}
                        icon={Shield}
                    />
                    <AdminStatsCard
                        title="Est. Revenue"
                        value={stats ? `$${stats.revenue.total}` : "..."}
                        change={stats ? stats.revenue.growth : "..."}
                        isPositive={true}
                        icon={DollarSign}
                    />
                    <AdminStatsCard
                        title="Active Scans"
                        value="0"
                        change="0%"
                        isPositive={false}
                        icon={Activity}
                    />
                </div>

                {/* Content Rows */}
                <div className="space-y-8">

                    {/* Row 1: Users Table (Full Width) */}
                    <div className="w-full">
                        <AdminUserTable />
                    </div>

                    {/* Row 2: Analytics & Status Cards (Grid Layout instead of Flex) */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">

                        {/* Recent Activity (Takes 2/3 width on large screens) */}
                        <div className="lg:col-span-2 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 h-full">
                            <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
                            <div className="space-y-4">
                                {stats && stats.activity ? stats.activity.map((item: any, i: number) => (
                                    <div key={i} className="flex gap-3 items-start">
                                        <div className={`w-2 h-2 mt-2 rounded-full ${newItemColor(item.type)
                                            }`} />
                                        <div>
                                            <div className="text-sm text-white/80">{item.msg}</div>
                                            <div className="text-xs text-white/30">{item.time}</div>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="text-white/30 text-sm">No recent activity</div>
                                )}
                            </div>
                        </div>

                        {/* Server Status (Takes 1/3 width on large screens) */}
                        <div className="lg:col-span-1 bg-gradient-to-br from-blue-600/20 to-purple-600/20 backdrop-blur-md border border-white/10 rounded-2xl p-6 h-full">
                            <h3 className="text-lg font-semibold text-white mb-4">Server Status</h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between text-sm p-3 bg-white/5 rounded-xl border border-white/5">
                                    <span className="text-white/70">WFS API</span>
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]"></div>
                                        <span className="text-emerald-400 font-medium">OK</span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between text-sm p-3 bg-white/5 rounded-xl border border-white/5">
                                    <span className="text-white/70">Weather</span>
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]"></div>
                                        <span className="text-emerald-400 font-medium">OK</span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between text-sm p-3 bg-white/5 rounded-xl border border-white/5">
                                    <span className="text-white/70">Database</span>
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]"></div>
                                        <span className="text-emerald-400 font-medium">OK</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

            </div>
        </div>
    );
}

function newItemColor(type: string) {
    if (type === 'sale') return 'bg-emerald-400';
    if (type === 'scan') return 'bg-blue-400';
    return 'bg-white/50';
}
