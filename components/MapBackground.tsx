'use client';

import dynamic from 'next/dynamic';
import { useMemo } from 'react';

interface MapBackgroundProps {
    center: [number, number];
    onLocationSelect: (lat: number, lng: number) => void;
    structures: Array<{ lat: number, lng: number }>;
    scoutSpots?: any[];
}

export default function MapBackground(props: MapBackgroundProps) {
    // Use a dynamic import to prevent SSR issues with Leaflet
    const Map = useMemo(
        () => dynamic(
            () => import('@/components/MapComponent'),
            {
                loading: () => <div className="w-full h-full bg-slate-900" />,
                ssr: false
            }
        ),
        []
    );

    return <Map {...props} />;
}
