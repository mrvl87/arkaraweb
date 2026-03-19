"use server"

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import type { MediaObject } from '@/types/content'

const mediaObjectSchema = z.object({
  url: z.string().url(),
  alt_text: z.string().optional(),
  formats: z.object({
    sm: z.string().optional(),
    md: z.string().optional(),
    lg: z.string().optional(),
    original: z.string().optional(),
  }).optional(),
  aspect_ratio: z.string().optional(),
  dominant_color: z.string().optional(),
  blurhash: z.string().optional(),
}).nullable().optional()

const postSchema = z.object({
  title: z.string().min(1, 'Judul wajib diisi'),
  slug: z.string().min(1, 'Slug wajib diisi'),
  content: z.string().optional().default(''),
  description: z.string().optional(),
  category: z.enum(['air', 'energi', 'pangan', 'medis', 'keamanan', 'komunitas']),
  status: z.enum(['draft', 'published']).default('draft'),
  cover_image: z.string().optional(),
  thumbnail_image: mediaObjectSchema,
  banner_image: mediaObjectSchema,
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
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Unauthorized' }
  const authorId = user.id

  const postData = {
    ...formData,
    author_id: authorId,
    cover_image: formData.cover_image
      || (formData.thumbnail_image as MediaObject)?.url
      || (formData.banner_image as MediaObject)?.url
      || null,
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
    cover_image: formData.cover_image
      || (formData.thumbnail_image as MediaObject)?.url
      || (formData.banner_image as MediaObject)?.url
      || null,
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
