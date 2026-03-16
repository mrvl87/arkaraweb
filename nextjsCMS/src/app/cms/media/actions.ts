"use server"

import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

// Gunakan Service Role Key untuk bypass RLS karena kita menggunakan Mock User saat ini
const getAdminClient = () => {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function getMedia() {
  const supabase = getAdminClient()
  const { data, error } = await supabase
    .from('media')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error("Supabase Error Get Media:", error.message)
    return []
  }
  return data
}

export async function uploadFile(formData: FormData) {
  const supabase = getAdminClient()
  
  // MOCK USER for testing (consistent with Part 2 & 3)
  const authorId = '0a4ff12f-4e6f-46c9-817d-06f3d9e7f1ba'

  const file = formData.get('file') as File
  if (!file) throw new Error('No file provided')

  const fileExt = file.name.split('.').pop()
  const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`
  const filePath = `uploads/${fileName}`

  // 1. Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from('media')
    .upload(filePath, file)

  if (uploadError) throw new Error(uploadError.message)

  // 2. Insert metadata to 'media' table
  const { error: dbError } = await supabase.from('media').insert({
    file_name: file.name,
    file_path: filePath,
    file_type: file.type,
    file_size: file.size,
    uploaded_by: authorId,
  })

  if (dbError) {
    // Cleanup storage if database insert fails
    await supabase.storage.from('media').remove([filePath])
    throw new Error(dbError.message)
  }

  revalidatePath('/cms/media')
  return { success: true }
}

export async function deleteFile(id: string, filePath: string) {
  const supabase = getAdminClient()

  // 1. Delete from Storage
  const { error: storageError } = await supabase.storage
    .from('media')
    .remove([filePath])

  if (storageError) throw new Error(storageError.message)

  // 2. Delete from Database
  const { error: dbError } = await supabase
    .from('media')
    .delete()
    .eq('id', id)

  if (dbError) throw new Error(dbError.message)

  revalidatePath('/cms/media')
}

export async function updateAltText(id: string, altText: string) {
  const supabase = getAdminClient()
  const { error } = await supabase
    .from('media')
    .update({ alt_text: altText })
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/cms/media')
}
