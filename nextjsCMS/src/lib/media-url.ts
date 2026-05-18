const DEFAULT_PUBLIC_MEDIA_BASE = 'https://media.arkaraweb.com'
const SUPABASE_MEDIA_PATH = '/storage/v1/object/public/media/'

function getPublicMediaBase() {
  return (process.env.NEXT_PUBLIC_MEDIA_PUBLIC_URL || DEFAULT_PUBLIC_MEDIA_BASE).replace(/\/+$/, '')
}

function encodeKey(key: string) {
  return key
    .replace(/^\/+/, '')
    .split('/')
    .map((segment) => encodeURIComponent(decodeURIComponent(segment)))
    .join('/')
}

export function resolveMediaUrl(filePath: string) {
  if (!filePath) return ''

  try {
    const url = new URL(filePath)
    const supabasePathIndex = url.pathname.indexOf(SUPABASE_MEDIA_PATH)

    if (url.hostname.endsWith('.supabase.co') && supabasePathIndex >= 0) {
      const key = url.pathname.slice(supabasePathIndex + SUPABASE_MEDIA_PATH.length)
      return `${getPublicMediaBase()}/${encodeKey(key)}${url.search}`
    }

    return filePath
  } catch {
    return `${getPublicMediaBase()}/${encodeKey(filePath)}`
  }
}
