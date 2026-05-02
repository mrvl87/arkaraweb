import type { APIRoute } from 'astro';

const SUPABASE_PUBLIC_MEDIA_BASE =
  'https://zythkkmygravwelxbwtf.supabase.co/storage/v1/object/public/media/';
const MEDIA_CACHE_CONTROL = 'public, max-age=31536000, s-maxage=31536000, immutable';
const MEDIA_CACHE_EXPIRES = new Date(Date.now() + 31536000 * 1000).toUTCString();

export const GET: APIRoute = async ({ params, request }) => {
  const mediaPath = params.path;

  if (!mediaPath || mediaPath.includes('..')) {
    return new Response('Not found', { status: 404 });
  }

  const upstreamPath = mediaPath
    .split('/')
    .map((segment) => encodeURIComponent(decodeURIComponent(segment)))
    .join('/');
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

  return new Response(upstreamResponse.body, {
    status: 200,
    headers,
  });
};
