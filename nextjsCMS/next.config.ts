import type { NextConfig } from "next";

const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  serverExternalPackages: ['sharp'],
} as NextConfig;

export default nextConfig;
