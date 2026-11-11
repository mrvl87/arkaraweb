# Arkara — implementasi identitas baru

## Hasil

Frontend Astro telah didesain ulang mengikuti mockup brand: forest green, amber, off-white, logo gunung/jalur, serta maskot pemandu kesiapsiagaan. Desktop dan mobile menggunakan DOM dan sistem desain yang sama, dengan perubahan susunan berdasarkan ruang yang tersedia.

| Token | Nilai |
| --- | --- |
| Forest green | #1F4D2E |
| Amber | #F59E0B |
| Off-white | #F8F5EC |
| Charcoal | #2B2B28 |
| Font judul | Manrope |
| Font isi | Source Sans 3 |
| Label pendek | IBM Plex Mono |

## Halaman dan komponen

- Beranda: pengantar brand, enam pilar, langkah awal keluarga, sorotan jurnal, artikel terbaru, progres baca lokal, dan ajakan membangun komunitas.
- Jurnal: header editorial, artikel sorotan, dan kartu artikel responsif.
- Panduan: filter enam kategori dengan label, grid panduan, dan empty state.
- Halaman baca: judul sentence case, informasi penulis, ringkasan, daftar isi, FAQ, tabel responsif, tombol simpan lokal, serta artikel terkait.
- Header, footer, navigasi bawah, pencarian, tombol, badge, kartu, favicon, dan skip link.
- Halaman 404, ruang baca pada rute login lama, serta kerangka halaman asisten diperbarui agar sesuai identitas.

Rute konten, pengambilan data publik, canonical, structured data, redirect, dan handler pencarian tetap menggunakan implementasi aplikasi. Backend CMS dan migrasi database tidak diubah.

## Keputusan desain

- Pada 10 November, pengguna meminta dark mode berbasis pembalikan palet tema. Tampilan awal kini memakai latar hijau hutan, teks krem, dan aksen amber. Tombol di header memilih terang/gelap; pilihan disimpan di `arkara-theme` dan diterapkan sebelum konten tampil. Tema terang tetap tersedia.
- Hero menjelaskan manfaat Arkara dan mengarahkan ke panduan. Carousel dan ticker lama tidak lagi dipakai pada beranda.
- Logo adalah SVG yang digambar ulang berdasarkan arah visual mockup; bukan file master logo hasil ekstraksi.
- Maskot hero memakai gambar statis pilihan CMS dari `hero_section.mascot_image`; gambar WebP lokal `/brand/arkara-guide.webp` menjadi fallback. Pada 10 November, pengguna menghentikan animasi interaktif dan integrasi Rive, lalu meminta alur upload/pemilihan CMS dipertahankan sebelum penerapan. Speech dan tagline maskot juga dibaca dari CMS. Detail alur serta validasi ada di `docs/hero-cms-media-2026-11-10.md`.
- Durasi baca tidak lagi ditulis sebagai angka tetap pada kartu. Kartu tidak menampilkan estimasi satu menit yang hanya berasal dari ringkasan; halaman artikel menghitung dari isi.
- Tidak menampilkan status database atau QR statis sebagai informasi untuk pembaca.
- Progres dan simpanan tetap disimpan di perangkat. Rute login lama menjelaskan bahwa akun dan sinkronisasi belum tersedia, alih-alih menampilkan formulir masuk yang tidak berfungsi.

## Sumber implementasi

- Token, layout, pola responsif, dan prose: `arkara/src/styles/global.css`.
- Palet gelap, permukaan, kartu, pencarian, navigasi, dan prose: `arkara/src/styles/theme.css`. Kontrol: `arkara/src/components/layout/ThemeToggle.astro`; inisialisasi sebelum paint: `BaseLayout.astro`.
- Logo: `arkara/src/components/layout/BrandLogo.astro`.
- Ikon bersama: `arkara/src/components/ui/Icon.astro`.
- Aset maskot: `arkara/public/brand/arkara-guide.webp`.
- Prototipe animasi maskot yang dibatalkan tidak disertakan dalam paket penerapan.
- Maskot CMS statis: `arkara/src/components/home/StaticHeroMascot.astro` dan `arkara/src/lib/hero-media.ts`.
- Halaman utama: `arkara/src/pages/index.astro`.
- Pembaca: `arkara/src/layouts/PostLayout.astro`.

## Validasi

Pemeriksaan tipe dan template Astro menggunakan konfigurasi QA yang melewati runtime Cloudflare: 0 error, 0 warning; tersisa dua hint import tidak terpakai pada komponen hero lama yang tidak digunakan.

Guard aksesibilitas pencarian yang tersedia di proyek lulus.

Validasi dark mode 10 November: `npm run check:theme` lulus tujuh pemeriksaan (pilihan awal/tersimpan, toggle, storage diblokir/invalid, sinkronisasi tab, pemuatan ulang kontrol, dan kontras). Sebanyak 25 pasangan warna teks/permukaan/aksi diuji dengan rasio terendah 6,13:1. Guard tema disertakan dalam `npm run verify`. Respons HTTP lokal beranda, jurnal, panduan, artikel, serta panduan detail memuat tema dan kontrol; stylesheet berhasil dikompilasi. Astro check lulus tanpa error atau warning. Verifikasi visual browser belum tersedia pada sesi ini.

Build statis terisolasi berhasil merender 16 halaman dengan fixture konten, termasuk beranda, jurnal, panduan, artikel, panduan detail, ruang baca, dan 404. Fixture QA berada dalam `.astro/` yang diabaikan Git dan tidak memengaruhi konfigurasi produksi.

Pembaruan 10 November: build produksi Cloudflare untuk dark mode berhasil dengan konfigurasi QA yang mewarisi `astro.config.mjs`, memakai folder keluaran tersendiri, dan menyetel `maxParallelFileOps: 1`. Build default sebelumnya menemui EPERM saat pembuatan direktori keluaran Windows; konfigurasi produksi aplikasi tidak diubah untuk mengatasi kendala lokal ini. Hasil belum dikonfirmasi melalui screenshot lintas perangkat atau pengukuran Core Web Vitals. Pembacaan publik Supabase dan gambar maskot telah diverifikasi pada tugas integrasi CMS; uji upload/simpan CMS produksi tetap perlu dilakukan saat penerapan.

## Pratinjau untuk peninjauan

Pratinjau QA lokal `design-references/arkara-brand-preview.html` menyediakan halaman beranda, jurnal, panduan, dan artikel dalam satu berkas. Berkas hasil render ini tidak termasuk paket penerapan dan dibuat sebelum penambahan dark mode. Pemilih ukuran tersedia untuk desktop 1200 px, tablet 820 px, ponsel 390 px, dan ponsel kecil 320 px.

Pratinjau dirender dari komponen yang telah dikompilasi dengan fixture konten. Aset maskot dan CSS disertakan; foto artikel dan font memakai sumber eksternal. Interaksi pencarian, simpanan, dan filter kategori tidak dijalankan dalam berkas pratinjau statis.

## Menjalankan aplikasi

Jalankan `npm run dev` dari `arkara/` pada lingkungan dengan runtime Cloudflare dan akses jaringan yang sesuai. Jalankan `npm run verify` sebelum deployment.

Perubahan belum dipublikasikan ke arkaraweb.com.
