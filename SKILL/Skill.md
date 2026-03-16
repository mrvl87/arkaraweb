---
name: arkara-ecosystem
description: Build and maintain the Arkara survival knowledge platform — a full-stack AstroJS website with StudioCMS (native Astro CMS), AI content generation via OpenRouter, AI image generation via Wavespeed (Nano Banana 2), and deployment on Railway with Tigris S3 bucket storage. Use this skill whenever the user mentions Arkara, the survival blog, the prepper website, StudioCMS setup, AstroJS CMS, OpenRouter content generation, Wavespeed image generation, Railway deployment, or any part of the Arkara digital ecosystem. Also trigger for tasks like "add a new blog post flow", "set up the CMS", "generate survival content", "deploy the site", or "connect image generation to the website".
---

# Arkara Ecosystem — Full Stack Skill

Arkara adalah platform pengetahuan survival Indonesia ("Survive with Knowledge") dibangun di atas **AstroJS + StudioCMS** — CMS native Astro dengan dashboard visual, database Turso, pipeline AI via OpenRouter & Wavespeed, dan deployment di Railway dengan Tigris bucket storage.

---

## Stack Overview

| Layer | Technology | Keterangan |
|---|---|---|
| Framework | AstroJS 4.x | SSR mode, performa & SEO terbaik |
| CMS | StudioCMS | Native Astro CMS, dashboard `/dashboard` |
| Blog | @studiocms/blog | Blog plugin resmi, zero-config |
| Editor | @studiocms/wysiwyg | Visual editor seperti WordPress |
| Rendering | @studiocms/mdx | Konten MDX rich format |
| Storage CMS | @studiocms/s3-storage | Media upload langsung ke Tigris |
| Database | Turso (libSQL) | Gratis, ringan, Railway-friendly |
| AI Text | OpenRouter API | User-selectable model |
| AI Image | Wavespeed (Nano Banana 2) | Ilustrasi survival |
| Bucket | Tigris (Railway plugin) | S3-compatible, auto-inject vars |
| Deploy | Railway | Auto-deploy dari GitHub |
| Domain | arkara.id | |

---

## Brand Tokens (Selalu Terapkan)

Baca `references/brand-tokens.md` untuk sistem desain lengkap. Ringkasan:

```
Colors:
  --forest:    #1F3D2B   (primary brand, heading, dark bg)
  --brown:     #6B4F3A   (secondary, subheading)
  --stone:     #5C5F61   (body text, UI neutral)
  --amber:     #D98C2B   (CTA, highlight, accent)
  --moss:      #6E8B3D   (success, nature, tags)
  --sand:      #E6D8B5   (card bg, borders)
  --parchment: #F5F0E8   (page background)
  --ink:       #1A1208   (dark mode bg)

Typography:
  Display: Playfair Display (700, 900)
  Body:    Source Sans 3 (300, 400, 600)
  UI:      Source Sans 3 SemiBold + uppercase + letter-spacing
  Mono:    JetBrains Mono

Tagline: "Survive with Knowledge"
Domain:  arkara.id
```

---

## Struktur Project

```
arkara/
├── src/
│   ├── pages/
│   │   ├── api/
│   │   │   ├── generate-content.ts   # OpenRouter endpoint
│   │   │   └── generate-image.ts     # Wavespeed endpoint
│   │   └── panduan/
│   │       └── [slug].astro          # Target QR code buku
│   ├── components/
│   │   └── ui/                       # Button, Card, Nav — Arkara styled
│   ├── layouts/
│   │   └── BaseLayout.astro          # Layout dengan Arkara brand
│   └── styles/
│       └── global.css                # CSS variables + font import
├── studiocms.config.mjs              # Plugin config StudioCMS
├── astro.config.mjs
├── tailwind.config.mjs               # Arkara tokens
├── railway.toml
└── .env
```

---

## Phase 1 — Bootstrap Project

### 1.1 Buat Project (Cara Paling Mudah)

```bash
# Gunakan CLI StudioCMS — sudah include Astro + CMS sekaligus
npm create studiocms@latest

# Pilih saat ditanya:
# - Project name: arkara
# - Template: blog
# - Package manager: npm
```

Atau dari Astro manual:
```bash
npm create astro@latest arkara -- --template minimal
cd arkara
npx astro add node tailwind
npm i studiocms @studiocms/blog @studiocms/wysiwyg @studiocms/mdx @studiocms/s3-storage
npm i @libsql/client kysely-turso @tailwindcss/typography date-fns clsx
npm i @aws-sdk/client-s3  # untuk upload AI images ke Tigris
```

### 1.2 astro.config.mjs

```js
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import node from '@astrojs/node';
import studioCMS from 'studiocms';

export default defineConfig({
  site: 'https://arkara.id',
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  integrations: [
    tailwind({ applyBaseStyles: false }),
    studioCMS(),
  ],
});
```

### 1.3 studiocms.config.mjs

```js
import { defineStudioCMSConfig } from 'studiocms/config';
import blog    from '@studiocms/blog';
import wysiwyg from '@studiocms/wysiwyg';
import mdx     from '@studiocms/mdx';
import s3      from '@studiocms/s3-storage';

export default defineStudioCMSConfig({
  dbStartPage: false,

  plugins: [
    blog({
      blog: {
        title: 'Arkara — Survive with Knowledge',
        enableRSS: true,
        route: '/blog',
      },
      sitemap: true,
    }),
    wysiwyg(),
    mdx(),
  ],

  // S3 Tigris untuk semua media upload dari dashboard
  storageManager: s3(),
});
```

### 1.4 Tailwind Config

```js
// tailwind.config.mjs
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        forest: '#1F3D2B', brown: '#6B4F3A', stone: '#5C5F61',
        amber: '#D98C2B', moss: '#6E8B3D', sand: '#E6D8B5',
        parchment: '#F5F0E8', ink: '#1A1208',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body:    ['"Source Sans 3"', 'system-ui', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
```

### 1.5 Global CSS

```css
/* src/styles/global.css */
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Source+Sans+3:wght@300;400;600&family=JetBrains+Mono&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --forest: #1F3D2B; --brown: #6B4F3A; --stone: #5C5F61;
  --amber: #D98C2B;  --moss: #6E8B3D;  --sand: #E6D8B5;
  --parchment: #F5F0E8; --ink: #1A1208;
}

body {
  background: var(--parchment);
  color: var(--stone);
  font-family: 'Source Sans 3', system-ui, sans-serif;
}
```

---

## Phase 2 — Database Setup (Turso)

```bash
# Install CLI Turso
curl -sSfL https://get.tur.so/install.sh | bash
turso auth login

# Buat database
turso db create arkara-db

# Ambil credentials
turso db show arkara-db          # copy URL
turso db tokens create arkara-db # copy token

# Generate encryption key
openssl rand --base64 16
```

Tambah ke `.env`:
```bash
CMS_LIBSQL_URL=libsql://arkara-db-yourname.turso.io
CMS_LIBSQL_AUTH_TOKEN=eyJhbGci...
CMS_ENCRYPTION_KEY="hasil-openssl-di-sini"
```

Jalankan migrasi pertama kali:
```bash
npm run studiocms migrate --latest
npm run dev
# Buka http://localhost:4321/start → selesaikan setup awal
# Dashboard ada di http://localhost:4321/dashboard
```

---

## Phase 3 — AI Text Generation (OpenRouter)

### src/lib/openrouter.ts

```typescript
const BASE = 'https://openrouter.ai/api/v1';

export interface GenerateOptions {
  model: string;
  prompt: string;
  systemPrompt?: string;
  maxTokens?: number;
}

export async function generateContent(opts: GenerateOptions): Promise<string> {
  const res = await fetch(`${BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${import.meta.env.OPENROUTER_API_KEY}`,
      'HTTP-Referer': 'https://arkara.id',
      'X-Title': 'Arkara CMS',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: opts.model,
      max_tokens: opts.maxTokens ?? 2000,
      messages: [
        ...(opts.systemPrompt ? [{ role: 'system', content: opts.systemPrompt }] : []),
        { role: 'user', content: opts.prompt },
      ],
    }),
  });
  if (!res.ok) throw new Error(`OpenRouter error: ${res.status}`);
  const data = await res.json();
  return data.choices[0].message.content;
}

export const AVAILABLE_MODELS = [
  { id: 'anthropic/claude-haiku-4-5',        label: 'Claude Haiku 4.5 — Cepat & Hemat' },
  { id: 'anthropic/claude-sonnet-4-5',       label: 'Claude Sonnet 4.5 — Seimbang' },
  { id: 'google/gemini-flash-1.5',           label: 'Gemini Flash 1.5 — Alternatif' },
  { id: 'meta-llama/llama-3.1-70b-instruct', label: 'Llama 3.1 70B — Open Source' },
  { id: 'deepseek/deepseek-chat',            label: 'DeepSeek Chat — Paling Hemat' },
];

export const ARKARA_SYSTEM_PROMPT = `
Kamu adalah penulis senior Arkara — platform pengetahuan survival Indonesia.
Tulis dalam Bahasa Indonesia yang hangat, padat, tidak menggurui.
Gunakan sapaan "Anda". Paragraf maksimal 4-5 baris.
Semua referensi bahan dan teknik harus kontekstual Indonesia (tropis, bahan lokal).
Sertakan tips praktis yang langsung bisa dilakukan.
`;
```

### src/pages/api/generate-content.ts

```typescript
import type { APIRoute } from 'astro';
import { generateContent, ARKARA_SYSTEM_PROMPT } from '../../lib/openrouter';

export const POST: APIRoute = async ({ request }) => {
  const { prompt, model, type } = await request.json();
  const fullPrompt = type === 'blog'
    ? `Tulis artikel blog survival berjudul: "${prompt}". Sertakan opening dramatis, fakta Indonesia, tips praktis, penutup motivasi. Format MDX dengan H2 dan H3.`
    : `Tulis panduan teknis: "${prompt}". Sertakan bahan lokal Indonesia, langkah bernomor, peringatan keamanan, tips lapangan.`;
  try {
    const content = await generateContent({ model, prompt: fullPrompt, systemPrompt: ARKARA_SYSTEM_PROMPT });
    return new Response(JSON.stringify({ content }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
};
```

---

## Phase 4 — AI Image Generation (Wavespeed / Nano Banana 2)

### src/lib/wavespeed.ts

```typescript
const BASE = 'https://api.wavespeed.ai/api/v3';

export type ImageStyle = 'line-art' | 'semi-illustrative';

export async function generateImage(prompt: string, style: ImageStyle = 'semi-illustrative'): Promise<string> {
  const styledPrompt = style === 'line-art'
    ? `clean black and white line art technical diagram, minimalist blueprint style, ${prompt}, no text, no watermark`
    : `semi-realistic illustration, warm earthy tones #1F3D2B #D98C2B #E6D8B5, Indonesian tropical setting, ${prompt}, survival guide style, no text`;

  const res = await fetch(`${BASE}/bytedance/sdxl-lightning-4step`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${import.meta.env.WAVESPEED_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt: styledPrompt,
      negative_prompt: 'photorealistic, photograph, watermark, text, blurry, low quality',
      width: 1024, height: 576,
      num_inference_steps: 4,
    }),
  });
  if (!res.ok) throw new Error(`Wavespeed error: ${res.status}`);
  const { data: { id } } = await res.json();
  return await pollResult(id);
}

async function pollResult(id: string, max = 30): Promise<string> {
  for (let i = 0; i < max; i++) {
    await new Promise(r => setTimeout(r, 2000));
    const res = await fetch(`${BASE}/predictions/${id}`, {
      headers: { 'Authorization': `Bearer ${import.meta.env.WAVESPEED_API_KEY}` },
    });
    const { data } = await res.json();
    if (data.status === 'completed') return data.outputs[0];
    if (data.status === 'failed') throw new Error('Generation failed');
  }
  throw new Error('Timed out');
}
```

### src/pages/api/generate-image.ts

```typescript
import type { APIRoute } from 'astro';
import { generateImage } from '../../lib/wavespeed';
import { uploadToStorage } from '../../lib/storage';

export const POST: APIRoute = async ({ request }) => {
  const { prompt, style, save } = await request.json();
  try {
    const url = await generateImage(prompt, style);
    const finalUrl = save ? await uploadToStorage(url, `ai/${Date.now()}.webp`) : url;
    return new Response(JSON.stringify({ url: finalUrl }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
};
```

---

## Phase 5 — Tigris S3 Storage

`@studiocms/s3-storage` otomatis handle media upload dari dashboard StudioCMS. Untuk upload AI images secara programatik:

### src/lib/storage.ts

```typescript
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({
  region:   import.meta.env.CMS_S3_REGION ?? 'auto',
  endpoint: import.meta.env.CMS_S3_ENDPOINT,
  credentials: {
    accessKeyId:     import.meta.env.CMS_S3_ACCESS_KEY_ID,
    secretAccessKey: import.meta.env.CMS_S3_SECRET_ACCESS_KEY,
  },
});

export async function uploadToStorage(sourceUrl: string, key: string): Promise<string> {
  const res  = await fetch(sourceUrl);
  const body = Buffer.from(await res.arrayBuffer());
  await s3.send(new PutObjectCommand({
    Bucket:      import.meta.env.CMS_S3_BUCKET_NAME,
    Key:         key,
    Body:        body,
    ContentType: res.headers.get('content-type') ?? 'image/webp',
    ACL:         'public-read',
  }));
  return `${import.meta.env.CMS_S3_PUBLIC_ENDPOINT}/${key}`;
}
```

---

## Phase 6 — Environment Variables Lengkap (.env)

```bash
# DATABASE — Turso/libSQL
CMS_LIBSQL_URL=libsql://arkara-db-yourname.turso.io
CMS_LIBSQL_AUTH_TOKEN=eyJhbGci...
CMS_ENCRYPTION_KEY="hasil-openssl-rand-base64-16"

# AI TEXT — OpenRouter
OPENROUTER_API_KEY=sk-or-...

# AI IMAGE — Wavespeed
WAVESPEED_API_KEY=...

# S3 STORAGE — Tigris (Railway auto-inject sebagian, sisanya manual)
CMS_S3_PROVIDER=Tigris
CMS_S3_ACCESS_KEY_ID=...
CMS_S3_SECRET_ACCESS_KEY=...
CMS_S3_BUCKET_NAME=arkara-media
CMS_S3_ENDPOINT=https://fly.storage.tigris.dev
CMS_S3_REGION=auto
CMS_S3_PUBLIC_ENDPOINT=https://arkara-media.fly.storage.tigris.dev

# SITE
PUBLIC_SITE_URL=https://arkara.id
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
```

---

## Phase 7 — Railway Deployment

### railway.toml

```toml
[build]
builder = "NIXPACKS"
buildCommand = "npm run build"

[deploy]
startCommand = "node ./dist/server/entry.mjs"
healthcheckPath = "/"
healthcheckTimeout = 300
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 3
```

### package.json scripts

```json
{
  "scripts": {
    "dev":       "astro dev",
    "build":     "astro check && astro build",
    "start":     "node ./dist/server/entry.mjs",
    "migrate":   "studiocms migrate",
    "studiocms": "studiocms"
  }
}
```

### Langkah Deploy

```
1. Push project ke GitHub

2. Railway → New Project → Deploy from GitHub repo

3. Tambah Tigris:
   Dashboard Railway → + New → Database → Tigris
   → Railway auto-inject CMS_S3_ACCESS_KEY_ID, CMS_S3_SECRET_ACCESS_KEY,
     CMS_S3_BUCKET_NAME, CMS_S3_ENDPOINT

4. Tambah env vars manual di Railway:
   CMS_LIBSQL_URL, CMS_LIBSQL_AUTH_TOKEN, CMS_ENCRYPTION_KEY,
   OPENROUTER_API_KEY, WAVESPEED_API_KEY, PUBLIC_SITE_URL,
   NODE_ENV=production, PORT=3000, HOST=0.0.0.0

5. Custom domain:
   Settings → Domains → arkara.id
   Update DNS (CNAME) di registrar

6. Setiap push ke main → auto-deploy
```

Baca `references/railway-checklist.md` untuk checklist lengkap + troubleshooting Tigris CORS.

---

## Phase 8 — Halaman Panduan Teknis (Target QR Code Buku)

Setiap QR code di Buku Pegangan Krisis mengarah ke `/panduan/[slug]`. Buat sebagai halaman custom di luar blog StudioCMS:

```astro
---
// src/pages/panduan/[slug].astro
import { sdk } from 'studiocms/sdk';
import BaseLayout from '../../layouts/BaseLayout.astro';

const { slug } = Astro.params;
const entry = await sdk.GET.databaseEntry.bySlug(slug);
if (!entry) return Astro.redirect('/404');
---
<BaseLayout title={entry.title}>
  <article class="prose prose-stone max-w-2xl mx-auto px-4 py-12">
    <span class="font-mono text-xs text-amber uppercase tracking-widest">
      Panduan Teknis · arkara.id/panduan/{slug}
    </span>
    <h1 class="font-display text-forest text-4xl mt-2 mb-6">{entry.title}</h1>
    <Fragment set:html={entry.content} />
  </article>
</BaseLayout>
```

Format QR slug di naskah buku: `[QR: /panduan/pompa-air — "Cara Membuat Pompa Air Tanpa Listrik"]`

---

## AI Panel di Dashboard

Baca `references/cms-ai-widget.md` untuk komponen React lengkap yang bisa ditambahkan sebagai halaman custom di `/dashboard-ai` — terpisah dari dashboard StudioCMS tapi terintegrasi dengan API routes yang sama.

Flow penggunaan harian:
```
Buka /dashboard → New Post
→ Buka /dashboard-ai di tab baru
→ Ketik topik → pilih model → Generate Teks
→ Copy ke editor WYSIWYG di dashboard
→ Generate Ilustrasi → save ke Tigris
→ Paste URL gambar ke cover image field
→ Publish
```

---

## Common Tasks

```bash
# Development
npm run dev                              # localhost:4321
# Dashboard: localhost:4321/dashboard

# Database
npm run studiocms migrate --latest       # migrasi pertama / update schema

# Build & deploy
npm run build && npm start               # test production lokal
railway up                               # deploy manual ke Railway
railway logs --tail                      # monitor logs

# Test AI endpoints
curl -X POST http://localhost:4321/api/generate-content \
  -H "Content-Type: application/json" \
  -d '{"prompt":"filter air bambu","model":"anthropic/claude-haiku-4-5","type":"panduan"}'
```

---

## Troubleshooting

| Masalah | Penyebab | Solusi |
|---|---|---|
| Dashboard error di `npm run dev` | Vite issue, normal di dev mode | Gunakan `npm run build && npm start` untuk test dashboard |
| `CMS_LIBSQL_URL` error | Format URL salah | Harus prefix `libsql://` bukan `https://` |
| Wavespeed timeout | Generation > 60s | Naikkan `healthcheckTimeout` di railway.toml ke 600 |
| Gambar tidak tampil | Tigris CORS belum diset | Tambah `arkara.id` ke CORS allowed origins di Tigris |
| OpenRouter 429 | Rate limit | Pindah ke model lebih murah / tambah delay retry |
| Build gagal Railway | Env var kurang | Cek semua var di Phase 6 sudah diset di Railway dashboard |
| `studiocms migrate` error | Turso token expired | Buat token baru: `turso db tokens create arkara-db` |

---

## Reference Files

- `references/brand-tokens.md` — Warna, tipografi, komponen, prompt style Nano Banana
- `references/cms-ai-widget.md` — Komponen React panel AI generation
- `references/railway-checklist.md` — Checklist deploy Railway + Tigris step-by-step