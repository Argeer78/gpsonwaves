'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            setIsLoading(false);
            return;
        }

        if (password.length < 8) {
            setError("Password must be at least 8 characters");
            setIsLoading(false);
            return;
        }

        if (!token) {
            setError("Invalid or missing token");
            setIsLoading(false);
            return;
        }

        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password }),
            });

            if (res.ok) {
                setSuccess(true);
                setTimeout(() => {
                    router.push('/'); // Redirect to home/login
                }, 3000);
            } else {
                const text = await res.text();
                setError(text || "Failed to reset password");
            }
        } catch (err) {
            setError("Something went wrong");
        } finally {
            setIsLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen text-slate-300 bg-slate-950">
                <div className="glass-panel p-8 rounded-2xl flex flex-col items-center max-w-sm text-center border border-white/10 shadow-2xl">
                    <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
                    <h1 className="text-xl font-bold text-white mb-2">Invalid Link</h1>
                    <p className="text-slate-400 text-sm mb-6">The password reset link is invalid or missing.</p>
                    <button
                        onClick={() => router.push('/')}
                        className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors"
                    >
                        Return to Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            backgroundColor: '#020617', // slate-950
            backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(16, 185, 129, 0.05) 0%, transparent 50%)' // Subtle glow
        }}>
            <div
                className="glass-panel animate-in fade-in zoom-in-95 duration-300"
                style={{
                    position: 'relative',
                    width: '100%',
                    maxWidth: '400px',
                    backgroundColor: 'rgba(15, 23, 42, 0.9)', // slate-900 glass
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '16px',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column'
                }}
            >
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <h2 className="text-xl font-bold font-outfit text-white" style={{ margin: 0 }}>
                        Reset Password
                    </h2>
                </div>

                {success ? (
                    <div className="flex flex-col items-center justify-center text-center py-10 px-6">
                        <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4 animate-in zoom-in spin-in-180 duration-500">
                            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                        </div>
                        <h2 className="text-xl font-bold text-emerald-400 mb-2">Password Update!</h2>
                        <p className="text-slate-400 text-sm">Your password has been reset successfully.</p>
                        <p className="text-slate-500 text-xs mt-6">Redirecting to login...</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-lg flex items-center gap-2 text-red-400 text-sm animate-in slide-in-from-top-2">
                                <AlertCircle size={16} />
                                {error}
                            </div>
                        )}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>New Password</label>
                            <div style={{ position: 'relative' }}>
                                <Lock size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Min 8 characters"
                                    style={{
                                        width: '100%',
                                        backgroundColor: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '0.5rem',
                                        padding: '0.625rem 2.5rem 0.625rem 2.5rem',
                                        color: 'white',
                                        outline: 'none',
                                        colorScheme: 'dark'
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{
                                        position: 'absolute',
                                        right: '0.75rem',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        color: 'rgba(255,255,255,0.4)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Confirm Password</label>
                            <div style={{ position: 'relative' }}>
                                <Lock size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
                                <input
                                    type="password"
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Repeat password"
                                    style={{
                                        width: '100%',
                                        backgroundColor: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '0.5rem',
                                        padding: '0.625rem 1rem 0.625rem 2.5rem',
                                        color: 'white',
                                        outline: 'none',
                                        colorScheme: 'dark'
                                    }}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            style={{
                                width: '100%',
                                backgroundColor: 'var(--color-accent-good)', // Emerald green from global css
                                color: 'white',
                                fontWeight: 'bold',
                                padding: '0.75rem',
                                borderRadius: '0.5rem',
                                marginTop: '0.5rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem',
                                border: 'none',
                                cursor: 'pointer',
                                opacity: isLoading ? 0.7 : 1,
                                transition: 'all 0.2s'
                            }}
                        >
                            {isLoading ? <Loader2 className="animate-spin" size={20} /> : "Update Password"}
                        </button>
                    </form>
                )}

                {/* Footer link back to home */}
                {!success && (
                    <div style={{ backgroundColor: 'rgba(0,0,0,0.2)', padding: '1rem', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                        <button
                            onClick={() => router.push('/')}
                            className="text-slate-400 hover:text-white text-sm transition-colors"
                        >
                            Cancel and return home
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="animate-spin text-emerald-500 w-8 h-8" /></div>}>
            <ResetPasswordForm />
        </Suspense>
    );
}
