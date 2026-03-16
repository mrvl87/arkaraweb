import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PanduanFormWrapper } from './edit-form'

interface EditPanduanPageProps {
  params: Promise<{ id: string }>
}

export default async function EditPanduanPage({ params }: EditPanduanPageProps) {
  const { id } = await params
  const supabase = await createClient()
  
  const { data: panduan, error } = await supabase
    .from('panduan')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !panduan) {
    notFound()
  }

  return (
    <div className="max-w-6xl mx-auto">
      <PanduanFormWrapper initialData={panduan} panduanId={id} />
    </div>
  )
}
