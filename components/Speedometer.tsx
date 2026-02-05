'use client';

import { useState, useEffect } from 'react';
import { Gauge, Navigation, Bluetooth, Settings, Wifi } from 'lucide-react';
import { useSensor } from '@/context/SensorContext';
import { sensorManager } from '@/services/SensorManager';
import SensorSettingsModal from './SensorSettingsModal';

export default function Speedometer() {
    const { speed, heading, connectionStatus, source } = useSensor();
    const [showSettings, setShowSettings] = useState(false);

    // Convert m/s to Knots (1 m/s = 1.94384 knots)
    const currentSpeed = speed || 0;
    const knots = (currentSpeed * 1.94384).toFixed(1);
    // Convert m/s to km/h (1 m/s = 3.6 km/h)
    const kmh = (currentSpeed * 3.6).toFixed(1);

    return (
        <>
            <SensorSettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />

            <div style={{
                position: 'fixed',
                top: '4.5rem',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 1000, // Elevated above map overlays
                pointerEvents: 'auto',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem'
            }}>
                <button
                    onClick={() => setShowSettings(true)}
                    className="glass-panel"
                    style={{
                        padding: '0.75rem 1.5rem',
                        borderRadius: '999px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        cursor: 'pointer',
                        position: 'relative',
                        transition: 'all 0.2s ease',
                        color: 'inherit', // vital
                        background: 'rgba(15, 23, 42, 0.6)',
                        backdropFilter: 'blur(12px)'
                    }}
                >
                    {/* Status Dot (Top Right) */}
                    <div className={`absolute top-2 right-2 w-2 h-2 rounded-full border border-slate-900 ${connectionStatus === 'connected' ? 'bg-emerald-400' :
                        connectionStatus === 'searching' ? 'bg-amber-400 animate-pulse' :
                            'hidden'
                        }`} />

                    <div className="flex flex-col items-center leading-none">
                        <span className="text-2xl font-bold text-white font-outfit" style={{ minWidth: '3ch', textAlign: 'center' }}>
                            {knots}
                        </span>
                        <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Knots</span>
                    </div>

                    <div className="h-8 w-px bg-slate-700" />

                    <div className="flex flex-col items-center leading-none">
                        <span className="text-lg font-bold text-slate-300 font-outfit" style={{ minWidth: '3ch', textAlign: 'center' }}>
                            {kmh}
                        </span>
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">km/h</span>
                    </div>

                    {typeof heading === 'number' && !isNaN(heading) && (
                        <>
                            <div className="h-8 w-px bg-slate-700" />
                            <div style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <Navigation
                                    size={20}
                                    className="text-emerald-400"
                                    style={{ transform: `rotate(${heading ?? 0}deg)`, transition: 'transform 0.5s ease-out' }}
                                />
                            </div>
                        </>
                    )}
                </button>
            </div>
        </>
    );
}
