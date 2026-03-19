import type { APIRoute } from 'astro'

export const POST: APIRoute = async ({ request }) => {
  // Validasi secret — hanya CMS yang boleh trigger
  const secret = request.headers.get('x-revalidate-secret')
  if (secret !== import.meta.env.REVALIDATE_SECRET) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  let body: { type: string; slug?: string }
  try {
    body = await request.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 })
  }

  // Log untuk debugging di Railway
  console.log(`[REVALIDATE] type=${body.type} slug=${body.slug || '-'} at=${new Date().toISOString()}`)

  // Saat ini frontend pakai SSR penuh (output: 'server') — setiap request 
  // sudah fresh dari Supabase. Endpoint ini dicatat untuk nanti saat 
  // caching diaktifkan.
  // Di sini bisa tambahkan invalidasi Redis/KV cache jika nanti dipakai.

  return new Response(JSON.stringify({ 
    ok: true, 
    type: body.type,
    slug: body.slug,
    timestamp: new Date().toISOString()
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  })
}
