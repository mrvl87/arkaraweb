"use server"

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const panduanSchema = z.object({
  title: z.string().min(1, 'Judul wajib diisi'),
  slug: z.string().min(1, 'Slug wajib diisi'),
  content: z.string().optional().default(''),
  bab_ref: z.string().optional(),
  qr_slug: z.string().optional(),
  cover_image: z.string().optional(),
  meta_title: z.string().optional(),
  meta_desc: z.string().optional(),
  status: z.enum(['draft', 'published']).default('draft'),
})

export async function getPanduan() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('panduan')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data
}

export async function createPanduan(formData: z.infer<typeof panduanSchema>) {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('Unauthorized')
  const authorId = user.id

  const data = {
    ...formData,
    author_id: authorId,
    published_at: formData.status === 'published' ? new Date().toISOString() : null,
  }

  const { error } = await supabase.from('panduan').insert(data)

  if (error) throw new Error(error.message)
  
  revalidatePath('/cms/panduan')
  revalidatePath('/cms/dashboard')
}

export async function updatePanduan(id: string, formData: z.infer<typeof panduanSchema>) {
  const supabase = await createClient()
  
  const { data: existing } = await supabase
    .from('panduan')
    .select('status')
    .eq('id', id)
    .single()

  const data = {
    ...formData,
    published_at: 
      formData.status === 'published' && existing?.status !== 'published'
        ? new Date().toISOString()
        : formData.status === 'draft' ? null : undefined,
    updated_at: new Date().toISOString(),
  }

  const { error } = await supabase.from('panduan').update(data).eq('id', id)

  if (error) throw new Error(error.message)
  
  revalidatePath('/cms/panduan')
  revalidatePath(`/cms/panduan/${id}/edit`)
  revalidatePath('/cms/dashboard')
}

export async function deletePanduan(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('panduan').delete().eq('id', id)

  if (error) throw new Error(error.message)
  
  revalidatePath('/cms/panduan')
  revalidatePath('/cms/dashboard')
}

export async function togglePanduanStatus(id: string, currentStatus: 'draft' | 'published') {
  const supabase = await createClient()
  const newStatus = currentStatus === 'published' ? 'draft' : 'published'
  
  const { error } = await supabase
    .from('panduan')
    .update({ 
      status: newStatus,
      published_at: newStatus === 'published' ? new Date().toISOString() : null,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)

  if (error) throw new Error(error.message)
  
  revalidatePath('/cms/panduan')
  revalidatePath('/cms/dashboard')
}
