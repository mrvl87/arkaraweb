"use client"

import { PanduanForm } from '@/components/panduan-form'
import { updatePanduan } from '@/app/cms/panduan/actions'

interface PanduanFormWrapperProps {
  initialData: any
  panduanId: string
}

export function PanduanFormWrapper({ initialData, panduanId }: PanduanFormWrapperProps) {
  const handleSubmit = async (data: any) => {
    await updatePanduan(panduanId, data)
  }

  return (
    <PanduanForm 
      initialData={initialData} 
      onSubmit={handleSubmit} 
      title="Edit Panduan" 
    />
  )
}
