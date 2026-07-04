import Link from 'next/link'
import { Bot, FileText, Radar } from 'lucide-react'

export function SeoPageHeader() {
  return (
    <div className="flex flex-col gap-5 border-b border-arkara-green/5 pb-6 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <div className="mb-3 inline-flex items-center gap-2 rounded-md bg-arkara-green px-3 py-2 text-xs font-black uppercase tracking-[0.18em] text-white">
          <Radar className="h-4 w-4" />
          Agentic SEO
        </div>
        <h1 className="text-4xl font-extrabold uppercase italic tracking-tighter text-arkara-green">
          SEO <span className="text-arkara-amber">Cockpit</span>
        </h1>
        <p className="mt-2 max-w-3xl text-sm font-medium leading-relaxed text-gray-500">
          Audit kesiapan konten untuk schema, answer-first structure, internal link, dan prompt visibility Arkara.
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Link
          href="/cms/ai"
          className="inline-flex items-center gap-2 rounded-md bg-white px-4 py-3 text-xs font-black uppercase tracking-widest text-arkara-green shadow-sm ring-1 ring-gray-100 hover:text-arkara-amber"
        >
          <Bot className="h-4 w-4" />
          AI Workspace
        </Link>
        <Link
          href="/cms/posts/new"
          className="inline-flex items-center gap-2 rounded-md bg-arkara-green px-4 py-3 text-xs font-black uppercase tracking-widest text-white shadow-sm hover:bg-arkara-amber hover:text-arkara-green"
        >
          <FileText className="h-4 w-4" />
          Draft Baru
        </Link>
      </div>
    </div>
  )
}
