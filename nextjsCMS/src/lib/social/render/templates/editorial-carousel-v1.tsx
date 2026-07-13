import type { SocialRenderTemplate } from '../types'
import { ARKARA_TOKENS, backgroundLayer, footerText, informationBlocks, svgRoot, textLines } from './svg-utils'

export const editorialCarouselTemplate: SocialRenderTemplate = {
  id: 'editorial-carousel-v1',
  supportedAspectRatios: ['1:1', '4:5', '9:16'],
  maxHeadlineLength: 72,
  maxInformationBlockCount: 4,
  textAlignment: 'center',
  footerPosition: 'bottom-center',
  backgroundOverlay: 'rgba(10,20,10,0.48)',
  fallbackBackground: 'forest',
  textHierarchy: {
    label: 24,
    headline: 68,
    subheadline: 30,
    blockTitle: 22,
    blockText: 24,
    emphasis: 30,
    footer: 26,
  },
  safeZones: {
    '1:1': { outer: 72, top: 72, right: 72, bottom: 72, left: 72, footerHeight: 64, text: { x: 116, y: 106, width: 848, height: 820 } },
    '4:5': { outer: 72, top: 82, right: 72, bottom: 86, left: 72, footerHeight: 70, text: { x: 116, y: 132, width: 848, height: 1050 } },
    '9:16': { outer: 96, top: 128, right: 84, bottom: 112, left: 84, footerHeight: 80, text: { x: 110, y: 178, width: 860, height: 1520 } },
  },
  renderSvg: ({ spec, dimensions, warnings, backgroundDataUri }) => {
    const safe = editorialCarouselTemplate.safeZones[spec.aspect_ratio]
    const centerX = dimensions.width / 2
    const headlineSize = spec.aspect_ratio === '9:16' ? 74 : 68
    const blockCount = Math.min(spec.information_blocks.length, spec.aspect_ratio === '1:1' ? 2 : 3)
    if (blockCount < spec.information_blocks.length) warnings.push(`Template ${editorialCarouselTemplate.id} displays first ${blockCount} information blocks.`)

    return svgRoot(dimensions.width, dimensions.height, `
      ${backgroundLayer({ dimensions, backgroundDataUri, fallbackId: 'forest', overlay: editorialCarouselTemplate.backgroundOverlay })}
      <circle cx="${dimensions.width - 126}" cy="${safe.top + 48}" r="44" fill="${ARKARA_TOKENS.amber}" opacity="0.95"/>
      <rect x="${safe.left}" y="${safe.top}" width="${dimensions.width - safe.left - safe.right}" height="${dimensions.height - safe.top - safe.bottom - safe.footerHeight}" rx="36" fill="rgba(26,46,26,0.62)" stroke="rgba(212,175,55,0.28)"/>
      ${textLines({ text: spec.label.toUpperCase(), x: centerX, y: safe.text.y, width: safe.text.width, fontSize: 24, lineHeight: 32, fill: ARKARA_TOKENS.amber, weight: 950, maxLines: 1, anchor: 'middle' })}
      ${textLines({ text: spec.headline, x: centerX, y: safe.text.y + 118, width: safe.text.width, fontSize: headlineSize, lineHeight: headlineSize + 12, fill: ARKARA_TOKENS.cream, weight: 950, maxLines: spec.aspect_ratio === '1:1' ? 3 : 4, anchor: 'middle' })}
      ${textLines({ text: spec.subheadline, x: centerX, y: safe.text.y + (spec.aspect_ratio === '1:1' ? 350 : 418), width: safe.text.width - 80, fontSize: 30, lineHeight: 40, fill: '#F4EAC7', weight: 700, maxLines: 3, anchor: 'middle' })}
      ${informationBlocks({ blocks: spec.information_blocks.slice(0, blockCount), x: safe.text.x, y: safe.text.y + (spec.aspect_ratio === '1:1' ? 508 : 608), width: safe.text.width, gap: 18, titleSize: 22, textSize: 24, maxTextLines: 2, variant: 'dark' })}
      ${textLines({ text: spec.emphasis_text, x: centerX, y: dimensions.height - safe.bottom - safe.footerHeight - 42, width: safe.text.width, fontSize: 30, lineHeight: 38, fill: ARKARA_TOKENS.amber, weight: 900, maxLines: 2, anchor: 'middle' })}
      ${footerText(spec.footer, centerX, dimensions.height - safe.bottom, ARKARA_TOKENS.cream, 'middle')}
    `)
  },
}