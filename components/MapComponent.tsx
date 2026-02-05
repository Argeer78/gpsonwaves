'use client';

import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents, LayersControl, LayerGroup, WMSTileLayer, Circle, ZoomControl, ScaleControl, Polyline, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { ScoutSpot } from '@/services/ScoutService';

import { Ruler, Locate, Ship, Wifi } from 'lucide-react';
import { useSensor } from '@/context/SensorContext';

// Dynamic Boat Marker Component
function UserBoatMarker({ position }: { position: [number, number] }) {
    const { heading } = useSensor();

    // We need to create the icon dynamically or rotate the marker element
    const icon = useMemo(() => L.divIcon({
        className: 'boat-marker-dynamic',
        html: `
        <div style="
            transform: rotate(${heading || 0}deg);
            transition: transform 0.3s ease;
            background-color: #0ea5e9; 
            width: 36px; 
            height: 36px; 
            border-radius: 50%; 
            border: 3px solid white; 
            box-shadow: 0 0 15px rgba(14, 165, 233, 0.6);
            display: flex;
            align-items: center;
            justify-content: center;
        ">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="20" height="20">
                <path d="M12 2L2 22h20L12 2z" />
            </svg>
        </div>
        <div style="
            position: absolute;
            top: -20px;
            left: 50%;
            transform: translateX(-50%);
            background: #0f172a;
            color: white;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: bold;
            white-space: nowrap;
        ">YOU</div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
    }), [heading]);

    return (
        <Marker
            position={position}
            icon={icon}
            interactive={false}
        >
            <Popup className="glass-popup text-center">
                <span className="font-bold">Your Boat</span><br />
                <span className="text-xs text-muted">Real-time GPS</span>
                {heading && <><br /><span className="text-xs text-emerald-400">{Math.round(heading)}°</span></>}
            </Popup>
        </Marker>
    );
}

// Standard Pin for Selected Location (Analysis Target)
const targetIcon = new L.Icon({
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// ... inside MapComponent ...
// replaced customIcon with boatIcon in LocationMarker component


interface MapComponentProps {
    center: [number, number];
    userLocation?: [number, number] | null; // Real-time GPS Boat
    onLocationSelect: (lat: number, lng: number) => void;
    structures?: Array<{ lat: number, lng: number }>;
    scoutSpots?: ScoutSpot[];
    isPro?: boolean;
    onShowPricing?: (reason: string) => void;
}

// Custom Icon for Scout Spots
// Custom Icon Generator for Scout Spots
const getScoutIcon = (type: string) => {
    let color = '#34d399'; // Emerald (Default)
    let shadow = 'rgba(52, 211, 153, 0.4)';

    if (type === 'reef' || type === 'rock') {
        color = '#f472b6'; // Pink/Coral
        shadow = 'rgba(244, 114, 182, 0.4)';
    } else if (type === 'seagrass' || type === 'weed') {
        color = '#a3e635'; // Lime Green
        shadow = 'rgba(163, 230, 53, 0.4)';
    } else if (type === 'bait') {
        color = '#60a5fa'; // Blue
        shadow = 'rgba(96, 165, 250, 0.4)';
    }

    return L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="background-color: ${color}; width: 16px; height: 16px; border-radius: 50%; box-shadow: 0 0 0 4px ${shadow}, 0 0 15px ${color};"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8]
    });
};



function MapController({ center }: { center: [number, number] }) {
    const map = useMap();
    useEffect(() => {
        map.flyTo(center, map.getZoom());
    }, [center, map]);
    return null;
}

function LocationMarker({ position, onSelect }: { position: [number, number], onSelect: (lat: number, lng: number) => void }) {
    const markerRef = useRef<L.Marker>(null);

    useMapEvents({
        click(e) {
            onSelect(e.latlng.lat, e.latlng.lng);
        },
    });

    const eventHandlers = useMemo(
        () => ({
            dragend() {
                const marker = markerRef.current;
                if (marker != null) {
                    const { lat, lng } = marker.getLatLng();
                    onSelect(lat, lng);
                }
            },
        }),
        [onSelect],
    );

    return position === null ? null : (
        <Marker
            draggable={true}
            eventHandlers={eventHandlers}
            position={position}
            icon={targetIcon}
            ref={markerRef}
        />
    );
}

// Helper to calculate distance
function formatDistance(meters: number) {
    const km = (meters / 1000).toFixed(2);
    const nm = (meters / 1852).toFixed(2);
    return `${nm} NM (${km} km)`;
}

// Sub-component to handle map clicks based on mode
function MapInteractions({
    onSelect,
    isMeasuring,
    measurePoints,
    setMeasurePoints
}: {
    onSelect: (lat: number, lng: number) => void;
    isMeasuring: boolean;
    measurePoints: L.LatLng[];
    setMeasurePoints: (points: L.LatLng[]) => void;
}) {
    useMapEvents({
        click(e) {
            if (isMeasuring) {
                if (measurePoints.length >= 2) {
                    // Reset and start new
                    setMeasurePoints([e.latlng]);
                } else {
                    // Add point
                    setMeasurePoints([...measurePoints, e.latlng]);
                }
            } else {
                onSelect(e.latlng.lat, e.latlng.lng);
            }
        },
    });
    return null;
}



// Guard Component for Pro Layers
function LayerGuard({ isPro, onShowPricing }: { isPro: boolean, onShowPricing?: (reason: string) => void }) {
    const map = useMapEvents({
        overlayadd: (e) => {
            if (e.name.includes("Reef Maps") && !isPro) {
                // Remove immediately
                setTimeout(() => {
                    e.target.removeLayer(e.layer);
                    if (onShowPricing) onShowPricing("Reef Maps (Pro Feature)");
                }, 10);
            }
        }
    });
    return null;
}

export default function MapComponent({ center, onLocationSelect, userLocation, structures = [], scoutSpots = [], isPro = false, onShowPricing }: MapComponentProps) {
    // Measurement State
    const [isMeasuring, setIsMeasuring] = useState(false);
    const [measurePoints, setMeasurePoints] = useState<L.LatLng[]>([]);


    // Gating Logic
    // Handled by <LayerGuard /> inside MapContainer


    const distance = useMemo(() => {
        if (measurePoints.length < 2) return null;
        return measurePoints[0].distanceTo(measurePoints[1]);
    }, [measurePoints]);

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>



            {/* Measure Toggle Button */}
            <button
                onClick={() => {
                    setIsMeasuring(!isMeasuring);
                    setMeasurePoints([]); // Clear on toggle
                }}
                className="glass-panel"
                style={{
                    position: 'absolute',
                    bottom: '2.5rem',
                    left: '0.75rem',
                    zIndex: 400, // Above map
                    padding: '0.6rem',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '40px',
                    height: '40px',
                    backgroundColor: isMeasuring ? 'var(--color-accent-good)' : 'rgba(15, 23, 42, 0.8)',
                    color: isMeasuring ? '#0f172a' : 'white',
                    cursor: 'pointer',
                    outline: 'none',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                }}
                title="Measure Distance"
            >
                <Ruler size={20} />
            </button>

            {/* Locate Me Button */}
            {
                userLocation && (
                    <button
                        onClick={() => onLocationSelect(userLocation[0], userLocation[1])}
                        className="glass-panel"
                        style={{
                            position: 'absolute',
                            bottom: '5.5rem', // Above Measure Button (2.5rem + 40px + gap)
                            left: '0.75rem',
                            zIndex: 400,
                            padding: '0.6rem',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '40px',
                            height: '40px',
                            backgroundColor: 'rgba(15, 23, 42, 0.8)',
                            color: 'white',
                            cursor: 'pointer',
                            outline: 'none',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                        }}
                        title="Center on My Boat"
                    >
                        <Locate size={20} />
                    </button>
                )
            }

            {
                isMeasuring && measurePoints.length === 0 && (
                    <div
                        className="glass-panel"
                        style={{
                            position: 'absolute',
                            top: '5rem',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            zIndex: 400,
                            padding: '0.5rem 1rem',
                            borderRadius: '20px',
                            fontSize: '0.85rem',
                            pointerEvents: 'none',
                            textAlign: 'center'
                        }}
                    >
                        Tap two points to measure
                    </div>
                )
            }

            <MapContainer
                center={center}
                zoom={13}
                scrollWheelZoom={true}
                style={{ height: "100%", width: "100%", background: '#0f172a' }}
                zoomControl={false}
            >
                <ZoomControl position="bottomright" />
                <ScaleControl position="bottomleft" imperial={true} metric={true} />
                <MapController center={center} />

                <MapController center={center} />

                {/* Layer Guard for Pro Features */}
                <LayerGuard isPro={isPro} onShowPricing={onShowPricing} />



                {/* Interaction Handler */}
                <MapInteractions
                    onSelect={onLocationSelect}
                    isMeasuring={isMeasuring}
                    measurePoints={measurePoints}
                    setMeasurePoints={setMeasurePoints}
                />

                <LayersControl position="bottomright">
                    <LayersControl.BaseLayer checked name="Satellite">
                        <TileLayer
                            attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
                            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                        />
                    </LayersControl.BaseLayer>
                    <LayersControl.BaseLayer name="Dark Mappe">
                        <TileLayer
                            attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
                            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                        />
                    </LayersControl.BaseLayer>
                    <LayersControl.BaseLayer name="Light Map">
                        <TileLayer
                            attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
                            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                        />
                    </LayersControl.BaseLayer>
                    <LayersControl.BaseLayer name="Ocean Relief">
                        <TileLayer
                            attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
                            url="https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}"
                            maxNativeZoom={9}
                            maxZoom={19}
                        />
                    </LayersControl.BaseLayer>
                    <LayersControl.BaseLayer name="Seabed (Global Overview)">
                        <WMSTileLayer
                            url="https://wms.gebco.net/mapserv?"
                            layers="GEBCO_LATEST"
                            format="image/png"
                            transparent={false}
                            attribution="GEBCO 2024 Grid (Low Res)"
                            maxZoom={19}
                        />
                    </LayersControl.BaseLayer>
                    <LayersControl.BaseLayer name="Seabed (High Res - EU)">
                        <WMSTileLayer
                            url="https://ows.emodnet-bathymetry.eu/wms"
                            layers="mean_atlas_land"
                            format="image/png"
                            transparent={false}
                            attribution="EMODnet Bathymetry"
                        />
                    </LayersControl.BaseLayer>
                    <LayersControl.BaseLayer name="NOAA Nautical Charts (USA)">
                        <WMSTileLayer
                            url="https://gis.charttools.noaa.gov/arcgis/rest/services/MCS/NOAAChartDisplay/MapServer/exts/MaritimeChartService/WMSServer"
                            layers="0,1,2,3,4,5,6,7"
                            format="image/png"
                            transparent={false}
                            attribution="NOAA Office of Coast Survey"
                        />
                    </LayersControl.BaseLayer>

                    {/* Allen Coral Atlas */}
                    <LayersControl.Overlay name="Reef Maps (Coral/Benthic)">
                        <WMSTileLayer
                            url="https://allencoralatlas.org/geoserver/ows"
                            layers="aca:benthic_mapping"
                            format="image/png"
                            transparent={true}
                            attribution="Allen Coral Atlas"
                            opacity={0.7}
                        />
                    </LayersControl.Overlay>

                    <LayersControl.Overlay name="Nautical Charts (Global)">
                        <TileLayer
                            url="https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png"
                            attribution="OpenSeaMap"
                        />
                    </LayersControl.Overlay>
                </LayersControl>

                {/* Structure Markers */}
                <LayerGroup>
                    {structures.map((s, i) => (
                        <Circle
                            key={`struct-${i}`}
                            center={[s.lat, s.lng]}
                            radius={20}
                            pathOptions={{ color: '#f59e0b', fillColor: '#f59e0b', fillOpacity: 0.6, weight: 1 }}
                        />
                    ))}
                </LayerGroup>

                {/* User Boat Marker (GPS Only) */}
                {userLocation && (
                    <UserBoatMarker position={userLocation} />
                )}

                {/* User Drop Pin (Interactive) */}
                {/* Only userLocation doesn't exist? No, always show center pin? */}
                {/* Ideally, we only show this pin if the user has CLICKED somewhere. */}
                {/* But center is always defined. So yes, show it. */}
                <LocationMarker position={center} onSelect={onLocationSelect} />

                {/* AI Scout Markers */}
                <LayerGroup>
                    {scoutSpots.map((spot, i) => (
                        <Marker
                            key={`scout-${i}`}
                            position={[spot.lat, spot.lng]}
                            icon={getScoutIcon(spot.type)}
                        >
                            <Tooltip direction="top" offset={[0, -10]} className="scout-tooltip">
                                {spot.type.toUpperCase()} ({spot.depth}m)
                            </Tooltip>
                            <Popup className="glass-popup">
                                <div className="p-2 min-w-[200px]">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="font-bold text-sm uppercase text-emerald-400">{spot.type}</span>
                                        <span className="text-xs bg-slate-700 px-1.5 rounded">{spot.depth}m</span>
                                    </div>
                                    <div className="text-xs text-slate-300 mb-2 italic">
                                        "{spot.reason}"
                                    </div>
                                    <div className="flex justify-between items-center border-t border-slate-700 pt-2">
                                        <span className="text-[10px] text-slate-500">Confidence: {spot.confidence}%</span>
                                        <button
                                            onClick={() => onLocationSelect(spot.lat, spot.lng)}
                                            className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white px-2 py-1 rounded transition-colors"
                                        >
                                            Analyze
                                        </button>
                                    </div>
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                </LayerGroup>

                {/* Measurement Lines & Markers */}
                {isMeasuring && measurePoints.length > 0 && (
                    <>
                        {measurePoints.map((pt, i) => (
                            <Circle
                                key={`measure-pt-${i}`}
                                center={pt}
                                radius={5} // Small dot
                                pathOptions={{ color: '#34d399', fillColor: '#34d399', fillOpacity: 1 }}
                            />
                        ))}
                        {measurePoints.length === 2 && (
                            <Polyline
                                positions={measurePoints}
                                pathOptions={{ color: '#34d399', dashArray: '10, 10', weight: 2 }}
                            >
                                <Tooltip permanent direction="center" className="glass-tooltip font-bold text-emerald-500">
                                    {formatDistance(distance!)}
                                </Tooltip>
                            </Polyline>
                        )}
                    </>
                )}

            </MapContainer>
        </div >
    );
}
