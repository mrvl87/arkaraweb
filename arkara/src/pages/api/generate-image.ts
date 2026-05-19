/**
 * API Endpoint: POST /api/generate-image
 * Generate images using Wavespeed (Nano Banana 2)
 *
 * Request body:
 * {
 *   "prompt": "deskripsi gambar",
 *   "style": "line-art" | "semi-illustrative",
 *   "uploadToS3": false
 * }
 *
 * Response:
 * { "url": "image-url", "source": "wavespeed" }
 */

import type { APIRoute } from 'astro';
import { generateImage } from '../../lib/wavespeed';

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

    if (uploadToS3) {
      return new Response(
        JSON.stringify({
          error: 'Image uploads are handled by the CMS and Cloudflare R2.',
        }),
        { status: 410, headers: { 'Content-Type': 'application/json' } }
      );
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
