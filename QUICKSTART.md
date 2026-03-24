# ⚡ Arkara Quick Start Guide
Panduan singkat untuk menjalankan ekosistem Arkara dalam 5 menit.

---

## 🚀 Setup Cepat (5 Menit)

### 1️⃣ Clone & Install (2 menit)
```bash
# Terminal 1: Frontend
cd arkara
npm install

# Terminal 2: CMS
cd nextjsCMS
npm install
```

### 2️⃣ Configure .env (1 menit)
Pastikan file `.env` di kedua folder berisi kredensial Supabase.
Salin dari `.env.example` jika belum ada.

### 3️⃣ Start Dev Servers (1 menit)
```bash
# Terminal 1
cd arkara && npm run dev

# Terminal 2
cd nextjsCMS && npm run dev
```

### 4️⃣ Akses di Browser
- **Situs Utama**: http://localhost:4321
- **Dashboard Admin**: http://localhost:3000

---

## 📝 Common Commands

| Command | Folder | Deskripsi |
|---------|--------|-----------|
| `npm run dev` | Keduanya | Menjalankan server development |
| `npm run build` | Keduanya | Menghasilkan bundle produksi |

---

## 🧪 Test API (Astro)
```bash
curl -X POST http://localhost:4321/api/generate-content \
  -H "Content-Type: application/json" \
  -d '{"prompt":"filter air","model":"anthropic/claude-haiku-4-5","type":"blog"}'
```

---

## 📚 Dokumentasi Lanjutan
- **[PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md)**: Gambaran besar & handover (Wajib baca).
- **[DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md)**: Workflow detail.
- **[WALKTHROUGH.md](./WALKTHROUGH.md)**: Setup detail & troubleshooting.

