'use client';

import { useState, useEffect } from 'react';

export default function SiteFooter() {
    const [showConsent, setShowConsent] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const consent = localStorage.getItem('gpsonwaves-consent');
        if (!consent) {
            setShowConsent(true);
        }
    }, []);

    const onAccept = () => {
        localStorage.setItem('gpsonwaves-consent', 'true');
        setShowConsent(false);
    };

    if (!mounted) return null;

    return (
        <footer
            className="fixed pointer-events-none flex flex-col items-center justify-end"
            style={{
                bottom: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 'auto',
                maxWidth: '100%',
                zIndex: 40,
                padding: '1rem',
                gap: '0.5rem'
            }}
        >

            {/* Cookie Consent Alert (Conditional) */}
            {showConsent && (
                <div
                    className="glass-panel pointer-events-auto flex flex-col md:flex-row items-center justify-between"
                    style={{
                        padding: '1rem',
                        marginBottom: '0.5rem',
                        maxWidth: '42rem',
                        width: '100%',
                        gap: '1rem',
                        animation: 'fadeInUp 0.5s ease-out forwards'
                    }}
                >
                    <div className="text-sm flex-1 text-center md:text-left" style={{ color: '#cbd5e1' }}>
                        <span>We use cookies to improve your experience. By using this app, you agree to our policies.</span>
                    </div>
                    <button
                        onClick={onAccept}
                        className="pointer-events-auto"
                        style={{
                            backgroundColor: 'var(--color-accent-good)',
                            color: 'white',
                            padding: '0.5rem 1rem',
                            borderRadius: '8px',
                            fontWeight: 'bold',
                            fontSize: '0.75rem',
                            border: 'none',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        Accept & Continue
                    </button>
                </div>
            )}

            {/* Persistent Links & Copyright - Always Visible */}
            <div
                className="pointer-events-auto flex flex-col items-center"
                style={{
                    fontSize: '0.75rem',
                    color: 'rgba(255, 255, 255, 0.5)',
                    background: 'rgba(0, 0, 0, 0.4)',
                    backdropFilter: 'blur(4px)',
                    padding: '0.5rem 1rem',
                    borderRadius: '999px',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    gap: '0.25rem'
                }}
            >
                <div className="flex" style={{ gap: '1rem' }}>
                    <a href="/privacy" style={{ color: 'inherit', textDecoration: 'none' }} className="hover-white">Privacy</a>
                    <span style={{ opacity: 0.3 }}>•</span>
                    <a href="/terms" style={{ color: 'inherit', textDecoration: 'none' }} className="hover-white">Terms</a>
                    <span style={{ opacity: 0.3 }}>•</span>
                    <a href="/cookies" style={{ color: 'inherit', textDecoration: 'none' }} className="hover-white">Cookies</a>
                </div>
                <div>
                    &copy; 2026 <a href="https://alphasynthai.com" target="_blank" rel="noopener noreferrer" style={{ fontWeight: 'bold', color: 'var(--color-accent-good)', textDecoration: 'none' }}>AlphaSynth AI</a>. All rights reserved.
                </div>
            </div>

            <style jsx>{`
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .hover-white:hover {
                    color: white !important;
                }
            `}</style>

        </footer>
    );
}
