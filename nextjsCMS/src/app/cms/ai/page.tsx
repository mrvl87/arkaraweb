import { AIWorkspacePanel } from '@/components/ai/ai-workspace-panel'
import { getClusterSourcePosts } from './actions'
import { Sparkles } from 'lucide-react'
import type { ClusterSourcePostOption } from './actions'

export default async function AIPage() {
  let clusterSourcePosts: ClusterSourcePostOption[] = []
  let clusterSourcePostsError: string | null = null

  try {
    clusterSourcePosts = await getClusterSourcePosts()
  } catch (error) {
    clusterSourcePostsError =
      error instanceof Error ? error.message : 'Gagal memuat daftar artikel.'
  }

  return (
    <div className="space-y-8 pb-20">
      <div className="text-left border-b border-arkara-green/5 pb-6">
        <h1 className="text-3xl font-extrabold flex items-center gap-3 text-arkara-green uppercase tracking-tighter">
          <div className="bg-arkara-amber p-2.5 rounded-2xl shadow-lg shadow-arkara-amber/20">
             <Sparkles className="w-7 h-7 text-arkara-green" />
          </div>
          AI <span className="text-arkara-amber">Workspace</span>
        </h1>
        <p className="text-gray-500 mt-3 font-medium max-w-2xl leading-relaxed text-sm">
           Editorial planning workspace — generate SEO packs, outlines, full drafts, dan ide klaster konten dengan AI.
        </p>
      </div>

      <AIWorkspacePanel
        clusterSourcePosts={clusterSourcePosts}
        clusterSourcePostsError={clusterSourcePostsError}
      />
    </div>
  )
}
