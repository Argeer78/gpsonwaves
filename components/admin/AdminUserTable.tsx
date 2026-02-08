import React from 'react';
import { MoreHorizontal, Shield, Star, Ban } from 'lucide-react';

export function AdminUserTable() {
    // Mock Data
    const [users, setUsers] = React.useState<any[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        async function fetchUsers() {
            try {
                const res = await fetch('/api/admin/users');
                if (res.ok) {
                    const data = await res.json();
                    setUsers(data);
                }
            } catch (error) {
                console.error("Failed to fetch users", error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchUsers();
    }, []);

    return (
        <div className="relative overflow-hidden rounded-3xl border border-white/10 shadow-2xl bg-[#0f172a]/80 backdrop-blur-xl">
            {/* Header with Gradient */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500 opacity-50" />

            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
                <div>
                    <h3 className="text-xl font-bold text-white font-outfit">Recent Users</h3>
                    <p className="text-white/40 text-sm mt-1">Manage platform access and roles</p>
                </div>
                <button className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-sm font-medium rounded-xl transition-all border border-white/5 hover:border-white/10 shadow-lg">
                    View All
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-white/5 text-white/40 text-xs uppercase tracking-wider font-semibold">
                        <tr>
                            <th className="px-6 py-5">User Profile</th>
                            <th className="px-6 py-5">Role</th>
                            <th className="px-6 py-5">Status</th>
                            <th className="px-6 py-5">Joined</th>
                            <th className="px-6 py-5 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-sm">
                        {isLoading ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-white/30">
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent"></div>
                                        <span>Loading user data...</span>
                                    </div>
                                </td>
                            </tr>
                        ) : users.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-white/30 italic">
                                    No users found in the database.
                                </td>
                            </tr>
                        ) : users.map((user) => (
                            <tr key={user.id} className="group hover:bg-blue-500/5 transition-colors duration-200">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-4">
                                        <div className="relative">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-sm font-bold text-white shadow-inner ring-1 ring-white/10">
                                                {user.image ? (
                                                    <img src={user.image} alt={user.name} className="w-full h-full rounded-full object-cover" />
                                                ) : (
                                                    user.name.charAt(0)
                                                )}
                                            </div>
                                            {/* Online Indicator (Mock) */}
                                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#0f172a]"></div>
                                        </div>
                                        <div>
                                            <div className="font-semibold text-white group-hover:text-blue-400 transition-colors">{user.name}</div>
                                            <div className="text-xs text-white/40 font-mono mt-0.5">{user.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    {user.role === 'Admin' && (
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20 shadow-[0_0_10px_rgba(168,85,247,0.1)]">
                                            <Shield size={12} className="fill-current" /> ADMIN
                                        </span>
                                    )}
                                    {user.role === 'Pro' && (
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.1)]">
                                            <Star size={12} className="fill-current" /> PRO
                                        </span>
                                    )}
                                    {user.role === 'Free' && (
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-500/10 text-slate-400 border border-slate-500/20">
                                            FREE
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center gap-2 text-xs font-medium px-2.5 py-1 rounded-lg ${user.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                                        }`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'Active' ? 'bg-emerald-400 shadow-[0_0_6px_#34d399]' : 'bg-rose-400'
                                            }`} />
                                        {user.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-sm text-white/60 font-medium">{user.joinDate}</div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button className="p-2 hover:bg-white/10 rounded-lg text-white/40 hover:text-white transition-all active:scale-95">
                                        <MoreHorizontal size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Footer / Pagination Placeholder */}
            <div className="p-4 border-t border-white/5 bg-white/[0.02] flex justify-center">
                <span className="text-xs text-white/20">Showing latest 50 users</span>
            </div>
        </div>
    );
}
