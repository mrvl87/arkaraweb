/**
 * AI Prompts — Versioned prompt builders for each AI operation.
 * Each builder returns an array of AIMessage objects.
 * Prompt version is tracked as 'v1' for auditing via logger.
 */

import type { AIMessage } from './client'
import type {
  GenerateSlugInput,
  GenerateSEOPackInput,
  GenerateOutlineInput,
  GenerateFullDraftInput,
  GenerateClusterIdeasInput,
  RewriteSectionInput,
  ExpandSectionInput,
  GenerateFAQInput,
} from './schemas'

export const PROMPT_VERSION = 'v1'

// ─── Base System Prompt ──────────────────────────────────────────
const ARKARA_SYSTEM = `Anda adalah AI editorial copilot untuk Arkara — platform pengetahuan survival Indonesia.
Anda membantu editor menyusun konten yang akurat, praktis, dan SEO-friendly.

Aturan ketat:
1. Selalu jawab dalam format JSON yang valid dan bersih, tanpa penjelasan tambahan di luar JSON.
2. Bahasa: Indonesia formal, mudah dimengerti.
3. Fokus pada kemandirian (self-reliance) dan kesiapsiagaan.
4. Jangan pernah menambahkan teks di luar struktur JSON yang diminta.`

// ─── Generate Slug ───────────────────────────────────────────────
export function buildSlugPrompt(input: GenerateSlugInput): AIMessage[] {
  return [
    { role: 'system', content: ARKARA_SYSTEM },
    {
      role: 'user',
      content: `Buatkan slug URL yang SEO-friendly untuk artikel dengan judul berikut.

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

// ─── Generate SEO Pack ───────────────────────────────────────────
export function buildSEOPackPrompt(input: GenerateSEOPackInput): AIMessage[] {
  const contentContext = input.content
    ? `\n\nKonten artikel (ringkasan):\n"${input.content.substring(0, 2000)}"`
    : ''
  const descContext = input.description
    ? `\n\nDeskripsi yang ada:\n"${input.description}"`
    : ''

  return [
    { role: 'system', content: ARKARA_SYSTEM },
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
}`,
    },
  ]
}

// ─── Generate Outline ────────────────────────────────────────────
export function buildOutlinePrompt(
  input: GenerateOutlineInput,
  internalLinks?: string
): AIMessage[] {
  const extras: string[] = []
  if (input.keyword) extras.push(`Keyword target: ${input.keyword}`)
  if (input.angle) extras.push(`Sudut pandang: ${input.angle}`)
  if (input.audience) extras.push(`Audiens: ${input.audience}`)
  if (input.notes) extras.push(`Catatan tambahan: ${input.notes}`)

  const linksContext = internalLinks
    ? `\n\nBerikut adalah daftar artikel yang sudah ada di website. Jika ada topik yang relevan, tandai di catatan bahwa kita bisa menambahkan internal link ke artikel tersebut:\n${internalLinks}`
    : ''

  return [
    { role: 'system', content: ARKARA_SYSTEM },
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
- Setiap heading harus spesifik, bukan generik`,
    },
  ]
}

// ─── Generate Full Draft ─────────────────────────────────────────
export function buildFullDraftPrompt(
  input: GenerateFullDraftInput,
  internalLinks?: string
): AIMessage[] {
  const extras: string[] = []
  if (input.keyword) extras.push(`Keyword target: ${input.keyword}`)
  if (input.angle) extras.push(`Sudut pandang: ${input.angle}`)
  if (input.audience) extras.push(`Audiens: ${input.audience}`)
  if (input.notes) extras.push(`Catatan tambahan: ${input.notes}`)
  if (input.outline) extras.push(`Outline yang harus diikuti:\n${input.outline}`)

  const linksContext = internalLinks
    ? `\n\nBerikut adalah daftar artikel yang sudah ada di website Arkara. Sisipkan internal link secara natural menggunakan format Markdown [teks anchor](/blog/slug-artikel) ke artikel yang relevan dengan pembahasan. Jangan paksakan link jika tidak relevan.\n${internalLinks}`
    : ''

  return [
    { role: 'system', content: ARKARA_SYSTEM },
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
- JANGAN sertakan heading H1 (judul akan diset terpisah)`,
    },
  ]
}

// ─── Generate Cluster Ideas ──────────────────────────────────────
export function buildClusterIdeasPrompt(input: GenerateClusterIdeasInput): AIMessage[] {
  const existingContext = input.existing_titles?.length
    ? `\n\nArtikel yang sudah ada (jangan duplikasi):\n${input.existing_titles.map((t) => `- ${t}`).join('\n')}`
    : ''

  return [
    { role: 'system', content: ARKARA_SYSTEM },
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

// ─── Rewrite Section ─────────────────────────────────────────────
export function buildRewritePrompt(input: RewriteSectionInput): AIMessage[] {
  const extras: string[] = []
  if (input.instruction) extras.push(`Instruksi khusus: ${input.instruction}`)
  if (input.tone) extras.push(`Tone/nada: ${input.tone}`)

  return [
    { role: 'system', content: ARKARA_SYSTEM },
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
- Gunakan bahasa yang lebih menarik`,
    },
  ]
}

// ─── Expand Section ──────────────────────────────────────────────
export function buildExpandPrompt(input: ExpandSectionInput): AIMessage[] {
  const directionNote = input.direction
    ? `\nArah ekspansi: ${input.direction}`
    : ''

  return [
    { role: 'system', content: ARKARA_SYSTEM },
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
- Format Markdown yang rapi`,
    },
  ]
}

// ─── Generate FAQ ────────────────────────────────────────────────
export function buildFAQPrompt(input: GenerateFAQInput): AIMessage[] {
  const contentContext = input.content
    ? `\n\nKonten artikel:\n"${input.content.substring(0, 2000)}"`
    : ''

  return [
    { role: 'system', content: ARKARA_SYSTEM },
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
- Fokus pada aspek praktis`,
    },
  ]
}
