# Maskot statis: alur CMS → Supabase → hero

## Perilaku akhir

Pengguna menghentikan maskot interaktif/Rive dan meminta gambar tetap bisa dikelola lewat CMS setelah redesign diterapkan.

Beranda mengambil `hero_section.mascot_image`, `mascot_speech_text`, dan `mascot_tagline` dari Supabase. Gambar lokal `/brand/arkara-guide.webp` digunakan jika pengaturan belum ada/tidak valid, pengambilan hero gagal, atau file gambar gagal dimuat. Tidak ada animasi/aksi klik maskot.

## Alur yang dipertahankan

1. Upload melalui Media CMS menjalankan alur `uploadFile`/`processAndUploadImage` yang sudah ada.
2. Pada versi kode saat ini, file disimpan ke R2 dan dilayani melalui `media.arkaraweb.com`; metadata media tetap di tabel Supabase `media`. Jalur upload tidak dipindahkan dalam perubahan ini.
3. MediaPicker menambahkan URL publik ke objek media dan HeroForm menyimpannya ke `hero_section.mascot_image`.
4. Frontend membaca pengaturan tersebut pada setiap request beranda. URL Supabase Storage lama tetap memakai pemetaan media publik yang sudah digunakan aplikasi; string URL, objek MediaPicker, file_path relatif `uploads/...`, serta formats.original didukung.
5. Alt dan dimensi diambil dari metadata CMS; `object-fit: contain` dan batas lebar menjaga gambar dengan rasio berbeda. Transparansi file tetap dipertahankan karena gambar asli dipakai, tanpa latar placeholder.

## Perubahan kode

- `arkara/src/pages/index.astro`: mengambil hero bersama daftar artikel, memasang gambar statis CMS, serta menggunakan sumber yang sama untuk preload. Header `Cache-Control: private, no-store, max-age=0` dan `CDN-Cache-Control: no-store` ditetapkan pada route sebelum layout melakukan streaming.
- `arkara/src/lib/content.ts`: pengambilan hero tidak memakai cache proses lima menit. Cache konten lainnya tidak diubah.
- `arkara/src/lib/hero-media.ts`: normalisasi media lama/baru, metadata alt/rasio, dan fallback aman.
- `arkara/src/components/home/StaticHeroMascot.astro`: gambar biasa; skrip kecil hanya memulihkan kegagalan gambar ke fallback, termasuk kegagalan sebelum skrip termuat, tanpa error loop.
- `arkara/src/styles/global.css`: membatasi lebar speech bubble dan menangani kata/tagline panjang.
- `nextjsCMS/src/components/settings/hero-form.tsx`: preview gambar terpilih, pilihan kembali ke maskot bawaan, serta penanganan id kosong melalui validasi action.
- `nextjsCMS/src/components/media/media-picker.tsx`: opsi imageOnly untuk maskot, dengan kompatibilitas metadata MIME lama yang kosong. Tombol refresh bukan submit form.
- `nextjsCMS/src/lib/hero-settings.ts`: validasi input hero dan normalisasi URL media; metadata gambar dipertahankan.
- `nextjsCMS/src/app/cms/settings/actions.ts`: update hero memverifikasi baris hasil melalui select('id').single(); baris tak terlihat/tak ter-update tidak lagi ditampilkan sebagai sukses. Guard autentikasi dan notifikasi frontend yang ada tetap dipakai.

## Validasi

- Pembacaan tabel `hero_section` melalui API publik/anon yang dipakai frontend: HTTP 200, satu baris hero tersedia.
- File maskot yang sedang dipilih CMS: HTTP 200, image/webp, 370 × 526 px, hasAlpha=true, 28.454 byte. Tidak dilakukan upload atau perubahan pilihan media produksi untuk pengujian ini.
- Jalankan `node --experimental-vm-modules scripts/verify-hero-cms.mjs` dari folder `arkara/`: 15 pemeriksaan lulus untuk metadata, URL lama/baru, penggantian media, cache hero, input invalid, update/auth/error database, dan fallback gambar. Tes memakai Zod dari instalasi sibling nextjsCMS sehingga kedua dependency workspace perlu tersedia.
- SSR lokal dengan fixture media dari pembacaan publik: gambar CMS dan preload cocok, rasio/alt benar, header no-store nyata pada HTTP response. Penggantian fixture langsung tampil pada request kedua; fixture kosong memunculkan fallback. Fixture uji dipulihkan setelah tes.
- Astro check: 0 error, 0 warning; 2 hint lama pada HeroCarousel/MascotSection yang tidak digunakan.
- TypeScript CMS: `npx tsc --noEmit --incremental false` lulus.
- Security gate CMS: 9/9 lulus.
- Build produksi Astro/Cloudflare lulus. Untuk environment Windows terisolasi, XDG_CONFIG_HOME dan WRANGLER_LOG_PATH diarahkan hanya pada proses build ke direktori QA di `.astro/`, sehingga tidak membutuhkan akses tulis ke profil pengguna.
- Pemeriksaan akhir `npm run verify` lulus (exit 0): guard aksesibilitas pencarian, Astro check, dan build produksi setelah penyesuaian CSS terakhir.

Tidak ada perubahan schema/RLS atau konfigurasi storage. Paket penerapan menyertakan guard autentikasi settings beserta dependensi `server-only` 0.0.1 yang digunakan guard tersebut; perubahan keamanan CMS lainnya tidak termasuk paket redesign ini. Pemeriksaan MCP SQL tidak diizinkan pada sesi ini; pembacaan produksi diverifikasi lewat API publik yang sama dengan frontend. Simulasi save CMS tidak menggantikan smoke test upload/simpan melalui akun CMS produksi.

## Penerapan

Perubahan frontend dan CMS harus diterapkan bersama agar preview/validasi simpan dan penampilan gambar konsisten. Gunakan environment Supabase publik frontend dan konfigurasi media CMS yang sudah ada. Setelah deploy, upload/pilih satu gambar uji melalui CMS, simpan Hero Section, kemudian muat ulang beranda dan periksa gambar, alt, transparansi, serta teks maskot. Kembalikan pilihan yang diinginkan melalui CMS.

Perubahan masih di working tree lokal; tidak ada commit, push, deploy, atau mutasi data produksi pada tugas ini.
