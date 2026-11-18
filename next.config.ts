import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ".nosync" keeps iCloud from syncing build output (this project lives in an iCloud folder).
  distDir: ".next.nosync",
  reactStrictMode: true,
};

export default nextConfig;
