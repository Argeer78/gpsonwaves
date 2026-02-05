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
    onStructureFound?: (locations: Array<{ lat: number; lng: number }>) => void;
    onScoutFound?: (spots: ScoutSpot[]) => void;
    onOpenPricing?: (reason: string) => void;
    onRequestSave?: (data: { lat: number; lng: number; score: number; depth?: number }) => void;
}

export default function DecisionCard({
    initialLat,
    initialLng,
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
            <div
                className="flex flex-col gap-6 items-start"
                style={{
                    position: 'fixed',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    left: '1.5rem',
                    zIndex: 99999,
                    pointerEvents: 'auto'
                }}
                onClick={(e) => e.stopPropagation()}
            >

                {/* 1. Toggle / Maximize */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsDocked(false);
                    }}
                    onMouseEnter={() => setHoveredItem(0)}
                    onMouseLeave={() => setHoveredItem(null)}
                    title="Maximize"
                    style={{
                        zIndex: hoveredItem === 0 ? 50 : 30,
                        pointerEvents: 'auto',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '3rem',
                        position: 'relative',
                        cursor: 'pointer',
                        border: 'none',
                        background: 'transparent'
                    }}
                >
                    {/* Drawer Label (Rendered first, so behind) */}
                    <div
                        style={{
                            height: '3rem',
                            display: 'flex',
                            alignItems: 'center',
                            backgroundColor: '#0f172a', // slate-800
                            borderTop: '1px solid rgba(255,255,255,0.2)',
                            borderBottom: '1px solid rgba(255,255,255,0.2)',
                            borderRight: '1px solid rgba(255,255,255,0.2)',
                            borderTopRightRadius: '0.75rem',
                            borderBottomRightRadius: '0.75rem',
                            transition: 'all 0.3s ease-in-out',
                            overflow: 'hidden',
                            position: 'relative',
                            zIndex: 10,
                            width: hoveredItem === 0 ? '14rem' : '3.5rem'
                        }}
                    >
                        {hoveredItem === 0 && (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', paddingLeft: '3.5rem', paddingRight: '1rem', whiteSpace: 'nowrap' }}>
                                <span style={{ fontSize: '0.875rem', fontWeight: 'bold', color: 'white' }}>Expand Analysis</span>
                            </div>
                        )}
                    </div>
                    {/* Icon Handle (Rendered last, so on top) */}
                    <div style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        width: '3.5rem',
                        height: '3rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#0f172a',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '0 0.75rem 0.75rem 0',
                        zIndex: 20,
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}>
                        <Maximize2 size={24} style={{ color: 'white' }} />
                    </div>
                </button>

                {/* 2. Score Badge */}
                <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setIsDocked(false); }}
                    onMouseEnter={() => setHoveredItem(1)}
                    onMouseLeave={() => setHoveredItem(null)}
                    style={{
                        zIndex: hoveredItem === 1 ? 50 : 30,
                        pointerEvents: 'auto',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '3rem',
                        position: 'relative',
                        cursor: 'pointer',
                        border: 'none',
                        background: 'transparent'
                    }}
                >
                    {/* Drawer Label */}
                    <div
                        style={{
                            height: '3rem',
                            display: 'flex',
                            alignItems: 'center',
                            backgroundColor: '#0f172a',
                            borderTop: '1px solid rgba(255,255,255,0.2)',
                            borderBottom: '1px solid rgba(255,255,255,0.2)',
                            borderRight: '1px solid rgba(255,255,255,0.2)',
                            borderTopRightRadius: '0.75rem',
                            borderBottomRightRadius: '0.75rem',
                            transition: 'all 0.3s ease-in-out',
                            overflow: 'hidden',
                            position: 'relative',
                            zIndex: 10,
                            width: hoveredItem === 1 ? '14rem' : '3.5rem',
                            opacity: hoveredItem === 1 ? 1 : 0
                        }}
                    >
                        {hoveredItem === 1 && (
                            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingLeft: '3.5rem', paddingRight: '1rem', whiteSpace: 'nowrap' }}>
                                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'white' }}>Verdict</span>
                                <span style={{ fontSize: '0.875rem', fontWeight: 'bold', textTransform: 'capitalize', color: scoreColor }}>{result.verdict}</span>
                            </div>
                        )}
                    </div>
                    {/* Icon Handle */}
                    <div style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        width: '3.5rem',
                        height: '3rem',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.125rem',
                        backgroundColor: '#0f172a',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '0 0.75rem 0.75rem 0',
                        zIndex: 20,
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}>
                        <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 'bold', fontSize: '1.25rem', lineHeight: 1, color: scoreColor }}>{result.score}</span>
                        <div style={{ width: '0.375rem', height: '0.375rem', borderRadius: '50%', backgroundColor: scoreColor }} />
                    </div>
                </button>

                {/* 3. Key Insight */}
                <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setIsDocked(false); }}
                    onMouseEnter={() => setHoveredItem(2)}
                    onMouseLeave={() => setHoveredItem(null)}
                    style={{
                        zIndex: hoveredItem === 2 ? 50 : 30,
                        pointerEvents: 'auto',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '3rem',
                        position: 'relative',
                        cursor: 'pointer',
                        border: 'none',
                        background: 'transparent'
                    }}
                >
                    {/* Drawer Label */}
                    <div
                        style={{
                            height: '3rem',
                            display: 'flex',
                            alignItems: 'center',
                            backgroundColor: '#0f172a',
                            borderTop: '1px solid rgba(255,255,255,0.2)',
                            borderBottom: '1px solid rgba(255,255,255,0.2)',
                            borderRight: '1px solid rgba(255,255,255,0.2)',
                            borderTopRightRadius: '0.75rem',
                            borderBottomRightRadius: '0.75rem',
                            transition: 'all 0.3s ease-in-out',
                            overflow: 'hidden',
                            position: 'relative',
                            zIndex: 10,
                            width: hoveredItem === 2 ? '16rem' : '3.5rem',
                            opacity: hoveredItem === 2 ? 1 : 0
                        }}
                    >
                        {hoveredItem === 2 && (
                            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '0.125rem', paddingLeft: '3.5rem', paddingRight: '1rem', whiteSpace: 'nowrap' }}>
                                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'white', overflow: 'hidden', textOverflow: 'ellipsis' }}>{result.explanation.title}</span>
                                <span style={{ fontSize: '0.625rem', color: '#cbd5e1', overflow: 'hidden', textOverflow: 'ellipsis' }}>{result.explanation.window || result.explanation.details[0]}</span>
                            </div>
                        )}
                    </div>
                    {/* Icon Handle */}
                    <div style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        width: '3.5rem',
                        height: '3rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#0f172a',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '0 0.75rem 0.75rem 0',
                        zIndex: 20,
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}>
                        <Sparkles size={22} style={{ color: '#fbbf24', filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.1))' }} />
                    </div>
                </button>

                {/* 4. Depth */}
                {depth && (
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setIsDocked(false); }}
                        onMouseEnter={() => setHoveredItem(3)}
                        onMouseLeave={() => setHoveredItem(null)}
                        style={{
                            zIndex: hoveredItem === 3 ? 50 : 30,
                            pointerEvents: 'auto',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '3rem',
                            position: 'relative',
                            cursor: 'pointer',
                            border: 'none',
                            background: 'transparent'
                        }}
                    >
                        {/* Drawer Label */}
                        <div
                            style={{
                                height: '3rem',
                                display: 'flex',
                                alignItems: 'center',
                                backgroundColor: '#0f172a',
                                borderTop: '1px solid rgba(255,255,255,0.2)',
                                borderBottom: '1px solid rgba(255,255,255,0.2)',
                                borderRight: '1px solid rgba(255,255,255,0.2)',
                                borderTopRightRadius: '0.75rem',
                                borderBottomRightRadius: '0.75rem',
                                transition: 'all 0.3s ease-in-out',
                                overflow: 'hidden',
                                position: 'relative',
                                zIndex: 10,
                                width: hoveredItem === 3 ? '14rem' : '3.5rem',
                                opacity: hoveredItem === 3 ? 1 : 0
                            }}
                        >
                            {hoveredItem === 3 && (
                                <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingLeft: '3.5rem', paddingRight: '1rem', whiteSpace: 'nowrap' }}>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'white' }}>Depth Data</span>
                                    <span style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>{depth.isLand ? 'Land Detected' : `${depth.meters}m (${depth.feet}ft)`}</span>
                                </div>
                            )}
                        </div>
                        {/* Icon Handle */}
                        <div style={{
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            width: '3.5rem',
                            height: '3rem',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.125rem',
                            backgroundColor: '#0f172a',
                            border: '1px solid rgba(255,255,255,0.2)',
                            borderRadius: '0 0.75rem 0.75rem 0',
                            zIndex: 20,
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}>
                            <Waves size={18} style={{ color: '#60a5fa', filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.1))' }} />
                            <span style={{ fontSize: '0.5625rem', fontFamily: 'monospace', fontWeight: 'bold', color: '#cbd5e1' }}>{depth.isLand ? 'Dry' : `${Math.round(depth.meters)}m`}</span>
                        </div>
                    </button>
                )}
            </div>
        );
    }

    // Default Expanded Card
    return (
        <div className="glass-panel decision-card" style={{
            pointerEvents: 'auto',
            position: 'fixed',
            top: '5rem', // Moved up for more space
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            maxWidth: '400px',
            width: '90%',
            maxHeight: '60vh',
            overflowY: 'auto'
        }}
            onClick={(e) => e.stopPropagation()}
        >

            {/* Dock Toggle */}
            <button
                onClick={() => setIsDocked(true)}
                style={{
                    position: 'absolute',
                    top: '0.75rem',
                    right: '0.75rem',
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 20,
                    cursor: 'pointer',
                    color: 'white'
                }}
                className="hover:bg-white/20 transition-colors"
                title="Minimize to Sidebar"
            >
                <Minimize2 size={16} />
            </button>

            {/* Header */}
            <div className="flex justify-between items-center mb-4">
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

                {/* Simple inline selector */}
                <div className="relative group mr-8 z-20">
                    <button
                        className="btn-secondary cursor-pointer"
                        style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    >
                        <Fish size={16} />
                        {species}
                    </button>

                    {/* Dropdown Logic using explicit state */}
                    {isDropdownOpen && (
                        <>
                            {/* Invisible closer backdrop */}
                            <div className="fixed inset-0 z-40 cursor-default" onClick={() => setIsDropdownOpen(false)} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'auto' }} />

                            <div className="glass-panel absolute" style={{
                                top: '100%', right: 0, marginTop: '0.5rem',
                                flexDirection: 'column', gap: '0.25rem', width: '160px', zIndex: 50, display: 'flex'
                            }}>
                                {['Bass', 'Trout', 'Saltwater General', 'Redfish'].map(sp => (
                                    <div
                                        key={sp}
                                        className="hover-bg-white-10"
                                        style={{ padding: '0.5rem', cursor: 'pointer', borderRadius: '8px' }}
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
                    <style jsx>{`
            .hover-bg-white-10:hover { background: rgba(255,255,255,0.1); }
          `}</style>
                </div>
            </div>

            {/* Score or Land Override */}
            <div className="flex flex-col items-center justify-center gap-2">
                {depth && depth.isLand ? (
                    <>
                        <div className="score-circle" style={{ color: '#64748b', borderColor: '#475569', background: 'rgba(71, 85, 105, 0.1)' }}>
                            <MapPin size={48} className="opacity-50" />
                        </div>
                        <div className="text-xl font-bold text-center text-slate-400 uppercase tracking-[0.2em]">
                            LAND
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

            {/* Explanation */}
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
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

            {/* Weather & Sea Conditions */}
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

            {/* Action Buttons */}
            <div className="flex gap-2">
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

        </div>
    );
}
