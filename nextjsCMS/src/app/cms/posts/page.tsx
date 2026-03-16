import Link from 'next/link'
import { Plus } from 'lucide-react'
import { getPosts } from './actions'
import { PostsList } from '@/components/posts-list'

export default async function PostsPage() {
  const posts = await getPosts()

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center text-left">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: '#1a2e1a' }}>
            Blog Posts
          </h1>
          <p className="text-gray-500 mt-1">Kelola artikel dan konten blog Arkara.</p>
        </div>
        <Link
          href="/cms/posts/new"
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all hover:opacity-90 shadow-sm"
          style={{ backgroundColor: '#d4a017', color: '#1a2e1a' }}
        >
          <Plus className="w-4 h-4" />
          Post Baru
        </Link>
      </div>

      <PostsList initialPosts={posts} />
    </div>
  )
}

