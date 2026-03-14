## Engineering Tasks

### T1: Dependency & Core Configuration
- **Scope**: [package.json](file:///g:/My%20Own%20Project/Buku%201/Web/arkara/package.json), `studiocms.config.mjs`, [astro.config.mjs](file:///g:/My%20Own%20Project/Buku%201/Web/arkara/astro.config.mjs)
- **Action**: Install StudioCMS plugins, buat file config, dan update integrasi Astro.
- **Acceptance Criteria**: `npm run dev` dapat dijalankan tanpa error konfigurasi.

### T2: Environment & Database Init
- **Scope**: `.env`, [.env.example](file:///g:/My%20Own%20Project/Buku%201/Web/arkara/.env.example), Turso DB
- **Action**: Konfigurasi Turso DB URL & Token. Jalankan migrasi schema.
- **Acceptance Criteria**: Perintah `npm run studiocms migrate --latest` berhasil dieksekusi.

### T3: AI Libs Refactor (OpenRouter)
- **Scope**: [src/lib/openrouter.ts](file:///g:/My%20Own%20Project/Buku%201/Web/arkara/src/lib/openrouter.ts)
- **Action**: Update prompt sistem Arkara dan dukungan model sesuai [Skill.md](file:///g:/My%20Own%20Project/Buku%201/Web/SKILL/Skill.md).
- **Acceptance Criteria**: Fungsi [generateContent](file:///g:/My%20Own%20Project/Buku%201/Web/arkara/src/lib/openrouter.ts#18-51) mengembalikan teks dengan format yang benar saat di-test manual.

### T4: AI Libs Refactor (Wavespeed & Storage)
- **Scope**: [src/lib/wavespeed.ts](file:///g:/My%20Own%20Project/Buku%201/Web/arkara/src/lib/wavespeed.ts), [src/lib/storage.ts](file:///g:/My%20Own%20Project/Buku%201/Web/arkara/src/lib/storage.ts)
- **Action**: Implementasi polling image gen dan upload logic ke S3.
- **Acceptance Criteria**: Alur "Generate -> Poll -> Upload" berhasil menghasilkan URL S3 yang valid.

### T5: AI API Endpoints
- **Scope**: `src/pages/api/generate-content.ts`, `src/pages/api/generate-image.ts`
- **Action**: Buat endpoint POST untuk integrasi Dashboard.
- **Acceptance Criteria**: `curl` ke endpoint mengembalikan payload JSON (teks/URL gambar).

### T6: Panduan Detail Page Refactor
- **Scope**: `src/pages/panduan/[slug].astro`
- **Action**: Ganti `getCollection` dengan SDK StudioCMS (`sdk.GET.databaseEntry.bySlug`).
- **Acceptance Criteria**: Halaman `/panduan/[slug]` menampilkan konten dari database Turso.

### T7: Blog System Refactor
- **Scope**: [src/pages/blog/index.astro](file:///g:/My%20Own%20Project/Buku%201/Web/arkara/src/pages/blog/index.astro), `src/pages/blog/[slug].astro`
- **Action**: Migrasi routing blog ke `@studiocms/blog` atau SDK.
- **Acceptance Criteria**: Daftar artikel dan konten artikel terbaca dari database.

### T8: Homepage Integration
- **Scope**: [src/pages/index.astro](file:///g:/My%20Own%20Project/Buku%201/Web/arkara/src/pages/index.astro)
- **Action**: Fetch "recent posts" dari StudioCMS SDK.
- **Acceptance Criteria**: Beranda menampilkan artikel terbaru dari database.

---

## Verification Plan

### Database Connectivity
```bash
npm run studiocms migrate --latest
```

### AI Endpoint Test
```bash
curl -X POST http://localhost:4321/api/generate-content -H "Content-Type: application/json" -d '{"prompt":"filter air","model":"google/gemini-flash-1.5","type":"blog"}'
```

### CMS Dashboard
- Verifikasi akses ke `/start` (untuk setup pertama) dan `/dashboard`.
