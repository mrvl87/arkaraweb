# ⚡ StudioCMS Quick Reference - CRUD Cheat Sheet

Panduan cepat untuk CRUD operations di Arkara dengan StudioCMS.

---

## 🚀 Quick Start

### Import Content Manager

```typescript
import { contentManager } from '@/lib/cms-content-manager';
```

### Gunakan di Pages/Components

```astro
---
import { contentManager } from '../lib/cms-content-manager';

// Get all posts
const posts = await contentManager.getAllPosts();

// Get by category
const airPosts = await contentManager.getPostsByCategory('air', 10);

// Search
const results = await contentManager.searchPosts('filter');
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

## 📚 API Endpoints Available

### GET Endpoints

```bash
# Get all posts
curl http://localhost:4321/api/cms/posts

# Get with filters
curl 'http://localhost:4321/api/cms/posts?category=air&limit=5&offset=0'

# Get single post
curl http://localhost:4321/api/cms/posts/filter-air

# Search
curl 'http://localhost:4321/api/cms/search?q=filter'

# Get categories
curl http://localhost:4321/api/cms/categories
```

### POST - Create

```bash
curl -X POST http://localhost:4321/api/cms/posts \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Cara Membuat Filter Air",
    "description": "Panduan membuat filter air sederhana",
    "content": "# Filter Air\n\nBahan-bahan yang diperlukan...",
    "category": "air",
    "publishDate": "2026-03-14",
    "aiGenerated": false
  }'
```

### PUT - Update

```bash
curl -X PUT http://localhost:4321/api/cms/posts/filter-air \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Cara Membuat Filter Air - Updated",
    "description": "Panduan membuat filter air sederhana (versi terbaru)"
  }'
```

### DELETE - Delete

```bash
curl -X DELETE http://localhost:4321/api/cms/posts/filter-air
```

---

## 🎯 Common Operations

### Create New Post

```typescript
// Method 1: Direct API call
const response = await fetch('/api/cms/posts', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'Filter Air Bersih',
    description: 'Cara membuat filter',
    content: '# Filter\n\nBahan...',
    category: 'air',
    publishDate: new Date().toISOString(),
  }),
});
const { data } = await response.json();

// Method 2: Content Manager
const post = await contentManager.createBlogPost({
  title: 'Filter Air Bersih',
  description: 'Cara membuat filter',
  content: '# Filter\n\nBahan...',
  category: 'air',
  publishDate: new Date(),
});
```

### Read All Posts

```typescript
// Get all
const posts = await contentManager.getAllPosts();

// Get with filters
const posts = await contentManager.getAllPosts({
  category: 'air',
  limit: 10,
  offset: 0,
  sortBy: 'date',
  sortOrder: 'desc',
});

// Get by category
const airPosts = await contentManager.getPostsByCategory('air');

// Get recent
const recent = await contentManager.getRecentPosts(5);
```

### Read Single Post

```typescript
// Get by slug
const post = await contentManager.getPostBySlug('filter-air');

if (post) {
  console.log(post.title); // ✅ Post found
} else {
  console.log('Post not found'); // ❌
}
```

### Update Post

```typescript
// Full update
const updated = await contentManager.updateBlogPost('filter-air', {
  title: 'New Title',
  description: 'New description',
  content: 'New content',
});

// Partial update
await contentManager.updateBlogPost('filter-air', {
  title: 'Only title changes',
  // Other fields stay the same
});

// Publish/unpublish
await contentManager.publishPost('filter-air', true);  // Publish
await contentManager.publishPost('filter-air', false); // Unpublish
```

### Delete Post

```typescript
await contentManager.deletePost('filter-air');
console.log('✅ Post deleted');
```

### Search Posts

```typescript
const results = await contentManager.searchPosts('filter');

// Results include posts matching:
// - Title containing "filter"
// - Description containing "filter"
```

### Get Statistics

```typescript
// Total posts
const total = await contentManager.getPostsCount();

// Posts by category
const airCount = await contentManager.getPostsCount('air');

// Categories with counts
const categories = await contentManager.getCategories();
// Returns: { slug: 'air', label: 'Air', count: 5 }
```

---

## 🔍 Filter Options

### Query Parameters for GET /api/cms/posts

| Parameter | Type | Example | Notes |
|-----------|------|---------|-------|
| `category` | string | `air` | Filter by category |
| `limit` | number | `10` | Max results (default: all) |
| `offset` | number | `0` | Pagination offset |
| `sortBy` | string | `date` \| `title` | Sort field |
| `sortOrder` | string | `asc` \| `desc` | Sort direction |

### Categories Available

```
'air'       - Air (💧)
'energi'    - Energi (⚡)
'pangan'    - Pangan (🌾)
'medis'     - Medis (⚕️)
'keamanan'  - Keamanan (🛡️)
'komunitas' - Komunitas (👥)
```

---

## 📋 Blog Post Structure

```typescript
interface BlogPost {
  slug: string;                    // Auto-generated from title
  title: string;                   // Required
  description: string;             // Required, excerpt
  content: string;                 // Required, Markdown/MDX
  category: string;                // Required, one of above
  publishDate: Date;               // Required
  coverImage?: string;             // Optional, image URL
  aiGenerated?: boolean;           // Optional, default false
}
```

---

## 🛠️ Utility Functions

### Format Date

```typescript
const formatted = contentManager.formatDate(new Date());
// Output: "14 Maret 2026"
```

### Get Reading Time

```typescript
const content = '# Title\n\nLong article content...';
const minutes = contentManager.getReadingTime(content);
// Output: 5 (minutes)
```

### Truncate Text

```typescript
const text = 'Long text that needs truncation...';
const short = contentManager.truncateText(text, 50);
// Output: "Long text that needs truncation..."
```

---

## 🚨 Error Handling

```typescript
try {
  const post = await contentManager.getPostBySlug('invalid');
  if (!post) {
    console.log('Post not found');
  }
} catch (error) {
  console.error('Error:', error.message);
}
```

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "Post not found" | Slug doesn't exist | Check slug spelling |
| "Title is required" | Missing title | Provide title in input |
| "Slug already exists" | Duplicate slug | Use different title |
| "Category is required" | Missing category | Provide valid category |
| "Content is required" | Empty content | Provide post content |

---

## 💡 Usage Examples

### Homepage - Show Recent Posts

```astro
---
import { contentManager } from '../lib/cms-content-manager';

const recent = await contentManager.getRecentPosts(3);
---

<section>
  <h2>Artikel Terbaru</h2>
  <div class="grid">
    {recent.map(post => (
      <article>
        <h3>{post.title}</h3>
        <p>{post.description}</p>
        <a href={`/blog/${post.slug}`}>Baca Selengkapnya</a>
      </article>
    ))}
  </div>
</section>
```

### Category Page - Show Posts by Category

```astro
---
import { contentManager } from '../lib/cms-content-manager';

const category = 'air';
const posts = await contentManager.getPostsByCategory(category, 10);
---

<h1>Artikel - Air</h1>
<div>
  {posts.map(post => (
    <article>
      <h2>{post.title}</h2>
      <p>{post.description}</p>
    </article>
  ))}
</div>
```

### Search Page - Search Functionality

```astro
---
const { searchParams } = new URL(Astro.request.url);
const query = searchParams.get('q') || '';

let results = [];
if (query) {
  const { contentManager } = await import('../lib/cms-content-manager');
  results = await contentManager.searchPosts(query);
}
---

<h1>Hasil Pencarian untuk: {query}</h1>

{results.length > 0 ? (
  <div>
    {results.map(post => (
      <article>
        <h2>{post.title}</h2>
        <p>{post.description}</p>
      </article>
    ))}
  </div>
) : (
  <p>Tidak ada hasil ditemukan</p>
)}
```

### Admin Dashboard - Manage Content

```astro
---
import { contentManager } from '../lib/cms-content-manager';

// Get all posts with stats
const posts = await contentManager.getAllPosts();
const total = posts.length;
const categories = await contentManager.getCategories();
---

<div class="admin-dashboard">
  <h1>Dashboard Admin</h1>

  <div class="stats">
    <div>Total Posts: {total}</div>
    <div>Categories: {categories.length}</div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Judul</th>
        <th>Kategori</th>
        <th>Tanggal</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      {posts.map(post => (
        <tr>
          <td>{post.title}</td>
          <td>{post.category}</td>
          <td>{contentManager.formatDate(post.publishDate)}</td>
          <td>
            <a href={`/admin/edit/${post.slug}`}>Edit</a>
            <button onclick={`deletePost('${post.slug}')`}>Delete</button>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>

<script>
  async function deletePost(slug) {
    if (confirm('Delete this post?')) {
      const res = await fetch(`/api/cms/posts/${slug}`, { method: 'DELETE' });
      if (res.ok) location.reload();
    }
  }
</script>
```

---

## 📚 Learn More

- [STUDIOCMS_GUIDE.md](./STUDIOCMS_GUIDE.md) - Panduan lengkap
- [cms-content-manager.ts](./arkara/src/lib/cms-content-manager.ts) - Kode sumber
- [API Endpoints](./arkara/src/pages/api/cms/) - Endpoint implementations

---

## ✅ Checklist - Ready to Use

- ✅ ContentManager library tersedia
- ✅ API endpoints tersedia
- ✅ CRUD operations ready
- ✅ Query filtering implemented
- ✅ Search functionality ready
- ✅ Error handling in place

**Mulai gunakan sekarang!** 🎉

---

Last Updated: 14 Maret 2026
