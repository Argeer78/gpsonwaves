'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { sensorManager, SensorData } from '@/services/SensorManager';

const SensorContext = createContext<SensorData | null>(null);

export function SensorProvider({ children }: { children: React.ReactNode }) {
    const [data, setData] = useState<SensorData>(sensorManager.getSnapshot());

    useEffect(() => {
        // Subscribe to central hub
        const unsubscribe = sensorManager.subscribe((newData) => {
            setData(newData);
        });

        // Initialize Internal Sensors by default?
        // Let's wait for user capability check, but we can init manager here.
        sensorManager.connectInternal();

        return () => unsubscribe();
    }, []);

    return (
        <SensorContext.Provider value={data}>
            {children}
        </SensorContext.Provider>
    );
}

export function useSensor() {
    const context = useContext(SensorContext);
    if (!context) {
        throw new Error('useSensor must be used within a SensorProvider');
    }
    return context;
}
