\---

name: arkara-ecosystem

description: Build and maintain the Arkara survival knowledge platform — a full-stack AstroJS website with headless CMS, AI content generation via OpenRouter, AI image generation via Wavespeed (Nano Banana 2), and deployment on Railway with S3-compatible bucket storage. Use this skill whenever the user mentions Arkara, the survival blog, the prepper website, AstroJS + CMS setup, OpenRouter content generation, Wavespeed image generation, Railway deployment, or any part of the Arkara digital ecosystem. Also trigger for tasks like "add a new blog post flow", "set up the CMS", "generate survival content", "deploy the site", or "connect image generation to the website".

\---



\# Arkara Ecosystem — Full Stack Skill



Arkara is a survival knowledge platform ("Survive with Knowledge") — an Indonesian-language prepper/survival website built on AstroJS with a headless CMS, AI content \& image generation pipelines, and Railway deployment.



\---



\## Quick Reference



| Layer | Technology | Details |

|---|---|---|

| Frontend | AstroJS 4.x | SSR + SSG hybrid |

| CMS | Keystatic (file-based) or Decap CMS | Git-based, no extra server |

| AI Text | OpenRouter API | User-selectable model |

| AI Image | Wavespeed API (Nano Banana 2) | `wavespeed-ai/wan-2.1/i2v-480p` |

| Deployment | Railway | Auto-deploy from GitHub |

| Storage | Railway S3 / Tigris / Cloudflare R2 | Image \& media bucket |

| Styling | Tailwind CSS | Arkara design tokens |



\---



\## Brand Tokens (Always Apply)



Read `references/brand-tokens.md` for the complete design system. Summary:



```

Colors:

&#x20; --forest:  #1F3D2B   (primary brand, headings, dark bg)

&#x20; --brown:   #6B4F3A   (secondary, subheadings)

&#x20; --stone:   #5C5F61   (body text, UI neutral)

&#x20; --amber:   #D98C2B   (CTA, highlight, accent)

&#x20; --moss:    #6E8B3D   (success, nature, tags)

&#x20; --sand:    #E6D8B5   (card backgrounds, borders)

&#x20; --parchment: #F5F0E8 (page background)

&#x20; --ink:     #1A1208   (dark mode bg)



Typography:

&#x20; Display:  Playfair Display (700, 900)

&#x20; Body:     Source Sans 3 (300, 400, 600)

&#x20; UI:       Source Sans 3 SemiBold + uppercase + letter-spacing

&#x20; Mono:     JetBrains Mono



Tagline: "Survive with Knowledge"

Domain:  arkara.id

```



\---



\## Project Structure



```

arkara/

├── src/

│   ├── pages/

│   │   ├── index.astro          # Homepage

│   │   ├── blog/

│   │   │   ├── index.astro      # Blog listing

│   │   │   └── \[slug].astro     # Blog post

│   │   ├── panduan/

│   │   │   └── \[slug].astro     # Technical guide pages (QR targets)

│   │   └── admin/               # CMS entry point

│   ├── components/

│   │   ├── ui/                  # Button, Card, Badge, Nav

│   │   ├── blog/                # PostCard, PostHeader, TableOfContents

│   │   └── cms/                 # AI content \& image generator widgets

│   ├── layouts/

│   │   ├── BaseLayout.astro

│   │   └── PostLayout.astro

│   ├── content/

│   │   ├── blog/                # MDX blog posts (managed by CMS)

│   │   └── panduan/             # Technical guides (QR targets)

│   ├── lib/

│   │   ├── openrouter.ts        # AI text generation client

│   │   ├── wavespeed.ts         # Nano Banana 2 image client

│   │   ├── storage.ts           # S3 bucket client

│   │   └── cms-helpers.ts

│   └── styles/

│       └── global.css           # Arkara design tokens as CSS vars

├── keystatic.config.ts          # CMS schema definition

├── astro.config.mjs

├── tailwind.config.mjs          # Arkara Tailwind tokens

├── railway.toml                 # Railway deployment config

└── .env.example

```



\---



\## Phase 1 — Project Bootstrap



When starting a new Arkara project from scratch, follow this sequence.



\### 1.1 Initialize AstroJS



```bash

npm create astro@latest arkara -- \\

&#x20; --template minimal \\

&#x20; --typescript strict \\

&#x20; --no-install

cd arkara

npm install

```



Add integrations:

```bash

npx astro add tailwind mdx node

npm install @astrojs/node

```



\### 1.2 Install Core Dependencies



```bash

\# CMS

npm install @keystatic/core @keystatic/astro



\# Content

npm install astro-mdx-remote sharp



\# Utilities

npm install clsx date-fns



\# S3 Storage

npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner

```



\### 1.3 astro.config.mjs



```js

import { defineConfig } from 'astro/config';

import tailwind from '@astrojs/tailwind';

import mdx from '@astrojs/mdx';

import node from '@astrojs/node';

import keystatic from '@keystatic/astro';



export default defineConfig({

&#x20; output: 'hybrid',

&#x20; adapter: node({ mode: 'standalone' }),

&#x20; integrations: \[

&#x20;   tailwind({ applyBaseStyles: false }),

&#x20;   mdx(),

&#x20;   keystatic(),

&#x20; ],

&#x20; image: {

&#x20;   domains: \['your-bucket.s3.region.amazonaws.com'],

&#x20; },

});

```



\### 1.4 Tailwind Config — Arkara Tokens



```js

// tailwind.config.mjs

export default {

&#x20; content: \['./src/\*\*/\*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],

&#x20; theme: {

&#x20;   extend: {

&#x20;     colors: {

&#x20;       forest:    '#1F3D2B',

&#x20;       brown:     '#6B4F3A',

&#x20;       stone:     '#5C5F61',

&#x20;       amber:     '#D98C2B',

&#x20;       moss:      '#6E8B3D',

&#x20;       sand:      '#E6D8B5',

&#x20;       parchment: '#F5F0E8',

&#x20;       ink:       '#1A1208',

&#x20;     },

&#x20;     fontFamily: {

&#x20;       display: \['"Playfair Display"', 'Georgia', 'serif'],

&#x20;       body:    \['"Source Sans 3"', 'system-ui', 'sans-serif'],

&#x20;       mono:    \['"JetBrains Mono"', 'monospace'],

&#x20;     },

&#x20;     typography: (theme) => ({

&#x20;       arkara: {

&#x20;         css: {

&#x20;           '--tw-prose-body':    theme('colors.stone'),

&#x20;           '--tw-prose-headings': theme('colors.forest'),

&#x20;           '--tw-prose-links':   theme('colors.amber'),

&#x20;           fontFamily:           theme('fontFamily.body').join(', '),

&#x20;         },

&#x20;       },

&#x20;     }),

&#x20;   },

&#x20; },

&#x20; plugins: \[require('@tailwindcss/typography')],

};

```



\### 1.5 Global CSS



```css

/\* src/styles/global.css \*/

@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900\&family=Source+Sans+3:wght@300;400;600\&family=JetBrains+Mono\&display=swap');



@tailwind base;

@tailwind components;

@tailwind utilities;



:root {

&#x20; --forest:    #1F3D2B;

&#x20; --brown:     #6B4F3A;

&#x20; --stone:     #5C5F61;

&#x20; --amber:     #D98C2B;

&#x20; --moss:      #6E8B3D;

&#x20; --sand:      #E6D8B5;

&#x20; --parchment: #F5F0E8;

&#x20; --ink:       #1A1208;

}



body {

&#x20; background: var(--parchment);

&#x20; color: var(--stone);

&#x20; font-family: 'Source Sans 3', system-ui, sans-serif;

}

```



\---



\## Phase 2 — CMS Setup (Keystatic)



Keystatic is a file-based CMS — no database, no extra server. Content lives as MDX files in `src/content/`. The CMS admin UI is available at `/keystatic` in development and production.



\### 2.1 keystatic.config.ts



Read `references/keystatic-schema.md` for full schema. Core structure:



```typescript

import { config, collection, fields } from '@keystatic/core';



export default config({

&#x20; storage: { kind: 'github', repo: 'your-org/arkara' },



&#x20; collections: {

&#x20;   blog: collection({

&#x20;     label: 'Artikel Blog',

&#x20;     slugField: 'title',

&#x20;     path: 'src/content/blog/\*',

&#x20;     format: { contentField: 'content' },

&#x20;     schema: {

&#x20;       title:       fields.slug({ name: { label: 'Judul' } }),

&#x20;       description: fields.text({ label: 'Deskripsi', multiline: true }),

&#x20;       publishDate: fields.date({ label: 'Tanggal Terbit' }),

&#x20;       category:    fields.select({

&#x20;         label: 'Kategori',

&#x20;         options: \[

&#x20;           { label: 'Air', value: 'air' },

&#x20;           { label: 'Energi', value: 'energi' },

&#x20;           { label: 'Pangan', value: 'pangan' },

&#x20;           { label: 'Medis', value: 'medis' },

&#x20;           { label: 'Keamanan', value: 'keamanan' },

&#x20;           { label: 'Komunitas', value: 'komunitas' },

&#x20;         ],

&#x20;         defaultValue: 'pangan',

&#x20;       }),

&#x20;       coverImage:  fields.image({

&#x20;         label: 'Gambar Cover',

&#x20;         directory: 'public/images/blog',

&#x20;         publicPath: '/images/blog',

&#x20;       }),

&#x20;       aiGenerated: fields.checkbox({ label: 'Dibuat dengan AI', defaultValue: false }),

&#x20;       content:     fields.mdx({ label: 'Konten' }),

&#x20;     },

&#x20;   }),



&#x20;   panduan: collection({

&#x20;     label: 'Panduan Teknis',

&#x20;     slugField: 'title',

&#x20;     path: 'src/content/panduan/\*',

&#x20;     format: { contentField: 'content' },

&#x20;     schema: {

&#x20;       title:    fields.slug({ name: { label: 'Judul Panduan' } }),

&#x20;       babRef:   fields.text({ label: 'Referensi Bab Buku (e.g. bab-3)' }),

&#x20;       qrSlug:   fields.text({ label: 'QR Slug (e.g. pompa-air)' }),

&#x20;       content:  fields.mdx({ label: 'Konten Teknis' }),

&#x20;     },

&#x20;   }),

&#x20; },

});

```



\### 2.2 CMS Admin UI Integration



```astro

\---

// src/pages/keystatic/\[...params].astro

export { getStaticPaths } from '@keystatic/astro/route';

import { makeRouteHandler } from '@keystatic/astro/route';

import config from '../../../keystatic.config';

export const { GET, POST } = makeRouteHandler({ config });

\---

```



\---



\## Phase 3 — AI Text Generation (OpenRouter)



\### 3.1 lib/openrouter.ts



```typescript

// User-selectable model — passed at call time

const OPENROUTER\_BASE = 'https://openrouter.ai/api/v1';



export interface GenerateOptions {

&#x20; model: string;          // e.g. 'anthropic/claude-haiku-4-5'

&#x20; prompt: string;

&#x20; systemPrompt?: string;

&#x20; maxTokens?: number;

&#x20; temperature?: number;

}



export async function generateContent(opts: GenerateOptions): Promise<string> {

&#x20; const res = await fetch(`${OPENROUTER\_BASE}/chat/completions`, {

&#x20;   method: 'POST',

&#x20;   headers: {

&#x20;     'Authorization': `Bearer ${import.meta.env.OPENROUTER\_API\_KEY}`,

&#x20;     'HTTP-Referer': 'https://arkara.id',

&#x20;     'X-Title': 'Arkara CMS',

&#x20;     'Content-Type': 'application/json',

&#x20;   },

&#x20;   body: JSON.stringify({

&#x20;     model: opts.model,

&#x20;     max\_tokens: opts.maxTokens ?? 2000,

&#x20;     temperature: opts.temperature ?? 0.7,

&#x20;     messages: \[

&#x20;       ...(opts.systemPrompt

&#x20;         ? \[{ role: 'system', content: opts.systemPrompt }]

&#x20;         : \[]),

&#x20;       { role: 'user', content: opts.prompt },

&#x20;     ],

&#x20;   }),

&#x20; });



&#x20; if (!res.ok) throw new Error(`OpenRouter error: ${res.status}`);

&#x20; const data = await res.json();

&#x20; return data.choices\[0].message.content;

}



// Available models for CMS dropdown

export const AVAILABLE\_MODELS = \[

&#x20; { id: 'anthropic/claude-haiku-4-5',          label: 'Claude Haiku 4.5 (Cepat \& Hemat)' },

&#x20; { id: 'anthropic/claude-sonnet-4-5',         label: 'Claude Sonnet 4.5 (Seimbang)' },

&#x20; { id: 'google/gemini-flash-1.5',             label: 'Gemini Flash 1.5 (Alternatif Cepat)' },

&#x20; { id: 'meta-llama/llama-3.1-70b-instruct',  label: 'Llama 3.1 70B (Open Source)' },

&#x20; { id: 'deepseek/deepseek-chat',              label: 'DeepSeek Chat (Hemat)' },

];



// Arkara-specific system prompt for content generation

export const ARKARA\_SYSTEM\_PROMPT = `

Kamu adalah penulis senior Arkara — platform pengetahuan survival Indonesia.

Tulis konten dalam Bahasa Indonesia yang hangat, padat, dan tidak menggurui.

Semua referensi bahan, tanaman, dan teknik harus kontekstual Indonesia (iklim tropis, bahan lokal).

Gunakan sapaan "Anda". Paragraf maksimal 4-5 baris. Sertakan tips praktis yang bisa langsung dilakukan.

`;

```



\### 3.2 CMS AI Content Widget (API Route)



```typescript

// src/pages/api/generate-content.ts

import type { APIRoute } from 'astro';

import { generateContent, ARKARA\_SYSTEM\_PROMPT } from '../../lib/openrouter';



export const POST: APIRoute = async ({ request }) => {

&#x20; const { prompt, model, type } = await request.json();



&#x20; const fullPrompt = type === 'blog'

&#x20;   ? `Tulis artikel blog survival berjudul: "${prompt}". 

&#x20;      Sertakan: opening scene dramatis, fakta Indonesia, tips praktis, dan penutup yang memotivasi.

&#x20;      Format MDX dengan heading H2 dan H3.`

&#x20;   : `Tulis panduan teknis: "${prompt}".

&#x20;      Sertakan: daftar bahan lokal Indonesia, langkah-langkah bernomor, peringatan keamanan, dan tips lapangan.`;



&#x20; try {

&#x20;   const content = await generateContent({

&#x20;     model,

&#x20;     prompt: fullPrompt,

&#x20;     systemPrompt: ARKARA\_SYSTEM\_PROMPT,

&#x20;   });

&#x20;   return new Response(JSON.stringify({ content }), {

&#x20;     headers: { 'Content-Type': 'application/json' },

&#x20;   });

&#x20; } catch (e) {

&#x20;   return new Response(JSON.stringify({ error: String(e) }), { status: 500 });

&#x20; }

};

```



\---



\## Phase 4 — AI Image Generation (Wavespeed / Nano Banana 2)



\### 4.1 lib/wavespeed.ts



```typescript

const WAVESPEED\_BASE = 'https://api.wavespeed.ai/api/v3';



export interface ImageGenOptions {

&#x20; prompt: string;

&#x20; negativePrompt?: string;

&#x20; width?: number;

&#x20; height?: number;

&#x20; style?: 'line-art' | 'semi-illustrative';

}



// Generate image and return URL

export async function generateImage(opts: ImageGenOptions): Promise<string> {

&#x20; // Submit generation job

&#x20; const submitRes = await fetch(`${WAVESPEED\_BASE}/bytedance/sdxl-lightning-4step`, {

&#x20;   method: 'POST',

&#x20;   headers: {

&#x20;     'Authorization': `Bearer ${import.meta.env.WAVESPEED\_API\_KEY}`,

&#x20;     'Content-Type': 'application/json',

&#x20;   },

&#x20;   body: JSON.stringify({

&#x20;     prompt: buildArkaraPrompt(opts),

&#x20;     negative\_prompt: opts.negativePrompt ?? 'photorealistic, photograph, 3D render, watermark, text',

&#x20;     width:  opts.width  ?? 1024,

&#x20;     height: opts.height ?? 576,

&#x20;     num\_inference\_steps: 4,

&#x20;     guidance\_scale: 1.0,

&#x20;   }),

&#x20; });



&#x20; if (!submitRes.ok) throw new Error(`Wavespeed submit error: ${submitRes.status}`);

&#x20; const { data: { id: predictionId } } = await submitRes.json();



&#x20; // Poll for result

&#x20; return await pollForResult(predictionId);

}



async function pollForResult(id: string, maxAttempts = 30): Promise<string> {

&#x20; for (let i = 0; i < maxAttempts; i++) {

&#x20;   await new Promise(r => setTimeout(r, 2000));

&#x20;   const res = await fetch(`${WAVESPEED\_BASE}/predictions/${id}`, {

&#x20;     headers: { 'Authorization': `Bearer ${import.meta.env.WAVESPEED\_API\_KEY}` },

&#x20;   });

&#x20;   const { data } = await res.json();

&#x20;   if (data.status === 'completed') return data.outputs\[0];

&#x20;   if (data.status === 'failed') throw new Error('Image generation failed');

&#x20; }

&#x20; throw new Error('Image generation timed out');

}



// Build consistent Arkara-style prompts

function buildArkaraPrompt(opts: ImageGenOptions): string {

&#x20; const stylePrefix = opts.style === 'line-art'

&#x20;   ? 'clean black and white line art technical diagram, minimalist, blueprint style, '

&#x20;   : 'semi-realistic illustration, warm earthy tones, Indonesian tropical setting, ';



&#x20; return `${stylePrefix}${opts.prompt}, survival manual style, no text, no watermark, high quality`;

}

```



\### 4.2 Image Generation API Route



```typescript

// src/pages/api/generate-image.ts

import type { APIRoute } from 'astro';

import { generateImage } from '../../lib/wavespeed';

import { uploadToStorage } from '../../lib/storage';



export const POST: APIRoute = async ({ request }) => {

&#x20; const { prompt, style, uploadToS3 } = await request.json();



&#x20; try {

&#x20;   const imageUrl = await generateImage({ prompt, style });



&#x20;   // Optionally upload to S3 bucket and return permanent URL

&#x20;   if (uploadToS3) {

&#x20;     const s3Url = await uploadToStorage(imageUrl, `generated/${Date.now()}.webp`);

&#x20;     return new Response(JSON.stringify({ url: s3Url, source: 's3' }), {

&#x20;       headers: { 'Content-Type': 'application/json' },

&#x20;     });

&#x20;   }



&#x20;   return new Response(JSON.stringify({ url: imageUrl, source: 'wavespeed' }), {

&#x20;     headers: { 'Content-Type': 'application/json' },

&#x20;   });

&#x20; } catch (e) {

&#x20;   return new Response(JSON.stringify({ error: String(e) }), { status: 500 });

&#x20; }

};

```



\---



\## Phase 5 — S3 Bucket Storage



Railway supports Tigris (S3-compatible) natively. Alternatively use Cloudflare R2 (free tier generous).



\### 5.1 lib/storage.ts



```typescript

import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';

import { getSignedUrl } from '@aws-sdk/s3-request-presigner';



const s3 = new S3Client({

&#x20; region: import.meta.env.S3\_REGION ?? 'auto',

&#x20; endpoint: import.meta.env.S3\_ENDPOINT,   // Tigris: https://fly.storage.tigris.dev

&#x20; credentials: {

&#x20;   accessKeyId:     import.meta.env.S3\_ACCESS\_KEY\_ID,

&#x20;   secretAccessKey: import.meta.env.S3\_SECRET\_ACCESS\_KEY,

&#x20; },

});



const BUCKET = import.meta.env.S3\_BUCKET\_NAME;



export async function uploadToStorage(

&#x20; sourceUrl: string,

&#x20; key: string,

): Promise<string> {

&#x20; // Fetch image from source

&#x20; const res  = await fetch(sourceUrl);

&#x20; const body = Buffer.from(await res.arrayBuffer());



&#x20; await s3.send(new PutObjectCommand({

&#x20;   Bucket:      BUCKET,

&#x20;   Key:         key,

&#x20;   Body:        body,

&#x20;   ContentType: res.headers.get('content-type') ?? 'image/webp',

&#x20;   ACL:         'public-read',

&#x20; }));



&#x20; return `${import.meta.env.S3\_PUBLIC\_URL}/${key}`;

}



export async function getSignedUploadUrl(key: string): Promise<string> {

&#x20; return getSignedUrl(

&#x20;   s3,

&#x20;   new PutObjectCommand({ Bucket: BUCKET, Key: key }),

&#x20;   { expiresIn: 3600 },

&#x20; );

}



export async function listImages(prefix = 'generated/'): Promise<string\[]> {

&#x20; const { ListObjectsV2Command } = await import('@aws-sdk/client-s3');

&#x20; const res = await s3.send(new ListObjectsV2Command({ Bucket: BUCKET, Prefix: prefix }));

&#x20; return (res.Contents ?? \[])

&#x20;   .map(obj => `${import.meta.env.S3\_PUBLIC\_URL}/${obj.Key}`);

}

```



\---



\## Phase 6 — Railway Deployment



\### 6.1 railway.toml



```toml

\[build]

builder = "NIXPACKS"

buildCommand = "npm run build"



\[deploy]

startCommand = "node ./dist/server/entry.mjs"

healthcheckPath = "/"

healthcheckTimeout = 300

restartPolicyType = "ON\_FAILURE"

restartPolicyMaxRetries = 3



\[\[services]]

name = "arkara-web"



\[services.variables]

PORT = "3000"

HOST = "0.0.0.0"

NODE\_ENV = "production"

```



\### 6.2 package.json scripts



```json

{

&#x20; "scripts": {

&#x20;   "dev":     "astro dev",

&#x20;   "build":   "astro build",

&#x20;   "preview": "astro preview",

&#x20;   "start":   "node ./dist/server/entry.mjs"

&#x20; }

}

```



\### 6.3 Environment Variables (.env.example)



```bash

\# OpenRouter AI Text

OPENROUTER\_API\_KEY=sk-or-...



\# Wavespeed / Nano Banana 2

WAVESPEED\_API\_KEY=...



\# S3 / Tigris Bucket

S3\_ENDPOINT=https://fly.storage.tigris.dev

S3\_REGION=auto

S3\_BUCKET\_NAME=arkara-media

S3\_ACCESS\_KEY\_ID=...

S3\_SECRET\_ACCESS\_KEY=...

S3\_PUBLIC\_URL=https://arkara-media.fly.storage.tigris.dev



\# CMS (Keystatic GitHub mode)

KEYSTATIC\_GITHUB\_CLIENT\_ID=...

KEYSTATIC\_GITHUB\_CLIENT\_SECRET=...

KEYSTATIC\_SECRET=...   # random 32-char string



\# Site

PUBLIC\_SITE\_URL=https://arkara.id

```



\### 6.4 Railway Setup Steps



1\. Push project to GitHub repository

2\. Go to railway.app → New Project → Deploy from GitHub

3\. Select repo, Railway auto-detects Node.js

4\. Add Tigris storage: Railway Dashboard → Add Plugin → Tigris

5\. Railway auto-injects `S3\_\*` variables from Tigris plugin

6\. Manually add: `OPENROUTER\_API\_KEY`, `WAVESPEED\_API\_KEY`, Keystatic vars

7\. Add custom domain: Settings → Domains → `arkara.id`

8\. Done — every push to `main` auto-deploys



\---



\## Phase 7 — CMS Admin UI (Custom AI Widget)



The CMS admin panel includes a custom AI generation panel embedded in the Keystatic editor. This allows editors to:

\- Select AI model from dropdown (OpenRouter)

\- Enter a topic/prompt

\- Generate article text in one click

\- Generate cover image (Wavespeed) with style selector

\- Preview and insert generated content



Read `references/cms-ai-widget.md` for the full React component code for this panel.



\---



\## Common Tasks — Quick Reference



\### Add new blog post via CLI

```bash

\# Create MDX file directly

touch src/content/blog/nama-artikel.mdx

\# Or use CMS admin at /keystatic

```



\### Generate content for a specific book chapter QR

```

POST /api/generate-content

{

&#x20; "prompt": "cara membuat pompa ram hidrolik dari bambu",

&#x20; "model": "anthropic/claude-haiku-4-5",

&#x20; "type": "panduan"

}

```



\### Generate illustration for book

```

POST /api/generate-image

{

&#x20; "prompt": "manual hand pump water system beside Indonesian bamboo house",

&#x20; "style": "line-art",

&#x20; "uploadToS3": true

}

```



\### Check Railway logs

```bash

railway logs --tail

```



\### Force rebuild

```bash

railway up --detach

```



\---



\## Troubleshooting



| Issue | Cause | Fix |

|---|---|---|

| Keystatic 401 on prod | GitHub OAuth not configured | Set `KEYSTATIC\_GITHUB\_\*` vars in Railway |

| Wavespeed timeout | Generation > 60s | Increase Railway healthcheck timeout |

| Images not loading | S3 CORS | Add `arkara.id` to bucket CORS policy |

| OpenRouter 429 | Rate limit | Switch to cheaper model or add retry logic |

| Build fails on Railway | Missing env vars | Check all `.env.example` vars are set |



\---



\## Reference Files



\- `references/brand-tokens.md` — Complete color, typography, spacing system

\- `references/keystatic-schema.md` — Full CMS content schema with all fields

\- `references/cms-ai-widget.md` — React component for AI generation panel in CMS

\- `references/railway-checklist.md` — Step-by-step Railway + Tigris deployment checklist

