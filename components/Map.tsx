'use client';

import { MapContainer, TileLayer, Marker, useMapEvents, LayersControl, Circle } from 'react-leaflet';
import L from 'leaflet';
import { useEffect } from 'react';

// Fix for default markers
const icon = L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
    iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

interface MapProps {
    center: [number, number];
    onLocationSelect: (lat: number, lng: number) => void;
}

function ClickHandler({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
    useMapEvents({
        click(e) {
            onLocationSelect(e.latlng.lat, e.latlng.lng);
        },
    });
    return null;
}

function MapUpdater({ center }: { center: [number, number] }) {
    const map = useMapEvents({});
    useEffect(() => {
        map.flyTo(center, map.getZoom());
    }, [center, map]);
    return null;
}

export default function Map({ center, onLocationSelect }: MapProps) {
    return (
        <MapContainer
            center={center}
            zoom={13}
            style={{ width: '100%', height: '100%' }}
            zoomControl={false} // We can add custom zoom control later or keep it clean
            attributionControl={false}
        >
            <LayersControl position="bottomleft">
                <LayersControl.BaseLayer checked name="Dark Map">
                    <TileLayer
                        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    />
                </LayersControl.BaseLayer>

                <LayersControl.BaseLayer name="Satellite">
                    <TileLayer
                        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                        attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
                    />
                </LayersControl.BaseLayer>
            </LayersControl>

            <ClickHandler onLocationSelect={onLocationSelect} />
            <MapUpdater center={center} />

            <Marker position={center} icon={icon} />

            {/* Mock "Soft highlighted zones" */}
            <Circle
                center={[center[0] + 0.01, center[1] + 0.01]}
                pathOptions={{ fillColor: 'green', color: 'green', opacity: 0.2, fillOpacity: 0.2 }}
                radius={500}
            />
            <Circle
                center={[center[0] - 0.015, center[1] - 0.005]}
                pathOptions={{ fillColor: 'red', color: 'red', opacity: 0.1, fillOpacity: 0.1 }}
                radius={800}
            />

        </MapContainer>
    );
}
