import type { Metadata, Viewport } from "next";
import "leaflet/dist/leaflet.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "GPSonWaves",
  description: "Is this spot worth fishing right now?",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "GPSonWaves",
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
        <UserProvider>
          <SensorProvider>
            {children}
          </SensorProvider>
        </UserProvider>
        <InstallPrompt />
      </body>
    </html>
  );
}
