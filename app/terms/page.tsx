import Link from 'next/link';
export default function TermsOfService() {
    return (
        <div className="min-h-screen bg-slate-900 text-slate-200 p-8 md:p-16 overflow-y-auto">
            <div className="max-w-3xl mx-auto space-y-6">
                <h1 className="text-3xl font-bold text-emerald-400 mb-8">Terms of Service</h1>

                <section className="space-y-2">
                    <h2 className="text-xl font-semibold text-white">1. Acceptance of Terms</h2>
                    <p className="text-sm opacity-80">
                        By accessing and using GPSonWaves, you accept and agree to be bound by the terms and provision of this agreement.
                    </p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-xl font-semibold text-white">2. Safety Disclaimer</h2>
                    <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-lg">
                        <h3 className="text-rose-400 font-bold mb-2">Warning: Maritime Safety</h3>
                        <p className="text-sm opacity-90">
                            GPSonWaves is a decision support tool, not a certified navigational instrument.
                            <strong>Never rely solely on this application for navigation or safety.</strong>
                            Always use official nautical charts, observe real-world conditions, and follow local maritime laws.
                            Fishing and boating involve inherent risks, including injury or death. You assume full responsibility for your actions.
                        </p>
                    </div>
                </section>

                <section className="space-y-2">
                    <h2 className="text-xl font-semibold text-white">3. Accuracy of Data</h2>
                    <p className="text-sm opacity-80">
                        Our bathymetry (depth) and weather data are sourced from third-party APIs (such as GEBCO and NOAA).
                        We cannot guarantee 100% accuracy of this data. Local anomalies, shifting sands, and data resolution limits mean
                        that actual conditions may vary.
                    </p>
                </section>

                <div className="pt-8 border-t border-white/10">
                    <Link href="/" className="text-emerald-400 hover:text-emerald-300">← Back to Map</Link>
                </div>
            </div>
        </div>
    );
}
