export interface SocialAssetRemotePattern {
  protocol: "http" | "https";
  hostname: string;
  port: string;
  pathname: "/storage/v1/object/public/social-assets/**";
  search: "";
}

export function getSupabaseSocialAssetRemotePatterns(
  rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
): SocialAssetRemotePattern[] {
  const value = rawUrl?.trim();
  if (!value) return [];

  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") return [];

    return [
      {
        protocol: url.protocol.slice(0, -1) as "http" | "https",
        hostname: url.hostname,
        port: url.port,
        pathname: "/storage/v1/object/public/social-assets/**",
        search: "",
      },
    ];
  } catch {
    return [];
  }
}
