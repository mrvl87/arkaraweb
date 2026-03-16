"use client"

import { PostForm } from '@/components/post-form'
import { updatePost } from '@/app/cms/posts/actions'

interface PostFormWrapperProps {
  initialData: any
  postId: string
}

export function PostFormWrapper({ initialData, postId }: PostFormWrapperProps) {
  const handleSubmit = async (data: any) => {
    await updatePost(postId, data)
  }

  return (
    <PostForm 
      initialData={initialData} 
      onSubmit={handleSubmit} 
      title="Edit Post" 
    />
  )
}
