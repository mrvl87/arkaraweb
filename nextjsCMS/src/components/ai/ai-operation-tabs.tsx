"use client"

import { FileText, Image as ImageIcon, Lightbulb, List, Search, ShieldCheck, Sparkles, Zap } from 'lucide-react'
import type { AIWorkspaceTargetType } from '@/app/cms/ai/actions'
import type { WorkspaceOperation } from './use-ai-workspace'

export interface OperationDef {
  id: WorkspaceOperation
  label: string
  description: string
  icon: typeof Sparkles
  color: string
}

export const AI_WORKSPACE_OPERATIONS: OperationDef[] = [
  {
    id: 'seo_pack',
    label: 'SEO Pack',
    description: 'Meta title, description, excerpt, dan keywords',
    icon: Search,
    color: 'text-blue-500',
  },
  {
    id: 'outline',
    label: 'Outline',
    description: 'Kerangka artikel terstruktur',
    icon: List,
    color: 'text-emerald-500',
  },
  {
    id: 'full_draft',
    label: 'Full Draft',
    description: 'Artikel lengkap dari brief',
    icon: FileText,
    color: 'text-purple-500',
  },
  {
    id: 'cluster_ideas',
    label: 'Cluster Ideas',
    description: 'Ide konten dari artikel sumber',
    icon: Lightbulb,
    color: 'text-amber-500',
  },
  {
    id: 'verify_latest_facts',
    label: 'Verify Latest Facts',
    description: 'Cek klaim yang perlu update atau verifikasi web',
    icon: ShieldCheck,
    color: 'text-cyan-500',
  },
  {
    id: 'image_prompts',
    label: 'Image Prompts',
    description: 'Arahan visual dan prompt hero image',
    icon: ImageIcon,
    color: 'text-rose-500',
  },
]

const PROFILE_OPTIONS: Array<{ value: AIWorkspaceTargetType; label: string; description: string }> = [
  { value: 'workspace', label: 'Workspace', description: 'Profil umum, sama seperti behavior lama' },
  { value: 'post', label: 'Post', description: 'Arahkan output sebagai blog post editorial' },
  { value: 'panduan', label: 'Panduan', description: 'Arahkan output sebagai panduan teknis' },
]

interface AIOperationTabsProps {
  activeOp: WorkspaceOperation
  targetType: AIWorkspaceTargetType
  onSelectOperation: (operation: WorkspaceOperation) => void
  onSelectTargetType: (targetType: AIWorkspaceTargetType) => void
  isProfileDisabled?: boolean
}

export function AIOperationTabs({
  activeOp,
  targetType,
  onSelectOperation,
  onSelectTargetType,
  isProfileDisabled = false,
}: AIOperationTabsProps) {
  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Content profile</p>
          <p className="mt-1 text-sm font-semibold text-gray-600">
            Pilih konteks gaya output tanpa mengubah operasi AI inti.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {PROFILE_OPTIONS.map((profile) => {
            const isActive = targetType === profile.value

            return (
              <button
                key={profile.value}
                type="button"
                onClick={() => onSelectTargetType(profile.value)}
                disabled={isProfileDisabled}
                className={`rounded-xl border px-3 py-2 text-left transition-all ${
                  isActive
                    ? 'border-arkara-amber bg-arkara-amber/10 text-arkara-green shadow-sm'
                    : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-arkara-amber/40 hover:bg-white'
                }`}
                title={profile.description}
              >
                <span className="block text-xs font-black uppercase tracking-wide">{profile.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {AI_WORKSPACE_OPERATIONS.map((operation) => {
          const Icon = operation.icon
          const isActive = activeOp === operation.id

          return (
            <button
              key={operation.id}
              type="button"
              onClick={() => onSelectOperation(operation.id)}
              className={`group relative rounded-2xl border-2 p-4 text-left transition-all ${
                isActive
                  ? 'border-arkara-amber bg-arkara-amber/5 shadow-md shadow-arkara-amber/10'
                  : 'border-gray-100 bg-white hover:border-arkara-amber/30 hover:shadow-sm'
              }`}
            >
              <div className="mb-2 flex items-center gap-3">
                <div
                  className={`rounded-xl p-2 transition-colors ${
                    isActive ? 'bg-arkara-amber/20' : 'bg-gray-50 group-hover:bg-arkara-amber/10'
                  }`}
                >
                  <Icon className={`h-5 w-5 ${isActive ? 'text-arkara-amber' : operation.color}`} />
                </div>
                <span className={`text-sm font-bold ${isActive ? 'text-arkara-green' : 'text-gray-700'}`}>
                  {operation.label}
                </span>
              </div>
              <p className="text-[11px] leading-snug text-gray-400">{operation.description}</p>
              {isActive ? (
                <div className="absolute right-2 top-2">
                  <Zap className="h-4 w-4 fill-arkara-amber text-arkara-amber" />
                </div>
              ) : null}
            </button>
          )
        })}
      </div>
    </div>
  )
}