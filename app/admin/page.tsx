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

    useEffect(() => {
        if (!isLoading) {
            if (!user || user.email.toLowerCase() !== 'sgouros2305@gmail.com') {
                router.push('/');
            } else if (!isAuthorized) {
                setIsAuthorized(true);
            }
        }
    }, [user, isLoading, router, isAuthorized]);


    if (isLoading || !isAuthorized) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a0a] pt-24 pb-12 px-4 md:px-8 font-sans">
            <div className="max-w-7xl mx-auto space-y-8">

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
                            <h1 className="text-3xl font-bold text-white font-outfit mb-1">Admin Dashboard</h1>
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
                        value="1,248"
                        change="12%"
                        isPositive={true}
                        icon={Users}
                    />
                    <AdminStatsCard
                        title="Pro Subscribers"
                        value="342"
                        change="8.4%"
                        isPositive={true}
                        icon={Shield}
                    />
                    <AdminStatsCard
                        title="Monthly Revenue"
                        value="$3,416"
                        change="5.2%"
                        isPositive={true}
                        icon={DollarSign}
                    />
                    <AdminStatsCard
                        title="Active Scans Today"
                        value="156"
                        change="-2.1%"
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

                    {/* Row 2: Analytics & Status Cards */}
                    <div className="flex flex-col lg:flex-row gap-8 w-full">

                        {/* Platform Activity */}
                        <div className="flex-1 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 h-full">
                            <h3 className="text-lg font-semibold text-white mb-4">Platform Activity</h3>
                            <div className="space-y-4">
                                {[
                                    { msg: "New user signed up", time: "2m ago", type: "user" },
                                    { msg: "Pro subscription started", time: "15m ago", type: "sale" },
                                    { msg: "Reef scan completed (Cyclades)", time: "42m ago", type: "scan" },
                                    { msg: "New user signed up", time: "1h ago", type: "user" },
                                    { msg: "Structure scan (depth) used", time: "2h ago", type: "scan" },
                                ].map((item, i) => (
                                    <div key={i} className="flex gap-3 items-start">
                                        <div className={`w-2 h-2 mt-2 rounded-full ${newItemColor(item.type)
                                            }`} />
                                        <div>
                                            <div className="text-sm text-white/80">{item.msg}</div>
                                            <div className="text-xs text-white/30">{item.time}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Server Status */}
                        <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 backdrop-blur-md border border-white/10 rounded-2xl p-6 h-full">
                            <h3 className="text-lg font-semibold text-white mb-4">Server Status</h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between text-sm p-3 bg-white/5 rounded-xl border border-white/5">
                                    <span className="text-white/70">WFS API (Coral Atlas)</span>
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]"></div>
                                        <span className="text-emerald-400 font-medium">Operational</span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between text-sm p-3 bg-white/5 rounded-xl border border-white/5">
                                    <span className="text-white/70">Weather API</span>
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]"></div>
                                        <span className="text-emerald-400 font-medium">Operational</span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between text-sm p-3 bg-white/5 rounded-xl border border-white/5">
                                    <span className="text-white/70">Database (Simulated)</span>
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]"></div>
                                        <span className="text-emerald-400 font-medium">Synced</span>
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
