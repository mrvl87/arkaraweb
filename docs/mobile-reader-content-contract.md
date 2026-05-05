# Mobile Reader Content Contract

Status: Draft for Part 0
Owner: Arkara CMS and Arkara public frontend
Primary goal: align CMS content structure, AI generation output, and the soft-black mobile reader design.

## Context

Arkara is moving from a classic mobile web article experience toward a calmer soft-black mobile reader experience. The visual design depends on content that is modular, scan-friendly, and useful within the first screen.

The current CMS and frontend already support SEO-friendly articles, rich editing, AI draft generation, fact checking, internal link suggestions, images, redirects, and revalidation. The missing layer is a shared content contract that tells both systems which editorial data should exist and how each field maps into the mobile UI.

This document defines that contract before schema, CMS, AI, and frontend work begin.

## Product Principles

1. The public article page should feel like a native reader app, not a desktop blog squeezed into a phone.
2. The CMS should guide writers toward mobile-first structure instead of leaving all structure inside one long `content` field.
3. SEO strength must remain intact: canonical URLs, SSR-rendered content, headings, metadata, internal links, and schema-ready FAQ should continue to work.
4. Existing articles and panduan must remain compatible even when the new fields are empty.
5. AI should generate modular article parts that editors can review and adjust, not only a long body draft.

## Content Entities

The contract applies to:

- `posts`: editorial blog articles.
- `panduan`: technical guides.

Both content types should support the same reader fields, with slightly different editorial expectations.

Posts are more editorial and scenario-driven.
Panduan entries are more operational, checklist-driven, and step-by-step.

## Proposed Fields

### `quick_answer`

Type: `TEXT`

Purpose:
Give the reader a direct answer within the first screen.

Frontend use:
Render near the top of the article, before or immediately after the hero image depending on final layout.

CMS use:
Editable textarea labeled `Jawaban Singkat`.

AI use:
Generate 1-2 short paragraphs, around 60-120 words.

Rules:
- Answer the search intent directly.
- No long intro.
- No generic motivational opening.
- Mention scope or limitation if needed.

Fallback:
If empty, frontend can omit the block. It should not auto-generate from `description` unless we explicitly decide to do so later.

### `key_takeaways`

Type: `JSONB`

Recommended shape:

```json
[
  "Poin inti pertama.",
  "Poin inti kedua.",
  "Poin inti ketiga."
]
```

Purpose:
Power the `Inti Artikel` panel in the soft-black article design.

Frontend use:
Render as a compact summary card or section titled `Inti Artikel`.

CMS use:
Editable list field with add, remove, reorder, and regenerate actions.

AI use:
Generate 3-5 concise bullets.

Rules:
- Each item should be short enough to scan on mobile.
- Prefer concrete outcomes, warnings, decisions, or checks.
- Avoid repeating the title or meta description.

Fallback:
If empty, hide the `Inti Artikel` block.

### `faq`

Type: `JSONB`

Recommended shape:

```json
[
  {
    "question": "Pertanyaan pembaca?",
    "answer": "Jawaban singkat dan jelas."
  }
]
```

Purpose:
Support mobile scan behavior, long-tail SEO, and future FAQ schema.

Frontend use:
Render as an accordion or compact FAQ section near the end of the article.

CMS use:
Editable question-answer list.

AI use:
Generate 3-5 FAQ items.

Rules:
- Questions should match real reader objections or follow-up searches.
- Answers should be short, concrete, and not duplicate large sections.
- Avoid claims that require current external verification unless fact checked.

Fallback:
If empty, omit FAQ.

### `editorial_format`

Type: `TEXT`

Default: `legacy`

Database default is `legacy`, so existing content is not mislabeled as already mobile-refactored. CMS default for newly refactored content can become `mobile_reader` in Part 3 when the editor controls exist.

Purpose:
Mark the intended article structure for future migrations and reporting.

Suggested values:
- `legacy`
- `mobile_reader`
- `technical_guide`

Frontend use:
Mostly informational for now.

CMS use:
Can power filtering, warnings, or migration status later.

AI use:
May choose prompt profile or stricter output rules later.

Fallback:
Treat missing value as `legacy`.

### Existing `description`

Purpose remains:
Excerpt for cards and fallback meta context.

Frontend use:
Homepage cards, list pages, social snippets when `meta_desc` is not available.

CMS use:
Keep label: `Ringkasan`.

Relationship to `quick_answer`:
`description` is for preview and CTR. `quick_answer` is for readers already inside the article.

### Existing `content`

Purpose remains:
Main article body, stored as HTML or markdown-derived HTML from the rich editor.

Frontend use:
Render inside the article body after the modular intro sections.

CMS use:
Continue using Novel/Tiptap editor.

Rules:
- Should start with H2/H3 body sections, not H1.
- Paragraphs should be short for mobile.
- Long lists, tables, or warnings should be structured clearly.

## Frontend Mapping

### Article Page

Recommended render order:

1. App bar and reading progress.
2. Category, title, date, reading time.
3. Hero image when available.
4. `quick_answer`.
5. `key_takeaways` as `Inti Artikel`.
6. Collapsible `Isi Artikel` / TOC trigger.
7. `content`.
8. FAQ.
9. Related content.

Mobile rules:
- Avoid thick borders and hard offset shadows.
- Use soft-black surfaces and comfortable contrast.
- Keep body text readable for long sessions.
- Keep interactive controls thumb-friendly.

Desktop rules:
- Existing editorial layout can remain stronger and wider.
- New fields should still be visible, but mobile reader behavior has priority.

### Homepage

Fields needed from posts and panduan:

- `title`
- `slug`
- `description`
- `category`
- `thumbnail_image` or `cover_image`
- `published_at`
- calculated reading time from `content`

Future homepage enhancements:
- Use local storage for `Lanjutkan Membaca`.
- Use editorial curation or recency for `Pilihan Editor`.
- Use `key_takeaways` only if a compact teaser needs stronger preview text.

## CMS Mapping

### Post Form

Add a `Mobile Reader Structure` panel near the content editor:

- `Jawaban Singkat`: textarea bound to `quick_answer`.
- `Inti Artikel`: editable list bound to `key_takeaways`.
- `FAQ`: editable list bound to `faq`.
- `Mobile Preview`: soft-black article preview using current form state.

### Panduan Form

Use the same panel, but label guidance should be more operational:

- `Jawaban Singkat`: what this guide helps the reader do.
- `Inti Panduan`: key decisions, materials, limits, or warnings.
- `FAQ`: common operational questions.

### AI Draft Generator

The generator should fill:

- `content`
- `quick_answer`
- `key_takeaways`
- `faq`
- `suggested_slug`
- `suggested_meta_title`
- `suggested_meta_desc`

Apply behavior:

- `Replace Editor`: replaces `content` only.
- `Apply Metadata`: applies slug and SEO fields.
- `Apply Mobile Structure`: applies `quick_answer`, `key_takeaways`, and `faq`.
- A combined apply button can be added later after trust is established.

### Rich Editor

Slash commands should eventually include:

- `Jawaban singkat`
- `Checklist`
- `Peringatan`
- `Failure mode`
- `FAQ item`
- `Langkah`

Selection AI should eventually include:

- `Perpendek untuk mobile`
- `Ubah jadi bullet`
- `Buat heading lebih spesifik`
- `Buat lebih scan-friendly`

## AI Contract

Full draft output should evolve from:

```json
{
  "content": "...",
  "word_count": 1500,
  "suggested_slug": "...",
  "suggested_meta_title": "...",
  "suggested_meta_desc": "..."
}
```

To:

```json
{
  "quick_answer": "...",
  "key_takeaways": ["...", "...", "..."],
  "content": "...",
  "faq": [
    {
      "question": "...",
      "answer": "..."
    }
  ],
  "word_count": 1200,
  "suggested_slug": "...",
  "suggested_meta_title": "...",
  "suggested_meta_desc": "..."
}
```

Prompt rules:

- Answer the core intent within the first 150 words.
- Avoid long introductory sections.
- Use H2/H3 headings that answer specific reader questions.
- Keep paragraphs short.
- Every major section should contain at least one scan-friendly element when relevant: bullet list, checklist, numbered steps, warning, table, example, or decision point.
- Include failure mode when the topic has operational risk.
- Include FAQ items.
- Keep Arkara voice: calm, tactical, realistic, not generic.

## Quality Gate

The CMS should eventually warn before publishing when:

- `quick_answer` is empty.
- `key_takeaways` has fewer than 3 items.
- `faq` has fewer than 3 items.
- `meta_title` or `meta_desc` is empty.
- Body has too few H2 headings.
- Body has paragraphs that are too long.
- No internal links are present.

Initial phase:
Warnings only, no publish blocking.

Future phase:
Allow stricter blocking for new `mobile_reader` content if needed.

## Backward Compatibility

Existing articles and panduan should keep rendering normally.

Rules:

- Missing `quick_answer`: hide block.
- Missing or invalid `key_takeaways`: hide block.
- Missing or invalid `faq`: hide block.
- Missing `editorial_format`: treat as `legacy`.
- Existing `content`, `description`, `meta_title`, `meta_desc`, and image fields remain source-compatible.

## Implementation Parts

Part 1: Database and types.
Part 2: AI output contract. Done in CMS prompt/schema as `PROMPT_VERSION` v11. Full draft output now includes `quick_answer`, `key_takeaways`, `faq`, and `editorial_format`.
Part 3: CMS editorial form. Done with a reusable Mobile Reader Structure panel for posts and panduan, plus `Apply Mobile Structure` from AI draft output.
Part 4: Rich editor commands. Done with slash commands for `Jawaban singkat`, `Checklist`, `Peringatan`, `Failure mode`, `FAQ item`, and `Langkah`, plus selection AI rewrites for mobile shortening, bullet conversion, sharper headings, and scan-friendly text.
Part 5: Mobile preview CMS. Done with a soft-black mobile reader preview in both post and panduan forms, driven by live form state.
Part 6: Frontend article reader. Done with mobile-reader blocks in Arkara public article/panduan layout: quick answer, takeaways, collapsible TOC, FAQ, and soft-black mobile styles.
Part 7: Homepage mobile. Done with a soft-black mobile homepage layer: sticky app bar, horizontal topic rail, app-like hero, horizontal article feed, topic cards, and CTA treatment.
Part 8: Publish quality gate.

## Open Decisions

1. Should `quick_answer`, `key_takeaways`, and `faq` be stored directly on both `posts` and `panduan`, or in a shared metadata table?
   Recommendation: store directly on both tables for simplicity and fast frontend reads.

2. Should FAQ schema be emitted immediately on frontend?
   Recommendation: yes after field validation is in place.

3. Should old articles be backfilled automatically?
   Recommendation: no for Part 1. Add a later migration tool or CMS action after the new workflow stabilizes.

4. Should `description` be auto-derived from `quick_answer`?
   Recommendation: no. They serve different jobs: CTR preview vs in-article answer.

5. Should mobile reader design become global dark mode?
   Recommendation: no. Start with article and homepage mobile. Desktop can be adapted later after evidence.
