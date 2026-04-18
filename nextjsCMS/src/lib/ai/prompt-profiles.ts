/**
 * AI Prompts - Versioned prompt builders with persona split for each content type.
 */

import type { AIMessage } from './client'
import type { ClaimExtractionResult } from './claim-extractor'
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
  ResearchWithWebInput,
  VerifyLatestFactsInput,
} from './schemas'

export const PROMPT_VERSION = 'v10'

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
- Gaya editorial Arkara harus tenang, tajam, realistis, dan sulit digantikan blog umum
- Fokus pada skenario, kontrol, ketergantungan, buffer, dan keputusan taktis
- Artikel harus terasa penting, bukan sekadar menarik
- Hindari gaya lifestyle blog, edukasi umum, atau motivational prepper content`
    case 'panduan':
      return `Karakter output untuk panduan:
- Gaya teknis Arkara harus lugas, terukur, realistis, dan mudah dieksekusi di rumah tangga urban Indonesia
- Prioritaskan kejelasan langkah, urutan, batasan, risiko, dan keputusan praktis
- Hindari basa-basi editorial, romantisasi survival, atau teori panjang yang tidak bisa dipakai
- Panduan harus terasa seperti alat kontrol, bukan artikel informasi umum`
    default:
      return `Karakter output untuk workspace:
- Gaya netral editorial
- Tetap jelas, terstruktur, dan praktis
- Jangan terlalu teknis seperti SOP, tetapi juga jangan terlalu promosi`
  }
}

function getArkaraEditorialFramework(profile: AIContentProfile): string {
  if (profile === 'panduan') {
    return `Framework Arkara yang harus terasa di hasil akhir:
- Mulai dari skenario atau gangguan nyata, bukan definisi umum
- Lakukan reality check: tunjukkan keterbatasan ruang, waktu, alat, distribusi, atau ekspektasi
- Reframe target: jelaskan apa yang realistis dan apa yang tidak
- Beri pilihan taktis yang jelas: prioritas utama vs pendukung, beserta alasannya
- WAJIB ada elemen simulasi, estimasi, ukuran, kapasitas, frekuensi, atau parameter nyata jika topik memungkinkan
- Jika simulasi belum tervalidasi penuh, nyatakan secara jujur sebagai estimasi konservatif atau skenario kecil, bukan kepastian palsu
- WAJIB ada failure mode: kesalahan fatal, batas aman, atau kondisi di mana pendekatan gagal
- Hubungkan dengan sistem Arkara lain bila relevan: air, energi, logistik, perilaku keluarga
- Tutup dengan mental shift yang tenang dan tegas, bukan motivasi kosong`
  }

  if (profile === 'post') {
    return `Framework Arkara yang harus terasa di hasil akhir:
- Buka dengan disruption entry: 2-3 kalimat pendek yang membuat pembaca masuk ke skenario
- Lanjutkan reality check: bongkar asumsi nyaman, ilusi kontrol, atau ketergantungan sistem
- Lakukan reframe: jelaskan target yang realistis, bukan fantasi kemandirian penuh
- Beri decision layer: pilihan taktis dan prioritas, bukan daftar opsi tanpa bobot
- WAJIB ada simulasi konkret: ruang, jumlah alat, output, durasi, frekuensi, biaya, kapasitas, atau angka relevan
- Jika simulasi belum tervalidasi penuh, nyatakan secara jujur sebagai estimasi konservatif, simulasi rumah tangga, atau skenario kecil; jangan menjual hipotesis sebagai fakta mapan
- WAJIB ada minimal satu scene konkret rumah tangga yang bisa divisualisasikan pembaca: momen menyiapkan makan, panen kecil, ruang balkon, stok menipis, keputusan keluarga, atau situasi sejenis
- WAJIB ada failure mode: kesalahan yang paling mungkin membuat pembaca gagal
- WAJIB ada system integration: hubungkan topik dengan sistem Arkara lain
- Tutup dengan mental shift yang menanamkan kontrol vs ketergantungan
- Closing harus terasa sticky: pembaca merasakan konsekuensi dari tidak bertindak, tanpa harus diteriaki atau dimotivasi secara murahan`
  }

  return `Framework Arkara:
- Fokus pada skenario nyata, kontrol, dan keputusan praktis
- Prioritaskan simulasi konkret dibanding penjelasan umum
- Hindari gaya generik, aman, dan mudah digantikan`
}

function getArkaraWritingRules(profile: AIContentProfile): string {
  const common = `Aturan gaya tulis Arkara:
- Suara: tenang, tegas, realistis, tidak panik, tidak dramatis berlebihan
- Bangun rasa sadar, waspada, dan ingin punya kontrol; jangan memicu panik
- Gunakan campuran kalimat pendek untuk tekanan dan kalimat medium untuk penjelasan
- Gunakan whitespace dan subheading tajam; nyaman dibaca di HP
- Diksi utama yang boleh sering muncul: sistem, kontrol, ketergantungan, distribusi, buffer, realistis, skenario
- Hindari frasa generik seperti "mudah sekali", "siapapun bisa", "praktis dan cepat", "tips dan trik"
- Hindari definisi panjang, sejarah topik, atau edukasi umum kecuali benar-benar perlu untuk keputusan pembaca
- Sudut pandang default: rumah tangga urban Indonesia, ruang terbatas, sumber daya terbatas, waktu terbatas`

  if (profile === 'panduan') {
    return `${common}
- Setiap instruksi utama harus bisa divisualisasikan atau dieksekusi
- Jika membahas kapasitas, kebutuhan, output, atau durasi, gunakan satuan nyata bila memungkinkan
- Jangan menulis langkah yang terdengar canggih tetapi tidak operasional
- Jika memakai simulasi yang belum tervalidasi, gunakan framing yang jujur dan konservatif`
  }

  if (profile === 'post') {
    return `${common}
- Jangan terdengar seperti feature article umum atau blog gaya hidup
- Setiap artikel harus meninggalkan satu kesimpulan taktis yang keras dan jelas
- Jika sebuah poin tidak bisa diuji, dihitung, diperkirakan, atau dikaitkan ke skenario nyata, pertimbangkan untuk tidak menuliskannya
- Bangun visual mental yang kuat melalui scene kecil yang realistis, bukan dramatisasi besar
- CTA atau penutup harus berbentuk konsekuensi dan pilihan, bukan ajakan generik`
  }

  return common
}

function buildSystemPrompt(profile: AIContentProfile): string {
  return `Anda adalah AI editorial copilot untuk Arkara - platform pengetahuan survival Indonesia.
Anda membantu editor menyusun konten yang akurat, praktis, tajam, dan sulit digantikan blog lain.

Aturan ketat:
1. Selalu jawab dalam format JSON yang valid dan bersih, tanpa penjelasan tambahan di luar JSON.
2. Bahasa: Indonesia yang rapi, mudah dimengerti, tegas, dan tidak terdengar generik.
3. Fokus pada kontrol, buffer, ketahanan rumah tangga urban, dan kesiapsiagaan yang realistis.
4. Jangan pernah menambahkan teks di luar struktur JSON yang diminta.
5. Arkara bukan lifestyle blog, bukan blog motivasi, dan bukan edukasi umum yang aman.
6. Prioritaskan simulasi nyata, keputusan taktis, dan system thinking dibanding teori panjang.
7. Jangan menenangkan pembaca dengan basa-basi. Bantu pembaca melihat kondisi dengan jernih.

Jenis konten saat ini: ${getProfileName(profile)}
${getProfileDirective(profile)}

${getArkaraEditorialFramework(profile)}

${getArkaraWritingRules(profile)}`
}

function getArkaraImageStyleAnchor(): string {
  return `editorial illustration with graphic novel influence, detailed painterly quality, bold clean linework, cinematic survival realism, high-tension visual storytelling, tactile urban detail, National Geographic meets contemporary graphic novel style, rich muted palette with deep forest green and warm amber accents, modern Indonesian setting`
}

function getArkaraImageProfileDirection(profile: AIContentProfile): string {
  switch (profile) {
    case 'panduan':
      return `Untuk panduan teknis Arkara:
- Gunakan signature style Arkara sebagai dasar visual, tetapi tone adegan harus mengikuti isi artikel
- Komposisi harus lebih informatif, teknis, dan terbaca jelas tanpa terasa seperti blueprint yang kaku
- Utamakan medium shot, overhead, cutaway ringan, close-up proses, atau scene setup yang membantu pembaca memahami alat, hubungan komponen, dan tindakan
- Fokus pada prosedur, alat, bahan, tangan yang sedang bekerja, hubungan antarobjek, dan situasi lapangan/rumah yang realistis
- Jika relevan, tampilkan skema visual yang rapi dan mudah dipahami, tetapi tetap hidup, editorial, dan tidak dingin
- Hindari adegan yang terlalu heroik jika mengurangi kejelasan instruksional`
    case 'post':
      return `Untuk blog post Arkara:
- Gunakan signature style Arkara sebagai dasar visual, tetapi tone adegan harus mengikuti isi artikel
- Pendekatan harus lebih naratif, lebih tajam, dan lebih menekan rasa penting topik
- Utamakan storytelling visual yang menunjukkan gangguan, ketergantungan, buffer yang tipis, kontrol yang rapuh, atau keputusan yang harus diambil
- Komposisi cover harus kuat dalam 1 pandangan: pembaca langsung merasa ada skenario, tekanan, dan taruhan nyata
- Fokus pada rumah tangga urban Indonesia yang sedang menghadapi keterbatasan, adaptasi, atau transisi dari nyaman ke waspada
- Boleh atmosferik, tetapi jangan cozy secara generik; visual harus terasa berarti, bukan hanya indah`
    default:
      return `Untuk workspace Arkara:
- Gunakan signature style Arkara secara konsisten, tetapi tone visual tetap harus mengikuti isi artikel
- Jaga keseimbangan antara kejelasan informasi dan kekuatan storytelling visual`
  }
}

function getArkaraImageToneDirection(profile: AIContentProfile): string {
  if (profile === 'post') {
    return `Tone visual blog post Arkara harus diturunkan dari artikel, bukan dipilih sembarangan:
- Jika topiknya tentang krisis, gangguan sistem, lonjakan harga, blackout, distribusi, atau ketergantungan: bangun mood tegang yang tenang, terkendali, dan dekat dengan kehidupan nyata, bukan chaos sinematik
- Jika topiknya rumah tangga urban: tampilkan rasa ruang terbatas, alat terbatas, waktu terbatas, dan keputusan yang harus diambil sekarang
- Jika topiknya solutif: tetap beri rasa urgensi dan taruhan nyata; jangan berubah menjadi poster motivasi
- Bangun emosi sadar, waspada, dan ingin punya kontrol; jangan bangun rasa panik, heroisme kosong, atau feel-good generic
- Ekspresi wajah, gesture, pencahayaan, objek, dan framing harus menandakan tekanan yang nyata tetapi terukur
- Visual boleh memainkan emosi, tetapi harus emosional karena skenario dan konsekuensi, bukan karena dramatisasi visual murahan`
  }

  return `Tone visual harus diturunkan dari artikel, bukan dipilih sembarangan:
- Jika artikelnya serius, kritis, atau membahas krisis: gunakan mood serius, tenang, terkendali, grounded, tanpa dramatisasi berlebihan
- Jika artikelnya teknis dan instruksional: gunakan mood fokus, teliti, kompeten, jelas, dan praktis
- Jika artikelnya ringan, rumah tangga, atau lebih casual: gunakan mood hangat, natural, approachable, lived-in, dan sehari-hari
- Jika artikelnya optimistis atau solutif: boleh terasa empowering, tetapi tetap realistis dan tidak bombastis
- Ekspresi wajah, lighting, color emphasis, gesture, dan framing harus selaras dengan tone artikel`
}

function getGeminiSafeImageDirection(): string {
  return `Guardrail agar prompt lebih aman lolos seleksi Gemini:
- Hindari gore, luka terbuka, mayat, tubuh rusak, darah, atau detail cedera eksplisit
- Hindari kekerasan eksplisit, ancaman langsung, eksekusi, penyiksaan, atau adegan konflik yang konfrontatif
- Hindari sexualized content, nudity, fetish framing, atau eksploitasi tubuh
- Hindari kebencian, simbol ekstrem, propaganda, atau dehumanisasi kelompok tertentu
- Hindari tokoh publik nyata, selebritas, dan wajah yang diminta menyerupai orang sungguhan yang dikenali publik
- Hindari logo brand yang jelas, tulisan signage yang mudah dibaca, watermark, atau teks besar di dalam gambar
- Hindari adegan bencana yang terlalu chaos, kerumunan panik, atau situasi yang terasa seperti berita tragedi eksplisit kecuali benar-benar penting, dan tetap tampilkan secara non-graphic
- Jika topik menyentuh risiko, senjata, kebakaran, medis, atau keamanan, tampilkan secara aman, non-graphic, dan tidak mengagungkan bahaya`
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
      ? `- Meta title dan description harus terasa teknis, jelas, trustworthy, dan berbasis skenario nyata
- Excerpt harus terasa seperti ringkasan panduan praktis dengan stakes yang jelas
- Hindari headline generik seperti tutorial umum atau panduan pemula yang hambar`
      : `- Meta title dan description harus spesifik, kompetitif, dan punya tekanan situasional tanpa clickbait kosong
- Excerpt harus menciptakan urgensi tenang: pembaca merasa topik ini penting sekarang
- Hindari judul SEO yang terlalu sopan, terlalu umum, atau terasa bisa dipakai blog mana saja
- Jika cocok, biarkan judul atau excerpt memuat konsekuensi, batasan, atau perubahan sistem yang langsung terasa`

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
${seoDirection}
- Jangan gunakan formula generik "Tips/Trik/Cara Mudah" kecuali benar-benar tak terhindarkan
- Jika memungkinkan, masukkan elemen skenario, durasi, risiko, atau konsekuensi yang membuat artikel terasa penting
- Fokus keyword harus realistis, tetapi hasil akhir tetap harus punya ciri khas Arkara: tajam, spesifik, dan tidak hambar`,
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
      ? `- Prioritaskan urutan langkah, checklist, peringatan, keputusan praktis, dan batasan nyata
- Heading harus terasa seperti panduan kerja yang operasional, bukan artikel penjelasan umum
- Jika relevan, pastikan ada section tentang simulasi, kapasitas, validasi konservatif, dan failure mode`
      : `- Outline WAJIB mengikuti ritme Arkara: hook gangguan, reality check, reframe, keputusan taktis, simulasi, failure mode, system integration, closing
- Heading harus spesifik, keras, dan terasa penting, bukan nyaman atau generik
- Jika topiknya tidak memungkinkan semua section literal, pertahankan logika Arkara semaksimal mungkin
- Pastikan ada satu section atau note yang memaksa scene konkret rumah tangga/ruang/aktivitas agar artikel tidak melayang terlalu abstrak
- Closing note harus mengarah ke konsekuensi pilihan, bukan motivasi umum`

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
- Hindari heading seperti "Apa Itu...", "Pengertian...", atau "Manfaat..." kecuali benar-benar penting
- Untuk Arkara, outline harus mendorong artikel ke simulasi, keputusan, dan risiko nyata
- Jika artikel menyentuh kapasitas, produksi, panen, stok, atau durasi, minta note section yang memaksa angka atau estimasi konservatif
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
      ? `- Susun tulisan seperti panduan teknis Arkara: operasional, realistis, dan mudah diikuti dalam keterbatasan rumah tangga urban Indonesia
- Gunakan kalimat yang lugas, langsung ke tindakan, dan tidak berputar-putar
- Jika relevan, gunakan urutan langkah, checklist, parameter, kapasitas, durasi, atau peringatan keras
- Hindari pembukaan panjang, teori umum, atau promosi yang tidak membantu keputusan pembaca
- Jika memakai simulasi, gunakan framing yang jujur: estimasi konservatif, skenario kecil, atau asumsi operasional yang jelas`
      : `- Susun tulisan seperti artikel editorial Arkara: tenang, tajam, realistis, dan terasa lebih serius daripada blog umum
- Gunakan hook yang mendorong pembaca masuk ke skenario, lalu bangun argumen dengan ritme yang kuat
- Boleh persuasif, tetapi harus terasa seperti koreksi mental model, bukan copywriting manis
- Artikel harus meninggalkan satu kesimpulan taktis yang jelas dan terasa penting
- Gunakan sedikit scene rumah tangga atau momen konkret agar pembaca bisa membayangkan hidup di dalam skenario, bukan hanya memahaminya secara abstrak
- Closing harus membangun konsekuensi yang lengket: jika pembaca tidak bertindak, ia tetap memilih ketergantungan`

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
- Bahasa Indonesia yang rapi, tegas, dan mudah dipahami
- Minimal 1200 kata
- Sertakan tips praktis dan langkah-langkah yang actionable
- Sisipkan internal link ke artikel terkait secara natural jika data tersedia
- JANGAN sertakan heading H1 (judul akan diset terpisah)
- Hindari definisi umum, sejarah panjang, atau penjelasan textbook kecuali benar-benar membantu keputusan pembaca
- WAJIB ada elemen simulasi, estimasi, kapasitas, durasi, frekuensi, ruang, biaya, atau angka nyata jika topik memungkinkan
- Jika sebuah klaim menyangkut kapasitas, kebutuhan, output, atau durasi, usahakan beri unit atau parameter yang konkret
- Jika simulasi belum tervalidasi penuh, tandai sebagai estimasi konservatif, simulasi rumah tangga, atau skenario kecil; jangan mengemasnya sebagai kepastian absolut
- WAJIB ada minimal satu scene kecil yang membuat pembaca bisa membayangkan rumah, dapur, balkon, stok, panen, makan, atau keputusan keluarga secara nyata jika topik memungkinkan
- WAJIB ada bagian atau paragraf yang membahas failure mode: apa yang paling mungkin membuat pendekatan ini gagal
- WAJIB hubungkan topik ini dengan sistem Arkara lain jika relevan
- Jangan terdengar seperti lifestyle blog, artikel SEO generik, atau konten motivasi prepper
- Gunakan beberapa kalimat pendek untuk tekanan dan penekanan, terutama pada hook, reality check, dan closing
- Hindari penutup seperti ajakan generik, motivasi ringan, atau "mulai dari yang kecil" tanpa konsekuensi nyata
- Penutup harus menegaskan pilihan, konsekuensi, atau bentuk ketergantungan yang tetap dipelihara jika pembaca tidak bertindak
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
  const toneDirection = getArkaraImageToneDirection(profile)
  const geminiSafeDirection = getGeminiSafeImageDirection()
  const isPanduan = profile === 'panduan'
  const promptCountInstruction = isPanduan
    ? 'Buatkan tepat 4 prompt text-to-image untuk Nano Banana berdasarkan panduan final yang sudah disetujui berikut.'
    : 'Buatkan 3 sampai 4 prompt text-to-image untuk Nano Banana berdasarkan artikel final yang sudah disetujui berikut.'
  const heroPromptExample = isPanduan
    ? `  "hero_prompts": [
    {
      "label": "Thumbnail Prompt",
      "prompt": "prompt text-to-image lengkap, spesifik, siap copy untuk Nano Banana"
    },
    {
      "label": "Tools and Materials Prompt",
      "prompt": "prompt text-to-image lengkap, spesifik, siap copy untuk Nano Banana"
    },
    {
      "label": "Technical Setup Prompt",
      "prompt": "prompt text-to-image lengkap, spesifik, siap copy untuk Nano Banana"
    },
    {
      "label": "Process Detail Prompt",
      "prompt": "prompt text-to-image lengkap, spesifik, siap copy untuk Nano Banana"
    }
  ]`
    : `  "hero_prompts": [
    {
      "label": "Scenario Cover Prompt",
      "prompt": "prompt text-to-image lengkap, spesifik, siap copy untuk Nano Banana"
    },
    {
      "label": "Dependency Pressure Prompt",
      "prompt": "prompt text-to-image lengkap, spesifik, siap copy untuk Nano Banana"
    },
    {
      "label": "Tactical Action Prompt",
      "prompt": "prompt text-to-image lengkap, spesifik, siap copy untuk Nano Banana"
    },
    {
      "label": "Buffer and Space Prompt",
      "prompt": "prompt text-to-image lengkap, spesifik, siap copy untuk Nano Banana"
    }
  ]`
  const imagePromptStructure = isPanduan
    ? `Struktur prompt WAJIB untuk panduan:
- Prompt 1 harus menjadi thumbnail/cover illustration yang paling kuat, paling mudah dibaca sekilas, dan tetap mempertahankan style ilustrasi Arkara yang lama: editorial, painterly, cinematic, graphic-novel influence, cocok untuk cover panduan
- Prompt 2 harus menampilkan satu gambar yang merangkum peralatan, alat, bahan, atau komponen yang dibutuhkan sesuai kondisi dan topik artikel; utamakan susunan alat yang jelas, realistis, dan mudah dipahami
- Prompt 3 harus fokus pada technical setup, skema kerja, hubungan antarobjek, atau konfigurasi alat bila relevan; visual harus terasa informatif, rapi, dan jelas, tetapi tidak sekaku diagram engineering formal
- Prompt 4 harus fokus pada process detail, langkah kerja penting, potongan adegan instruksional, atau close-up tindakan tangan dan alat yang membantu pembaca memahami eksekusi di lapangan/rumah
- Prompt 2 sampai 4 harus terasa lebih teknis daripada prompt 1
- Jika topik tidak memerlukan skema literal, tetap buat komposisi yang menjelaskan sistem, urutan, atau hubungan alat secara visual
- Jangan menambahkan teks label, caption, angka langkah, atau callout tertulis di dalam gambar`
    : `Struktur prompt:
- Prompt 1 harus menjadi scenario cover yang paling kuat: sekali lihat langsung terasa ada gangguan, taruhan, atau tekanan nyata
- Prompt 2 harus menonjolkan sistem, distribusi, ketergantungan, kelangkaan, atau titik lemah yang dibahas artikel
- Prompt 3 harus fokus pada tindakan taktis, keputusan, atau adaptasi manusia di lapangan/rumah
- Prompt 4 harus menampilkan buffer, keterbatasan ruang, stok, alat, atau setup realistis yang membantu pembaca memvisualisasikan skenario
- Variasikan angle visual agar setiap prompt terasa benar-benar berbeda
- Hindari mengulang adegan yang sama dalam versi lain yang hanya beda phrasing kecil`

  return [
    { role: 'system', content: buildSystemPrompt(profile) },
    {
      role: 'user',
      content: `${promptCountInstruction}

Judul: "${input.title}"${excerptContext}${keywordContext}${categoryContext}

Isi artikel:
"${input.content.substring(0, 4000)}"

Signature visual Arkara yang WAJIB menjadi dasar setiap prompt:
${arkaraStyleAnchor}

${imageDirection}

${toneDirection}

${geminiSafeDirection}

Balas dalam JSON format ini:
{
  "art_direction": "ringkasan arah visual umum dalam 1-2 kalimat",
${heroPromptExample}
}

${imagePromptStructure}

Aturan prompt:
- Setiap prompt harus panjang, kaya detail, dan siap langsung dipakai
- Gunakan bahasa Inggris untuk isi prompt agar kualitas text-to-image lebih stabil
- Setiap prompt harus secara eksplisit mengikuti signature style Arkara di atas, tetapi mood dan adegan harus menyesuaikan isi artikel
- Tulis prompt sebagai satu kalimat/deskripsi panjang yang natural untuk model image generation
- Sebaiknya buka prompt dengan style anchor Arkara, lalu lanjutkan dengan detail adegan, subjek, lighting, mood, komposisi, dan konteks Indonesia
- Jangan menulis placeholder seperti [subject] atau [style]
- Hindari teks yang harus muncul di gambar
- Jangan gunakan istilah yang terlalu abstrak; selalu visual dan konkret
- Pastikan tiap prompt menawarkan angle visual yang berbeda satu sama lain
- ${isPanduan ? 'Untuk panduan, hasil akhir WAJIB berisi tepat 4 prompt dengan fungsi yang berbeda sesuai struktur di atas' : 'Utamakan 4 prompt. Hanya boleh 3 prompt jika memang artikel terlalu sempit untuk dibuat variasi yang benar-benar berbeda'}
- Jangan ulang adegan yang sama hanya dengan sinonim kecil
- Pastikan detail gambar tetap setia pada isi artikel; jangan menambahkan klaim, alat, atau situasi yang tidak didukung artikel
- Jika artikel menyebut daftar alat atau langkah spesifik, gunakan hanya alat dan tindakan itu sebagai dasar visual utama
- Jika artikel bernada serius, jangan ubah menjadi terlalu cozy, playful, atau inspirational
- Jika artikel bernada casual atau rumah tangga, jangan buat jadi terlalu gelap, apokaliptik, atau militaristik
- Untuk blog post Arkara, bangun rasa urgency, pressure, dan emotional tension secara tenang; pembaca harus merasakan bahwa situasinya penting, bukan sekadar cantik
- Untuk blog post Arkara, utamakan visual yang menunjukkan sistem rapuh, distribusi terganggu, kontrol yang tipis, buffer terbatas, atau keputusan rumah tangga yang harus segera diambil bila relevan
- Gunakan objek, gesture, ekspresi, dan komposisi yang membuat pembaca membayangkan konsekuensi nyata dalam hidup sehari-hari
- Prioritaskan wajah, pakaian, arsitektur, peralatan dapur, rumah, jalan, atau lingkungan yang terasa Indonesia modern bila relevan
- Hindari photorealism generik, glossy 3D render, flat vector style, anime look, dan sci-fi aesthetics
- Hindari logo merek, signage yang terbaca jelas, teks besar di dalam gambar, atau detail yang berpotensi memicu penolakan moderation
- Gunakan kata-kata yang aman dan deskriptif; jangan gunakan phrasing yang terdengar eksplisit, sensasional, atau shock-value
- Hasil akhir harus terasa premium, relevan, emosional, dan kuat untuk visual cover tanpa kehilangan realism Arkara`,
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

export function buildResearchWithWebPrompt(
  input: ResearchWithWebInput,
  profile: AIContentProfile = 'workspace',
  extraction?: ClaimExtractionResult
): AIMessage[] {
  const contentContext = input.content
    ? `\n\nRingkasan draft atau bahan awal:\n"${input.content.substring(0, 3000)}"`
    : ''
  const questionContext = input.question
    ? `\nPertanyaan utama dari editor: ${input.question}`
    : ''
  const audienceContext = input.audience
    ? `\nAudiens target: ${input.audience}`
    : ''
  const notesContext = input.notes
    ? `\nCatatan editor: ${input.notes}`
    : ''

  const profileDirection =
    profile === 'panduan'
      ? `- Prioritaskan query tentang prosedur, standar, risiko, alat, regulasi, dan langkah teknis
- Hindari agenda riset yang terlalu editorial jika tidak membantu akurasi panduan`
      : `- Prioritaskan query tentang statistik, perkembangan terbaru, konteks publik, tren, regulasi, dan data pendukung
- Sisakan ruang untuk angle editorial selama tetap berfungsi sebagai riset faktual`

  const extractionContext = extraction
    ? `\n\nKlaim prioritas hasil ekstraksi awal:
${extraction.prioritizedClaims.length > 0
  ? extraction.prioritizedClaims
      .map(
        (claim, index) =>
          `${index + 1}. [${claim.category}] ${claim.claim} (sinyal: ${claim.signals.join(', ')})`
      )
      .join('\n')
  : '- Tidak ada klaim prioritas yang sangat kuat; fokuskan riset pada bagian artikel yang paling rawan basi.'}

Ringkasan ekstraksi:
- Total kalimat dianalisis: ${extraction.summary.totalSentences}
- Klaim prioritas: ${extraction.summary.prioritizedCount}
- Time-sensitive: ${extraction.summary.timeSensitiveCount}
- High-risk: ${extraction.summary.highRiskCount}`
    : ''

  return [
    {
      role: 'system',
      content: `${buildSystemPrompt(profile)}

Anda sedang menyiapkan brief riset web, BUKAN mengarang hasil browsing.
Jangan berpura-pura telah membuka situs web atau mengetahui fakta terbaru jika belum diberikan sumber.
Tugas Anda adalah mengidentifikasi apa saja yang perlu dicari, pertanyaan apa yang perlu dijawab, dan query apa yang paling efektif untuk pencarian web lanjutan.`,
    },
    {
      role: 'user',
      content: `Siapkan brief "research with web" untuk artikel atau topik berikut.

Judul: "${input.title}"${questionContext}${audienceContext}${notesContext}${contentContext}${extractionContext}

Balas dalam JSON format ini:
{
  "research_goal": "tujuan riset ringkas dan jelas",
  "recommended_queries": [
    "query 1",
    "query 2",
    "query 3"
  ],
  "research_agenda": [
    {
      "question": "pertanyaan yang perlu dijawab lewat web",
      "reason": "kenapa ini penting untuk akurasi atau aktualitas artikel",
      "suggested_query": "query pencarian yang disarankan",
      "priority": "high"
    }
  ],
  "watchouts": ["hal yang rawan basi, salah, atau perlu sumber primer"]
}

Aturan:
- Fokus pada hal yang benar-benar perlu dibrowse agar artikel lebih akurat dan aktual
- Prioritaskan klaim sensitif waktu: regulasi, statistik, harga, produk, standar, kebijakan, risiko keselamatan, kesehatan, dan berita terbaru
- Jangan mengklaim hasil pencarian atau menyebut sumber tertentu jika belum diberikan
- Gunakan query pencarian yang realistis dan siap dipakai editor atau agent verifier
- Minimal 3 recommended queries dan 3 research agenda items
${profileDirection}`,
    },
  ]
}

export function buildVerifyLatestFactsPrompt(
  input: VerifyLatestFactsInput,
  profile: AIContentProfile = 'workspace',
  extraction?: ClaimExtractionResult,
  contentOverride?: string
): AIMessage[] {
  const excerptContext = input.excerpt
    ? `\nExcerpt:\n"${input.excerpt}"`
    : ''
  const focusAreaContext = input.focus_area
    ? `\nFokus pengecekan editor: ${input.focus_area}`
    : ''
  const contentForReview = contentOverride ?? input.content.substring(0, 7000)

  const profileDirection =
    profile === 'panduan'
      ? `- Utamakan klaim tentang prosedur, keamanan, alat, spesifikasi, standar, regulasi, dan langkah teknis
- Jika ada langkah yang berpotensi berisiko, tandai dengan lebih ketat`
      : `- Utamakan klaim tentang statistik, tren, kebijakan, produk, tanggal, harga, angka, dan konteks publik terbaru
- Bedakan klaim opini/editorial dari klaim faktual yang harus diverifikasi`

  const prioritizedClaimsContext = extraction
    ? `\n\nKlaim prioritas hasil ekstraksi awal:
${extraction.prioritizedClaims.length > 0
  ? extraction.prioritizedClaims
      .map(
        (claim, index) =>
          `${index + 1}. [${claim.category}] ${claim.claim} (sinyal: ${claim.signals.join(', ')})`
      )
      .join('\n')
  : '- Tidak ada klaim prioritas yang dominan. Cari klaim faktual paling signifikan dari draft.'}

Klaim evergreen pendukung:
${extraction.evergreenClaims.length > 0
  ? extraction.evergreenClaims
      .map((claim, index) => `${index + 1}. ${claim.claim}`)
      .join('\n')
  : '- Tidak ada klaim evergreen pendukung yang perlu ditonjolkan.'}

Ringkasan ekstraksi:
- Total kalimat dianalisis: ${extraction.summary.totalSentences}
- Klaim prioritas: ${extraction.summary.prioritizedCount}
- Time-sensitive: ${extraction.summary.timeSensitiveCount}
- High-risk: ${extraction.summary.highRiskCount}`
    : ''

  return [
    {
      role: 'system',
      content: `${buildSystemPrompt(profile)}

Anda sedang melakukan preflight fact-check review tanpa browsing web langsung.
Jangan pernah berpura-pura telah memverifikasi ke internet.
Jika sebuah klaim membutuhkan data terbaru atau sumber eksternal, tandai sebagai "needs_web_verification".
Jika sebuah klaim tampak terlalu absolut, meragukan, atau tidak didukung naskah, Anda boleh menandainya sebagai "needs_update", "unsupported", atau "uncertain".`,
    },
    {
      role: 'user',
      content: `Tinjau draft berikut dan buat laporan verifikasi fakta awal.

Judul: "${input.title}"${focusAreaContext}${excerptContext}${prioritizedClaimsContext}

Isi draft:
"${contentForReview}"

Balas dalam JSON format ini:
{
  "summary": "ringkasan singkat kondisi faktual draft",
  "checked_at": "",
  "claims": [
    {
      "claim": "klaim faktual yang perlu perhatian",
      "status": "needs_web_verification",
      "reason": "alasan status ini dipilih",
      "suggested_revision": "opsional, revisi yang lebih aman atau lebih jujur",
      "sources": []
    }
  ]
}

Aturan:
- Fokus terutama pada klaim prioritas hasil ekstraksi di atas, lalu tambahkan klaim lain hanya jika benar-benar penting
- Abaikan opini, gaya bahasa, dan pernyataan yang jelas subjektif
- Maksimal 8 klaim paling penting
- Jika klaim sensitif terhadap waktu atau bergantung data eksternal terbaru, gunakan "needs_web_verification"
- Gunakan "needs_update" jika phrasing tampak terlalu pasti, berisiko basi, atau perlu pelembutan
- Gunakan "unsupported" jika klaim tampak dibuat-buat, terlalu spesifik tanpa dasar, atau tidak didukung konteks draft
- Gunakan "uncertain" jika ada sinyal masalah tetapi belum cukup jelas
- Jangan mengarang URL sumber; biarkan "sources" kosong jika belum ada
- Biarkan "checked_at" sebagai string kosong
${profileDirection}`,
    },
  ]
}
