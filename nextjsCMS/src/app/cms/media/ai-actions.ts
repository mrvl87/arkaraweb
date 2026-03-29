"use server"

import { processAndUploadImage } from './actions'
import { revalidatePath } from 'next/cache'

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const AUTHOR_ID = process.env.CMS_SERVICE_AUTHOR_ID;

export async function generateAIImage(prompt: string, contextName: string) {
  if (!OPENROUTER_API_KEY) throw new Error('MISSING_ENV: OPENROUTER_API_KEY is missing.');
  if (!AUTHOR_ID) throw new Error('MISSING_ENV: CMS_SERVICE_AUTHOR_ID is missing.');

  if (!prompt.trim() || !contextName.trim()) {
    throw new Error('Prompt and Context Name are required.');
  }

  // Define API payload. 
  const payload = {
    model: "google/gemini-3-pro-image-preview",
    messages: [
      {
        role: "user",
        content: prompt
      }
    ],
    modalities: ["image"]
  };

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
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
    contextName,
    authorId: AUTHOR_ID
  });

  revalidatePath('/cms/media');
  return { success: true };
}
