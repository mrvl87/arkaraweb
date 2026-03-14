# 🏕️ Arkara - Local Development Walkthrough

> Platform pengetahuan survival Indonesia | Survive with Knowledge

Dokumentasi lengkap untuk menjalankan Arkara secara lokal di komputer Anda.

---

## 📋 Daftar Isi

1. [Prasyarat](#prasyarat)
2. [Instalasi](#instalasi)
3. [Konfigurasi](#konfigurasi)
4. [Menjalankan Dev Server](#menjalankan-dev-server)
5. [Testing API Endpoints](#testing-api-endpoints)
6. [Database Management](#database-management)
7. [Struktur Proyek](#struktur-proyek)
8. [Troubleshooting](#troubleshooting)

---

## 🔧 Prasyarat

Pastikan Anda sudah menginstall:

### Wajib:
- **Node.js** >= 22.12.0
  - Download dari: https://nodejs.org/
  - Verify: `node --version` dan `npm --version`

- **Git** (opsional, untuk version control)
  - Download dari: https://git-scm.com/

### Opsional tapi Recommended:
- **cURL** (untuk testing API)
  - Windows: Included dengan Windows 10+, atau gunakan PowerShell
  - macOS: `brew install curl`
  - Linux: `sudo apt-get install curl`

- **Visual Studio Code** (editor)
  - Download dari: https://code.visualstudio.com/

---

## 📦 Instalasi

### 1. Clone atau Ekstrak Project

```bash
# Jika menggunakan git
git clone <repository-url>
cd arkara

# Atau jika sudah ter-download, buka folder arkara
cd "G:\My Own Project\Buku 1\Web\arkara"
```

### 2. Install Dependencies

```bash
# Install semua package npm
npm install

# Proses ini akan mengdownload ~1GB+ data
# Waktu: 3-10 menit tergantung kecepatan internet
```

**Output yang diharapkan:**
```
added 1078 packages, audited 1078 packages in 2m 45s
289 packages are looking for funding
```

### 3. Verify Instalasi

```bash
# Cek Astro CLI
npm list astro

# Expected: astro@5.18.1

# Cek StudioCMS CLI
npx studiocms --help

# Expected: StudioCMS CLI Utility Toolkit v0.4.4
```

---

## ⚙️ Konfigurasi

### 1. Buat File `.env`

File `.env` sudah ada di dalam proyek. Jika belum, salin dari `.env.example`:

```bash
# Windows (PowerShell)
Copy-Item .env.example .env

# macOS/Linux
cp .env.example .env
```

### 2. Edit File `.env`

Buka `arkara/.env` dengan editor favorit Anda dan atur nilai-nilai berikut:

**Konfigurasi Minimum untuk Development:**

```bash
# === DATABASE ===
# SQLite lokal (untuk development)
CMS_LIBSQL_URL=file:./data/studio.db
TURSO_CONNECTION_URL=file:./data/studio.db

# === ENCRYPTION ===
# Key 16 bytes (base64) - SUDAH DIKONFIGURASI
CMS_ENCRYPTION_KEY=X5Naur2MOLYVEco8h5WxCQ==

# === AI GENERATION (Optional untuk testing)
# OpenRouter - dapatkan dari https://openrouter.ai
OPENROUTER_API_KEY=sk-or-...

# Wavespeed - dapatkan dari https://app.wavespeed.ai
WAVESPEED_API_KEY=...

# === S3 STORAGE (Optional untuk production)
S3_ENDPOINT=https://fly.storage.tigris.dev
S3_REGION=auto
S3_BUCKET_NAME=arkara-media
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
S3_PUBLIC_URL=https://arkara-media.fly.storage.tigris.dev

# === SITE CONFIG ===
PUBLIC_SITE_URL=https://arkara.id
NODE_ENV=development
PORT=3000
HOST=0.0.0.0
```

**Catatan:**
- Database dan encryption key sudah dikonfigurasi untuk development
- API keys untuk OpenRouter dan Wavespeed opsional untuk development
- S3 bucket hanya diperlukan untuk production

### 3. Inisialisasi Database

```bash
# Jalankan migrasi database
npx studiocms migrate --latest

# Expected output:
# ┌  StudioCMS Migrator - initializing...
# ◆  Migration "20251025T040912_init" was executed successfully
# ◆  Migration "20251130T150847_drop_deprecated" was executed successfully
# ◆  Migration "20251221T002125_url-mapping" was executed successfully
# └  Database migrated to latest version!
```

---

## 🚀 Menjalankan Dev Server

### 1. Start Development Server

```bash
# Terminal/Command Prompt
npm run dev

# Expected output:
# astro v5.18.1 ready in 823 ms
#
# ┃ Local    http://localhost:4321/
# ┃ Network  use --host to expose
#
# watching for file changes...
```

### 2. Akses Website

Buka browser dan kunjungi:
- **Homepage**: http://localhost:4321/
- **Blog**: http://localhost:4321/blog
- **Panduan**: http://localhost:4321/panduan

### 3. Menu dan Fitur

**Homepage (/)**
- Menampilkan hero section dengan tagline "Survive with Knowledge"
- Menampilkan 3 artikel terbaru
- Kategori pengetahuan (Air, Energi, Pangan, dll)
- Call-to-action untuk panduan teknis

**Blog (/blog)**
- Daftar semua artikel
- Filter berdasarkan kategori
- Card view untuk setiap artikel

**Blog Detail (/blog/[slug])**
- Konten lengkap artikel
- Metadata (tanggal, kategori, penulis)
- MDX rendering untuk formatting

**Panduan (/panduan)**
- Belum ada konten (placeholder untuk StudioCMS)
- Ready untuk integrasi database

### 4. Stop Dev Server

```bash
# Tekan Ctrl+C pada terminal
# Atau buka terminal baru jika Anda menjalankan dengan &
```

---

## 🧪 Testing API Endpoints

### Prasyarat Testing

Pastikan dev server sudah running (`npm run dev`)

### 1. Test Content Generation Endpoint

**Endpoint:** `POST /api/generate-content`

**Dengan cURL (Windows PowerShell):**
```powershell
$body = @{
    prompt = "filter air bersih dari sumber tidak jelas"
    model = "anthropic/claude-haiku-4-5"
    type = "blog"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:4321/api/generate-content" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body
```

**Dengan cURL (Linux/macOS):**
```bash
curl -X POST http://localhost:4321/api/generate-content \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "filter air bersih dari sumber tidak jelas",
    "model": "anthropic/claude-haiku-4-5",
    "type": "blog"
  }'
```

**Expected Response (tanpa API key):**
```json
{"error":"Error: OpenRouter error: 401"}
```
> 401 = unauthorized (expected jika belum set API key)

**Dengan API Key Valid:**
```json
{
  "content": "# Filter Air Bersih\n\nBagaimana cara menyaring air dari sumber yang tidak jelas..."
}
```

### 2. Test Image Generation Endpoint

**Endpoint:** `POST /api/generate-image`

**Dengan cURL (Windows PowerShell):**
```powershell
$body = @{
    prompt = "manual hand pump water system beside Indonesian bamboo house"
    style = "line-art"
    uploadToS3 = $false
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:4321/api/generate-image" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body
```

**Dengan cURL (Linux/macOS):**
```bash
curl -X POST http://localhost:4321/api/generate-image \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "manual hand pump water system",
    "style": "line-art",
    "uploadToS3": false
  }'
```

**Expected Response (tanpa API key):**
```json
{"error":"Error: Wavespeed API error"}
```

**Dengan API Key Valid:**
```json
{
  "url": "https://..." ,
  "source": "wavespeed"
}
```

### 3. Test Invalid Request

```bash
# Test missing required field
curl -X POST http://localhost:4321/api/generate-content \
  -H "Content-Type: application/json" \
  -d '{}'

# Expected response:
# {"error":"Missing required fields: prompt, model"}
```

---

## 🗄️ Database Management

### 1. Struktur Database

```
data/
└── studio.db          # SQLite database file (otomatis dibuat)
```

### 2. Lihat Status Migrasi

```bash
npx studiocms migrate --status

# Expected output:
# ✓ 20251025T040912_init
# ✓ 20251130T150847_drop_deprecated
# ✓ 20251221T002125_url-mapping
```

### 3. Reset Database (⚠️ Destructive)

```bash
# Backup terlebih dahulu
copy data\studio.db data\studio.db.backup

# Hapus database
rm data\studio.db

# Re-migrate
npx studiocms migrate --latest
```

### 4. Menggunakan Turso Cloud Database (Production)

Ketika siap untuk production:

1. Buat akun di https://turso.tech/
2. Buat database baru
3. Copy connection string
4. Update `.env`:
```bash
CMS_LIBSQL_URL=libsql://db-name-xxxx.turso.io
TURSO_AUTH_TOKEN=eyJ0eXA...
```

---

## 📁 Struktur Proyek

```
arkara/
├── src/
│   ├── pages/
│   │   ├── index.astro              # Homepage
│   │   ├── blog/
│   │   │   ├── index.astro          # Blog listing
│   │   │   └── [slug].astro         # Blog detail
│   │   ├── panduan/
│   │   │   └── [slug].astro         # Guide detail
│   │   └── api/
│   │       ├── generate-content.ts  # AI text generation
│   │       └── generate-image.ts    # AI image generation
│   │
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.astro
│   │   │   ├── Card.astro
│   │   │   └── Badge.astro
│   │   └── blog/
│   │       ├── PostCard.astro
│   │       ├── PostHeader.astro
│   │       └── TableOfContents.astro
│   │
│   ├── layouts/
│   │   ├── BaseLayout.astro
│   │   └── PostLayout.astro
│   │
│   ├── lib/
│   │   ├── openrouter.ts           # OpenRouter AI client
│   │   ├── wavespeed.ts            # Image generation client
│   │   └── storage.ts              # S3/Tigris client
│   │
│   └── styles/
│       └── global.css               # Design tokens
│
├── .env                             # Environment variables
├── .env.example                     # Template env
├── astro.config.mjs                 # Astro configuration
├── studiocms.config.mjs             # StudioCMS configuration
├── tailwind.config.mjs              # Tailwind CSS config
├── package.json                     # Dependencies & scripts
├── data/
│   └── studio.db                   # SQLite database
└── dist/                            # Build output (auto-generated)
```

---

## 🐛 Troubleshooting

### Problem: Port 4321 sudah digunakan

**Error:**
```
Error: EADDRINUSE: address already in use :::4321
```

**Solusi:**

```bash
# Opsi 1: Kill process yang menggunakan port 4321
# Windows (PowerShell)
Get-Process | Where-Object {$_.Handles -like '*4321*'} | Stop-Process -Force

# Opsi 2: Gunakan port berbeda
PORT=3001 npm run dev

# Opsi 3: Tunggu beberapa detik dan coba lagi
```

### Problem: Database error "unable to open"

**Error:**
```
ConnectionFailed("Unable to open connection to local database")
```

**Solusi:**

```bash
# 1. Pastikan folder data/ ada
mkdir data

# 2. Pastikan file .env memiliki path yang benar
# TURSO_CONNECTION_URL=file:./data/studio.db

# 3. Re-migrate database
npx studiocms migrate --latest
```

### Problem: Command not found - npm

**Error:**
```
npm: command not found
```

**Solusi:**

```bash
# 1. Reinstall Node.js dari https://nodejs.org/
# 2. Restart terminal/command prompt
# 3. Verify
node --version
npm --version
```

### Problem: ESM Loader Error (Windows)

**Error:**
```
Only URLs with a scheme in: file, data, and node are supported
```

**Solusi:**
- Error ini adalah issue Windows-specific dengan studiocms
- Tidak mempengaruhi dev server Astro
- Akan teratasi ketika deploy ke production (Unix environment)
- Workaround: Gunakan WSL2 (Windows Subsystem for Linux)

```bash
# WSL2 installation
wsl --install
wsl
cd /mnt/g/My\ Own\ Project/Buku\ 1/Web/arkara
npm run dev
```

### Problem: Out of Memory saat npm install

**Error:**
```
JavaScript heap out of memory
```

**Solusi:**

```bash
# Increase Node.js memory limit
NODE_OPTIONS=--max_old_space_size=4096 npm install
```

### Problem: Dependencies conflict

**Error:**
```
ERESOLVE unable to resolve dependency tree
```

**Solusi:**

```bash
# Clean install
rm -r node_modules package-lock.json
npm install --legacy-peer-deps
```

---

## 📖 Panduan Lengkap Fitur

### Blog Management

**Menambah Artikel Baru:**
- Artikel disimpan di `src/content/blog/` (Astro Content Collection)
- Format: MDX (Markdown + JSX)
- Field required: title, description, publishDate, category, content
- Akan otomatis muncul di homepage dan blog listing

**Kategori Artikel:**
- Air 💧
- Energi ⚡
- Pangan 🌾
- Medis ⚕️
- Keamanan 🛡️
- Komunitas 👥

### API Integration

**Content Generation:**
```bash
# Generate blog article
curl -X POST http://localhost:4321/api/generate-content \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Cara membuat filter sederhana",
    "model": "anthropic/claude-haiku-4-5",
    "type": "blog"
  }'

# Generate technical guide
curl -X POST http://localhost:4321/api/generate-content \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Membuat pompa air manual",
    "model": "anthropic/claude-haiku-4-5",
    "type": "panduan"
  }'
```

**Image Generation:**
```bash
# Generate line-art illustration
curl -X POST http://localhost:4321/api/generate-image \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "wooden water filter system",
    "style": "line-art"
  }'

# Generate semi-realistic illustration
curl -X POST http://localhost:4321/api/generate-image \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Indonesian survival kit",
    "style": "semi-illustrative",
    "uploadToS3": true
  }'
```

---

## 🎨 Customization

### Ubah Brand Colors

Edit `src/styles/global.css`:

```css
:root {
  --forest:    #1F3D2B;   /* Primary green */
  --brown:     #6B4F3A;   /* Secondary brown */
  --stone:     #5C5F61;   /* Text gray */
  --amber:     #D98C2B;   /* Accent orange */
  --moss:      #6E8B3D;   /* Success green */
  --sand:      #E6D8B5;   /* Light beige */
  --parchment: #F5F0E8;   /* Page background */
  --ink:       #1A1208;   /* Dark mode */
}
```

### Ubah Typography

Edit `src/styles/global.css` atau `tailwind.config.mjs`:

```css
/* Font imports di global.css */
@import url('https://fonts.googleapis.com/css2?family=...');

/* Font families */
body {
  font-family: 'Source Sans 3', system-ui, sans-serif;
}

h1, h2, h3 {
  font-family: 'Playfair Display', Georgia, serif;
}

code {
  font-family: 'JetBrains Mono', monospace;
}
```

---

## 📚 Referensi & Resources

### Official Documentation
- [Astro Docs](https://docs.astro.build/)
- [StudioCMS Docs](https://docs.studiocms.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [OpenRouter API](https://openrouter.ai/docs)
- [Wavespeed API](https://docs.wavespeed.ai/)

### Project References
- [Implementation Plan](./implementation_plan.md)
- [Arkara Ecosystem Skill](./SKILL/Skill.md)
- [Brand Design Tokens](./SKILL/References/brand-tokens.md)

---

## 💡 Tips & Tricks

### Development Speed
```bash
# Run with faster rebuild
npm run dev

# Check specific page
http://localhost:4321/blog/[slug]

# View page source
Ctrl+U pada browser
```

### Debug Mode
```bash
# Enable verbose logging
npm run dev -- --verbose

# Check build errors
npm run build
```

### Hot Reload
- Astro otomatis reload ketika file `.astro` berubah
- Untuk CSS: reload otomatis
- Untuk JS: refresh browser jika diperlukan

### Production Build

```bash
# Build untuk production
npm run build

# Preview build locally
npm run preview

# Deploy ke Railway (jika sudah dikonfigurasi)
railway up
```

---

## 📞 Bantuan & Support

Jika mengalami masalah:

1. **Baca Troubleshooting section** di atas
2. **Check error message** dengan teliti
3. **Google error message** (biasanya ada solusinya)
4. **Check StudioCMS/Astro docs** untuk dokumentasi resmi
5. **Open GitHub issue** jika bug ditemukan

---

## ✅ Checklist Proses Setup

- [ ] Node.js >= 22.12.0 installed
- [ ] Project extracted/cloned
- [ ] `npm install` completed
- [ ] `.env` file configured
- [ ] `npx studiocms migrate --latest` successful
- [ ] `npm run dev` running without errors
- [ ] Browser shows homepage at `http://localhost:4321/`
- [ ] API endpoints responding to POST requests
- [ ] Database working (`data/studio.db` exists)

✨ **Selamat! Anda siap mengembangkan Arkara secara lokal!**

---

**Last Updated:** 14 Maret 2026
**Astro Version:** 5.18.1
**Node.js Minimum:** 22.12.0
**License:** MIT
