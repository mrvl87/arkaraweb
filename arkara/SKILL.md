---
name: arkara-frontend
description: Refactor dan kembangkan Arkara AstroJS frontend dengan desain "Retro Survival Manual 2.0". Gunakan skill ini untuk: menerapkan desain retro survival manual pada codebase AstroJS yang sudah ada, merefactor komponen dari style modern (rounded, glassmorphism, Playfair) ke style retro (ink-border, flat, mono), memperbarui global.css token, mengubah BaseLayout/PostLayout/HeroCarousel/PostCard/FeaturedPost, membuat halaman blog dan panduan bergaya retro, atau menambah komponen baru. Stack aktual: AstroJS 5.x, Tailwind CSS 4 via @tailwindcss/vite, Supabase (bukan file CMS), @aws-sdk S3 storage, SSR full. Trigger juga untuk: "update desain arkara", "refactor komponen", "tambah halaman baru", "implementasi retro manual style", "fix layout blog", "update token warna".
---

# Arkara Frontend — Refactor Guide (Retro Survival Manual 2.0)

Panduan refactor codebase AstroJS Arkara yang **sudah ada** ke desain Retro Survival Manual 2.0.

> **Stack aktual** (dari analisa codebase):
> - AstroJS 5.x, `output: 'server'` (SSR penuh)
> - Tailwind CSS 4 via `@tailwindcss/vite` (bukan plugin lama)
> - Supabase JS untuk data — BUKAN file-based CMS
> - `@aws-sdk/client-s3` untuk media storage (Tigris)
> - Railway deployment, `site: arkaraweb-production.up.railway.app`

---

## Struktur File Aktual

```
src/
├── components/
│   ├── blog/
│   │   ├── FeaturedPost.astro    ← direfactor
│   │   ├── PostCard.astro        ← direfactor
│   │   ├── PostHeader.astro      ← sudah jarang dipakai
│   │   ├── ReadingMeta.astro     ← direfactor
│   │   └── TableOfContents.astro ← direfactor
│   ├── home/
│   │   └── HeroCarousel.astro    ← direfactor (JS tetap sama)
│   └── ui/
│       ├── Badge.astro           ← minor update
│       ├── Button.astro          ← direfactor
│       ├── Card.astro            ← diganti pola card-ink
│       └── OptimizedImage.astro  ← TIDAK DIUBAH
├── layouts/
│   ├── BaseLayout.astro          ← direfactor (nav + footer)
│   └── PostLayout.astro          ← direfactor
├── lib/
│   ├── content.ts                ← TIDAK DIUBAH (Supabase queries)
│   ├── markdown.ts               ← TIDAK DIUBAH
│   ├── supabase.ts               ← TIDAK DIUBAH
│   ├── storage.ts                ← TIDAK DIUBAH
│   ├── openrouter.ts             ← TIDAK DIUBAH
│   └── wavespeed.ts              ← TIDAK DIUBAH
├── pages/
│   ├── index.astro               ← direfactor
│   ├── blog/
│   │   ├── index.astro           ← direfactor
│   │   └── [slug].astro          ← TIDAK DIUBAH (props sama)
│   └── panduan/
│       ├── index.astro           ← direfactor
│       └── [slug].astro          ← TIDAK DIUBAH (props sama)
└── styles/
    └── global.css                ← FULL REWRITE (token sistem)
```

**Aturan utama**: File `lib/`, `OptimizedImage.astro`, `[slug].astro` pages — **jangan diubah**. Semua props interface komponen dipertahankan agar backward compatible.

---

## Design Tokens Aktual

Ganti token lama (forest/brown/stone/amber/parchment) dengan:

```css
/* Masuk ke global.css — menggantikan semua :root lama */
:root {
  --cream:           #E8E0CC;   /* page bg — ganti --parchment */
  --cream-dark:      #D4C9A8;   /* dividers — ganti --sand */
  --paper:           #F0E8D0;   /* card surface */
  --paper-dark:      #DDD0B0;   /* card hover */
  --green-muted:     #6B8C6B;   /* brand primary — ganti --forest */
  --green-terminal:  #8FAF8F;   /* UI accent — ganti --amber */
  --green-dark:      #3D5C3D;   /* dark surface — ganti --ink */
  --yellow-manual:   #D8C58A;   /* highlights */
  --yellow-dark:     #B8A060;
  --red-warning:     #B85C5C;   /* danger — ganti --danger */
  --warm-grey:       #9B9080;   /* secondary text */
  --warm-grey-dark:  #6B6055;
  --ink:             #2A2218;   /* primary dark */
  --ink-light:       #3D3628;
}
```

### Font stack (ganti Playfair + Source Sans)

```css
/* Ganti di Google Fonts import */
@import url('https://fonts.googleapis.com/css2?family=Special+Elite&family=Share+Tech+Mono&family=Barlow:wght@400;500;600;700&family=Barlow+Condensed:wght@600;700;800&display=swap');
```

| Peran | Font Lama | Font Baru |
|---|---|---|
| Display/heading besar | Playfair Display | Barlow Condensed 800 |
| Body text | Source Sans 3 | Barlow 400/600 |
| Label/mono | JetBrains Mono | Share Tech Mono |
| Aksen kreatif | — | Special Elite |

---

## Pola Visual Utama

### Pengganti `rounded-*` dan `shadow-*`

```css
/* LAMA — jangan pakai lagi */
rounded-2xl shadow-xl hover:shadow-2xl

/* BARU — ink border + offset shadow */
.card-ink {
  border: 3px solid var(--ink);
  box-shadow: 5px 5px 0 var(--ink);
}
.card-ink:hover {
  transform: translate(-2px, -2px);
  box-shadow: 7px 7px 0 var(--ink);
}
```

### Pengganti `bg-gradient-to-br from-white` dan `backdrop-blur`

```css
/* LAMA */
bg-gradient-to-br from-white to-parchment/10
backdrop-blur-md bg-white/10

/* BARU */
background: var(--paper);
/* Tidak ada blur. Flat surface saja. */
```

### Pengganti category badge `bg-forest/90 backdrop-blur-md`

```css
/* BARU — mono terminal tag */
background: var(--ink);
border: 1px solid var(--green-terminal);
font-family: 'Share Tech Mono', monospace;
color: var(--green-terminal);
padding: 0.25rem 0.6rem;
font-size: 0.55rem;
letter-spacing: 0.18em;
text-transform: uppercase;
```

### VFX layers (tambah ke BaseLayout, bukan ke tiap halaman)

```html
<!-- Tiga elemen ini masuk sebelum <nav> di body BaseLayout -->
<div class="vfx-grain" aria-hidden="true"></div>
<div class="vfx-grid"  aria-hidden="true"></div>
<div class="vfx-bg"    aria-hidden="true"></div>
```

CSS-nya sudah ada di `global.css` yang direfactor.

---

## Komponen — Ringkasan Perubahan

### BaseLayout.astro
- Nav: `bg-sand` → `var(--ink)`, border bottom `var(--green-terminal)`
- Brand: `font-display text-3xl` → `Share Tech Mono` + terminal cursor blink
- Nav links: Tailwind hover → flat border style inline
- Footer: `bg-ink text-sand` tetap, tapi pakai mono font, status dot animasi
- Tambah 3 VFX layers sebelum nav

### PostLayout.astro
- Header: `bg-forest rounded-[3rem]` → `var(--ink)` + grid texture
- Judul: Playfair → Barlow Condensed uppercase
- Article card: `rounded-3xl shadow-2xl` → `card-ink` style
- Sidebar: `bg-forest rounded-3xl` → dark panel + terminal border
- Guide Buddy mini-mascot (SVG) menggantikan newsletter widget

### HeroCarousel.astro
- Background overlay: `backdrop-blur-[1px]` → flat dark overlay only
- Content card: `backdrop-blur-md rounded-[2.5rem] bg-white/10` → flat, no card
- CTA: `bg-amber-600 rounded-2xl` → `btn-primary` retro style
- Indicators: pills → `height:2px` dash bars
- Nav buttons: `backdrop-blur rounded-2xl` → square ink-border

### PostCard.astro
- Container: `bg-white rounded-2xl shadow-sm` → `card-ink` style
- Image: tambah `filter: saturate(0.65) contrast(1.08)`
- Category badge: glassmorphism → mono terminal tag
- Footer: `border-stone/5` → `border dashed`
- CTA: link text → small bordered button

### FeaturedPost.astro
- Container: `rounded-3xl hover:shadow-xl` → `card-ink`
- "Terbaru" badge: `rounded-xl font-black` → `stamp` style dengan rotate
- CTA: `rounded-2xl` → `btn-primary`

---

## Tailwind 4 Notes

Project ini pakai **Tailwind CSS 4** dengan `@tailwindcss/vite`. Di Tailwind 4:
- Custom token di `tailwind.config.mjs` berbeda dengan v3
- Lebih baik gunakan **CSS variables langsung** (`var(--ink)`) daripada class Tailwind untuk custom colors
- Utility classes seperti `flex`, `grid`, `hidden`, `md:block` tetap bekerja normal
- Jangan tambah `@tailwind base/components/utilities` — sudah diganti `@import "tailwindcss"` di global.css

```css
/* global.css — urutan import yang benar untuk TW4 */
@import url('..fonts..');
@import "tailwindcss";
/* Lalu semua custom CSS */
```

---

## Workflow Refactor

Urutan yang disarankan saat refactor:

1. **`src/styles/global.css`** — token baru dulu, semua file lain bergantung ini
2. **`src/layouts/BaseLayout.astro`** — nav + footer + VFX layers
3. **`src/components/home/HeroCarousel.astro`** — hero kesan pertama
4. **`src/components/blog/PostCard.astro`** — dipakai di 2 halaman
5. **`src/components/blog/FeaturedPost.astro`**
6. **`src/components/blog/ReadingMeta.astro`**
7. **`src/components/blog/TableOfContents.astro`**
8. **`src/layouts/PostLayout.astro`**
9. **`src/pages/index.astro`** — warning band + section labels
10. **`src/pages/blog/index.astro`**
11. **`src/pages/panduan/index.astro`**

---

## Cara Menerapkan Refactor ke Project

Skill ini digunakan dalam dua situasi berbeda — baca dulu situasinya, baru ikuti langkahnya.

---

### SITUASI A — Claude diminta menulis/edit file langsung

Saat user meminta refactor komponen tertentu (misal "refactor PostCard"), Claude:

1. Baca file asli dari project (user upload atau paste isinya)
2. Tulis ulang file tersebut mengikuti token dan pola di SKILL.md ini
3. Output file siap pakai — user tinggal **replace file lama di project mereka** dengan file baru

> Contoh: User bilang "refactor PostCard.astro ke retro style" →
> Claude baca `src/components/blog/PostCard.astro` yang ada →
> Tulis ulang dengan `card-ink`, mono label, desaturated image →
> Output file baru yang langsung bisa di-paste ke `src/components/blog/PostCard.astro` di project

---

### SITUASI B — User mendownload .skill file dan ingin apply sendiri

File `.skill` yang didownload adalah arsip ZIP berisi folder `refactored/` dengan semua file yang sudah direfactor. Langkah untuk user:

**1. Extract file .skill**
```bash
# .skill adalah file ZIP — rename dulu
cp arkara-frontend.skill arkara-frontend.zip
unzip arkara-frontend.zip -d arkara-refactored
```

**2. Masuk ke folder project Arkara kamu**
```bash
cd /path/ke/project/arkara   # folder yang berisi src/, package.json, astro.config.mjs
```

**3. Backup file lama (opsional tapi disarankan)**
```bash
cp -r src src_backup
```

**4. Copy semua file hasil refactor ke dalam src/ project**
```bash
cp arkara-refactored/arkara-frontend-v2/refactored/src/styles/global.css            src/styles/global.css
cp arkara-refactored/arkara-frontend-v2/refactored/src/layouts/BaseLayout.astro     src/layouts/BaseLayout.astro
cp arkara-refactored/arkara-frontend-v2/refactored/src/layouts/PostLayout.astro     src/layouts/PostLayout.astro
cp arkara-refactored/arkara-frontend-v2/refactored/src/components/home/HeroCarousel.astro  src/components/home/HeroCarousel.astro
cp arkara-refactored/arkara-frontend-v2/refactored/src/components/blog/PostCard.astro      src/components/blog/PostCard.astro
cp arkara-refactored/arkara-frontend-v2/refactored/src/components/blog/FeaturedPost.astro  src/components/blog/FeaturedPost.astro
cp arkara-refactored/arkara-frontend-v2/refactored/src/components/blog/ReadingMeta.astro   src/components/blog/ReadingMeta.astro
cp arkara-refactored/arkara-frontend-v2/refactored/src/components/blog/TableOfContents.astro src/components/blog/TableOfContents.astro
cp arkara-refactored/arkara-frontend-v2/refactored/src/pages/index.astro            src/pages/index.astro
cp arkara-refactored/arkara-frontend-v2/refactored/src/pages/blog/index.astro       src/pages/blog/index.astro
cp arkara-refactored/arkara-frontend-v2/refactored/src/pages/panduan/index.astro    src/pages/panduan/index.astro
```

**5. Jalankan dev server untuk verifikasi**
```bash
npm run dev
# Buka http://localhost:4321 — tampilan sudah berubah ke Retro Survival Manual 2.0
```

**File yang TIDAK perlu dicopy / TIDAK diubah:**
- `src/lib/*` — semua logic Supabase, markdown, storage tetap sama
- `src/components/ui/OptimizedImage.astro` — tidak berubah
- `src/pages/blog/[slug].astro` — tidak berubah, props sudah kompatibel
- `src/pages/panduan/[slug].astro` — tidak berubah
- `astro.config.mjs`, `package.json` — tidak berubah

---

## Extension Points

| Yang ingin ditambah | Dimana | Catatan |
|---|---|---|
| Halaman baru | `src/pages/` | Gunakan BaseLayout, ikuti pola section-label |
| Komponen baru | `src/components/` | Ikuti pola card-ink + mono label |
| Token warna baru | `global.css` :root | Pakai CSS var, bukan Tailwind class |
| Konten type baru | `src/lib/content.ts` | Tambah Supabase query |
| Kategori baru | `index.astro` + `blog/index.astro` | Update array `categories` |
| Pose mascot baru | Buat SVG 120×140 inline | Ikuti pola pose thumbsup/thinking/alert |

---

## Reference Files

- `references/design-tokens.md` — CSS lengkap semua token, VFX, animasi
- `references/components.md` — Kode komponen lengkap (termasuk GuideBuddy 3 pose)
- `references/cms-api-contract.md` — API contract dengan custom Next.js CMS
- `references/deployment.md` — Railway config, env vars
