# Arkara CMS — Documentation

**Arkara** adalah platform pengetahuan survival Indonesia. CMS ini dibangun khusus menggunakan Next.js 15 + Supabase untuk menggantikan StudioCMS.

## Dokumen

| File | Isi |
|------|-----|
| [README.md](./README.md) | Halaman ini — overview & quick start |
| [part1-foundation.md](./part1-foundation.md) | Detail lengkap Part 1: Foundation |
| [architecture.md](./architecture.md) | Arsitektur project, struktur folder, alur data |
| [known-issues.md](./known-issues.md) | Bug yang ditemui + solusinya |

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Isi environment variables
cp .env.example .env.local
# Edit .env.local dengan kredensial Supabase kamu

# 3. Jalankan database schema
# Buka Supabase Dashboard → SQL Editor → paste isi supabase/schema.sql

# 4. Jalankan dev server
npm run dev
```

Buka **http://localhost:3000** → otomatis redirect ke `/login`.

---

## Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 (strict mode) |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Styling | Tailwind CSS v3 + inline styles |
| Forms | react-hook-form + zod |
| Icons | lucide-react |
| Editor (planned) | Novel (Tiptap-based) |
| Media (planned) | react-dropzone + Supabase Storage |
| Drag & Drop (planned) | @dnd-kit |

---

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
OPENROUTER_API_KEY=sk-or-your-key
NEXT_PUBLIC_SITE_URL=https://arkara.id
```

---

## Roadmap

- [x] **Part 1** — Foundation (auth, layout, dashboard, schema)
- [ ] **Part 2** — Blog Posts & Panduan CRUD
- [ ] **Part 3** — Settings (site settings, navigation, hero, footer)
- [ ] **Part 4** — Media Library
- [ ] **Part 5** — AI Generator (OpenRouter)
