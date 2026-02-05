'use client';

import { useState, useEffect, useMemo } from 'react';
import { Fish, MapPin, Navigation, Info, Bookmark, Waves, TrendingDown, Wind, Anchor, Search, Lock, Loader2, Sparkles, Minimize2, Maximize2 } from 'lucide-react';
import { calculateFishability, Species, FishabilityResult } from '@/utils/FishabilityEngine';
import { saveSpot } from '@/utils/Storage';
import { getWaterDepth, DepthResult, scanForStructure } from '@/utils/DepthService';
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
    const [loadingDepth, setLoadingDepth] = useState(false);
    const [structureAlert, setStructureAlert] = useState<boolean>(false);
    const [isScanning, setIsScanning] = useState(false); // For structure scan
    const [isScouting, setIsScouting] = useState(false); // For AI Scout
    const [isDocked, setIsDocked] = useState(false);

    // Memoized Result Calculation
    const result = useMemo(() => {
        return calculateFishability(initialLat, initialLng, species);
    }, [initialLat, initialLng, species]);

    // Reset loading on location change
    useEffect(() => {
        setLoadingDepth(true);
        setStructureAlert(false);

        getWaterDepth(initialLat, initialLng).then(d => {
            setDepth(d);
            setLoadingDepth(false);

            // If water, scan for structure!
            // GATED: Only for Pro Users
            if (d && !d.isLand && user?.isPro) {
                scanForStructure(initialLat, initialLng).then(scan => {
                    if (scan.found && scan.locations) {
                        setStructureAlert(true);
                        if (onStructureFound) onStructureFound(scan.locations);
                    }
                });
            }
        });
    }, [initialLat, initialLng, species, onStructureFound, user?.isPro]);

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
                    className="group relative flex items-center h-12 cursor-pointer"
                    title="Maximize"
                    style={{ zIndex: hoveredItem === 0 ? 50 : 30, pointerEvents: 'auto' }}
                >
                    {/* Drawer Label (Rendered first, so behind) */}
                    <div
                        className={`h-12 flex items-center bg-slate-800 border-y border-r border-white/20 rounded-r-xl transition-all duration-300 ease-in-out overflow-hidden relative z-10 ${hoveredItem === 0 ? 'w-56' : 'w-14'}`}
                    >
                        {hoveredItem === 0 && (
                            <div className="w-full h-full flex items-center pl-14 pr-4 whitespace-nowrap animate-in fade-in duration-200">
                                <span className="text-sm font-bold text-white">Expand Analysis</span>
                            </div>
                        )}
                    </div>
                    {/* Icon Handle (Rendered last, so on top) */}
                    <div className="absolute left-0 top-0 w-14 h-12 flex items-center justify-center bg-slate-800 border border-white/20 rounded-r-xl z-20 shadow-md">
                        <Maximize2 size={24} className="text-white" />
                    </div>
                </button>

                {/* 2. Score Badge */}
                <button
                    type="button"
                    className="group relative flex items-center h-12 cursor-pointer"
                    onClick={(e) => { e.stopPropagation(); setHoveredItem(hoveredItem === 1 ? null : 1); }}
                    onMouseEnter={() => setHoveredItem(1)}
                    onMouseLeave={() => setHoveredItem(null)}
                    style={{ zIndex: hoveredItem === 1 ? 50 : 30, pointerEvents: 'auto' }}
                >
                    {/* Drawer Label */}
                    <div
                        className={`h-12 flex items-center bg-slate-800 border-y border-r border-white/20 rounded-r-xl transition-all duration-300 ease-in-out overflow-hidden relative z-10 ${hoveredItem === 1 ? 'w-56' : 'w-14'}`}
                    >
                        {hoveredItem === 1 && (
                            <div className="w-full h-full flex flex-col justify-center pl-14 pr-4 whitespace-nowrap animate-in fade-in duration-200">
                                <span className="text-xs font-bold text-white">Verdict</span>
                                <span className="text-sm font-outfit font-bold capitalize" style={{ color: scoreColor }}>{result.verdict}</span>
                            </div>
                        )}
                    </div>
                    {/* Icon Handle */}
                    <div className="absolute left-0 top-0 w-14 h-12 flex flex-col items-center justify-center gap-0.5 bg-slate-800 border border-white/20 rounded-r-xl z-20 shadow-md">
                        <span className="font-outfit font-bold text-xl leading-none drop-shadow-md" style={{ color: scoreColor }}>{result.score}</span>
                        <div className="w-1.5 h-1.5 rounded-full shadow-sm" style={{ backgroundColor: scoreColor }} />
                    </div>
                </button>

                {/* 3. Key Insight */}
                <button
                    type="button"
                    className="group relative flex items-center h-12 cursor-pointer"
                    onClick={(e) => { e.stopPropagation(); setHoveredItem(hoveredItem === 2 ? null : 2); }}
                    onMouseEnter={() => setHoveredItem(2)}
                    onMouseLeave={() => setHoveredItem(null)}
                    style={{ zIndex: hoveredItem === 2 ? 50 : 30, pointerEvents: 'auto' }}
                >
                    {/* Drawer Label */}
                    <div
                        className={`h-12 flex items-center bg-slate-800 border-y border-r border-white/20 rounded-r-xl transition-all duration-300 ease-in-out overflow-hidden relative z-10 ${hoveredItem === 2 ? 'w-64' : 'w-14'}`}
                    >
                        {hoveredItem === 2 && (
                            <div className="w-full h-full flex flex-col justify-center gap-0.5 pl-14 pr-4 whitespace-nowrap animate-in fade-in duration-200">
                                <span className="text-xs font-bold text-white leading-tight truncate">{result.explanation.title}</span>
                                <span className="text-[10px] text-slate-300 leading-snug truncate">{result.explanation.window || result.explanation.details[0]}</span>
                            </div>
                        )}
                    </div>
                    {/* Icon Handle */}
                    <div className="absolute left-0 top-0 w-14 h-12 flex items-center justify-center bg-slate-800 border border-white/20 rounded-r-xl z-20 shadow-md">
                        <Sparkles size={22} className="text-amber-400 drop-shadow-sm" />
                    </div>
                </button>

                {/* 4. Depth */}
                {depth && (
                    <button
                        type="button"
                        className="group relative flex items-center h-12 cursor-pointer"
                        onClick={(e) => { e.stopPropagation(); setHoveredItem(hoveredItem === 3 ? null : 3); }}
                        onMouseEnter={() => setHoveredItem(3)}
                        onMouseLeave={() => setHoveredItem(null)}
                        style={{ zIndex: hoveredItem === 3 ? 50 : 30, pointerEvents: 'auto' }}
                    >
                        {/* Drawer Label */}
                        <div
                            className={`h-12 flex items-center bg-slate-800 border-y border-r border-white/20 rounded-r-xl transition-all duration-300 ease-in-out overflow-hidden relative z-10 ${hoveredItem === 3 ? 'w-56' : 'w-14'}`}
                        >
                            {hoveredItem === 3 && (
                                <div className="w-full h-full flex flex-col justify-center pl-14 pr-4 whitespace-nowrap animate-in fade-in duration-200">
                                    <span className="text-xs font-bold text-white">Depth Data</span>
                                    <span className="text-xs text-slate-300">{depth.isLand ? 'Land Detected' : `${depth.meters}m (${depth.feet}ft)`}</span>
                                </div>
                            )}
                        </div>
                        {/* Icon Handle */}
                        <div className="absolute left-0 top-0 w-14 h-12 flex flex-col items-center justify-center gap-0.5 bg-slate-800 border border-white/20 rounded-r-xl z-20 shadow-md">
                            <Waves size={18} className="text-blue-400 drop-shadow-sm" />
                            <span className="text-[9px] font-mono font-bold text-slate-200">{depth.isLand ? 'Dry' : `${Math.round(depth.meters)}m`}</span>
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
            top: '6rem',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            maxWidth: '400px',
            width: '90%'
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
                    {/* Depth Display */}
                    <div className="text-xs text-brand-blue flex items-center gap-1 opacity-80" style={{ color: 'var(--color-text-muted)' }}>
                        <Waves size={12} />
                        {loadingDepth ? (
                            <span className="animate-pulse">Checking depth...</span>
                        ) : depth ? (
                            depth.isLand ? (
                                <span className="text-emerald font-bold">Land (Above Water)</span>
                            ) : (
                                <span>Depth: <strong>{depth.meters}m</strong> ({depth.feet}ft)</span>
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

            {/* Score */}
            <div className="flex flex-col items-center justify-center gap-2">
                <div className="score-circle" style={{ color: scoreColor }}>
                    {result.score}
                </div>

                <div className="text-xl font-bold text-center" style={{ color: scoreColor, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    {result.verdict === 'good' ? 'Worth Fishing' :
                        result.verdict === 'borderline' ? 'Borderline' : 'Not Worth It'}
                </div>

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
                className={`w-full font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 border mb-3 relative z-20 cursor-pointer ${user?.isPro
                    ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-white border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                    }`}
            >
                {isScouting ? (
                    <Loader2 className="animate-spin" size={20} />
                ) : (
                    user?.isPro ? <Sparkles size={20} /> : <Lock size={16} />
                )}
                <span>{isScouting ? 'AI Analyzing Area...' : 'AI Local Scout (500m)'}</span>
            </button>

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
                <button className="btn-primary" style={{ flex: 1 }}>
                    <Navigation size={18} />
                    Go
                </button>
            </div>

        </div>
    );
}
