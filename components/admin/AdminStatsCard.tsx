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
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 relative overflow-hidden group">
            <div className="absolute inset-0 bg-blue-500/5 group-hover:bg-blue-500/10 transition-colors" />

            <div className="relative z-10 flex justify-between items-start">
                <div>
                    <h3 className="text-white/50 text-sm font-medium mb-1">{title}</h3>
                    <div className="text-3xl font-bold text-white mb-2 font-outfit">{value}</div>
                    <div className={`text-xs font-medium flex items-center gap-1 ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isPositive ? '+' : ''}{change}
                        <span className="text-white/30 ml-1">from last month</span>
                    </div>
                </div>

                <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-blue-400">
                    <Icon size={24} />
                </div>
            </div>
        </div>
    );
}
