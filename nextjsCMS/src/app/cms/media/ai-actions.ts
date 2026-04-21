"use server"

import { processAndUploadImage, removeTemporaryReferenceImage } from './actions'
import { revalidatePath } from 'next/cache'

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const AUTHOR_ID = process.env.CMS_SERVICE_AUTHOR_ID;
const IMAGE_MODEL = 'google/gemini-3.1-flash-image-preview'
const OPENROUTER_TIMEOUT_MS = 90000
const OPENROUTER_MAX_RETRIES = 2

export type AIImageGenerationMode = 'illustration' | 'technical'

interface TechnicalReferenceImage {
  publicUrl: string
  path?: string
}

interface GenerateAIImageOptions {
  prompt: string
  contextName: string
  mode?: AIImageGenerationMode
  referenceImage?: TechnicalReferenceImage | null
}

function isRetryableOpenRouterError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false
  }

  const message = error.message.toLowerCase()

  return (
    message.includes('econnreset') ||
    message.includes('terminated') ||
    message.includes('network') ||
    message.includes('fetch failed') ||
    message.includes('timeout') ||
    message.includes('timed out')
  )
}

async function fetchOpenRouter(input: RequestInfo | URL, init: RequestInit): Promise<Response> {
  let attempt = 0
  let lastError: unknown

  while (attempt <= OPENROUTER_MAX_RETRIES) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), OPENROUTER_TIMEOUT_MS)

    try {
      return await fetch(input, {
        cache: 'no-store',
        ...init,
        signal: controller.signal,
      })
    } catch (error) {
      lastError = error

      if (!isRetryableOpenRouterError(error) || attempt === OPENROUTER_MAX_RETRIES) {
        throw error
      }
    } finally {
      clearTimeout(timeout)
    }

    attempt += 1
    await new Promise((resolve) => setTimeout(resolve, 750 * attempt))
  }

  throw lastError instanceof Error
    ? lastError
    : new Error('OpenRouter image request failed for an unknown reason.')
}

function normalizeInput(
  inputOrPrompt: string | GenerateAIImageOptions,
  contextName?: string
): GenerateAIImageOptions {
  if (typeof inputOrPrompt === 'string') {
    return {
      prompt: inputOrPrompt,
      contextName: contextName || '',
      mode: 'illustration',
      referenceImage: null,
    }
  }

  return {
    ...inputOrPrompt,
    mode: inputOrPrompt.mode || 'illustration',
    referenceImage: inputOrPrompt.referenceImage || null,
  }
}

function buildIllustrationPrompt(prompt: string) {
  return [
    'Create one polished editorial illustration for Arkara CMS.',
    'Prioritize clean storytelling, readable composition, and strong thumbnail impact.',
    'Keep the scene grounded, practical, and visually premium.',
    'Avoid text labels, watermarks, UI mockups, or unnecessary decorative clutter.',
    `Subject request: ${prompt.trim()}`,
  ].join(' ')
}

function buildTechnicalPrompt(prompt: string, hasReferenceImage: boolean) {
  return [
    'Create one technical visual for Arkara CMS.',
    'Prioritize accuracy, legibility, component clarity, material realism, and a structured but not stiff composition.',
    'The image should feel like a practical field guide illustration or a technical editorial drawing, not a cold engineering blueprint.',
    'Show tools, materials, component relationships, and process setup clearly when relevant.',
    'Avoid text labels, captions, callout numbers, watermarks, and decorative clutter.',
    hasReferenceImage
      ? 'Use the reference image only as a grounding aid for structure, proportions, and component fidelity while still producing a polished standalone result.'
      : 'Infer the most plausible tools, materials, and setup only from the written instruction.',
    `Technical brief: ${prompt.trim()}`,
  ].join(' ')
}

function buildRequestPayload({ prompt, mode, referenceImage }: Required<Pick<GenerateAIImageOptions, 'prompt' | 'mode'>> & { referenceImage: TechnicalReferenceImage | null }) {
  const technicalMode = mode === 'technical'
  const textPrompt = technicalMode
    ? buildTechnicalPrompt(prompt, Boolean(referenceImage?.publicUrl))
    : buildIllustrationPrompt(prompt)

  const messages = technicalMode && referenceImage?.publicUrl
    ? [
        {
          role: 'user',
          content: [
            { type: 'text', text: textPrompt },
            { type: 'image_url', imageUrl: { url: referenceImage.publicUrl } },
          ],
        },
      ]
    : [
        {
          role: 'user',
          content: textPrompt,
        },
      ]

  return {
    model: IMAGE_MODEL,
    messages,
    modalities: ['image', 'text'],
    image_config: {
      aspect_ratio: '4:3',
      image_size: '1K',
    },
  }
}

export async function generateAIImage(inputOrPrompt: string | GenerateAIImageOptions, contextName?: string) {
  if (!OPENROUTER_API_KEY) throw new Error('MISSING_ENV: OPENROUTER_API_KEY is missing.');
  if (!AUTHOR_ID) throw new Error('MISSING_ENV: CMS_SERVICE_AUTHOR_ID is missing.');

  const input = normalizeInput(inputOrPrompt, contextName)

  if (!input.prompt.trim() || !input.contextName.trim()) {
    throw new Error('Prompt and Context Name are required.');
  }

  if (input.mode === 'technical' && input.referenceImage?.publicUrl && !/^https?:\/\//i.test(input.referenceImage.publicUrl)) {
    throw new Error('Reference image URL is invalid.')
  }

  const payload = buildRequestPayload({
    prompt: input.prompt,
    mode: input.mode || 'illustration',
    referenceImage: input.referenceImage || null,
  })

  try {
    const response = await fetchOpenRouter("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "https://arkaraweb.com",
        "X-Title": "Arkara CMS Image Generator"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("OpenRouter Error:", errText);
      throw new Error(`OpenRouter API responded with ${response.status}: ${errText}`);
    }

    const data = await response.json();
    console.log("OpenRouter Response Data:", JSON.stringify(data, null, 2));
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error("Invalid response format from AI Provider.");
    }
    
    const message = data.choices[0].message;
    let imageUrl = '';

    // Handle case where content is a string
    if (typeof message.content === 'string') {
        const content = message.content;
        const imageUrlMatch = content.match(/!\[.*?\]\((.*?)\)/) || content.match(/(https?:\/\/[^\s]+)/);
        imageUrl = imageUrlMatch ? imageUrlMatch[1] : content;
    } else if (message.content && Array.isArray(message.content)) {
        // Handle array of content parts
        const imagePart = message.content.find((part: any) => part.type === 'image_url');
        if (imagePart && imagePart.image_url) {
            imageUrl = imagePart.image_url.url;
        }
    }

    // Handle case where images might be in message.images (Gemini OpenRouter format)
    if (!imageUrl && message.images && Array.isArray(message.images)) {
        const imagePart = message.images.find((part: any) => part.type === 'image_url');
        if (imagePart && imagePart.image_url && imagePart.image_url.url) {
            imageUrl = imagePart.image_url.url;
        }
    }

    // Handle case where it might be in data.data[0].url (DALL-E style format sometimes mistakenly used)
    if (!imageUrl && data.data && data.data[0] && data.data[0].url) {
        imageUrl = data.data[0].url;
    }

    if (!imageUrl) {
        console.error("No valid image URL found in response payload:", JSON.stringify(data.choices[0]));
        // Slice the payload because base64 data can break the frontend error box
        throw new Error(`Gagal mem-parsing gambar dari respons AI. Header JSON: ${JSON.stringify(Object.keys(message))}`);
    }

    let buffer: Buffer;
    let mimeType = 'image/jpeg';

    if (imageUrl.startsWith('data:image/')) {
        // Parse data URL format: data:image/jpeg;base64,/9j/...
        const [header, base64Data] = imageUrl.split(',');
        mimeType = header.split(':')[1].split(';')[0];
        buffer = Buffer.from(base64Data, 'base64');
    } else if (imageUrl.startsWith('http')) {
        // Fetch the created image buffer from URL
        const imgResponse = await fetch(imageUrl);
        if (!imgResponse.ok) {
            throw new Error("Failed to download generated AI image from OpenRouter.");
        }
        const arrayBuffer = await imgResponse.arrayBuffer();
        buffer = Buffer.from(arrayBuffer);
        mimeType = imgResponse.headers.get('content-type') || 'image/jpeg';
    } else {
        throw new Error("Invalid image data format returned by AI.");
    }
    
    const extension = mimeType.split('/')[1] || 'jpg';
    const originalName = `ai-generated-${Date.now()}.${extension}`;

    // Run the image through our standard WebP + Supabase scaling pipeline
    await processAndUploadImage({
      buffer,
      originalName,
      mimeType,
      contextName: input.contextName,
      authorId: AUTHOR_ID
    });

    revalidatePath('/cms/media');
    return { success: true };
  } finally {
    if (input.referenceImage?.path) {
      await removeTemporaryReferenceImage(input.referenceImage.path)
    }
  }
}
