import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Compile the shared workspace package (ships TS source, not a build artifact).
  transpilePackages: ["@hmi/core"],
};

export default nextConfig;
