import path from "path";
import { fileURLToPath } from "url";
import type { NextConfig } from "next";
import { getSupabaseSocialAssetRemotePatterns } from "./src/lib/social/supabase-image-pattern";

const configDir = path.dirname(fileURLToPath(import.meta.url));

const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: getSupabaseSocialAssetRemotePatterns(),
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  serverExternalPackages: ["sharp"],
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  turbopack: {
    root: configDir,
  },
} satisfies NextConfig;

export default nextConfig;
