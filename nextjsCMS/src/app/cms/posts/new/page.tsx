"use client"

import { PostForm } from '@/components/post-form'
import { createPost } from '@/app/cms/posts/actions'
import { useRouter } from 'next/navigation'

export default function NewPostPage() {
  const router = useRouter()
  
  const handleSubmit = async (data: any) => {
    const res = await createPost(data)
    if (res?.error) {
       throw new Error(res.error)
    }
    router.push('/cms/posts')
  }

  return (
    <div className="max-w-6xl mx-auto">
      <PostForm 
        onSubmit={handleSubmit} 
        title="Buat Post Baru" 
      />
    </div>
  )
}
