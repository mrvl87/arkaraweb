import type { APIRoute } from 'astro';

const SUPABASE_PUBLIC_MEDIA_BASE =
  'https://zythkkmygravwelxbwtf.supabase.co/storage/v1/object/public/media/';
const MEDIA_CACHE_CONTROL = 'public, max-age=31536000, s-maxage=31536000, immutable';
const MEDIA_CACHE_EXPIRES = new Date(Date.now() + 31536000 * 1000).toUTCString();
const MEMORY_CACHE_TTL_MS = 60 * 60 * 1000;
const MEMORY_CACHE_MAX_ITEMS = 80;
const MEMORY_CACHE_MAX_BYTES = 1024 * 1024;

type MemoryMediaEntry = {
  expiresAt: number;
  body: ArrayBuffer;
  headers: Record<string, string>;
};

const memoryMediaCache = new Map<string, MemoryMediaEntry>();

function createHeaders(values: Record<string, string>) {
  const headers = new Headers(values);
  headers.set('X-Arkara-Media-Cache', 'memory');
  return headers;
}

function setMemoryMediaCache(key: string, entry: MemoryMediaEntry) {
  if (memoryMediaCache.size >= MEMORY_CACHE_MAX_ITEMS) {
    const oldestKey = memoryMediaCache.keys().next().value;
    if (oldestKey) memoryMediaCache.delete(oldestKey);
  }

  memoryMediaCache.set(key, entry);
}

export const GET: APIRoute = async ({ params, request }) => {
  const mediaPath = params.path;

  if (!mediaPath || mediaPath.includes('..')) {
    return new Response('Not found', { status: 404 });
  }

  const upstreamPath = mediaPath
    .split('/')
    .map((segment) => encodeURIComponent(decodeURIComponent(segment)))
    .join('/');
  const cacheKey = upstreamPath;
  const cached = memoryMediaCache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    return new Response(cached.body.slice(0), {
      status: 200,
      headers: createHeaders(cached.headers),
    });
  }

  if (cached) {
    memoryMediaCache.delete(cacheKey);
  }

  const upstreamUrl = new URL(upstreamPath, SUPABASE_PUBLIC_MEDIA_BASE);
  const upstreamResponse = await fetch(upstreamUrl, {
    headers: {
      Accept: request.headers.get('Accept') ?? 'image/avif,image/webp,image/*,*/*;q=0.8',
    },
  });

  if (!upstreamResponse.ok || !upstreamResponse.body) {
    return new Response('Not found', { status: upstreamResponse.status === 404 ? 404 : 502 });
  }

  const headers = new Headers({
    'Cache-Control': MEDIA_CACHE_CONTROL,
    'CDN-Cache-Control': MEDIA_CACHE_CONTROL,
    'Surrogate-Control': 'max-age=31536000',
    Expires: MEDIA_CACHE_EXPIRES,
    'Content-Type': upstreamResponse.headers.get('Content-Type') ?? 'application/octet-stream',
    Vary: 'Accept',
  });
  const upstreamEtag = upstreamResponse.headers.get('ETag');
  const upstreamLastModified = upstreamResponse.headers.get('Last-Modified');

  if (upstreamEtag) {
    headers.set('ETag', upstreamEtag);
  }

  if (upstreamLastModified) {
    headers.set('Last-Modified', upstreamLastModified);
  }

  const body = await upstreamResponse.arrayBuffer();
  const headerValues = Object.fromEntries(headers.entries());

  if (body.byteLength <= MEMORY_CACHE_MAX_BYTES) {
    setMemoryMediaCache(cacheKey, {
      expiresAt: Date.now() + MEMORY_CACHE_TTL_MS,
      body,
      headers: headerValues,
    });
  }

  return new Response(body.slice(0), {
    status: 200,
    headers: new Headers(headerValues),
  });
};
