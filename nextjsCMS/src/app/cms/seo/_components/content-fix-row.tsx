import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import type { SeoAuditItem, SeoIssue } from '@/lib/seo/content-audit'
import { readinessClass } from './seo-style-utils'

const formatter = new Intl.NumberFormat('id-ID')


function severityClass(severity: SeoIssue['severity']): string {
  if (severity === 'critical') return 'bg-red-50 text-red-700 border-red-200'
  if (severity === 'warning') return 'bg-amber-50 text-amber-700 border-amber-200'
  return 'bg-slate-50 text-slate-600 border-slate-200'
}

function typeLabel(type: SeoAuditItem['type']): string {
  return type === 'post' ? 'Blog' : 'Panduan'
}

interface ContentFixRowProps {
  item: SeoAuditItem
}

export function ContentFixRow({ item }: ContentFixRowProps) {
  const firstIssue = item.issues[0]

  return (
    <div className="grid gap-4 border-b border-gray-100 px-5 py-4 last:border-b-0 md:grid-cols-[1fr_160px_110px] md:items-center">
      <div className="min-w-0">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-arkara-green/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-arkara-green">
            {typeLabel(item.type)}
          </span>
          <span className="rounded-md bg-gray-100 px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-gray-500">
            {item.status}
          </span>
          {firstIssue ? (
            <span className={`rounded-md border px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${severityClass(firstIssue.severity)}`}>
              {firstIssue.severity}
            </span>
          ) : null}
        </div>
        <h3 className="truncate text-base font-black text-arkara-green">{item.title}</h3>
        <p className="mt-1 text-sm text-gray-500">{firstIssue?.label ?? 'Siap'}</p>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center text-xs md:grid-cols-1 md:text-left">
        <span className="rounded-md bg-gray-50 px-2 py-1 font-bold text-gray-600">{formatter.format(item.wordCount)} kata</span>
        <span className="rounded-md bg-gray-50 px-2 py-1 font-bold text-gray-600">{item.faqCount} FAQ</span>
        <span className="rounded-md bg-gray-50 px-2 py-1 font-bold text-gray-600">{item.internalLinkCount} link</span>
      </div>
      <div className="flex items-center justify-between gap-3 md:justify-end">
        <span className={`rounded-md border px-3 py-2 text-sm font-black ${readinessClass(item.score)}`}>
          {item.score}
        </span>
        <Link
          href={item.editHref}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-arkara-green text-white hover:bg-arkara-amber hover:text-arkara-green"
          aria-label={`Edit ${item.title}`}
        >
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  )
}
