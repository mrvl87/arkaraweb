import Link from 'next/link'
import { ExternalLink, Save } from 'lucide-react'
import type { SeoAuditItem } from '@/lib/seo/content-audit'

export type RecentlyFixedLink = {
  id: string
  type: SeoAuditItem['type']
  title: string
  slug: string
  publicPath: string
  editPath: string
  updatedAt: string
  appliedFields: string[]
  indexingQueued: boolean
  indexingQueueError?: string
}

interface RecentlyFixedLinksProps {
  fixedLinks: RecentlyFixedLink[]
  toCanonicalPublicUrl: (value: string) => string
}

export function RecentlyFixedLinks({ fixedLinks, toCanonicalPublicUrl }: RecentlyFixedLinksProps) {
  if (fixedLinks.length === 0) return null

  return (
    <div className="border-b border-gray-100 bg-emerald-50/40 p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700">Recently fixed</p>
          <h3 className="text-sm font-black text-arkara-green">Link yang baru diperbaiki</h3>
        </div>
        <span className="rounded-md border border-emerald-200 bg-white px-2 py-1 text-xs font-black text-emerald-700">
          {fixedLinks.length}
        </span>
      </div>
      <div className="grid gap-2 lg:grid-cols-2">
        {fixedLinks.map((item) => (
          <div key={`${item.type}:${item.id}:${item.updatedAt}`} className="flex items-center justify-between gap-3 rounded-md border border-emerald-100 bg-white px-3 py-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-black text-arkara-green">{item.title}</p>
              <p className="truncate text-xs font-semibold text-gray-500">{toCanonicalPublicUrl(item.publicPath)}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Link
                href={item.editPath}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-arkara-green text-white hover:bg-arkara-amber hover:text-arkara-green"
                aria-label={`Edit ${item.title}`}
              >
                <Save className="h-4 w-4" />
              </Link>
              <a
                href={toCanonicalPublicUrl(item.publicPath)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-100 bg-white text-arkara-green hover:border-arkara-amber hover:text-arkara-amber"
                aria-label={`Buka ${item.title}`}
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
