# Arkara CMS Frontend Standard

Dokumen ini menjadi standar kerja frontend untuk Arkara CMS. Tujuannya menjaga UI konsisten, mudah direfactor, dan tidak kembali ke pola inline style.

## Prinsip

- Gunakan komponen di `src/components/ui` sebelum membuat styling lokal baru.
- Gunakan token Tailwind `arkara.green`, `arkara.amber`, `arkara.cream`, dan `arkara.dark`.
- Hindari inline style untuk warna, spacing, radius, typography, dan shadow.
- Hindari hardcoded hex di komponen React. Hex hanya boleh berada di `tailwind.config.ts`, CSS variables global, atau kebutuhan editor/content rendering khusus.
- Halaman CMS harus terasa sebagai dashboard operasional: padat, jelas, mudah discan.

## Warna

- Brand utama: `text-arkara-green`, `bg-arkara-green`.
- Aksen utama: `text-arkara-amber`, `bg-arkara-amber`.
- Latar aplikasi: `bg-arkara-cream`.
- Surface utama: `bg-white`, `border-gray-100`, `shadow-sm`.
- Status boleh memakai semantic Tailwind:
  - success: `green`
  - warning: `amber`
  - danger: `red`
  - info: `sky`

## Spacing, Radius, Shadow

- Page shell: `space-y-8` sampai `space-y-10`.
- Card content default: `p-6`; card besar boleh `p-8`.
- Radius default component: `rounded-xl` untuk control, `rounded-2xl` untuk card/panel.
- Hindari radius arbitrer seperti `rounded-[3rem]` kecuali ada alasan visual khusus.
- Shadow default: `shadow-sm`; interactive card boleh `hover:shadow-xl`.

## Typography

- Page title memakai `PageHeader`.
- Label form memakai `text-sm font-medium` atau `font-bold`.
- Micro label boleh memakai uppercase/tracking, tetapi batasi pada metadata kecil.
- Hindari `italic`, `font-black`, dan `tracking-[...]` berlebihan untuk halaman kerja.

## Komponen Wajib Dipakai

- Action utama: `Button`.
- Panel/kartu: `Card`, `CardContent`, `CardHeader`, `CardTitle`.
- Field form: `Input`, `Textarea`, `Select`.
- Status kecil: `Badge`.
- Header halaman: `PageHeader`.
- Grup form: `FormSection`.
- State kosong: `EmptyState`.

## Refactor Rule

Saat menyentuh halaman CMS lama:

1. Pindahkan inline style ke class Tailwind/token.
2. Ganti wrapper lokal dengan komponen UI jika pola sama sudah tersedia.
3. Jangan ubah logic data, auth, schema database, atau server action jika tugasnya frontend-only.
4. Refactor bertahap per halaman agar risiko visual kecil.
