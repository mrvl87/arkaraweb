# Audit CSS dan konsep frontend Arkara

Tanggal: 8 November 2026, Asia/Jayapura.

## Kesimpulan

Arkara memiliki karakter visual yang mudah dikenali pada desktop, tetapi belum memiliki satu sistem desain yang konsisten. Desktop mengambil bentuk buku panduan lapangan retro; mobile menjadi aplikasi baca gelap; komponen UI lama masih membawa palet dan tipografi ketiga. Masalah paling mendesak adalah keterbacaan dan aturan tema yang tersebar. Penambahan ornamen atau animasi sebaiknya mengikuti perapian fondasi tersebut.

Audit ini tidak mengubah kode aplikasi. Perubahan yang dibuat hanya dokumen ini.

## Cakupan dan batas pemeriksaan

- Kode aktif: `arkara/src`, `arkara/tailwind.config.mjs`, `arkara/astro.config.mjs`, dan `arkara/package.json`.
- Tampilan produksi: beranda, arsip blog, arsip panduan, dan artikel “Siapa Menguasai Pangan Dunia?”.
- Viewport yang diperiksa: desktop 1280 × 720, ponsel 390 × 844, dan tablet 820 × 1000. Ini viewport browser, bukan pengujian perangkat fisik.
- Inspeksi visual, DOM, computed style, hitungan pola sumber, serta kompilasi utility Tailwind di memori.
- Tidak menjalankan Lighthouse, pengukuran Core Web Vitals, build penuh, atau pengujian semua artikel/perangkat. Tidak memberikan skor performa atau klaim kepatuhan aksesibilitas menyeluruh.
- Produksi dan checkout lokal dapat berbeda. Temuan runtime dinyatakan terpisah dari risiko yang hanya terlihat di sumber.

## Yang sudah bekerja baik

1. Palet krem, hijau, dan tinta; judul condensed; serta garis tegas memberi karakter buku panduan lapangan yang relevan dengan survival.
2. Ilustrasi editorial dan maskot membuat topik berat lebih mudah didekati.
3. Mode baca mobile pada artikel sampel mempunyai teks isi 16 px dengan line-height 28,48 px, judul dalam sentence case, serta ringkasan dan daftar isi yang dapat dibuka.
4. Navigasi bawah mobile mempunyai label teks dan mempertimbangkan safe area.
5. Gambar memiliki implementasi responsive source dan prioritas pemuatan. Carousel sudah memeriksa preferensi reduced motion saat menentukan autoplay awal.

## Temuan berdasarkan prioritas

### P1 — Kontras teks terlalu rendah

Terlihat pada kartu desktop produksi; dikonfirmasi melalui computed style dan perhitungan luminans warna solid.

| Elemen | Teks / latar | Ukuran | Rasio |
| --- | --- | --- | --- |
| CTA Baca pada kartu | `#8FAF8F` / `#F0E8D0` | 9,6 px | 1,97:1 |
| Metadata kartu | `#9B9080` / `#F0E8D0` | 9,28 px | 2,56:1 |
| Link prose berbasis token global | `#6B8C6B` / `#F0E8D0` | bergantung konteks | 3,07:1 |
| Nama penulis pada tema mobile/tablet | `#2A2218` / `#070B0C` | 13,6 px di sumber | 1,26:1 |

Tiga pasangan pertama berasal dari deklarasi global/kartu; CTA dan metadata dikonfirmasi pada produksi. Baris link prose adalah evaluasi pasangan token, bukan klaim bahwa seluruh link produksi memakai pasangan tersebut. Nama penulis terlihat gelap di atas hitam pada tablet dan memiliki deklarasi eksplisit di sumber.

Referensi: `PostCard.astro:81–91,137–150`, `PostLayout.astro:383–384,475–479`, `global.css:295–297`.

Tindakan: gunakan warna teks semantik yang berbeda untuk permukaan terang dan gelap. Naikkan metadata menjadi sekitar 12–13 px dan label aksi menjadi 13–14 px sebagai target desain. Teks normal ditargetkan minimal 4,5:1; ukuran target ini merupakan rekomendasi desain, bukan batas ukuran font dari WCAG.

### P1 — Pergantian tema bergantung lebar layar dan tidak seragam

`index.astro:625` dan navigasi memakai batas 768 px; `PostLayout.astro:475` mengubah tampilan pembaca pada 900 px.

Pada 820 px, beranda masih memakai hero retro krem, sedangkan artikel sudah memakai badan gelap dengan kartu membulat. Header desktop masih tampil dan navigasi bawah belum tampil. Ini bukan bukti navigasi rusak, tetapi pengalaman visual menjadi campuran.

Hero beranda menggunakan `md:grid-cols-[1fr_400px]` (`index.astro:295`). Di tablet, maskot masih mendapat kolom tetap 400 px sehingga judul artikel dipaksa menjadi banyak baris pada kolom yang sempit. Identitas dekoratif mengambil ruang sebesar konten utama.

Tindakan: pisahkan tema dari breakpoint. Gunakan satu tema melalui token; ubah susunan dan kepadatan berdasarkan ruang yang tersedia. Tumpuk hero atau kecilkan panel maskot sebelum dua kolom menjadi sempit. Selaraskan breakpoint header, navigasi, dan pembaca berdasarkan kebutuhan komponen.

### P1 — Gaya tersebar dan cascade sulit dipelihara

Hitungan literal dalam seluruh berkas `.astro`, `.css`, dan `.ts` di `arkara/src`: **375 kemunculan `!important`** dan **218 atribut `style=`**. Hitungan ini indikator pola, bukan jumlah bug atau ukuran CSS terkirim; sebagian berada dalam template string.

| Berkas | Kemunculan `!important` |
| --- | ---: |
| `pages/panduan/index.astro` | 105 |
| `layouts/PostLayout.astro` | 55 |
| `components/blog/FeaturedPost.astro` | 48 |
| `components/blog/PostCard.astro` | 45 |
| `pages/blog/index.astro` | 44 |

`index.astro` berisi sekitar 1.309 baris menurut pemisahan newline, sementara aturan dasar hanya sekitar 399 baris. Pada `PostCard`, gaya inline dan handler `onmouseover/onmouseout` harus dilawan oleh media query dengan `!important`. Sebagian aturan daftar lanjut membaca juga berulang antara scoped style dan `:global`, antara lain `index.astro:972–1167`.

Tindakan: pindahkan gaya statis ke kelas, ganti handler visual mouse dengan `:hover` dan `:focus-visible`, lalu konsolidasikan token permukaan/teks/garis/aksi. Pertahankan style dinamis hanya untuk nilai yang benar-benar berasal dari data. Pembersihan bertahap lebih mudah diverifikasi daripada menghapus seluruh override sekaligus.

### P2 — Konfigurasi Tailwind lama tidak terhubung

Proyek memakai Tailwind 4 dan plugin Vite. `global.css` hanya mengimpor Tailwind tanpa `@config` atau `@theme` untuk token lama. `tailwind.config.mjs` masih mendefinisikan `forest`, `sand`, `parchment`, `amber`, serta font Playfair Display, Source Sans 3, dan JetBrains Mono. Font aktif yang dimuat adalah Barlow, Barlow Condensed, Share Tech Mono, dan Special Elite; beranda mobile menambahkan Georgia.

Kompilasi langsung stylesheet menggunakan compiler Tailwind yang terpasang menghasilkan:

| Utility kandidat | Dihasilkan |
| --- | --- |
| `bg-forest` | Tidak |
| `text-sand` | Tidak |
| `bg-amber` | Tidak |
| `bg-parchment` | Tidak |
| `font-display` | Tidak |
| `bg-amber-500` sebagai pembanding | Ya |

`Button.astro`, `Badge.astro`, dan `Card.astro` masih memakai beberapa utility lama. Tidak ditemukan impor komponen tersebut dalam sumber aktif yang dipindai, sehingga ini merupakan risiko pemakaian ulang, bukan bukti seluruh tombol produksi kehilangan warna.

Tindakan: pilih satu sumber token dan definisikan melalui `@theme` untuk Tailwind 4 bila tetap menggunakan utility bermerek. Perbarui atau hapus komponen lama setelah memastikan pemakaiannya. Jangan sekadar mengaktifkan config lama tanpa memeriksa konflik palet dan dependensi typography yang disebut di dalamnya.

### P2 — Hierarki informasi kalah oleh dekorasi

Desktop memulai perjalanan dengan carousel artikel dan panel maskot besar. Penjelasan singkat manfaat Arkara serta titik mulai untuk pembaca baru tidak tampak jelas pada bagian awal. H1 beranda berada dalam `home-feed-section` yang disembunyikan pada mobile; temuan ini berkaitan dengan struktur heading dan orientasi pembaca, bukan bukti penalti SEO.

Pada mobile, judul fitur memakai Georgia 17,28 px dan kolom sempit di sebelah gambar persegi. Judul panjang sampel membentuk banyak baris. Arsip blog dan arsip panduan kembali memakai bahasa judul yang berbeda. Kategori beranda hanya menampilkan nama untuk Panduan, sementara kategori lain mengandalkan ikon; Keamanan juga tidak ada pada deretan kategori beranda, walaupun tersedia di arsip panduan.

Tindakan: tampilkan proposisi singkat dan CTA “Mulai dari kesiapan 72 jam”; bedakan jalur “Baca investigasi” dan “Cari panduan”; utamakan judul yang mudah dipindai. Terapkan satu pola heading dan beri label kategori yang terlihat. Maskot dapat memberi satu saran atau membantu memilih topik dalam ruang lebih kecil.

### P2 — Gerak dan interaksi belum mempunyai aturan bersama

Ticker berjalan tanpa henti (`index.astro:317`), bubble maskot bergerak tanpa henti (`MascotSection.astro`), dan cursor header berkedip (`DesktopHeader.astro:22`). Pemeriksaan reduced motion hanya ditemukan untuk autoplay carousel. Carousel berhenti pada hover container tetapi tidak mempunyai kontrol pause permanen atau penanganan focus-in yang setara di kode yang diperiksa. Semua slide juga tetap muncul di accessibility tree meskipun hanya satu terlihat.

Tindakan: tambahkan kebijakan reduced motion untuk semua animasi; sediakan pause untuk konten bergerak; hentikan pergantian carousel selama fokus berada di dalamnya; keluarkan elemen interaktif slide tidak aktif dari urutan fokus. Fokus yang terlihat sudah ada pada beberapa tautan header/footer, tetapi pola bersama belum ada. Skip link juga belum ditemukan.

### P2 — Informasi antarmuka belum konsisten dengan data/fungsi

- Artikel sampel diberi label **6 menit** di fitur mobile, **1 menit** di kartu/arsip, tetapi **12 menit** di halaman baca. Angka 6 menit memang ditulis tetap pada `index.astro:196`; kartu menghitung dari content yang opsional. Gunakan satu nilai durasi baca dari sumber konten yang sama.
- “Pilihan Editor” berasal dari `recentPosts.slice(2,5)` (`index.astro:51`), bukan mekanisme kurasi eksplisit. Gunakan nama “Rekomendasi Artikel” atau data kurasi yang sesuai.
- Footer menampilkan status database/QR secara statis. Informasi ini mengambil ruang tanpa membuktikan status aktual. Hilangkan dari pengalaman pembaca atau hubungkan dengan kondisi yang benar-benar relevan.
- `login.astro` menawarkan masuk untuk menyimpan progres, tetapi tombol Masuk bertipe `button` tanpa handler dalam berkas yang diperiksa. Ini temuan sumber, bukan hasil mencoba autentikasi. Selaraskan janji UI dengan fungsi sebelum menonjolkan Profil dalam navigasi.

## Catatan tabel: risiko, bukan kegagalan pada sampel

`global.css:365–369` masih memberi warna gelap pada `td`, sementara tema pembaca gelap tidak menimpa sel secara langsung. Namun sel tabel artikel sampel berisi `<p>`, dan paragraf tersebut sudah diubah menjadi `#CBD5E1`. Pemeriksaan visual mengonfirmasi tabel sampel tetap terbaca. Kesimpulan awal dari warna computed `td` saja tidak cukup.

Tetap perbaiki token warna tabel, header, sel, kode, mark, serta heading h4–h6 secara menyeluruh supaya hasil tidak bergantung pada struktur HTML editor. Uji tabel dengan teks langsung dalam sel maupun paragraf bersarang, termasuk tabel lebih dari dua kolom. `table-layout: fixed` dan `overflow-wrap: anywhere` dapat memecah kata terlalu agresif untuk data teknis.

## Konsep yang direkomendasikan

**Arkara sebagai media editorial kesiapsiagaan keluarga dengan karakter buku panduan lapangan.** Pembaca harus cepat memahami risiko, menemukan tindakan, dan kembali ke panduan yang pernah dibaca.

| Aspek | Arah |
| --- | --- |
| Warna | Forest green, warm amber, permukaan kertas terang dan hijau hitam gelap yang saling berpadanan |
| Tema | Light/dark memakai token semantik yang sama; pemilihan tema tidak ditentukan oleh ukuran layar |
| Tipografi | Satu font baca; satu font judul; mono terbatas untuk label pendek. Condensed uppercase untuk judul pendek, sentence case untuk judul artikel panjang |
| Bentuk | Garis tegas sebagai aksen; radius dan shadow mengikuti skala kecil yang konsisten |
| Ilustrasi | Pertahankan cerita editorial, dengan perlakuan warna konsisten dan ruang baca tenang |
| Maskot | Pemandu kontekstual yang menawarkan tindakan; proporsi mengikuti ruang konten |
| Gerak | Sedikit, bermakna, bisa dihentikan, dan menghormati reduced motion |
| Arsitektur konten | Investigasi memberi pemahaman; panduan memberi langkah; beranda membantu memilih keduanya |

## Urutan pengerjaan

1. Perbaiki kontras kartu dan nama penulis; samakan sumber durasi baca. Periksa seluruh primitive prose pada tema gelap.
2. Tetapkan tema, token semantik, skala tipografi, radius, dan breakpoint bersama. Perbaiki hero tablet.
3. Migrasikan PostCard, FeaturedPost, dan tombol ke kelas/komponen bersama, lalu arsip blog/panduan dan halaman baca. Kurangi override sebagai hasil migrasi, bukan sebagai target angka semata.
4. Perjelas manfaat Arkara pada awal beranda dan tambahkan jalur mulai untuk pembaca baru. Kecilkan dekorasi yang memperebutkan ruang judul.
5. Lengkapi fokus keyboard, skip link, pause carousel, reduced motion, serta slide tidak aktif. Sesuaikan label UI dengan data dan kemampuan yang tersedia.
6. Verifikasi desktop, mobile, dan tablet; judul pendek/panjang; tabel sederhana/lebar; kedua tema; zoom 200%; keyboard; dan reduced motion. Ukur performa setelah fondasi visual stabil.

## Referensi resmi

- Tailwind CSS, penggunaan config JavaScript pada v4: https://tailwindcss.com/docs/upgrade-guide#using-a-javascript-config-file
- Tailwind CSS, `@config` dan directive: https://tailwindcss.com/docs/functions-and-directives
- W3C, Contrast Minimum: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum
- W3C, Pause, Stop, Hide: https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide
