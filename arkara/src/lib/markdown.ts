import { marked } from 'marked'

marked.setOptions({
  gfm: true,
  breaks: true,
})

export function renderMarkdown(content: string): string {
  return marked.parse(content) as string
}
