import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware(async (context, next) => {
  const url = new URL(context.request.url);
  const canonicalHost = 'arkaraweb.com';
  const localHosts = new Set(['localhost', '127.0.0.1', '::1']);
  const forwardedProto = context.request.headers.get('x-forwarded-proto');
  const isHttps = url.protocol === 'https:' || forwardedProto === 'https';

  if (!localHosts.has(url.hostname) && (url.hostname !== canonicalHost || !isHttps)) {
    url.protocol = 'https:';
    url.hostname = canonicalHost;
    return context.redirect(url.href, 301);
  }

  return next();
});
