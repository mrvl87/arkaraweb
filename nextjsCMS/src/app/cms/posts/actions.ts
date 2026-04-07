"use server"

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { triggerFrontendRevalidate } from '@/lib/revalidate'
import { notifyGoogleIndexing } from '@/lib/google-indexing'

import type { MediaObject } from '@/types/content'

const SITE_URL = process.env.FRONTEND_SITE_URL || 'https://arkaraweb.com'

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
  id: z.string().uuid().optional(),
  title: z.string().min(1, 'Judul wajib diisi'),
  slug: z.string().min(1, 'Slug wajib diisi'),
  content: z.string().optional().default(''),
  description: z.string().optional(),
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

  const { id: postId, ...restFormData } = formData
  const postData = {
    ...restFormData,
    ...(postId ? { id: postId } : {}),
    author_id: authorId,
    cover_image: restFormData.cover_image
      || (restFormData.thumbnail_image as MediaObject)?.url
      || (restFormData.banner_image as MediaObject)?.url
      || null,
    published_at: restFormData.status === 'published' ? new Date().toISOString() : null,
  }

  const { error } = await supabase.from('posts').insert(postData)

  if (error) {
    return { error: error.message }
  }
  
  revalidatePath('/cms/posts')
  revalidatePath('/cms/dashboard')
  await triggerFrontendRevalidate({ type: 'post', slug: restFormData.slug })

  // Kirim notifikasi ke Google hanya jika konten dipublish
  if (restFormData.status === 'published') {
    notifyGoogleIndexing(`${SITE_URL}/blog/${restFormData.slug}`, 'URL_UPDATED')
  }

  return { success: true }
}

export async function updatePost(id: string, formData: z.infer<typeof postSchema>) {
  const supabase = await createClient()
  
  const { data: existingPost } = await supabase
    .from('posts')
    .select('status, slug')
    .eq('id', id)
    .single()

  const { id: _ignoredId, ...restFormData } = formData
  const postData = {
    ...restFormData,
    cover_image: restFormData.cover_image
      || (restFormData.thumbnail_image as MediaObject)?.url
      || (restFormData.banner_image as MediaObject)?.url
      || null,
    published_at: 
      restFormData.status === 'published' && existingPost?.status !== 'published'
        ? new Date().toISOString()
        : restFormData.status === 'draft' ? null : undefined,
    updated_at: new Date().toISOString(),
  }

  const { error } = await supabase.from('posts').update(postData).eq('id', id)

  if (error) {
    return { error: error.message }
  }
  
  revalidatePath('/cms/posts')
  revalidatePath(`/cms/posts/${id}/edit`)
  revalidatePath('/cms/dashboard')
  await triggerFrontendRevalidate({ type: 'post', slug: restFormData.slug })

  const oldUrl = existingPost?.slug ? `${SITE_URL}/blog/${existingPost.slug}` : null
  const newUrl = `${SITE_URL}/blog/${restFormData.slug}`

  if (existingPost?.status === 'published' && oldUrl && (restFormData.status !== 'published' || existingPost.slug !== restFormData.slug)) {
    notifyGoogleIndexing(oldUrl, 'URL_DELETED')
  }

  if (restFormData.status === 'published') {
    notifyGoogleIndexing(newUrl, 'URL_UPDATED')
  }

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
  await triggerFrontendRevalidate({ type: 'post' })

  // Catatan: deletePost dipanggil tanpa slug, tidak bisa notify Google per-URL
  // Gunakan bulk-index.js untuk membersihkan URL yang dihapus jika diperlukan

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
  await triggerFrontendRevalidate({ type: 'post' })
  return { success: true }
}

/**
 * Toggle status dan notifikasi Google sesuai status baru.
 * Dipanggil dari list page — perlu slug jadi kita fetch dulu dari DB.
 */
export async function togglePostStatusAndIndex(id: string, currentStatus: 'draft' | 'published', slug: string) {
  const result = await togglePostStatus(id, currentStatus)
  if (result?.error) return result

  const newStatus = currentStatus === 'published' ? 'draft' : 'published'
  if (newStatus === 'published') {
    notifyGoogleIndexing(`${SITE_URL}/blog/${slug}`, 'URL_UPDATED')
  }

  return result
}
