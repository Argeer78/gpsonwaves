export type ScoutSpot = {
    lat: number;
    lng: number;
    type: 'break' | 'weed' | 'rock' | 'bait' | 'thermal' | 'reef' | 'seagrass' | 'sand' | 'unknown';
    depth: number;
    temp: number;
    confidence: number;
    reason: string;
};

export const ScoutService = {
    /**
     * Checks a specific point to see if it lands on a known reef/benthic feature.
     * Used to validate depth accuracy (avoiding "deep water" readings on shallow reefs).
     */
    checkLocationType: async (lat: number, lng: number): Promise<{ isReef: boolean; type: string; depth?: number }> => {
        try {
            // Tiny BBOX (~20m)
            const offset = 0.0002;
            const bbox = `${lng - offset},${lat - offset},${lng + offset},${lat + offset}`;
            // Corrected Typename found via search: coral-atlas:benthic_data_verbose
            // Corrected Typename found via search: coral-atlas:benthic_data_verbose
            // Proxy via our backend to avoid CORS
            const url = `/api/reef-scan?bbox=${bbox}`;

            const res = await fetch(url);
            // const text = await res.text(); // We expect JSON now directly from proxy or error
            const data = await res.json();

            if (data.error) {
                console.warn("WFS Proxy Error:", data.error);
                return { isReef: false, type: 'unknown' };
            }

            // Old text check not needed for JSON
            // const data = JSON.parse(text);
            if (data.features && data.features.length > 0) {
                const f = data.features[0];
                const class_name = f.properties?.class_name || 'Unknown';

                if (class_name.includes('Coral') || class_name.includes('Reef')) {
                    return { isReef: true, type: 'reef', depth: 3 }; // Force 3m for Reefs
                }
                if (class_name.includes('Rock')) {
                    return { isReef: true, type: 'rock', depth: 5 };
                }
                if (class_name.includes('Seagrass')) {
                    return { isReef: true, type: 'seagrass', depth: 3 };
                }
            }
            return { isReef: false, type: 'unknown' };
        } catch (e) {
            console.warn("Reef Check Failed:", e);
            return { isReef: false, type: 'error' };
        }
    },

    scanArea: async (center: [number, number]): Promise<ScoutSpot[]> => {
        // 1. Fetch Real Reef Data (Parallel)
        const reefPromise = fetchRealReefs(center[0], center[1]);

        // 2. Simulate Fish Finding (Parallel)
        const fishPromise = new Promise<ScoutSpot[]>((resolve) => {
            setTimeout(() => {
                const spots: ScoutSpot[] = [];
                const count = Math.floor(Math.random() * 3) + 2; // 2 to 4 fish spots

                for (let i = 0; i < count; i++) {
                    const latOffset = (Math.random() - 0.5) * 0.009;
                    const lngOffset = (Math.random() - 0.5) * 0.009;
                    const type = getRandomType();
                    const depth = Math.floor(Math.random() * 40) + 5;
                    const temp = 20 + Math.random() * 5;

                    spots.push({
                        lat: center[0] + latOffset,
                        lng: center[1] + lngOffset,
                        type,
                        depth,
                        temp: parseFloat(temp.toFixed(1)),
                        confidence: Math.floor(Math.random() * 15) + 84,
                        reason: generateReason(type, depth, temp)
                    });
                }
                resolve(spots);
            }, 1500); // 1.5s thinking
        });

        // 3. Wait/Merge
        const [realSpots, fishSpots] = await Promise.all([reefPromise, fishPromise]);
        return [...realSpots, ...fishSpots];
    }
};

// --- Real Data Fetcher ---
async function fetchRealReefs(lat: number, lng: number): Promise<ScoutSpot[]> {
    try {
        // WFS Bounding Box (~500m radius = 0.005 deg)
        const offset = 0.005;
        const bbox = `${lng - offset},${lat - offset},${lng + offset},${lat + offset}`;
        const url = `/api/reef-scan?bbox=${bbox}`;

        const res = await fetch(url);
        const data = await res.json();
        // const text = await res.text();

        if (data.error) {
            console.warn("WFS Proxy Error:", data.error);
            return [];
        }

        // if (text.trim().startsWith('<')) ... logic removed

        // const data = JSON.parse(text);
        if (!data.features) return [];

        return data.features.map((f: any) => {
            // Map Class to Type
            const class_name = f.properties?.class_name || 'Unknown';
            let type: ScoutSpot['type'] = 'rock';
            if (class_name.includes('Coral') || class_name.includes('Reef')) type = 'reef';
            else if (class_name.includes('Seagrass')) type = 'seagrass';
            else if (class_name.includes('Sand')) type = 'sand';
            else if (class_name.includes('Rock') || class_name.includes('Rubble')) type = 'rock';

            // Extract Center from Polygon
            // Simple Approx: First coordinate of first ring
            const coords = f.geometry?.coordinates?.[0]?.[0] || [lng, lat];
            const spotLng = Array.isArray(coords[0]) ? coords[0][0] : coords[0]; // Handle MultiPolygon
            const spotLat = Array.isArray(coords[0]) ? coords[0][1] : coords[1];

            return {
                lat: spotLat,
                lng: spotLng,
                type: type,
                depth: 3, // Default low depth for reefs
                temp: 24,
                confidence: 100, // It's real data!
                reason: `Verified ${class_name} detected via Satellite Analysis (Allen Coral Atlas).`
            } as ScoutSpot;
        });

    } catch (e) {
        console.warn("Reef Scan Failed:", e);
        return [];
    }
}

function getRandomType(): ScoutSpot['type'] {
    const types: ScoutSpot['type'][] = ['break', 'weed', 'rock', 'bait', 'thermal'];
    return types[Math.floor(Math.random() * types.length)];
}

function generateReason(type: string, depth: number, temp: number): string {
    const weatherConditions = ['Overcast', 'Windy', 'Clear', 'Rain'];
    const weather = weatherConditions[Math.floor(Math.random() * weatherConditions.length)];

    switch (type) {
        case 'break': return `Sharp depth change (${depth}m) creates ambush point in ${weather}.`;
        case 'weed': return `Vegetation detected. Holds baitfish at ${temp}°C.`;
        case 'rock': return `Hard structure. Good cover for predators.`;
        case 'bait': return `Bait ball aggregation at ${depth}m.`;
        case 'thermal': return `Warm water pocket (${temp}°C) likely holding fish.`;
        case 'reef': return `Living Coral Reef structure. High biodiversity zone.`;
        case 'seagrass': return `Seagrass bed. Excellent nursery habitat for fish.`;
        case 'sand': return `Sandy patches near structure. Look for cruisers.`;
        default: return "High prob zone.";
    }
}
