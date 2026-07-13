import type { SocialRenderTemplate } from '../types'
import { ARKARA_TOKENS, backgroundLayer, footerText, informationBlocks, svgRoot, textLines } from './svg-utils'

export const editorialOpinionTemplate: SocialRenderTemplate = {
  id: 'editorial-opinion-v1',
  supportedAspectRatios: ['1:1', '4:5', '9:16'],
  maxHeadlineLength: 90,
  maxInformationBlockCount: 4,
  textAlignment: 'left',
  footerPosition: 'bottom-left',
  backgroundOverlay: 'rgba(10,20,10,0.52)',
  fallbackBackground: 'forest',
  textHierarchy: {
    label: 28,
    headline: 72,
    subheadline: 34,
    blockTitle: 26,
    blockText: 28,
    emphasis: 34,
    footer: 26,
  },
  safeZones: {
    '1:1': { outer: 72, top: 72, right: 72, bottom: 72, left: 72, footerHeight: 64, text: { x: 84, y: 110, width: 700, height: 820 } },
    '4:5': { outer: 72, top: 86, right: 72, bottom: 86, left: 72, footerHeight: 70, text: { x: 86, y: 132, width: 760, height: 1030 } },
    '9:16': { outer: 96, top: 128, right: 84, bottom: 112, left: 84, footerHeight: 80, text: { x: 92, y: 176, width: 820, height: 1520 } },
  },
  renderSvg: ({ spec, dimensions, warnings, backgroundDataUri }) => {
    const safe = editorialOpinionTemplate.safeZones[spec.aspect_ratio]
    const headlineSize = spec.aspect_ratio === '9:16' ? 76 : 72
    const subSize = spec.aspect_ratio === '1:1' ? 32 : 34
    const labelY = safe.text.y
    const headlineY = labelY + 98
    const subheadlineY = headlineY + (spec.aspect_ratio === '9:16' ? 250 : 220)
    const blocksY = subheadlineY + (spec.aspect_ratio === '1:1' ? 112 : 132)
    const maxHeadlineLines = spec.aspect_ratio === '1:1' ? 3 : 4

    const headlineWrapped = textLines({ text: spec.headline, x: safe.text.x, y: headlineY, width: safe.text.width, fontSize: headlineSize, lineHeight: headlineSize + 10, fill: ARKARA_TOKENS.cream, weight: 950, maxLines: maxHeadlineLines })
    const blockLimit = spec.aspect_ratio === '1:1' ? 2 : 3
    if (spec.information_blocks.length > blockLimit) warnings.push(`Template ${editorialOpinionTemplate.id} displays first ${blockLimit} information blocks.`)

    return svgRoot(dimensions.width, dimensions.height, `
      ${backgroundLayer({ dimensions, backgroundDataUri, fallbackId: 'forest', overlay: editorialOpinionTemplate.backgroundOverlay })}
      <rect x="${safe.left}" y="${safe.top}" width="${safe.text.width + 64}" height="${dimensions.height - safe.top - safe.bottom - safe.footerHeight}" rx="34" fill="rgba(26,46,26,0.68)" stroke="rgba(252,251,247,0.16)"/>
      ${textLines({ text: spec.label.toUpperCase(), x: safe.text.x, y: labelY, width: safe.text.width, fontSize: 28, lineHeight: 34, fill: ARKARA_TOKENS.amber, weight: 900, maxLines: 1 })}
      ${headlineWrapped}
      ${textLines({ text: spec.subheadline, x: safe.text.x, y: subheadlineY, width: safe.text.width, fontSize: subSize, lineHeight: subSize + 10, fill: ARKARA_TOKENS.cream, weight: 650, maxLines: 3 })}
      ${informationBlocks({ blocks: spec.information_blocks.slice(0, blockLimit), x: safe.text.x, y: blocksY, width: safe.text.width, gap: 18, titleSize: 24, textSize: 26, maxTextLines: 2, variant: 'dark' })}
      ${textLines({ text: spec.emphasis_text, x: safe.text.x, y: dimensions.height - safe.bottom - safe.footerHeight - 38, width: safe.text.width, fontSize: 32, lineHeight: 40, fill: ARKARA_TOKENS.amber, weight: 900, maxLines: 2 })}
      ${footerText(spec.footer, safe.left, dimensions.height - safe.bottom, ARKARA_TOKENS.cream)}
    `)
  },
}