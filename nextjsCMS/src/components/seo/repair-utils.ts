import type { GenerateSeoRepairPlanOutput } from '@/lib/ai/schemas'

export function containsRawHtml(value: string): boolean {
  return /<\/?[a-z][\s\S]*?>/i.test(value)
}

export function emptyFallback(value: string): string {
  return value.trim() || '(kosong)'
}

export function linesFallback(items: string[]): string {
  return items.map((item) => item.trim()).filter(Boolean).length
    ? items.map((item) => `- ${item.trim()}`).join('\n')
    : '(kosong)'
}

export function faqToText(items: Array<{ question: string; answer: string }>): string {
  return items.length
    ? items.map((item) => `Q: ${item.question}\nA: ${item.answer}`).join('\n\n')
    : '(kosong)'
}

export function proposedFaqToText(items: GenerateSeoRepairPlanOutput['proposed_faq']): string {
  return items.length
    ? items.map((item) => `Q: ${item.question}\nA: ${item.answer}`).join('\n\n')
    : '(kosong)'
}

export function contentPatchAfterText(patch: GenerateSeoRepairPlanOutput['content_patch']): string {
  if (patch.mode === 'no_content_change' || !patch.markdown.trim()) {
    return 'Tidak ada perubahan body.'
  }

  return [
    `Mode: ${patch.mode}`,
    patch.placement_note ? `Placement: ${patch.placement_note}` : '',
    patch.markdown,
  ].filter(Boolean).join('\n\n')
}