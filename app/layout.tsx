import type { Metadata, Viewport } from "next";
import "leaflet/dist/leaflet.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "GPSonWaves",
  description: "Is this spot worth fishing right now?",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

import { UserProvider } from "@/context/UserContext";
import { SensorProvider } from "@/context/SensorContext";

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
      </body>
    </html>
  );
}
