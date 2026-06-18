import { marked } from 'marked'
import { rewriteHtmlMediaUrls } from './media'

marked.setOptions({
  gfm: true,
  breaks: true,
})

function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-') || 'bagian'
}

function getUniqueSlug(baseSlug: string, seen: Map<string, number>): string {
  const currentCount = seen.get(baseSlug) ?? 0
  seen.set(baseSlug, currentCount + 1)

  return currentCount === 0 ? baseSlug : `${baseSlug}-${currentCount + 1}`
}

function extractIdAttribute(attrs: string): string | null {
  const match = attrs.match(/\bid\s*=\s*["']([^"']+)["']/i)
  return match?.[1] ?? null
}

function getImageAttribute(tag: string, name: string): string {
  const match = tag.match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']*)["']`, 'i'))
  return match?.[1]?.trim() ?? ''
}

function escapeAttribute(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function humanizeImageSrc(src: string): string {
  const fileName = src.split(/[?#]/)[0]?.split('/').pop() ?? ''

  return fileName
    .replace(/\.[a-z0-9]+$/i, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\b\d{6,}\b/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function addBodyImageLoadingAttributes(html: string): string {
  return html.replace(/<img\b[^>]*>/gi, (tag) => {
    if (/^\s*<img\b[^>]*\bsrc\s*=\s*["']data:/i.test(tag)) {
      return tag
    }

    const altText = getImageAttribute(tag, 'alt')
    const titleText = getImageAttribute(tag, 'title')
    const fallbackText = altText || titleText || humanizeImageSrc(getImageAttribute(tag, 'src')) || 'Gambar Arkara'
    let nextTag = tag

    if (/\balt\s*=/i.test(nextTag)) {
      nextTag = nextTag.replace(/\balt\s*=\s*["'][^"']*["']/i, `alt="${escapeAttribute(fallbackText)}"`)
    }

    if (/\btitle\s*=/i.test(nextTag)) {
      nextTag = nextTag.replace(/\btitle\s*=\s*["'][^"']*["']/i, `title="${escapeAttribute(titleText || fallbackText)}"`)
    }

    const attributes = [
      /\balt\s*=/i.test(nextTag) ? '' : ` alt="${escapeAttribute(fallbackText)}"`,
      /\btitle\s*=/i.test(nextTag) ? '' : ` title="${escapeAttribute(titleText || fallbackText)}"`,
      /\bloading\s*=/i.test(nextTag) ? '' : ' loading="lazy"',
      /\bdecoding\s*=/i.test(nextTag) ? '' : ' decoding="async"',
      /\bfetchpriority\s*=/i.test(nextTag) ? '' : ' fetchpriority="low"',
    ].join('')

    if (!attributes) {
      return nextTag
    }

    return nextTag.replace(/\s*\/?>$/, (ending) => {
      const close = ending.includes('/>') ? ' />' : '>'
      return `${attributes}${close}`
    })
  })
}

export function renderContent(content: string): string {
  if (!content || content.trim() === '') return ''
  const trimmed = content.trim()
  
  let html = trimmed.startsWith('<') 
    ? trimmed 
    : marked.parse(trimmed) as string

  html = rewriteHtmlMediaUrls(html)
  html = addBodyImageLoadingAttributes(html)

  // Inject IDs into h2 and h3 tags for TOC navigation
  const seenHeadingIds = new Map<string, number>()

  return html.replace(/<(h[23])([^>]*)>(.*?)<\/h\1>/gi, (match, tag, attrs, content) => {
    const existingId = extractIdAttribute(attrs)

    if (existingId) {
      seenHeadingIds.set(existingId, (seenHeadingIds.get(existingId) ?? 0) + 1)
      return match
    }
    
    const text = content.replace(/<[^>]*>/g, '').trim();
    const slug = getUniqueSlug(slugifyHeading(text), seenHeadingIds)
    
    return `<${tag}${attrs} id="${slug}">${content}</${tag}>`;
  });
}

export function renderMarkdown(content: string): string {
  return renderContent(content)
}

export function extractHeadings(content: string) {
  // Extract h2 and h3 from HTML or Markdown
  const headings: { text: string; slug: string; depth: number }[] = [];
  
  // Try to find h2 and h3 in HTML tags (from Novel/Tiptap)
  const htmlRegex = /<h([23])[^>]*>(.*?)<\/h\1>/gi;
  let match;
  
  while ((match = htmlRegex.exec(content)) !== null) {
    const depth = parseInt(match[1]);
    const attrs = match[0].match(/<h[23]([^>]*)>/i)?.[1] ?? '';
    const text = match[2].replace(/<[^>]*>/g, '').trim();
    const slug = extractIdAttribute(attrs) ?? slugifyHeading(text);
    headings.push({ text, slug, depth });
  }
  
  // If no HTML headings, try Markdown style (##, ###)
  if (headings.length === 0) {
    const mdRegex = /^(#{2,3})\s+(.*)$/gm;
    while ((match = mdRegex.exec(content)) !== null) {
      const depth = match[1].length;
      const text = match[2].trim();
      const slug = slugifyHeading(text);
      headings.push({ text, slug, depth });
    }
  }

  return headings;
}

export function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const noHtml = content.replace(/<[^>]*>/g, '');
  const words = noHtml.trim().split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
}
