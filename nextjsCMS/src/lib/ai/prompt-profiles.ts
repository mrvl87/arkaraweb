/**
 * AI Prompts - Versioned prompt builders with persona split for each content type.
 */

import type { AIMessage } from './client'
import type {
  GenerateSlugInput,
  GenerateSEOPackInput,
  GenerateOutlineInput,
  GenerateFullDraftInput,
  GenerateImagePromptsInput,
  GenerateClusterIdeasInput,
  RewriteSectionInput,
  ExpandSectionInput,
  GenerateFAQInput,
} from './schemas'

export const PROMPT_VERSION = 'v4'

export type AIContentProfile = 'post' | 'panduan' | 'workspace'

function getProfileName(profile: AIContentProfile): string {
  switch (profile) {
    case 'post':
      return 'blog post editorial'
    case 'panduan':
      return 'panduan teknis'
    default:
      return 'konten editorial umum'
  }
}

function getProfileDirective(profile: AIContentProfile): string {
  switch (profile) {
    case 'post':
      return `Karakter output untuk blog post:
- Gaya lebih editorial, naratif, dan enak dibaca dari awal sampai akhir
- Fokus pada hook, flow, dan daya tarik klik tanpa terasa murahan
- Tetap praktis, tetapi boleh lebih atmosferik dan persuasif
- Cocok untuk artikel publik yang ingin dibaca, dibagikan, dan diindeks SEO`
    case 'panduan':
      return `Karakter output untuk panduan:
- Gaya lebih teknis, instruksional, dan langsung ke langkah kerja
- Prioritaskan kejelasan, urutan, dan tindakan yang bisa diikuti
- Hindari basa-basi editorial yang terlalu panjang
- Cocok untuk dokumen rujukan, SOP ringan, checklist, atau penjelasan teknis`
    default:
      return `Karakter output untuk workspace:
- Gaya netral editorial
- Tetap jelas, terstruktur, dan praktis
- Jangan terlalu teknis seperti SOP, tetapi juga jangan terlalu promosi`
  }
}

function buildSystemPrompt(profile: AIContentProfile): string {
  return `Anda adalah AI editorial copilot untuk Arkara - platform pengetahuan survival Indonesia.
Anda membantu editor menyusun konten yang akurat, praktis, dan SEO-friendly.

Aturan ketat:
1. Selalu jawab dalam format JSON yang valid dan bersih, tanpa penjelasan tambahan di luar JSON.
2. Bahasa: Indonesia formal, mudah dimengerti.
3. Fokus pada kemandirian (self-reliance) dan kesiapsiagaan.
4. Jangan pernah menambahkan teks di luar struktur JSON yang diminta.

Jenis konten saat ini: ${getProfileName(profile)}
${getProfileDirective(profile)}`
}

function getArkaraImageStyleAnchor(): string {
  return `editorial illustration with graphic novel influence, detailed painterly quality, bold clean linework, National Geographic meets contemporary graphic novel style, rich muted palette with deep forest green and warm amber accents, cinematic narrative composition, modern Indonesian setting, empowering and calm mood`
}

function getArkaraImageProfileDirection(profile: AIContentProfile): string {
  switch (profile) {
    case 'panduan':
      return `Untuk panduan teknis Arkara:
- Pertahankan signature style Arkara, tetapi komposisi harus lebih informatif dan terbaca jelas
- Utamakan medium shot, overhead, close-up proses, atau scene setup yang membantu pembaca memahami alat dan tindakan
- Fokus pada prosedur, alat, tangan yang sedang bekerja, hubungan antarobjek, dan situasi lapangan/rumah yang realistis
- Hindari adegan yang terlalu heroik jika mengurangi kejelasan instruksional`
    case 'post':
      return `Untuk blog post Arkara:
- Pertahankan signature style Arkara dengan pendekatan lebih naratif dan editorial
- Utamakan storytelling visual, momen manusiawi, dan komposisi cover yang kuat
- Fokus pada rasa kompeten, tenang, siap, dan mandiri dalam konteks survival perkotaan maupun rumah tangga Indonesia
- Boleh lebih atmosferik selama tetap grounded dan relevan dengan isi artikel`
    default:
      return `Untuk workspace Arkara:
- Pertahankan signature style Arkara secara konsisten
- Jaga keseimbangan antara kejelasan informasi dan kekuatan storytelling visual`
  }
}

export function buildSlugPrompt(
  input: GenerateSlugInput,
  profile: AIContentProfile = 'workspace'
): AIMessage[] {
  const contentLabel = profile === 'panduan' ? 'panduan teknis' : 'artikel'

  return [
    { role: 'system', content: buildSystemPrompt(profile) },
    {
      role: 'user',
      content: `Buatkan slug URL yang SEO-friendly untuk ${contentLabel} dengan judul berikut.

Judul: "${input.title}"

Balas dalam JSON format ini:
{
  "slug": "slug-utama-yang-direkomendasikan",
  "alternatives": ["slug-alternatif-1", "slug-alternatif-2"]
}

Aturan slug:
- Huruf kecil semua, tanpa karakter spesial
- Gunakan tanda hubung (-) sebagai pemisah
- Maksimal 5-7 kata kunci
- Hilangkan kata penghubung yang tidak penting (di, ke, dan, yang, untuk)
- Pertahankan kata kunci utama`,
    },
  ]
}

export function buildSEOPackPrompt(
  input: GenerateSEOPackInput,
  profile: AIContentProfile = 'workspace'
): AIMessage[] {
  const contentContext = input.content
    ? `\n\nKonten artikel (ringkasan):\n"${input.content.substring(0, 2000)}"`
    : ''
  const descContext = input.description
    ? `\n\nDeskripsi yang ada:\n"${input.description}"`
    : ''

  const seoDirection =
    profile === 'panduan'
      ? `- Meta title dan description harus terasa teknis, jelas, dan trustworthy
- Excerpt harus terasa seperti ringkasan panduan praktis, bukan teaser editorial`
      : `- Meta title dan description boleh lebih click-worthy selama tetap akurat
- Excerpt harus menarik, enak dibaca, dan terasa editorial`

  return [
    { role: 'system', content: buildSystemPrompt(profile) },
    {
      role: 'user',
      content: `Buatkan paket SEO lengkap untuk artikel ini.

Judul: "${input.title}"${contentContext}${descContext}

Balas dalam JSON format ini:
{
  "meta_title": "judul SEO maks 60 karakter, mengandung keyword utama, menarik klik",
  "meta_desc": "deskripsi meta maks 155 karakter, merangkum isi, mengandung CTA implisit",
  "excerpt": "ringkasan 2-3 kalimat untuk kartu artikel, menarik dan informatif",
  "focus_keyword": "keyword utama target",
  "secondary_keywords": ["keyword-2", "keyword-3", "keyword-4"]
}

Aturan tambahan:
${seoDirection}`,
    },
  ]
}

export function buildOutlinePrompt(
  input: GenerateOutlineInput,
  internalLinks?: string,
  profile: AIContentProfile = 'workspace'
): AIMessage[] {
  const extras: string[] = []
  if (input.keyword) extras.push(`Keyword target: ${input.keyword}`)
  if (input.angle) extras.push(`Sudut pandang: ${input.angle}`)
  if (input.audience) extras.push(`Audiens: ${input.audience}`)
  if (input.notes) extras.push(`Catatan tambahan: ${input.notes}`)

  const outlineDirection =
    profile === 'panduan'
      ? `- Prioritaskan urutan langkah, checklist, peringatan, dan bagian praktis
- Heading harus terasa seperti panduan kerja, bukan feature article`
      : `- Prioritaskan alur baca yang nyaman, hook, konteks, dan transisi antarbab
- Heading harus terasa editorial, spesifik, dan menarik dibaca`

  const linksContext = internalLinks
    ? `\n\nBerikut adalah daftar artikel yang sudah ada di website. Jika ada topik yang relevan, tandai di catatan bahwa kita bisa menambahkan internal link ke artikel tersebut:\n${internalLinks}`
    : ''

  return [
    { role: 'system', content: buildSystemPrompt(profile) },
    {
      role: 'user',
      content: `Buatkan outline/kerangka artikel yang terstruktur baik.

Judul: "${input.title}"
${extras.join('\n')}${linksContext}

Balas dalam JSON format ini:
{
  "outline_title": "judul final yang dioptimasi",
  "sections": [
    {
      "heading": "Nama heading H2",
      "subheadings": ["Sub-heading H3 (opsional)"],
      "notes": "catatan singkat tentang apa yang ditulis di bagian ini, termasuk saran internal link jika relevan"
    }
  ],
  "estimated_word_count": 1500
}

Aturan:
- Minimal 5 bagian (sections)
- Sertakan Pendahuluan dan Kesimpulan
- Setiap heading harus spesifik, bukan generik
${outlineDirection}`,
    },
  ]
}

export function buildFullDraftPrompt(
  input: GenerateFullDraftInput,
  internalLinks?: string,
  profile: AIContentProfile = 'workspace'
): AIMessage[] {
  const extras: string[] = []
  if (input.keyword) extras.push(`Keyword target: ${input.keyword}`)
  if (input.angle) extras.push(`Sudut pandang: ${input.angle}`)
  if (input.audience) extras.push(`Audiens: ${input.audience}`)
  if (input.notes) extras.push(`Catatan tambahan: ${input.notes}`)
  if (input.outline) extras.push(`Outline yang harus diikuti:\n${input.outline}`)

  const draftDirection =
    profile === 'panduan'
      ? `- Susun tulisan seperti panduan teknis yang mudah diikuti
- Gunakan kalimat yang lugas dan langsung ke tindakan
- Jika relevan, gunakan urutan langkah, checklist, atau subbagian prosedural
- Hindari pembukaan yang terlalu panjang atau terlalu promosi`
      : `- Susun tulisan seperti artikel editorial publik yang engaging
- Gunakan flow yang enak dibaca, transisi halus, dan pembukaan yang kuat
- Boleh lebih naratif dan persuasif selama tetap akurat
- Jaga agar tulisan terasa hidup, bukan kaku seperti SOP`

  const linksContext = internalLinks
    ? `\n\nBerikut adalah daftar artikel yang sudah ada di website Arkara. Sisipkan internal link secara natural menggunakan format Markdown [teks anchor](/blog/slug-artikel) ke artikel yang relevan dengan pembahasan. Jangan paksakan link jika tidak relevan.\n${internalLinks}`
    : ''

  return [
    { role: 'system', content: buildSystemPrompt(profile) },
    {
      role: 'user',
      content: `Tulis artikel lengkap dalam format Markdown berdasarkan brief berikut.

Judul: "${input.title}"
${extras.join('\n')}${linksContext}

Balas dalam JSON format ini:
{
  "content": "## Heading pertama\\n\\nParagraf pertama...\\n\\n## Heading kedua\\n\\n...",
  "word_count": 1500,
  "suggested_slug": "slug-yang-disarankan",
  "suggested_meta_title": "judul SEO maks 60 karakter",
  "suggested_meta_desc": "deskripsi meta maks 155 karakter"
}

Aturan penulisan:
- Format Markdown dengan heading H2 dan H3
- Bahasa Indonesia formal tapi mudah dipahami
- Minimal 1200 kata
- Sertakan tips praktis dan langkah-langkah yang actionable
- Sisipkan internal link ke artikel terkait secara natural jika data tersedia
- JANGAN sertakan heading H1 (judul akan diset terpisah)
${draftDirection}`,
    },
  ]
}

export function buildImagePromptsPrompt(
  input: GenerateImagePromptsInput,
  profile: AIContentProfile = 'workspace'
): AIMessage[] {
  const excerptContext = input.excerpt
    ? `\nExcerpt artikel:\n"${input.excerpt}"`
    : ''
  const keywordContext = input.focus_keyword
    ? `\nFocus keyword: ${input.focus_keyword}`
    : ''
  const categoryContext = input.category
    ? `\nKategori/topik: ${input.category}`
    : ''

  const arkaraStyleAnchor = getArkaraImageStyleAnchor()
  const imageDirection = getArkaraImageProfileDirection(profile)

  return [
    { role: 'system', content: buildSystemPrompt(profile) },
    {
      role: 'user',
      content: `Buatkan 3 sampai 4 prompt text-to-image untuk Nano Banana berdasarkan artikel final yang sudah disetujui berikut.

Judul: "${input.title}"${excerptContext}${keywordContext}${categoryContext}

Isi artikel:
"${input.content.substring(0, 4000)}"

Signature visual Arkara yang WAJIB menjadi dasar setiap prompt:
${arkaraStyleAnchor}

${imageDirection}

Balas dalam JSON format ini:
{
  "art_direction": "ringkasan arah visual umum dalam 1-2 kalimat",
  "hero_prompts": [
    {
      "label": "Hero Prompt 1",
      "prompt": "prompt text-to-image lengkap, spesifik, siap copy untuk Nano Banana"
    },
    {
      "label": "Hero Prompt 2",
      "prompt": "prompt text-to-image lengkap, spesifik, siap copy untuk Nano Banana"
    },
    {
      "label": "Hero Prompt 3",
      "prompt": "prompt text-to-image lengkap, spesifik, siap copy untuk Nano Banana"
    }
  ]
}

Aturan prompt:
- Setiap prompt harus panjang, kaya detail, dan siap langsung dipakai
- Gunakan bahasa Inggris untuk isi prompt agar kualitas text-to-image lebih stabil
- Setiap prompt harus secara eksplisit mengikuti signature style Arkara di atas
- Tulis prompt sebagai satu kalimat/deskripsi panjang yang natural untuk model image generation
- Sebaiknya buka prompt dengan style anchor Arkara, lalu lanjutkan dengan detail adegan, subjek, lighting, mood, dan komposisi
- Jangan menulis placeholder seperti [subject] atau [style]
- Hindari teks yang harus muncul di gambar
- Jangan gunakan istilah yang terlalu abstrak; selalu visual dan konkret
- Pastikan tiap prompt menawarkan angle visual yang berbeda satu sama lain
- Utamakan 4 prompt. Hanya boleh 3 prompt jika memang artikel terlalu sempit untuk dibuat variasi yang benar-benar berbeda
- Jangan ulang adegan yang sama hanya dengan sinonim kecil
- Pastikan detail gambar tetap setia pada isi artikel; jangan menambahkan klaim, alat, atau situasi yang tidak didukung artikel
- Jika artikel menyebut daftar alat atau langkah spesifik, gunakan hanya alat dan tindakan itu sebagai dasar visual utama
- Prioritaskan wajah, pakaian, arsitektur, peralatan dapur, rumah, jalan, atau lingkungan yang terasa Indonesia modern bila relevan
- Hindari photorealism generik, glossy 3D render, flat vector style, anime look, dan sci-fi aesthetics
- Hindari logo merek, signage yang terbaca jelas, atau teks besar di dalam gambar kecuali artikel memang menuntutnya
- Hasil akhir harus terasa premium, relevan, dan kuat untuk visual cover`,
    },
  ]
}

export function buildClusterIdeasPrompt(
  input: GenerateClusterIdeasInput,
  profile: AIContentProfile = 'workspace'
): AIMessage[] {
  const existingContext = input.existing_titles?.length
    ? `\n\nArtikel yang sudah ada (jangan duplikasi):\n${input.existing_titles.map((t) => `- ${t}`).join('\n')}`
    : ''

  return [
    { role: 'system', content: buildSystemPrompt(profile) },
    {
      role: 'user',
      content: `Buatkan cluster ide konten berdasarkan topik pillar berikut.

Topik: "${input.topic}"${existingContext}

Balas dalam JSON format ini:
{
  "pillar_topic": "topik pillar utama",
  "ideas": [
    {
      "title": "judul artikel yang spesifik",
      "angle": "sudut pandang unik artikel ini",
      "target_keyword": "keyword target utama",
      "content_type": "post"
    }
  ]
}

Aturan:
- Generate 5-8 ide
- Setiap ide harus punya sudut yang unik dan berbeda
- Campurkan antara post dan panduan
- Fokus keyword yang realistis dan kompetitif rendah`,
    },
  ]
}

export function buildRewritePrompt(
  input: RewriteSectionInput,
  profile: AIContentProfile = 'workspace'
): AIMessage[] {
  const extras: string[] = []
  if (input.instruction) extras.push(`Instruksi khusus: ${input.instruction}`)
  if (input.tone) extras.push(`Tone/nada: ${input.tone}`)

  const rewriteDirection =
    profile === 'panduan'
      ? `- Pertajam instruksi, urutan, dan kejelasan teknis
- Hindari kalimat yang terlalu berbunga-bunga`
      : `- Buat flow lebih hidup dan nyaman dibaca
- Jaga agar hasil tetap terasa editorial dan engaging`

  return [
    { role: 'system', content: buildSystemPrompt(profile) },
    {
      role: 'user',
      content: `Tulis ulang bagian teks berikut agar lebih baik.

Teks asli:
"${input.section_text}"
${extras.join('\n')}

Balas dalam JSON format ini:
{
  "rewritten_text": "hasil rewrite dalam format Markdown"
}

Aturan:
- Pertahankan makna inti
- Perbaiki flow dan kejelasan
- Gunakan bahasa yang lebih menarik
${rewriteDirection}`,
    },
  ]
}

export function buildExpandPrompt(
  input: ExpandSectionInput,
  profile: AIContentProfile = 'workspace'
): AIMessage[] {
  const directionNote = input.direction
    ? `\nArah ekspansi: ${input.direction}`
    : ''

  const expandDirection =
    profile === 'panduan'
      ? `- Tambahkan rincian teknis, contoh penerapan, dan langkah yang bisa langsung diikuti
- Prioritaskan kejelasan instruksi dibanding dramatisasi`
      : `- Tambahkan konteks, ilustrasi, dan detail yang membuat bacaan lebih kaya
- Prioritaskan kenyamanan membaca dan flow editorial`

  return [
    { role: 'system', content: buildSystemPrompt(profile) },
    {
      role: 'user',
      content: `Kembangkan dan perluas bagian teks berikut menjadi lebih detail dan informatif.

Teks asli:
"${input.section_text}"${directionNote}

Balas dalam JSON format ini:
{
  "expanded_text": "hasil ekspansi dalam format Markdown, 2-3x lebih panjang dari aslinya"
}

Aturan:
- Tambahkan detail, contoh, dan penjelasan
- Pertahankan gaya bahasa yang konsisten
- Format Markdown yang rapi
${expandDirection}`,
    },
  ]
}

export function buildFAQPrompt(
  input: GenerateFAQInput,
  profile: AIContentProfile = 'workspace'
): AIMessage[] {
  const contentContext = input.content
    ? `\n\nKonten artikel:\n"${input.content.substring(0, 2000)}"`
    : ''

  const faqDirection =
    profile === 'panduan'
      ? `- Utamakan pertanyaan praktis, penggunaan, langkah, dan batasan teknis
- Jawaban harus terdengar seperti rujukan praktis`
      : `- Utamakan pertanyaan pembaca umum yang membantu engagement dan SEO
- Jawaban boleh lebih komunikatif dan mengalir`

  return [
    { role: 'system', content: buildSystemPrompt(profile) },
    {
      role: 'user',
      content: `Buatkan FAQ (Frequently Asked Questions) untuk artikel ini.

Judul: "${input.title}"${contentContext}

Balas dalam JSON format ini:
{
  "faqs": [
    {
      "question": "pertanyaan yang sering ditanyakan",
      "answer": "jawaban yang informatif dan ringkas"
    }
  ]
}

Aturan:
- Generate 5-7 FAQ
- Pertanyaan harus natural, seperti yang akan ditanyakan pembaca
- Jawaban ringkas tapi informatif (2-4 kalimat)
- Fokus pada aspek praktis
${faqDirection}`,
    },
  ]
}
