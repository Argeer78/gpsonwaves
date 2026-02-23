'use client';

import { Shield, Mail, AppWindow, Trash2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function DeleteAccountInfoPage() {
    return (
        <main className="min-h-screen bg-slate-900 text-slate-200 font-sans selection:bg-emerald-500/30">
            {/* Elegant Background Accents */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/5 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/5 blur-[120px] rounded-full" />
            </div>

            <div className="relative z-10 max-w-3xl mx-auto px-6 py-12 sm:py-20">
                {/* Header */}
                <header className="mb-12">
                    <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8 group">
                        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                        <span>Back to App</span>
                    </Link>

                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                            <Trash2 className="text-emerald-400" size={32} />
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                            Delete Your GPSonWaves Account
                        </h1>
                    </div>
                    <p className="text-lg text-slate-400 leading-relaxed">
                        We value your privacy. If you would like to permanently delete your GPSonWaves account and associated data, please follow the procedures outlined below.
                    </p>
                </header>

                <div className="space-y-12">
                    {/* Option 1 */}
                    <section className="bg-slate-800/40 backdrop-blur-md border border-white/5 p-8 rounded-3xl shadow-xl">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-blue-500/10 rounded-xl">
                                <AppWindow className="text-blue-400" size={20} />
                            </div>
                            <h2 className="text-xl font-bold text-white">Option 1 – Delete from within the app</h2>
                        </div>
                        <ol className="space-y-4 text-slate-300 ml-4 list-decimal list-outside">
                            <li className="pl-2">Log in to your **GPSonWaves** account.</li>
                            <li className="pl-2">Open your **Profile Settings**.</li>
                            <li className="pl-2">Select <span className="text-rose-400 font-semibold">"Delete Account"</span>.</li>
                            <li className="pl-2">Confirm your request.</li>
                        </ol>
                        <div className="mt-6 p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl text-sm text-emerald-400/80 italic">
                            Your account and all associated data will be permanently removed immediately.
                        </div>
                    </section>

                    {/* Option 2 */}
                    <section className="p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-purple-500/10 rounded-xl">
                                <Mail className="text-purple-400" size={20} />
                            </div>
                            <h2 className="text-xl font-bold text-white">Option 2 – Request deletion via email</h2>
                        </div>
                        <p className="text-slate-300 mb-4">
                            You may also request account deletion by contacting our support team:
                        </p>
                        <a
                            href="mailto:support@gpsonwaves.com"
                            className="inline-block px-6 py-3 bg-slate-800 hover:bg-slate-700 border border-white/10 rounded-xl text-emerald-400 font-bold transition-all hover:scale-[1.02] active:scale-95 shadow-lg"
                        >
                            support@gpsonwaves.com
                        </a>
                        <p className="mt-4 text-sm text-slate-500 italic">
                            *Please include the email address associated with the account you wish to delete.
                        </p>
                    </section>

                    {/* What data is deleted */}
                    <section className="border-t border-white/5 pt-12">
                        <h2 className="text-2xl font-bold text-white mb-6">What data is deleted</h2>
                        <p className="text-slate-400 mb-6">When you delete your account, the following information is permanently wiped from our production servers:</p>
                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {[
                                "Account email address",
                                "Saved fishing spots & coordinates",
                                "Vessel specifications & settings",
                                "User preferences & UI state",
                                "Subscription & Pro status metadata"
                            ].map((item, i) => (
                                <li key={i} className="flex items-center gap-3 bg-slate-800/20 p-4 rounded-2xl border border-white/5">
                                    <Shield size={16} className="text-emerald-500 shrink-0" />
                                    <span className="text-slate-300 text-sm font-medium">{item}</span>
                                </li>
                            ))}
                        </ul>
                    </section>

                    {/* Data retention */}
                    <section className="bg-slate-950/50 p-8 rounded-3xl border border-white/5">
                        <h2 className="text-xl font-bold text-white mb-4">Data retention</h2>
                        <p className="text-slate-400 leading-relaxed text-sm">
                            Some minimal server logs may be retained for up to **30 days** for security and fraud prevention purposes. After this period, they are automatically and permanently deleted.
                        </p>
                    </section>

                    {/* Footer Warning */}
                    <footer className="pt-12 border-t border-white/5 text-center">
                        <p className="text-xs text-slate-600 uppercase tracking-widest font-bold mb-8">
                            GPSonWaves is an informational tool and not intended for navigation.
                        </p>
                        <p className="text-slate-500 text-sm">
                            &copy; {new Date().getFullYear()} GPSonWaves. All rights reserved.
                        </p>
                    </footer>
                </div>
            </div>
        </main>
    );
}
