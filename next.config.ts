import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prevent bundling of firebase-admin to avoid Turbopack crashes
  serverExternalPackages: ["firebase-admin"],
};

export default nextConfig;
