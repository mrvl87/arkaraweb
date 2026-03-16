# Arsitektur Arkara CMS

---

## Struktur Folder Lengkap

```
nextjsCMS/
├── docs/                        # Dokumentasi project
│   ├── README.md
│   ├── part1-foundation.md
│   ├── architecture.md
│   └── known-issues.md
│
├── src/
│   ├── app/
│   │   ├── (auth)/              # Route group auth (tidak ada di URL)
│   │   │   ├── layout.tsx
│   │   │   └── login/
│   │   │       └── page.tsx
│   │   │
│   │   ├── cms/                 # URL prefix: /cms
│   │   │   ├── layout.tsx       # Server Component — fetch user
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── posts/page.tsx
│   │   │   ├── panduan/page.tsx
│   │   │   ├── media/page.tsx
│   │   │   ├── settings/page.tsx
│   │   │   └── ai/page.tsx
│   │   │
│   │   ├── globals.css          # Global styles (no Tailwind directives)
│   │   ├── layout.tsx           # Root HTML shell
│   │   └── page.tsx             # Redirect → /login
│   │
│   ├── components/
│   │   └── cms-layout-client.tsx  # Sidebar + header (Client Component)
│   │
│   ├── lib/
│   │   └── supabase/
│   │       ├── client.ts        # Browser client
│   │       └── server.ts        # Server client (async)
│   │
│   └── middleware.ts            # Auth guard untuk /cms/*
│
├── supabase/
│   └── schema.sql               # DDL lengkap, jalankan di Supabase SQL Editor
│
├── .env.local                   # Kredensial (gitignored)
├── .env.example                 # Template env
├── next.config.ts
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.js
├── railway.toml
└── package.json
```

---

## Alur Auth

```
User buka /
    │
    ▼
page.tsx → redirect /login
    │
    ▼
/login (200 OK — public)
    │
    ├── Submit form
    │       │
    │       ▼
    │   supabase.auth.signInWithPassword()
    │       │
    │       ├── Error → tampilkan pesan error inline
    │       │
    │       └── Sukses → router.push('/cms/dashboard')
    │
    ▼
/cms/dashboard
    │
    ▼
middleware.ts — cek session Supabase
    │
    ├── Tidak ada user → redirect /login
    │
    └── Ada user → lanjut ke layout.tsx
            │
            ▼
        cms/layout.tsx (Server Component)
            │
            ├── Fetch user dari Supabase
            ├── Jika tidak ada user → redirect /login (double-check)
            │
            └── Render CMSLayoutClient + children
```

---

## Alur Data Dashboard

```
/cms/dashboard (Server Component)
    │
    ▼
getStats() — 4x query Supabase (parallel)
    │
    ├── posts WHERE status='published' → count
    ├── posts WHERE status='draft'     → count
    ├── panduan                        → count
    └── media                          → count
    │
    ▼
Jika tabel tidak ada (error) → default ke 0
    │
    ▼
Render stat cards + Recent Activity section
```

---

## Pattern Server vs Client Component

| File | Type | Alasan |
|------|------|--------|
| `cms/layout.tsx` | Server | Perlu akses cookies untuk auth |
| `cms/dashboard/page.tsx` | Server | Fetch data langsung dari Supabase |
| `components/cms-layout-client.tsx` | Client | `useState` untuk sidebar toggle |
| `(auth)/login/page.tsx` | Client | `useState`, `useForm`, `useRouter` |
| `lib/supabase/server.ts` | Server only | `cookies()` dari `next/headers` |
| `lib/supabase/client.ts` | Client only | `createBrowserClient` |

---

## Database Schema Overview

```sql
posts          — konten blog
panduan        — panduan teknis survival
categories     — 6 kategori (air, energi, pangan, medis, keamanan, komunitas)
site_settings  — key-value config
navigation     — menu publik
hero_section   — konten hero
cta_section    — call to action
footer         — footer + social links
media          — metadata upload file
```

RLS Policy pattern:
```sql
-- Public read
CREATE POLICY "public read" ON table FOR SELECT USING (status = 'published');

-- Auth write
CREATE POLICY "auth manage" ON table FOR ALL USING (auth.role() = 'authenticated');
```

---

## Warna Brand Arkara

| Nama | Hex | Digunakan |
|------|-----|-----------|
| Forest Green | `#1a2e1a` | Background sidebar, text utama |
| Amber | `#d4a017` | Aksen, button, active link |
| Parchment | `#f5f0e8` | Background card, header |

---

## Tailwind CSS — Status

Tailwind v3 terinstall tapi **directives `@tailwind` dinonaktifkan** di `globals.css` karena menyebabkan crash PostCSS di Windows (error code `0xc0000142` — Windows DLL init failure pada child process).

Solusi saat ini: semua styling via Tailwind utility classes + inline styles langsung di JSX. Tailwind utility classes tetap bekerja karena Next.js 16 Turbopack bisa memproses class names secara langsung tanpa perlu PostCSS transform.

Untuk mengaktifkan kembali di production/Linux environment:
1. Tambah `@tailwind base; @tailwind components; @tailwind utilities;` ke `globals.css`
2. Import `globals.css` di `layout.tsx`
3. Pastikan `postcss.config.js` mengandung `tailwindcss: {}`
