# 🏕️ Arkara - Platform Pengetahuan Survival Indonesia

[![Astro](https://img.shields.io/badge/Astro-5.18.1-ff5d01?logo=astro)](https://astro.build)
[![Node.js](https://img.shields.io/badge/Node.js-22.12.0+-43853d?logo=node.js)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-blue)](#license)

> **Survive with Knowledge** - Platform pengetahuan survival dan kesiapan bencana untuk Indonesia

Arkara adalah website AstroJS full-stack yang menggabungkan:
- 📝 **Blog survival** dengan kategori: Air, Energi, Pangan, Medis, Keamanan, Komunitas
- 🤖 **AI Content Generation** via OpenRouter (text) dan Wavespeed (images)
- 🗄️ **Database-backed CMS** dengan StudioCMS dan Turso
- 📱 **Responsive Design** dengan Tailwind CSS
- ⚡ **Server-side Rendering** dengan Astro Node Adapter

---

## 🎯 Quick Links

| Panduan | Deskripsi |
|---------|-----------|
| 🚀 [**QUICKSTART.md**](./QUICKSTART.md) | **Setup dalam 5 menit** - Mulai di sini! |
| 📖 [**WALKTHROUGH.md**](./WALKTHROUGH.md) | Setup lengkap, troubleshooting, dan features |
| 👨‍💻 [**DEVELOPMENT_GUIDE.md**](./DEVELOPMENT_GUIDE.md) | Workflow development dan kontribusi |
| 📋 [**implementation_plan.md**](./implementation_plan.md) | Rencana teknis dan task checklist |

---

## ⚡ Quick Start (5 Menit)

```bash
# 1. Install dependencies
npm install

# 2. Setup database
npx studiocms migrate --latest

# 3. Start dev server
npm run dev

# 4. Buka di browser
# http://localhost:4321/
```

✅ **Done!** Arkara sudah running di `http://localhost:4321/`

---

## 📦 Tech Stack

### Frontend
- **Astro 5.18.1** - Full-stack web framework
- **Tailwind CSS 4** - Utility-first styling
- **TypeScript** - Type safety
- **MDX** - Markdown + JSX untuk content

### Backend
- **Node.js Adapter** - Server-side rendering
- **Astro API Routes** - Serverless functions
- **LibSQL/Turso** - SQLite database
- **DrizzleORM** - Database toolkit

### AI & Content
- **OpenRouter API** - Multi-model AI text generation
  - Claude (Anthropic)
  - Gemini (Google)
  - Llama (Meta)
  - DeepSeek
- **Wavespeed API** - Image generation (Nano Banana 2)
- **StudioCMS** - Headless CMS (beta)

### Storage & Deployment
- **AWS S3 / Tigris** - Image storage
- **Railway** - Deployment platform
- **GitHub** - Version control

---

## 🗂️ Project Structure

```
arkara/
├── 📄 README.md                    # File ini
├── 🚀 QUICKSTART.md               # Setup cepat 5 menit
├── 📖 WALKTHROUGH.md              # Dokumentasi lengkap
├── 👨‍💻 DEVELOPMENT_GUIDE.md       # Panduan developer
├── 📋 implementation_plan.md       # Task checklist
│
├── src/
│   ├── pages/
│   │   ├── index.astro            # Homepage
│   │   ├── blog/
│   │   │   ├── index.astro        # Blog listing
│   │   │   └── [slug].astro       # Article detail
│   │   ├── panduan/
│   │   │   └── [slug].astro       # Technical guides
│   │   └── api/
│   │       ├── generate-content.ts # AI text API
│   │       └── generate-image.ts   # AI image API
│   │
│   ├── components/
│   │   ├── ui/                    # Button, Card, Badge
│   │   └── blog/                  # PostCard, PostHeader
│   │
│   ├── layouts/
│   │   ├── BaseLayout.astro       # Main layout
│   │   └── PostLayout.astro       # Article layout
│   │
│   ├── lib/
│   │   ├── openrouter.ts          # AI text client
│   │   ├── wavespeed.ts           # Image gen client
│   │   └── storage.ts             # S3 upload
│   │
│   └── styles/
│       └── global.css             # Design tokens
│
├── .env                           # Configuration (setup otomatis)
├── .env.example                   # Template .env
├── package.json                   # Dependencies
├── astro.config.mjs               # Astro config
├── studiocms.config.mjs           # CMS config
├── tailwind.config.mjs            # Tailwind config
├── tsconfig.json                  # TypeScript config
└── data/
    └── studio.db                  # SQLite database
```

---

## 🚀 Features

### ✅ Sudah Implemented

- **Homepage** dengan hero section, featured articles, categories
- **Blog System** dengan multiple categories dan filtering
- **Responsive Design** - Mobile, tablet, desktop
- **API Endpoints** untuk content dan image generation
- **Database Integration** - SQLite (dev), Turso (prod)
- **Tailwind CSS** dengan Arkara design tokens
- **TypeScript** support untuk type safety
- **MDX Content** - Markdown + JSX rendering
- **Production Ready** - Build optimizations

### 🔜 Coming Soon

- **StudioCMS Dashboard** - Full CMS UI (Windows ESM issue)
- **Panduan/Guide System** - Database-backed technical guides
- **Search Functionality** - Full-text search
- **User Comments** - Community interaction
- **Email Newsletter** - Subscriber management
- **Analytics** - Traffic & engagement tracking

---

## 📝 Documentation

### Untuk Pemula
Mulai dengan [**QUICKSTART.md**](./QUICKSTART.md) untuk setup cepat 5 menit.

### Untuk Setup Detail
Baca [**WALKTHROUGH.md**](./WALKTHROUGH.md) untuk:
- Step-by-step installation
- Environment configuration
- Database management
- API testing
- Troubleshooting

### Untuk Developers
Lihat [**DEVELOPMENT_GUIDE.md**](./DEVELOPMENT_GUIDE.md) untuk:
- Development workflow
- Creating features
- Component development
- API development
- Code style guidelines
- Git workflow

### Untuk Project Management
Periksa [**implementation_plan.md**](./implementation_plan.md) untuk:
- Engineering tasks checklist
- Technical specifications
- Verification procedures

---

## 🧪 Testing

### Manual Testing

```bash
# Dev server sudah running
npm run dev

# Test homepage
curl http://localhost:4321/

# Test API endpoint
curl -X POST http://localhost:4321/api/generate-content \
  -H "Content-Type: application/json" \
  -d '{"prompt":"filter air","model":"anthropic/claude-haiku-4-5","type":"blog"}'
```

### Production Build Testing

```bash
# Build untuk production
npm run build

# Preview build
npm run preview

# Akses di http://localhost:4321
```

---

## 🔑 Environment Variables

Semua dikonfigurasi otomatis di `.env`:

```bash
# Database
CMS_LIBSQL_URL=file:./data/studio.db
TURSO_CONNECTION_URL=file:./data/studio.db
CMS_ENCRYPTION_KEY=X5Naur2MOLYVEco8h5WxCQ==

# API (Optional untuk AI features)
OPENROUTER_API_KEY=sk-or-...
WAVESPEED_API_KEY=...

# S3 Storage (Optional untuk production)
S3_ENDPOINT=https://fly.storage.tigris.dev
S3_BUCKET_NAME=arkara-media
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
```

Lihat [WALKTHROUGH.md](./WALKTHROUGH.md#-konfigurasi) untuk detail lengkap.

---

## 🐛 Known Issues

### Windows Development

**Issue:** ESM Loader error dengan StudioCMS di Windows

**Status:** ⚠️ Pending fix

**Workaround:**
- StudioCMS integration disabled di `astro.config.mjs`
- Dev server tetap berjalan normal
- Akan teratasi saat deploy ke production (Unix)
- Alternative: Gunakan WSL2 untuk development

Lihat [WALKTHROUGH.md - Troubleshooting](./WALKTHROUGH.md#problem-esm-loader-error-windows)

---

## 📚 Brand Design System

### Colors
```css
--forest:    #1F3D2B   /* Primary brand */
--brown:     #6B4F3A   /* Secondary */
--stone:     #5C5F61   /* Body text */
--amber:     #D98C2B   /* CTA & highlight */
--moss:      #6E8B3D   /* Success */
--sand:      #E6D8B5   /* Light bg */
--parchment: #F5F0E8   /* Page bg */
--ink:       #1A1208   /* Dark mode */
```

### Typography
```
Display:  Playfair Display (serif, 700/900)
Body:     Source Sans 3 (sans-serif, 300/400/600)
Mono:     JetBrains Mono (monospace)
```

Lihat [SKILL/References/brand-tokens.md](./SKILL/References/brand-tokens.md)

---

## 🚀 Deployment

### Ke Railway (Recommended)

1. Push ke GitHub
2. Connect dengan Railway
3. Set environment variables
4. Deploy otomatis setiap push

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Deploy
railway up
```

Lihat [WALKTHROUGH.md - Deployment](./WALKTHROUGH.md) untuk langkah detail.

---

## 🤝 Contributing

1. Fork repository
2. Create feature branch (`git checkout -b feat/new-feature`)
3. Make changes dan test (`npm run build`)
4. Commit (`git commit -m "feat: add new feature"`)
5. Push (`git push origin feat/new-feature`)
6. Create Pull Request

Lihat [DEVELOPMENT_GUIDE.md - Contributing](./DEVELOPMENT_GUIDE.md#-contributing)

---

## 📄 License

MIT License - Bebas digunakan dan dimodifikasi

---

## 📞 Support & Feedback

Jika ada pertanyaan atau issue:

1. **Check documentation**
   - [QUICKSTART.md](./QUICKSTART.md)
   - [WALKTHROUGH.md](./WALKTHROUGH.md)
   - [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md)

2. **Check troubleshooting**
   - [WALKTHROUGH.md - Troubleshooting](./WALKTHROUGH.md#-troubleshooting)

3. **Search GitHub issues**
   - Mungkin sudah ada solusi untuk problem Anda

4. **Open issue**
   - Buat issue baru dengan detail yang jelas

---

## 📊 Project Status

| Component | Status | Notes |
|-----------|--------|-------|
| Homepage | ✅ Done | Hero, articles, categories |
| Blog System | ✅ Done | Listing, filtering, detail pages |
| API Endpoints | ✅ Done | Content & image generation |
| Database | ✅ Done | SQLite (dev), Turso ready (prod) |
| StudioCMS | ⚠️ Partial | Installed, ESM issue on Windows |
| Panduan System | ✅ Ready | Placeholder, awaiting CMS integration |
| Images & Storage | ✅ Ready | S3/Tigris configured |
| UI Components | ✅ Done | Button, Card, Badge, etc |
| Responsive Design | ✅ Done | Mobile, tablet, desktop |
| Production Build | ✅ Done | Railway deployment ready |

---

## 🎯 Next Steps

### Untuk Development

1. **Setup lokal:**
   ```bash
   npm install
   npx studiocms migrate --latest
   npm run dev
   ```

2. **Baca dokumentasi:**
   - Start with [QUICKSTART.md](./QUICKSTART.md)
   - Deep dive into [WALKTHROUGH.md](./WALKTHROUGH.md)
   - Dev guide: [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md)

3. **Explore website:**
   - Homepage: http://localhost:4321/
   - Blog: http://localhost:4321/blog
   - API: POST to /api/generate-content

### Untuk Production

1. **Setup Environment:**
   - Create Turso database account
   - Get OpenRouter API key
   - Get Wavespeed API key
   - Setup S3/Tigris bucket

2. **Configure Railway:**
   - Connect GitHub repository
   - Set environment variables
   - Enable auto-deployment

3. **Domain Setup:**
   - Point domain ke Railway
   - Setup SSL certificate (auto)

---

## 👨‍💻 Author & Team

**Arkara Survival Knowledge Platform**
- Project Lead: Your Name
- Development: Contributors
- Design: Brand Design System

---

## 📈 Roadmap

### Phase 1 (Current)
- ✅ Core blog system
- ✅ API endpoints
- ✅ Database integration
- ✅ AI integration ready

### Phase 2 (Next)
- 🔜 StudioCMS dashboard fully working
- 🔜 Panduan system complete
- 🔜 Search functionality
- 🔜 Community features

### Phase 3 (Future)
- User authentication
- Comments system
- Newsletter/subscription
- Mobile app
- Offline support

---

**Made with ❤️ for Survival Knowledge in Indonesia**

Last Updated: 14 Maret 2026
Version: 1.0.0

---

## 🔗 Resources

- 📖 [Astro Documentation](https://docs.astro.build/)
- 🎨 [Tailwind CSS](https://tailwindcss.com/)
- 📦 [StudioCMS](https://studiocms.dev/)
- 🗄️ [Turso Database](https://turso.tech/)
- 🚀 [Railway Deployment](https://railway.app/)
- 🤖 [OpenRouter API](https://openrouter.ai/)
- 🖼️ [Wavespeed API](https://wavespeed.ai/)
