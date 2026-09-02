import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // the sandbox preview proxies the app under its own domain — allow its
  // dev-origin so HMR / Fast Refresh keep working without cross-origin noise
  allowedDevOrigins: ["space-z.ai", "*.space-z.ai"],
};

export default nextConfig;
