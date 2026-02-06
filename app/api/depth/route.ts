import { NextResponse } from 'next/server';

// Helper to fetch from specific dataset
async function fetchDataset(dataset: string, queryParam: string, interpolation: string = 'cubic') {
    const url = `https://api.opentopodata.org/v1/${dataset}?${queryParam}&interpolation=${interpolation}`;
    const res = await fetch(url, {
        headers: {
            'User-Agent': 'GPSonWaves-App/1.0 (Student Project)'
        }
    });
    if (!res.ok) {
        const msg = `Upstream [${dataset}] ${res.status} ${res.statusText}`;
        console.error(msg);
        throw new Error(msg);
    }
    return res.json();
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const latStr = searchParams.get('lat');
    const lngStr = searchParams.get('lng');
    const locations = searchParams.get('locations');

    if (!locations && (!latStr || !lngStr)) {
        return NextResponse.json({ error: 'Missing coordinates' }, { status: 400 });
    }

    try {
        // Ensure we encode the pipe for the external API call
        let queryParam = locations
            ? `locations=${encodeURIComponent(locations)}`
            : `locations=${latStr},${lngStr}`;

        const isSinglePoint = !locations && latStr && lngStr;

        // 13 Points total: Center + Inner Box + Outer Cross
        const lat = parseFloat(latStr!);
        const lng = parseFloat(lngStr!);
        const offset = 0.001;  // ~110m radius
        const offset2 = 0.002; // ~220m radius (Outer Ring)
        const offset3 = 0.005; // ~550m radius (Far Outer Ring - fallback for bad pixels)

        const samples = [
            `${lat},${lng}`,                   // Center
            `${lat + offset},${lng}`,          // N
            `${lat - offset},${lng}`,          // S
            `${lat},${lng + offset}`,          // E
            `${lat},${lng - offset}`,          // W
            `${lat + offset},${lng + offset}`, // NE
            `${lat + offset},${lng - offset}`, // NW
            `${lat - offset},${lng + offset}`, // SE
            `${lat - offset},${lng - offset}`, // SW
            // Outer Ring (Cardinal only)
            `${lat + offset2},${lng}`,         // N2
            `${lat - offset2},${lng}`,         // S2
            `${lat},${lng + offset2}`,         // E2
            `${lat},${lng - offset2}`,         // W2
            // Far Ring (Desperation check)
            `${lat + offset3},${lng}`,         // N3
            `${lat - offset3},${lng}`,         // S3
            `${lat},${lng + offset3}`,         // E3
            `${lat},${lng - offset3}`          // W3
        ].join('|');

        // 1. Try Mapzen (Smart Sampling for Single Point)
        try {
            if (isSinglePoint) {
                // Smart Sampling: Check points to detect "water" nearby
                const mapzenData = await fetchDataset('mapzen', `locations=${encodeURIComponent(samples)}`, 'nearest');
                const results = mapzenData.results || [];

                // Filter for Water: Relaxed threshold (<= 1m elevation is "water enough")
                const waterPoints = results.filter((r: any) => r.elevation !== null && r.elevation <= 1);

                let bestPoint;
                if (waterPoints.length > 0) {
                    // Bias towards DEEPEST water found (fixes "too shallow" near shore)
                    // elevation is negative (-50 is deeper than -2)
                    waterPoints.sort((a: any, b: any) => a.elevation - b.elevation);
                    bestPoint = waterPoints[0];

                    return NextResponse.json({
                        results: [bestPoint],
                        source: 'mapzen-smart-9'
                    });
                } else {
                    console.log("Mapzen Smart 9 found only LAND. Falling back to GEBCO.");
                    // Fall through to GEBCO
                }
            } else {
                // Normal Batch pass-through
                const mapzenData = await fetchDataset('mapzen', queryParam, 'nearest');
                if (mapzenData.results?.[0]?.elevation !== null) {
                    return NextResponse.json({ ...mapzenData, source: 'mapzen' });
                }
            }
        } catch (e) {
            console.warn("Mapzen API failed, falling back to GEBCO.", e);
        }

        // 2. Fallback to Global (GEBCO 2020) - Now with Smart Sampling!
        // We reuse the 'samples' or 'queryParam' logic to ensure we check surrounding pixels
        const fallbackParams = isSinglePoint
            ? `locations=${encodeURIComponent(samples)}` // Use the SAME 13-point sample grid as Mapzen
            : queryParam;

        const gebcoData = await fetchDataset('gebco2020', fallbackParams);

        // If we used smart sampling (isSinglePoint), we need to filter for water again
        if (isSinglePoint && gebcoData.results) {
            const waterPoints = gebcoData.results.filter((r: any) => r.elevation !== null && r.elevation <= 1);
            if (waterPoints.length > 0) {
                waterPoints.sort((a: any, b: any) => a.elevation - b.elevation);
                return NextResponse.json({
                    results: [waterPoints[0]],
                    source: 'gebco-smart-13'
                });
            }
        }

        return NextResponse.json({ ...gebcoData, source: 'gebco2020' });

    } catch (error: any) {
        console.error('Depth API Proxy Critical Error:', error);
        // Return 502 (Bad Gateway) to indicate upstream issue, with details
        return NextResponse.json({
            error: error.message || 'Failed to fetch depth',
            details: error.toString()
        }, { status: 502 });
    }
}
