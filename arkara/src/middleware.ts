import { defineMiddleware } from 'astro:middleware';

const COMPRESSIBLE_CONTENT = /^(text\/|application\/(?:javascript|json|xml|rss\+xml|atom\+xml)|image\/svg\+xml)/i;
const MIN_COMPRESS_BYTES = 1024;

function appendVary(headers: Headers, value: string) {
  const current = headers.get('Vary');
  if (!current) {
    headers.set('Vary', value);
    return;
  }

  const values = current.split(',').map((item) => item.trim().toLowerCase());
  if (!values.includes(value.toLowerCase())) {
    headers.set('Vary', `${current}, ${value}`);
  }
}

function acceptsGzip(request: Request) {
  return request.headers.get('Accept-Encoding')?.toLowerCase().includes('gzip') ?? false;
}

export const onRequest = defineMiddleware(async (context, next) => {
  const response = await next();

  if (
    context.request.method === 'HEAD' ||
    !response.body ||
    !acceptsGzip(context.request) ||
    response.headers.has('Content-Encoding') ||
    response.headers.get('Cache-Control')?.toLowerCase().includes('no-transform')
  ) {
    return response;
  }

  const contentType = response.headers.get('Content-Type') ?? '';
  const contentLength = Number.parseInt(response.headers.get('Content-Length') ?? '', 10);

  if (
    !COMPRESSIBLE_CONTENT.test(contentType) ||
    (Number.isFinite(contentLength) && contentLength > 0 && contentLength < MIN_COMPRESS_BYTES) ||
    typeof CompressionStream === 'undefined'
  ) {
    return response;
  }

  const headers = new Headers(response.headers);
  headers.set('Content-Encoding', 'gzip');
  headers.delete('Content-Length');
  appendVary(headers, 'Accept-Encoding');

  return new Response(response.body.pipeThrough(new CompressionStream('gzip')), {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
});
