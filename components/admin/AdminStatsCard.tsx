import React from 'react';
import { Sparkles, LucideIcon } from 'lucide-react';

type AdminStatsCardProps = {
    title: string;
    value: string;
    change: string;
    isPositive?: boolean;
    icon: LucideIcon;
};

export function AdminStatsCard({ title, value, change, isPositive = true, icon: Icon }: AdminStatsCardProps) {
    return (
        <div className="bg-[#0f172a]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 relative overflow-hidden group hover:border-white/20 transition-all duration-300 shadow-xl">
            {/* Hover Gradient Effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 via-blue-500/0 to-blue-500/5 group-hover:to-blue-500/10 transition-all duration-500" />

            <div className="relative z-10 flex justify-between items-start">
                <div>
                    <h3 className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-2">{title}</h3>
                    <div className="text-4xl font-bold text-white mb-2 font-outfit tracking-tight">{value}</div>
                    <div className={`text-sm font-medium flex items-center gap-1.5 ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                        <div className={`px-1.5 py-0.5 rounded-md text-xs font-bold ${isPositive ? 'bg-emerald-400/10' : 'bg-rose-400/10'}`}>
                            {isPositive ? '+' : ''}{change}
                        </div>
                        <span className="text-white/30 text-xs">vs last month</span>
                    </div>
                </div>

                <div className="p-3.5 bg-gradient-to-br from-white/5 to-white/[0.02] rounded-2xl border border-white/10 text-white/80 shadow-inner group-hover:scale-110 group-hover:text-white transition-all duration-300">
                    <Icon size={24} strokeWidth={1.5} />
                </div>
            </div>
        </div>
    );
}
