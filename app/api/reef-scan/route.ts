import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const bbox = searchParams.get('bbox');

    if (!bbox) {
        return NextResponse.json({ error: 'Missing bbox' }, { status: 400 });
    }

    try {
        const url = `https://allencoralatlas.org/geoserver/wfs?service=WFS&version=1.0.0&request=GetFeature&typeName=coral-atlas:benthic_data_verbose&maxFeatures=5&outputFormat=application/json&bbox=${bbox}&srsName=EPSG:4326`;

        const res = await fetch(url);

        if (!res.ok) {
            return NextResponse.json({ error: 'WFS Error' }, { status: res.status });
        }

        const text = await res.text();

        if (text.trim().startsWith('<')) {
            return NextResponse.json({ error: 'WFS returned XML' }, { status: 502 });
        }

        const data = JSON.parse(text);
        return NextResponse.json(data);

    } catch (error) {
        console.error("Proxy Reef Error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
