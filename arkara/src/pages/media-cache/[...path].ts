import type { APIRoute } from 'astro';
import { PUBLIC_MEDIA_BASE } from '../../lib/media';

const MEDIA_CACHE_CONTROL = 'public, max-age=31536000, s-maxage=31536000, immutable';

export const GET: APIRoute = async ({ params, request }) => {
  const mediaPath = params.path;

  if (!mediaPath || mediaPath.includes('..')) {
    return new Response('Not found', { status: 404 });
  }

  const upstreamPath = mediaPath
    .split('/')
    .map((segment) => encodeURIComponent(decodeURIComponent(segment)))
    .join('/');
  const upstreamUrl = new URL(upstreamPath, PUBLIC_MEDIA_BASE);

  // Width/quality params were only used by the old Node/sharp proxy. Media is now
  // pre-sized by the CMS and served directly from R2.
  const response = await fetch(upstreamUrl, {
    headers: {
      Accept: request.headers.get('Accept') ?? 'image/avif,image/webp,image/*,*/*;q=0.8',
    },
  });

  if (!response.ok || !response.body) {
    return new Response('Not found', { status: response.status === 404 ? 404 : 502 });
  }

  const headers = new Headers(response.headers);
  headers.set('Cache-Control', MEDIA_CACHE_CONTROL);
  headers.set('CDN-Cache-Control', MEDIA_CACHE_CONTROL);
  headers.set('Surrogate-Control', 'max-age=31536000');
  headers.set('X-Arkara-Media-Source', 'r2');
  headers.delete('Set-Cookie');

  return new Response(response.body, {
    status: 200,
    headers,
  });
};
