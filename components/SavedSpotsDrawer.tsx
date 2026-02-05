'use client';

import { useState, useEffect } from 'react';
import { X, Trash2, MapPin, Navigation } from 'lucide-react';
import { SavedSpot, getSavedSpots, deleteSpot } from '@/utils/Storage';

interface SavedSpotsDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectSpot: (lat: number, lng: number) => void;
}

export default function SavedSpotsDrawer({ isOpen, onClose, onSelectSpot }: SavedSpotsDrawerProps) {
    const [spots, setSpots] = useState<SavedSpot[]>([]);

    useEffect(() => {
        if (isOpen) {
            setSpots(getSavedSpots());
        }
    }, [isOpen]);

    const handleDelete = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        deleteSpot(id);
        setSpots(prev => prev.filter(s => s.id !== id));
    };

    return (
        <>
            {/* Backdrop */}
            {isOpen && (
                <div
                    className="drawer-backdrop"
                    onClick={onClose}
                />
            )}

            {/* Drawer */}
            <div
                className="drawer-panel"
                style={{
                    transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
                    transition: 'transform 0.3s ease-out'
                }}
            >
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Saved Spots</h2>
                    <button onClick={onClose} style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }}>
                        <X size={20} />
                    </button>
                </div>

                {spots.length === 0 ? (
                    <div className="flex-col items-center justify-center text-center p-6" style={{ flex: 1, display: 'flex', opacity: 0.7 }}>
                        <MapPin size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                        <p>No saved spots yet.</p>
                        <p className="text-sm mt-2 opacity-60">
                            When you find a good location, tap the "Save" button to keep it here.
                        </p>
                    </div>
                ) : (
                    <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {spots.map(spot => {
                            const badgeColor =
                                spot.verdict === 'good' ? 'var(--color-accent-good)' :
                                    spot.verdict === 'borderline' ? 'var(--color-accent-warn)' :
                                        'var(--color-accent-bad)';

                            return (
                                <div
                                    key={spot.id}
                                    onClick={() => {
                                        onSelectSpot(spot.lat, spot.lng);
                                        onClose();
                                    }}
                                    className="glass-panel hover:bg-white/5 transition-colors"
                                    style={{ cursor: 'pointer', position: 'relative', padding: '1rem' }}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-semibold text-lg">{spot.name}</h3>
                                        <div style={{
                                            padding: '0.1rem 0.5rem',
                                            borderRadius: '4px',
                                            fontSize: '0.75rem',
                                            fontWeight: 'bold',
                                            textTransform: 'uppercase',
                                            border: `1px solid ${badgeColor}`,
                                            color: badgeColor,
                                            background: 'rgba(0,0,0,0.3)'
                                        }}>
                                            Score: {spot.score}
                                        </div>
                                    </div>

                                    <div className="text-xs text-muted mb-2 flex items-center gap-2">
                                        <span>{new Date(spot.timestamp).toLocaleDateString()}</span>
                                        <span>•</span>
                                        <span>{spot.species}</span>
                                    </div>

                                    {/* Conditions Snapshot */}
                                    {spot.conditions && (
                                        <div className="grid grid-cols-2 gap-2 text-xs text-slate-400 mb-3 bg-slate-950/20 p-2 rounded">
                                            {spot.conditions.depth && <div>Depth: <span className="text-slate-200">{spot.conditions.depth}m</span></div>}
                                            {spot.conditions.temp && <div>Temp: <span className="text-slate-200">{spot.conditions.temp}°C</span></div>}
                                            {spot.conditions.weather && <div className="col-span-2">Weather: <span className="text-slate-200">{spot.conditions.weather}</span></div>}
                                        </div>
                                    )}

                                    {/* Tags */}
                                    {spot.tags && spot.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mb-2">
                                            {spot.tags.map(tag => (
                                                <span key={tag} className="px-2 py-0.5 rounded-full bg-slate-700/50 text-slate-300 text-[10px] border border-slate-600">
                                                    #{tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    {/* Notes */}
                                    {spot.notes && (
                                        <div className="text-xs text-slate-500 italic mb-2 border-l-2 border-slate-700 pl-2">
                                            "{spot.notes.length > 50 ? spot.notes.substring(0, 50) + '...' : spot.notes}"
                                        </div>
                                    )}

                                    <div className="flex items-center gap-4 mt-2 pt-2 border-t border-white/5">
                                        <button
                                            onClick={(e) => handleDelete(spot.id, e)}
                                            className="text-rose-500/80 hover:text-rose-400 p-1 -ml-1"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                        <div style={{ flex: 1, textAlign: 'right', fontSize: '0.75rem', fontStyle: 'italic', opacity: 0.5 }}>
                                            Tap to view
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </>
    );
}
