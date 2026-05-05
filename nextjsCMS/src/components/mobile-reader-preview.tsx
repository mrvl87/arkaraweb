"use client"

import { BookOpen, ChevronLeft, Clock3, FileText, HelpCircle, ListChecks, Wrench } from 'lucide-react'

type EditorialFormat = 'legacy' | 'mobile_reader' | 'technical_guide'

interface FAQItem {
  question: string
  answer: string
}

interface MobileReaderPreviewProps {
  title: string
  entityLabel: string
  description?: string
  quickAnswer?: string
  keyTakeaways?: string[]
  faq?: FAQItem[]
  contentHtml?: string
  imageUrl?: string
  category?: string
  editorialFormat?: EditorialFormat
}

function stripHtml(value: string): string {
  return value
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()
}

function getReadingMinutes(contentHtml?: string): number {
  const words = stripHtml(contentHtml || '').split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(words / 220))
}

export function MobileReaderPreview({
  title,
  entityLabel,
  description,
  quickAnswer,
  keyTakeaways = [],
  faq = [],
  contentHtml = '',
  imageUrl,
  category,
  editorialFormat = 'legacy',
}: MobileReaderPreviewProps) {
  const isLegacy = editorialFormat === 'legacy'
  const isTechnicalGuide = editorialFormat === 'technical_guide'
  const modeLabel = isLegacy ? 'Legacy' : isTechnicalGuide ? 'Technical Guide' : 'Mobile Reader'
  const quickLabel = isTechnicalGuide ? 'Prosedur Cepat' : 'Jawaban Singkat'
  const takeawaysLabel = isTechnicalGuide ? 'Checklist Lapangan' : 'Inti Artikel'
  const faqLabel = isTechnicalGuide ? 'Pertanyaan Operasional' : 'FAQ'
  const cleanTakeaways = keyTakeaways.map((item) => item.trim()).filter(Boolean)
  const cleanFaq = faq
    .map((item) => ({
      question: item.question.trim(),
      answer: item.answer.trim(),
    }))
    .filter((item) => item.question && item.answer)
  const readingMinutes = getReadingMinutes(contentHtml)
  const fallbackDescription = description?.trim() || 'Preview akan terasa lebih lengkap setelah ringkasan atau jawaban singkat diisi.'

  return (
    <section className="overflow-hidden rounded-[28px] border border-slate-800 bg-slate-950 shadow-xl">
      <div className="border-b border-white/10 bg-slate-900 px-4 py-3">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-300">
          Mobile Preview
        </p>
        <p className="mt-1 text-xs text-slate-400">
          Simulasi ringkas pengalaman baca soft black berdasarkan mode editorial.
        </p>
      </div>

      <div className="mx-auto max-w-[390px] bg-[#070b0c] text-slate-100">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-[#070b0c]/95 px-4 py-3 backdrop-blur">
          <button
            type="button"
            className="grid h-9 w-9 place-items-center rounded-full border border-white/10 text-slate-300"
            aria-label="Preview back button"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2 rounded-full border border-white/10 px-3 py-1 text-[11px] font-bold text-slate-300">
            <BookOpen className="h-3.5 w-3.5 text-emerald-300" />
            {entityLabel}
          </div>
          <div className="h-9 w-9 rounded-full border border-white/10 bg-white/5" />
        </div>

        <div className="space-y-5 px-4 py-5">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-emerald-300">
              <span>{category || entityLabel}</span>
              <span className="text-slate-600">/</span>
              <span className="inline-flex items-center gap-1 text-slate-400">
                <Clock3 className="h-3.5 w-3.5" />
                {readingMinutes} min
              </span>
              <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 ${
                isTechnicalGuide
                  ? 'border-amber-300/20 text-amber-200'
                  : isLegacy
                    ? 'border-slate-600/40 text-slate-400'
                    : 'border-emerald-300/20 text-emerald-200'
              }`}>
                {isTechnicalGuide ? <Wrench className="h-3.5 w-3.5" /> : isLegacy ? <FileText className="h-3.5 w-3.5" /> : <BookOpen className="h-3.5 w-3.5" />}
                {modeLabel}
              </span>
            </div>
            <h2 className="text-[28px] font-black leading-[1.05] text-white">
              {title || 'Judul konten akan tampil di sini'}
            </h2>
            <p className="text-sm leading-relaxed text-slate-400">
              {fallbackDescription}
            </p>
          </div>

          {imageUrl ? (
            <div className="aspect-[4/3] overflow-hidden rounded-2xl border border-white/10 bg-slate-900">
              <img src={imageUrl} alt="" className="h-full w-full object-cover" />
            </div>
          ) : (
            <div className="grid aspect-[4/3] place-items-center rounded-2xl border border-dashed border-white/10 bg-slate-900 text-xs font-bold uppercase tracking-[0.16em] text-slate-600">
              Hero image
            </div>
          )}

          {isLegacy ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                Mode Legacy
              </p>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                Field jawaban singkat, inti artikel, dan FAQ disimpan sebagai data editorial, tetapi tidak ditampilkan di layout publik.
              </p>
            </div>
          ) : quickAnswer?.trim() ? (
            <div className={`rounded-2xl border p-4 ${isTechnicalGuide ? 'border-amber-300/20 bg-amber-300/10' : 'border-emerald-300/20 bg-emerald-300/10'}`}>
              <p className={`text-[11px] font-black uppercase tracking-[0.18em] ${isTechnicalGuide ? 'text-amber-200' : 'text-emerald-200'}`}>
                {quickLabel}
              </p>
              <p className={`mt-2 text-[15px] leading-relaxed ${isTechnicalGuide ? 'text-amber-50' : 'text-emerald-50'}`}>
                {quickAnswer}
              </p>
            </div>
          ) : null}

          {!isLegacy && cleanTakeaways.length ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <div className={`mb-3 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] ${isTechnicalGuide ? 'text-amber-200' : 'text-slate-300'}`}>
                <ListChecks className={`h-4 w-4 ${isTechnicalGuide ? 'text-amber-300' : 'text-emerald-300'}`} />
                {takeawaysLabel}
              </div>
              <div className="space-y-2.5">
                {cleanTakeaways.map((item, index) => (
                  <div key={`${item}-${index}`} className="flex gap-3 text-sm leading-relaxed text-slate-200">
                    <span className={`grid h-6 w-6 shrink-0 place-items-center text-[11px] font-black ${
                      isTechnicalGuide
                        ? 'rounded-md bg-amber-300/10 text-amber-200'
                        : 'rounded-full bg-emerald-300/10 text-emerald-200'
                    }`}>
                      {isTechnicalGuide ? '✓' : index + 1}
                    </span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {contentHtml ? (
            <div className="mobile-preview-body max-h-[360px] overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 text-sm leading-relaxed text-slate-300">
              <div dangerouslySetInnerHTML={{ __html: contentHtml }} />
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-8 text-center text-sm text-slate-500">
              Isi editor akan muncul di area preview artikel.
            </div>
          )}

          {!isLegacy && cleanFaq.length ? (
            <div className="space-y-3 pb-5">
              <div className={`flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] ${isTechnicalGuide ? 'text-amber-200' : 'text-slate-300'}`}>
                <HelpCircle className={`h-4 w-4 ${isTechnicalGuide ? 'text-amber-300' : 'text-emerald-300'}`} />
                {faqLabel}
              </div>
              {cleanFaq.map((item, index) => (
                <details key={`${item.question}-${index}`} className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                  <summary className="cursor-pointer text-sm font-bold leading-snug text-slate-100">
                    {item.question}
                  </summary>
                  <p className="mt-2 text-sm leading-relaxed text-slate-400">
                    {item.answer}
                  </p>
                </details>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}
