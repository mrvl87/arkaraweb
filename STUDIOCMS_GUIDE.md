# 🎨 StudioCMS Content Management Guide

Panduan lengkap untuk mengelola konten menggunakan StudioCMS di Arkara.

---

## 📋 Daftar Isi

1. [Pengenalan StudioCMS](#pengenalan-studiocms)
2. [Setup Awal](#setup-awal)
3. [CRUD Content](#crud-content)
4. [Dashboard CMS](#dashboard-cms)
5. [API Integration](#api-integration)
6. [Database Management](#database-management)
7. [Troubleshooting](#troubleshooting)

---

## 🎯 Pengenalan StudioCMS

### Apa itu StudioCMS?

**StudioCMS** adalah headless CMS yang dibangun khusus untuk Astro:
- ✅ Database-backed (SQLite, PostgreSQL, MySQL, Turso)
- ✅ Built-in authentication & user management
- ✅ Web UI untuk manage content
- ✅ Content collections dengan type-safe access
- ✅ Multi-language support (ready)
- ✅ File-based & database modes

### Berbeda dengan Keystatic

| Aspek | Keystatic | StudioCMS |
|-------|-----------|-----------|
| Storage | File-based (Git) | Database |
| CMS UI | Web UI | Web UI |
| Scale | Small-medium | Medium-large |
| Collaboration | Good (Git-based) | Better (Real-time) |
| Complexity | Simple | More features |

---

## 🚀 Setup Awal

### 1. StudioCMS Sudah Installed

```bash
# Check instalasi
npm list studiocms

# Expected output:
# studiocms@0.4.4
```

### 2. Config Sudah Setup

File `studiocms.config.mjs` sudah ada:

```javascript
import { defineStudioCMSConfig } from 'studiocms/config';
import { config } from 'dotenv';

config();

export default defineStudioCMSConfig({
  dbType: 'libsql',
  dbConnection: {
    connection: {
      url: process.env.CMS_LIBSQL_URL || 'file:./data/studio.db',
      authToken: process.env.TURSO_AUTH_TOKEN,
    },
  },
});
```

### 3. Database Sudah Initialized

```bash
# Migration sudah dijalankan
npx studiocms migrate --latest

# Check status
npx studiocms migrate --status
```

---

## 🛠️ CRUD Content - Comprehensive Guide

### CRUD Hierarchy dalam StudioCMS

```
StudioCMS
├── Collections (e.g., "blog", "panduan")
│   ├── Entries (individual posts)
│   │   ├── Create (POST)
│   │   ├── Read (GET)
│   │   ├── Update (PUT)
│   │   └── Delete (DELETE)
│   └── Fields (title, content, category, etc)
└── Admin Users
    ├── Create user
    ├── Set permissions
    ├── Manage access
    └── Delete user
```

---

## 📝 CREATE - Membuat Content Baru

### Opsi 1: Via StudioCMS Dashboard (GUI)

**Belum fully integrated di Windows, tapi siap untuk production.**

Ketika di-deploy ke production (Unix environment):

```bash
# 1. Start dev server
npm run dev

# 2. Kunjungi CMS dashboard
# http://localhost:4321/start (first-time setup)
# http://localhost:4321/dashboard (main dashboard)

# 3. Create new entry
# - Click "New Entry"
# - Fill form (title, content, category, etc)
# - Click "Save"
```

### Opsi 2: Via API/SDK (Programmatic)

**Recommended untuk automation & batch operations.**

```typescript
// File: src/lib/cms-operations.ts

import { createClient } from '@studiocms/api-client';

const cmsClient = createClient({
  apiUrl: 'http://localhost:4321/api/cms',
  apiKey: process.env.STUDIOCMS_API_KEY, // Set di production
});

// Create blog post
export async function createBlogPost(data: {
  title: string;
  description: string;
  content: string;
  category: 'air' | 'energi' | 'pangan' | 'medis' | 'keamanan' | 'komunitas';
  publishDate: Date;
  coverImage?: string;
  aiGenerated?: boolean;
}) {
  try {
    const result = await cmsClient.collections('blog').create({
      title: data.title,
      description: data.description,
      content: data.content,
      category: data.category,
      publishDate: data.publishDate.toISOString(),
      coverImage: data.coverImage || null,
      aiGenerated: data.aiGenerated || false,
    });

    console.log('✅ Post created:', result.id);
    return result;
  } catch (e) {
    console.error('❌ Error creating post:', e);
    throw e;
  }
}
```

### Opsi 3: Via API Endpoint (Direct)

```typescript
// File: src/pages/api/cms/create-post.ts

import type { APIRoute } from 'astro';
import { createBlogPost } from '../../../lib/cms-operations';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();

    const post = await createBlogPost({
      title: body.title,
      description: body.description,
      content: body.content,
      category: body.category,
      publishDate: new Date(body.publishDate),
      coverImage: body.coverImage,
      aiGenerated: body.aiGenerated,
    });

    return new Response(JSON.stringify({ success: true, post }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: String(e) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
```

**Test dengan curl:**

```bash
curl -X POST http://localhost:4321/api/cms/create-post \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Filter Air Bersih",
    "description": "Cara membuat filter air sederhana",
    "content": "# Filter Air\n\n## Bahan-bahan...",
    "category": "air",
    "publishDate": "2026-03-14",
    "aiGenerated": false
  }'
```

### Opsi 4: Via Database CLI (Advanced)

```bash
# Direct query dengan sqlite3
sqlite3 data/studio.db

# SQL untuk insert (tidak recommended - gunakan SDK)
INSERT INTO blog (title, description, content, category, published_at)
VALUES ('Title', 'Desc', 'Content', 'air', datetime('now'));
```

---

## 📖 READ - Membaca Content

### Read di Astro Pages (Current)

```astro
---
// src/pages/blog/index.astro
import { getCollection } from 'astro:content';

// Get semua blog posts
const allPosts = await getCollection('blog');

// Filter
const airPosts = allPosts.filter(p => p.data.category === 'air');

// Sort
const sorted = airPosts.sort((a, b) =>
  b.data.publishDate.valueOf() - a.data.publishDate.valueOf()
);
---

<div>
  {sorted.map(post => (
    <article>
      <h2>{post.data.title}</h2>
      <p>{post.data.description}</p>
    </article>
  ))}
</div>
```

### Read dengan SDK (Future)

```typescript
// Ketika StudioCMS fully integrated:

// Get all entries
const posts = await sdk.GET.databaseEntry.all('blog');

// Get by slug
const post = await sdk.GET.databaseEntry.bySlug('blog', 'filter-air');

// Filter & query
const airPosts = posts.filter(p => p.data.category === 'air');

// Render content
export const Content = post.data.content; // MDX rendering
```

### Read via API Endpoint

```typescript
// File: src/pages/api/cms/get-posts.ts

import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

export const GET: APIRoute = async ({ url }) => {
  try {
    const category = url.searchParams.get('category');

    let posts = await getCollection('blog');

    if (category) {
      posts = posts.filter(p => p.data.category === category);
    }

    const sorted = posts.sort((a, b) =>
      b.data.publishDate.valueOf() - a.data.publishDate.valueOf()
    );

    return new Response(
      JSON.stringify({
        success: true,
        count: sorted.length,
        posts: sorted.map(p => ({
          slug: p.slug,
          title: p.data.title,
          description: p.data.description,
          category: p.data.category,
          publishDate: p.data.publishDate,
        })),
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: String(e) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
```

**Test dengan curl:**

```bash
# Get semua posts
curl http://localhost:4321/api/cms/get-posts

# Get posts by category
curl http://localhost:4321/api/cms/get-posts?category=air
```

---

## ✏️ UPDATE - Mengubah Content

### Update via SDK

```typescript
// File: src/lib/cms-operations.ts

export async function updateBlogPost(
  slug: string,
  data: {
    title?: string;
    description?: string;
    content?: string;
    category?: string;
    publishDate?: Date;
  }
) {
  try {
    const result = await cmsClient
      .collections('blog')
      .bySlug(slug)
      .update({
        ...(data.title && { title: data.title }),
        ...(data.description && { description: data.description }),
        ...(data.content && { content: data.content }),
        ...(data.category && { category: data.category }),
        ...(data.publishDate && { publishDate: data.publishDate.toISOString() }),
      });

    console.log('✅ Post updated:', slug);
    return result;
  } catch (e) {
    console.error('❌ Error updating post:', e);
    throw e;
  }
}
```

### Update via API Endpoint

```typescript
// File: src/pages/api/cms/update-post.ts

import type { APIRoute } from 'astro';
import { updateBlogPost } from '../../../lib/cms-operations';

export const PUT: APIRoute = async ({ request }) => {
  try {
    const { slug, ...updates } = await request.json();

    if (!slug) {
      return new Response(
        JSON.stringify({ error: 'Missing slug parameter' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const result = await updateBlogPost(slug, {
      ...updates,
      publishDate: updates.publishDate ? new Date(updates.publishDate) : undefined,
    });

    return new Response(JSON.stringify({ success: true, post: result }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: String(e) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
```

**Test dengan curl:**

```bash
curl -X PUT http://localhost:4321/api/cms/update-post \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "filter-air",
    "title": "Filter Air - Updated",
    "description": "Cara membuat filter air - versi terbaru"
  }'
```

---

## 🗑️ DELETE - Menghapus Content

### Delete via SDK

```typescript
// File: src/lib/cms-operations.ts

export async function deleteBlogPost(slug: string) {
  try {
    await cmsClient
      .collections('blog')
      .bySlug(slug)
      .delete();

    console.log('✅ Post deleted:', slug);
  } catch (e) {
    console.error('❌ Error deleting post:', e);
    throw e;
  }
}
```

### Delete via API Endpoint

```typescript
// File: src/pages/api/cms/delete-post.ts

import type { APIRoute } from 'astro';
import { deleteBlogPost } from '../../../lib/cms-operations';

export const DELETE: APIRoute = async ({ request }) => {
  try {
    const { slug } = await request.json();

    if (!slug) {
      return new Response(
        JSON.stringify({ error: 'Missing slug parameter' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    await deleteBlogPost(slug);

    return new Response(
      JSON.stringify({ success: true, message: `Deleted ${slug}` }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: String(e) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
```

**Test dengan curl:**

```bash
curl -X DELETE http://localhost:4321/api/cms/delete-post \
  -H "Content-Type: application/json" \
  -d '{"slug":"filter-air"}'
```

---

## 🎨 Dashboard CMS

### Akses Dashboard (Production)

Ketika sudah di production (Unix environment):

```bash
# 1. Deploy ke Railway/server
# 2. Kunjungi: https://arkara.id/dashboard

# First time setup:
# https://arkara.id/start
```

### Dashboard Features

**Di dashboard Anda bisa:**
- ✅ Create posts (form UI)
- ✅ Edit posts
- ✅ Delete posts
- ✅ Preview content
- ✅ Manage categories
- ✅ Upload cover images
- ✅ Manage users
- ✅ Set permissions

### Admin User Management

```bash
# Create admin user (CLI)
npx studiocms users create

# Interactive prompts:
# - Email: admin@arkara.id
# - Password: (secure password)
# - Role: admin

# List users
npx studiocms users list

# Delete user
npx studiocms users delete <email>
```

---

## 🔌 API Integration

### Complete CRUD API Layer

Buatlah file `src/lib/cms-api.ts`:

```typescript
// File: src/lib/cms-api.ts

interface BlogPostData {
  title: string;
  description: string;
  content: string;
  category: string;
  publishDate: Date;
  coverImage?: string;
  aiGenerated?: boolean;
}

class CMSApi {
  private baseUrl = 'http://localhost:4321/api/cms';

  async createPost(data: BlogPostData) {
    return fetch(`${this.baseUrl}/create-post`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(r => r.json());
  }

  async getPosts(category?: string) {
    const url = new URL(`${this.baseUrl}/get-posts`);
    if (category) url.searchParams.set('category', category);

    return fetch(url).then(r => r.json());
  }

  async getPost(slug: string) {
    return fetch(`${this.baseUrl}/get-posts?slug=${slug}`)
      .then(r => r.json())
      .then(data => data.posts[0]);
  }

  async updatePost(slug: string, updates: Partial<BlogPostData>) {
    return fetch(`${this.baseUrl}/update-post`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, ...updates }),
    }).then(r => r.json());
  }

  async deletePost(slug: string) {
    return fetch(`${this.baseUrl}/delete-post`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug }),
    }).then(r => r.json());
  }
}

export const cmsApi = new CMSApi();
```

**Usage di Astro pages:**

```astro
---
import { cmsApi } from '../lib/cms-api';

// Get posts
const { posts } = await cmsApi.getPosts();

// Get by category
const airPosts = await cmsApi.getPosts('air');
---

<div>
  {posts.map(post => (
    <article>
      <h2>{post.title}</h2>
      <p>{post.description}</p>
    </article>
  ))}
</div>
```

---

## 🗄️ Database Management

### View Database

```bash
# Open SQLite browser
sqlite3 data/studio.db

# List tables
.tables

# Schema blog table
.schema blog

# Query all posts
SELECT * FROM blog;

# Query specific category
SELECT * FROM blog WHERE category = 'air';

# Count posts
SELECT COUNT(*) FROM blog;

# Exit
.quit
```

### Backup Database

```bash
# Backup sebelum production
cp data/studio.db data/studio.db.backup.$(date +%Y%m%d)

# Restore dari backup
cp data/studio.db.backup.20260314 data/studio.db
```

### Reset Database (⚠️ Destructive)

```bash
# Backup terlebih dahulu!
cp data/studio.db data/studio.db.backup

# Hapus database
rm data/studio.db

# Re-migrate
npx studiocms migrate --latest

# Database fresh, empty
```

---

## 📊 Content Management Workflow

### Typical Day-to-Day Workflow

```
1. Content Creation
   ├─ Write in editor/AI generation
   ├─ Upload cover image
   └─ Set metadata (category, date)

2. Management
   ├─ Create via API/Dashboard
   ├─ Preview in browser
   └─ Make adjustments

3. Publishing
   ├─ Set publish date
   ├─ Set as published
   └─ Monitor analytics

4. Updates
   ├─ Edit content
   ├─ Update metadata
   └─ Re-publish

5. Archive/Delete
   ├─ Archive old posts
   └─ Delete if needed
```

### Content Lifecycle

```
Draft → Review → Published → Updated → Archived/Deleted
```

---

## 🔄 Batch Operations

### Bulk Import Posts

```typescript
// File: scripts/import-posts.ts

import { cmsApi } from '../src/lib/cms-api';

const postsToImport = [
  {
    title: 'Filter Air Bersih',
    description: 'Cara membuat filter sederhana',
    content: '# Filter Air...',
    category: 'air',
    publishDate: new Date('2026-03-01'),
  },
  {
    title: 'Penyimpanan Energi',
    description: 'Menyimpan energi untuk situasi darurat',
    content: '# Energi...',
    category: 'energi',
    publishDate: new Date('2026-03-05'),
  },
  // ... more posts
];

async function importAll() {
  for (const post of postsToImport) {
    try {
      await cmsApi.createPost(post);
      console.log(`✅ Imported: ${post.title}`);
    } catch (e) {
      console.error(`❌ Failed: ${post.title}`, e);
    }
  }
}

importAll();
```

**Run import:**

```bash
npx ts-node scripts/import-posts.ts
```

### Bulk Update Posts

```typescript
// File: scripts/update-posts.ts

import { cmsApi } from '../src/lib/cms-api';

async function updateCategory() {
  const posts = await cmsApi.getPosts();

  // Update all posts in batch
  for (const post of posts) {
    await cmsApi.updatePost(post.slug, {
      aiGenerated: true, // Mark as AI-generated
    });
  }

  console.log(`✅ Updated ${posts.length} posts`);
}

updateCategory();
```

---

## 🤖 AI-Powered Content Creation

### Integrate AI Generation to CRUD

```typescript
// File: src/lib/cms-ai.ts

import { generateContent } from './openrouter';
import { cmsApi } from './cms-api';

export async function createAIPost(
  topic: string,
  category: string
) {
  try {
    // 1. Generate content via AI
    console.log('🤖 Generating content...');
    const aiContent = await generateContent({
      model: 'anthropic/claude-haiku-4-5',
      prompt: `Tulis artikel blog tentang: ${topic}`,
      systemPrompt: 'Tulis dalam Bahasa Indonesia untuk platform survival',
      maxTokens: 2000,
    });

    // 2. Create post via CMS
    console.log('📝 Creating post...');
    const post = await cmsApi.createPost({
      title: topic,
      description: `Panduan tentang ${topic}`,
      content: aiContent,
      category,
      publishDate: new Date(),
      aiGenerated: true,
    });

    console.log('✅ AI post created:', post.slug);
    return post;
  } catch (e) {
    console.error('❌ Error creating AI post:', e);
    throw e;
  }
}
```

**Usage:**

```bash
# Create AI-generated post via API
curl -X POST http://localhost:4321/api/cms/create-ai-post \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "Cara Menyaring Air Bersih",
    "category": "air"
  }'
```

---

## 🎯 Best Practices

### ✅ DO:
- ✅ Backup database regularly
- ✅ Use meaningful slugs/titles
- ✅ Set publish dates
- ✅ Use categories for organization
- ✅ Include cover images
- ✅ Add descriptions
- ✅ Mark AI-generated content
- ✅ Version content (git commits)

### ❌ DON'T:
- ❌ Edit database directly (use SDK)
- ❌ Delete without backup
- ❌ Mix content types in one collection
- ❌ Skip metadata
- ❌ Use special characters in slugs
- ❌ Leave draft posts without publish date
- ❌ Store sensitive data in content

---

## 🐛 Troubleshooting

### Problem: "Collections not found"

**Error:**
```
Error: Collection 'blog' not found
```

**Solusi:**
```bash
# 1. Check database migrations
npx studiocms migrate --status

# 2. Re-migrate if needed
npx studiocms migrate --latest

# 3. Restart dev server
npm run dev
```

### Problem: "Slug already exists"

**Error:**
```
Error: Slug 'filter-air' already exists
```

**Solusi:**
```typescript
// Check existing slug
const existing = await cmsApi.getPosts();
const exists = existing.posts.find(p => p.slug === 'filter-air');

// Use different slug
await cmsApi.createPost({
  title: 'Filter Air Bersih',
  // ... StudioCMS akan auto-generate slug jika tidak diberikan
});
```

### Problem: "Database locked"

**Error:**
```
Error: database is locked
```

**Solusi:**
```bash
# 1. Stop dev server (Ctrl+C)
# 2. Wait 5 seconds
# 3. Restart
npm run dev

# Alternative: Remove lock file
rm data/studio.db-wal
rm data/studio.db-shm
```

### Problem: "API key not working"

**Error:**
```
Error: Unauthorized - API key invalid
```

**Solusi:**
```bash
# 1. Check .env file
cat .env | grep STUDIOCMS

# 2. Regenerate key di dashboard
# (atau set di production environment)

# 3. For dev: gunakan method tanpa auth
```

---

## 📚 Content Schema Reference

### Blog Post Schema

```typescript
interface BlogPost {
  slug: string;           // Auto-generated from title
  title: string;          // Required, max 200 chars
  description: string;    // Required, excerpt
  content: string;        // Required, MDX format
  category: string;       // Required, one of: air|energi|pangan|medis|keamanan|komunitas
  publishDate: Date;      // Required
  coverImage?: string;    // Optional, image URL
  aiGenerated?: boolean;  // Optional, default false
  createdAt: Date;        // Auto-generated
  updatedAt: Date;        // Auto-generated
}
```

### Panduan Schema

```typescript
interface Panduan {
  slug: string;           // Auto-generated
  title: string;          // Required
  babRef?: string;        // Book chapter reference (e.g., "bab-3")
  qrSlug?: string;        // QR code slug
  content: string;        // MDX content
  createdAt: Date;        // Auto
  updatedAt: Date;        // Auto
}
```

---

## 🚀 Next Steps

### Immediate:
1. ✅ Understand CRUD operations (baca section ini)
2. ✅ Test dengan curl commands yang disediakan
3. ✅ Create first post via API

### Short-term:
1. 🔜 Setup API endpoints untuk CRUD
2. 🔜 Build dashboard UI untuk manage posts
3. 🔜 Integrate AI content generation

### Medium-term:
1. 🔜 Deploy ke production
2. 🔜 Enable StudioCMS web dashboard
3. 🔜 Setup user management

### Long-term:
1. 🔜 Advanced filtering & search
2. 🔜 Content versioning
3. 🔜 Multi-language support

---

## 📞 Helpful Resources

- [StudioCMS Docs](https://docs.studiocms.dev/)
- [Astro Collections](https://docs.astro.build/en/guides/content-collections/)
- [Database Concepts](./WALKTHROUGH.md#-database-management)
- [API Development](./DEVELOPMENT_GUIDE.md#-api-development)

---

**Happy content managing! 🎉**

Last Updated: 14 Maret 2026
