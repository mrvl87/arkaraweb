import Link from 'next/link'
import { Plus } from 'lucide-react'
import { getPosts } from './actions'
import { PostsList } from '@/components/posts-list'

export default async function PostsPage() {
  try {
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
  } catch (error: any) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 p-8 rounded-3xl m-6">
        <h2 className="text-2xl font-bold mb-4">Database Render Error (Posts)</h2>
        <p className="mb-4">Terjadi kesalahan pada saat memuat data artikel dari Supabase. Pastikan RLS mati atau skema valid.</p>
        <pre className="p-4 bg-white/50 border border-red-100 rounded-xl overflow-x-auto text-sm text-red-900 shadow-sm font-mono">
          {error.message || String(error)}
        </pre>
      </div>
    )
  }
}

