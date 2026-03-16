"use client"

import { useState } from 'react'
import { Edit2, MoreVertical, Trash2, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'
import { togglePostStatus, deletePost } from '@/app/cms/posts/actions'
import { DeleteDialog } from '@/components/delete-dialog'

interface PostActionsProps {
  post: {
    id: string
    status: 'draft' | 'published'
    title: string
  }
}

export function PostActions({ post }: PostActionsProps) {
  const [showDropdown, setShowDropdown] = useState(false)

  const handleToggleStatus = async () => {
    try {
      await togglePostStatus(post.id, post.status)
      setShowDropdown(false)
    } catch (error) {
      alert("Gagal mengubah status: " + (error as Error).message)
    }
  }

  const handleDelete = async () => {
    await deletePost(post.id)
  }

  return (
    <div className="relative flex items-center gap-2">
      <Link
        href={`/cms/posts/${post.id}/edit`}
        className="p-2 text-gray-400 hover:text-amber-600 transition-colors"
        title="Edit"
      >
        <Edit2 className="w-4 h-4" />
      </Link>

      <button
        onClick={handleToggleStatus}
        className={`p-2 transition-colors ${
          post.status === 'published' 
            ? 'text-green-500 hover:text-amber-600' 
            : 'text-gray-400 hover:text-green-600'
        }`}
        title={post.status === 'published' ? 'Sembunyikan' : 'Terbitkan'}
      >
        {post.status === 'published' ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
      </button>

      <DeleteDialog
        title="Hapus Post?"
        description={`Apakah Anda yakin ingin menghapus "${post.title}"? Post ini akan hilang selamanya.`}
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
