/**
 * API Endpoint: POST /api/generate-image
 * Generate images using Wavespeed (Nano Banana 2) and upload to S3
 *
 * Request body:
 * {
 *   "prompt": "deskripsi gambar",
 *   "style": "line-art" | "semi-illustrative",
 *   "uploadToS3": true
 * }
 *
 * Response:
 * { "url": "image-url", "source": "s3" | "wavespeed" }
 */

import type { APIRoute } from 'astro';
import { generateImage } from '../../lib/wavespeed';
import { uploadToStorage } from '../../lib/storage';

interface RequestPayload {
  prompt: string;
  style?: 'line-art' | 'semi-illustrative';
  uploadToS3?: boolean;
  width?: number;
  height?: number;
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const { prompt, style, uploadToS3, width, height } = (await request.json()) as RequestPayload;

    // Validate required fields
    if (!prompt) {
      return new Response(JSON.stringify({ error: 'Missing required field: prompt' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Generate image
    const imageUrl = await generateImage({
      prompt,
      style: style || 'semi-illustrative',
      width: width || 1024,
      height: height || 576,
    });

    // Optionally upload to S3 bucket
    if (uploadToS3) {
      const s3Url = await uploadToStorage(
        imageUrl,
        `generated/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.webp`
      );

      return new Response(JSON.stringify({ url: s3Url, source: 's3' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Return Wavespeed URL
    return new Response(JSON.stringify({ url: imageUrl, source: 'wavespeed' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({
        error: String(e),
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
