// src/types/content.ts (CMS) — sumber kebenaran tipe konten
export interface MediaObject {
  url: string
  alt_text?: string
  formats?: {
    sm?: string   // 400px
    md?: string   // 800px
    lg?: string   // 1200px
    original?: string
  }
  aspect_ratio?: string
  dominant_color?: string
  blurhash?: string
}

export type EditorialFormat = 'legacy' | 'mobile_reader' | 'technical_guide'

export interface ContentFAQItem {
  question: string
  answer: string
}

export interface Post {
  id: string
  title: string
  slug: string
  description?: string
  content: string
  quick_answer?: string | null
  key_takeaways?: string[]
  faq?: ContentFAQItem[]
  editorial_format?: EditorialFormat
  category: 'air' | 'energi' | 'pangan' | 'medis' | 'keamanan' | 'komunitas'
  status: 'draft' | 'published'
  cover_image?: string           // string URL — untuk fallback dan OG image
  thumbnail_image?: MediaObject | null
  banner_image?: MediaObject | null
  published_at?: string
  meta_title?: string
  meta_desc?: string
  created_at?: string
  updated_at?: string
}

export interface Panduan {
  id: string
  title: string
  slug: string
  content: string
  quick_answer?: string | null
  key_takeaways?: string[]
  faq?: ContentFAQItem[]
  editorial_format?: EditorialFormat
  bab_ref?: string
  qr_slug?: string
  status: 'draft' | 'published'
  cover_image?: string
  meta_title?: string
  meta_desc?: string
}
