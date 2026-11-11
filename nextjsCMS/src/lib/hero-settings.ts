import { z } from 'zod'
import { resolveMediaUrl } from './media-url'

function publicImageUrl(value: string) {
  try {
    const url = resolveMediaUrl(value.trim())
    const parsed = new URL(url)
    if (parsed.protocol !== 'https:' || parsed.username || parsed.password) return ''
    return parsed.href
  } catch {
    return ''
  }
}

const mascotImage = z.unknown().transform((value, context) => {
  if (value === null || value === undefined || value === '') return null
  const media = typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null
  const raw = typeof value === 'string'
    ? value
    : typeof media?.file_path === 'string' && media.file_path.trim()
      ? media.file_path
      : typeof media?.url === 'string' ? media.url : ''
  const url = raw ? publicImageUrl(raw) : ''
  if (!url || (typeof media?.file_type === 'string' && media.file_type.trim() && !media.file_type.startsWith('image/'))) {
    context.addIssue({ code: 'custom', message: 'Pilih gambar maskot yang valid dari Media Library.' })
    return z.NEVER
  }
  return media ? { ...media, url } : url
})

const optionalText = z.string().nullish().transform((value) => value ?? '')

export const heroUpdateSchema = z.object({
  id: z.string().uuid(),
  headline: z.string().trim().min(1, 'Headline wajib diisi.'),
  subheadline: optionalText,
  body_text: optionalText,
  cta_primary_text: optionalText,
  cta_primary_href: optionalText,
  cta_secondary_text: optionalText,
  cta_secondary_href: optionalText,
  mascot_speech_text: optionalText,
  mascot_tagline: optionalText,
  mascot_image: mascotImage,
})
