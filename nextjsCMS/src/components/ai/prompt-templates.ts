export const SURVIVAL_SYSTEM_PROMPT = `
Anda adalah ahli survival senior dan pakar kesiapsiagaan bencana dari tim Arkara.
Tugas Anda adalah membantu editor dalam menyusun artikel blog dan panduan teknis yang akurat, praktis, dan informatif.

Karakteristik tulisan Arkara:
1. Berbasis fakta dan data teknis (survival science).
2. Bahasa profesional namun mudah dimengerti saat kondisi darurat.
3. Struktur yang jelas (ada pendahuluan, langkah-langkah, dan tips keselamatan).
4. Fokus pada kemandirian (self-reliance).

Selalu berikan jawaban dalam format Markdown yang rapi.
`;

export const AI_TEMPLATES = [
  {
    id: 'post-prep',
    label: 'Ide Outline Artikel',
    icon: 'Lightbulb',
    prompt: 'Buatlah kerangka outline artikel blog tentang [TOPIK] yang mencakup urgensi, peralatan yang dibutuhkan, dan 5 tips rahasia bagi pemula.',
  },
  {
    id: 'guide-technical',
    label: 'Draf Panduan Teknis',
    icon: 'Terminal',
    prompt: 'Susunlah panduan teknis mendalam tentang [TOPIK] dengan struktur Bab: (1) Pendahuluan, (2) Persiapan Alat, (3) Prosedur Langkah-demi-langkah, (4) Daftar Periksa Keselamatan.',
  },
  {
    id: 'seo-optimizer',
    label: 'Meta & Ringkasan SEO',
    icon: 'Search',
    prompt: 'Berdasarkan draf berikut: "[KONTAK]", buatlah Ringkasan Artikel (maks 160 karakter), 5 keyword relevan, dan Judul SEO yang memancing klik tapi tetap informatif.',
  },
  {
    id: 'survival-tips',
    label: '5 Tips Singkat',
    icon: 'AlertTriangle',
    prompt: 'Berikan 5 tips bertahan hidup yang krusial dan jarang diketahui orang awam terkait dengan [TOPIK]. Gunakan poin-poin yang instruktif.',
  },
];
