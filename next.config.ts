import withPWA from "@ducanh2912/next-pwa";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Your existing config
};

export default withPWA({
  dest: "public",
  register: true,
  register: true,
  // skipWaiting: true, // Removed as it caused type error in newer version
  disable: false, // Enable in dev for testing
  // cacheOnFrontEndNav: true,
  // aggressiveFrontEndNavCaching: true,
  // reloadOnOnline: true,
  // swcMinify: true, // Next 13+ does this by default
  workboxOptions: {
    disableDevLogs: true,
  },
})(nextConfig);
