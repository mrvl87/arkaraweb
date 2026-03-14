/**
 * API Endpoint: POST /api/generate-content
 * Generate blog or guide content using OpenRouter AI
 *
 * Request body:
 * {
 *   "prompt": "tema artikel",
 *   "model": "anthropic/claude-haiku-4-5",
 *   "type": "blog" | "panduan"
 * }
 *
 * Response:
 * { "content": "generated MDX text" }
 */

import type { APIRoute } from 'astro';
import { generateContent, ARKARA_SYSTEM_PROMPT } from '../../lib/openrouter';

interface RequestPayload {
  prompt: string;
  model: string;
  type: 'blog' | 'panduan';
  maxTokens?: number;
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const { prompt, model, type, maxTokens } = (await request.json()) as RequestPayload;

    // Validate required fields
    if (!prompt || !model) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: prompt, model' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Build type-specific prompt
    const fullPrompt =
      type === 'blog'
        ? `Tulis artikel blog survival berjudul: "${prompt}".
           Sertakan: opening scene dramatis, fakta Indonesia, tips praktis, dan penutup yang memotivasi.
           Format MDX dengan heading H2 dan H3.`
        : `Tulis panduan teknis: "${prompt}".
           Sertakan: daftar bahan lokal Indonesia, langkah-langkah bernomor, peringatan keamanan, dan tips lapangan.`;

    const content = await generateContent({
      model,
      prompt: fullPrompt,
      systemPrompt: ARKARA_SYSTEM_PROMPT,
      maxTokens: maxTokens || 2000,
      temperature: 0.7,
    });

    return new Response(JSON.stringify({ content }), {
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
