import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getFormAIHistoryState } from '@/lib/ai/history'
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

  const initialAIState = await getFormAIHistoryState('panduan', id, {
    fallbackTitle: panduan.title,
    fallbackCreatedAt: panduan.created_at,
  })

  return (
    <div className="max-w-6xl mx-auto">
      <PanduanFormWrapper initialData={panduan} initialAIState={initialAIState} panduanId={id} />
    </div>
  )
}
