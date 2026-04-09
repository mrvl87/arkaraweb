"use client"

import { DataTable } from '@/components/data-table'
import { PanduanActions } from '@/components/panduan-actions'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

interface PanduanListProps {
  initialPanduan: any[]
}

export function PanduanList({ initialPanduan }: PanduanListProps) {
  const columns = [
    {
      header: 'Judul',
      accessor: (p: any) => (
        <div className="flex flex-col text-left">
          <span className="font-medium text-gray-900">{p.title}</span>
          <span className="text-xs text-gray-400 font-mono">{p.slug}</span>
          {p.redirect_count > 0 ? (
            <span className="mt-1 text-[11px] font-medium text-amber-700">
              {p.active_redirect_count > 0
                ? `${p.active_redirect_count} redirect aktif dari ${p.redirect_count} historical path`
                : `${p.redirect_count} historical path tersimpan`}
            </span>
          ) : null}
        </div>
      ),
    },
    {
      header: 'Bab Ref',
      accessor: (p: any) => (
        <span className="text-gray-600 font-medium">
          {p.bab_ref || '-'}
        </span>
      ),
    },
    {
      header: 'QR Slug',
      accessor: (p: any) => (
        <span className="text-gray-400 text-xs">
          {p.qr_slug || '-'}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: (p: any) => (
        <span
          className={`px-2.5 py-1 rounded-full text-xs font-medium ${
            p.status === 'published'
              ? 'bg-green-100 text-green-700'
              : 'bg-amber-100 text-amber-700'
          }`}
        >
          {p.status === 'published' ? 'Published' : 'Draft'}
        </span>
      ),
    },
    {
      header: 'Tanggal',
      accessor: (p: any) => (
        <span className="text-gray-500">
          {format(new Date(p.created_at), 'd MMM yyyy', { locale: id })}
        </span>
      ),
    },
    {
      header: '',
      accessor: (p: any) => <PanduanActions panduan={p} />,
      className: 'text-right',
    },
  ]

  return (
    <DataTable
      data={initialPanduan}
      columns={columns}
      emptyMessage="Belum ada panduan. Klik 'Panduan Baru' untuk mulai membuat."
    />
  )
}
