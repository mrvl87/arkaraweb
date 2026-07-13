import type { SocialVisualSpec } from '../../../../types/social'

export const normalVisualSpec: SocialVisualSpec = {
  template_id: 'editorial-checklist-v1',
  aspect_ratio: '1:1',
  scene_prompt: 'Editorial illustration of an Indonesian apartment kitchen during a calm evening outage, practical household supplies on a table, clear negative space for overlay.',
  label: 'RUMAH SIAGA',
  headline: 'Rumah Anda Tahan Berapa Jam Tanpa Listrik?',
  subheadline: 'Mulai dari cahaya, air minum, komunikasi, dan makanan siap saji yang realistis.',
  information_blocks: [
    { title: 'Cahaya', text: 'Siapkan lampu darurat di titik yang mudah dijangkau.' },
    { title: 'Air', text: 'Pisahkan air minum dari air bersih untuk kebutuhan lain.' },
    { title: 'Komunikasi', text: 'Jaga baterai ponsel dan power bank tetap siap.' },
  ],
  emphasis_text: 'Audit kecil malam ini lebih berguna daripada panik nanti.',
  footer: 'ArkaraWeb.com | Survive with Knowledge',
  alt_text: 'Ilustrasi dapur apartemen Indonesia dengan perlengkapan siaga saat listrik padam.',
}

export const longHeadlineVisualSpec: SocialVisualSpec = {
  ...normalVisualSpec,
  headline: 'Ini adalah headline yang sengaja dibuat terlalu panjang untuk melewati batas keras template renderer Arkara dan harus ditolak',
}

export const tooManyBlocksVisualSpec: SocialVisualSpec = {
  ...normalVisualSpec,
  information_blocks: [
    { title: 'Satu', text: 'Poin satu.' },
    { title: 'Dua', text: 'Poin dua.' },
    { title: 'Tiga', text: 'Poin tiga.' },
    { title: 'Empat', text: 'Poin empat.' },
    { title: 'Lima', text: 'Poin lima.' },
    { title: 'Enam', text: 'Poin enam.' },
    { title: 'Tujuh', text: 'Poin tujuh.' },
  ],
}