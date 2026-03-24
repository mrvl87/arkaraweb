# 🗺️ Arkara — Project Summary & Handover Document
> **Retro Survival Manual 2.0 | Survive with Knowledge**

Selamat datang! Dokumen ini dirancang khusus untuk membantu model AI atau editor baru memahami, menguasai, dan melanjutkan pengembangan proyek Arkara secara instan.

---

## 🏗️ 1. Arsitektur & Teknologi (Tech Stack)

Proyek ini telah bertransformasi dari sistem berbasis file lokal (MDX) menjadi sistem **full-stack modern** dengan pemisahan frontend dan backend/CMS yang jelas.

| Layer | Teknologi | Deployment Status |
|-------|-----------|-------------------|
| **Frontend** | [Astro 5](https://astro.build/) | **ACTIVE** — [arkaraweb.com](https://arkaraweb.com) (Railway) |
| **CMS/Backend** | [Next.js 16](https://nextjs.org/) | **ACTIVE** — [cms.arkaraweb.com](https://cms.arkaraweb.com) (Railway) |
| **Database** | [Supabase](https://supabase.com/) | **ACTIVE** — Supabase Cloud |
| **Rich Editor** | [Novel](https://novel.sh/) (via Tiptap) | Editor teks kaya bergaya Notion di CMS untuk menulis konten MDX-ready. |
| **Styling** | [Tailwind CSS 4](https://tailwindcss.com/) | Kerangka utilitas-first untuk desain yang konsisten dan responsif. |
| **AI Text** | [OpenRouter API](https://openrouter.ai/) | Integrasi kecerdasan buatan untuk membantu pembuatan draf konten survival. |
| **AI Images** | [Wavespeed API](https://wavespeed.ai/) | Generator gambar (ilustrasi teknis line-art) untuk melengkapi artikel. |
| **Storage** | Supabase Storage / S3 | Penyimpanan pusat untuk aset gambar dan file media. |

---

## 📂 2. Struktur Folder (Project Directory)

Workspace utama terbagi menjadi dua folder proyek utama:

### 🏠 Root (`/`)
Berisi dokumentasi utama (`README.md`, `DEVELOPMENT_GUIDE.md`, `WALKTHROUGH.md`) dan file konfigurasi global.

### 🏕️ `arkara/` (Frontend — Astro)
Aplikasi utama yang dilihat oleh pengunjung.
- `arkara/src/pages/`: Rute untuk Blog, Panduan, dan Beranda.
- `arkara/src/lib/content.ts`: Modul utama untuk mengambil data dari Supabase.
- `arkara/src/lib/supabase.ts`: Konfigurasi klien Supabase.
- `arkara/refactored/`: **Fokus Saat Ini.** Tempat diletakkannya komponen dan halaman dengan desain *Retro Survival Manual 2.0*.
- `arkara/studiocms.config.mjs`: Konfigurasi StudioCMS lama (saat ini sedang dalam proses transisi penuh ke NextJS CMS).

### 🛠️ `nextjsCMS/` (CMS Dashboard — Next.js)
Admin dashboard untuk editor mengelola situs.
- `nextjsCMS/src/app/admin/`: Rute dashboard admin.
- `nextjsCMS/src/components/novel/`: Editor teks kaya yang digunakan untuk menulis konten.
- `nextjsCMS/supabase/schema.sql`: Definisi tabel database dan aturan akses (RLS).

---

## 🎨 3. Desain & Estetika (Brand Design System)
**Tema: Retro Survival Manual 2.0**
Inspirasi: Panduan taktis fisik dari era cetak (rugged, functional, retro, technical).

### Token Warna (Aesthetic Tokens)
- `var(--ink)`: Hitam pekat untuk teks dan border tebal.
- `var(--cream)`: Latar belakang kertas tua.
- `var(--green-terminal)`: Hijau monokromatik ala komputer lama.
- `var(--yellow-manual)`: Kuning peringatan untuk label dan highlight.
- `var(--red-warning)`: Merah aksen untuk peringatan kritis.

### Tipografi
- **Display**: `Barlow Condensed` (Heavy, Caps) untuk judul seksi.
- **Title Accent**: `Special Elite` (Typewriter style) untuk kesan dokumen retro.
- **Monospace**: `Share Tech Mono` untuk label teknis dan metadata.
- **Body**: `Source Sans 3` untuk kenyamanan membaca artikel panjang.

---

## 🔄 4. Pendekatan Pengembangan (Development Approach)

### A. Transisi CMS (StudioCMS → Supabase + NextJS)
Awalnya proyek menggunakan StudioCMS (local SQLite). Namun, untuk skalabilitas dan kemudahan kolaborasi, kita berpindah ke **Supabase**. Semua fungsi di `arkara/src/lib/content.ts` sekarang memanggil data dari Supabase.

### B. Refactoring Tema (Branding 2.0)
Halaman beranda dan blog sedang dikerjakan ulang di folder `arkara/refactored` untuk mengadopsi tampilan "Retro Manual". Ciri khas desain ini adalah:
- Border tebal 2px/3px (Ink color).
- Ticker band (Warning band) animasi di beranda.
- No rounded corners (serba kotak/tajam).
- Box-shadow flat (tanpa blur).

### C. Alur Konten (AI-Assisted Workflow)
Editor dapat meminta AI (via dashboard NextJS) untuk:
1. Menghasilkan draf teks berdasarkan prompt (OpenRouter).
2. Menghasilkan ilustrasi line-art (Wavespeed).
3. Konten tersebut disimpan di Supabase dan ditampilkan secara SSR (Server-Side Rendering) di Astro.

---

## 🚀 5. Cara Menjalankan (Running Locally)

### Menjalankan Frontend
```bash
cd arkara
npm run dev
# Akses di http://localhost:4321
```

### Menjalankan CMS
```bash
cd nextjsCMS
npm run dev
# Akses di http://localhost:3000
```

*Pastikan file `.env` di kedua folder tersebut sudah terisi dengan kredensial Supabase, OpenRouter, dan Wavespeed.*

---

## 📋 6. Status Proyek (Current Task List)
- [x] Migrasi Skema Database ke Supabase.
- [x] Integrasi Supabase Client di Astro (`lib/content.ts`).
- [x] Desain Dasar Retro Survival Manual 2.0 di `refactored`.
- [ ] Menyelesaikan migrasi dari halaman beranda lama ke versi `refactored`.
- [ ] Memastikan Panduan Teknis menarik data dari tabel `panduan` di Supabase secara sempurna.
- [ ] Integrasi penuh modul Media (Upload gambar di CMS → Tampil di Astro).

---

> [!TIP]
> **Pesan untuk Model Masa Depan:** 
> Gunakan `arkara/refactored/src/pages/index.astro` sebagai referensi utama standar desain terbaru. Jika ingin mengupdate fitur data, selalu cek `arkara/src/lib/content.ts` sebagai pusat pengambilan data.

### 🛠️ 7. Alat Bantu Pengembang (Developer Tools)

**Supabase MCP Server (Khusus Power User/Model AI)**
Untuk berinteraksi langsung dengan database tanpa melalui dashboard web, Anda dapat memanggil tool:
- `mcp_supabase-mcp-server_list_tables`: Melihat skema tabel.
- `mcp_supabase-mcp-server_execute_sql`: Menjalankan query SQL untuk migrasi cepat.
- `mcp_supabase-mcp-server_generate_typescript_types`: Menghasilkan tipe TypeScript otomatis dari database.

---

**Made with ❤️ for Survival Knowledge in Indonesia**
*Terima kasih telah melanjutkan perjuangan kemandirian bangsa melalui proyek Arkara!*
