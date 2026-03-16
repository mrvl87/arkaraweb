# Known Issues & Lessons Learned

---

## 1. `create-next-app` Gagal karena Nama Direktori

**Masalah:**
```
Could not create a project called "nextjsCMS" because of npm naming restrictions:
  * name can no longer contain capital letters
```

**Penyebab:** `create-next-app` mengambil nama project dari nama direktori. Direktori `nextjsCMS` mengandung huruf kapital.

**Solusi:**
Buat `package.json` manual dengan `"name": "arkara-cms"` sebelum menjalankan instalasi. Ini meng-override nama yang diambil dari direktori.

---

## 2. Tailwind CSS PostCSS Crash di Windows

**Masalah:**
```
node process exited before we could connect to it with exit code: 0xc0000142
```

**Penyebab:** Error `0xc0000142` adalah Windows DLL initialization failure. Terjadi ketika Next.js Turbopack mencoba menjalankan PostCSS sebagai child process untuk memproses `@tailwind` directives di Windows.

**Yang dicoba dan gagal:**
- Upgrade ke `@tailwindcss/postcss` (Tailwind v4 approach) → masih crash
- Downgrade ke Tailwind v3 → masih crash
- Berbagai konfigurasi `postcss.config.js` → masih crash

**Solusi akhir:**
- Hapus `@tailwind base/components/utilities` dari `globals.css`
- Hapus `tailwindcss: {}` dari `postcss.config.js`
- Styling via Tailwind utility classes di JSX (masih berfungsi) + inline styles untuk warna brand

**Catatan:** Ini environment-specific. Di Linux/Mac atau production server, Tailwind PostCSS berjalan normal.

---

## 3. Route Group `(cms)` vs Folder `cms`

**Masalah:** Semua sidebar links mengarah ke `/cms/dashboard`, `/cms/posts`, dll — tapi halaman 404.

**Penyebab:**
Route groups `(nama)` di Next.js App Router **tidak** menambahkan segment ke URL. Jadi:
```
src/app/(cms)/dashboard/page.tsx  → URL: /dashboard   ❌ bukan /cms/dashboard
src/app/cms/dashboard/page.tsx    → URL: /cms/dashboard  ✅
```

**Solusi:** Rename `(cms)/` → `cms/` (folder biasa, bukan route group).

**Pelajaran:** Gunakan route groups `(nama)` hanya untuk:
- Mengorganisir file tanpa mempengaruhi URL
- Shared layouts untuk beberapa routes yang tidak punya prefix sama

---

## 4. Multiple Dev Server Instances / Port Conflict

**Masalah:**
```
⚠ Port 3000 is in use, using available port 3001
⨯ Unable to acquire lock at .next/dev/lock
```

**Penyebab:** Beberapa instance `npm run dev` berjalan bersamaan karena proses tidak ter-kill dengan benar.

**Solusi:**
```powershell
# PowerShell — paling reliable di Windows
powershell -Command "Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force"

# Hapus lock file
rm -rf .next/dev/lock

# Atau hapus seluruh .next untuk clean build
rm -rf .next
```

**Catatan:** `taskkill /PID xxx /F` gagal di Git Bash karena `/PID` diinterpretasikan sebagai path Unix. Gunakan PowerShell.

---

## 5. Login Redirect ke `/cms/dashboard` Tapi 404

**Masalah:** Login berhasil, `router.push('/cms/dashboard')` dipanggil, tapi halaman 404.

**Penyebab:** Kombinasi issue #3 (route group) dan dev server stale dari issue #4.

**Solusi:** Fix issue #3 (gunakan folder `cms/` biasa) + restart server bersih.

---

## Checklist Sebelum Debug Server Issue

1. Periksa port yang digunakan: `netstat -ano | grep :3000`
2. Kill semua node: `powershell -Command "Get-Process node | Stop-Process -Force"`
3. Hapus cache: `rm -rf .next`
4. Restart: `npm run dev`
5. Verifikasi routes: `curl -I http://localhost:3000/login`
