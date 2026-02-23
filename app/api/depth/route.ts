import { NextResponse } from 'next/server';

// Fetch a single point from OpenTopoData
async function fetchElevation(dataset: string, lat: number, lng: number): Promise<number | null> {
    const url = `https://api.opentopodata.org/v1/${dataset}?locations=${lat},${lng}&interpolation=cubic`;
    const res = await fetch(url, {
        headers: { 'User-Agent': 'GPSonWaves-App/1.0 (Student Project)' }
    });
    if (!res.ok) {
        const msg = `[${dataset}] ${res.status}`;
        console.warn(msg);
        throw new Error(msg);
    }
    const data = await res.json();
    const elevation = data.results?.[0]?.elevation;
    return typeof elevation === 'number' ? elevation : null;
}

// Fetch a batch of locations (pipe-separated)
async function fetchBatch(dataset: string, locations: string): Promise<any> {
    const url = `https://api.opentopodata.org/v1/${dataset}?locations=${encodeURIComponent(locations)}&interpolation=nearest`;
    const res = await fetch(url, {
        headers: { 'User-Agent': 'GPSonWaves-App/1.0 (Student Project)' }
    });
    if (!res.ok) throw new Error(`[${dataset}] batch ${res.status}`);
    return res.json();
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const latStr = searchParams.get('lat');
    const lngStr = searchParams.get('lng');
    const locations = searchParams.get('locations');

    // --- Batch mode (structure scan) - pass through directly ---
    if (locations) {
        try {
            const data = await fetchBatch('mapzen', locations);
            return NextResponse.json({ ...data, source: 'mapzen-batch' });
        } catch (e) {
            try {
                const data = await fetchBatch('gebco2020', locations);
                return NextResponse.json({ ...data, source: 'gebco-batch' });
            } catch (e2) {
                return NextResponse.json({ error: 'Batch failed' }, { status: 502 });
            }
        }
    }

    if (!latStr || !lngStr) {
        return NextResponse.json({ error: 'Missing coordinates' }, { status: 400 });
    }

    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);

    try {
        // Strategy: Try GEBCO first for center point.
        // GEBCO 2020 is a dedicated ocean bathymetry dataset — very reliable for sea vs land.
        // Positive = land, Negative = ocean depth, 0 = sea level / coastline.
        let elevation: number | null = null;
        let source = '';

        try {
            elevation = await fetchElevation('gebco2020', lat, lng);
            source = 'gebco2020';
        } catch (e) {
            console.warn('GEBCO failed, trying Mapzen', e);
        }

        // Fallback to Mapzen if GEBCO fails
        if (elevation === null) {
            try {
                elevation = await fetchElevation('mapzen', lat, lng);
                source = 'mapzen';
            } catch (e) {
                console.warn('Mapzen also failed', e);
            }
        }

        if (elevation === null) {
            return NextResponse.json({ error: 'All elevation sources failed' }, { status: 502 });
        }

        // --- Land vs Water Decision ---
        // GEBCO: clearly negative = ocean, clearly positive = land
        // Coastal ambiguity zone: -2 to +5m (tidal range + dataset noise)
        // If ambiguous AND we used GEBCO, do a quick 5-point check (center + 4 cardinal ~100m)
        if (elevation > 5) {
            // Clearly on land — return land immediately
            console.log(`LAND detected: ${elevation}m at ${lat},${lng} [${source}]`);
            return NextResponse.json({
                results: [{ elevation }],
                source: `${source}-land`
            });
        }

        if (elevation <= 0) {
            // Clearly water — return depth directly
            return NextResponse.json({
                results: [{ elevation }],
                source
            });
        }

        // Ambiguous zone (0 to 5m): do a small 5-point check to confirm
        // This handles coastal pins right at the water's edge
        const offset = 0.001; // ~110m
        const ambiguousPoints = [
            `${lat},${lng}`,
            `${lat + offset},${lng}`,
            `${lat - offset},${lng}`,
            `${lat},${lng + offset}`,
            `${lat},${lng - offset}`
        ].join('|');

        try {
            const checkData = await fetchBatch(source === 'gebco2020' ? 'gebco2020' : 'mapzen', ambiguousPoints);
            const results = checkData.results || [];

            // Find the most negative (deepest/most-water) reading
            const waterPoints = results.filter((r: any) => typeof r.elevation === 'number' && r.elevation <= 0);
            if (waterPoints.length > 0) {
                waterPoints.sort((a: any, b: any) => a.elevation - b.elevation);
                return NextResponse.json({
                    results: [waterPoints[0]],
                    source: `${source}-coastal`
                });
            }

            // All 5 points are >= 0 with center 0-5m: it's likely land (beach/shore)
            return NextResponse.json({
                results: [{ elevation }],
                source: `${source}-land`
            });
        } catch (e) {
            // If ambiguity check fails, use center elevation as-is (may show slight depth)
            return NextResponse.json({ results: [{ elevation }], source });
        }

    } catch (error: any) {
        console.error('Depth API Critical Error:', error);
        return NextResponse.json({
            error: error.message || 'Failed to fetch depth',
        }, { status: 502 });
    }
}
