"use client"

import { AIResultPreview } from './ai-result-preview'
import type { WorkspaceOperation, WorkspaceResult } from './use-ai-workspace'
import type {
  GenerateSEOPackOutput,
  GenerateOutlineOutput,
  GenerateFullDraftOutput,
  GenerateClusterIdeasOutput,
  GenerateImagePromptsOutput,
  VerifyLatestFactsOutput,
} from '@/lib/ai/schemas'

interface AIResultRendererProps {
  activeOp: WorkspaceOperation
  result: WorkspaceResult | null
}

function formatClaimStatus(status: VerifyLatestFactsOutput['claims'][number]['status']) {
  const labels: Record<VerifyLatestFactsOutput['claims'][number]['status'], string> = {
    needs_web_verification: 'Needs Web Verification',
    needs_update: 'Needs Update',
    unsupported: 'Unsupported',
    uncertain: 'Uncertain',
  }

  return labels[status]
}

export function AIResultRenderer({ activeOp, result }: AIResultRendererProps) {
  if (!result) return null

  switch (activeOp) {
    case 'seo_pack': {
      const data = result as GenerateSEOPackOutput
      return (
        <AIResultPreview
          title="SEO Pack"
          rawJson={data}
          fields={[
            { label: 'Meta Title', value: data.meta_title },
            { label: 'Meta Description', value: data.meta_desc },
            { label: 'Excerpt', value: data.excerpt },
            { label: 'Focus Keyword', value: data.focus_keyword },
            ...(data.secondary_keywords?.length
              ? [{ label: 'Secondary Keywords', value: data.secondary_keywords.join(', ') }]
              : []),
          ]}
        />
      )
    }
    case 'outline': {
      const data = result as GenerateOutlineOutput
      return (
        <AIResultPreview
          title="Outline"
          rawJson={data}
          fields={[
            { label: 'Judul', value: data.outline_title },
            ...data.sections.map((section, index) => ({
              label: `Section ${index + 1}`,
              value: [
                section.heading,
                ...(section.subheadings?.map((item) => `- ${item}`) ?? []),
                ...(section.notes ? [`Catatan: ${section.notes}`] : []),
              ].join('\n'),
            })),
            ...(data.estimated_word_count
              ? [{ label: 'Estimasi Kata', value: `${data.estimated_word_count} kata` }]
              : []),
          ]}
        />
      )
    }
    case 'full_draft': {
      const data = result as GenerateFullDraftOutput
      return (
        <div className="space-y-4">
          <AIResultPreview
            title="Draft Metadata"
            rawJson={data}
            fields={[
              ...(data.editorial_format ? [{ label: 'Format Editorial', value: data.editorial_format }] : []),
              ...(data.quick_answer ? [{ label: 'Jawaban Singkat', value: data.quick_answer }] : []),
              ...(data.key_takeaways?.length
                ? [{ label: 'Inti Artikel', value: data.key_takeaways.join('\n') }]
                : []),
              ...(data.faq?.length
                ? [{ label: 'FAQ', value: data.faq.map((item) => `${item.question}\n${item.answer}`).join('\n\n') }]
                : []),
              ...(data.suggested_slug ? [{ label: 'Slug', value: data.suggested_slug }] : []),
              ...(data.suggested_meta_title
                ? [{ label: 'Meta Title', value: data.suggested_meta_title }]
                : []),
              ...(data.suggested_meta_desc
                ? [{ label: 'Meta Desc', value: data.suggested_meta_desc }]
                : []),
              ...(data.word_count ? [{ label: 'Jumlah Kata', value: `${data.word_count}` }] : []),
            ]}
          />
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="bg-gradient-to-r from-arkara-green to-arkara-green/90 px-5 py-3">
              <h4 className="text-sm font-bold tracking-wide text-arkara-amber">
                Konten Draft
              </h4>
            </div>
            <div className="max-h-[600px] overflow-y-auto p-5">
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-gray-800">
                {data.content}
              </pre>
            </div>
          </div>
        </div>
      )
    }
    case 'cluster_ideas': {
      const data = result as GenerateClusterIdeasOutput
      return (
        <AIResultPreview
          title="Cluster Ideas"
          rawJson={data}
          fields={[
            { label: 'Pillar Topic', value: data.pillar_topic },
            ...data.ideas.map((idea, index) => ({
              label: `Ide ${index + 1} (${idea.content_type || 'post'})`,
              value: `Title: ${idea.title}\nAngle: ${idea.angle}\nKeyword: ${idea.target_keyword}`,
            })),
          ]}
        />
      )
    }
    case 'verify_latest_facts': {
      const data = result as VerifyLatestFactsOutput
      return (
        <AIResultPreview
          title="Verify Latest Facts"
          rawJson={data}
          fields={[
            { label: 'Summary', value: data.summary },
            ...(data.checked_at ? [{ label: 'Checked At', value: data.checked_at }] : []),
            ...data.claims.map((claim, index) => ({
              label: `Claim ${index + 1} - ${formatClaimStatus(claim.status)}`,
              value: [
                claim.claim,
                `Reason: ${claim.reason}`,
                claim.suggested_revision ? `Suggested Revision: ${claim.suggested_revision}` : '',
                claim.sources.length
                  ? `Sources:\n${claim.sources.map((source) => [
                      `- ${source.title}${source.publisher ? ` (${source.publisher})` : ''}`,
                      source.url ? `  ${source.url}` : '',
                      source.note ? `  ${source.note}` : '',
                    ].filter(Boolean).join('\n')).join('\n')}`
                  : 'Sources: -',
              ].filter(Boolean).join('\n\n'),
            })),
          ]}
        />
      )
    }
    case 'image_prompts': {
      const data = result as GenerateImagePromptsOutput
      return (
        <AIResultPreview
          title="Image Prompts"
          rawJson={data}
          fields={[
            { label: 'Art Direction', value: data.art_direction },
            ...data.hero_prompts.map((item, index) => ({
              label: `Prompt ${index + 1} - ${item.label}`,
              value: item.prompt,
            })),
          ]}
        />
      )
    }
  }
}