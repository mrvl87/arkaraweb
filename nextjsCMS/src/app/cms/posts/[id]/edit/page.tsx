import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PostFormWrapper } from './edit-form'

interface EditPostPageProps {
  params: Promise<{ id: string }>
}

export default async function EditPostPage({ params }: EditPostPageProps) {
  const { id } = await params
  const supabase = await createClient()
  
  const { data: post, error } = await supabase
    .from('posts')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !post) {
    notFound()
  }

  return (
    <div className="max-w-6xl mx-auto">
      <PostFormWrapper initialData={post} postId={id} />
    </div>
  )
}
