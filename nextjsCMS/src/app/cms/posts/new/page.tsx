"use client"

import { PostForm } from '@/components/post-form'
import { createPost } from '@/app/cms/posts/actions'

export default function NewPostPage() {
  const handleSubmit = async (data: any) => {
    await createPost(data)
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
