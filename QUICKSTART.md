# ⚡ Arkara Quick Start Guide

Panduan singkat untuk menjalankan Arkara dalam 5 menit.

---

## 🚀 Setup Cepat (5 Menit)

### 1️⃣ Install Dependencies (2 menit)

```bash
cd arkara
npm install
```

### 2️⃣ Setup Database (1 menit)

```bash
# Database sudah dikonfigurasi otomatis di .env
# Jalankan migrasi
npx studiocms migrate --latest
```

### 3️⃣ Start Dev Server (1 menit)

```bash
npm run dev
```

**Output:**
```
astro v5.18.1 ready in 823 ms

┃ Local    http://localhost:4321/
```

### 4️⃣ Buka di Browser

Kunjungi: **http://localhost:4321/**

✅ **Done!** Arkara sudah running.

---

## 📝 Common Commands

```bash
# Start development server
npm run dev

# Build untuk production
npm run build

# Preview production build
npm run preview

# Database migration
npx studiocms migrate --latest

# Check database status
npx studiocms migrate --status
```

---

## 🧪 Test API Endpoints

### Terminal 1: Start Server
```bash
npm run dev
```

### Terminal 2: Test Endpoint

**Content Generation:**
```bash
curl -X POST http://localhost:4321/api/generate-content \
  -H "Content-Type: application/json" \
  -d '{"prompt":"filter air","model":"anthropic/claude-haiku-4-5","type":"blog"}'
```

**Image Generation:**
```bash
curl -X POST http://localhost:4321/api/generate-image \
  -H "Content-Type: application/json" \
  -d '{"prompt":"water pump","style":"line-art"}'
```

---

## 🔧 Environment Variables

File `.env` sudah ter-setup untuk development:

```bash
# Database (SQLite lokal)
CMS_LIBSQL_URL=file:./data/studio.db
TURSO_CONNECTION_URL=file:./data/studio.db

# Encryption key (sudah valid)
CMS_ENCRYPTION_KEY=X5Naur2MOLYVEco8h5WxCQ==

# Port
PORT=3000
```

**Optional (untuk AI features):**
```bash
# Dapatkan dari https://openrouter.ai
OPENROUTER_API_KEY=sk-or-...

# Dapatkan dari https://app.wavespeed.ai
WAVESPEED_API_KEY=...
```

---

## 📂 Project Structure

```
arkara/
├── src/pages/
│   ├── index.astro          # Homepage
│   ├── blog/
│   │   ├── index.astro      # Blog listing
│   │   └── [slug].astro     # Article detail
│   ├── panduan/
│   │   └── [slug].astro     # Guide detail
│   └── api/
│       ├── generate-content.ts
│       └── generate-image.ts
├── src/components/          # Reusable components
├── src/lib/                 # Helper libraries
├── .env                     # Configuration (sudah setup)
├── data/
│   └── studio.db           # Database (auto-created)
└── package.json
```

---

## 🐛 Troubleshooting Cepat

| Problem | Solution |
|---------|----------|
| Port 4321 sudah dipakai | `PORT=3001 npm run dev` |
| Database error | `npx studiocms migrate --latest` |
| Dependencies error | `rm -r node_modules && npm install` |
| Module not found | `npm install` ulang |

---

## 📚 Dokumentasi Lengkap

Lihat [WALKTHROUGH.md](./WALKTHROUGH.md) untuk:
- Instalasi detail step-by-step
- Database management
- Customization guide
- Production deployment
- Advanced troubleshooting

---

## ✨ Features

- ✅ Homepage dengan hero section
- ✅ Blog dengan multiple categories
- ✅ AI text generation (OpenRouter)
- ✅ AI image generation (Wavespeed)
- ✅ S3 image storage (Tigris/R2)
- ✅ StudioCMS integration ready
- ✅ Tailwind CSS styling
- ✅ Dark mode ready
- ✅ Mobile responsive

---

**Next Steps:**
1. Explore homepage at `http://localhost:4321/`
2. Check blog at `/blog`
3. Read [WALKTHROUGH.md](./WALKTHROUGH.md) untuk setup advanced
4. Setup API keys untuk AI features

Happy coding! 🎉
