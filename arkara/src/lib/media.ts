export const SUPABASE_PUBLIC_MEDIA_BASE =
  'https://zythkkmygravwelxbwtf.supabase.co/storage/v1/object/public/media/';

const SUPABASE_PUBLIC_MEDIA_PATH = '/storage/v1/object/public/media/';
const SUPABASE_PUBLIC_MEDIA_URL_PATTERN =
  /https:\/\/[a-z0-9-]+\.supabase\.co\/storage\/v1\/object\/public\/media\/[^"'<>\s)]+/gi;

type MediaVariantOptions = {
  width?: number;
  quality?: number;
};

function toProxyPath(parsed: URL) {
  const mediaPath = parsed.pathname
    .slice(SUPABASE_PUBLIC_MEDIA_PATH.length)
    .split('/')
    .map((segment) => encodeURIComponent(decodeURIComponent(segment)))
    .join('/');

  return `/media-cache/${mediaPath}${parsed.search}`;
}

function appendVariantParams(url: string, options: MediaVariantOptions = {}) {
  if (!options.width && !options.quality) return url;

  try {
    const parsed = new URL(url, 'https://arkara.local');

    if (options.width) parsed.searchParams.set('w', String(options.width));
    if (options.quality) parsed.searchParams.set('q', String(options.quality));

    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return url;
  }
}

export function rewriteMediaUrl(url: string, options: MediaVariantOptions = {}) {
  try {
    const parsed = new URL(url);

    if (
      parsed.hostname.endsWith('.supabase.co') &&
      parsed.pathname.startsWith(SUPABASE_PUBLIC_MEDIA_PATH)
    ) {
      return appendVariantParams(toProxyPath(parsed), options);
    }
  } catch {
    if (url.startsWith('/media-cache/')) {
      return appendVariantParams(url, options);
    }
  }

  return url;
}

export function rewriteHtmlMediaUrls(html: string) {
  return html.replace(SUPABASE_PUBLIC_MEDIA_URL_PATTERN, (url) => rewriteMediaUrl(url));
}
