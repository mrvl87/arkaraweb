import type { SocialAspectRatio } from '../../../types/social'
import type { SocialRenderDimensions } from './types'

export const SOCIAL_RENDER_DIMENSIONS: Record<SocialAspectRatio, SocialRenderDimensions> = {
  '1:1': { width: 1080, height: 1080 },
  '4:5': { width: 1080, height: 1350 },
  '9:16': { width: 1080, height: 1920 },
}

export function getSocialRenderDimensions(aspectRatio: SocialAspectRatio): SocialRenderDimensions {
  return SOCIAL_RENDER_DIMENSIONS[aspectRatio]
}