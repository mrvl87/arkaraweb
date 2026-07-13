import sharp from 'sharp'
import type { SocialAspectRatio, SocialPostType } from '../../../types/social'
import { getSocialRenderDimensions } from './dimensions'
import { getSocialRenderTemplate } from './template-registry'
import type { SocialRenderInput, SocialRenderResult } from './types'
import { validateTextBox, validateVisualSpecForTemplate } from './text-validation'

const SOCIAL_ASSETS_BUCKET = 'social-assets'

export function getSocialAssetsBucket() {
  return SOCIAL_ASSETS_BUCKET
}

export function getNextSocialAssetVersion(existingVersions: Array<number | null | undefined>): number {
  const maxVersion = existingVersions.reduce<number>((max, version) => {
    if (typeof version !== 'number' || !Number.isFinite(version)) return max
    return Math.max(max, version)
  }, 0)

  return maxVersion + 1
}

export function sanitizeStorageSegment(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'asset'
}

export function buildSocialAssetStoragePath(params: {
  userId: string
  postId: string
  assetKind: 'poster' | 'carousel-slide'
  version: number
  slideId?: string | null
}): string {
  const owner = params.userId.trim()
  const post = params.postId.trim()
  if (!owner || !post) throw new Error('userId and postId are required for social asset storage path.')
  if (params.version < 1) throw new Error('version must be greater than 0.')

  const base = params.assetKind === 'carousel-slide'
    ? `${owner}/${post}/carousel/${sanitizeStorageSegment(params.slideId || 'slide')}`
    : `${owner}/${post}/poster`

  return `${base}-v${params.version}.png`
}

function resolveBackgroundReference(input: SocialRenderInput) {
  if (input.backgroundImage && input.backgroundImage.byteLength > 0) {
    const contentType = input.backgroundMimeType?.startsWith('image/') ? input.backgroundMimeType : 'image/png'
    return `data:${contentType};base64,${Buffer.from(input.backgroundImage).toString('base64')}`
  }

  if (input.backgroundImageUrl && (/^data:image\//.test(input.backgroundImageUrl) || input.backgroundImageUrl.startsWith('/'))) {
    return input.backgroundImageUrl
  }

  return undefined
}

function collectLayoutWarnings(
  input: SocialRenderInput,
  template = getSocialRenderTemplate(input.templateId),
  aspectRatio: SocialAspectRatio
) {
  if (!input.spec) return []
  const safe = template.safeZones[aspectRatio]
  const warnings: string[] = []
  const headlineCheck = validateTextBox({
    text: input.spec.headline,
    boxWidth: safe.text.width,
    boxHeight: aspectRatio === '1:1' ? 250 : 330,
    fontSize: template.textHierarchy.headline,
    lineHeight: template.textHierarchy.headline + 12,
    maxLines: aspectRatio === '1:1' ? 3 : 4,
  })

  if (headlineCheck) warnings.push(`Headline ${headlineCheck}.`)

  const subheadlineCheck = validateTextBox({
    text: input.spec.subheadline,
    boxWidth: safe.text.width,
    boxHeight: 150,
    fontSize: template.textHierarchy.subheadline,
    lineHeight: template.textHierarchy.subheadline + 10,
    maxLines: 3,
  })

  if (subheadlineCheck) warnings.push(`Subheadline ${subheadlineCheck}.`)

  return warnings
}

export async function renderSocialAsset(input: SocialRenderInput & { postType?: SocialPostType | null }): Promise<SocialRenderResult> {
  const template = getSocialRenderTemplate(input.templateId ?? input.spec?.template_id, input.postType)
  const warnings = validateVisualSpecForTemplate(input.spec, template)
  const spec = input.spec!
  const aspectRatio = input.aspectRatio ?? spec.aspect_ratio

  if (!template.supportedAspectRatios.includes(aspectRatio)) {
    throw new Error(`Template ${template.id} does not support aspect ratio ${aspectRatio}.`)
  }

  const dimensions = getSocialRenderDimensions(aspectRatio)
  warnings.push(...collectLayoutWarnings(input, template, aspectRatio))

  const svg = template.renderSvg({
    spec: { ...spec, aspect_ratio: aspectRatio },
    dimensions,
    warnings,
    backgroundDataUri: resolveBackgroundReference(input),
  })

  const png = await sharp(Buffer.from(svg)).png().toBuffer()
  const metadata = await sharp(png).metadata()

  return {
    png,
    width: metadata.width ?? dimensions.width,
    height: metadata.height ?? dimensions.height,
    warnings,
    templateId: template.id,
  }
}