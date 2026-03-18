"use server"

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const postSchema = z.object({
  title: z.string().min(1, 'Judul wajib diisi'),
  slug: z.string().min(1, 'Slug wajib diisi'),
  content: z.string().optional().default(''),
  description: z.string().optional(),
  category: z.enum(['air', 'energi', 'pangan', 'medis', 'keamanan', 'komunitas']),
  status: z.enum(['draft', 'published']).default('draft'),
  cover_image: z.string().optional(),
  thumbnail_image: z.any().optional(),
  banner_image: z.any().optional(),
  meta_title: z.string().optional(),
  meta_desc: z.string().optional(),
})

export async function getPosts() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data
}

export async function createPost(formData: z.infer<typeof postSchema>) {
  const supabase = await createClient()
  
  // const { data: userData } = await supabase.auth.getUser()
  // if (!userData.user) throw new Error('Unauthorized')
  const authorId = '0a4ff12f-4e6f-46c9-817d-06f3d9e7f1ba'

  const postData = {
    ...formData,
    author_id: authorId,
    published_at: formData.status === 'published' ? new Date().toISOString() : null,
  }

  const { error } = await supabase.from('posts').insert(postData)

  if (error) {
    return { error: error.message }
  }
  
  revalidatePath('/cms/posts')
  revalidatePath('/cms/dashboard')
  return { success: true }
}

export async function updatePost(id: string, formData: z.infer<typeof postSchema>) {
  const supabase = await createClient()
  
  const { data: existingPost } = await supabase
    .from('posts')
    .select('status')
    .eq('id', id)
    .single()

  const postData = {
    ...formData,
    published_at: 
      formData.status === 'published' && existingPost?.status !== 'published'
        ? new Date().toISOString()
        : formData.status === 'draft' ? null : undefined,
    updated_at: new Date().toISOString(),
  }

  const { error } = await supabase.from('posts').update(postData).eq('id', id)

  if (error) {
    return { error: error.message }
  }
  
  revalidatePath('/cms/posts')
  revalidatePath(`/cms/posts/${id}/edit`)
  revalidatePath('/cms/dashboard')
  return { success: true }
}

export async function deletePost(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('posts').delete().eq('id', id)

  if (error) {
    return { error: error.message }
  }
  
  revalidatePath('/cms/posts')
  revalidatePath('/cms/dashboard')
  return { success: true }
}

export async function togglePostStatus(id: string, currentStatus: 'draft' | 'published') {
  const supabase = await createClient()
  const newStatus = currentStatus === 'published' ? 'draft' : 'published'
  
  const { error } = await supabase
    .from('posts')
    .update({ 
      status: newStatus,
      published_at: newStatus === 'published' ? new Date().toISOString() : null,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }
  
  revalidatePath('/cms/posts')
  revalidatePath('/cms/dashboard')
  return { success: true }
}
