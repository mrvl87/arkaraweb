import { Search } from 'lucide-react'
import { ContentFixRow } from './content-fix-row'
import type { SeoAuditItem, VisibilityPromptSet } from '@/lib/seo/content-audit'

interface ContentFixSectionProps {
  items: SeoAuditItem[]
  visibilityPrompts: VisibilityPromptSet[]
  publishedContent: number
  draftContent: number
}

export function ContentFixSection({
  items,
  visibilityPrompts,
  publishedContent,
  draftContent,
}: ContentFixSectionProps) {
  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.25fr_0.75fr]">
      <section className="rounded-lg border border-gray-100 bg-white shadow-sm">
        <div className="flex flex-col gap-2 border-b border-gray-100 p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Prioritas</p>
            <h2 className="text-xl font-black text-arkara-green">Konten yang perlu dibenahi</h2>
          </div>
          <p className="text-sm font-semibold text-gray-500">
            {publishedContent} published, {draftContent} draft
          </p>
        </div>
        {items.length > 0 ? (
          <div>
            {items.map((item) => (
              <ContentFixRow key={`${item.type}:${item.id}`} item={item} />
            ))}
          </div>
        ) : (
          <div className="p-8 text-sm font-semibold text-gray-500">Tidak ada issue besar.</div>
        )}
      </section>

      <section className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm">
        <div className="mb-5">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Visibility tracker</p>
          <h2 className="text-xl font-black text-arkara-green">Prompt set mingguan</h2>
        </div>
        <div className="space-y-3">
          {visibilityPrompts.map((item) => (
            <div key={`${item.cluster}:${item.prompt}`} className="rounded-md border border-gray-100 bg-gray-50 p-3">
              <div className="mb-2 inline-flex items-center gap-2 rounded-md bg-white px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-arkara-green">
                <Search className="h-3 w-3" />
                {item.cluster}
              </div>
              <p className="text-sm font-bold leading-snug text-gray-700">{item.prompt}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
