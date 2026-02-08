'use client';

import { useState } from 'react';
import { X, User, Anchor, Settings, LogOut, ChevronRight, Crown, Save, Camera, Lock, Info, Upload } from 'lucide-react';
import { useUser } from '@/context/UserContext';

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
    const { user, updateUser, changePassword } = useUser();
    const [activeTab, setActiveTab] = useState<'general' | 'boat' | 'settings'>('general');
    const [isSaving, setIsSaving] = useState(false);

    // Local state for editing form
    const [name, setName] = useState(user?.name || '');
    const [imageUrl, setImageUrl] = useState(user?.image || '');

    // Boat specs
    const [boatName, setBoatName] = useState(user?.boatSettings?.name || '');
    const [boatDraft, setBoatDraft] = useState(user?.boatSettings?.draft?.toString() || '1.0');
    const [boatLength, setBoatLength] = useState(user?.boatSettings?.length?.toString() || '6.0');

    // Settings
    const [units, setUnits] = useState<'metric' | 'imperial'>(user?.preferences?.units || 'metric');

    // Password Change State
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordStatus, setPasswordStatus] = useState<{ type: 'success' | 'error' | null, msg: string }>({ type: null, msg: '' });

    if (!isOpen || !user) return null;

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await updateUser({
                name,
                image: imageUrl,
                boatSettings: {
                    name: boatName,
                    draft: parseFloat(boatDraft) || 0,
                    length: parseFloat(boatLength) || 0,
                    type: user.boatSettings?.type || 'motorboat'
                },
                preferences: {
                    units,
                    theme: user.preferences?.theme || 'dark'
                }
            });
            onClose();
        } catch (error) {
            alert("Failed to save changes. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    const handlePasswordChange = async () => {
        if (!currentPassword || !newPassword) {
            setPasswordStatus({ type: 'error', msg: 'Please fill in all fields.' });
            return;
        }
        if (newPassword !== confirmPassword) {
            setPasswordStatus({ type: 'error', msg: 'New passwords do not match!' });
            return;
        }

        setIsSaving(true);
        const result = await changePassword(currentPassword, newPassword);
        setIsSaving(false);

        if (result.success) {
            setPasswordStatus({ type: 'success', msg: 'Password updated successfully!' });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } else {
            setPasswordStatus({ type: 'error', msg: result.error || 'Failed to update password.' });
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 500000) { // 500KB limit
                alert("Image too large. Please choose an image under 500KB.");
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setImageUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            fontFamily: 'Inter, sans-serif'
        }}>
            {/* Backdrop */}
            <div
                style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }}
                onClick={onClose}
            />

            {/* Modal Content */}
            <div
                className="animate-in fade-in zoom-in-95 duration-200"
                style={{
                    position: 'relative',
                    width: '100%',
                    maxWidth: '850px', // Spacious width
                    height: 'auto',
                    minHeight: '600px',
                    maxHeight: '90vh',
                    backgroundColor: '#0f172a', // Slate 900 Solid
                    border: '1px solid #334155', // Slate 700
                    borderRadius: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    boxShadow: '0 40px 80px -12px rgba(0, 0, 0, 0.6)'
                }}
            >
                {/* Header */}
                <div className="px-8 py-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
                    <div className="flex items-center gap-6">
                        {/* Avatar / Upload Trigger */}
                        <div className="relative group shrink-0">
                            <div className="w-20 h-20 rounded-full bg-slate-800 overflow-hidden border-2 border-slate-600 flex items-center justify-center relative shadow-lg">
                                {imageUrl ? (
                                    <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
                                ) : (
                                    <User size={36} color="white" />
                                )}
                            </div>
                        </div>

                        <div>
                            <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                                {name || 'Captain'}
                                {user.isPro && (
                                    <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded text-xs font-bold flex items-center gap-1">
                                        <Crown size={12} fill="currentColor" /> PRO
                                    </span>
                                )}
                            </h2>
                            <p className="text-sm text-slate-400 font-medium mb-3">{user.email}</p>

                            {/* Explicit Upload Button */}
                            <label
                                htmlFor="header-upload"
                                className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg text-xs font-bold text-white cursor-pointer transition-colors"
                            >
                                <Camera size={14} color="white" />
                                Change Photo
                            </label>
                            <input
                                id="header-upload"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                style={{ display: 'none' }} // Explicit inline hide
                                onChange={handleFileChange}
                            />
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white hover:bg-white/10 p-2 rounded-full transition-all"
                    >
                        <X size={28} color="white" />
                    </button>
                </div>

                {/* Body Layout: Sidebar + Content */}
                <div className="flex flex-1 overflow-hidden">

                    {/* Sidebar Tabs */}
                    <div className="w-64 bg-slate-950/50 border-r border-slate-800 flex flex-col p-6 gap-2 shrink-0">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 px-2">Navigation</p>

                        <TabButton
                            active={activeTab === 'general'}
                            onClick={() => setActiveTab('general')}
                            icon={User}
                            label="Profile"
                        />
                        <TabButton
                            active={activeTab === 'boat'}
                            onClick={() => setActiveTab('boat')}
                            icon={Anchor}
                            label="Boat Specs"
                        />
                        <TabButton
                            active={activeTab === 'settings'}
                            onClick={() => setActiveTab('settings')}
                            icon={Settings}
                            label="Settings"
                        />
                    </div>

                    {/* Main Content Area - Increased padding and gap */}
                    <div className="flex-1 overflow-y-auto bg-slate-900 relative p-12">
                        <div className="max-w-3xl mx-auto space-y-8">
                            {/* added wrapper for spacing control */}

                            {activeTab === 'general' && (
                                <div className="space-y-8 relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="border-b border-slate-800 pb-4">
                                        <h3 className="text-2xl font-bold text-white mb-1">Personal Details</h3>
                                        <p className="text-slate-400 text-sm">Manage your identity and public profile.</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="col-span-2">
                                            <FormGroup label="Display Name">
                                                <input
                                                    type="text"
                                                    value={name}
                                                    onChange={(e) => setName(e.target.value)}
                                                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-medium placeholder:text-slate-600 shadow-sm"
                                                    placeholder="Enter your name"
                                                />
                                            </FormGroup>
                                        </div>

                                        <div className="col-span-2">
                                            <FormGroup label="Email Address">
                                                <div className="relative">
                                                    <input
                                                        type="text"
                                                        value={user.email || ''}
                                                        disabled
                                                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3.5 text-slate-400 cursor-not-allowed font-mono text-sm"
                                                    />
                                                    <Lock size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600" />
                                                </div>
                                            </FormGroup>
                                        </div>
                                    </div>

                                    {/* Info Box */}
                                    <div className="p-4 bg-slate-800/50 border border-slate-700/50 rounded-xl flex items-center gap-4">
                                        <div className="p-2 bg-emerald-500/10 rounded-lg">
                                            <Info size={20} className="text-emerald-400" />
                                        </div>
                                        <p className="text-sm text-slate-300">
                                            Your profile photo helps other captains identify you on the map. Use the <strong>Change Photo</strong> button above to update it.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'boat' && (
                                <div className="space-y-8 relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="border-b border-slate-800 pb-4">
                                        <h3 className="text-2xl font-bold text-white mb-1">Vessel Specifications</h3>
                                        <p className="text-slate-400 text-sm">Accurate specs ensure safe routing and clearances.</p>
                                    </div>

                                    <FormGroup label="Vessel Name">
                                        <input
                                            type="text"
                                            value={boatName}
                                            onChange={(e) => setBoatName(e.target.value)}
                                            placeholder="e.g. The Black Pearl"
                                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-medium placeholder:text-slate-600 shadow-sm"
                                        />
                                    </FormGroup>

                                    <div className="grid grid-cols-2 gap-8">
                                        <FormGroup label="Draft (meters)">
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    step="0.1"
                                                    value={boatDraft}
                                                    onChange={(e) => setBoatDraft(e.target.value)}
                                                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-mono shadow-sm"
                                                />
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-bold pointer-events-none">M</div>
                                            </div>
                                        </FormGroup>
                                        <FormGroup label="Length (LOA)">
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    step="0.5"
                                                    value={boatLength}
                                                    onChange={(e) => setBoatLength(e.target.value)}
                                                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-mono shadow-sm"
                                                />
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-bold pointer-events-none">M</div>
                                            </div>
                                        </FormGroup>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'settings' && (
                                <div className="space-y-8 relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="border-b border-slate-800 pb-4">
                                        <h3 className="text-2xl font-bold text-white mb-1">Preferences & Security</h3>
                                        <p className="text-slate-400 text-sm">Manage app settings and password.</p>
                                    </div>

                                    <div className="space-y-4">
                                        <h4 className="text-sm font-bold text-white/70 uppercase tracking-wider">Application</h4>
                                        <div className="flex items-center justify-between p-5 bg-slate-950 border border-slate-800 rounded-xl shadow-sm hover:border-slate-700 transition-colors">
                                            <div>
                                                <p className="font-bold text-white text-base">Measurement Units</p>
                                                <p className="text-xs text-slate-400 mt-1">Depth in meters vs feet</p>
                                            </div>
                                            <div className="flex bg-slate-900 rounded-lg p-1.5 border border-slate-800">
                                                <button
                                                    onClick={() => setUnits('metric')}
                                                    className={`px-5 py-2 rounded-md text-xs font-bold transition-all ${units === 'metric' ? 'bg-slate-700 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
                                                >
                                                    METRIC
                                                </button>
                                                <button
                                                    onClick={() => setUnits('imperial')}
                                                    className={`px-5 py-2 rounded-md text-xs font-bold transition-all ${units === 'imperial' ? 'bg-slate-700 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
                                                >
                                                    IMPERIAL
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4 pt-6">
                                        <h4 className="text-sm font-bold text-white/70 uppercase tracking-wider">Security</h4>

                                        <div className="p-6 bg-slate-950 border border-slate-800 rounded-xl space-y-6 shadow-sm">
                                            <div className="flex items-center gap-3 text-white font-bold text-lg">
                                                <div className="p-2 bg-emerald-500/10 rounded-lg">
                                                    <Lock size={20} className="text-emerald-500" />
                                                </div>
                                                Change Password
                                            </div>

                                            {passwordStatus.msg && (
                                                <div className={`p-3 rounded-lg text-sm font-medium ${passwordStatus.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                                                    {passwordStatus.msg}
                                                </div>
                                            )}

                                            <div className="space-y-4">
                                                <input
                                                    type="password"
                                                    placeholder="Current Password"
                                                    value={currentPassword}
                                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500 transition-all placeholder:text-slate-600"
                                                />
                                                <div className="grid grid-cols-2 gap-4">
                                                    <input
                                                        type="password"
                                                        placeholder="New Password"
                                                        value={newPassword}
                                                        onChange={(e) => setNewPassword(e.target.value)}
                                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500 transition-all placeholder:text-slate-600"
                                                    />
                                                    <input
                                                        type="password"
                                                        placeholder="Confirm New Password"
                                                        value={confirmPassword}
                                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500 transition-all placeholder:text-slate-600"
                                                    />
                                                </div>
                                                <button
                                                    onClick={handlePasswordChange}
                                                    disabled={isSaving}
                                                    className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg transition-colors border border-slate-700 disabled:opacity-50"
                                                >
                                                    {isSaving ? 'Updating...' : 'Update Password'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer Action - Justify Between */}
                <div className="px-8 py-5 border-t border-slate-800 bg-slate-900 flex justify-between items-center z-20 shadow-[0_-10px_20px_-5px_rgba(0,0,0,0.3)]">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 text-white hover:text-white/80 transition-colors font-semibold text-sm hover:bg-white/5 rounded-lg border border-transparent hover:border-white/10"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-8 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-bold shadow-lg shadow-emerald-900/40 active:scale-95 transition-all flex items-center gap-2 text-sm border border-emerald-500/50"
                    >
                        {isSaving ? (
                            <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <Save size={18} />
                        )}
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>

            </div>
        </div>
    );
}

function TabButton({ active, onClick, icon: Icon, label }: { active: boolean, onClick: () => void, icon: any, label: string }) {
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all text-sm font-semibold relative overflow-hidden group ${active
                ? 'bg-emerald-500/10 border border-emerald-500/20 shadow-sm'
                : 'hover:bg-white/5 border border-transparent'
                }`}
        >
            <Icon
                size={20}
                color={active ? '#34d399' : '#ffffff'}
                className="transition-colors shrink-0"
            />
            <span style={{ color: '#ffffff' }}>{label}</span>
            {active && <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500 rounded-l-md" />}
        </button>
    );
}

function FormGroup({ label, children }: { label: string, children: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-2.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">{label}</label>
            {children}
        </div>
    );
}
