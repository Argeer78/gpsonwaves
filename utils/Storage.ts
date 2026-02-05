import { FishabilityResult, Species } from './FishabilityEngine';

export interface SavedSpot {
    id: string;
    name: string;
    lat: number;
    lng: number;
    species: Species;
    score: number;
    verdict: string;
    timestamp: number;
    notes?: string;
    tags?: string[];
    conditions?: {
        depth?: number;
        temp?: number;
        weather?: string;
        wind?: string;
    };
}

const STORAGE_KEY = 'gpsonwaves_saved_spots';

export const getSavedSpots = (): SavedSpot[] => {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
};

export const saveSpot = (spot: Omit<SavedSpot, 'id' | 'timestamp'>): SavedSpot => {
    const spots = getSavedSpots();
    const newSpot: SavedSpot = {
        ...spot,
        id: crypto.randomUUID(),
        timestamp: Date.now(),
    };

    const updated = [newSpot, ...spots];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return newSpot;
};

export const deleteSpot = (id: string): void => {
    const spots = getSavedSpots();
    const updated = spots.filter(s => s.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
};
