/**
 * OpenRouter AI Text Generation Client
 *
 * TODO: Add OPENROUTER_API_KEY to .env file to enable this module
 * Get it from: https://openrouter.ai
 */

const OPENROUTER_BASE = 'https://openrouter.ai/api/v1';

export interface GenerateOptions {
  model: string;
  prompt: string;
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
}

export async function generateContent(opts: GenerateOptions): Promise<string> {
  const apiKey = import.meta.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY not configured. Set it in .env file.');
  }

  const res = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://arkara.id',
      'X-Title': 'Arkara CMS',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: opts.model,
      max_tokens: opts.maxTokens ?? 2000,
      temperature: opts.temperature ?? 0.7,
      messages: [
        ...(opts.systemPrompt
          ? [{ role: 'system', content: opts.systemPrompt }]
          : []),
        { role: 'user', content: opts.prompt },
      ],
    }),
  });

  if (!res.ok) throw new Error(`OpenRouter error: ${res.status}`);

  const data = (await res.json()) as any;
  return data.choices[0].message.content;
}

export const AVAILABLE_MODELS = [
  { id: 'anthropic/claude-haiku-4-5', label: 'Claude Haiku 4.5 (Cepat & Hemat)' },
  { id: 'anthropic/claude-sonnet-4-5', label: 'Claude Sonnet 4.5 (Seimbang)' },
  { id: 'google/gemini-flash-1.5', label: 'Gemini Flash 1.5 (Alternatif Cepat)' },
  { id: 'meta-llama/llama-3.1-70b-instruct', label: 'Llama 3.1 70B (Open Source)' },
  { id: 'deepseek/deepseek-chat', label: 'DeepSeek Chat (Hemat)' },
];

export const ARKARA_SYSTEM_PROMPT = `
Kamu adalah penulis senior Arkara — platform pengetahuan survival Indonesia.
Tulis konten dalam Bahasa Indonesia yang hangat, padat, dan tidak menggurui.
Semua referensi bahan, tanaman, dan teknik harus kontekstual Indonesia (iklim tropis, bahan lokal).
Gunakan sapaan "Anda". Paragraf maksimal 4-5 baris. Sertakan tips praktis yang bisa langsung dilakukan.
`;
