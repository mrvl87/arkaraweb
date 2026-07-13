import { z } from 'zod'
import { parseAIResponse } from './parser'

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'

export const SocialScreenshotMetricExtractionSchema = z.object({
  reach: z.number().int().min(0).nullable().optional(),
  reactions: z.number().int().min(0).nullable().optional(),
  comments: z.number().int().min(0).nullable().optional(),
  shares: z.number().int().min(0).nullable().optional(),
  link_clicks: z.number().int().min(0).nullable().optional(),
  video_views: z.number().int().min(0).nullable().optional(),
  captured_date: z.string().trim().max(40).nullable().optional(),
  confidence: z.number().min(0).max(1).default(0),
  notes: z.string().trim().max(800).optional().default(''),
})
export type SocialScreenshotMetricExtraction = z.infer<typeof SocialScreenshotMetricExtractionSchema>

export async function extractSocialMetricsFromScreenshot(input: {
  imageBase64: string
  mimeType: string
}): Promise<{ data: SocialScreenshotMetricExtraction; model: string; configured: boolean }> {
  const apiKey = process.env.OPENROUTER_API_KEY
  const model = process.env.OPENROUTER_VISION_MODEL
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  if (!apiKey || !model) {
    return {
      configured: false,
      model: model || 'not_configured',
      data: {
        reach: null,
        reactions: null,
        comments: null,
        shares: null,
        link_clicks: null,
        video_views: null,
        captured_date: null,
        confidence: 0,
        notes: 'Vision extraction belum dikonfigurasi. Isi angka secara manual lalu confirm.',
      },
    }
  }

  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'HTTP-Referer': siteUrl,
      'X-Title': 'Arkara CMS',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      temperature: 0,
      max_tokens: 900,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Extract Facebook insight metrics from this screenshot. Return JSON only with keys: reach, reactions, comments, shares, link_clicks, video_views, captured_date, confidence, notes. Use null when a value is not visible. Do not infer missing values. confidence is 0..1.`,
            },
            {
              type: 'image_url',
              image_url: { url: `data:${input.mimeType};base64,${input.imageBase64}` },
            },
          ],
        },
      ],
    }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData?.error?.message || `Vision extraction failed: ${response.status} ${response.statusText}`)
  }

  const payload = await response.json()
  const content = payload.choices?.[0]?.message?.content
  const raw = Array.isArray(content)
    ? content.map((part) => typeof part?.text === 'string' ? part.text : '').join('\n')
    : String(content ?? '')
  const parsed = parseAIResponse(raw, SocialScreenshotMetricExtractionSchema)

  return {
    configured: true,
    model: payload.model || model,
    data: parsed,
  }
}
