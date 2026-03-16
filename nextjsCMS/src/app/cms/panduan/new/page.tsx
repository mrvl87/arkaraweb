"use client"

import { PanduanForm } from '@/components/panduan-form'
import { createPanduan } from '@/app/cms/panduan/actions'

export default function NewPanduanPage() {
  const handleSubmit = async (data: any) => {
    await createPanduan(data)
  }

  return (
    <div className="max-w-6xl mx-auto">
      <PanduanForm 
        onSubmit={handleSubmit} 
        title="Buat Panduan Baru" 
      />
    </div>
  )
}
