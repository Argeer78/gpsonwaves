export interface WeatherResult {
    temp: number;
    waterTemp?: number;
    windSpeed: number; // km/h
    windDirection?: number;
    condition: string;
    isDay: boolean;
    // Marine Data
    waveHeight?: number; // meters
    waveDirection?: number; // degrees
    wavePeriod?: number; // seconds
    beaufort?: number; // 0-12 scale
}

// Helper: Wind Speed (km/h) -> Beaufort Scale
const getBeaufort = (kmh: number): number => {
    if (kmh < 1) return 0;
    if (kmh < 6) return 1;
    if (kmh < 12) return 2;
    if (kmh < 20) return 3;
    if (kmh < 29) return 4;
    if (kmh < 39) return 5;
    if (kmh < 50) return 6;
    if (kmh < 62) return 7;
    if (kmh < 75) return 8;
    if (kmh < 89) return 9;
    if (kmh < 103) return 10;
    if (kmh < 118) return 11;
    return 12;
};

// WMO Weather interpretation codes (WW)
const getWeatherLabel = (code: number): string => {
    if (code === 0) return 'Clear Sky';
    if (code === 1) return 'Mainly Clear';
    if (code === 2) return 'Partly Cloudy';
    if (code === 3) return 'Overcast';
    if (code === 45 || code === 48) return 'Fog';
    if (code >= 51 && code <= 55) return 'Drizzle';
    if (code >= 61 && code <= 65) return 'Rain';
    if (code >= 80 && code <= 82) return 'Showers';
    if (code >= 95) return 'Thunderstorm';
    return 'Unknown';
};

// Cache storage: "lat,lng" -> { timestamp, data }
const weatherCache = new Map<string, { timestamp: number; data: WeatherResult }>();
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

export const getCurrentWeather = async (lat: number, lng: number): Promise<WeatherResult | null> => {
    // 1. Check Cache
    const cacheKey = `${lat.toFixed(3)},${lng.toFixed(3)}`; // ~100m precision
    const cached = weatherCache.get(cacheKey);

    if (cached && (Date.now() - cached.timestamp < CACHE_DURATION)) {
        // console.log("Weather Cache Hit ⚡"); 
        return cached.data;
    }

    try {
        // Call our internal proxy to avoid CORS
        const res = await fetch(`/api/weather?lat=${lat}&lng=${lng}`);

        if (res.status === 429) {
            console.warn("Weather API Limit Reached (429). Returning cached if available.");
            return cached ? cached.data : null;
        }

        if (!res.ok) {
            console.warn(`Weather API Error: ${res.status}`);
            return null;
        }

        const { weather: weatherData, marine: marineData } = await res.json();

        const current = weatherData.current;
        const marineCurrent = marineData?.current || {};

        // Robust Water Temp Extraction (Hourly fallback)
        let waterTemp: number | undefined = undefined;
        if (marineData?.hourly?.sea_surface_temperature) {
            const now = new Date();
            const currentHour = now.getHours();
            waterTemp = marineData.hourly.sea_surface_temperature[currentHour];
        }

        const result: WeatherResult = {
            temp: current.temperature_2m,
            waterTemp: waterTemp,
            windSpeed: current.wind_speed_10m,
            windDirection: current.wind_direction_10m,
            condition: getWeatherLabel(current.weather_code),
            isDay: current.is_day === 1,
            // Marine
            waveHeight: marineCurrent.wave_height ?? 0,
            waveDirection: marineCurrent.wave_direction ?? 0,
            wavePeriod: marineCurrent.wave_period ?? 0,
            beaufort: getBeaufort(current.wind_speed_10m)
        };

        // 2. Save to Cache
        weatherCache.set(cacheKey, { timestamp: Date.now(), data: result });

        return result;

    } catch (error) {
        console.error("Failed to fetch weather:", error);
        return null; // Fail gracefully
    }
};
