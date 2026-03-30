/**
 * Google Indexing API Integration
 * 
 * Otomatis mengirim notifikasi ke Google ketika konten di-publish, diupdate, atau dihapus.
 * Menggunakan Service Account untuk autentikasi (tanpa OAuth interaktif).
 * 
 * Referensi: https://developers.google.com/search/apis/indexing-api/v3/quickstart
 */

import { GoogleAuth } from 'google-auth-library'

type IndexingType = 'URL_UPDATED' | 'URL_DELETED'

interface IndexingResult {
  success: boolean
  url: string
  type: IndexingType
  error?: string
}

/**
 * Membuat instance GoogleAuth menggunakan credentials dari environment variable.
 * Private key perlu di-unescape karena env var menyimpan \n sebagai literal string.
 */
function createGoogleAuth(): GoogleAuth {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n')

  if (!email || !privateKey) {
    throw new Error('[GoogleIndexing] GOOGLE_SERVICE_ACCOUNT_EMAIL atau GOOGLE_PRIVATE_KEY tidak dikonfigurasi')
  }

  return new GoogleAuth({
    credentials: {
      client_email: email,
      private_key: privateKey,
    },
    scopes: ['https://www.googleapis.com/auth/indexing'],
  })
}

/**
 * Kirim notifikasi ke Google Indexing API untuk satu URL.
 * 
 * @param url  - URL lengkap konten (contoh: https://arkaraweb.com/blog/my-post)
 * @param type - 'URL_UPDATED' saat publish/update, 'URL_DELETED' saat hapus
 */
export async function notifyGoogleIndexing(
  url: string,
  type: IndexingType = 'URL_UPDATED'
): Promise<IndexingResult> {
  // Skip jika tidak ada credentials — tidak merusak operasi CMS
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[GoogleIndexing] Credentials tidak dikonfigurasi, skip indexing untuk: ${url}`)
    }
    return { success: false, url, type, error: 'Credentials tidak dikonfigurasi' }
  }

  try {
    const auth = createGoogleAuth()
    const client = await auth.getClient()
    const accessToken = await client.getAccessToken()

    if (!accessToken.token) {
      throw new Error('Gagal mendapatkan access token dari Google')
    }

    const response = await fetch(
      'https://indexing.googleapis.com/v3/urlNotifications:publish',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken.token}`,
        },
        body: JSON.stringify({ url, type }),
        signal: AbortSignal.timeout(8000), // timeout 8 detik
      }
    )

    if (!response.ok) {
      const errorBody = await response.text()
      throw new Error(`Google API error ${response.status}: ${errorBody}`)
    }

    const result = await response.json()
    console.log(`[GoogleIndexing] ✓ ${type} → ${url}`, result.urlNotificationMetadata?.latestUpdate)

    return { success: true, url, type }
  } catch (error) {
    // Silent fail — CMS tetap berjalan normal
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error(`[GoogleIndexing] ✗ Gagal untuk ${url}:`, message)
    return { success: false, url, type, error: message }
  }
}

/**
 * Kirim notifikasi untuk multiple URL sekaligus (parallel).
 * Berguna saat bulk re-index atau halaman terkait perlu di-update.
 */
export async function notifyGoogleIndexingBulk(
  urls: string[],
  type: IndexingType = 'URL_UPDATED'
): Promise<IndexingResult[]> {
  return Promise.all(urls.map(url => notifyGoogleIndexing(url, type)))
}
