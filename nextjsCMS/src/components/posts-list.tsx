"use client"

import { DataTable } from '@/components/data-table'
import { PostActions } from '@/components/post-actions'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

interface PostsListProps {
  initialPosts: any[]
}

export function PostsList({ initialPosts }: PostsListProps) {
  const columns = [
    {
      header: 'Judul',
      accessor: (post: any) => (
        <div className="flex flex-col text-left">
          <span className="font-medium text-gray-900">{post.title}</span>
          <span className="text-xs text-gray-400 font-mono">{post.slug}</span>
        </div>
      ),
    },
    {
      header: 'Kategori',
      accessor: (post: any) => (
        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 capitalize">
          {post.category}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: (post: any) => (
        <span
          className={`px-2.5 py-1 rounded-full text-xs font-medium ${
            post.status === 'published'
              ? 'bg-green-100 text-green-700'
              : 'bg-amber-100 text-amber-700'
          }`}
        >
          {post.status === 'published' ? 'Published' : 'Draft'}
        </span>
      ),
    },
    {
      header: 'Tanggal',
      accessor: (post: any) => (
        <span className="text-gray-500">
          {format(new Date(post.created_at), 'd MMM yyyy', { locale: id })}
        </span>
      ),
    },
    {
      header: '',
      accessor: (post: any) => <PostActions post={post} />,
      className: 'text-right',
    },
  ]

  return (
    <DataTable
      data={initialPosts}
      columns={columns}
      emptyMessage="Belum ada post. Klik 'Post Baru' untuk mulai menulis."
    />
  )
}
