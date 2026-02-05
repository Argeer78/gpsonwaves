'use client';

import { useState, useEffect } from 'react';

export default function ConsentBanner() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Check if user has already consented
        const consent = localStorage.getItem('gpsonwaves-consent');
        if (!consent) {
            setIsVisible(true);
        }
    }, []);

    const onAccept = () => {
        localStorage.setItem('gpsonwaves-consent', 'true');
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-0 left-0 w-full z-50 p-4 md:p-6 flex justify-center pointer-events-none fade-in-up">
            <div className="glass-panel p-6 max-w-2xl w-full flex flex-col md:flex-row items-center gap-4 pointer-events-auto border border-white/10 shadow-2xl bg-slate-900/90">
                <div className="flex-1 text-sm text-slate-300 text-center md:text-left">
                    <p>
                        We use <strong>cookies</strong> and local storage to enhance your experience.
                        By using GPSonWaves, you agree to our{' '}
                        <a href="/privacy" className="text-emerald-400 hover:text-emerald-300 underline underline-offset-2">Privacy Policy</a>
                        {', '}
                        <a href="/terms" className="text-emerald-400 hover:text-emerald-300 underline underline-offset-2">Terms</a>
                        {', and '}
                        <a href="/cookies" className="text-emerald-400 hover:text-emerald-300 underline underline-offset-2">Cookie Policy</a>.
                    </p>
                </div>
                <div className="flex gap-3 shrink-0">
                    <button
                        onClick={onAccept}
                        className="bg-emerald-500 hover:bg-emerald-400 text-white px-6 py-2.5 rounded-lg font-bold text-sm transition-all shadow-lg hover:shadow-emerald-500/20 active:scale-95"
                    >
                        Accept & Continue
                    </button>
                </div>
            </div>
            <style jsx>{`
        .fade-in-up {
            animation: fadeInUp 0.5s ease-out forwards;
        }
        @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
        </div>
    );
}
