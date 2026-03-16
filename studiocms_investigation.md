# Laporan Investigasi: Error Penyimpanan Halaman (StudioCMS)

Laporan ini menguraikan hasil investigasi mengenai kegagalan penyimpanan halaman saat mengedit (Edit Page) di StudioCMS versi 0.4.4, serta usulan solusi jangka pendek dan panjang.

## 1. Deskripsi Masalah
Saat menekan tombol **"Save"** di halaman Edit Page (`/dashboard/content-management/edit?edit=...`), sering muncul pesan error (Toast) berwarna merah dengan pesan:
> `Error: [page-title] is missing`

Di balik layar, error ini merupakan **"Encoded side transformation failure"** yang dilempar oleh library validasi data (`@effect/schema`). Sistem melaporkan bahwa ia tidak dapat menemukan data `page-title` (serta field penting lainnya) yang seharusnya dikirim melalui formulir.

## 2. Hasil Investigasi Akar Masalah
Setelah membongkar dan melacak susunan DOM (*Document Object Model*) di halaman edit StudioCMS (di dalam [EditPage.astro](file:///g:/My%20Own%20Project/Buku%201/Web/arkara/node_modules/studiocms/frontend/components/dashboard/content-mgmt/EditPage.astro) dan komponen-komponen UI lainnya), akar masalah ditemukan pada cara komponen disatukan dan cara browser memproses `FormData`:

1.  **Struktur HTML Bentrok (Form element):**
    *   Formulir utama dideklarasikan di dalam `<form id="edit-page-form">`.
    *   Di dalamnya, terdapat struktur *Tab* `<Tabs>` yang membungkus bagian-bagian form (Basic Info, Content, Diff).
    *   Yang menjadi kendala: Beberapa komponen lain seperti `<Modal>` (dalam [PageHeader.astro](file:///g:/My%20Own%20Project/Buku%201/Web/arkara/node_modules/studiocms/frontend/components/dashboard/PageHeader.astro)) memiliki elemen `<form>` sendiri atau cara DOM dirender oleh *Shadow DOM* / web components khusus milik StudioCMS (seperti `sui-tab-item`, `page-type-handler`, dsb) membuat browser gagal atau "kebingungan" merangkai *node* input kembali ke `<form id="edit-page-form">`.
2.  **FormData Gagal Mengambil `input`:**
    *   Fungsi submit di `<script>` StudioCMS (pada [EditPage.astro](file:///g:/My%20Own%20Project/Buku%201/Web/arkara/node_modules/studiocms/frontend/components/dashboard/content-mgmt/EditPage.astro)) mencoba mengemas seluruh isian dengan perintah:
        ```javascript
        const formData = new FormData(editPageForm);
        ```
    *   Kenyataannya, karena *input* (seperti `name="page-title"`) berada di dalam struktur div/tabs yang secara hirarki DOM "tersembunyi" dari form utama akibat *shadow boundaries* atau manipulasi JS, objek `formData` tersebut berakhir **kosong** (atau kehilangan beberapa isian penting).
3.  **Dampak:**
    *   `formData` kosong dikirim ke fungsi dekoder (Effect Schema `ObjectFromFormData`).
    *   Dekoder mengharapkan keberadaan field `page-title`, `page-slug`, dll. Karena kosong, dekoder menolak payload tersebut dan langsung melempar error `is missing`.

*(Catatan: Error "No Storage manager installed" di konsol adalah peringatan wajar jika Anda tidak memasang provider gambar eksternal di StudioCMS default, dan ini BUKAN penyebab terhentinya penyimpanan teks).*

## 3. Potensi Masalah Berkelanjutan (Risiko)
*   **Pengguna (User) Frustrasi:** Anda (atau klien Anda) akan sering gagal mengedit artikel yang sudah ditulis jika struktur tab DOM sedang tidak sinkron.
*   **Kehilangan Data:** Karena terjadi error validasi di sisi pengiriman (client-side), perubahan panjang yang sudah diketik di editor teks menjadi berisiko menguap jika pengguna me-refresh halaman tanpa menyimpan draf manual.

## 4. Kemungkinan Perbaikan dan Solusi

### Solusi Jangka Pendek (Workaround)
Bagi Anda sebagai pengguna *current release* StudioCMS (v0.4.4), terapkan salah satu trik berikut:
1.  **Hindari Modifikasi dari "Edit":** Buat artikel menggunakan layar **"Create Page"**. Layar pembuatan (Create) memiliki struktur DOM yang lebih ramping dan jarang mengalami masalah "hilang input" ini.
2.  **Hard Refresh sebelum Edit:** Jika terpaksa harus mengedit halaman yang sudah ada, lakukan *refresh penuh* (F5 atau Ctrl+R) sesudah halaman Edit terbuka, baru ubah isian, dan langsung tekan "Save".
3.  **Tahan Dulu Tombol Modal:** Hindari menggunakan tombol Modal tambahan/beralih tab terus-menerus sebelum menekan Save.

### Solusi Jangka Menengah / Panjang (Patching System)
Bagi pengembang sistem (kita) untuk menangani *bug* di StudioCMS ini:

1.  **Bypass Serialisasi Default (Patch Lokal):**
    Kita bisa menambahkan sepotong skrip (*Client-side script/injection*) tipis di [editpage.astro](file:///g:/My%20Own%20Project/Buku%201/Web/arkara/node_modules/studiocms/frontend/pages/%5Bdashboard%5D/content-management/editpage.astro) (meng-override lewat Astro middleware atau file proxy) yang mem-bypass `new FormData(form)`. Skrip ini secara manual akan mengumpulkan properti:
    ```javascript
    const title = document.querySelector('input[name="page-title"]').value;
    const content = document.querySelector('textarea[name="page-content"]').value;
    // ... lalu menembaknya langsung ke API dashboardClient
    ```
2.  **Downgrade / Upgrade Versi StudioCMS:**
    StudioCMS masih di masa pengembangan (`beta`/`0.x`). Menunggu rilis versi perbaikan `0.4.5` (atau `0.5.x`) adalah langkah paling masuk akal jika bypass memakan waktu. 
3.  **Tinggalkan StudioCMS Dashboard & Gunakan Mode Headless Astro:** 
    Berhubung fokus inti proyek Arkara adalah membangun website frontend yang super cepat dengan Astro, kita *bisa saja* tidak menggunakan halaman `/dashboard` bawaan StudioCMS sama sekali ke depannya. Sebagai gantinya, konten tetap dikelola dari Keystatic atau database, sedangkan StudioCMS murni digunakan sebagai ORM database di *belakang layar*.

---
**Kesimpulan Tindakan:**
Untuk fase proyek saat ini, lebih baik **memaklumi** ini sebagai *bug UI framework StudioCMS v0.4.4* dan melanjutkan instruksi "bagaimana menulis konten" sambil mengajarkan metode workaround standar. Mengubah kode referensi StudioCMS di dalam folder *node_modules* secara mendalam akan menyulitkan pembaruan (update) aplikasi di masa mendatang.
