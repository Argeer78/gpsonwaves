export default function CookiesPolicy() {
    return (
        <div className="min-h-screen bg-slate-900 text-slate-200 p-8 md:p-16 overflow-y-auto">
            <div className="max-w-3xl mx-auto space-y-6">
                <h1 className="text-3xl font-bold text-emerald-400 mb-8">Cookie Policy</h1>

                <section className="space-y-2">
                    <h2 className="text-xl font-semibold text-white">1. What are Cookies?</h2>
                    <p className="text-sm opacity-80">
                        Cookies are small text files that are used to store small pieces of information. They are stored on your device when the website is loaded on your browser.
                    </p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-xl font-semibold text-white">2. How We Use Cookies</h2>
                    <p className="text-sm opacity-80">
                        GPSonWaves uses:
                    </p>
                    <ul className="list-disc pl-5 text-sm opacity-80 space-y-1">
                        <li><strong>Essential Cookies:</strong> To ensure the website functions correctly.</li>
                        <li><strong>Local Storage:</strong> We use your browser's Local Storage to save your "Saved Spots" and user preferences (like map layer selection). This data stays on your device and is not uploaded to our servers as a tracking cookie.</li>
                    </ul>
                </section>

                <div className="pt-8 border-t border-white/10">
                    <a href="/" className="text-emerald-400 hover:text-emerald-300">← Back to Map</a>
                </div>
            </div>
        </div>
    );
}
