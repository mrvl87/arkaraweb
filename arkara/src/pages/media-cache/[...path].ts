import type { APIRoute } from 'astro';
import sharp from 'sharp';
import { SUPABASE_PUBLIC_MEDIA_BASE } from '../../lib/media';

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
const TRANSFORMABLE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

function parseDimension(value: string | null) {
  const width = Number.parseInt(value || '', 10);
  if (!Number.isFinite(width) || width <= 0) return undefined;

  return Math.min(Math.max(width, 64), 1600);
}

function parseQuality(value: string | null) {
  const quality = Number.parseInt(value || '', 10);
  if (!Number.isFinite(quality) || quality <= 0) return 74;

  return Math.min(Math.max(quality, 45), 86);
}

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
  const requestUrl = new URL(request.url);
  const variantWidth = parseDimension(requestUrl.searchParams.get('w'));
  const variantQuality = parseQuality(requestUrl.searchParams.get('q'));

  if (!mediaPath || mediaPath.includes('..')) {
    return new Response('Not found', { status: 404 });
  }

  const upstreamPath = mediaPath
    .split('/')
    .map((segment) => encodeURIComponent(decodeURIComponent(segment)))
    .join('/');
  const cacheKey = variantWidth
    ? `${upstreamPath}?w=${variantWidth}&q=${variantQuality}`
    : upstreamPath;
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
  let contentType = upstreamResponse.headers.get('Content-Type') ?? 'application/octet-stream';
  let upstreamEtag = upstreamResponse.headers.get('ETag');
  let upstreamLastModified = upstreamResponse.headers.get('Last-Modified');
  let body: Buffer | ArrayBuffer = Buffer.from(await upstreamResponse.arrayBuffer());

  if (variantWidth && TRANSFORMABLE_TYPES.has(contentType.split(';')[0].trim().toLowerCase())) {
    try {
      body = await sharp(body)
        .rotate()
        .resize({
          width: variantWidth,
          withoutEnlargement: true,
        })
        .webp({
          quality: variantQuality,
          effort: 4,
        })
        .toBuffer();
      contentType = 'image/webp';
      upstreamEtag = null;
      upstreamLastModified = null;
      headers.set('X-Arkara-Media-Variant', `${variantWidth}w-q${variantQuality}`);
    } catch {
      headers.set('X-Arkara-Media-Variant', 'fallback-original');
    }
  }

  headers.set('Content-Type', contentType);

  if (upstreamEtag) {
    headers.set('ETag', upstreamEtag);
  }

  if (upstreamLastModified) {
    headers.set('Last-Modified', upstreamLastModified);
  }

  const headerValues = Object.fromEntries(headers.entries());
  const bodySize = Buffer.isBuffer(body) ? body.byteLength : body.byteLength;

  if (bodySize <= MEMORY_CACHE_MAX_BYTES) {
    setMemoryMediaCache(cacheKey, {
      expiresAt: Date.now() + MEMORY_CACHE_TTL_MS,
      body: Buffer.isBuffer(body) ? body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength) : body,
      headers: headerValues,
    });
  }

  return new Response(Buffer.isBuffer(body) ? body : body.slice(0), {
    status: 200,
    headers: new Headers(headerValues),
  });
};
