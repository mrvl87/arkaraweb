"use server"

import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { DeleteObjectsCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { revalidatePath } from 'next/cache'

const DEFAULT_PUBLIC_MEDIA_BASE = 'https://media.arkaraweb.com'
const SUPABASE_MEDIA_PATH = '/storage/v1/object/public/media/'
const R2_BUCKET =
  process.env.R2_BUCKET || process.env.CLOUDFLARE_R2_BUCKET || 'arkara-media'

let r2Client: S3Client | null = null
type SharpModule = typeof import('sharp')

let sharpLoader: Promise<SharpModule> | null = null

const getAdminClient = () => {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('MISSING_ENV: NEXT_PUBLIC_SUPABASE_URL atau SUPABASE_SERVICE_ROLE_KEY tidak ditemukan di environment. Pastikan Anda telah memasukkannya di panel variabel Railway.')
  }
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}

function getPublicMediaBase() {
  return (
    process.env.MEDIA_PUBLIC_URL ||
    process.env.NEXT_PUBLIC_MEDIA_PUBLIC_URL ||
    DEFAULT_PUBLIC_MEDIA_BASE
  ).replace(/\/+$/, '')
}

function getR2Endpoint() {
  const endpoint = process.env.R2_ENDPOINT || process.env.CLOUDFLARE_R2_ENDPOINT
  if (endpoint) return endpoint.replace(/\/+$/, '')

  const accountId = process.env.R2_ACCOUNT_ID || process.env.CLOUDFLARE_ACCOUNT_ID
  if (accountId) return `https://${accountId}.r2.cloudflarestorage.com`

  throw new Error('MISSING_ENV: R2_ENDPOINT atau R2_ACCOUNT_ID belum dikonfigurasi untuk upload Cloudflare R2.')
}

function getR2Client() {
  if (r2Client) return r2Client

  const accessKeyId =
    process.env.R2_ACCESS_KEY_ID ||
    process.env.CLOUDFLARE_R2_ACCESS_KEY_ID ||
    process.env.AWS_ACCESS_KEY_ID
  const secretAccessKey =
    process.env.R2_SECRET_ACCESS_KEY ||
    process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY ||
    process.env.AWS_SECRET_ACCESS_KEY

  if (!accessKeyId || !secretAccessKey) {
    throw new Error('MISSING_ENV: R2_ACCESS_KEY_ID dan R2_SECRET_ACCESS_KEY belum dikonfigurasi untuk upload Cloudflare R2.')
  }

  r2Client = new S3Client({
    region: 'auto',
    endpoint: getR2Endpoint(),
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
    forcePathStyle: true,
  })

  return r2Client
}

function getPublicMediaUrl(key: string) {
  const encodedKey = key
    .replace(/^\/+/, '')
    .split('/')
    .map((segment) => encodeURIComponent(decodeURIComponent(segment)))
    .join('/')

  return `${getPublicMediaBase()}/${encodedKey}`
}

async function getSharp() {
  if (!sharpLoader) {
    sharpLoader = import('sharp').then((module) => {
      const resolved = (module as { default?: SharpModule }).default
      return resolved ?? (module as unknown as SharpModule)
    })
  }

  try {
    return await sharpLoader
  } catch (error) {
    sharpLoader = null
    throw error
  }
}

function getExtensionFromMimeType(mimeType: string) {
  const normalized = mimeType.toLowerCase()

  switch (normalized) {
    case 'image/jpeg':
    case 'image/jpg':
      return 'jpg'
    case 'image/png':
      return 'png'
    case 'image/webp':
      return 'webp'
    case 'image/gif':
      return 'gif'
    case 'image/avif':
      return 'avif'
    case 'image/svg+xml':
      return 'svg'
    default:
      return 'bin'
  }
}

async function uploadR2Object(
  key: string,
  body: Buffer,
  contentType: string,
  cacheSeconds = 31536000
) {
  await getR2Client().send(new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
    Body: body,
    ContentType: contentType,
    CacheControl: cacheSeconds >= 31536000
      ? `public, max-age=${cacheSeconds}, immutable`
      : `public, max-age=${cacheSeconds}`,
  }))
}

async function deleteR2Objects(keys: string[]) {
  const uniqueKeys = [...new Set(keys.map((key) => key.replace(/^\/+/, '')).filter(Boolean))]
  if (uniqueKeys.length === 0) return

  await getR2Client().send(new DeleteObjectsCommand({
    Bucket: R2_BUCKET,
    Delete: {
      Objects: uniqueKeys.map((Key) => ({ Key })),
      Quiet: true,
    },
  }))
}

function getR2ObjectKey(value: string | null | undefined) {
  if (!value || value === 'true') return null

  try {
    const url = new URL(value)
    const mediaHost = new URL(getPublicMediaBase()).hostname

    if (url.hostname === mediaHost) {
      return decodeURIComponent(url.pathname.replace(/^\/+/, ''))
    }

    const supabasePathIndex = url.pathname.indexOf(SUPABASE_MEDIA_PATH)
    if (url.hostname.endsWith('.supabase.co') && supabasePathIndex >= 0) {
      return decodeURIComponent(url.pathname.slice(supabasePathIndex + SUPABASE_MEDIA_PATH.length))
    }

    return null
  } catch {
    return value.replace(/^\/+/, '')
  }
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
  let baseName = sanitizeBaseName(contextName) || Math.random().toString(36).substring(2);
  let fileName = `${baseName}-${Date.now()}`;
  
  let formatsObj: Record<string, string> = {};
  let dominantColor = '';
  let blurhash = '';
  let aspectRatio = '';
  let fileSize = buffer.length;
  const uploadedPaths: string[] = [];
  
  if (isImage && !mimeType.includes('svg')) {
    try {
      const sharp = await getSharp()
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
            
            await uploadR2Object(sizePath, sizeBuffer, 'image/webp');
            uploadedPaths.push(sizePath);
            formatsObj[size.name] = getPublicMediaUrl(sizePath);
          }
        }
      }
      
      finalBuffer = (await image.clone().webp({ quality: 80 }).toBuffer()) as any;
      fileExt = 'webp';
      mimeType = 'image/webp';
      fileSize = finalBuffer.length;
      fileName = `${fileName}.webp`;
    } catch (err) {
      console.error('Error processing image with sharp, fallback to original asset:', err);
      // Fallback
      fileName = `${fileName}.${fileExt}`;
    }
  } else {
    fileName = `${fileName}.${fileExt}`;
  }

  const filePath = `uploads/${fileName}`;

  await uploadR2Object(filePath, finalBuffer, mimeType);
  uploadedPaths.push(filePath);
  const publicUrl = getPublicMediaUrl(filePath);
  
  if (Object.keys(formatsObj).length > 0) {
      formatsObj['original'] = publicUrl;
  }

  const altText = contextName.trim() || originalName;
  
  const { error: dbError } = await supabase.from('media').insert({
    file_name: fileName,
    file_path: publicUrl,
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
    try {
      await deleteR2Objects(uploadedPaths);
    } catch (error) {
      console.error('Failed to roll back R2 uploads after database insert error:', error);
    }
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

  try {
    const sharp = await getSharp()
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
  } catch (error) {
    console.error('Failed to optimize temporary reference image with sharp, using original file:', error)

    return {
      buffer,
      mimeType,
      extension: getExtensionFromMimeType(mimeType),
    }
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

  await uploadR2Object(objectPath, optimized.buffer, optimized.mimeType, 3600)

  return {
    bucket: R2_BUCKET,
    path: objectPath,
    publicUrl: getPublicMediaUrl(objectPath),
    mimeType: optimized.mimeType,
    size: optimized.buffer.length,
  }
}

export async function removeTemporaryReferenceImage(path: string) {
  if (!path) return

  const key = getR2ObjectKey(path)
  if (!key) return

  try {
    await deleteR2Objects([key])
  } catch (error) {
    console.error('Failed to remove temporary reference image:', error)
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

  const pathsToDelete: string[] = []
  
  if (media) {
      const mainRelative = getR2ObjectKey(media.file_path)
      if (mainRelative) pathsToDelete.push(mainRelative)
      
      if (media.formats) {
          Object.values(media.formats).forEach((url: any) => {
              if (typeof url !== 'string') return
              const rel = getR2ObjectKey(url)
              if (rel) pathsToDelete.push(rel)
          })
      }
  } else {
      const fallbackKey = getR2ObjectKey(filePath)
      if (fallbackKey) pathsToDelete.push(fallbackKey)
  }

  // 3. Delete from R2
  try {
    await deleteR2Objects(pathsToDelete)
  } catch (error) {
    console.error("R2 delete errors:", error)
  }

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
