import type { SocialRenderTemplate } from '../types'
import { ARKARA_TOKENS, backgroundLayer, footerText, informationBlocks, svgRoot, textLines } from './svg-utils'

export const editorialChecklistTemplate: SocialRenderTemplate = {
  id: 'editorial-checklist-v1',
  supportedAspectRatios: ['1:1', '4:5', '9:16'],
  maxHeadlineLength: 86,
  maxInformationBlockCount: 6,
  textAlignment: 'left',
  footerPosition: 'bottom-left',
  backgroundOverlay: 'rgba(252,251,247,0.2)',
  fallbackBackground: 'amber',
  textHierarchy: {
    label: 26,
    headline: 66,
    subheadline: 30,
    blockTitle: 24,
    blockText: 26,
    emphasis: 32,
    footer: 26,
  },
  safeZones: {
    '1:1': { outer: 72, top: 72, right: 72, bottom: 72, left: 72, footerHeight: 64, text: { x: 86, y: 108, width: 908, height: 820 } },
    '4:5': { outer: 72, top: 82, right: 72, bottom: 86, left: 72, footerHeight: 70, text: { x: 86, y: 126, width: 908, height: 1050 } },
    '9:16': { outer: 96, top: 128, right: 84, bottom: 112, left: 84, footerHeight: 80, text: { x: 92, y: 174, width: 896, height: 1520 } },
  },
  renderSvg: ({ spec, dimensions, warnings, backgroundDataUri }) => {
    const safe = editorialChecklistTemplate.safeZones[spec.aspect_ratio]
    const headlineSize = spec.aspect_ratio === '9:16' ? 72 : 66
    const blockCount = spec.aspect_ratio === '1:1' ? Math.min(spec.information_blocks.length, 4) : spec.information_blocks.length
    if (blockCount < spec.information_blocks.length) warnings.push(`Template ${editorialChecklistTemplate.id} displays first ${blockCount} information blocks.`)

    const panelY = safe.top
    const panelHeight = dimensions.height - safe.top - safe.bottom - safe.footerHeight
    const blockY = spec.aspect_ratio === '1:1' ? safe.text.y + 364 : safe.text.y + 420

    return svgRoot(dimensions.width, dimensions.height, `
      ${backgroundLayer({ dimensions, backgroundDataUri, fallbackId: 'amber', overlay: 'rgba(26,46,26,0.36)' })}
      <rect x="${safe.left}" y="${panelY}" width="${dimensions.width - safe.left - safe.right}" height="${panelHeight}" rx="30" fill="rgba(252,251,247,0.92)" stroke="rgba(26,46,26,0.12)" filter="url(#softShadow)"/>
      ${textLines({ text: spec.label.toUpperCase(), x: safe.text.x, y: safe.text.y, width: safe.text.width, fontSize: 26, lineHeight: 32, fill: ARKARA_TOKENS.amber, weight: 950, maxLines: 1 })}
      ${textLines({ text: spec.headline, x: safe.text.x, y: safe.text.y + 88, width: safe.text.width, fontSize: headlineSize, lineHeight: headlineSize + 10, fill: ARKARA_TOKENS.forest, weight: 950, maxLines: spec.aspect_ratio === '1:1' ? 3 : 4 })}
      ${textLines({ text: spec.subheadline, x: safe.text.x, y: safe.text.y + (spec.aspect_ratio === '1:1' ? 298 : 344), width: safe.text.width, fontSize: 30, lineHeight: 40, fill: '#354635', weight: 650, maxLines: 3 })}
      ${informationBlocks({ blocks: spec.information_blocks.slice(0, blockCount), x: safe.text.x, y: blockY, width: safe.text.width, gap: 16, titleSize: 23, textSize: 25, maxTextLines: 2, variant: 'light' })}
      <rect x="${safe.text.x}" y="${dimensions.height - safe.bottom - safe.footerHeight - 72}" width="${safe.text.width}" height="58" rx="18" fill="${ARKARA_TOKENS.forest}"/>
      ${textLines({ text: spec.emphasis_text, x: safe.text.x + 24, y: dimensions.height - safe.bottom - safe.footerHeight - 34, width: safe.text.width - 48, fontSize: 26, lineHeight: 32, fill: ARKARA_TOKENS.cream, weight: 850, maxLines: 1 })}
      ${footerText(spec.footer, safe.left, dimensions.height - safe.bottom, ARKARA_TOKENS.cream)}
    `)
  },
}