import type { Metadata, Viewport } from "next";
import "leaflet/dist/leaflet.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "GPSonWaves: Fishing Forecast & Maps",
  description: "Know if a fishing spot is worth it right now. Marine conditions, AI forecasts, depth maps.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "GPSonWaves",
  },
  icons: {
    apple: [
      { url: "/icon.png", sizes: "512x512", type: "image/png" },
    ],
    icon: [
      { url: "/icon.png", sizes: "512x512", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0f172a",
};

import { UserProvider } from "@/context/UserContext";
import { SensorProvider } from "@/context/SensorContext";
import { Providers } from "@/components/Providers";
import InstallPrompt from "@/components/InstallPrompt";

// ...

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <UserProvider>
            <SensorProvider>
              {children}
            </SensorProvider>
          </UserProvider>
          <InstallPrompt />
        </Providers>
      </body>
    </html>
  );
}
