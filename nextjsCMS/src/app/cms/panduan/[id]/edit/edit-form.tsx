"use client"

import { PanduanForm } from '@/components/panduan-form'
import { updatePanduan } from '@/app/cms/panduan/actions'
import type { FormAIHistoryState } from '@/lib/ai/history'

interface PanduanFormWrapperProps {
  initialData: any
  initialAIState?: FormAIHistoryState
  panduanId: string
}

export function PanduanFormWrapper({ initialData, initialAIState, panduanId }: PanduanFormWrapperProps) {
  const handleSubmit = async (data: any) => {
    await updatePanduan(panduanId, data)
  }

  return (
    <PanduanForm 
      initialData={initialData} 
      initialAIState={initialAIState}
      onSubmit={handleSubmit} 
      title="Edit Panduan" 
    />
  )
}
