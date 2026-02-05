
// ---------------------------------------------------------
// LIVE MARINE TRAFFIC SETUP
// ---------------------------------------------------------
// To enable real-time AIS (ship positions), you need an API Key.
//
// 1. **Free Option (Hobbyist)**: https://aisstream.io
//    - Sign up and get an API Key/Secret.
//    - This service uses WebSockets to stream live ship data.
//
// 2. **Paid Option**: MarineTraffic or Spire APIs
//    - These provide robust REST APIs but are expensive.
//
// Once you have a key from AISStream.io, paste it below:
const AIS_API_KEY = "369712e8851023d37c72c4fa5a8219a65b4330bb";
// ---------------------------------------------------------

import { ScoutSpot } from './ScoutService';

// ---------------------------------------------------------

export interface Vessel {
    id: string;
    name: string;
    lat: number;
    lng: number;
    course: number; // degrees
    speed: number; // knots
    type: 'fishing' | 'cargo' | 'pleasure' | 'tanker' | 'other';
    timestamp: number;
}

// Debug Interface
export interface AISDebugState {
    status: string;
    readyState: number; // 0=CONNECTING, 1=OPEN, 3=CLOSED
    lastCode: number | null;
    lastReason: string | null;
    vesselCount: number;
    bbox: string;
}

const mapMmsiToType = (shipType: number): Vessel['type'] => {
    if (shipType >= 30 && shipType <= 39) return 'fishing';
    if (shipType >= 70 && shipType <= 79) return 'cargo';
    if (shipType >= 80 && shipType <= 89) return 'tanker';
    if (shipType >= 36 && shipType <= 37) return 'pleasure'; // Sailing/Pleasure
    return 'other';
};

// Create a persistent Traffic Subscription
export const createTrafficSubscription = (
    onTrafficUpdate: (vessels: Vessel[]) => void,
    onStatus: (status: 'connecting' | 'connected' | 'disconnected' | 'error' | string) => void
) => {
    let socket: WebSocket | null = null;
    let simulationInterval: NodeJS.Timeout | null = null;
    let currentLat = 0;
    let currentLng = 0;

    // Debug State
    let debugState: AISDebugState = {
        status: 'init',
        readyState: 3,
        lastCode: null,
        lastReason: null,
        vesselCount: 0,
        bbox: 'none'
    };

    const updateDebug = (fields: Partial<AISDebugState>) => {
        debugState = { ...debugState, ...fields };
    };

    const startSimulation = (lat: number, lng: number) => {
        onStatus('simulation (fallback)');
        updateDebug({ status: 'simulation', readyState: 3 });

        if (simulationInterval) clearInterval(simulationInterval);
        onTrafficUpdate(getSimulatedTraffic(lat, lng));
        simulationInterval = setInterval(() => {
            onTrafficUpdate(getSimulatedTraffic(currentLat, currentLng));
        }, 5000);
    };

    const updateBounds = (lat: number, lng: number) => {
        currentLat = lat;
        currentLng = lng;
        updateDebug({ bbox: `[${(lat - 0.5).toFixed(2)},${(lng - 0.5).toFixed(2)}]` });

        // Validation
        if (!AIS_API_KEY || AIS_API_KEY.length < 10) {
            console.warn("Invalid AIS API Key. Using simulation.");
            if (!simulationInterval) startSimulation(lat, lng);
            return;
        }

        // If socket exists and open, send update
        if (socket && socket.readyState === WebSocket.OPEN) {
            const subscriptionMessage = {
                APIKey: AIS_API_KEY,
                BoundingBoxes: [[
                    [lat - 0.5, lng - 0.5],
                    [lat + 0.5, lng + 0.5]
                ]]
            };
            console.log("Updating AIS Bounds:", lat, lng);
            socket.send(JSON.stringify(subscriptionMessage));
        } else if (!socket || socket.readyState === WebSocket.CLOSED) {
            // Init socket if not exists (first call)
            connectSocket(lat, lng);
        }
    };

    const connectSocket = (lat: number, lng: number) => {
        onStatus('connecting...');
        updateDebug({ status: 'connecting', readyState: 0 });

        // Timeout Logic
        let connectionTimeout: NodeJS.Timeout | null = setTimeout(() => {
            if (socket && socket.readyState !== WebSocket.OPEN) {
                console.error("AIS Connection Timed Out (20s)");
                socket.close();
                onStatus('timeout - using sim');
                updateDebug({ status: 'timeout', lastReason: 'Handshake Timeout (20s)' });
                startSimulation(lat, lng);
            }
        }, 20000);

        try {
            socket = new WebSocket("wss://stream.aisstream.io/v0/stream");
            updateDebug({ readyState: socket.readyState });
        } catch (e: any) {
            console.error("Socket Init Failed", e);
            if (connectionTimeout) clearTimeout(connectionTimeout);
            onStatus('init error - using sim');
            updateDebug({ status: 'init_error', lastReason: e.message || 'Unknown Init Error' });
            startSimulation(lat, lng);
            return;
        }

        let vesselsMap = new Map<string, Vessel>();

        socket.onopen = () => {
            if (connectionTimeout) clearTimeout(connectionTimeout);
            connectionTimeout = null;

            console.log("AISStream Open");
            onStatus('connected');
            updateDebug({ status: 'connected', readyState: 1, lastCode: null, lastReason: null });

            const subscriptionMessage = {
                APIKey: AIS_API_KEY,
                BoundingBoxes: [[
                    [lat - 0.5, lng - 0.5],
                    [lat + 0.5, lng + 0.5]
                ]]
            };
            if (socket) {
                socket.send(JSON.stringify(subscriptionMessage));
            }
        };

        socket.onmessage = (event) => {
            try {
                const response = JSON.parse(event.data);
                if (response.MessageType === "PositionReport") {
                    onStatus('connected'); // Force connected status on data rx
                    const report = response.Message.PositionReport;
                    const meta = response.MetaData;

                    const vessel: Vessel = {
                        id: String(report.UserID),
                        name: meta.ShipName || `Unknown (${report.UserID})`,
                        lat: report.Latitude,
                        lng: report.Longitude,
                        course: report.Cog,
                        speed: report.Sog,
                        type: mapMmsiToType(meta.ShipType),
                        timestamp: Date.now()
                    };

                    vesselsMap.set(vessel.id, vessel);
                    const list = Array.from(vesselsMap.values());
                    updateDebug({ vesselCount: list.length });
                    onTrafficUpdate(list);
                }
            } catch (e) {
                console.error("AIS Parse Error", e);
            }
        };

        socket.onerror = (error) => {
            if (connectionTimeout) clearTimeout(connectionTimeout);
            console.error("AIS WebSocket Error", error);
            onStatus('socket error - using sim');
            // Error often gives no info in browser, wait for close
        };

        socket.onclose = (event) => {
            if (connectionTimeout) clearTimeout(connectionTimeout);
            console.warn(`AIS Socket Closed: ${event.code} - ${event.reason}`);
            updateDebug({
                readyState: 3,
                lastCode: event.code,
                lastReason: event.reason || 'Connection Closed'
            });

            if (!event.wasClean) {
                // If code is 4xxx, it's an API error
                let statusMsg = `err ${event.code} - using sim`;
                if (event.code === 1006) statusMsg = "net err (1006) - using sim";
                if (event.code >= 4000) statusMsg = `auth err (${event.code}) - using sim`;

                onStatus(statusMsg);
                startSimulation(lat, lng);
            }
        };
    };

    const close = () => {
        updateDebug({ status: 'closed_by_user', readyState: 3 });
        if (socket) socket.close();
        if (simulationInterval) clearInterval(simulationInterval);
    };

    const getDebugState = () => debugState;

    return {
        updateBounds,
        close,
        getDebugState
    };
};

// Keep simulation for fallback
export const getSimulatedTraffic = (lat: number, lng: number): Vessel[] => {
    const vessels: Vessel[] = [];
    const types: Vessel['type'][] = ['fishing', 'cargo', 'pleasure', 'pleasure', 'fishing'];

    for (let i = 0; i < 5; i++) {
        const latOffset = (Math.random() - 0.5) * 0.04;
        const lngOffset = (Math.random() - 0.5) * 0.04;

        vessels.push({
            id: `v-${i}`,
            name: `Simulated ${Math.floor(Math.random() * 9000) + 1000}`,
            lat: lat + latOffset,
            lng: lng + lngOffset,
            course: Math.floor(Math.random() * 360),
            speed: Math.floor(Math.random() * 20) + 5,
            type: types[i],
            timestamp: Date.now()
        });
    }
    return vessels;
};
