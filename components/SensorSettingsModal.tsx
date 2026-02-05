import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Wifi, Smartphone, Bluetooth, Save, Server, Activity } from 'lucide-react';
import { useSensor } from '@/context/SensorContext';
import { sensorManager } from '@/services/SensorManager';

interface SensorSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function SensorSettingsModal({ isOpen, onClose }: SensorSettingsModalProps) {
    const { source, connectionStatus, battery, heading, speed, depth, temp } = useSensor();

    const [ip, setIp] = useState('192.168.1.5');
    const [port, setPort] = useState('3000');

    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    if (!isOpen || !mounted) return null;

    const handleConnectSignalK = () => {
        sensorManager.connectNMEA(ip, parseInt(port));
    };

    return createPortal(
        <div
            onClick={onClose}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 2000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1rem',
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                backdropFilter: 'blur(4px)'
            }}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    backgroundColor: '#0f172a',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '1rem',
                    width: '100%',
                    maxWidth: '28rem',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                    overflow: 'hidden',
                    fontFamily: 'system-ui, sans-serif'
                }}
            >

                {/* Header */}
                <div style={{
                    padding: '1rem',
                    borderBottom: '1px solid rgba(255,255,255,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'white' }}>
                        <Activity size={20} style={{ color: '#60a5fa' }} />
                        <h2 style={{ fontWeight: 'bold', fontSize: '1.125rem' }}>Sensor Hub</h2>
                    </div>
                    <button
                        onClick={onClose}
                        style={{ color: '#94a3b8', cursor: 'pointer', background: 'none', border: 'none', padding: '4px' }}
                    >
                        <X size={20} />
                    </button>
                </div>

                <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    {/* Status Badge */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.75rem',
                        borderRadius: '0.5rem',
                        backgroundColor: 'rgba(30, 41, 59, 0.5)',
                        border: '1px solid rgba(255, 255, 255, 0.05)'
                    }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase' }}>Current Source</span>
                            <span style={{ color: 'white', fontWeight: 500, textTransform: 'capitalize', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                {source === 'internal' && <Smartphone size={14} style={{ color: '#34d399' }} />}
                                {source === 'ble' && <Bluetooth size={14} style={{ color: '#60a5fa' }} />}
                                {source === 'nmea' && <Server size={14} style={{ color: '#fbbf24' }} />}
                                {source}
                            </span>
                        </div>
                        <div style={{
                            padding: '0.25rem 0.75rem',
                            borderRadius: '9999px',
                            fontSize: '0.75rem',
                            fontWeight: 'bold',
                            border: '1px solid',
                            backgroundColor: connectionStatus === 'connected' ? 'rgba(16, 185, 129, 0.1)' : connectionStatus === 'searching' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                            borderColor: connectionStatus === 'connected' ? 'rgba(16, 185, 129, 0.2)' : connectionStatus === 'searching' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                            color: connectionStatus === 'connected' ? '#34d399' : connectionStatus === 'searching' ? '#fbbf24' : '#f87171'
                        }}>
                            {connectionStatus.toUpperCase()}
                        </div>
                    </div>

                    {/* Data Preview */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', textAlign: 'center' }}>
                        {[
                            { label: 'SOG', value: speed ? (speed * 1.94).toFixed(1) : '-' },
                            { label: 'HDG', value: heading ? heading.toFixed(0) + '°' : '-' },
                            { label: 'DPT', value: depth ? depth.toFixed(1) + 'm' : '-' },
                            { label: 'TMP', value: temp ? temp.toFixed(1) + '°C' : '-' }
                        ].map((item, i) => (
                            <div key={i} style={{ padding: '0.5rem', backgroundColor: '#1e293b', borderRadius: '0.5rem' }}>
                                <div style={{ fontSize: '0.625rem', color: '#64748b', textTransform: 'uppercase' }}>{item.label}</div>
                                <div style={{ color: 'white', fontFamily: 'monospace', fontWeight: 'bold' }}>{item.value}</div>
                            </div>
                        ))}
                    </div>

                    <div style={{ height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />

                    {/* Connection Options */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                        {/* Option 1: Bluetooth */}
                        <div>
                            <h3 style={{ fontSize: '0.875rem', fontWeight: 'bold', color: '#cbd5e1', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Bluetooth size={16} /> Bluetooth Low Energy
                            </h3>
                            <button
                                onClick={() => sensorManager.connectBLE()}
                                style={{
                                    width: '100%',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                    padding: '0.75rem',
                                    borderRadius: '0.5rem',
                                    backgroundColor: '#2563eb',
                                    color: 'white',
                                    fontWeight: 500,
                                    border: 'none',
                                    cursor: 'pointer'
                                }}
                            >
                                <Bluetooth size={18} />
                                {source === 'ble' && connectionStatus === 'connected' ? 'Re-Scan Devices' : 'Connect BLE Sensor'}
                            </button>
                            <p style={{ fontSize: '0.6875rem', color: '#64748b', marginTop: '0.25rem', paddingLeft: '0.25rem' }}>
                                Supports Environmental Sensing (Temp) & Location/Nav (Speed, Depth).
                            </p>
                        </div>

                        {/* Option 2: Signal K / NMEA */}
                        <div>
                            <h3 style={{ fontSize: '0.875rem', fontWeight: 'bold', color: '#cbd5e1', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Wifi size={16} /> Boat Network (Signal K)
                            </h3>
                            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                <input
                                    type="text"
                                    value={ip}
                                    onChange={(e) => setIp(e.target.value)}
                                    style={{ flex: 1, backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '0.5rem', padding: '0.5rem 0.75rem', color: 'white', fontSize: '0.875rem' }}
                                    placeholder="192.168.1.X"
                                />
                                <input
                                    type="text"
                                    value={port}
                                    onChange={(e) => setPort(e.target.value)}
                                    style={{ width: '5rem', backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '0.5rem', padding: '0.5rem 0.75rem', color: 'white', fontSize: '0.875rem', textAlign: 'center' }}
                                    placeholder="3000"
                                />
                            </div>
                            <button
                                onClick={handleConnectSignalK}
                                style={{
                                    width: '100%',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                    padding: '0.75rem',
                                    borderRadius: '0.5rem',
                                    backgroundColor: '#334155',
                                    color: 'white',
                                    fontWeight: 500,
                                    border: '1px solid #475569',
                                    cursor: 'pointer'
                                }}
                            >
                                <Wifi size={18} />
                                Connect Signal K
                            </button>
                        </div>

                        {/* Option 3: Internal */}
                        <button
                            onClick={() => sensorManager.connectInternal()}
                            style={{ width: '100%', fontSize: '0.75rem', color: '#64748b', background: 'none', border: 'none', textDecoration: 'underline', textDecorationStyle: 'dotted', cursor: 'pointer' }}
                        >
                            Reset to Internal Phone GPS
                        </button>

                    </div>

                </div>
            </div>
        </div>,
        document.body
    );
}
