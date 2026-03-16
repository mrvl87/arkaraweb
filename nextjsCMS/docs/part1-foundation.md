# Part 1 — Foundation

Scaffolding awal Arkara CMS: auth, layout, dashboard, schema database, dan deployment config.

---

## Yang Dibangun

### 1. Project Bootstrap

Next.js diinisialisasi **secara manual** (bukan via `create-next-app`) karena nama direktori `nextjsCMS` mengandung huruf kapital yang ditolak oleh npm naming rules.

Cara yang dipakai:
```bash
# Buat package.json manual dengan nama lowercase
# lalu install satu per satu
npm install next react react-dom typescript tailwindcss ...
```

Config files yang dibuat manual:
- `next.config.ts`
- `tsconfig.json`
- `tailwind.config.ts`
- `postcss.config.js`
- `.eslintrc.json`
- `.gitignore`

---

### 2. Dependencies

```bash
npm install \
  @supabase/supabase-js @supabase/ssr \
  novel react-dropzone \
  react-hook-form @hookform/resolvers zod \
  date-fns clsx tailwind-merge \
  @dnd-kit/core @dnd-kit/sortable \
  lucide-react
```

---

### 3. Environment Files

`.env.local` dan `.env.example` berisi:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENROUTER_API_KEY=
NEXT_PUBLIC_SITE_URL=
```

`.env.local` di-gitignore. `.env.example` di-commit sebagai referensi.

---

### 4. Supabase Clients

Dua client dibuat sesuai panduan resmi `@supabase/ssr`:

**`src/lib/supabase/client.ts`** — untuk Client Components (browser):
```ts
import { createBrowserClient } from '@supabase/ssr'
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**`src/lib/supabase/server.ts`** — untuk Server Components & Server Actions:
```ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(...)
}
```

Perbedaan penting: server client **async** karena `cookies()` di Next.js 15 bersifat async.

---

### 5. Auth Middleware

**`src/middleware.ts`** melindungi semua route `/cms/*`:

```ts
export const config = {
  matcher: ['/cms/:path*'],
}
```

Cara kerja:
1. Setiap request ke `/cms/*` diperiksa session Supabase
2. Jika tidak ada user → redirect ke `/login`
3. Jika ada user → lanjutkan request

> **Catatan:** Di Next.js 16, file `middleware.ts` memunculkan deprecation warning:
> `The "middleware" file convention is deprecated. Please use "proxy" instead.`
> Untuk sekarang masih berfungsi normal.

---

### 6. Struktur Route

```
src/app/
├── (auth)/                  # Route group — TIDAK menambah URL segment
│   ├── layout.tsx
│   └── login/
│       └── page.tsx         # → URL: /login
│
├── cms/                     # Folder biasa — MENAMBAH URL segment
│   ├── layout.tsx           # Shared layout (sidebar + header)
│   ├── dashboard/
│   │   └── page.tsx         # → URL: /cms/dashboard
│   ├── posts/page.tsx       # → URL: /cms/posts
│   ├── panduan/page.tsx     # → URL: /cms/panduan
│   ├── media/page.tsx       # → URL: /cms/media
│   ├── settings/page.tsx    # → URL: /cms/settings
│   └── ai/page.tsx          # → URL: /cms/ai
│
├── layout.tsx               # Root layout
├── page.tsx                 # → redirect ke /login
└── globals.css
```

**Pelajaran penting:** Route groups `(nama)` hanya untuk organisasi file, tidak mempengaruhi URL. Jika ingin URL `/cms/dashboard`, folder harus benar-benar bernama `cms/`, bukan `(cms)/`.

---

### 7. Login Page

**`src/app/(auth)/login/page.tsx`** — Client Component

Fitur:
- Form validasi dengan `react-hook-form` + `zod`
- Schema: email valid + password min 6 karakter
- Error inline (merah) untuk validasi + error Supabase
- Loading state pada button
- Pada sukses → `router.push('/cms/dashboard')`
- Warna: background `#1a2e1a` (forest green), card `#f5f0e8` (parchment), aksen `#d4a017` (amber)

---

### 8. CMS Layout

**`src/app/cms/layout.tsx`** — Server Component
**`src/components/cms-layout-client.tsx`** — Client Component (interaktivitas)

Dipisah karena layout butuh server (fetch user dari Supabase) tapi sidebar butuh client (useState untuk mobile toggle).

Sidebar navigation:
| Icon | Label | Route |
|------|-------|-------|
| BarChart3 | Dashboard | /cms/dashboard |
| FileText | Blog Posts | /cms/posts |
| BookOpen | Panduan | /cms/panduan |
| Image | Media | /cms/media |
| Settings | Settings | /cms/settings |
| Sparkles | AI Generator | /cms/ai |

Header: user email + logout button
Mobile: hamburger menu + slide-in sidebar
Logout: `supabase.auth.signOut()` → redirect ke `/login`

---

### 9. Dashboard Page

**`src/app/cms/dashboard/page.tsx`** — Server Component

Fetch 4 stat cards dari Supabase:
- Published Posts (`posts` WHERE status='published')
- Draft Posts (`posts` WHERE status='draft')
- Total Panduan (`panduan` count)
- Media Files (`media` count)

Error handling: jika tabel belum ada (sebelum schema di-run), tampilkan 0, tidak crash.

---

### 10. Placeholder Pages

Semua route sidebar punya halaman agar tidak 404:
- `/cms/posts` — "Coming Soon (Part 2)"
- `/cms/panduan` — "Coming Soon (Part 2)"
- `/cms/media` — "Coming Soon (Part 4)"
- `/cms/settings` — "Coming Soon (Part 3)"
- `/cms/ai` — "Coming Soon (Part 5)"

---

### 11. Database Schema

**`supabase/schema.sql`** — jalankan manual di Supabase SQL Editor.

Tabel yang dibuat:
| Tabel | Fungsi |
|-------|--------|
| `posts` | Blog posts dengan kategori survival |
| `panduan` | Panduan teknis (bab referensi, QR slug) |
| `categories` | 6 kategori: air, energi, pangan, medis, keamanan, komunitas |
| `site_settings` | Key-value config (site name, tagline, dll) |
| `navigation` | Menu navigasi publik |
| `hero_section` | Konten hero homepage |
| `cta_section` | Call-to-action section |
| `footer` | Footer content + social links |
| `media` | Metadata file upload |

RLS (Row Level Security) aktif di semua tabel:
- Public: baca data published / aktif
- Authenticated: full CRUD

---

### 12. Deployment Config

**`railway.toml`**:
```toml
[build]
builder = "nixpacks"

[deploy]
startCommand = "npm run start"
healthcheckPath = "/"
healthcheckTimeout = 30
restartPolicyType = "on-failure"
```
