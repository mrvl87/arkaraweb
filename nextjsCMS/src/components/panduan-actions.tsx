"use client"

import { Edit2, Trash2, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'
import { togglePanduanStatus, deletePanduan } from '@/app/cms/panduan/actions'
import { DeleteDialog } from '@/components/delete-dialog'

interface PanduanActionsProps {
  panduan: {
    id: string
    status: 'draft' | 'published'
    title: string
  }
}

export function PanduanActions({ panduan }: PanduanActionsProps) {
  const handleToggleStatus = async () => {
    try {
      await togglePanduanStatus(panduan.id, panduan.status)
    } catch (error) {
      alert("Gagal mengubah status: " + (error as Error).message)
    }
  }

  const handleDelete = async () => {
    await deletePanduan(panduan.id)
  }

  return (
    <div className="relative flex items-center gap-2">
      <Link
        href={`/cms/panduan/${panduan.id}/edit`}
        className="p-2 text-gray-400 hover:text-amber-600 transition-colors"
        title="Edit"
      >
        <Edit2 className="w-4 h-4" />
      </Link>

      <button
        onClick={handleToggleStatus}
        className={`p-2 transition-colors ${
          panduan.status === 'published' 
            ? 'text-green-500 hover:text-amber-600' 
            : 'text-gray-400 hover:text-green-600'
        }`}
        title={panduan.status === 'published' ? 'Sembunyikan' : 'Terbitkan'}
      >
        {panduan.status === 'published' ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
      </button>

      <DeleteDialog
        title="Hapus Panduan?"
        description={`Apakah Anda yakin ingin menghapus "${panduan.title}"? Panduan ini akan hilang selamanya.`}
        onConfirm={handleDelete}
        trigger={
          <button
            className="p-2 text-gray-400 hover:text-red-600 transition-colors"
            title="Hapus"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        }
      />
    </div>
  )
}
