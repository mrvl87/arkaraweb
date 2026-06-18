import { defineMiddleware } from 'astro:middleware';

const LEGACY_PATH_REDIRECTS = new Map<string, string>([
  ['/blog/simulasi-3-hari-tanpa-listrik', '/blog/simulasi-3-hari-tanpa-listrik-di-rumah-anda'],
  ['/blog/paradoks-mi-instan', '/blog/paradoks-mi-instan-ketahanan-dan-pangan'],
  [
    '/blog/5-metode-mengolah-air-kotor',
    '/panduan/5-metode-mengolah-air-kotor-jadi-layak-minum-perbandingan-lengkap',
  ],
]);

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

  const normalizedPath = url.pathname.replace(/\/+$/, '') || '/';
  const legacyTarget = LEGACY_PATH_REDIRECTS.get(normalizedPath);

  if (legacyTarget) {
    return context.redirect(new URL(legacyTarget, `https://${canonicalHost}`).href, 301);
  }

  return next();
});
