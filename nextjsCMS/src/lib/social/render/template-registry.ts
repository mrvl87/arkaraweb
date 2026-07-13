import type { SocialPostType } from '../../../types/social'
import type { SocialRenderTemplate, SocialRenderTemplateId } from './types'
import { editorialCarouselTemplate } from './templates/editorial-carousel-v1'
import { editorialChecklistTemplate } from './templates/editorial-checklist-v1'
import { editorialOpinionTemplate } from './templates/editorial-opinion-v1'

export const SOCIAL_RENDER_TEMPLATES: Record<SocialRenderTemplateId, SocialRenderTemplate> = {
  'editorial-opinion-v1': editorialOpinionTemplate,
  'editorial-checklist-v1': editorialChecklistTemplate,
  'editorial-carousel-v1': editorialCarouselTemplate,
}

const LEGACY_TEMPLATE_MAP: Record<string, SocialRenderTemplateId> = {
  ar_block_left: 'editorial-opinion-v1',
  ar_split_panel: 'editorial-checklist-v1',
  ar_carousel_series: 'editorial-carousel-v1',
}

export function getDefaultTemplateIdForPostType(postType?: SocialPostType | null): SocialRenderTemplateId {
  if (postType === 'carousel') return 'editorial-carousel-v1'
  if (postType === 'checklist' || postType === 'recap') return 'editorial-checklist-v1'
  return 'editorial-opinion-v1'
}

export function resolveSocialRenderTemplateId(
  templateId?: string | null,
  postType?: SocialPostType | null
): SocialRenderTemplateId {
  if (templateId && templateId in SOCIAL_RENDER_TEMPLATES) {
    return templateId as SocialRenderTemplateId
  }

  if (templateId && LEGACY_TEMPLATE_MAP[templateId]) {
    return LEGACY_TEMPLATE_MAP[templateId]
  }

  return getDefaultTemplateIdForPostType(postType)
}

export function getSocialRenderTemplate(
  templateId?: string | null,
  postType?: SocialPostType | null
): SocialRenderTemplate {
  return SOCIAL_RENDER_TEMPLATES[resolveSocialRenderTemplateId(templateId, postType)]
}