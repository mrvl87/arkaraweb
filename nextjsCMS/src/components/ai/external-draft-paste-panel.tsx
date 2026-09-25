"use client"

import { useState } from 'react'
import { AlertCircle, CheckCircle2, ClipboardPaste, Trash2 } from 'lucide-react'
import { z } from 'zod'

const faqItemSchema = z.object({
  question: z.string().trim().min(1).max(220),
  answer: z.string().trim().min(1).max(700),
})

const externalDraftSchema = z.object({
  content: z.string().trim().min(1).optional(),
  quick_answer: z.string().trim().min(80).max(700).optional(),
  key_takeaways: z.array(z.string().trim().min(1).max(280)).min(3).max(5).optional(),
  faq: z.array(faqItemSchema).min(3).max(5).optional(),
  editorial_format: z.enum(['mobile_reader', 'technical_guide']).optional(),
  suggested_slug: z.string().trim().optional(),
  suggested_meta_title: z.string().trim().optional(),
  suggested_meta_desc: z.string().trim().optional(),
}).superRefine((value, ctx) => {
  const mobileFields = [
    value.quick_answer,
    value.key_takeaways,
    value.faq,
    value.editorial_format,
  ]
  const hasAnyMobileField = mobileFields.some((field) => field !== undefined)
  const hasCompleteMobileStructure = mobileFields.every((field) => field !== undefined)

  if (!value.content && !hasCompleteMobileStructure) {
    ctx.addIssue({
      code: 'custom',
      message: 'JSON harus berisi content atau satu paket Mobile Reader yang lengkap.',
    })
  }

  if (hasAnyMobileField && !hasCompleteMobileStructure) {
    ctx.addIssue({
      code: 'custom',
      message: 'Mobile Reader harus memuat quick_answer, key_takeaways, faq, dan editorial_format.',
    })
  }
})

type ExternalDraft = z.infer<typeof externalDraftSchema>

interface ExternalDraftPastePanelProps {
  editorReady: boolean
  onReplaceContent: (markdown: string) => void
  onApplyMetadata: (data: ExternalDraft) => void
  onApplyMobileStructure: (data: ExternalDraft) => void
}

function extractBalancedJSON(raw: string): string | null {
  const firstBrace = raw.search(/[\[{]/)
  if (firstBrace < 0) return null

  let depth = 0
  let inString = false
  let escaped = false

  for (let index = firstBrace; index < raw.length; index += 1) {
    const character = raw[index]

    if (inString) {
      if (escaped) {
        escaped = false
      } else if (character === '\\') {
        escaped = true
      } else if (character === '"') {
        inString = false
      }
      continue
    }

    if (character === '"') {
      inString = true
    } else if (character === '{' || character === '[') {
      depth += 1
    } else if (character === '}' || character === ']') {
      depth -= 1
      if (depth === 0) return raw.slice(firstBrace, index + 1)
    }
  }

  return null
}

function parseJSONText(raw: string): unknown {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)?.[1]
  const candidate = extractBalancedJSON(fenced ?? raw)

  if (!candidate) {
    throw new Error('JSON tidak ditemukan pada teks yang ditempel.')
  }

  return JSON.parse(candidate)
}

function extractMessageText(content: unknown): string {
  if (typeof content === 'string') return content
  if (!Array.isArray(content)) return ''

  return content
    .map((part) => {
      if (typeof part === 'string') return part
      if (!part || typeof part !== 'object') return ''

      const item = part as Record<string, unknown>
      if (typeof item.text === 'string') return item.text
      if (typeof item.content === 'string') return item.content
      return ''
    })
    .join('\n')
}

function unwrapExternalDraft(raw: string): unknown {
  const parsed = parseJSONText(raw)
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return parsed

  const object = parsed as Record<string, unknown>
  if (object.data && typeof object.data === 'object' && !Array.isArray(object.data)) {
    return object.data
  }

  const choices = object.choices
  if (Array.isArray(choices) && choices.length > 0) {
    const firstChoice = choices[0]
    if (firstChoice && typeof firstChoice === 'object') {
      const message = (firstChoice as Record<string, unknown>).message
      if (message && typeof message === 'object') {
        const content = extractMessageText((message as Record<string, unknown>).content)
        if (content) return parseJSONText(content)
      }
    }
  }

  return parsed
}

function formatValidationError(error: z.ZodError): string {
  return error.issues
    .map((issue) => `${issue.path.join('.') || 'JSON'}: ${issue.message}`)
    .join(' ')
}

export function ExternalDraftPastePanel({
  editorReady,
  onReplaceContent,
  onApplyMetadata,
  onApplyMobileStructure,
}: ExternalDraftPastePanelProps) {
  const [rawJSON, setRawJSON] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const applyJSON = (raw: string) => {
    setError(null)
    setSuccess(null)

    if (!raw.trim()) return

    try {
      const result = externalDraftSchema.safeParse(unwrapExternalDraft(raw))
      if (!result.success) {
        setError(formatValidationError(result.error))
        return
      }

      const draft = result.data
      if (draft.content && !editorReady) {
        setError('Editor utama belum siap. Tunggu hingga editor selesai dimuat, lalu tempel ulang JSON.')
        return
      }

      const applied: string[] = []

      if (draft.content) {
        onReplaceContent(draft.content)
        applied.push('konten utama')
      }

      if (
        draft.quick_answer &&
        draft.key_takeaways &&
        draft.faq &&
        draft.editorial_format
      ) {
        onApplyMobileStructure(draft)
        applied.push('Mobile Reader')
      }

      if (draft.suggested_slug || draft.suggested_meta_title || draft.suggested_meta_desc) {
        onApplyMetadata(draft)
        applied.push('metadata')
      }

      setSuccess(`${applied.join(', ')} berhasil diterapkan dari JSON eksternal.`)
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'JSON tidak valid.')
    }
  }

  const handlePaste = (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pastedText = event.clipboardData.getData('text')
    if (!pastedText) return

    event.preventDefault()
    setRawJSON(pastedText)
    applyJSON(pastedText)
  }

  const clearInput = () => {
    setRawJSON('')
    setError(null)
    setSuccess(null)
  }

  return (
    <section className="rounded-2xl border border-sky-200 bg-gradient-to-br from-sky-50 via-white to-emerald-50 p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-sky-100 p-2 text-sky-700">
            <ClipboardPaste className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-sky-700">
              External JSON Draft
            </p>
            <h3 className="mt-1 text-base font-black text-slate-900">
              Tempel hasil dari model atau sumber eksternal
            </h3>
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-600">
              JSON valid langsung mengganti konten utama dan mengisi Mobile Reader serta metadata yang tersedia.
            </p>
          </div>
        </div>

        {rawJSON ? (
          <button
            type="button"
            onClick={clearInput}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 transition-colors hover:border-red-200 hover:text-red-600"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Kosongkan
          </button>
        ) : null}
      </div>

      <textarea
        value={rawJSON}
        onChange={(event) => {
          setRawJSON(event.target.value)
          setError(null)
          setSuccess(null)
        }}
        onPaste={handlePaste}
        rows={8}
        spellCheck={false}
        className="mt-4 w-full resize-y rounded-xl border border-sky-200 bg-slate-950 px-4 py-3 font-mono text-xs leading-relaxed text-slate-100 outline-none transition-colors placeholder:text-slate-600 focus:border-sky-400"
        placeholder={'{\n  "content": "## Isi artikel dalam Markdown...",\n  "quick_answer": "...",\n  "key_takeaways": ["...", "...", "..."],\n  "faq": [{ "question": "...?", "answer": "..." }],\n  "editorial_format": "mobile_reader"\n}'}
        aria-label="JSON draft eksternal"
      />

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[11px] leading-relaxed text-slate-500">
          Menerima JSON langsung, blok <span className="font-mono">```json</span>, response OpenRouter, atau response server berisi <span className="font-mono">data</span>.
        </p>
        <button
          type="button"
          onClick={() => applyJSON(rawJSON)}
          disabled={!rawJSON.trim()}
          className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-xs font-black uppercase tracking-[0.12em] text-sky-200 transition-colors hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Terapkan JSON
        </button>
      </div>

      {success ? (
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{success}</span>
        </div>
      ) : null}

      {error ? (
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs leading-relaxed text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}
    </section>
  )
}
