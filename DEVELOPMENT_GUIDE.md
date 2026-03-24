# 👨‍💻 Arkara Development Guide

Panduan untuk mengembangkan fitur dan berkontribusi pada Arkara.

---

## 📋 Daftar Isi

1. [Development Workflow](#development-workflow)
2. [Project Structure](#project-structure)
3. [Creating Features](#creating-features)
4. [File Naming Conventions](#file-naming-conventions)
5. [Component Development](#component-development)
6. [API Development](#api-development)
7. [Database Integration](#database-integration)
8. [Testing](#testing)
9. [Code Style](#code-style)
10. [Git Workflow](#git-workflow)

---

## 🔄 Development Workflow

Arkara sekarang menggunakan arsitektur **Dual-Project**. Anda harus menjalankan frontend (Astro) dan CMS (Next.js) secara bersamaan untuk workflow penuh.

### Daily Workflow

```bash
# Terminal 1: Frontend (Astro)
cd arkara
npm run dev

# Terminal 2: CMS Backend (Next.js)
cd nextjsCMS
npm run dev
```

### Hot Reload Behavior

- **Astro**: Auto-reload untuk perubahan di `arkara/src`.
- **Next.js**: Auto-reload untuk perubahan di `nextjsCMS/src`.
- **Database**: Perubahan data di CMS (Next.js) akan langsung terlihat di Astro setelah refresh (karena SSR).

---

## 🗄️ Database & CMS Strategy

### 1. Supabase (Source of Truth)
Seluruh data sekarang tersimpan di Supabase. 
- Gunakan `nextjsCMS` untuk menambah/edit artikel.
- Gunakan `arkara/src/lib/content.ts` untuk mengambil data di frontend.

### 2. StudioCMS (Transisi)
Beberapa bagian lama masih merujuk pada StudioCMS. Fokus pengembangan baru harus diarahkan ke **Supabase integration**.

---

## 🎨 Design System: Retro Survival Manual 2.0

Fokus desain saat ini adalah folder `arkara/refactored/`. Semua komponen baru harus mengikuti token desain ini:
- **Border**: `3px solid var(--ink)`
- **Shadow**: `8px 8px 0 var(--ink)` (No blur)
- **Background**: `var(--cream)` atau `var(--ink)`

---

## 📛 File Naming Conventions
(Sama seperti sebelumnya, namun terbagi dua folder utama)


---

## 📁 Project Structure

### Pages (`src/pages/`)

Routes otomatis berdasarkan struktur file:

```
src/pages/
├── index.astro              → http://localhost:4321/
├── blog/
│   ├── index.astro          → /blog
│   └── [slug].astro         → /blog/[slug] (dynamic)
├── panduan/
│   └── [slug].astro         → /panduan/[slug]
└── api/
    ├── generate-content.ts  → POST /api/generate-content
    └── generate-image.ts    → POST /api/generate-image
```

### Components (`src/components/`)

Reusable component library:

```
src/components/
├── ui/                      # Basic UI components
│   ├── Button.astro         # <Button />
│   ├── Card.astro           # <Card />
│   └── Badge.astro          # <Badge />
├── blog/                    # Blog-specific components
│   ├── PostCard.astro       # Article preview card
│   ├── PostHeader.astro     # Article header
│   └── TableOfContents.astro # TOC generator
└── cms/                     # CMS widgets (future)
    └── ...
```

### Libraries (`src/lib/`)

Helper functions dan clients:

```
src/lib/
├── openrouter.ts           # AI text generation
├── wavespeed.ts            # AI image generation
├── storage.ts              # S3/Tigris upload
└── helpers.ts              # Utility functions
```

### Layouts (`src/layouts/`)

Page templates:

```
src/layouts/
├── BaseLayout.astro        # Main layout (header, footer, etc)
└── PostLayout.astro        # Blog post layout
```

### Styles (`src/styles/`)

Global styling:

```
src/styles/
└── global.css              # Design tokens, global styles
```

---

## ✨ Creating Features

### Feature: Tambah Kategori Baru

**File yang berubah:**

1. **Update color tokens** (`src/styles/global.css`):
```css
--new-category-color: #ABC123;
```

2. **Update type** (`src/pages/blog/[slug].astro`):
```typescript
const categoryLabels: Record<string, string> = {
  // ... existing
  'baru': 'Kategori Baru',
};
```

3. **Update homepage** (`src/pages/index.astro`):
```javascript
const categories = [
  // ... existing
  { name: 'Kategori Baru', slug: 'baru', icon: '🆕' },
];
```

4. **Create sample content**:
```
src/content/blog/artikel-kategori-baru.mdx
```

### Feature: Tambah Component Baru

**Example: Create Sidebar Component**

1. Create file: `src/components/ui/Sidebar.astro`

```astro
---
interface Props {
  title: string;
  items: Array<{ label: string; href: string }>;
}

const { title, items } = Astro.props;
---

<aside class="sidebar">
  <h2>{title}</h2>
  <ul>
    {items.map(item => (
      <li><a href={item.href}>{item.label}</a></li>
    ))}
  </ul>
</aside>

<style>
  .sidebar {
    background: var(--sand);
    padding: 1rem;
    border-radius: 0.5rem;
  }
</style>
```

2. Use in pages:

```astro
---
import Sidebar from '../components/ui/Sidebar.astro';
---

<BaseLayout>
  <Sidebar
    title="Navigation"
    items={[
      { label: 'Home', href: '/' },
      { label: 'Blog', href: '/blog' }
    ]}
  />
</BaseLayout>
```

---

## 📛 File Naming Conventions

### Pages & Routes

```
✅ Good:
src/pages/index.astro           # Homepage
src/pages/blog/index.astro      # Blog listing
src/pages/blog/[slug].astro     # Dynamic blog route
src/pages/api/generate-content.ts

❌ Avoid:
src/pages/Home.astro            # Use lowercase
src/pages/blogIndex.astro       # Use separators
```

### Components

```
✅ Good:
src/components/ui/Button.astro
src/components/blog/PostCard.astro
src/components/cms/AIWidget.astro

❌ Avoid:
src/components/button.astro     # Capitalize
src/components/BlogPostCard.astro # No nested dirs in name
```

### Styles

```
✅ Good:
src/styles/global.css
src/styles/variables.css
src/components/Button.astro (scoped <style>)

❌ Avoid:
src/styles/blog.css             # Use component scoping
src/styles/ButtonStyles.css
```

### Types

```
✅ Good:
interface BlogPost {
  title: string;
  category: 'air' | 'energi' | 'pangan';
}

❌ Avoid:
interface IBlogPost              # No I prefix
type BlogPostType               # 'Type' suffix redundant
```

---

## 🧩 Component Development

### Astro Component Structure

```astro
---
// 1. Import statements
import Button from '../components/ui/Button.astro';
import { formatDate } from '../lib/helpers';

// 2. Interface definitions
interface Props {
  title: string;
  date?: Date;
  featured?: boolean;
}

// 3. Get props
const { title, date = new Date(), featured = false } = Astro.props;

// 4. Data fetching & logic
const formattedDate = formatDate(date);
---

<!-- 5. Template -->
<article class:list={['post', { featured }]}>
  <h1>{title}</h1>
  <time>{formattedDate}</time>
  <slot />
</article>

<!-- 6. Styles (scoped) -->
<style>
  .post {
    padding: 1rem;
  }

  .post.featured {
    border: 2px solid var(--amber);
  }
</style>
```

### Best Practices

✅ **Do:**
- Use TypeScript interfaces for props
- Scope styles within component
- Keep components small and focused
- Use Tailwind classes for styling
- Document complex props with comments

❌ **Don't:**
- Use inline styles
- Create massive mega-components
- Mix logic with presentation heavily
- Forget to pass required props
- Leave dead code

---

## 🔌 API Development

### Creating New Endpoint

**File:** `src/pages/api/new-feature.ts`

```typescript
import type { APIRoute } from 'astro';

interface RequestBody {
  param1: string;
  param2?: number;
}

export const POST: APIRoute = async ({ request }) => {
  try {
    // 1. Parse request
    const body = (await request.json()) as RequestBody;

    // 2. Validate
    if (!body.param1) {
      return new Response(
        JSON.stringify({ error: 'Missing param1' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 3. Process
    const result = await processData(body.param1);

    // 4. Return response
    return new Response(
      JSON.stringify({ success: true, data: result }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    // 5. Error handling
    return new Response(
      JSON.stringify({ error: String(e) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// Helper function
async function processData(input: string): Promise<string> {
  // Implementation
  return input;
}
```

### Testing Endpoint

```bash
# Test with curl
curl -X POST http://localhost:4321/api/new-feature \
  -H "Content-Type: application/json" \
  -d '{"param1":"value1"}'

# Test with invalid input
curl -X POST http://localhost:4321/api/new-feature \
  -H "Content-Type: application/json" \
  -d '{}'
```

---

## 🗄️ Database Integration

### Using StudioCMS SDK (Future)

```typescript
// Get all entries
const posts = await sdk.GET.databaseEntry.all('blog');

// Get single entry by slug
const post = await sdk.GET.databaseEntry.bySlug('blog', 'first-post');

// Filter entries
const filtered = posts.filter(p => p.category === 'air');

// Create entry
await sdk.POST.databaseEntry.create('blog', {
  title: 'New Post',
  content: 'Content here',
  category: 'air'
});
```

### Current: Astro Content Collections

```typescript
// Get all entries
import { getCollection } from 'astro:content';
const posts = await getCollection('blog');

// Render entry
import { render } from 'astro:content';
const { Content } = await render(entry);
```

---

## 🧪 Testing

### Manual Testing

```bash
# 1. Start dev server
npm run dev

# 2. Test in browser
# http://localhost:4321/

# 3. Check console for errors
# Press F12 → Console tab

# 4. Test API endpoints
curl -X POST http://localhost:4321/api/generate-content ...

# 5. Check build
npm run build
```

### Build Testing

```bash
# Test production build locally
npm run build
npm run preview

# Visit http://localhost:4321
# Check for missing assets, broken links, etc
```

### Lighthouse Testing

```bash
# Run Lighthouse audit (via Chrome DevTools)
# 1. Open DevTools (F12)
# 2. Lighthouse tab
# 3. Generate report

# Check:
- Performance
- Accessibility
- Best Practices
- SEO
```

---

## 🎨 Code Style

### TypeScript/JavaScript

```typescript
// ✅ Good
const formatDate = (date: Date): string => {
  return date.toLocaleDateString('id-ID');
};

// ✅ Use proper types
interface Post {
  title: string;
  published: boolean;
}

// ❌ Avoid
const formatDate = (date) => date.toLocaleDateString();
var result: any = something;
```

### CSS/Tailwind

```astro
<!-- ✅ Use Tailwind classes -->
<div class="max-w-3xl mx-auto px-4 py-8">
  <h1 class="text-4xl font-bold text-forest">Title</h1>
</div>

<!-- ✅ Scope with component -->
<style>
  .special { color: var(--amber); }
</style>

<!-- ❌ Avoid -->
<div style="max-width: 960px; margin: 0 auto;">
  <h1 style="font-size: 32px; font-weight: bold;">
</div>
```

### Comments

```typescript
// ✅ Good - explains WHY
// Filter to published posts only, as drafts shouldn't appear in listing
const published = posts.filter(p => p.published);

// ✅ TODO for known issues
// TODO: Implement pagination once we have >50 posts

// ❌ Avoid - obvious comments
// Get all posts
const allPosts = getCollection('blog');

// ❌ Avoid - commented code
// const oldWay = posts.sort(...);
```

---

## 🔀 Git Workflow

### Branch Naming

```bash
# Features
git checkout -b feat/add-search-feature
git checkout -b feat/improve-performance

# Bugfixes
git checkout -b fix/broken-mobile-nav
git checkout -b fix/database-migration-issue

# Hotfixes (production)
git checkout -b hotfix/critical-bug

# Documentation
git checkout -b docs/update-readme
```

### Commit Messages

```bash
# ✅ Good commit messages
git commit -m "feat: add search functionality to blog"
git commit -m "fix: resolve database migration issue"
git commit -m "docs: update installation guide"
git commit -m "style: improve mobile navigation styling"
git commit -m "refactor: simplify API error handling"

# Format: [type]: [description]
# Types: feat, fix, docs, style, refactor, test, chore
```

### Pull Request Process

1. Create feature branch from main
2. Make changes with regular commits
3. Build and test locally (`npm run build`)
4. Push branch and create PR
5. Write clear PR description:

```markdown
## Description
What does this PR do?

## Changes
- Change 1
- Change 2

## Testing
How to test the changes?

## Related Issues
Closes #123
```

---

## 🚀 Deployment Checklist

Before deploying to production:

- [ ] All tests pass (`npm run build`)
- [ ] No console errors in dev server
- [ ] All API endpoints tested
- [ ] Database migrations applied
- [ ] Environment variables set on Railway
- [ ] Lighthouse score good (>80)
- [ ] Mobile responsive tested
- [ ] Links all working
- [ ] Images loading correctly
- [ ] Form submissions working

---

## 📚 Useful Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run preview          # Preview production build

# Database
npx studiocms migrate --latest    # Run migrations
npx studiocms migrate --status    # Check migration status

# Cleanup
npm run clean            # (if available)
rm -r node_modules       # Remove dependencies
npm install              # Reinstall

# Git
git status               # Check changes
git log --oneline        # View commits
git diff                 # See detailed changes
```

---

## 🤝 Contributing

1. Fork repository
2. Create feature branch
3. Make changes
4. Test locally
5. Commit with good messages
6. Push to GitHub
7. Create Pull Request
8. Wait for review

---

## 📞 Getting Help

- Check [WALKTHROUGH.md](./WALKTHROUGH.md) for detailed setup
- Check [QUICKSTART.md](./QUICKSTART.md) for quick reference
- Read official docs: [Astro](https://docs.astro.build), [StudioCMS](https://docs.studiocms.dev)
- Search GitHub issues for similar problems
- Ask in discussions or issues

---

**Happy coding!** 🎉

Last Updated: 14 Maret 2026
