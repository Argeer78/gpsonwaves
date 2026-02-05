'use client';

import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

export default function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);

            // Check dismissal cooldown (7 days)
            // const dismissed = localStorage.getItem('pwa_dismissed');
            // const isAhoy = dismissed && (Date.now() - parseInt(dismissed) < 7 * 24 * 60 * 60 * 1000);

            // FORCE SHOW for verification (bypassing cooldown)
            // if (!isAhoy) {
            setIsVisible(true);
            // }
        };

        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setDeferredPrompt(null);
            setIsVisible(false);
        }
    };

    const handleDismiss = () => {
        setIsVisible(false);
        localStorage.setItem('pwa_dismissed', Date.now().toString());
    };

    if (!isVisible) return null;

    // Hybrid Approach: Inline styles for positioning (guaranteed visible), Tailwind for look
    // Bottom 90px to clear footer/cookies
    return (
        <div style={{
            position: 'fixed',
            bottom: '90px',
            right: '20px',
            zIndex: 999999,
            maxWidth: '360px',
            width: '100%'
        }}>
            <div className="bg-slate-900/95 backdrop-blur-md p-4 rounded-xl border border-white/10 shadow-2xl flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center text-emerald-400 shrink-0">
                    <Download size={24} />
                </div>

                <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-white text-sm font-outfit">Install GPSonWaves</h3>
                    <p className="text-xs text-slate-400">Get the native app experience.</p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={handleInstall}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold py-2 px-4 rounded-lg transition-colors whitespace-nowrap shadow-lg shadow-emerald-500/20"
                    >
                        Install
                    </button>
                    <button
                        onClick={handleDismiss}
                        className="text-slate-400 hover:text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
}
