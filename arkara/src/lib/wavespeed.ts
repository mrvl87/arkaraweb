/**
 * Wavespeed AI Image Generation Client (Nano Banana 2)
 *
 * TODO: Add WAVESPEED_API_KEY to .env file to enable this module
 * Get it from: https://app.wavespeed.ai
 */

const WAVESPEED_BASE = 'https://api.wavespeed.ai/api/v3';

export interface ImageGenOptions {
  prompt: string;
  negativePrompt?: string;
  width?: number;
  height?: number;
  style?: 'line-art' | 'semi-illustrative';
}

export async function generateImage(opts: ImageGenOptions): Promise<string> {
  const apiKey = import.meta.env.WAVESPEED_API_KEY;

  if (!apiKey) {
    throw new Error('WAVESPEED_API_KEY not configured. Set it in .env file.');
  }

  // Submit generation job
  const submitRes = await fetch(`${WAVESPEED_BASE}/bytedance/sdxl-lightning-4step`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt: buildArkaraPrompt(opts),
      negative_prompt:
        opts.negativePrompt ??
        'photorealistic, photograph, 3D render, CGI, watermark, text, logo',
      width: opts.width ?? 1024,
      height: opts.height ?? 576,
      num_inference_steps: 4,
      guidance_scale: 1.0,
    }),
  });

  if (!submitRes.ok) throw new Error(`Wavespeed submit error: ${submitRes.status}`);

  const submitted = (await submitRes.json()) as any;
  const predictionId = submitted.data.id;

  // Poll for result
  return await pollForResult(apiKey, predictionId);
}

async function pollForResult(apiKey: string, id: string, maxAttempts = 30): Promise<string> {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, 2000));

    const res = await fetch(`${WAVESPEED_BASE}/predictions/${id}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    const result = (await res.json()) as any;
    const data = result.data;

    if (data.status === 'completed') {
      return data.outputs[0];
    }

    if (data.status === 'failed') {
      throw new Error('Image generation failed');
    }
  }

  throw new Error('Image generation timed out');
}

function buildArkaraPrompt(opts: ImageGenOptions): string {
  const stylePrefix =
    opts.style === 'line-art'
      ? 'clean black and white line art technical diagram, minimalist, blueprint style, '
      : 'semi-realistic illustration, warm earthy tones, Indonesian tropical setting, ';

  return `${stylePrefix}${opts.prompt}, survival manual style, no text, no watermark, high quality`;
}
