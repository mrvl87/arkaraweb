import type { SocialPostType } from '@/types/social'

export const SOCIAL_STRATEGY_PRESET_IDS = [
  'balanced_week',
  'traffic_sprint',
  'engagement_week',
  'evergreen_education',
  'breaking_issue_response',
  'campaign_launch',
  'article_amplification',
  'community_discussion',
  'classic_weekly',
] as const

export type SocialStrategyPresetId = (typeof SOCIAL_STRATEGY_PRESET_IDS)[number]

export interface SocialStrategyPreset {
  id: SocialStrategyPresetId
  label: string
  primaryGoal: string
  recommendedPostTypeMix: SocialPostType[]
  recommendedCount: number
  suggestedCtaStyle: string
  suggestedContentDepth: string
  suggestedVisualStyle: string
  expectedAudienceAction: string
}

export const CONTENT_DERIVATIVE_POST_TYPES: SocialPostType[] = [
  'editorial_poster',
  'checklist',
  'carousel',
  'myth_vs_fact',
  'scenario',
  'question',
  'poll',
  'opinion',
  'article_link',
  'short_video',
  'recap',
  'quote_statement',
]

export const SOCIAL_STRATEGY_PRESETS: Record<SocialStrategyPresetId, SocialStrategyPreset> = {
  balanced_week: {
    id: 'balanced_week',
    label: 'Balanced Week',
    primaryGoal: 'Menjaga ritme awareness, trust, engagement, dan traffic secara seimbang.',
    recommendedPostTypeMix: ['editorial_poster', 'checklist', 'carousel', 'opinion', 'article_link', 'question', 'recap'],
    recommendedCount: 7,
    suggestedCtaStyle: 'Soft CTA bergantian: simpan, komentar, baca lanjut, dan audit kecil.',
    suggestedContentDepth: 'Campuran ringkas, praktis, dan satu konten lebih dalam.',
    suggestedVisualStyle: 'Editorial calm dengan variasi poster, checklist, dan carousel.',
    expectedAudienceAction: 'Menyimpan konten, membaca artikel sumber, dan mulai audit sederhana.',
  },
  traffic_sprint: {
    id: 'traffic_sprint',
    label: 'Traffic Sprint',
    primaryGoal: 'Mendorong klik berkualitas ke artikel atau panduan prioritas.',
    recommendedPostTypeMix: ['article_link', 'editorial_poster', 'quote_statement', 'carousel', 'scenario'],
    recommendedCount: 5,
    suggestedCtaStyle: 'CTA eksplisit menuju artikel lengkap dengan alasan jelas untuk klik.',
    suggestedContentDepth: 'Hook tajam, konteks singkat, lalu arahkan ke halaman sumber.',
    suggestedVisualStyle: 'Poster editorial kuat dengan negative space dan quote statement.',
    expectedAudienceAction: 'Klik ke artikel, baca lebih dalam, dan membagikan sumber.',
  },
  engagement_week: {
    id: 'engagement_week',
    label: 'Engagement Week',
    primaryGoal: 'Mengumpulkan komentar, pengalaman pembaca, dan sinyal komunitas.',
    recommendedPostTypeMix: ['question', 'poll', 'scenario', 'myth_vs_fact', 'opinion', 'recap'],
    recommendedCount: 6,
    suggestedCtaStyle: 'CTA berbasis pertanyaan spesifik dan jawaban ringan.',
    suggestedContentDepth: 'Ringkas, mudah dijawab, dekat dengan situasi rumah tangga.',
    suggestedVisualStyle: 'Visual situasional yang mengundang pembaca membayangkan rumah sendiri.',
    expectedAudienceAction: 'Komentar, vote, menjawab pertanyaan, dan berbagi pengalaman.',
  },
  evergreen_education: {
    id: 'evergreen_education',
    label: 'Evergreen Education',
    primaryGoal: 'Membangun pengetahuan dasar yang bisa dipakai ulang sepanjang waktu.',
    recommendedPostTypeMix: ['checklist', 'carousel', 'myth_vs_fact', 'editorial_poster', 'article_link'],
    recommendedCount: 6,
    suggestedCtaStyle: 'CTA simpan, baca ulang, dan gunakan sebagai audit rumah.',
    suggestedContentDepth: 'Praktis, bertahap, tidak bergantung pada isu harian.',
    suggestedVisualStyle: 'Checklist dan carousel yang terang, rapi, dan informatif.',
    expectedAudienceAction: 'Save, share, dan memakai konten sebagai referensi.',
  },
  breaking_issue_response: {
    id: 'breaking_issue_response',
    label: 'Breaking Issue Response',
    primaryGoal: 'Merespons isu aktual secara tenang tanpa autopost atau klaim spekulatif.',
    recommendedPostTypeMix: ['editorial_poster', 'opinion', 'scenario', 'question', 'article_link'],
    recommendedCount: 4,
    suggestedCtaStyle: 'CTA kehati-hatian: cek sumber, pahami dampak rumah tangga, baca konteks.',
    suggestedContentDepth: 'Cepat, kontekstual, membedakan fakta dan interpretasi editorial.',
    suggestedVisualStyle: 'Editorial serius dengan scene rumah tangga terdampak secara realistis.',
    expectedAudienceAction: 'Memahami konteks, tidak panik, dan membaca penjelasan lanjutan.',
  },
  campaign_launch: {
    id: 'campaign_launch',
    label: 'Campaign Launch',
    primaryGoal: 'Membuka campaign baru dengan narasi besar, alasan, dan rangkaian tindakan.',
    recommendedPostTypeMix: ['editorial_poster', 'carousel', 'checklist', 'article_link', 'question'],
    recommendedCount: 5,
    suggestedCtaStyle: 'CTA onboarding: ikuti seri, simpan daftar, dan baca fondasi campaign.',
    suggestedContentDepth: 'Narasi pembuka kuat lalu turun ke tindakan praktis.',
    suggestedVisualStyle: 'Poster pembuka premium, carousel explainer, dan checklist awal.',
    expectedAudienceAction: 'Mengikuti seri, memahami janji campaign, dan mulai tindakan pertama.',
  },
  article_amplification: {
    id: 'article_amplification',
    label: 'Article Amplification',
    primaryGoal: 'Mengurai satu atau beberapa artikel menjadi turunan sosial yang berbeda.',
    recommendedPostTypeMix: ['article_link', 'quote_statement', 'carousel', 'checklist', 'myth_vs_fact', 'short_video'],
    recommendedCount: 6,
    suggestedCtaStyle: 'CTA berbasis manfaat spesifik tiap turunan menuju artikel sumber.',
    suggestedContentDepth: 'Setiap item mengambil angle berbeda, bukan rewrite judul artikel.',
    suggestedVisualStyle: 'Seri visual konsisten yang tetap memberi variasi format.',
    expectedAudienceAction: 'Klik artikel, save poin penting, dan share ringkasan praktis.',
  },
  community_discussion: {
    id: 'community_discussion',
    label: 'Community Discussion',
    primaryGoal: 'Membuka diskusi komunitas dan memetakan problem nyata audiens.',
    recommendedPostTypeMix: ['question', 'poll', 'scenario', 'opinion', 'recap'],
    recommendedCount: 5,
    suggestedCtaStyle: 'CTA percakapan: jawab singkat, pilih opsi, atau ceritakan kondisi rumah.',
    suggestedContentDepth: 'Rendah sampai medium; fokus pada respons pembaca.',
    suggestedVisualStyle: 'Visual sederhana, relatable, dan tidak terlalu padat teks.',
    expectedAudienceAction: 'Komentar, memberi insight, dan memunculkan topik lanjutan.',
  },
  classic_weekly: {
    id: 'classic_weekly',
    label: 'Classic Weekly Plan',
    primaryGoal: 'Menghasilkan rencana tujuh hari lama dengan urutan Senin sampai Minggu.',
    recommendedPostTypeMix: ['narrative', 'checklist', 'carousel', 'opinion', 'article_link', 'question', 'recap'],
    recommendedCount: 7,
    suggestedCtaStyle: 'CTA klasik mingguan sesuai fungsi hari.',
    suggestedContentDepth: 'Satu post per hari dengan struktur tetap.',
    suggestedVisualStyle: 'Campuran classic post, checklist, carousel, link, dan recap.',
    expectedAudienceAction: 'Mengikuti ritme mingguan campaign.',
  },
}

export function getSocialStrategyPreset(id: SocialStrategyPresetId): SocialStrategyPreset {
  return SOCIAL_STRATEGY_PRESETS[id]
}

export function isSocialStrategyPresetId(value: string): value is SocialStrategyPresetId {
  return SOCIAL_STRATEGY_PRESET_IDS.includes(value as SocialStrategyPresetId)
}