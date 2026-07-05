"use client"

import type { ClusterSourcePostOption } from '@/app/cms/ai/actions'

interface AIClusterSourceSelectProps {
  clusterSourcePosts: ClusterSourcePostOption[]
  clusterSourcePostsError?: string | null
  selectedClusterPostId: string
  selectedClusterPost: ClusterSourcePostOption | null
  onSelect: (postId: string) => void
}

function formatPostOption(post: ClusterSourcePostOption) {
  const status = post.status === 'published' ? 'published' : 'draft'
  const category = post.category ? ` - ${post.category}` : ''
  return `[${status}] ${post.title}${category}`
}

export function AIClusterSourceSelect({
  clusterSourcePosts,
  clusterSourcePostsError = null,
  selectedClusterPostId,
  selectedClusterPost,
  onSelect,
}: AIClusterSourceSelectProps) {
  return (
    <div className="space-y-3">
      <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
        Artikel Sumber
      </label>
      {clusterSourcePostsError ? (
        <div className="rounded-xl border border-red-100 bg-red-50 p-3 text-xs text-red-600">
          {clusterSourcePostsError}
        </div>
      ) : clusterSourcePosts.length === 0 ? (
        <div className="rounded-xl border border-amber-100 bg-amber-50 p-3 text-xs text-amber-700">
          Belum ada artikel yang bisa dipakai sebagai sumber cluster.
        </div>
      ) : (
        <>
          <select
            value={selectedClusterPostId}
            onChange={(event) => onSelect(event.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition-all focus:border-arkara-amber focus:ring-2 focus:ring-arkara-amber/30"
          >
            <option value="">Pilih artikel sumber...</option>
            {clusterSourcePosts.map((post) => (
              <option key={post.id} value={post.id}>
                {formatPostOption(post)}
              </option>
            ))}
          </select>

          {selectedClusterPost ? (
            <div className="space-y-1.5 rounded-xl border border-arkara-amber/20 bg-arkara-amber/5 p-3 text-xs text-gray-600">
              <div className="flex flex-wrap gap-2">
                <span className="font-bold uppercase text-arkara-green">
                  {selectedClusterPost.status}
                </span>
                {selectedClusterPost.category ? (
                  <span className="text-gray-400">/{selectedClusterPost.category}</span>
                ) : null}
                <span className="text-gray-400">/blog/{selectedClusterPost.slug}</span>
              </div>
              {selectedClusterPost.description ? (
                <p className="leading-relaxed text-gray-500">
                  {selectedClusterPost.description}
                </p>
              ) : null}
            </div>
          ) : null}
        </>
      )}
    </div>
  )
}