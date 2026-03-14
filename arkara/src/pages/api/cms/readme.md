# 📡 CMS API Endpoints

Complete API endpoints untuk CRUD content management.

## Available Endpoints

```
GET    /api/cms/posts              - Get all posts (with filters)
GET    /api/cms/posts?category=air - Get posts by category
GET    /api/cms/posts/:slug        - Get single post
POST   /api/cms/posts              - Create new post
PUT    /api/cms/posts/:slug        - Update post
DELETE /api/cms/posts/:slug        - Delete post

GET    /api/cms/categories         - Get all categories
GET    /api/cms/search?q=keyword   - Search posts
```

## Setup

Copy files dari folder `example/`:
- `posts-get.ts` → `/api/cms/posts.ts`
- `posts-post.ts` → `/api/cms/posts.ts` (same file, different method)
- `posts-id.ts` → `/api/cms/posts/[slug].ts`
- `categories-get.ts` → `/api/cms/categories.ts`
- `search-get.ts` → `/api/cms/search.ts`

## Usage

See `STUDIOCMS_GUIDE.md` untuk contoh lengkap.
