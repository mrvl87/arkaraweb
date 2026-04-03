import { marked } from 'marked'

marked.setOptions({
  gfm: true,
  breaks: true,
})

type HeadingEntry = {
  text: string
  slug: string
  depth: number
}

function stripHtml(value: string): string {
  return value.replace(/<[^>]*>/g, '').trim()
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
}

function slugifyHeading(value: string): string {
  return decodeHtmlEntities(stripHtml(value))
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function createUniqueSlug(baseSlug: string, seen: Map<string, number>): string {
  const fallbackSlug = baseSlug || 'section'
  const currentCount = seen.get(fallbackSlug) ?? 0
  seen.set(fallbackSlug, currentCount + 1)

  return currentCount === 0 ? fallbackSlug : `${fallbackSlug}-${currentCount + 1}`
}

function extractExistingId(attrs: string): string | null {
  const match = attrs.match(/\sid=["']([^"']+)["']/i)
  return match?.[1] ?? null
}

function collectHtmlHeadings(content: string): {
  html: string
  headings: HeadingEntry[]
} {
  const seen = new Map<string, number>()
  const headings: HeadingEntry[] = []

  const html = content.replace(/<(h[23])([^>]*)>(.*?)<\/h\1>/gis, (match, tag, attrs, inner) => {
    const depth = parseInt(tag[1], 10)
    const text = decodeHtmlEntities(stripHtml(inner))
    const existingId = extractExistingId(attrs)
    const slug = existingId || createUniqueSlug(slugifyHeading(inner), seen)

    headings.push({ text, slug, depth })

    if (existingId) {
      return match
    }

    return `<${tag}${attrs} id="${slug}">${inner}</${tag}>`
  })

  return { html, headings }
}

export function renderContent(content: string): string {
  if (!content || content.trim() === '') return ''
  const trimmed = content.trim()
  
  let html = trimmed.startsWith('<') 
    ? trimmed 
    : marked.parse(trimmed) as string

  return collectHtmlHeadings(html).html
}

export function renderMarkdown(content: string): string {
  return renderContent(content)
}

export function extractHeadings(content: string) {
  // Extract h2 and h3 from HTML or Markdown
  const headings: HeadingEntry[] = []
  
  // Try to find h2 and h3 in HTML tags (from Novel/Tiptap)
  const htmlResult = collectHtmlHeadings(content)
  headings.push(...htmlResult.headings)
  
  // If no HTML headings, try Markdown style (##, ###)
  if (headings.length === 0) {
    const seen = new Map<string, number>()
    const mdRegex = /^(#{2,3})\s+(.*)$/gm
    let match

    while ((match = mdRegex.exec(content)) !== null) {
      const depth = match[1].length
      const text = decodeHtmlEntities(match[2].trim())
      const slug = createUniqueSlug(slugifyHeading(text), seen)
      headings.push({ text, slug, depth })
    }
  }

  return headings
}

export function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const noHtml = content.replace(/<[^>]*>/g, '');
  const words = noHtml.trim().split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
}
