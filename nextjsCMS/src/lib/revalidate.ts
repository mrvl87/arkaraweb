type ContentType = 'post' | 'panduan' | 'settings' | 'media'

interface RevalidatePayload {
  type: ContentType
  slug?: string
}

export async function triggerFrontendRevalidate(payload: RevalidatePayload): Promise<void> {
  const frontendUrl = process.env.FRONTEND_URL
  const secret = process.env.REVALIDATE_SECRET

  // Jika env tidak dikonfigurasi, skip silently — jangan break action utama
  if (!frontendUrl || !secret) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[REVALIDATE] FRONTEND_URL atau REVALIDATE_SECRET tidak dikonfigurasi')
    }
    return
  }

  try {
    const res = await fetch(`${frontendUrl}/api/revalidate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-revalidate-secret': secret,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5000),  // timeout 5 detik
    })

    if (!res.ok) {
      console.error(`[REVALIDATE] Frontend responded ${res.status}`)
    }
  } catch (error) {
    // Silent fail — CMS tetap jalan walau frontend tidak merespons
    console.error('[REVALIDATE] Failed to notify frontend:', error)
  }
}
