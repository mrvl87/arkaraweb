"use server"

import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import sharp from 'sharp'

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
  const contextName = formData.get('contextName') as string || ''
  
  if (!file) throw new Error('No file provided')

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  
  let finalBuffer = buffer
  let fileExt = file.name.split('.').pop() || 'tmp'
  let mimeType = file.type
  let isImage = mimeType.startsWith('image/')
  let baseName = contextName.trim() ? contextName.trim().replace(/\s+/g, '-').toLowerCase() : Math.random().toString(36).substring(2)
  let fileName = `${baseName}-${Date.now()}`
  
  let formatsObj: Record<string, string> = {}
  let dominantColor = ''
  let blurhash = ''
  let aspectRatio = ''
  let fileSize = file.size
  
  // 1. Image Processing Pipeline
  if (isImage && !mimeType.includes('svg')) {
    try {
      const image = sharp(buffer)
      const metadata = await image.metadata()
      
      if (metadata.width && metadata.height) {
        aspectRatio = `${metadata.width}:${metadata.height}`
        
        // Generate tiny placeholder (blurhash alternative)
        const tinyBuffer = await image.clone().resize(10, 10, { fit: 'inside' }).webp({ quality: 20 }).toBuffer()
        blurhash = `data:image/webp;base64,${tinyBuffer.toString('base64')}`
        
        // Dominant color
        const stats = await image.stats()
        const { r, g, b } = stats.dominant
        dominantColor = `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1)}`
        
        // Settings for formats
        const sizes = [
          { name: 'sm', width: 400 },
          { name: 'md', width: 800 },
          { name: 'lg', width: 1200 }
        ]
        
        for (const size of sizes) {
          if (metadata.width >= size.width) {
            const sizeBuffer = await image.clone().resize({ width: size.width, withoutEnlargement: true }).webp({ quality: 80 }).toBuffer()
            const sizePath = `uploads/${fileName}-${size.name}.webp`
            
            await supabase.storage.from('media').upload(sizePath, sizeBuffer, { contentType: 'image/webp' })
            const { data } = supabase.storage.from('media').getPublicUrl(sizePath)
            formatsObj[size.name] = data.publicUrl
          }
        }
      }
      
      // Convert main image to webp
      finalBuffer = (await image.clone().webp({ quality: 80 }).toBuffer()) as any
      fileExt = 'webp'
      mimeType = 'image/webp'
      fileSize = finalBuffer.length
      fileName = `${fileName}.webp`
    } catch (err) {
      console.error('Error processing image:', err)
      // Fallback
      fileName = `${fileName}.${fileExt}`
    }
  } else {
    fileName = `${fileName}.${fileExt}`
  }

  const filePath = `uploads/${fileName}`

  // 2. Upload main file to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from('media')
    .upload(filePath, finalBuffer, { contentType: mimeType })

  if (uploadError) throw new Error(uploadError.message)
  
  const { data: publicUrlData } = supabase.storage.from('media').getPublicUrl(filePath)
  
  if (Object.keys(formatsObj).length > 0) {
      formatsObj['original'] = publicUrlData.publicUrl
  }

  // 3. Insert metadata to 'media' table
  const altText = contextName.trim() || file.name
  
  const { error: dbError } = await supabase.from('media').insert({
    file_name: fileName,
    file_path: publicUrlData.publicUrl, // Store full public URL for easier access
    file_type: mimeType,
    file_size: fileSize,
    alt_text: altText,
    uploaded_by: authorId,
    formats: formatsObj,
    dominant_color: dominantColor || null,
    blurhash: blurhash || null,
    aspect_ratio: aspectRatio || null
  })

  if (dbError) {
    // Cleanup main file
    await supabase.storage.from('media').remove([filePath])
    throw new Error(dbError.message)
  }

  revalidatePath('/cms/media')
  return { success: true }
}

export async function deleteFile(id: string, filePath: string) {
  const supabase = getAdminClient()

  // 1. Get the media item first to check formats
  const { data: media } = await supabase.from('media').select('formats, file_path').eq('id', id).single()

  // 2. Extract relative path from public URL if necessary
  // Typically file_path is full URL now, so we need to extract 'uploads/...'
  const getRelativePath = (url: string) => {
      try {
          const parts = url.split('/media/')
          return parts[1] ? parts[1] : null
      } catch (e) {
          return url
      }
  }
  
  const pathsToDelete: string[] = []
  
  if (media) {
      const mainRelative = getRelativePath(media.file_path)
      if (mainRelative) pathsToDelete.push(mainRelative)
      
      if (media.formats) {
          Object.values(media.formats).forEach((url: any) => {
              const rel = getRelativePath(url)
              if (rel) pathsToDelete.push(rel)
          })
      }
  } else {
      pathsToDelete.push(filePath)
  }

  // 3. Delete from Storage
  const { error: storageError } = await supabase.storage
    .from('media')
    .remove(pathsToDelete)

  if (storageError) console.error("Storage delete errors:", storageError.message)

  // 4. Delete from Database
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
