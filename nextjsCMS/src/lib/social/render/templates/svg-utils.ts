import type { SocialVisualInformationBlock } from '../../../../types/social'
import type { SocialRenderDimensions } from '../types'
import { escapeXml, wrapText } from '../text-validation'

export const ARKARA_TOKENS = {
  forest: '#1A2E1A',
  amber: '#D4AF37',
  cream: '#FCFBF7',
  white: '#FFFFFF',
  ink: '#122012',
} as const

export function svgRoot(width: number, height: number, content: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${content}</svg>`
}

export function backgroundLayer(params: {
  dimensions: SocialRenderDimensions
  backgroundDataUri?: string
  fallbackId: string
  overlay: string
}) {
  const { width, height } = params.dimensions
  const fallback = params.fallbackId === 'amber'
    ? `<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#FCFBF7"/><stop offset="52%" stop-color="#D4AF37"/><stop offset="100%" stop-color="#1A2E1A"/></linearGradient>`
    : `<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#1A2E1A"/><stop offset="55%" stop-color="#274527"/><stop offset="100%" stop-color="#D4AF37"/></linearGradient>`

  const image = params.backgroundDataUri
    ? `<image href="${params.backgroundDataUri}" x="0" y="0" width="${width}" height="${height}" preserveAspectRatio="xMidYMid slice"/>`
    : `<rect width="${width}" height="${height}" fill="url(#bg)"/>`

  return `<defs>${fallback}<filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="18" stdDeviation="24" flood-color="#000000" flood-opacity="0.2"/></filter></defs>${image}<rect width="${width}" height="${height}" fill="${params.overlay}"/>`
}

export function textLines(params: {
  text: string
  x: number
  y: number
  width: number
  fontSize: number
  lineHeight: number
  fill: string
  weight?: number
  maxLines: number
  anchor?: 'start' | 'middle'
  letterSpacing?: number
}) {
  const wrapped = wrapText(params.text, params.width, params.fontSize, params.maxLines)
  const anchor = params.anchor ?? 'start'
  const letterSpacing = params.letterSpacing ?? 0
  const lines = wrapped.lines.map((line, index) => {
    const y = params.y + index * params.lineHeight
    return `<text x="${params.x}" y="${y}" text-anchor="${anchor}" font-family="Inter, Arial, sans-serif" font-size="${params.fontSize}" font-weight="${params.weight ?? 700}" letter-spacing="${letterSpacing}" fill="${params.fill}">${escapeXml(line)}</text>`
  })

  return lines.join('')
}

export function informationBlocks(params: {
  blocks: SocialVisualInformationBlock[]
  x: number
  y: number
  width: number
  gap: number
  titleSize: number
  textSize: number
  maxTextLines: number
  variant: 'light' | 'dark'
}) {
  const blockHeight = params.variant === 'light' ? 122 : 132
  return params.blocks.map((block, index) => {
    const y = params.y + index * (blockHeight + params.gap)
    const fill = params.variant === 'light' ? 'rgba(252,251,247,0.92)' : 'rgba(26,46,26,0.88)'
    const stroke = params.variant === 'light' ? 'rgba(26,46,26,0.12)' : 'rgba(212,175,55,0.34)'
    const titleColor = params.variant === 'light' ? ARKARA_TOKENS.forest : ARKARA_TOKENS.amber
    const textColor = params.variant === 'light' ? '#2B392B' : ARKARA_TOKENS.cream
    const title = block.title || block.icon || `Poin ${index + 1}`

    return `<g filter="url(#softShadow)"><rect x="${params.x}" y="${y}" width="${params.width}" height="${blockHeight}" rx="18" fill="${fill}" stroke="${stroke}"/>${textLines({ text: title, x: params.x + 28, y: y + 39, width: params.width - 56, fontSize: params.titleSize, lineHeight: params.titleSize + 6, fill: titleColor, weight: 900, maxLines: 1 })}${textLines({ text: block.text, x: params.x + 28, y: y + 78, width: params.width - 56, fontSize: params.textSize, lineHeight: params.textSize + 8, fill: textColor, weight: 650, maxLines: params.maxTextLines })}</g>`
  }).join('')
}

export function footerText(text: string, x: number, y: number, fill = ARKARA_TOKENS.cream, anchor: 'start' | 'middle' = 'start') {
  return `<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="Inter, Arial, sans-serif" font-size="26" font-weight="800" fill="${fill}">${escapeXml(text)}</text>`
}