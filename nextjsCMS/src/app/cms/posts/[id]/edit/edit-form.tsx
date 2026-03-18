"use client"

import { PostForm } from '@/components/post-form'
import { updatePost } from '@/app/cms/posts/actions'
import { useRouter } from 'next/navigation'

interface PostFormWrapperProps {
  initialData: any
  postId: string
}

export function PostFormWrapper({ initialData, postId }: PostFormWrapperProps) {
  const router = useRouter()
  
  const handleSubmit = async (data: any) => {
    const res = await updatePost(postId, data)
    if (res?.error) {
       throw new Error(res.error)
    }
    router.push('/cms/posts')
  }

  return (
    <PostForm 
      initialData={initialData} 
      onSubmit={handleSubmit} 
      title="Edit Post" 
    />
  )
}
