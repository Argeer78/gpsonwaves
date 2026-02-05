'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import { CheckCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';

function PaymentSuccessContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const sessionId = searchParams.get('session_id');
    const { upgradeToPro } = useUser();
    const [verifying, setVerifying] = useState(true);

    useEffect(() => {
        if (sessionId) {
            // In a real app, verify session with backend
            // For MVP, if we have a session ID, assume success and upgrade locally
            setTimeout(() => {
                upgradeToPro();
                setVerifying(false);
            }, 1500);
        } else {
            setVerifying(false);
        }
    }, [sessionId, upgradeToPro]);

    if (verifying) {
        return (
            <>
                <Loader2 size={48} className="text-emerald-500 animate-spin" />
                <h1 className="text-2xl font-bold font-outfit text-white">Verifying Payment...</h1>
                <p className="text-slate-400">Finalizing your Pro upgrade.</p>
            </>
        );
    }

    return (
        <>
            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400 mb-2">
                <CheckCircle size={40} />
            </div>
            <h1 className="text-3xl font-bold font-outfit text-white">Welcome Aboard, Captain!</h1>
            <div className="space-y-2">
                <p className="text-emerald-400 font-bold">Pro Status Unlocked 🔓</p>
                <p className="text-slate-400 text-sm">You now have unlimited spots, high-res maps, and AI forecasts.</p>
            </div>

            <Link
                href="/"
                className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-8 rounded-xl transition-all w-full mt-4"
            >
                Back to Chart
            </Link>
        </>
    );
}

export default function PaymentSuccessPage() {
    return (
        <div className="full-screen flex items-center justify-center bg-slate-900 p-4">
            <div className="glass-panel max-w-md w-full p-8 text-center rounded-2xl flex flex-col items-center gap-6">
                <Suspense fallback={<Loader2 size={48} className="text-emerald-500 animate-spin" />}>
                    <PaymentSuccessContent />
                </Suspense>
            </div>
        </div>
    );
}
