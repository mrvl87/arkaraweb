# 🚀 Arkara Railway Deploy Guide
# Catatan lengkap hasil debugging deployment StudioCMS ke Railway
# Dibuat: 14 Maret 2026

## ============================================================
## RINGKASAN MASALAH & SOLUSI YANG DITEMUKAN
## ============================================================

### 1. Root Directory
- Railway tidak menemukan project karena `package.json` ada di subfolder `arkara/`
- **Solusi**: Set Root Directory = `arkara` di Railway Settings

### 2. Site Configuration (Astro)
- StudioCMS memerlukan properti `site` di `astro.config.mjs`
- **Solusi**: Tambahkan `site: 'https://arkaraweb-production.up.railway.app'`

### 3. CMS_ENCRYPTION_KEY Format
- StudioCMS AuthKit membutuhkan **tepat 16-byte Base64-encoded key**
- Key acak biasa (32 karakter alfanumerik) TIDAK VALID
- **Solusi**: Generate dengan `node -e "console.log(crypto.randomBytes(16).toString('base64'))"`
- Hasil: string 24 karakter berakhiran `==` (contoh: `U4+Hu/K8HOwN2GcNrArjmA==`)

### 4. Environment Variables yang WAJIB di Railway
StudioCMS CLI & SDK membaca env vars dengan nama SPESIFIK:
- `CMS_LIBSQL_URL` → sama dengan TURSO_CONNECTION_URL (format: libsql://...)
- `CMS_LIBSQL_AUTH_TOKEN` → sama dengan TURSO_AUTH_TOKEN
- `CMS_ENCRYPTION_KEY` → 16-byte Base64 encoded
- `TURSO_CONNECTION_URL` → untuk studiocms.config.mjs
- `TURSO_AUTH_TOKEN` → untuk studiocms.config.mjs
- `HOST` → 0.0.0.0
- `PORT` → 3000

### 5. Database Migration
- Tabel database HARUS dibuat sebelum dashboard bisa digunakan
- Tidak bisa dilakukan di startCommand (menyebabkan Healthcheck failed)
- **Solusi**: Endpoint `/api/cms/force-migrate` yang memanggil CLI via child_process

### 6. Rendering Plugin
- StudioCMS memerlukan minimal satu rendering plugin
- **Solusi**: Install `@studiocms/md` dan daftarkan di `studiocms.config.mjs`

### 7. Route Collision (/)
- StudioCMS Setup Page mendaftarkan rute `/` yang bentrok dengan `src/pages/index.astro`
- **Solusi**: Set `dbStartPage: false` di config setelah setup selesai

### 8. Dashboard Enabled
- Dashboard hanya aktif jika `dbStartPage: false` DAN `dashboardEnabled: true`
- **Solusi**: Tambahkan `dashboardConfig: { dashboardEnabled: true }` di config

## ============================================================
## DAFTAR LENGKAP ENV VARS DI RAILWAY
## ============================================================

# Database (Turso) - WAJIB duplikat dengan 2 format nama
TURSO_CONNECTION_URL=libsql://nama-db.turso.io
TURSO_AUTH_TOKEN=eyJ...token...
CMS_LIBSQL_URL=libsql://nama-db.turso.io          # SAMA dengan TURSO_CONNECTION_URL
CMS_LIBSQL_AUTH_TOKEN=eyJ...token...               # SAMA dengan TURSO_AUTH_TOKEN

# StudioCMS Auth
CMS_ENCRYPTION_KEY=<16-byte-base64>                # Generate: node -e "console.log(crypto.randomBytes(16).toString('base64'))"

# S3 Storage (Tigris)
S3_ENDPOINT=https://fly.storage.tigris.dev
S3_REGION=auto
S3_BUCKET_NAME=arkara-media
S3_ACCESS_KEY_ID=<key>
S3_SECRET_ACCESS_KEY=<secret>
S3_PUBLIC_URL=https://arkara-media.fly.storage.tigris.dev

# AI APIs
OPENROUTER_API_KEY=sk-or-...
WAVESPEED_API_KEY=<key>

# Server
HOST=0.0.0.0
PORT=3000

## ============================================================
## URUTAN DEPLOY DARI NOL (FRESH)
## ============================================================
##
## 1. Push kode ke GitHub
## 2. Buat project di Railway, hubungkan ke repo GitHub
## 3. Set Root Directory = "arkara"
## 4. Isi SEMUA env vars di atas
## 5. Tunggu build & deploy berhasil (hijau)
## 6. Kunjungi /start → isi form konfigurasi situs
## 7. Kunjungi /api/cms/force-migrate → jalankan migrasi DB
## 8. Kunjungi /start lagi → selesaikan setup (buat akun admin)
## 9. Ganti config: dbStartPage → false, push ulang
## 10. Dashboard tersedia di /dashboard
##
## ============================================================
