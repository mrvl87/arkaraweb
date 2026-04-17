"use server"

import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import sharp from 'sharp'

const MEDIA_BUCKET = 'media'
const TEMP_MEDIA_BUCKET = process.env.CMS_TEMP_MEDIA_BUCKET || 'media-ai-temp'

const getAdminClient = () => {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('MISSING_ENV: NEXT_PUBLIC_SUPABASE_URL atau SUPABASE_SERVICE_ROLE_KEY tidak ditemukan di environment. Pastikan Anda telah memasukkannya di panel variabel Railway.')
  }
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
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

export async function processAndUploadImage({
  buffer,
  originalName,
  mimeType,
  contextName,
  authorId
}: {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
  contextName: string;
  authorId: string;
}) {
  const supabase = getAdminClient();
  
  let finalBuffer = buffer;
  let fileExt = originalName.split('.').pop() || 'tmp';
  let isImage = mimeType.startsWith('image/');
  let baseName = contextName.trim() ? contextName.trim().replace(/\s+/g, '-').toLowerCase() : Math.random().toString(36).substring(2);
  let fileName = `${baseName}-${Date.now()}`;
  
  let formatsObj: Record<string, string> = {};
  let dominantColor = '';
  let blurhash = '';
  let aspectRatio = '';
  let fileSize = buffer.length;
  
  if (isImage && !mimeType.includes('svg')) {
    try {
      const image = sharp(buffer);
      const metadata = await image.metadata();
      
      const hasAlpha = metadata.hasAlpha ?? false;
      if (hasAlpha) {
        formatsObj['has_alpha'] = 'true';
      }
      
      if (metadata.width && metadata.height) {
        aspectRatio = `${metadata.width}:${metadata.height}`;
        
        const tinyBuffer = await image.clone().resize(10, 10, { fit: 'inside' }).webp({ quality: 20 }).toBuffer();
        blurhash = `data:image/webp;base64,${tinyBuffer.toString('base64')}`;
        
        const stats = await image.stats();
        const { r, g, b } = stats.dominant;
        dominantColor = `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1)}`;
        
        const sizes = [
          { name: 'sm', width: 400 },
          { name: 'md', width: 800 },
          { name: 'lg', width: 1200 }
        ];
        
        for (const size of sizes) {
          if (metadata.width >= size.width) {
            const sizeBuffer = await image.clone().resize({ width: size.width, withoutEnlargement: true }).webp({ quality: 80 }).toBuffer();
            const sizePath = `uploads/${fileName}-${size.name}.webp`;
            
            await supabase.storage.from(MEDIA_BUCKET).upload(sizePath, sizeBuffer, { 
              contentType: 'image/webp',
              cacheControl: '31536000'
            });
            const { data } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(sizePath);
            formatsObj[size.name] = data.publicUrl;
          }
        }
      }
      
      finalBuffer = (await image.clone().webp({ quality: 80 }).toBuffer()) as any;
      fileExt = 'webp';
      mimeType = 'image/webp';
      fileSize = finalBuffer.length;
      fileName = `${fileName}.webp`;
    } catch (err) {
      console.error('Error processing image:', err);
      // Fallback
      fileName = `${fileName}.${fileExt}`;
    }
  } else {
    fileName = `${fileName}.${fileExt}`;
  }

  const filePath = `uploads/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from(MEDIA_BUCKET)
    .upload(filePath, finalBuffer, { 
      contentType: mimeType,
      cacheControl: '31536000'
    });

  if (uploadError) throw new Error(uploadError.message);
  
  const { data: publicUrlData } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(filePath);
  
  if (Object.keys(formatsObj).length > 0) {
      formatsObj['original'] = publicUrlData.publicUrl;
  }

  const altText = contextName.trim() || originalName;
  
  const { error: dbError } = await supabase.from('media').insert({
    file_name: fileName,
    file_path: publicUrlData.publicUrl,
    file_type: mimeType,
    file_size: fileSize,
    alt_text: altText,
    uploaded_by: authorId,
    formats: formatsObj,
    dominant_color: dominantColor || null,
    blurhash: blurhash || null,
    aspect_ratio: aspectRatio || null
  });

  if (dbError) {
    await supabase.storage.from(MEDIA_BUCKET).remove([filePath]);
    throw new Error(dbError.message);
  }
}

async function optimizeTemporaryReferenceImage(buffer: Buffer, mimeType: string) {
  if (!mimeType.startsWith('image/')) {
    throw new Error('Reference image harus berupa file gambar.')
  }

  if (mimeType.includes('svg')) {
    return {
      buffer,
      mimeType,
      extension: 'svg',
    }
  }

  const image = sharp(buffer)
  const metadata = await image.metadata()
  const resized = image.resize({
    width: metadata.width && metadata.width > 1024 ? 1024 : undefined,
    height: metadata.height && metadata.height > 1024 ? 1024 : undefined,
    fit: 'inside',
    withoutEnlargement: true,
  })

  const hasAlpha = metadata.hasAlpha ?? false
  if (hasAlpha) {
    return {
      buffer: await resized.webp({ quality: 72, alphaQuality: 72 }).toBuffer(),
      mimeType: 'image/webp',
      extension: 'webp',
    }
  }

  return {
    buffer: await resized.jpeg({ quality: 78, mozjpeg: true }).toBuffer(),
    mimeType: 'image/jpeg',
    extension: 'jpg',
  }
}

function sanitizeBaseName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export async function uploadTemporaryReferenceImage(formData: FormData) {
  const supabase = getAdminClient()
  const file = formData.get('file') as File | null

  if (!file) {
    throw new Error('No reference image provided.')
  }

  if (!file.type.startsWith('image/')) {
    throw new Error('Reference image harus berupa file gambar.')
  }

  const arrayBuffer = await file.arrayBuffer()
  const originalBuffer = Buffer.from(arrayBuffer)
  const optimized = await optimizeTemporaryReferenceImage(originalBuffer, file.type)
  const baseName = sanitizeBaseName(file.name.replace(/\.[^.]+$/, '')) || 'reference'
  const objectPath = `references/${baseName}-${Date.now()}.${optimized.extension}`

  const { error: uploadError } = await supabase.storage
    .from(TEMP_MEDIA_BUCKET)
    .upload(objectPath, optimized.buffer, {
      contentType: optimized.mimeType,
      cacheControl: '3600',
      upsert: false,
    })

  if (uploadError) {
    throw new Error(
      uploadError.message.includes('Bucket not found')
        ? `Bucket ${TEMP_MEDIA_BUCKET} belum tersedia. Buat bucket ini di Supabase untuk menyimpan reference image sementara.`
        : uploadError.message
    )
  }

  const { data } = supabase.storage.from(TEMP_MEDIA_BUCKET).getPublicUrl(objectPath)

  return {
    bucket: TEMP_MEDIA_BUCKET,
    path: objectPath,
    publicUrl: data.publicUrl,
    mimeType: optimized.mimeType,
    size: optimized.buffer.length,
  }
}

export async function removeTemporaryReferenceImage(path: string) {
  if (!path) return

  const supabase = getAdminClient()
  const { error } = await supabase.storage.from(TEMP_MEDIA_BUCKET).remove([path])
  if (error) {
    console.error('Failed to remove temporary reference image:', error.message)
  }
}

export async function uploadFile(formData: FormData) {
  const authorId = process.env.CMS_SERVICE_AUTHOR_ID;
  if (!authorId) throw new Error('CMS_SERVICE_AUTHOR_ID not configured');

  const file = formData.get('file') as File;
  const contextName = formData.get('contextName') as string || '';
  
  if (!file) throw new Error('No file provided');

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  
  await processAndUploadImage({
    buffer,
    originalName: file.name,
    mimeType: file.type,
    contextName,
    authorId
  });

  revalidatePath('/cms/media');
  return { success: true };
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
    .from(MEDIA_BUCKET)
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
