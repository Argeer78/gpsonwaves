import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');

    if (!lat || !lng) {
        return NextResponse.json({ error: 'Missing lat/lng' }, { status: 400 });
    }

    try {
        const [weatherRes, marineRes] = await Promise.all([
            fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,wind_speed_10m,wind_direction_10m,weather_code,is_day&wind_speed_unit=kmh`
            ),
            fetch(
                `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lng}&current=wave_height,wave_direction,wave_period&hourly=sea_surface_temperature&timezone=auto`
            )
        ]);

        if (weatherRes.status === 429 || marineRes.status === 429) {
            return NextResponse.json({ error: 'Rate Limit' }, { status: 429 });
        }

        if (!weatherRes.ok) {
            return NextResponse.json({ error: 'Weather API Error' }, { status: weatherRes.status });
        }

        const weatherData = await weatherRes.json();
        const marineData = marineRes.ok ? await marineRes.json() : null;

        return NextResponse.json({ weather: weatherData, marine: marineData });

    } catch (error) {
        console.error("Proxy Weather Error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
