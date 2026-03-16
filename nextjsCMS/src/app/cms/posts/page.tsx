import Link from 'next/link'
import { Plus } from 'lucide-react'
import { getPosts } from './actions'
import { PostsList } from '@/components/posts-list'

export default async function PostsPage() {
  const posts = await getPosts()

  return (
    <div className="space-y-10 pb-10">
      <div className="flex justify-between items-end border-b border-arkara-green/5 pb-6">
        <div>
          <h1 className="text-4xl font-extrabold text-arkara-green tracking-tighter uppercase italic">
            Arsip <span className="text-arkara-amber">Blog</span>
          </h1>
          <p className="text-gray-500 mt-2 font-medium">Dokumentasi literasi dan kabar terbaru Arkara.</p>
        </div>
        <Link
          href="/cms/posts/new"
          className="flex items-center gap-3 px-8 py-4 rounded-2xl font-black bg-arkara-green text-white hover:bg-arkara-amber hover:text-arkara-green transition-all shadow-xl shadow-arkara-green/10 active:scale-95 uppercase tracking-widest text-xs"
        >
          <Plus className="w-5 h-5" />
          Tulis Artikel
        </Link>
      </div>

      <PostsList initialPosts={posts} />
    </div>
  )
}

