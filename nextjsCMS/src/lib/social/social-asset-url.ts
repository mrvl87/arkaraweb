const SOCIAL_ASSETS_PUBLIC_PATH = "/storage/v1/object/public/social-assets/";

function encodeStorageKey(key: string) {
  return key
    .replace(/^\/+/, "")
    .split("/")
    .map((segment) => encodeURIComponent(decodeURIComponent(segment)))
    .join("/");
}

export function resolveSocialAssetUrl(storagePath: string | null | undefined) {
  if (!storagePath) return "";

  try {
    const url = new URL(storagePath);
    return url.toString();
  } catch {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, "") ?? "";
    if (!supabaseUrl) return "";
    return `${supabaseUrl}${SOCIAL_ASSETS_PUBLIC_PATH}${encodeStorageKey(storagePath)}`;
  }
}