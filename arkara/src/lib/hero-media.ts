import { PUBLIC_MEDIA_BASE, rewriteMediaUrl } from './media';

export const DEFAULT_MASCOT = {
  src: '/brand/arkara-guide.webp',
  alt: 'Pemandu Arkara dengan perlengkapan kesiapsiagaan, tersenyum dan mengacungkan jempol.',
  width: 638,
  height: 850,
} as const;

function imageUrl(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) return '';
  const raw = value.trim();
  if (raw.startsWith('/') && !raw.startsWith('//')) return raw;
  try {
    const url = raw.startsWith('uploads/')
      ? new URL(raw, PUBLIC_MEDIA_BASE)
      : new URL(raw);
    if (url.protocol !== 'https:' || url.username || url.password) return '';
    return rewriteMediaUrl(url.href);
  } catch {
    return '';
  }
}

/** Accept current MediaPicker JSON and legacy string URLs from hero_section. */
export function getHeroMascot(value: unknown) {
  const media = value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
  const formats = media?.formats && typeof media.formats === 'object'
    ? media.formats as Record<string, unknown>
    : null;
  const src = [typeof value === 'string' ? value : '', media?.url, media?.file_path, formats?.original, formats?.md, formats?.sm]
    .map(imageUrl).find(Boolean);
  if (!src) return { ...DEFAULT_MASCOT };

  let width: number = DEFAULT_MASCOT.width;
  let height: number = DEFAULT_MASCOT.height;
  if (typeof media?.aspect_ratio === 'string') {
    const match = media.aspect_ratio.trim().match(/^(\d+):(\d+)$/);
    if (match) {
      const w = Number(match[1]);
      const h = Number(match[2]);
      if (w > 0 && h > 0 && w <= 30000 && h <= 30000) {
        width = w;
        height = h;
      }
    }
  }
  const alt = typeof media?.alt_text === 'string' && media.alt_text.trim()
    ? media.alt_text.replace(/\s+/g, ' ').trim()
    : DEFAULT_MASCOT.alt;
  return { src, alt, width, height };
}
