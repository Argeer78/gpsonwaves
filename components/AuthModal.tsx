'use client';

import { useState } from 'react';
import { X, Mail, Lock, User as UserIcon, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
    const router = useRouter();
    const [mode, setMode] = useState<'login' | 'signup' | 'verify'>('login');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Form State
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [code, setCode] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            if (mode === 'signup') {
                // Register User -> Sends Email
                const res = await fetch('/api/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, password }),
                });

                if (res.ok) {
                    setMode('verify'); // Move to verification step
                } else {
                    const text = await res.text();
                    setError(text || 'Registration failed');
                }
            } else if (mode === 'verify') {
                // Verify Code
                const res = await fetch('/api/verify', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, code }),
                });

                if (res.ok) {
                    // Auto-login after verification
                    const loginRes = await signIn('credentials', {
                        email,
                        password,
                        redirect: false,
                    });

                    if (loginRes?.ok) {
                        onClose();
                        router.refresh();
                    } else {
                        // Weird edge case: Verified but login failed
                        setMode('login');
                        setError('Verified! Please log in.');
                    }
                } else {
                    const text = await res.text();
                    setError(text || 'Invalid code');
                }
            } else {
                // Login
                const callback = await signIn('credentials', {
                    email,
                    password,
                    redirect: false,
                });

                if (callback?.error) {
                    setError('Invalid email or password');
                } else if (callback?.ok) {
                    onClose();
                    router.refresh();
                }
            }
        } catch (err) {
            setError('Something went wrong. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
        }}>
            <div
                style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
                onClick={onClose}
            />

            <div
                className="glass-panel animate-in fade-in zoom-in-95 duration-200"
                style={{
                    position: 'relative',
                    width: '100%',
                    maxWidth: '400px',
                    backgroundColor: 'var(--color-card-bg)', // slate-900 equivalent
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '16px',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column'
                }}
            >

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <h2 className="text-xl font-bold font-outfit text-white" style={{ margin: 0 }}>
                        {mode === 'login' ? 'Welcome Back' : mode === 'verify' ? 'Verify Email' : 'Create Account'}
                    </h2>
                    <button onClick={onClose} style={{ color: 'rgba(255,255,255,0.5)', background: 'none', border: 'none', cursor: 'pointer' }}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-lg flex items-center gap-2 text-red-400 text-sm">
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}

                    {mode === 'verify' && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-lg mb-4 text-center">
                                <p className="text-emerald-400 text-sm font-bold mb-1 flex items-center justify-center gap-2">
                                    <Mail size={16} /> Code Sent!
                                </p>
                                <p className="text-white/60 text-xs">Check <strong>{email}</strong> for your 6-digit code.</p>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Verification Code</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type="text"
                                        required
                                        placeholder="123456"
                                        className="text-center tracking-[0.5em] font-mono text-xl"
                                        maxLength={6}
                                        value={code}
                                        onChange={(e) => setCode(e.target.value)}
                                        style={{
                                            width: '100%',
                                            backgroundColor: 'rgba(255,255,255,0.05)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '0.5rem',
                                            padding: '0.75rem',
                                            color: 'white',
                                            outline: 'none'
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {mode === 'signup' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Full Name</label>
                            <div style={{ position: 'relative' }}>
                                <UserIcon size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
                                <input
                                    type="text"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="John Doe"
                                    style={{
                                        width: '100%',
                                        backgroundColor: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '0.5rem',
                                        padding: '0.625rem 1rem 0.625rem 2.5rem',
                                        color: 'white',
                                        outline: 'none'
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    {mode !== 'verify' && (
                        <>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Email Address</label>
                                <div style={{ position: 'relative' }}>
                                    <Mail size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="you@example.com"
                                        style={{
                                            width: '100%',
                                            backgroundColor: 'rgba(255,255,255,0.05)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '0.5rem',
                                            padding: '0.625rem 1rem 0.625rem 2.5rem',
                                            color: 'white',
                                            outline: 'none'
                                        }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Password</label>
                                <div style={{ position: 'relative' }}>
                                    <Lock size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
                                    <input
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        style={{
                                            width: '100%',
                                            backgroundColor: 'rgba(255,255,255,0.05)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '0.5rem',
                                            padding: '0.625rem 1rem 0.625rem 2.5rem',
                                            color: 'white',
                                            outline: 'none'
                                        }}
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        style={{
                            width: '100%',
                            backgroundColor: 'var(--color-accent-good)',
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
                            opacity: isLoading ? 0.7 : 1
                        }}
                    >
                        {isLoading ? <Loader2 className="animate-spin" size={20} /> : (mode === 'login' ? 'Log In' : mode === 'verify' ? 'Verify Code' : 'Create Account')}
                    </button>

                </form>

                {/* Footer */}
                <div style={{ backgroundColor: 'rgba(0,0,0,0.2)', padding: '1rem', textAlign: 'center', fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)' }}>
                    {mode === 'login' ? "Don't have an account? " : mode === 'signup' ? "Already have an account? " : ""}

                    {mode !== 'verify' && (
                        <button
                            onClick={() => {
                                setMode(mode === 'login' ? 'signup' : 'login');
                                setError('');
                            }}
                            style={{ color: 'var(--color-accent-good)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                            {mode === 'login' ? 'Sign Up' : 'Log In'}
                        </button>
                    )}

                    {mode === 'verify' && (
                        <button
                            type="button"
                            onClick={() => setMode('signup')}
                            style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                            &larr; Back to Sign Up
                        </button>
                    )}

                    {mode === 'login' && (
                        <div style={{ marginTop: '0.5rem' }}>
                            <button
                                onClick={() => router.push('/forgot-password')}
                                style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', background: 'none', border: 'none', cursor: 'pointer' }}
                            >
                                Forgot Password?
                            </button>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
