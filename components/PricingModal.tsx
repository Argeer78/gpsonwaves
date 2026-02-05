'use client';

import { useState } from 'react';
import { X, Check, Crown, Loader2, Sparkles } from 'lucide-react';
import { useUser } from '@/context/UserContext';

interface PricingModalProps {
    isOpen: boolean;
    onClose: () => void;
    triggerReason?: string; // e.g. "To view Reef Maps, you need Pro"
}

export default function PricingModal({ isOpen, onClose, triggerReason }: PricingModalProps) {
    const { upgradeToPro } = useUser();
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen) return null;

    const handleUpgrade = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/stripe/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });
            const data = await response.json();
            if (data.sessionId) {
                // Determine env - using global loadStripe pattern is safer but basic redirect works too
                // Or use stripe-js
                const { loadStripe } = await import('@stripe/stripe-js');
                const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder');
                if (stripe) {
                    await stripe.redirectToCheckout({ sessionId: data.sessionId });
                }
            } else {
                console.error("No Session ID returned");
                setIsLoading(false);
            }
        } catch (error) {
            console.error("Stripe Checkout Error", error);
            setIsLoading(false);
        }
    };

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
        }}>
            <div
                style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)' }}
                onClick={onClose}
            />

            <div
                className="glass-panel animate-in fade-in zoom-in-95 duration-200"
                style={{
                    position: 'relative',
                    width: '100%',
                    maxWidth: '500px',
                    backgroundColor: 'var(--color-card-bg)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '16px',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                    overflow: 'hidden'
                }}
            >

                {/* Special Header for trigger reason */}
                {triggerReason && (
                    <div style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', borderBottom: '1px solid rgba(245, 158, 11, 0.2)', padding: '0.75rem', textAlign: 'center', color: '#fcd34d', fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                        <LockIcon size={14} /> {triggerReason}
                    </div>
                )}

                <div style={{ padding: '2rem' }}>
                    <div className="text-center mb-8">
                        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '4rem', height: '4rem', borderRadius: '50%', background: 'linear-gradient(to bottom right, #fcd34d, #d97706)', marginBottom: '1rem', boxShadow: '0 10px 15px -3px rgba(245, 158, 11, 0.3)' }}>
                            <Crown size={32} className="text-white" />
                        </div>
                        <h2 className="text-3xl font-bold font-outfit text-white mb-2">Upgrade to Pro</h2>
                        <p className="text-white/60">Unlock the full power of the ocean.</p>
                    </div>

                    {/* Features List */}
                    <div className="space-y-4 mb-8">
                        <FeatureRow text="Unlimited Saved Spots" isPro />
                        <FeatureRow text="Detailed Structure Scans" isPro />
                        <FeatureRow text="High-Res Reef & Bathymetry Maps" isPro />
                        <FeatureRow text="Smart Notifications & Alerts" isPro />
                        <FeatureRow text="Tides, Currents & Offline Cache" isPro />
                    </div>

                    {/* Price */}
                    <div className="text-center mb-8">
                        <div className="flex items-baseline justify-center gap-1">
                            <span className="text-4xl font-bold text-white">$4.99</span>
                            <span className="text-white/50">/ month</span>
                        </div>
                        <p className="text-xs text-white/40 mt-1">or $39/year (~$3.25/mo)</p>
                        <p className="text-xs text-emerald-400 mt-2 font-medium">✨ Cancel Anytime</p>
                    </div>

                    {/* Action */}
                    <button
                        onClick={handleUpgrade}
                        disabled={isLoading}
                        style={{
                            width: '100%',
                            background: 'linear-gradient(to right, #fbbf24, #d97706)',
                            color: 'white',
                            fontWeight: 'bold',
                            padding: '1rem',
                            borderRadius: '0.75rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            border: 'none',
                            cursor: 'pointer',
                            boxShadow: '0 20px 25px -5px rgba(245, 158, 11, 0.2)'
                        }}
                    >
                        {isLoading ? <Loader2 className="animate-spin" /> : (
                            <>
                                Go Pro Now <Sparkles size={18} />
                            </>
                        )}
                    </button>

                    <button onClick={onClose} style={{ width: '100%', marginTop: '1rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.4)', background: 'none', border: 'none', cursor: 'pointer' }}>
                        No thanks, I'll stay on the dock
                    </button>
                </div>

                <button onClick={onClose} style={{ position: 'absolute', top: '1rem', right: '1rem', color: 'rgba(255,255,255,0.3)', background: 'none', border: 'none', cursor: 'pointer' }}>
                    <X size={24} />
                </button>

            </div>
        </div>
    );
}

function FeatureRow({ text, isPro = false }: { text: string, isPro?: boolean }) {
    return (
        <div className="flex items-center gap-3">
            <div className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${isPro ? 'bg-amber-500/20 text-amber-400' : 'bg-white/10 text-white/60'}`}>
                <Check size={14} strokeWidth={3} />
            </div>
            <span className={isPro ? 'text-white' : 'text-white/70'}>{text}</span>
        </div>
    );
}

function LockIcon({ size }: { size: number }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
    )
}
