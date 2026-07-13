import type { SocialAspectRatio, SocialVisualSpec } from '../../../types/social'

export type SocialRenderTemplateId =
  | 'editorial-opinion-v1'
  | 'editorial-checklist-v1'
  | 'editorial-carousel-v1'

export interface SocialRenderDimensions {
  width: number
  height: number
}

export interface SocialRenderSafeZones {
  outer: number
  top: number
  right: number
  bottom: number
  left: number
  footerHeight: number
  text: {
    x: number
    y: number
    width: number
    height: number
  }
}

export interface SocialRenderTextHierarchy {
  label: number
  headline: number
  subheadline: number
  blockTitle: number
  blockText: number
  emphasis: number
  footer: number
}

export interface SocialRenderTemplateContext {
  spec: SocialVisualSpec
  dimensions: SocialRenderDimensions
  warnings: string[]
  backgroundDataUri?: string
}

export interface SocialRenderTemplate {
  id: SocialRenderTemplateId
  supportedAspectRatios: SocialAspectRatio[]
  maxHeadlineLength: number
  maxInformationBlockCount: number
  safeZones: Record<SocialAspectRatio, SocialRenderSafeZones>
  textAlignment: 'left' | 'center'
  textHierarchy: SocialRenderTextHierarchy
  footerPosition: 'bottom-left' | 'bottom-center'
  backgroundOverlay: string
  fallbackBackground: string
  renderSvg: (context: SocialRenderTemplateContext) => string
}

export interface SocialRenderInput {
  spec: SocialVisualSpec | null
  templateId?: string | null
  aspectRatio?: SocialAspectRatio | null
  backgroundImage?: Buffer | Uint8Array | null
  backgroundImageUrl?: string | null
  backgroundMimeType?: string | null
}

export interface SocialRenderResult {
  png: Buffer
  width: number
  height: number
  warnings: string[]
  templateId: SocialRenderTemplateId
}

export class SocialRenderValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SocialRenderValidationError'
  }
}