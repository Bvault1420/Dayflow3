import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cursor Cloud / agent preview hosts need access to /_next/* in dev
  allowedDevOrigins: [
    "*.agent.cvm.dev",
    "*.cvm.dev",
    "localhost",
    "127.0.0.1",
  ],
};

export default nextConfig;
