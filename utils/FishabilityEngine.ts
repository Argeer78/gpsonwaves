export type Verdict = 'good' | 'borderline' | 'bad';

export interface FishabilityResult {
    score: number; // 0-10
    verdict: Verdict;
    explanation: {
        title: string;
        details: string[];
        window?: string;
    };
}

export type Species = 'Bass' | 'Trout' | 'Saltwater General' | 'Redfish';

const MOCK_EXPLANATIONS = {
    good: [
        { title: "Prime Conditions", details: ["Stable barometric pressure", "Water temp ideal for feeding"] },
        { title: "Active Feeding Window", details: ["Upcoming low light period", "Tide movement is strong"] },
    ],
    borderline: [
        { title: "Hit or Miss", details: ["Pressure is falling fast", "Wind is picking up"] },
        { title: "Decent Potential", details: ["Water is slightly murky", "Fish may be deep"] },
    ],
    bad: [
        { title: "Not Worth It", details: ["Strong cold front passage", "High winds + unstable pressure"] },
        { title: "Shut Down", details: ["Bright midday sun", "Stagnant water"] },
    ]
};

export function calculateFishability(
    lat: number,
    lng: number,
    species: Species
): FishabilityResult {
    // deterministic random based on inputs to simulate consistency
    const seed = Math.abs(lat + lng + species.length) * 100;
    const score = Math.floor((seed % 10) + (Math.random() * 1)); // mostly consistent but slight jitter if we wanted

    // Actually, let's just make it purely random for "now" but consistent for same coords in this session if we wanted, 
    // but for the demo, let's just return a random score.
    // Wait, user says "Consistent".
    // Let's use Date.now() rounded to hour to keep it consistent for the hour.

    const hour = new Date().getHours();
    const pseudoRandom = (Math.sin(lat * 1000 + lng * 1000 + hour) + 1) / 2; // 0 to 1

    const finalScore = Math.floor(pseudoRandom * 10) + 1; // 1 to 10

    let verdict: Verdict = 'bad';
    if (finalScore >= 7) verdict = 'good';
    else if (finalScore >= 4) verdict = 'borderline';

    const explanationList = MOCK_EXPLANATIONS[verdict];
    const explanation = explanationList[Math.floor(pseudoRandom * 100) % explanationList.length];

    return {
        score: finalScore,
        verdict,
        explanation: {
            ...explanation,
            window: verdict === 'bad' ? 'Try tomorrow morning' : undefined
        }
    };
}
