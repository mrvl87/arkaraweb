import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { generateFullDraft } from '@/lib/ai/operations'
import { GenerateFullDraftInputSchema } from '@/lib/ai/schemas'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const RequestSchema = z.object({
  targetType: z.enum(['post', 'panduan']),
  targetId: z.string().uuid().optional(),
  input: GenerateFullDraftInputSchema,
})

function encodeEvent(event: unknown): Uint8Array {
  return new TextEncoder().encode(`${JSON.stringify(event)}\n`)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const parsed = RequestSchema.safeParse(body)

  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ')
    return Response.json({ success: false, error: `Input validation failed: ${issues}` }, { status: 400 })
  }

  let isClosed = false
  let heartbeat: ReturnType<typeof setInterval> | null = null

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (event: unknown) => {
        if (isClosed) return

        try {
          controller.enqueue(encodeEvent(event))
        } catch {
          isClosed = true
          if (heartbeat) clearInterval(heartbeat)
        }
      }

      send({
        type: 'status',
        message: 'Menyiapkan konteks, internal link, dan web search untuk draft.',
      })

      heartbeat = setInterval(() => {
        send({
          type: 'status',
          message: 'AI masih memproses draft. Koneksi dijaga tetap aktif.',
        })
      }, 12000)

      generateFullDraft(parsed.data.input, {
        userId: user.id,
        targetType: parsed.data.targetType,
        targetId: parsed.data.targetId,
      })
        .then((result) => {
          send({ type: 'result', payload: result })
        })
        .catch((error) => {
          send({
            type: 'result',
            payload: {
              success: false,
              error: error instanceof Error ? error.message : 'Gagal membuat draft AI.',
            },
          })
        })
        .finally(() => {
          if (heartbeat) clearInterval(heartbeat)
          if (!isClosed) {
            isClosed = true
            controller.close()
          }
        })
    },
    cancel() {
      isClosed = true
      if (heartbeat) clearInterval(heartbeat)
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-store, no-transform',
      'X-Accel-Buffering': 'no',
    },
  })
}
