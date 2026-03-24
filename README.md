# 🏕️ Arkara — Platform Pengetahuan Survival Indonesia
> **Survive with Knowledge** | Digitalizing Field Tacticals for Crisis Preparedness

[![Astro](https://img.shields.io/badge/Astro-5.18.1-ff5d01?logo=astro)](https://astro.build)
[![Next.js](https://img.shields.io/badge/Next.js-16.1.6-000000?logo=next.js)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-3ecf8e?logo=supabase)](https://supabase.com/)

---

## 🗺️ Gambaran Besar (Big Picture)

Arkara adalah ekosistem digital untuk pengetahuan survival yang menggabungkan kecepatan **Astro** untuk frontend dan fleksibilitas **Next.js** untuk manajemen konten (CMS). Seluruh data dikelola secara terpusat di **Supabase**.

### 🌟 Arsitektur Utama
- **Frontend (Visitor Site):** Dibangun dengan [Astro 5](./arkara). **Live at: [arkaraweb.com](https://arkaraweb.com)**.
- **Backend (CMS Dashboard):** Dibangun dengan [Next.js 16](./nextjsCMS). **Live at: [admin.arkaraweb.com](https://admin.arkaraweb.com)** (Atau subdomain proyek Railway).
- **Data Engine:** Menggunakan [Supabase](./nextjsCMS/supabase) (PostgreSQL) sebagai sumber kebenaran tunggal.

---

## 🏗️ Struktur Proyek (Workspace)

```
/ (Root)
├── 🗺️ PROJECT_SUMMARY.md      <-- MULAI DI SINI (DOKUMEN SERAH TERIMA LENGKAP)
├── 📖 README.md               <-- File ini
├── 👨‍💻 DEVELOPMENT_GUIDE.md    <-- Panduan teknis & workflow
├── 📖 WALKTHROUGH.md          <-- Setup awal (lama)
│
├── 🏕️ arkara/                  <-- Proyek Frontend (Astro)
│   ├── src/lib/content.ts      <-- Data fetching (via Supabase)
│   └── refactored/             <-- DESAIN TERBARU (FOKUS SEKARANG)
│
└── 🛠️ nextjsCMS/               <-- Proyek CMS (Next.js + Supabase)
    ├── src/app/admin/          <-- Dashboard admin
    └── src/components/novel/   <-- Editor (Notion-style)
```

---

## 🎨 Branding: Retro Survival Manual 2.0

Situs ini mengadopsi estetika **"Retro Survival Manual"** — sebuah desain yang fungsional, tegas, dan taktis.
- **Warna Utama:** Ink (Hitam Pekat), Cream (Kertas Tua), Green Terminal (Hijau Monokrom), Yellow Manual (Kuning Peringatan).
- **Tipografi:** Perpaduan Barlow Condensed, Special Elite (Typewriter), dan Share Tech Mono.
- **Karakter:** Tegep, Kotak-kotak (no rounded corners), dan Border tebal (Retro vibes).

---

## 🚀 Memulai (Quick Start)

Untuk menjalankan proyek ini secara lokal, Anda perlu menjalankan kedua layanan:

### 1. Jalankan Frontend
```bash
cd arkara
npm install
npm run dev
```

### 2. Jalankan CMS
```bash
cd nextjsCMS
npm install
npm run dev
```

> [!IMPORTANT]
> Pastikan variabel lingkungan (`.env`) di kedua folder telah dikonfigurasi dengan kredensial Supabase yang benar untuk sinkronisasi data.

---

## 📚 Dokumentasi Lanjutan

| Dokumentasi | Tujuan |
|-------------|---------|
| [**PROJECT_SUMMARY.md**](./PROJECT_SUMMARY.md)| **Handover: Penjelasan paling lengkap untuk AI/Editor baru.** |
| [**DEVELOPMENT_GUIDE.md**](./DEVELOPMENT_GUIDE.md)| Detail teknis, workflow, dan pedoman koding. |
| [**WALKTHROUGH.md**](./WALKTHROUGH.md)| Panduan instalasi dan troubleshooting mendalam. |

---

**Made with ❤️ for Survival Knowledge in Indonesia**
*Last Updated: 24 Maret 2026*
n
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
