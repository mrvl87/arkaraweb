# April 2026 Upgrade and Deploy Postmortem

Dokumen ini merangkum rangkaian upgrade, error, dan solusi yang diterapkan pada workspace `Arkaraweb.com` selama sesi upgrade besar April 2026.

Tujuan dokumen ini:
- menjadi referensi teknis saat deploy berikutnya
- mencegah investigasi ulang dari nol
- menjelaskan hubungan antara error Node, Railway, Docker, Astro, Next.js, Supabase, OpenRouter, dan dependency editor CMS

## Ringkasan Eksekutif

Dua aplikasi utama dalam repo ini:
- `arkara/`: frontend visitor site berbasis Astro
- `nextjsCMS/`: CMS berbasis Next.js

Perubahan besar yang terjadi:
- model konten CMS dipindah dari Gemini 2.0 Flash ke `deepseek/deepseek-v3.2`
- provider OpenRouter DeepSeek dipindah ke `deepinfra`
- recovery session Supabase CMS diperkuat
- `arkara` di-upgrade dari Astro 5 ke Astro 6
- deploy Railway untuk `arkara` dan `nextjsCMS` dipindah dari `nixpacks` ke Dockerfile eksplisit
- dependency editor CMS diselaraskan agar `npm ci` Docker tidak gagal

## Status Akhir yang Dianggap Benar

- `arkara` sudah di Astro 6
- `arkara` deploy Railway memakai `Dockerfile`
- `nextjsCMS` deploy Railway memakai `Dockerfile`
- kedua app punya `.nvmrc`
- CMS editor sekarang konsisten pada stack Tiptap v2
- build lokal untuk `arkara` dan `nextjsCMS` sama-sama lolos

File hasil akhir yang paling penting:
- [arkara/package.json](./arkara/package.json)
- [arkara/src/content.config.ts](./arkara/src/content.config.ts)
- [arkara/railway.toml](./arkara/railway.toml)
- [arkara/Dockerfile](./arkara/Dockerfile)
- [nextjsCMS/package.json](./nextjsCMS/package.json)
- [nextjsCMS/railway.toml](./nextjsCMS/railway.toml)
- [nextjsCMS/Dockerfile](./nextjsCMS/Dockerfile)
- [nextjsCMS/src/lib/ai/client.ts](./nextjsCMS/src/lib/ai/client.ts)

## Timeline Perubahan Penting

Commit penting dalam urutan kronologis akhir:
1. `cd01f82` `Recover stale Supabase CMS sessions`
2. `3bb8916` `Route DeepSeek CMS content through DeepInfra`
3. `206df5e` `Upgrade Arkara Astro site to Astro 6`
4. `37af6ac` `Pin Railway build to Node 23 for Astro 6`
5. `ad7b221` `Add .nvmrc for Astro 6 Node compatibility`
6. `4474b32` `Add .nvmrc for CMS Node compatibility`
7. `457fdb0` `Deploy Arkara Astro via Dockerfile on Railway`
8. `fbe1d67` `Deploy nextjsCMS via Dockerfile on Railway`
9. `c704873` `Align CMS Tiptap table extensions with Novel`
10. `6062ff2` `Downgrade tiptap-markdown for CMS editor compatibility`
11. `4f65a59` `Add missing CMS editor peer dependencies`
12. `4555bd7` `Pass public Supabase envs into CMS Docker build`

## Bagian 1: CMS AI

### Model konten utama

Default model konten CMS:
- sebelum: `google/gemini-2.0-flash-001`
- sesudah: `deepseek/deepseek-v3.2`

Lokasi:
- [nextjsCMS/src/lib/ai/client.ts](./nextjsCMS/src/lib/ai/client.ts)

### Provider OpenRouter

Provider awal sempat diarahkan ke `alibaba` karena latency, tetapi biaya terlalu tinggi.

Keputusan akhir:
- gunakan `deepseek/deepseek-v3.2`
- prioritaskan provider `deepinfra`
- fallback tetap aktif

Alasan:
- `deepinfra` lebih seimbang antara biaya dan stabilitas
- `alibaba` sangat cepat tetapi lebih mahal, terutama untuk output-heavy workloads seperti `Full Draft`

### Yang tidak diubah

Tetap dipertahankan:
- model anti-halusinasi / verifier GPT
- model image CMS

## Bagian 2: Auth CMS

Masalah yang terjadi:
- browser menampilkan `Invalid Refresh Token: Refresh Token Not Found`
- request AI panjang bisa gagal karena session refresh Supabase rusak

Solusi:
- stabilkan browser client Supabase per page
- tangkap refresh token error
- bersihkan session lokal jika stale
- redirect kembali ke `/login`

File utama:
- [nextjsCMS/src/app/(auth)/login/page.tsx](./nextjsCMS/src/app/%28auth%29/login/page.tsx)
- [nextjsCMS/src/components/cms-layout-client.tsx](./nextjsCMS/src/components/cms-layout-client.tsx)

Pelajaran:
- error AI setelah request lama tidak selalu berarti model bermasalah
- session browser stale bisa memutus request berikutnya dan terlihat seperti bug model

## Bagian 3: Upgrade Astro 5 ke Astro 6

### Sebelum upgrade

Versi sebelumnya:
- `astro ^5.18.1`
- `@astrojs/mdx ^4.0.0`
- `@astrojs/node ^9.0.0`
- `@astrojs/sitemap ^3.7.1`

### Setelah upgrade

Versi baru:
- `astro ^6.1.6`
- `@astrojs/mdx ^5.0.3`
- `@astrojs/node ^10.0.4`
- `@astrojs/sitemap ^3.7.2`

### Migrasi Content Collections

Masalah penting Astro 6:
- config lama `src/content/config.ts` adalah format legacy
- Astro 6 mengharapkan `src/content.config.ts`

Perubahan:
- hapus `arkara/src/content/config.ts`
- buat `arkara/src/content.config.ts`
- gunakan `glob()` loader dan `astro/zod`

File hasil akhir:
- [arkara/src/content.config.ts](./arkara/src/content.config.ts)

Pelajaran:
- upgrade Astro major tidak cukup hanya update version package
- content layer harus dimigrasikan juga agar build tetap valid

## Bagian 4: Node dan Railway

### Gejala yang muncul

Error yang sempat muncul selama deploy:
- Astro build memakai `Node 22.11.0`
- kadang juga muncul `Node 18.20.5`
- Astro 6 mensyaratkan `>=22.12.0`

Gejalanya membuat seolah-olah Astro 6 tidak kompatibel dengan Railway, padahal akar masalahnya adalah pemilihan runtime builder.

### Kenapa `engines.node` tidak cukup

`package.json` hanya menyatakan kompatibilitas package, bukan memaksa image Docker builder.

Contoh:
- `>=22.12.0` masih bisa membuat builder memilih major `22`
- jika image aktualnya `22.11.0`, Astro tetap menolak build

### Solusi awal

Sempat ditambahkan:
- `.nvmrc` pada `arkara`
- `.nvmrc` pada `nextjsCMS`
- env `NIXPACKS_NODE_VERSION`

Ini membantu sebagai sinyal, tetapi tidak cukup deterministik untuk Railway dalam kasus ini.

### Solusi final

Deploy kedua app dipindah ke Dockerfile eksplisit:
- [arkara/Dockerfile](./arkara/Dockerfile)
- [nextjsCMS/Dockerfile](./nextjsCMS/Dockerfile)

Hasil:
- versi Node tidak lagi ditebak builder
- runtime dan build image bisa dipastikan
- investigasi deploy jadi lebih sederhana

## Bagian 5: Deploy Final `arkara`

Railway config:
- [arkara/railway.toml](./arkara/railway.toml)

Status akhir:
- builder = `DOCKERFILE`
- memakai `Dockerfile`

Dockerfile:
- [arkara/Dockerfile](./arkara/Dockerfile)

Fungsi:
- build Astro dengan image Node eksplisit
- jalankan output server Astro dari `dist/server/entry.mjs`

Catatan Railway:
- Root Directory service website harus `arkara`

## Bagian 6: Deploy Final `nextjsCMS`

Railway config:
- [nextjsCMS/railway.toml](./nextjsCMS/railway.toml)

Status akhir:
- builder = `DOCKERFILE`
- memakai `Dockerfile`

Dockerfile:
- [nextjsCMS/Dockerfile](./nextjsCMS/Dockerfile)

Fungsi:
- build Next.js dengan image Node eksplisit
- menjalankan `next start`
- membawa public env ke build-time dan runtime

### Build-time public env

Masalah yang sempat muncul:
- route `/login` gagal saat prerender/build
- `@supabase/ssr` mengeluh `project URL and API key are required`

Penyebab:
- Docker build tidak otomatis mendapatkan `NEXT_PUBLIC_SUPABASE_*`
- stage `builder` tidak punya env yang dibutuhkan client bundle saat compile

Solusi:
- deklarasikan `ARG` dan `ENV` di Dockerfile untuk:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `NEXT_PUBLIC_SITE_URL`

Pelajaran:
- pada Next.js berbasis Docker, env public perlu tersedia saat build, bukan hanya runtime

## Bagian 7: Dependency CMS yang Tersingkap Saat Docker Build

Saat `npm ci` dijalankan di Docker, beberapa konflik yang sebelumnya lolos di local environment akhirnya muncul.

### Konflik Tiptap v2 vs v3

Masalah:
- `novel@1.0.2` masih di ekosistem Tiptap v2
- `@tiptap/extension-table*` dipasang di v3

Solusi:
- turunkan package table extension ke `^2.27.2`

### Konflik `tiptap-markdown`

Masalah:
- `tiptap-markdown@0.9.0` meminta `@tiptap/core ^3`
- CMS editor masih di `@tiptap/core 2.27.2`

Solusi:
- turunkan ke `tiptap-markdown ^0.8.10`

### Missing peer dependencies

Masalah:
- Docker `npm ci` mengeluh lockfile tidak sinkron
- peer berikut belum terkunci eksplisit:
  - `highlight.js`
  - `lowlight`

Solusi:
- tambahkan keduanya ke `package.json`

### Pelajaran dependency

- masalah ini bukan disebabkan oleh upgrade Node
- Node/Docker hanya membuat install menjadi benar-benar bersih
- konflik dependency yang sebelumnya tersembunyi akhirnya muncul

## Bagian 8: Checklist Railway Final

### Service `arkara`
- Root Directory: `arkara`
- Config file: `arkara/railway.toml`
- Build mode: Dockerfile
- Dockerfile: `arkara/Dockerfile`

### Service `nextjsCMS`
- Root Directory: `nextjsCMS`
- Config file: `nextjsCMS/railway.toml`
- Build mode: Dockerfile
- Dockerfile: `nextjsCMS/Dockerfile`

### Public env yang harus ada di `nextjsCMS`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_URL`

### Env yang penting untuk operasional CMS
- `OPENROUTER_API_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CMS_SERVICE_AUTHOR_ID`

Catatan:
- build bisa sukses tapi fitur bisa rusak jika env runtime tidak lengkap
- `/login` khususnya membutuhkan public Supabase env untuk compile/bundle

## Bagian 9: Error Map

### Error: Node.js is not supported by Astro

Arti:
- builder memilih Node terlalu tua

Langkah cek:
1. pastikan service menunjuk ke folder yang benar
2. pastikan builder memakai Dockerfile yang benar
3. pastikan redeploy memakai config terbaru

### Error: `npm ci` ERESOLVE could not resolve

Arti:
- dependency tree tidak konsisten
- biasanya peer dependency editor CMS belum selaras

Langkah cek:
1. cek stack `novel` / `@tiptap/*`
2. cek package yang masih menarik Tiptap v3
3. refresh lockfile dengan `npm install`

### Error: missing `NEXT_PUBLIC_SUPABASE_URL` / anon key during build

Arti:
- build Next membutuhkan env public saat compile

Langkah cek:
1. pastikan env ada di Railway service `nextjsCMS`
2. pastikan Dockerfile meneruskan env ke stage `builder`

## Bagian 10: Build Verification yang Sudah Dilakukan

Verifikasi lokal yang sudah dilakukan:
- `arkara`: `npm install`, `npm run build`
- `nextjsCMS`: `npm install`, `npm run build`

Artinya:
- error tersisa di Railway sekarang lebih mungkin karena config service, env, atau cache deploy
- bukan karena codebase lokal masih broken

## Bagian 11: Rekomendasi Setelah Ini

1. Setelah perubahan deploy besar, lakukan redeploy dengan cache clear jika tersedia.
2. Jangan menganggap `engines.node` sebagai pemaksa runtime builder.
3. Untuk app framework besar, pilih Dockerfile jika Railway/Nixpacks mulai tidak deterministik.
4. Untuk CMS editor berbasis `novel`, jaga semua package Tiptap tetap pada major yang sama.
5. Jika build error menyebut package app yang salah, cek Root Directory service dulu sebelum debugging kode.

## Referensi Terkait

- [README.md](./README.md)
- [DOCS_INDEX.md](./DOCS_INDEX.md)
- [DEPLOY_NOTES.md](./DEPLOY_NOTES.md)
- [arkara/references/deployment.md](./arkara/references/deployment.md)
- [nextjsCMS/docs/known-issues.md](./nextjsCMS/docs/known-issues.md)

Last updated: 14 April 2026
