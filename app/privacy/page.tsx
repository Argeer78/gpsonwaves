import Link from 'next/link';
export default function PrivacyPolicy() {
    return (
        <div className="min-h-screen bg-slate-900 text-slate-200 p-8 md:p-16 overflow-y-auto">
            <div className="max-w-3xl mx-auto space-y-6">
                <h1 className="text-3xl font-bold text-emerald-400 mb-8">Privacy Policy</h1>

                <section className="space-y-2">
                    <h2 className="text-xl font-semibold text-white">1. Introduction</h2>
                    <p className="text-sm opacity-80">
                        Welcome to GPSonWaves. We respect your privacy and are committed to protecting your personal data.
                        This privacy policy will inform you as to how we look after your personal data when you visit our website
                        and tell you about your privacy rights and how the law protects you.
                    </p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-xl font-semibold text-white">2. Data We Collect</h2>
                    <p className="text-sm opacity-80">
                        We collect the following types of information:
                    </p>
                    <ul className="list-disc pl-5 text-sm opacity-80 space-y-1">
                        <li><strong>Location Data:</strong> To provide fishing forecasts content, we require access to your real-time geolocation. This data is processed locally or sent to our API solely for the purpose of retrieving weather and bathymetric data. We do not store your historical location tracks on our servers.</li>
                        <li><strong>Usage Data:</strong> We may collect anonymous usage statistics to improve our service.</li>
                    </ul>
                </section>

                <section className="space-y-2">
                    <h2 className="text-xl font-semibold text-white">3. Local Storage</h2>
                    <p className="text-sm opacity-80">
                        Your "Saved Spots" are stored locally on your specific device using browser LocalStorage.
                        GPSonWaves does not have access to this personal database; it lives entirely on your phone or computer.
                    </p>
                </section>

                <div className="pt-8 border-t border-white/10">
                    <Link href="/" className="text-emerald-400 hover:text-emerald-300">← Back to Map</Link>
                </div>
            </div>
        </div>
    );
}
