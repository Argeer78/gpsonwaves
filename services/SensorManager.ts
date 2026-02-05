export interface SensorData {
    source: 'internal' | 'ble' | 'nmea' | 'simulation';
    timestamp: number;

    // Core Data
    heading?: number;      // Degrees (0-360)
    speed?: number;        // Knots
    depth?: number;        // Meters
    temp?: number;         // Celsius

    // GPS
    lat?: number;
    lng?: number;
    accuracy?: number;

    // Status
    battery?: number;      // %
    connectionStatus: 'connected' | 'disconnected' | 'searching';
}

type SensorCallback = (data: SensorData) => void;

class SensorManager {
    private static instance: SensorManager;
    private subscribers: SensorCallback[] = [];
    private currentData: SensorData = {
        source: 'simulation',
        timestamp: Date.now(),
        connectionStatus: 'disconnected'
    };

    private constructor() {
        // Init logic
    }

    public static getInstance(): SensorManager {
        if (!SensorManager.instance) {
            SensorManager.instance = new SensorManager();
        }
        return SensorManager.instance;
    }

    public subscribe(callback: SensorCallback): () => void {
        this.subscribers.push(callback);
        // Send immediate current state
        callback(this.currentData);

        return () => {
            this.subscribers = this.subscribers.filter(cb => cb !== callback);
        };
    }

    public emit(data: Partial<SensorData>) {
        this.currentData = { ...this.currentData, ...data, timestamp: Date.now() };
        this.subscribers.forEach(cb => cb(this.currentData));
    }

    public getSnapshot(): SensorData {
        return this.currentData;
    }

    // --- Connectors ---

    public connectInternal() {
        if (this.currentData.source !== 'simulation' && this.currentData.source !== 'internal') {
            // Already connected to something better? Maybe allow override.
        }

        console.log("Starting Internal Sensors...");
        this.emit({ source: 'internal', connectionStatus: 'connected' });

        // 1. GPS (Speed & Course)
        if ('geolocation' in navigator) {
            navigator.geolocation.watchPosition((pos) => {
                const speedKnots = pos.coords.speed ? pos.coords.speed * 1.94384 : 0; // m/s to knots
                const heading = pos.coords.heading;

                this.emit({
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude,
                    speed: speedKnots,
                    heading: heading || this.currentData.heading, // Fallback to compass if GPS heading null
                    accuracy: pos.coords.accuracy,
                    timestamp: pos.timestamp
                });
            }, (err) => {
                console.warn("SensorManager GPS Error:", err);
            }, {
                enableHighAccuracy: true,
                maximumAge: 1000,
                timeout: 5000
            });
        }

        // 2. Compass (Magnetometer)
        if (typeof window !== 'undefined' && 'ondeviceorientationabsolute' in window) {
            // Android/Chrome absolute orientation
            (window as any).addEventListener('deviceorientationabsolute', (event: any) => {
                if (event.alpha) {
                    // 360 - alpha is usually standard compass heading on Android
                    const compass = 360 - event.alpha;
                    this.emit({ heading: compass });
                }
            });
        } else if (typeof window !== 'undefined' && 'ondeviceorientation' in window) {
            // iOS/Standard
            (window as any).addEventListener('deviceorientation', (event: DeviceOrientationEvent) => {
                // specific iOS webkitCompassHeading check
                // @ts-ignore
                if (event.webkitCompassHeading) {
                    // @ts-ignore
                    this.emit({ heading: event.webkitCompassHeading });
                } else if (event.alpha) {
                    this.emit({ heading: 360 - event.alpha });
                }
            });
        }
    }

    public async connectBLE() {
        if (typeof navigator === 'undefined' || !(navigator as any).bluetooth) {
            console.warn("Web Bluetooth not supported");
            return;
        }

        try {
            this.emit({ connectionStatus: 'searching' });

            // Generic scan for standard services
            // 0x181A = Environmental Sensing (Temp, Humidity)
            // 0x1819 = Location and Navigation (Speed, Depth)
            // 0x180F = Battery
            const device = await (navigator as any).bluetooth.requestDevice({
                filters: [
                    { services: ['environmental_sensing'] },
                    { services: ['location_and_navigation'] },
                    { services: ['battery_service'] } // Fallback for testing
                ],
                optionalServices: ['environmental_sensing', 'location_and_navigation', 'battery_service']
            });

            console.log("BLE Device selected:", device.name);
            const server = await device.gatt.connect();

            this.emit({
                source: 'ble',
                connectionStatus: 'connected',
                // Maybe preserve ID/Name?
            });
            console.log("BLE Connected!");

            // Start reading services...
            // This is a simplified implementation. Real-world would need robust service discovery.

            // 1. Battery (Test)
            try {
                const service = await server.getPrimaryService('battery_service');
                const char = await service.getCharacteristic('battery_level');
                const value = await char.readValue();
                const battery = value.getUint8(0);
                this.emit({ battery });

                // Subscribe
                await char.startNotifications();
                (char as any).addEventListener('characteristicvaluechanged', (e: any) => {
                    const level = e.target.value.getUint8(0);
                    this.emit({ battery: level });
                });
            } catch (e) { console.log('No Battery Service'); }

            // 2. Env Sensing (Temp)
            try {
                const service = await server.getPrimaryService('environmental_sensing');
                // 0x2A6E = Temperature
                const char = await service.getCharacteristic('temperature');
                await char.startNotifications();
                (char as any).addEventListener('characteristicvaluechanged', (e: any) => {
                    // Standard Temp is int16 (0.01 C)
                    const val = e.target.value.getInt16(0, true) / 100;
                    this.emit({ temp: val });
                });
            } catch (e) { console.log('No Env Service'); }

            (device as any).addEventListener('gattserverdisconnected', () => {
                console.log("BLE Disconnected");
                this.emit({ connectionStatus: 'disconnected' });
                // Fallback to internal?
                if (this.currentData.source === 'ble') {
                    this.connectInternal();
                }
            });

        } catch (err) {
            console.error("BLE Error:", err);
            this.emit({ connectionStatus: 'disconnected' });
        }
    }

    public connectNMEA(ip: string, port: number) {
        if (this.currentData.source === 'nmea' && this.currentData.connectionStatus === 'connected') {
            return; // Already connected
        }

        const url = `ws://${ip}:${port}/signalk/v1/stream?subscribe=self`;
        console.log(`Connecting Signal K at ${url}`);
        this.emit({ connectionStatus: 'searching' });

        try {
            const socket = new WebSocket(url);

            socket.onopen = () => {
                console.log("Signal K Connected");
                this.emit({
                    source: 'nmea',
                    connectionStatus: 'connected'
                });
            };

            socket.onmessage = (event) => {
                try {
                    const msg = JSON.parse(event.data);
                    // Parse Delta Format
                    if (msg.updates && Array.isArray(msg.updates)) {
                        msg.updates.forEach((update: any) => {
                            if (!update.values) return;

                            const patch: Partial<SensorData> = {};

                            update.values.forEach((val: any) => {
                                // Signal K Standard Units: m/s, rad, m, K
                                switch (val.path) {
                                    case 'navigation.speedOverGround':
                                        // m/s -> Knots
                                        patch.speed = (val.value as number) * 1.94384;
                                        break;
                                    case 'navigation.courseOverGroundTrue':
                                        // Rad -> Deg
                                        // normalize to 0-360
                                        let deg = (val.value as number) * (180 / Math.PI);
                                        if (deg < 0) deg += 360;
                                        patch.heading = deg;
                                        break;
                                    case 'environment.depth.belowTransducer':
                                        patch.depth = val.value as number;
                                        break;
                                    case 'environment.water.temperature':
                                    case 'environment.outside.temperature':
                                        // Kelvin -> Celsius
                                        patch.temp = (val.value as number) - 273.15;
                                        break;
                                }
                            });

                            if (Object.keys(patch).length > 0) {
                                this.emit(patch);
                            }
                        });
                    }
                } catch (e) {
                    console.warn("Signal K Parse Error", e);
                }
            };

            socket.onerror = (err) => {
                console.error("Signal K Error", err);
                this.emit({ connectionStatus: 'disconnected' });
            };

            socket.onclose = () => {
                console.log("Signal K Disconnected");
                this.emit({ connectionStatus: 'disconnected' });
                // Fallback
                if (this.currentData.source === 'nmea') {
                    this.connectInternal();
                }
            };

        } catch (e) {
            console.error("WebSocket Init Error", e);
            this.emit({ connectionStatus: 'disconnected' });
        }
    }
}

export const sensorManager = SensorManager.getInstance();
