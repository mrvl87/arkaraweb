import type { GenerateSeoRepairPlanOutput } from '@/lib/ai/schemas'
import type { SeoAuditItem } from '@/lib/seo/content-audit'
import {
  containsRawHtml,
  contentPatchAfterText,
  emptyFallback,
  faqToText,
  linesFallback,
  proposedFaqToText,
} from './repair-utils'

export function DiffBlock({
  label,
  before,
  after,
}: {
  label: string
  before: string
  after: string
}) {
  return (
    <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
      <p className="mb-3 text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">{label}</p>
      <div className="grid gap-3 lg:grid-cols-2">
        <div className="rounded-md border border-gray-100 bg-gray-50 p-3">
          <p className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-gray-400">Before</p>
          <p className="whitespace-pre-wrap text-sm font-semibold leading-relaxed text-gray-600">{before}</p>
        </div>
        <div className="rounded-md border border-emerald-100 bg-emerald-50/50 p-3">
          <p className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-600">After</p>
          <p className="whitespace-pre-wrap text-sm font-semibold leading-relaxed text-arkara-green">{after}</p>
        </div>
      </div>
    </div>
  )
}

export function RepairDiffPreview({
  item,
  result,
}: {
  item: SeoAuditItem
  result: GenerateSeoRepairPlanOutput
}) {
  const hasRawHtmlPatch = result.content_patch.mode !== 'no_content_change' && containsRawHtml(result.content_patch.markdown)

  return (
    <div className="space-y-4 rounded-lg border border-arkara-green/10 bg-arkara-cream/30 p-4">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">Before / after review</p>
        <h3 className="mt-1 text-base font-black text-arkara-green">Preview perubahan sebelum apply</h3>
        <p className="mt-1 text-xs font-semibold leading-relaxed text-gray-500">
          Cek field lama dan proposal baru. Apply hanya menyimpan setelah approval dicentang.
        </p>
      </div>
      {hasRawHtmlPatch ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs font-bold leading-relaxed text-amber-700">
          Patch dari AI mengandung HTML mentah. Sistem akan mengubahnya ke Markdown sebelum apply.
        </div>
      ) : null}
      <div className="grid gap-4">
        <DiffBlock
          label="meta_title"
          before={emptyFallback(item.currentMetaTitle)}
          after={emptyFallback(result.proposed_meta_title)}
        />
        <DiffBlock
          label="meta_desc"
          before={emptyFallback(item.currentMetaDesc)}
          after={emptyFallback(result.proposed_meta_desc)}
        />
        <DiffBlock
          label="quick_answer"
          before={emptyFallback(item.currentQuickAnswer)}
          after={emptyFallback(result.proposed_quick_answer)}
        />
        <DiffBlock
          label="key_takeaways"
          before={linesFallback(item.currentKeyTakeaways)}
          after={linesFallback(result.proposed_key_takeaways)}
        />
        <DiffBlock
          label="faq"
          before={faqToText(item.currentFaq)}
          after={proposedFaqToText(result.proposed_faq)}
        />
        <DiffBlock
          label="content_patch"
          before={item.contentPreview ? `Konten saat ini: ${item.contentPreview}` : '(konten kosong atau belum dapat dipreview)'}
          after={contentPatchAfterText(result.content_patch)}
        />
      </div>
    </div>
  )
}