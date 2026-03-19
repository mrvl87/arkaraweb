import { marked } from 'marked'

marked.setOptions({
  gfm: true,
  breaks: true,
})

export function renderContent(content: string): string {
  if (!content || content.trim() === '') return ''
  const trimmed = content.trim()
  if (trimmed.startsWith('<')) {
    return trimmed
  }
  return marked.parse(trimmed) as string
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
    const text = match[2].replace(/<[^>]*>/g, '').trim();
    const slug = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
    headings.push({ text, slug, depth });
  }
  
  // If no HTML headings, try Markdown style (##, ###)
  if (headings.length === 0) {
    const mdRegex = /^(#{2,3})\s+(.*)$/gm;
    while ((match = mdRegex.exec(content)) !== null) {
      const depth = match[1].length;
      const text = match[2].trim();
      const slug = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
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
