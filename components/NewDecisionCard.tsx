'use client';

import { useState, useEffect, useMemo } from 'react';
import { Fish, MapPin, Navigation, Info, Bookmark, Waves, TrendingDown, Wind, Anchor, Search, Lock, Loader2, Sparkles, Minimize2, Maximize2 } from 'lucide-react';
import { calculateFishability, Species, FishabilityResult } from '@/utils/FishabilityEngine';
import { saveSpot } from '@/utils/Storage';
import { getWaterDepth, DepthResult, scanForStructure } from '@/utils/DepthService';
import { getCurrentWeather, WeatherResult } from '@/services/WeatherService';
import { useUser } from '@/context/UserContext';
import { ScoutService, ScoutSpot } from '@/services/ScoutService';

interface DecisionCardProps {
    initialLat: number;
    initialLng: number;
    userLocation?: [number, number] | null;
    onStructureFound?: (locations: Array<{ lat: number; lng: number }>) => void;
    onScoutFound?: (spots: ScoutSpot[]) => void;
    onOpenPricing?: (reason: string) => void;
    onRequestSave?: (data: { lat: number; lng: number; score: number; depth?: number }) => void;
}

export default function DecisionCard({
    initialLat,
    initialLng,
    userLocation,
    onStructureFound,
    onScoutFound,
    onOpenPricing,
    onRequestSave
}: DecisionCardProps) {
    const { user } = useUser();
    const [species, setSpecies] = useState<Species>('Bass');
    const [hoveredItem, setHoveredItem] = useState<number | null>(null);
    // Removed result state in favor of useMemo
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [depth, setDepth] = useState<DepthResult | null>(null);
    const [weather, setWeather] = useState<WeatherResult | null>(null);
    const [loadingDepth, setLoadingDepth] = useState(false);
    const [structureAlert, setStructureAlert] = useState<boolean>(false);
    const [isScanning, setIsScanning] = useState(false); // For structure scan
    const [isScouting, setIsScouting] = useState(false); // For AI Scout
    const [isDocked, setIsDocked] = useState(false);

    // Memoized Result Calculation (No setState in Effect)
    const result = useMemo(() => {
        return calculateFishability(initialLat, initialLng, species);
    }, [initialLat, initialLng, species]);

    // ETA State
    const [speed, setSpeed] = useState(25); // Default 25 knots

    // Haversine Distance Calculation (Nautical Miles)
    const travelData = useMemo(() => {
        if (!userLocation) return null;

        const R = 3440.065; // Earth radius in NM
        const dLat = (initialLat - userLocation[0]) * Math.PI / 180;
        const dLon = (initialLng - userLocation[1]) * Math.PI / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(userLocation[0] * Math.PI / 180) * Math.cos(initialLat * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distanceNM = R * c;

        const timeHours = distanceNM / Math.max(1, speed);
        const timeMins = Math.round(timeHours * 60);

        return {
            distance: distanceNM.toFixed(1),
            time: timeMins < 60 ? `${timeMins} min` : `${Math.floor(timeMins / 60)}h ${timeMins % 60}m`
        };
    }, [userLocation, initialLat, initialLng, speed]);

    // Derived state for depth loading (reset on coords change)
    useEffect(() => {
        setLoadingDepth(true);
        // ... (rest of logic in subsequent code)
        setStructureAlert(false);

        // Debounce Network Calls (1s) to prevent 429 Rate Limits
        const timer = setTimeout(() => {
            // 1. Parallel: Check Depth API AND Check Reef Status AND Check Weather
            Promise.all([
                getWaterDepth(initialLat, initialLng),
                ScoutService.checkLocationType(initialLat, initialLng),
                getCurrentWeather(initialLat, initialLng)
            ]).then(([depthData, reefStatus, weatherData]) => {

                if (weatherData) setWeather(weatherData);

                // --- Depth Logic with Override ---
                if (reefStatus.isReef && reefStatus.depth) {
                    // FOUND REEF: Override Depth!
                    console.log("Reef Detected! Overriding Depth.");
                    setDepth({
                        meters: reefStatus.depth,
                        feet: Math.round(reefStatus.depth * 3.28),
                        isLand: false,
                        source: `Verified ${reefStatus.type}`
                    });
                } else {
                    // Normal Depth API
                    setDepth(depthData);
                }
                setLoadingDepth(false);

                // --- Auto-Trigger Scout (Passive Reef Finding) ---
                // User requirement: "point the reefs without searching"
                // We silently run the scan and populate markers.
                if (onScoutFound) {
                    ScoutService.scanArea([initialLat, initialLng]).then(spots => {
                        onScoutFound(spots);
                    });
                }

                // --- Structure Scan (Pro Only) ---
                if (depthData && !depthData.isLand && user?.isPro) {
                    setTimeout(() => {
                        scanForStructure(initialLat, initialLng).then(scan => {
                            if (scan.found && scan.locations) {
                                setStructureAlert(true);
                                if (onStructureFound) onStructureFound(scan.locations);
                            }
                        }).catch(e => console.warn("Structure scan skipped", e));
                    }, 2000);
                }

            }).catch(err => {
                console.error("Analysis failed", err);
                setLoadingDepth(false);
            });
        }, 1500); // 1.5s Debounce

        return () => clearTimeout(timer);
    }, [initialLat, initialLng, species, onStructureFound, onScoutFound, user?.isPro]);

    const onSave = () => {
        if (!result) return;

        if (onRequestSave) {
            onRequestSave({
                lat: initialLat,
                lng: initialLng,
                score: result.score,
                depth: depth?.meters
            });
        } else {
            // Fallback if no callback provided (legacy behavior)
            const name = prompt("Name this fishing spot:", "My Secret Spot");
            if (name) {
                saveSpot({
                    name,
                    lat: initialLat,
                    lng: initialLng,
                    species,
                    score: result.score,
                    verdict: result.verdict,
                    notes: "Auto-saved by GPSonWaves",
                    tags: [],
                    conditions: {
                        depth: depth?.meters
                    }
                });
                alert("Spot saved!");
            }
        }
    };

    if (!result) return null;

    const scoreColor =
        result.verdict === 'good' ? 'var(--color-accent-good)' :
            result.verdict === 'borderline' ? 'var(--color-accent-warn)' :
                'var(--color-accent-bad)';

    if (isDocked) {
        return (
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    setIsDocked(false);
                }}
                className="group flex items-center gap-3 bg-slate-900/90 border border-white/20 backdrop-blur-md rounded-full pl-4 pr-2 py-2 shadow-xl hover:scale-105 transition-all active:scale-95 cursor-pointer"
                style={{
                    position: 'fixed',
                    bottom: '9rem', // Above Center Button
                    left: '0.75rem',
                    zIndex: 99999,
                    pointerEvents: 'auto',
                    maxWidth: 'calc(100% - 1.5rem)' // Prevent overflow on small screens
                }}
            >
                {/* 1. Mini Score Circle */}
                <div style={{
                    width: '48px', // Slightly larger
                    height: '48px',
                    borderRadius: '50%',
                    border: `3px solid ${scoreColor}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: scoreColor,
                    fontSize: '1.5rem', // Larger number
                    fontWeight: '800', // Bolder
                    boxShadow: `0 0 15px ${scoreColor}40`,
                    flexShrink: 0,
                    backgroundColor: 'rgba(15, 23, 42, 0.8)' // Darker background for contrast
                }}>
                    {result.score}
                </div>

                {/* 2. Compact Verdict Text */}
                <div className="flex flex-col items-start justify-center px-2">
                    {/* Removed "Verdict" label for cleaner look */}
                    <span className="text-sm font-bold whitespace-nowrap leading-tight text-white shadow-black drop-shadow-md">
                        {result.verdict === 'good' ? 'Worth Fishing' :
                            result.verdict === 'borderline' ? 'Borderline' : 'Not Worth It'}
                    </span>
                    <span className="text-[10px] text-slate-300">
                        Tap to expand
                    </span>
                </div>

                {/* 3. Divider & Expand Icon - Pushed to right */}
                <div className="flex-1" /> {/* Spacer */}

                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0 border border-white/10">
                    <Maximize2 size={16} color="white" strokeWidth={3} />
                </div>
            </button>
        );
    }

    // Default Expanded Card
    return (
        <div className="glass-panel decision-card" style={{
            pointerEvents: 'auto',
            position: 'fixed',
            top: '4.5rem',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1001,
            display: 'flex',
            flexDirection: 'column',
            maxWidth: '400px',
            width: '95%',
            maxHeight: '70dvh', // Stricter height (70% of screen)
            overflow: 'hidden'
        }}
            onClick={(e) => e.stopPropagation()}
        >

            {/* Header Flex Row - FIXED at Top */}
            <div className="flex justify-between items-start mb-4 relative z-20 shrink-0 border-b border-white/5 pb-2">
                {/* 1. Title / Location Info */}
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-muted">
                        <MapPin size={18} />
                        <span className="text-sm font-bold" style={{ borderBottom: '1px dashed currentColor' }}>
                            Current Location
                        </span>
                    </div>
                    <div className="text-[10px] text-muted font-mono opacity-70 mb-1">
                        {initialLat.toFixed(5)}, {initialLng.toFixed(5)}
                    </div>

                    {/* Depth Display */}
                    <div className="text-xs text-brand-blue flex items-center gap-1 opacity-80" style={{ color: 'var(--color-text-muted)' }}>
                        <Waves size={12} />
                        {loadingDepth ? (
                            <span className="animate-pulse">Checking depth...</span>
                        ) : depth ? (
                            depth.isLand ? (
                                <span className="text-emerald font-bold">
                                    Land (Above Water) <span className="text-[10px] text-muted font-normal uppercase opacity-50 ml-1">({depth.source})</span>
                                </span>
                            ) : (
                                <span>
                                    Depth: <strong>{depth.meters}m</strong> ({depth.feet}ft)
                                    <span className="text-[10px] text-muted uppercase opacity-50 ml-1">({depth.source})</span>
                                </span>
                            )
                        ) : (
                            <span>Depth unavailable</span>
                        )}
                    </div>
                </div>

                {/* 2. Controls Row (Minimize + Species) */}
                <div className="flex items-center gap-2">

                    {/* Species Selector */}
                    <div className="relative group">
                        <button
                            className="btn-secondary cursor-pointer h-8"
                            style={{ padding: '0 0.75rem', fontSize: '0.75rem' }}
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        >
                            <Fish size={14} />
                            {species}
                        </button>

                        {/* Dropdown Logic */}
                        {isDropdownOpen && (
                            <>
                                <div className="fixed inset-0 z-40 cursor-default" onClick={() => setIsDropdownOpen(false)} style={{ pointerEvents: 'auto' }} />
                                <div className="glass-panel absolute" style={{
                                    top: '100%', right: 0, marginTop: '0.25rem',
                                    flexDirection: 'column', gap: '0.25rem', width: '140px', zIndex: 50, display: 'flex'
                                }}>
                                    {['Bass', 'Trout', 'Saltwater General', 'Redfish'].map(sp => (
                                        <div
                                            key={sp}
                                            className="hover-bg-white-10"
                                            style={{ padding: '0.5rem', cursor: 'pointer', borderRadius: '8px', fontSize: '0.8rem' }}
                                            onClick={() => {
                                                setSpecies(sp as Species);
                                                setIsDropdownOpen(false);
                                            }}
                                        >
                                            {sp}
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Minimize Button - Now integrated in header */}
                    <button
                        onClick={() => setIsDocked(true)}
                        className="bg-slate-800/50 hover:bg-slate-700 text-white rounded-lg flex items-center justify-center transition-all border border-white/10"
                        style={{ width: '32px', height: '32px' }}
                        title="Minimize Map"
                    >
                        <Minimize2 size={18} />
                    </button>

                </div>
            </div>

            {/* Scrollable Content Body */}
            <div style={{ overflowY: 'auto', flex: 1, minHeight: 0, paddingRight: '0.25rem' }} className="custom-scrollbar">

                {/* Score or Land Override */}
                <div className="flex flex-col items-center justify-center gap-2 mb-4">
                    {depth && depth.isLand ? (
                        <>
                            <div className="score-circle" style={{ color: '#64748b', borderColor: '#475569', background: 'rgba(71, 85, 105, 0.1)' }}>
                                <MapPin size={48} className="opacity-50" />
                            </div>
                            <div className="text-xl font-bold text-center text-slate-400 uppercase tracking-[0.2em]">
                                LAND
                            </div>
                            <div className="text-xs text-slate-500 font-medium animate-pulse">
                                Tap on water to analyze
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="score-circle" style={{ color: scoreColor }}>
                                {result.score}
                            </div>

                            <div className="text-xl font-bold text-center" style={{ color: scoreColor, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                {result.verdict === 'good' ? 'Worth Fishing' :
                                    result.verdict === 'borderline' ? 'Borderline' : 'Not Worth It'}
                            </div>
                        </>
                    )}

                    {structureAlert && (
                        <div className="mt-2 flex items-center gap-2 px-3 py-1 rounded bg-amber-500/20 text-warn border border-amber-500/50 animate-pulse font-bold text-xs uppercase tracking-wide">
                            <TrendingDown size={14} />
                            Drop-off Detected!
                        </div>
                    )}
                </div>

                {/* Weather & Sea Conditions (Moved UP for Mobile Visibility) */}
                {weather && (
                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '0.75rem' }}>
                        <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-2">
                            <Wind size={14} />
                            Live Conditions
                        </h3>
                        <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                            {/* Wind */}
                            <div className="flex flex-col">
                                <span className="text-[10px] text-muted">Wind (Beaufort {weather.beaufort})</span>
                                <div className="flex items-center gap-1">
                                    <span className="font-bold text-sm text-white">{weather.windSpeed} km/h</span>
                                    <span className="text-xs text-slate-400" style={{ transform: `rotate(${weather.windDirection}deg)` }}>↓</span>
                                </div>
                            </div>
                            {/* Weather */}
                            <div className="flex flex-col">
                                <span className="text-[10px] text-muted">Sky</span>
                                <span className="font-bold text-sm text-white">{weather.condition}</span>
                            </div>
                            {/* Waves */}
                            <div className="flex flex-col">
                                <span className="text-[10px] text-muted">Waves</span>
                                <div className="flex items-center gap-1">
                                    <Waves size={14} className="text-blue-400" />
                                    <span className="font-bold text-sm text-white">
                                        {weather.waveHeight?.toFixed(1)}m
                                    </span>
                                    <span className="text-xs text-slate-400">
                                        {weather.wavePeriod}s
                                    </span>
                                </div>
                            </div>
                            {/* Air/Water Temp */}
                            <div className="flex flex-col">
                                <span className="text-[10px] text-muted">Temps (Air/Water)</span>
                                <span className="font-bold text-sm text-white">
                                    {Math.round(weather.temp)}° <span className="text-slate-500">/</span> {weather.waterTemp ? Math.round(weather.waterTemp) : '--'}°
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Explanation */}
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '0.75rem' }}>
                    <h3 className="font-bold text-base mb-2 flex items-center gap-2">
                        <Info size={16} className="text-muted" />
                        {result.explanation.title}
                    </h3>
                    <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingLeft: '0.5rem' }}>
                        {result.explanation.details.map((detail, i) => (
                            <li key={i} className="text-sm text-muted flex items-start gap-2">
                                <span style={{ marginTop: '0.4rem', width: '6px', height: '6px', borderRadius: '50%', background: 'rgba(255,255,255,0.5)', flexShrink: 0 }} />
                                {detail}
                            </li>
                        ))}
                    </ul>
                    {result.explanation.window && (
                        <div className="mt-4 text-xs font-bold" style={{ paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.1)', opacity: 0.8 }}>
                            💡 {result.explanation.window}
                        </div>
                    )}
                </div>

                {/* AI Scout Button */}
                <button
                    onClick={() => {
                        if (user?.isPro) {
                            setIsScouting(true);
                            ScoutService.scanArea([initialLat, initialLng]).then(spots => {
                                if (onScoutFound) onScoutFound(spots);
                                setIsScouting(false);
                            });
                        } else {
                            if (onOpenPricing) onOpenPricing("AI Local Scout");
                        }
                    }}
                    disabled={isScouting}
                    style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        fontWeight: 'bold',
                        borderRadius: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        marginBottom: '0.75rem',
                        position: 'relative',
                        zIndex: 20,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        backgroundColor: user?.isPro ? 'rgba(16, 185, 129, 0.2)' : '#1e293b',
                        color: user?.isPro ? 'white' : '#e2e8f0',
                        border: user?.isPro ? '1px solid rgba(16, 185, 129, 0.5)' : '1px solid #334155',
                        boxShadow: user?.isPro ? '0 0 15px rgba(16,185,129,0.3)' : 'none'
                    }}
                >
                    {isScouting ? (
                        <Loader2 className="animate-spin" size={20} />
                    ) : (
                        user?.isPro ? <Sparkles size={20} /> : <Lock size={16} />
                    )}
                    <span>{isScouting ? 'AI Analyzing Area...' : 'AI Local Scout (500m)'}</span>
                </button>

                {/* Travel Time / ETA */}
                {travelData && (
                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                                <Navigation size={14} />
                                ETA ({speed} kts)
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-lg font-bold text-white">{travelData.time}</span>
                                <span className="text-xs text-slate-400">({travelData.distance} NM)</span>
                            </div>
                        </div>

                        {/* Speed Adjust */}
                        <div className="flex flex-col items-end gap-1">
                            <label className="text-[10px] text-muted uppercase">Boat Speed</label>
                            <div className="flex items-center gap-2 bg-slate-800 rounded px-2 py-1 border border-slate-700">
                                <button
                                    onClick={() => setSpeed(Math.max(5, speed - 5))}
                                    className="text-white hover:text-emerald-400 px-1 font-bold"
                                >-</button>
                                <span className="text-sm font-mono w-4 text-center text-white">{speed}</span>
                                <button
                                    onClick={() => setSpeed(Math.min(60, speed + 5))}
                                    className="text-white hover:text-emerald-400 px-1 font-bold"
                                >+</button>
                            </div>
                        </div>
                    </div>
                )}
                {/* End Scrollable Content */}
            </div>

            {/* Action Buttons (Footer) */}
            <div className="flex gap-2 shrink-0 mt-3">
                <button
                    onClick={onSave}
                    className="btn-secondary"
                    style={{ flex: 1 }}
                >
                    <Bookmark size={18} />
                    Save Spot
                </button>
                <button
                    className="btn-primary"
                    style={{ flex: 1 }}
                    onClick={() => {
                        window.open(`https://www.google.com/maps/dir/?api=1&destination=${initialLat},${initialLng}`, '_blank');
                    }}
                >
                    <Navigation size={18} />
                    Go
                </button>
            </div>

        </div >
    );
}
