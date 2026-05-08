"use client"

import { CheckCircle2, Loader2, Plus, Sparkles, Trash2, Smartphone } from 'lucide-react'
import { useState } from 'react'
import type {
  GenerateMobileReaderStructureInput,
  GenerateMobileReaderStructureOutput,
} from '@/lib/ai/schemas'
import { normalizeEditorContentForAI } from '@/lib/editor-content'

type EditorialFormat = 'legacy' | 'mobile_reader' | 'technical_guide'

interface FAQItem {
  question: string
  answer: string
}

interface MobileReaderFieldsProps {
  quickAnswer: string
  keyTakeaways: string[]
  faq: FAQItem[]
  editorialFormat: EditorialFormat
  onQuickAnswerChange: (value: string) => void
  onKeyTakeawaysChange: (value: string[]) => void
  onFaqChange: (value: FAQItem[]) => void
  onEditorialFormatChange: (value: EditorialFormat) => void
  sourceTitle?: string
  sourceContent?: string
  sourceDescription?: string
  generateStructure?: (
    input: GenerateMobileReaderStructureInput
  ) => Promise<
    | { success: true; data: GenerateMobileReaderStructureOutput; model: string }
    | { success: false; error: string }
  >
}

function updateArrayItem(items: string[], index: number, value: string): string[] {
  return items.map((item, itemIndex) => (itemIndex === index ? value : item))
}

function updateFaqItem(items: FAQItem[], index: number, patch: Partial<FAQItem>): FAQItem[] {
  return items.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item))
}

export function MobileReaderFields({
  quickAnswer,
  keyTakeaways,
  faq,
  editorialFormat,
  onQuickAnswerChange,
  onKeyTakeawaysChange,
  onFaqChange,
  onEditorialFormatChange,
  sourceTitle = '',
  sourceContent = '',
  sourceDescription,
  generateStructure,
}: MobileReaderFieldsProps) {
  const [isGeneratingStructure, setIsGeneratingStructure] = useState(false)
  const [generationError, setGenerationError] = useState<string | null>(null)
  const [generationSuccess, setGenerationSuccess] = useState(false)
  const takeaways = keyTakeaways.length ? keyTakeaways : ['']
  const faqItems = faq.length ? faq : [{ question: '', answer: '' }]
  const normalizedSourceContent = normalizeEditorContentForAI(sourceContent)
  const canGenerateStructure = Boolean(generateStructure && sourceTitle.trim() && normalizedSourceContent.length >= 80)
  const modeDescriptions: Record<EditorialFormat, string> = {
    legacy: 'Artikel memakai layout lama. Field struktur tetap bisa disimpan, tetapi tidak tampil di halaman publik.',
    mobile_reader: 'Menampilkan jawaban singkat, inti artikel, daftar isi ringkas, dan FAQ pada pengalaman baca mobile.',
    technical_guide: 'Menampilkan struktur prosedural: prosedur cepat, checklist lapangan, urutan prosedur, dan pertanyaan operasional.',
  }
  const quickAnswerLabel = editorialFormat === 'technical_guide' ? 'Prosedur Cepat' : 'Jawaban Singkat'
  const takeawaysLabel = editorialFormat === 'technical_guide' ? 'Checklist Lapangan' : 'Inti Artikel'
  const faqLabel = editorialFormat === 'technical_guide' ? 'Pertanyaan Operasional' : 'FAQ'

  const handleGenerateStructure = async () => {
    if (!generateStructure) return

    setIsGeneratingStructure(true)
    setGenerationError(null)
    setGenerationSuccess(false)

    try {
      const response = await generateStructure({
        title: sourceTitle,
        content: normalizedSourceContent,
        description: sourceDescription || undefined,
      })

      if (!response.success) {
        setGenerationError(response.error)
        return
      }

      onQuickAnswerChange(response.data.quick_answer)
      onKeyTakeawaysChange(response.data.key_takeaways)
      onFaqChange(response.data.faq)
      onEditorialFormatChange(response.data.editorial_format)
      setGenerationSuccess(true)
      window.setTimeout(() => setGenerationSuccess(false), 2500)
    } catch (error) {
      setGenerationError(error instanceof Error ? error.message : 'Gagal membuat struktur mobile.')
    } finally {
      setIsGeneratingStructure(false)
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-slate-950 text-slate-100 shadow-sm overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-white/10 bg-slate-900 px-5 py-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-emerald-400/10 p-2 text-emerald-300">
            <Smartphone className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-[0.18em] text-emerald-200">
              Mobile Reader Structure
            </h3>
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-400">
              Struktur ringkas untuk pengalaman baca mobile: jawaban cepat, inti artikel, dan FAQ yang bisa dipindai tanpa lelah.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {generateStructure ? (
            <button
              type="button"
              onClick={handleGenerateStructure}
              disabled={isGeneratingStructure || !canGenerateStructure}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-emerald-300/40 bg-emerald-400/10 px-3 text-xs font-black uppercase tracking-[0.12em] text-emerald-200 transition-colors hover:border-emerald-300 hover:bg-emerald-400/15 disabled:cursor-not-allowed disabled:opacity-45"
            >
              {isGeneratingStructure ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : generationSuccess ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              Generate Mobile Structure
            </button>
          ) : null}

          <select
            value={editorialFormat}
            onChange={(event) => onEditorialFormatChange(event.target.value as EditorialFormat)}
            className="h-10 rounded-xl border border-white/10 bg-slate-950 px-3 text-xs font-bold uppercase tracking-[0.14em] text-slate-200 outline-none focus:border-emerald-300"
          >
            <option value="legacy">Legacy</option>
            <option value="mobile_reader">Mobile Reader</option>
            <option value="technical_guide">Technical Guide</option>
          </select>
        </div>
      </div>
      <div className="border-b border-white/10 bg-slate-950/70 px-5 py-3 text-xs leading-relaxed text-slate-400">
        {modeDescriptions[editorialFormat]}
        {generateStructure && !canGenerateStructure ? (
          <p className="mt-2 text-amber-200">
            Isi judul dan konten utama minimal 80 karakter untuk generate struktur mobile dari artikel existing.
          </p>
        ) : null}
        {generationError ? (
          <p className="mt-2 text-red-300">{generationError}</p>
        ) : null}
        {generationSuccess ? (
          <p className="mt-2 text-emerald-200">Struktur mobile berhasil dibuat dan diterapkan ke field di bawah.</p>
        ) : null}
      </div>

      <div className="space-y-5 px-5 py-5">
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
            {quickAnswerLabel}
          </label>
          <textarea
            value={quickAnswer}
            onChange={(event) => onQuickAnswerChange(event.target.value)}
            rows={4}
            maxLength={500}
            className="w-full resize-none rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm leading-relaxed text-slate-100 outline-none transition-colors placeholder:text-slate-600 focus:border-emerald-300"
            placeholder={editorialFormat === 'technical_guide'
              ? 'Ringkas prosedur utama dalam 2-4 kalimat. Fokus pada tindakan pertama yang perlu dilakukan.'
              : 'Jawab inti artikel dalam 2-4 kalimat. Ini akan muncul di awal pengalaman baca mobile.'}
          />
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>Disarankan 180-350 karakter.</span>
            <span>{quickAnswer.length}/500</span>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <label className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
              {takeawaysLabel}
            </label>
            <button
              type="button"
              onClick={() => onKeyTakeawaysChange([...takeaways, ''].slice(0, 8))}
              disabled={takeaways.length >= 8}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-bold text-emerald-200 transition-colors hover:border-emerald-300 disabled:opacity-40"
            >
              <Plus className="h-3.5 w-3.5" />
              Tambah
            </button>
          </div>

          <div className="space-y-2">
            {takeaways.map((item, index) => (
              <div key={index} className="flex gap-2">
                <input
                  value={item}
                  onChange={(event) => onKeyTakeawaysChange(updateArrayItem(takeaways, index, event.target.value))}
                  className="flex-1 rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-emerald-300"
                  placeholder={editorialFormat === 'technical_guide' ? `Checklist ${index + 1}` : `Poin inti ${index + 1}`}
                />
                <button
                  type="button"
                  onClick={() => onKeyTakeawaysChange(takeaways.filter((_, itemIndex) => itemIndex !== index))}
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-white/10 text-slate-400 transition-colors hover:border-red-300 hover:text-red-300"
                  aria-label="Hapus inti artikel"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <label className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
              {faqLabel}
            </label>
            <button
              type="button"
              onClick={() => onFaqChange([...faqItems, { question: '', answer: '' }].slice(0, 8))}
              disabled={faqItems.length >= 8}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-bold text-emerald-200 transition-colors hover:border-emerald-300 disabled:opacity-40"
            >
              <Plus className="h-3.5 w-3.5" />
              Tambah
            </button>
          </div>

          <div className="space-y-3">
            {faqItems.map((item, index) => (
              <div key={index} className="rounded-xl border border-white/10 bg-slate-900 p-3">
                <div className="flex items-start gap-2">
                  <div className="grid flex-1 gap-2">
                    <input
                      value={item.question}
                      onChange={(event) => onFaqChange(updateFaqItem(faqItems, index, { question: event.target.value }))}
                      className="rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-emerald-300"
                      placeholder={`Pertanyaan ${index + 1}`}
                    />
                    <textarea
                      value={item.answer}
                      onChange={(event) => onFaqChange(updateFaqItem(faqItems, index, { answer: event.target.value }))}
                      rows={3}
                      className="resize-none rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm leading-relaxed text-slate-100 outline-none placeholder:text-slate-600 focus:border-emerald-300"
                      placeholder="Jawaban singkat dan praktis"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => onFaqChange(faqItems.filter((_, itemIndex) => itemIndex !== index))}
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-white/10 text-slate-400 transition-colors hover:border-red-300 hover:text-red-300"
                    aria-label="Hapus FAQ"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
