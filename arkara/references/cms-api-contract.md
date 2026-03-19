# CMS API Contract

This document defines the interface between the Arkara custom Next.js CMS and the AstroJS frontend. **Both teams must agree on changes here before implementation.**

---

## Auth

All requests from the frontend include:
```
x-api-key: <CMS_API_SECRET>
```

The CMS validates this header. It's a shared secret — not user auth, just service-to-service. Rotate together (update both `CMS_API_SECRET` on CMS and `CMS_API_SECRET` on frontend).

---

## Base URL

```
Production: https://cms.arkara.id
Local CMS:  http://localhost:3001
```

Set via `CMS_API_URL` env var on the frontend.

---

## Endpoints

### Posts (Blog)

```
GET /api/posts
GET /api/posts/:slug
```

**GET /api/posts** — query params:

| Param | Type | Default | Notes |
|---|---|---|---|
| `page` | number | 1 | Pagination |
| `limit` | number | 10 | Max 50 |
| `category` | string | — | Filter by category slug |
| `status` | string | `published` | `published` \| `draft` |

**Response shape**:
```typescript
// GET /api/posts
{
  data: Post[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// GET /api/posts/:slug
Post

// Post shape
interface Post {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;        // 'air' | 'energi' | 'pangan' | 'medis' | 'keamanan' | 'komunitas'
  publishedAt: string;     // ISO 8601
  updatedAt: string;
  coverImage: string | null;  // absolute URL to image
  contentHtml: string;     // rendered HTML, safe to set:html
  readingTime: number;     // minutes (estimated by CMS)
  aiGenerated: boolean;
  tags: string[];
}
```

---

### Panduan (Technical Guides)

```
GET /api/panduan
GET /api/panduan/:slug
```

```typescript
interface Panduan {
  id: string;
  slug: string;
  title: string;
  babRef: string;          // e.g. "bab-3"
  qrSlug: string;          // e.g. "pompa-air" — matches QR code in physical book
  contentHtml: string;
  steps: PanduanStep[];
  lastUpdated: string;
}

interface PanduanStep {
  order: number;
  title: string;
  body: string;
  warning?: string;
  tipBadge?: 'safe' | 'warning' | 'note' | 'critical';
}
```

---

### Modules

```
GET /api/modules
GET /api/modules/:slug
```

```typescript
interface Module {
  id: string;
  slug: string;
  number: string;         // "MODULE 01"
  icon: string;           // emoji
  name: string;
  description: string;
  tag: string;            // "12 PELAJARAN • DASAR"
  featured: boolean;
  lessonCount: number;
  difficulty: 'dasar' | 'menengah' | 'lanjutan';
  href: string;           // link target (may point to external or internal page)
}
```

---

### Site Settings

```
GET /api/settings
```

```typescript
interface SiteSettings {
  siteName: string;
  tagline: string;
  heroTitle: string;
  heroSubtitle: string;
  warningBandItems: string[];  // items for the scrolling ticker
  checklistItems: ChecklistItem[];
  socialLinks: { platform: string; url: string }[];
  updatedAt: string;
}

interface ChecklistItem {
  label: string;
  status: 'done' | 'warn' | 'danger';
}
```

---

### Search

```
GET /api/search?q=:query&type=:type
```

```typescript
// type: 'all' | 'posts' | 'panduan' | 'modules'
interface SearchResult {
  type: 'post' | 'panduan' | 'module';
  slug: string;
  title: string;
  excerpt: string;
  url: string;
}

// Response
{ results: SearchResult[]; total: number; }
```

---

## Webhook: CMS → Frontend

When content is published or updated, CMS sends:

```
POST https://arkara.id/api/revalidate
Headers:
  x-revalidate-secret: <REVALIDATE_SECRET>
Body:
  { "type": "post" | "panduan" | "module" | "settings", "slug": "..." }
```

Frontend logs this and can trigger Railway rebuild or invalidate an in-memory cache.

---

## Versioning Policy

- Current version: **v1** (no prefix needed, implicit)
- Breaking changes: add `/v2/` prefix, maintain v1 for 60 days
- Additive changes (new fields): no version bump needed — frontend ignores unknown fields
- Field removals: treated as breaking, require v2

---

## Error Responses

```typescript
// All errors
{ error: string; code?: string; }

// HTTP status codes used:
// 200 — success
// 400 — bad request (invalid params)
// 401 — missing or invalid x-api-key
// 404 — content not found
// 429 — rate limited (add retry with backoff)
// 500 — CMS internal error (log and show fallback UI)
```

---

## Frontend Fallback Strategy

When CMS API is unavailable:

```typescript
// src/lib/cms.ts — wrap all calls
export async function getPosts(params?: PostsParams): Promise<PostsResponse> {
  try {
    return await cmsGet<PostsResponse>(`/api/posts${buildQuery(params)}`);
  } catch (err) {
    console.error('[CMS] getPosts failed:', err);
    // Return empty state — UI handles gracefully
    return { data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 0 } };
  }
}
```

Never let a CMS error crash the page. Show an empty state with a "konten sedang dimuat" message.

---

## CORS

CMS must allow requests from:
- `https://arkara.id`
- `https://*.railway.app` (preview deployments)
- `http://localhost:3000` (local dev)

Configure in CMS Next.js `next.config.js` headers or middleware.

---

## Mock Data (Frontend Dev)

When developing without the CMS running, use `src/lib/cms.mock.ts`.
See `SKILL.md` → "Local CMS mock" for the toggle pattern.

Sample fixture file location: `src/lib/fixtures/` (gitignored from production builds).
