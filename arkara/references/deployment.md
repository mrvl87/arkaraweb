# Deployment Reference — Arkara Frontend

---

## Railway Setup

### astro.config.mjs (production-ready)

```js
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import mdx from '@astrojs/mdx';
import node from '@astrojs/node';

export default defineConfig({
  output: 'hybrid',
  adapter: node({ mode: 'standalone' }),
  integrations: [
    tailwind({ applyBaseStyles: false }),
    mdx(),
  ],
  image: {
    domains: [
      // Add your CMS domain hostname here
      // e.g., 'cms.arkara.id', 'arkara-media.fly.storage.tigris.dev'
    ],
  },
  vite: {
    define: {
      'import.meta.env.BUILD_TIME': JSON.stringify(new Date().toISOString()),
    },
  },
});
```

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

[[services]]
name = "arkara-frontend"

[services.variables]
PORT = "3000"
HOST = "0.0.0.0"
NODE_ENV = "production"
```

### package.json scripts

```json
{
  "scripts": {
    "dev":     "astro dev",
    "build":   "astro build",
    "preview": "astro preview",
    "start":   "node ./dist/server/entry.mjs"
  }
}
```

---

## Environment Variables

```bash
# .env.example — FRONTEND ONLY
# Copy to .env.local for development

# ── CMS Connection ──────────────────────────────────────────
CMS_API_URL=https://cms.arkara.id         # Your custom Next.js CMS URL
CMS_API_SECRET=your-shared-secret-here    # Must match CMS env FRONTEND_API_SECRET
REVALIDATE_SECRET=another-secret-here     # For CMS → frontend webhook

# ── Site Config ─────────────────────────────────────────────
PUBLIC_SITE_URL=https://arkara.id
NODE_ENV=production

# ── Media (optional, if frontend serves images directly) ────
S3_PUBLIC_URL=https://arkara-media.fly.storage.tigris.dev

# ── Dev only ────────────────────────────────────────────────
CMS_USE_MOCK=false   # Set to true to use mock data without CMS running
```

**Set in Railway Dashboard → Variables (not committed to git):**
- `CMS_API_URL`
- `CMS_API_SECRET`
- `REVALIDATE_SECRET`
- `PUBLIC_SITE_URL`

---

## Deployment Steps

1. Push `arkara-frontend` to its own GitHub repository (separate from CMS)
2. Railway → New Project → Deploy from GitHub → select repo
3. Railway auto-detects Node.js from `package.json`
4. Set environment variables in Railway Dashboard
5. Add custom domain: Settings → Domains → `arkara.id`
6. Every push to `main` auto-deploys

---

## Two-Service Railway Setup

Both frontend and CMS can run as separate Railway services in the same project:

```
Railway Project: arkara-platform
├── Service: arkara-frontend  → arkara.id
└── Service: arkara-cms       → cms.arkara.id
```

They communicate over the public internet (or Railway's private networking if on the same project).

**Private networking** (same Railway project, avoids egress costs):
```bash
# In frontend env vars, use Railway's internal hostname:
CMS_API_URL=http://arkara-cms.railway.internal:3001
```

---

## Health Check Endpoint

Add to `src/pages/health.ts`:

```typescript
import type { APIRoute } from 'astro';
export const GET: APIRoute = () =>
  new Response(JSON.stringify({ status: 'ok', service: 'arkara-frontend' }), {
    headers: { 'Content-Type': 'application/json' },
  });
```

---

## Build Optimization Tips

- Pages that rarely change (module list, homepage) → use `cache: 'force-cache'` with long TTL
- Blog posts → `export const prerender = false` for SSR freshness
- Panduan pages → prerender at build time (stable content)
- Add `<link rel="preload">` for fonts in BaseLayout
- Images from CMS: always use Astro's `<Image />` component for automatic optimization
