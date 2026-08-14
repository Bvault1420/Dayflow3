import type { NextConfig } from "next";

/** Hosts that may load the Next.js dev server (Chrome + Firefox + Cursor preview). */
const DEV_ORIGINS = [
  "localhost",
  "127.0.0.1",
  "[::1]",
  "::1",
  "*.localhost",
  "*.agent.cvm.dev",
  "*.cvm.dev",
  "*.cursor.sh",
  "*.cursor.com",
  "*.trycloudflare.com",
  "*.ngrok-free.app",
  "*.ngrok.io",
];

const nextConfig: NextConfig = {
  // Cursor Cloud / agent preview hosts need access to /_next/* in dev.
  // Firefox is stricter than Chrome about cross-origin HMR and IPv6 localhost.
  allowedDevOrigins: DEV_ORIGINS,
  experimental: {
    serverActions: {
      allowedOrigins: DEV_ORIGINS,
    },
  },
};

export default nextConfig;
