import type { SocialVisualSpec } from '../../../types/social'
import type { SocialRenderTemplate } from './types'
import { SocialRenderValidationError } from './types'

export interface TextBoxValidationInput {
  text: string
  boxWidth: number
  boxHeight: number
  fontSize: number
  lineHeight: number
  maxLines: number
}

export interface WrappedText {
  lines: string[]
  overflow: boolean
}

const DEFAULT_FONT_WIDTH_RATIO = 0.54

export function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export function normalizeSpace(value: string): string {
  return value.replace(/\s+/g, ' ').trim()
}

export function wrapText(
  value: string,
  maxWidth: number,
  fontSize: number,
  maxLines: number,
  fontWidthRatio = DEFAULT_FONT_WIDTH_RATIO
): WrappedText {
  const normalized = normalizeSpace(value)
  if (!normalized) return { lines: [], overflow: false }

  const maxChars = Math.max(4, Math.floor(maxWidth / Math.max(1, fontSize * fontWidthRatio)))
  const words = normalized.split(' ')
  const lines: string[] = []
  let current = ''
  let overflow = false

  for (const word of words) {
    if (word.length > maxChars) {
      if (current) {
        lines.push(current)
        current = ''
      }

      for (let index = 0; index < word.length; index += maxChars) {
        lines.push(word.slice(index, index + maxChars))
      }
      continue
    }

    const candidate = current ? `${current} ${word}` : word
    if (candidate.length <= maxChars) {
      current = candidate
    } else {
      lines.push(current)
      current = word
    }
  }

  if (current) lines.push(current)

  if (lines.length > maxLines) {
    overflow = true
    return { lines: lines.slice(0, maxLines), overflow }
  }

  return { lines, overflow }
}

export function validateTextBox(input: TextBoxValidationInput): string | null {
  const wrapped = wrapText(input.text, input.boxWidth, input.fontSize, input.maxLines)
  if (wrapped.overflow) return 'text exceeds maximum line count'

  const usedHeight = wrapped.lines.length * input.lineHeight
  if (usedHeight > input.boxHeight) return 'text exceeds box height'

  return null
}

export function validateVisualSpecForTemplate(
  spec: SocialVisualSpec | null,
  template: SocialRenderTemplate
): string[] {
  if (!spec) {
    throw new SocialRenderValidationError('Visual spec is required before rendering.')
  }

  const warnings: string[] = []

  if (!template.supportedAspectRatios.includes(spec.aspect_ratio)) {
    throw new SocialRenderValidationError(
      `Template ${template.id} does not support aspect ratio ${spec.aspect_ratio}.`
    )
  }

  if (spec.headline.length > template.maxHeadlineLength) {
    throw new SocialRenderValidationError(
      `Headline exceeds hard limit for ${template.id}: ${spec.headline.length}/${template.maxHeadlineLength}.`
    )
  }

  if (spec.information_blocks.length > template.maxInformationBlockCount) {
    throw new SocialRenderValidationError(
      `Information blocks exceed hard limit for ${template.id}: ${spec.information_blocks.length}/${template.maxInformationBlockCount}.`
    )
  }

  if (spec.subheadline.length > 160) {
    warnings.push('Subheadline is near template limit; line wrapping may become dense.')
  }

  for (const [index, block] of spec.information_blocks.entries()) {
    if (block.text.length > 150) {
      warnings.push(`Information block ${index + 1} is long and may need smaller typography.`)
    }
  }

  return warnings
}