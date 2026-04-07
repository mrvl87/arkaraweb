/**
 * Bulk Index Script - Google Indexing API
 * 
 * Gunakan script ini untuk:
 * - Submit semua URL saat pertama kali setup
 * - Re-index massal setelah migrasi atau perubahan besar
 * 
 * Cara pakai:
 *   node scripts/bulk-index.js
 *   node scripts/bulk-index.js --type=deleted  (untuk mark URL sebagai dihapus)
 * 
 * Quota Google Indexing API: 200 request/hari per project
 */

import { GoogleAuth } from 'google-auth-library'
import { createClient } from '@supabase/supabase-js'
// Env vars di-load via --env-file flag di npm script (Node.js 20+)

const SITE_URL = process.env.FRONTEND_SITE_URL || 'https://arkaraweb.com'
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

// -- Argument parsing --
const args = process.argv.slice(2)
const notificationType = args.includes('--type=deleted') ? 'URL_DELETED' : 'URL_UPDATED'
const dryRun = args.includes('--dry-run')

// -- Google Auth --
function createGoogleAuth() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n')

  if (!email || !privateKey) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_EMAIL atau GOOGLE_PRIVATE_KEY tidak dikonfigurasi di .env.local')
  }

  return new GoogleAuth({
    credentials: { client_email: email, private_key: privateKey },
    scopes: ['https://www.googleapis.com/auth/indexing'],
  })
}

// -- Indexing --
async function notifyUrl(accessToken, url, type) {
  if (dryRun) {
    console.log(`[DRY RUN] ${type} → ${url}`)
    return { success: true }
  }

  const res = await fetch('https://indexing.googleapis.com/v3/urlNotifications:publish', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ url, type }),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error(`  ✗ ${url} → ${res.status}: ${err}`)
    return { success: false, error: err }
  }

  console.log(`  ✓ ${type} → ${url}`)
  return { success: true }
}

// -- Delay helper (menghindari rate limit) --
const sleep = (ms) => new Promise(r => setTimeout(r, ms))

// -- Main --
async function main() {
  console.log('\n═══════════════════════════════════════')
  console.log('  Arkara - Google Indexing API Bulk Submit')
  console.log('═══════════════════════════════════════')
  console.log(`  Mode     : ${dryRun ? 'DRY RUN (tidak ada request nyata)' : 'LIVE'}`)
  console.log(`  Type     : ${notificationType}`)
  console.log(`  Site URL : ${SITE_URL}`)
  console.log('═══════════════════════════════════════\n')

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL atau SUPABASE_SERVICE_ROLE_KEY tidak dikonfigurasi')
  }

  // Ambil semua URL published dari Supabase
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

  const [{ data: posts, error: postsError }, { data: panduan, error: panduanError }] = await Promise.all([
    supabase.from('posts').select('slug').eq('status', 'published'),
    supabase.from('panduan').select('slug').eq('status', 'published'),
  ])

  if (postsError) throw new Error(`Supabase posts error: ${postsError.message}`)
  if (panduanError) throw new Error(`Supabase panduan error: ${panduanError.message}`)

  const urls = [
    ...( posts?.map(p => `${SITE_URL}/blog/${p.slug}`) || []),
    ...( panduan?.map(p => `${SITE_URL}/panduan/${p.slug}`) || []),
  ]

  console.log(`Ditemukan ${posts?.length || 0} posts dan ${panduan?.length || 0} panduan`)
  console.log(`Total URL yang akan disubmit: ${urls.length}\n`)

  if (urls.length === 0) {
    console.log('Tidak ada URL untuk disubmit.')
    return
  }

  // Autentikasi Google
  const auth = createGoogleAuth()
  const client = await auth.getClient()
  const tokenResult = await client.getAccessToken()

  if (!tokenResult.token) {
    throw new Error('Gagal mendapatkan access token dari Google')
  }

  // Submit satu per satu (menghindari rate limit)
  let success = 0
  let failed = 0

  for (const url of urls) {
    const result = await notifyUrl(tokenResult.token, url, notificationType)
    if (result.success) success++
    else failed++
    await sleep(200) // 200ms delay antar request
  }

  console.log(`\n═══════════════════════════════════════`)
  console.log(`  Selesai: ${success} berhasil, ${failed} gagal dari ${urls.length} URL`)
  console.log(`  Quota harian Google Indexing API: 200 request/hari`)
  console.log(`═══════════════════════════════════════\n`)
}

main().catch(err => {
  console.error('\n[FATAL ERROR]', err.message)
  process.exit(1)
})
