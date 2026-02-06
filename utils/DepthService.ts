export interface DepthResult {
    meters: number;
    feet: number;
    isLand: boolean;
    source?: string;
}

// Helper to normalize longitude to -180...180
// Helper to normalize longitude
function normalizeLng(lng: number): number {
    return ((lng + 180) % 360 + 360) % 360 - 180;
}

let rateLimitUntil = 0;

export async function getWaterDepth(lat: number, lng: number): Promise<DepthResult | null> {
    // 1. Circuit Breaker Check
    if (Date.now() < rateLimitUntil) {
        console.warn("Depth API Cooling Down (Rate Limited)");
        return null;
    }

    try {
        const normLng = normalizeLng(lng);
        const response = await fetch(`/api/depth?lat=${lat}&lng=${normLng}`);

        if (!response.ok) {
            // Handle Rate Limits (429 or 502 which masks 429)
            if (response.status === 429 || response.status === 502) {
                console.warn("Hit Rate Limit! Pausing requests for 30s.");
                rateLimitUntil = Date.now() + 30000;
            }

            const errDetails = await response.json().catch(() => ({}));
            // If the error message mentions 429, also trigger breaker
            if (JSON.stringify(errDetails).includes("429")) {
                rateLimitUntil = Date.now() + 30000;
            }

            console.error("Depth API Failed:", response.status, errDetails);
            throw new Error(errDetails.error || `Depth API failed: ${response.status}`);
        }

        const data = await response.json();
        const elevation = data.results?.[0]?.elevation;

        if (typeof elevation !== 'number') return null;

        // Elevation > 1 is land. Elevation <= 1 is treated as water (tides/noise).
        if (elevation > 1) {
            return { meters: 0, feet: 0, isLand: true, source: data.source };
        }

        const depthMeters = Math.abs(elevation);
        const depthFeet = depthMeters * 3.28084;

        return {
            meters: Math.round(depthMeters * 10) / 10, // 1 decimal place
            feet: Math.round(depthFeet),
            isLand: false,
            source: data.source
        };

    } catch (error) {
        console.error("Failed to fetch depth:", error);
        return null;
    }
}

export interface StructureResult {
    found: boolean;
    type?: 'Drop-off' | 'Ledge';
    locations?: Array<{ lat: number, lng: number }>;
}

export async function scanForStructure(centerLat: number, centerLng: number): Promise<StructureResult> {
    const OFFSET = 0.0005; // Approx 55m
    const rawPoints = [
        { lat: centerLat, lng: centerLng }, // Center
        { lat: centerLat + OFFSET, lng: centerLng }, // North
        { lat: centerLat - OFFSET, lng: centerLng }, // South
        { lat: centerLat, lng: centerLng + OFFSET }, // East
        { lat: centerLat, lng: centerLng - OFFSET }, // West
    ];

    const points = rawPoints.map(p => ({ ...p, lng: normalizeLng(p.lng) }));
    const locString = encodeURIComponent(points.map(p => `${p.lat.toFixed(6)},${p.lng.toFixed(6)}`).join('|'));

    try {
        // Single batch request via proxy
        const response = await fetch(`/api/depth?locations=${locString}`);

        if (!response.ok) return { found: false };

        const data = await response.json();

        // Map results back to depths array. The order is preserved by OpenTopoData
        if (!data.results || data.results.length !== points.length) return { found: false };

        const depths = data.results.map((r: any) => r.elevation); // Elevation is negative depth

        // Analyze
        const centerDepth = depths[0]; // Center
        if (typeof centerDepth !== 'number') return { found: false };

        const dropOffLocations: Array<{ lat: number, lng: number }> = [];

        // Check each point against center
        // A "Cliff" or Drop-off means significant change. e.g. > 3 meters in 50m distance? ~6% grade.
        const THRESHOLD = 3;

        for (let i = 1; i < depths.length; i++) {
            const surroundingDepth = depths[i];
            if (typeof surroundingDepth === 'number') {
                const diff = Math.abs(centerDepth - surroundingDepth);
                if (diff > THRESHOLD) {
                    dropOffLocations.push(points[i]);
                }
            }
        }

        if (dropOffLocations.length > 0) {
            return { found: true, type: 'Drop-off', locations: dropOffLocations };
        }

        return { found: false };

    } catch (e) {
        console.error("Scan error", e);
        return { found: false };
    }
}
