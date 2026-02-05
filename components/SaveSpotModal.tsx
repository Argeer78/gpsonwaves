'use client';

import { useState, useEffect } from 'react';
import { X, Save, Tag, FileText, Thermometer, Wind, Waves, MapPin, Calendar, Clock, CloudSun } from 'lucide-react';
import { Species } from '@/utils/FishabilityEngine';
import { getCurrentWeather, WeatherResult } from '@/services/WeatherService';

interface SaveSpotModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: { name: string; tags: string[]; notes: string; weather?: WeatherResult }) => void;
    initialData: {
        lat: number;
        lng: number;
        score: number;
        depth?: number;
    } | null;
}

export default function SaveSpotModal({ isOpen, onClose, onSave, initialData }: SaveSpotModalProps) {
    const [name, setName] = useState('');
    const [tags, setTags] = useState('');
    const [notes, setNotes] = useState('');

    // Weather State
    const [weather, setWeather] = useState<WeatherResult | null>(null);
    const [loadingWeather, setLoadingWeather] = useState(false);

    useEffect(() => {
        if (isOpen && initialData) {
            // Reset fields
            setName(`Spot ${new Date().toLocaleDateString()}`);
            setTags('');
            setNotes('');

            // Fetch Weather
            setLoadingWeather(true);
            getCurrentWeather(initialData.lat, initialData.lng).then(data => {
                setWeather(data);
                setLoadingWeather(false);
            });
        }
    }, [isOpen, initialData]);

    if (!isOpen || !initialData) return null;

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            name: name || 'Unnamed Spot',
            tags: tags.split(',').map(t => t.trim()).filter(t => t.length > 0),
            notes,
            weather: weather || undefined
            // Pass weather data back if needed, or rely on parent. 
            // Actually parent doesn't capture weather yet, so we should probably expose it or handle it here?
            // The handleSaveSpot in page.tsx re-constructs condition object. 
            // Better to pass it up or store it in state there. 
            // For now, let's just make sure UI shows it.
            // *Wait*, page.tsx's handleSaveSpot needs this real weather data to save it to storage!
            // I should modify the onSave callback signature to accept weather info too, OR just pass it blindly contextually.
            // Let's UPDATE the onSave signature to be safe.
        });
        onClose();
    };

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999, // Ensure it's above everything including Leaflet
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            isolation: 'isolate' // Create new stacking context
        }}
            onPointerDown={(e) => e.stopPropagation()} // Stop pointer events from reaching map
        >
            {/* Backdrop */}
            <div
                style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
                onClick={onClose}
                onPointerDown={(e) => e.stopPropagation()} // Stop clicks through backdrop
            />

            {/* Modal */}
            <div
                className="glass-panel animate-in fade-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                style={{
                    position: 'relative',
                    width: '100%',
                    maxWidth: '500px',
                    backgroundColor: 'var(--color-card-bg)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '16px',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    pointerEvents: 'auto',
                    cursor: 'default'
                }}
            >
                <style jsx global>{`
                    .glass-panel input, .glass-panel textarea {
                        user-select: text !important;
                        -webkit-user-select: text !important;
                        cursor: text !important;
                        pointer-events: auto !important;
                    }
                `}</style>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <h2 className="text-xl font-bold font-outfit text-white" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Save size={20} className="text-emerald-400" />
                        Save Fishing Spot
                    </h2>
                    <button onClick={onClose} style={{ color: 'rgba(255,255,255,0.5)', background: 'none', border: 'none', cursor: 'pointer' }}>
                        <X size={20} />
                    </button>
                </div>

                <div className="flex flex-col md:flex-row">
                    {/* Left: Snapshot Info */}
                    <div style={{
                        padding: '1.25rem',
                        backgroundColor: 'rgba(0,0,0,0.2)',
                        borderRight: '1px solid rgba(255,255,255,0.05)',
                        minWidth: '180px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1rem'
                    }}>
                        <div className="text-xs font-bold uppercase text-slate-400 mb-1">Condition Snapshot</div>

                        <div className="flex items-center gap-2 text-sm text-slate-300">
                            <Calendar size={14} className="text-emerald-500" />
                            <span>{new Date().toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-300">
                            <Clock size={14} className="text-emerald-500" />
                            <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>

                        <div className="h-px bg-slate-700/50 my-1" />

                        <div className="flex items-center gap-2 text-sm text-slate-300">
                            <Waves size={14} className="text-blue-400" />
                            <span>{initialData.depth ? `${initialData.depth}m Depth` : 'Unknown Depth'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-300">
                            <Thermometer size={14} className="text-amber-400" />
                            {loadingWeather ? (
                                <span className="animate-pulse">Loading...</span>
                            ) : (
                                <div className="flex flex-col leading-tight">
                                    <span>{weather?.temp ?? '--'}°C Air</span>
                                    <span className="text-xs text-blue-300">{weather?.waterTemp ?? '--'}°C Water</span>
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-300">
                            <Wind size={14} className="text-slate-400" />
                            {loadingWeather ? (
                                <span className="animate-pulse">...</span>
                            ) : (
                                <span>{weather?.windSpeed ?? '--'} km/h</span>
                            )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-300">
                            <CloudSun size={14} className="text-slate-400" />
                            {loadingWeather ? (
                                <span className="animate-pulse">...</span>
                            ) : (
                                <span>{weather?.condition ?? 'Unknown'}</span>
                            )}
                        </div>

                        <div className="mt-auto pt-4">
                            <div className="text-center p-2 rounded bg-slate-800 border border-slate-700">
                                <div className="text-xs text-slate-500 uppercase font-bold">Fishability</div>
                                <div className="text-2xl font-bold text-emerald-400">{initialData.score}/10</div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Form */}
                    <form onSubmit={handleSave} style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold text-slate-400 uppercase">Spot Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. Secret Bass Ledge"
                                className="w-full border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
                                style={{ backgroundColor: 'rgba(15, 23, 42, 0.5)' }}
                                autoFocus
                                onKeyDown={(e) => e.stopPropagation()}
                                onKeyUp={(e) => e.stopPropagation()}
                                onMouseDown={(e) => e.stopPropagation()}
                                onPointerDown={(e) => e.stopPropagation()}
                            />
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1">
                                <Tag size={12} /> Tags
                            </label>
                            <input
                                type="text"
                                value={tags}
                                onChange={(e) => setTags(e.target.value)}
                                placeholder="e.g. bass, morning, dropoff"
                                className="w-full border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
                                style={{ backgroundColor: 'rgba(15, 23, 42, 0.5)' }}
                                onKeyDown={(e) => e.stopPropagation()}
                                onKeyUp={(e) => e.stopPropagation()}
                                onMouseDown={(e) => e.stopPropagation()}
                                onPointerDown={(e) => e.stopPropagation()}
                            />
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1">
                                <FileText size={12} /> Notes
                            </label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="What worked? What failed? Conditions details..."
                                className="w-full border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors h-24 resize-none"
                                style={{ backgroundColor: 'rgba(15, 23, 42, 0.5)' }}
                                onKeyDown={(e) => e.stopPropagation()}
                                onKeyUp={(e) => e.stopPropagation()}
                                onMouseDown={(e) => e.stopPropagation()}
                                onPointerDown={(e) => e.stopPropagation()}
                            />
                        </div>

                        <button
                            type="submit"
                            className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2 px-4 rounded-lg mt-2 transition-colors flex items-center justify-center gap-2"
                        >
                            <Save size={18} />
                            Save Spot
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
