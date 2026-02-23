'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, ArrowLeft, Trash2, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function DeleteAccountPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [confirmText, setConfirmText] = useState('');

    const handleDelete = async () => {
        if (confirmText !== 'DELETE') return;

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/user/delete', {
                method: 'DELETE',
            });

            if (response.ok) {
                // Flash message or just redirect
                window.location.href = '/'; // Force a full reload to clear all states
            } else {
                const msg = await response.text();
                setError(msg || 'Failed to delete account');
                setIsLoading(false);
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
            setIsLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full bg-slate-800/50 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl relative overflow-hidden">
                {/* Background Glow */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-rose-500/10 blur-[100px] rounded-full" />

                <div className="relative z-10">
                    <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8 group">
                        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                        <span>Back to Map</span>
                    </Link>

                    <div className="w-16 h-16 bg-rose-500/20 rounded-2xl flex items-center justify-center text-rose-500 mb-6">
                        <AlertTriangle size={32} />
                    </div>

                    <h1 className="text-2xl font-bold text-white mb-2">Delete Account?</h1>
                    <p className="text-slate-400 mb-8">
                        This action is permanent. You will lose all your saved spots, pro settings, and subscription status immediately.
                    </p>

                    {error && (
                        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 p-4 rounded-xl mb-6 text-sm">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">
                                Type <span className="text-rose-500 font-bold italic">DELETE</span> to confirm
                            </label>
                            <input
                                type="text"
                                value={confirmText}
                                onChange={(e) => setConfirmText(e.target.value)}
                                placeholder="DELETE"
                                className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-rose-500/50 transition-all uppercase placeholder:opacity-30"
                            />
                        </div>

                        <button
                            onClick={handleDelete}
                            disabled={confirmText !== 'DELETE' || isLoading}
                            className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${confirmText === 'DELETE' && !isLoading
                                    ? 'bg-rose-500 text-white hover:bg-rose-600 shadow-lg shadow-rose-500/20'
                                    : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                                }`}
                        >
                            {isLoading ? (
                                <Loader2 size={20} className="animate-spin" />
                            ) : (
                                <Trash2 size={20} />
                            )}
                            <span>Permanently Delete My Data</span>
                        </button>
                    </div>

                    <p className="mt-8 text-center text-xs text-slate-500">
                        GPSonWaves respects your privacy. All your personal data and coordinates will be wiped from our servers.
                    </p>
                </div>
            </div>
        </main>
    );
}
