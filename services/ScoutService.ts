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

        // 2. Simulate Fish Finding (Parallel) - Now Deterministic!
        const fishPromise = new Promise<ScoutSpot[]>((resolve) => {
            setTimeout(() => {
                const spots: ScoutSpot[] = [];

                // Simple Seeded Random (Linear Congruential Generator)
                // Seed based on lat/lng (fixed per location) + Hourly (changes slowly)
                // Rounding coords to avoid micro-jitter affecting seed
                const latFixed = Math.round(center[0] * 1000);
                const lngFixed = Math.round(center[1] * 1000);
                const timeSeed = Math.floor(Date.now() / (1000 * 60 * 60)); // Changes every hour
                let seed = Math.abs(latFixed ^ lngFixed ^ timeSeed);

                const nextRandom = () => {
                    seed = (seed * 9301 + 49297) % 233280;
                    return seed / 233280;
                };

                const count = Math.floor(nextRandom() * 3) + 2; // 2 to 4 fish spots

                for (let i = 0; i < count; i++) {
                    const latOffset = (nextRandom() - 0.5) * 0.009;
                    const lngOffset = (nextRandom() - 0.5) * 0.009;
                    const type = getRandomType(nextRandom);
                    const depth = Math.floor(nextRandom() * 40) + 5;
                    const temp = 20 + nextRandom() * 5;

                    spots.push({
                        lat: center[0] + latOffset,
                        lng: center[1] + lngOffset,
                        type,
                        depth,
                        temp: parseFloat(temp.toFixed(1)),
                        confidence: Math.floor(nextRandom() * 15) + 84,
                        reason: generateReason(type, depth, temp, nextRandom)
                    });
                }
                resolve(spots);
            }, 1000); // 1s thinking (slightly faster)
        });

        // 3. Wait/Merge
        const [realSpots, fishSpots] = await Promise.all([reefPromise, fishPromise]);
        return [...realSpots, ...fishSpots];
    }
};

// --- Real Data Fetcher ---
async function fetchRealReefs(lat: number, lng: number): Promise<ScoutSpot[]> {
    try {
        const offset = 0.005;
        const bbox = `${lng - offset},${lat - offset},${lng + offset},${lat + offset}`;
        const url = `/api/reef-scan?bbox=${bbox}`;

        // 5-second timeout — Allen Coral Atlas WFS can hang
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);

        const data = await res.json();

        if (data.error) {
            console.warn("WFS Proxy Error:", data.error);
            return [];
        }

        if (!data.features) return [];

        return data.features.map((f: any) => {
            const class_name = f.properties?.class_name || 'Unknown';
            let type: ScoutSpot['type'] = 'rock';
            if (class_name.includes('Coral') || class_name.includes('Reef')) type = 'reef';
            else if (class_name.includes('Seagrass')) type = 'seagrass';
            else if (class_name.includes('Sand')) type = 'sand';
            else if (class_name.includes('Rock') || class_name.includes('Rubble')) type = 'rock';

            const coords = f.geometry?.coordinates?.[0]?.[0] || [lng, lat];
            const spotLng = Array.isArray(coords[0]) ? coords[0][0] : coords[0];
            const spotLat = Array.isArray(coords[0]) ? coords[0][1] : coords[1];

            return {
                lat: spotLat,
                lng: spotLng,
                type: type,
                depth: 3,
                temp: 24,
                confidence: 100,
                reason: `Verified ${class_name} detected via Satellite Analysis (Allen Coral Atlas).`
            } as ScoutSpot;
        });

    } catch (e: any) {
        if (e?.name === 'AbortError') {
            console.warn('Reef scan timed out (5s) — skipping real data, using generated spots only.');
        } else {
            console.warn("Reef Scan Failed:", e);
        }
        return [];
    }
}

function getRandomType(randomFn: () => number): ScoutSpot['type'] {
    const types: ScoutSpot['type'][] = ['break', 'weed', 'rock', 'bait', 'thermal'];
    return types[Math.floor(randomFn() * types.length)];
}

function generateReason(type: string, depth: number, temp: number, randomFn: () => number): string {
    const weatherConditions = ['Overcast', 'Windy', 'Clear', 'Rain'];
    const weather = weatherConditions[Math.floor(randomFn() * weatherConditions.length)];

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
