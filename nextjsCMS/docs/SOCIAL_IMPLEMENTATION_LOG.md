# Social Content OS Implementation Log

## 2026-07-13: Phase 0 Audit and Product Spec

Scope:

- Audit only.
- Documentation only.
- No application behavior changes.

Files inspected:

- `package.json`
- `src/app/cms/social/page.tsx`
- `src/app/cms/social/actions.ts`
- `src/components/social/social-tracker-dashboard.tsx`
- `src/components/social/social-weekly-board.tsx`
- `src/components/social/social-weekly-post-card.tsx`
- `src/components/social/social-post-editor.tsx`
- `src/components/social/social-post-main-fields.tsx`
- `src/components/social/social-post-action-bar.tsx`
- `src/components/social/social-carousel-editor.tsx`
- `src/components/social/social-slide-editor.tsx`
- `src/components/social/social-ai-plan-panel.tsx`
- `src/components/social/social-campaign-settings.tsx`
- `src/components/social/social-campaign-list.tsx`
- `src/components/social/social-campaign-header.tsx`
- `src/components/social/social-copy-ready-panel.tsx`
- `src/components/social/social-utils.ts`
- `src/types/social.ts`
- `src/lib/ai/schemas.ts`
- `src/lib/ai/operations.ts`
- `src/lib/ai/prompt-profiles.ts`
- `src/lib/supabase/server.ts`
- `src/app/cms/media/actions.ts`
- `src/app/cms/media/ai-actions.ts`
- `src/components/media/ai-generator.tsx`
- `src/components/media/media-gallery.tsx`
- `src/lib/media-url.ts`
- `supabase/schema.sql`
- `supabase/migrations/20260510120000_create_social_tracker.sql`

Files changed:

- `docs/SOCIAL_PRODUCT_SPEC.md`
- `docs/SOCIAL_DATA_MODEL.md`
- `docs/SOCIAL_RENDERER_SPEC.md`
- `docs/SOCIAL_ACCEPTANCE_CRITERIA.md`
- `docs/SOCIAL_IMPLEMENTATION_LOG.md`

Migrations created:

- None.

Feature work completed:

- Documented current Social Tracker behavior.
- Documented target Social Content OS flow.
- Documented existing data model and planned additive data model.
- Documented deterministic renderer principles.
- Documented phase-based acceptance criteria.

Renderer dependency decision:

- Use existing `sharp` with deterministic SVG composition and rasterization.
- Do not add a new rendering dependency in phase 0.

Important findings:

- Current prompt design asks AI image generation to include text in the image.
- Target renderer must move all final text and footer rendering into CMS.
- Weekly card UI stores copied and Facebook-done state in localStorage.
- Existing database fields already support copied and posted checklist state.
- Server actions exist for checklist toggle, copy mark, posted mark, status update, and metrics recording.
- Metrics action exists but a complete metrics UI is not currently wired in the inspected social components.
- Media upload uses Cloudflare R2 plus `media` table and `sharp`, not direct Supabase Storage upload.
- `supabase/schema.sql` media table shape appears older than current media action inserts.

Tests run:

- `npx tsc --noEmit --pretty false`: passed.
- `npm run lint`: failed before linting. Existing script runs `next lint`, and the installed Next CLI reports `Invalid project directory provided, no such directory: ...\nextjsCMS\lint`.
- No `test` script exists in `package.json`.

Remaining risks:

- Lint script needs a separate tooling fix in a later scope.
- Live database media schema should be verified before future poster asset migrations.
- Existing legacy `visual_prompt` data must remain readable.
- Existing localStorage state needs a gentle migration path.
- Carousel generation currently deletes and recreates slides.
- SVG text measurement with `sharp` needs template-level validation to avoid overflow.

Acceptance criteria status:

- Documentation kondisi existing tersedia: done.
- Dependency renderer yang akan dipakai sudah diputuskan: done.
- Risiko backward compatibility sudah dicatat: done.
- Tidak ada perubahan behavior aplikasi: done.

## 2026-07-13: Phase 1 Existing Social Tracker Stabilization

Scope:

- Stabilize existing Social Tracker behavior only.
- No database schema changes.
- No AI prompt changes.
- No Meta API or autoposting.

Files inspected:

- `package.json`
- `src/app/cms/social/actions.ts`
- `src/components/social/social-tracker-dashboard.tsx`
- `src/components/social/social-weekly-board.tsx`
- `src/components/social/social-weekly-post-card.tsx`
- `src/components/social/social-post-editor.tsx`
- `src/components/social/social-post-main-fields.tsx`
- `src/components/social/social-post-action-bar.tsx`
- `src/components/social/social-copy-ready-panel.tsx`
- `src/components/social/social-utils.ts`
- `src/components/social/social-ai-plan-panel.tsx`
- `src/components/social/social-carousel-editor.tsx`
- `src/components/social/social-slide-editor.tsx`
- `src/components/social/social-post-editor-types.ts`
- `src/types/social.ts`
- `src/lib/supabase/server.ts`
- `supabase/migrations/20260510120000_create_social_tracker.sql`
- `docs/SOCIAL_PRODUCT_SPEC.md`
- `docs/SOCIAL_DATA_MODEL.md`
- `docs/SOCIAL_ACCEPTANCE_CRITERIA.md`
- `docs/SOCIAL_IMPLEMENTATION_LOG.md`

Files changed:

- `src/components/social/social-tracker-dashboard.tsx`
- `src/components/social/social-weekly-board.tsx`
- `src/components/social/social-weekly-post-card.tsx`
- `src/components/social/social-post-editor.tsx`
- `src/components/social/social-post-main-fields.tsx`
- `src/components/social/social-post-action-bar.tsx`
- `src/components/social/social-copy-ready-panel.tsx`
- `src/components/social/social-utils.ts`
- `src/components/social/social-post-editor-types.ts`
- `src/components/social/social-checklist-panel.tsx`
- `src/components/social/social-metrics-panel.tsx`
- `docs/SOCIAL_PRODUCT_SPEC.md`
- `docs/SOCIAL_DATA_MODEL.md`
- `docs/SOCIAL_ACCEPTANCE_CRITERIA.md`
- `docs/SOCIAL_IMPLEMENTATION_LOG.md`

Migrations created:

- None.

Feature work completed:

- Removed Social Tracker localStorage as source of truth for copied and posted state.
- Weekly cards now use `copied_done`, `posted_done`, `status`, and latest metrics from server data.
- Copy caption now persists through `copyPostCaptionMark()` after clipboard copy.
- Posted state now persists through `markPostPosted()`.
- Editor has separate Hook, Body, and CTA fields.
- Combined caption is read-only and generated with `buildCaption()`.
- Editor exposes Copy Caption, Mark Ready, Mark Posted, and Mark Reviewed actions.
- Added checklist panel using `togglePostChecklistItem()` for non-status checklist items.
- Added metrics panel using `recordPostMetrics()`.
- Metrics save marks `metrics_done = true` and `status = reviewed` through the existing server action.
- Latest metrics display on weekly cards and inside the editor.

Checklist/status duplication note:

- `status` remains the workflow state.
- `copied_done`, `posted_done`, and `metrics_done` remain checklist flags used for UI badges and workflow completion.
- Non-status checklist fields remain manual operational flags.
- No checklist fields were removed.

Tests run:

- `npx tsc --noEmit --pretty false`: passed during implementation.
- Final verification pending.

Remaining risks:

- `npm run lint` still uses the existing `next lint` script that failed in phase 0 before linting.
- Mark Reviewed can set status reviewed without metrics if the user clicks it manually; metrics save remains the primary reviewed workflow.
- Existing localStorage values are ignored by design because database fields are now the source of truth.

Acceptance criteria status:

- Refresh browser tidak menghilangkan status copy atau posted: done.
- Status sama pada perangkat berbeda: done via database-backed state.
- Hook, body, dan CTA dapat diedit terpisah: done.
- Metrics dapat dimasukkan dari UI: done.
- Post reviewed menampilkan metrics terakhir: done.
- Existing campaign dan post lama tetap dapat dibuka: preserved; no schema change.

## 2026-07-13: Phase 2 Asset and Publication Data Model

Scope:

- Database/data model foundation for social assets and manual publications.
- No renderer implementation.
- No AI prompt changes.
- No old migration edits.

Files inspected:

- `package.json`
- `src/types/social.ts`
- `src/app/cms/social/actions.ts`
- `src/components/social/social-tracker-dashboard.tsx`
- `supabase/migrations/20260510120000_create_social_tracker.sql`
- Existing Supabase migrations and storage policy usage.
- `docs/SOCIAL_DATA_MODEL.md`
- `docs/SOCIAL_ACCEPTANCE_CRITERIA.md`
- `docs/SOCIAL_IMPLEMENTATION_LOG.md`

Files changed:

- `supabase/migrations/20260713090000_add_social_assets_and_publications.sql`
- `src/types/social.ts`
- `src/app/cms/social/actions.ts`
- `src/components/social/social-tracker-dashboard.tsx`
- `docs/SOCIAL_DATA_MODEL.md`
- `docs/SOCIAL_ACCEPTANCE_CRITERIA.md`
- `docs/SOCIAL_IMPLEMENTATION_LOG.md`

Migrations created:

- `20260713090000_add_social_assets_and_publications.sql`

Feature work completed:

- Added additive `social_posts` columns for first comment, alt text, visual spec, selected template, aspect ratio, and UTM fields.
- Added aspect ratio constraint for `1:1`, `4:5`, and `9:16`.
- Added `social_assets` table with ownership, post/slide relation, dimensions, prompt metadata, status, and version checks.
- Added `social_publications` table for manual publication events and asset snapshots.
- Added indexes for asset and publication lookup.
- Added `updated_at` trigger on `social_assets`.
- Enabled RLS for both new tables and owner-only policies.
- Added public Supabase Storage bucket `social-assets`.
- Added storage policies for public reads and authenticated writes scoped to the user's first path folder.
- Updated social TypeScript types for assets, publications, aspect ratios, and new post fields.
- Updated social post validation schema and create/update payload normalization.
- Updated dashboard data loader to return active-campaign assets and publications.

Tests run:

- `npx tsc --noEmit --pretty false`: passed.
- `npm run lint`: failed before linting. Existing script runs `next lint`, and the installed Next CLI reports `Invalid project directory provided, no such directory: ...\nextjsCMS\lint`.
- `npm run build`: compiled successfully, then failed with `Error: spawn EPERM` during the post-compile build phase.
- No `test` script exists in `package.json`.

Remaining risks:

- Storage policy enforces the first folder as `user_id`; UI/upload code in a later phase must enforce the full `user_id/post_id/filename` convention.
- RLS ensures users manage only their own asset/publication rows; later write actions should also validate that referenced post or slide belongs to the same user.
- No renderer or upload UI exists in this phase by design.

Acceptance criteria status:

- Migration can run additively on existing database: designed with `ADD COLUMN IF NOT EXISTS` and `CREATE TABLE IF NOT EXISTS`.
- Existing posts are preserved through nullable/default fields: done.
- RLS owner policies added: done.
- TypeScript types updated: done.
- Dashboard data model updated: done.

## 2026-07-13 - Phase 3 Structured Visual Specification

### Files Inspected

- `src/lib/ai/schemas.ts`
- `src/lib/ai/operations.ts`
- `src/lib/ai/prompt-profiles.ts`
- `src/app/cms/social/actions.ts`
- `src/types/social.ts`
- `src/components/social/social-post-editor.tsx`
- `src/components/social/social-post-main-fields.tsx`
- `src/components/social/social-carousel-editor.tsx`
- `src/components/social/social-slide-editor.tsx`
- `supabase/migrations/20260510120000_create_social_tracker.sql`
- `supabase/migrations/20260713090000_add_social_assets_and_publications.sql`
- `package.json`

### Files Changed

- `src/lib/ai/schemas.ts`
- `src/lib/ai/operations.ts`
- `src/lib/ai/prompt-profiles.ts`
- `src/app/cms/social/actions.ts`
- `src/types/social.ts`
- `src/components/social/social-post-editor.tsx`
- `src/components/social/social-post-main-fields.tsx`
- `src/components/social/social-carousel-editor.tsx`
- `src/components/social/social-slide-editor.tsx`
- `src/components/social/social-visual-spec-editor.tsx`
- `docs/SOCIAL_DATA_MODEL.md`
- `docs/SOCIAL_RENDERER_SPEC.md`
- `docs/SOCIAL_ACCEPTANCE_CRITERIA.md`
- `docs/SOCIAL_IMPLEMENTATION_LOG.md`

### Migration Created

- `supabase/migrations/20260713100000_add_social_carousel_slide_visual_spec.sql`

Supabase CLI was not available in this Windows environment, so the migration file was created directly in the existing migrations folder.

### Completed

- Added `SocialVisualSpec` TypeScript type and Zod schema.
- Added validation limits for headline, subheadline, information blocks, block text, emphasis text, footer, and supported aspect ratios.
- Refactored Facebook weekly plan, post, carousel, and visual generation prompts to produce structured visual specs.
- Added operation normalizers so legacy `visual_prompt` is filled from `visual_spec.scene_prompt`.
- Persisted post-level `visual_spec`, `alt_text`, `selected_template_id`, and `aspect_ratio` from AI outputs.
- Persisted carousel slide `purpose` and `visual_spec` from AI outputs.
- Added `regenerateFacebookVisualSpecForPost` action for old posts.
- Added structured visual spec editor for post-level visual fields.
- Updated carousel slide editing for purpose and generated visual spec scene/headline fields.

### Risks Remaining

- Renderer and text overflow validation are still future phases.
- Existing carousel regeneration remains destructive and replaces prior slides.
- Zod validation rejects obvious text-in-image scene prompt instructions, but AI can still fail validation and require regenerate.
- Supabase migration was not executed locally because no Supabase CLI is installed.

## 2026-07-13 - Phase 4 Deterministic Social Renderer

### Files Inspected

- `package.json`
- `src/app/cms/social/actions.ts`
- `src/app/cms/media/actions.ts`
- `src/lib/supabase/server.ts`
- `src/app/globals.css`
- `docs/SOCIAL_RENDERER_SPEC.md`
- `supabase/migrations/20260713090000_add_social_assets_and_publications.sql`

### Files Changed

- `package.json`
- `src/app/cms/social/actions.ts`
- `docs/SOCIAL_RENDERER_SPEC.md`
- `docs/SOCIAL_ACCEPTANCE_CRITERIA.md`
- `docs/SOCIAL_DATA_MODEL.md`
- `docs/SOCIAL_IMPLEMENTATION_LOG.md`

### Files Added

- `src/lib/social/render/types.ts`
- `src/lib/social/render/dimensions.ts`
- `src/lib/social/render/template-registry.ts`
- `src/lib/social/render/text-validation.ts`
- `src/lib/social/render/render-social-asset.ts`
- `src/lib/social/render/templates/svg-utils.ts`
- `src/lib/social/render/templates/editorial-opinion-v1.tsx`
- `src/lib/social/render/templates/editorial-checklist-v1.tsx`
- `src/lib/social/render/templates/editorial-carousel-v1.tsx`
- `src/lib/social/render/__fixtures__/visual-spec.ts`
- `scripts/test-social-renderer.cjs`

### Migration Created

- None. Phase 4 uses existing `social_assets` and `social_posts.asset_done` from previous phases.

### Completed

- Implemented deterministic SVG renderer with existing `sharp` dependency.
- Added dimensions for `1:1`, `4:5`, and `9:16`.
- Added template registry with `editorial-opinion-v1`, `editorial-checklist-v1`, and `editorial-carousel-v1`.
- Added fallback mapping for legacy template ids such as `ar_block_left`, `ar_split_panel`, and `ar_carousel_series`.
- Added hard validation for missing visual spec, headline limit, unsupported aspect ratio, and too many information blocks.
- Added warning collection for near-overflow text conditions and background download failure.
- Added post, slide, and full carousel render server actions.
- Uploaded rendered PNGs to Supabase Storage bucket `social-assets` under `user_id/post_id` ownership paths.
- Inserted versioned `social_assets` rows without overwriting old versions.
- Added unit test runner and renderer fixtures.

### Tests Run

- `npx tsc --noEmit --pretty false` passed.
- `npm run test:social-renderer` passed, 8 tests.
- `npm run lint` failed because the existing script `next lint` is treated by Next 16 as project path `lint`.
- `npm run build` compiled successfully, then failed with existing Windows `spawn EPERM` environment error.

### Risks Remaining

- Supabase Storage upload actions require the deployed `social-assets` bucket and storage policies from Phase 2.
- No UI button calls the render actions yet; this is expected for Phase 4.
- SVG text measurement is approximate by design; template warnings catch risk but do not replace visual QA.
- Project has no bundled local font file; renderer uses the existing CSS typography stack and local/system fallback.

## 2026-07-13 - Phase 5 Social Visual Studio

Scope executed:

- Built Social Post Editor tabs: Content, Visual, Publish, Metrics.
- Moved caption editing fields into Content tab and kept combined caption read-only.
- Added Visual Studio for post-level visual spec editing, validation, preview, render, background upload, and asset history.
- Added background upload action using Supabase Storage bucket `social-assets` with user-owned folder paths.
- Added asset status action for `approved` and `archived` states.
- Added public social asset URL helper for thumbnails and downloads.
- Added carousel slide visual studio with per-slide visual spec editing, preview, background upload, render, and asset history.
- Updated batch carousel render to continue after per-slide failures and return ordered results.
- Reused Phase 4 deterministic renderer actions; no Meta API or autoposting was added.

Files changed:

- `src/app/cms/social/actions.ts`
- `src/components/social/social-post-editor.tsx`
- `src/components/social/social-post-main-fields.tsx`
- `src/components/social/social-post-editor-types.ts`
- `src/components/social/social-tracker-dashboard.tsx`
- `src/components/social/social-visual-spec-editor.tsx`
- `src/components/social/social-visual-studio.tsx`
- `src/components/social/social-visual-preview.tsx`
- `src/components/social/social-asset-history.tsx`
- `src/lib/social/social-asset-url.ts`
- `src/lib/social/render/render-social-asset.ts`
- `docs/SOCIAL_PRODUCT_SPEC.md`
- `docs/SOCIAL_DATA_MODEL.md`
- `docs/SOCIAL_RENDERER_SPEC.md`
- `docs/SOCIAL_ACCEPTANCE_CRITERIA.md`
- `docs/SOCIAL_IMPLEMENTATION_LOG.md`

Validation:

- `npx tsc --noEmit --pretty false` passed.
- `npm run test:social-renderer` passed.

Known risks:

- HTML preview is an approximation of SVG renderer output, though it uses the same dimensions, template registry, and validation helpers.
- Background upload metadata depends on `sharp` being available in the server runtime.
- Live Supabase Storage upload was not exercised against a real database in this local pass.

## 2026-07-13 - Phase 6 Facebook Publish Pack

Scope executed:

- Added shared publish pack helpers for caption with UTM and target URL building.
- Added server-side stored ZIP writer for carousel publish packs without adding dependencies.
- Added server actions for ownership-checked asset download, carousel ZIP download, and manual publication creation.
- Added server validation for manual publication requirements.
- Updated legacy `markPostPosted` and `updatePostStatus(..., posted)` paths so posted state must go through Publish Pack.
- Added Publish Pack UI inside the Publish tab.
- Added Publish Queue section for ready posts, filters, and missing requirement display.
- Updated weekly cards so the Facebook done button opens the editor instead of bypassing publication validation.
- Added tests for UTM URL building, caption with UTM, and ZIP signature generation.

Files changed:

- `src/app/cms/social/actions.ts`
- `src/components/social/social-publish-pack.tsx`
- `src/components/social/social-publish-queue.tsx`
- `src/components/social/social-post-editor.tsx`
- `src/components/social/social-post-editor-types.ts`
- `src/components/social/social-tracker-dashboard.tsx`
- `src/components/social/social-utils.ts`
- `src/components/social/social-weekly-post-card.tsx`
- `src/lib/social/publish-pack.ts`
- `src/lib/social/zip.ts`
- `scripts/test-social-renderer.cjs`
- Social documentation files

Validation:

- `npx tsc --noEmit --pretty false` passed.
- `npm run test:social-renderer` passed with 11 tests.

Known risks:

- Carousel ZIP is returned through a Server Action as base64; very large carousels may need a streamed route handler later.
- Live Supabase Storage download and publication insert were not executed against a live browser session in this pass.

## 2026-07-13 - Phase 7 Strategy Engine and Content Molecule

Scope executed:

- Added Strategy Engine presets and shared derivative post type definitions.
- Added Content Molecule helper for title similarity warnings and notes snapshots.
- Added AI schema, operation, and prompt builder for `generateFacebookContentMap`.
- Added server action to generate a content map without creating posts.
- Added server action to create only selected content map items as `social_posts`.
- Added UI panel for preset selection, multi-source selection, desired count, date range, editor notes, content map review, item selection, item editing, similarity warnings, and selected-post creation.
- Kept Classic Weekly Plan as the existing Generate 7-Day Plan workflow.
- Added additive migration to widen `social_posts.post_type` check constraint for derivative types.
- Added unit coverage for strategy presets and content map title similarity.

Files changed:

- `src/app/cms/social/actions.ts`
- `src/components/social/social-strategy-engine-panel.tsx`
- `src/components/social/social-tracker-dashboard.tsx`
- `src/lib/ai/schemas.ts`
- `src/lib/ai/operations.ts`
- `src/lib/ai/prompt-profiles.ts`
- `src/lib/social/content-map.ts`
- `src/lib/social/strategy-presets.ts`
- `src/types/social.ts`
- `scripts/test-social-renderer.cjs`
- Social documentation files

Migration created:

- `supabase/migrations/20260713120000_extend_social_post_derivative_types.sql`

Validation:

- `npx tsc --noEmit --pretty false` passed during implementation.

Known risks:

- Content maps are transient UI state by design; closing or refreshing before Create Selected Posts discards the generated map.
- Similarity uses token overlap, not semantic embeddings, so warnings are conservative and editorial review remains required.
- Selected content molecules create planned posts with molecule notes, but full post draft and visual spec generation remain separate downstream steps.

## 2026-07-13 - Phase 8 Hook Lab and Content Variants

Scope executed:

- Added `social_post_variants` migration with RLS, owner policy, indexes, updated_at trigger, and unique selected variant per post/type.
- Added TypeScript types for variant types, heuristic scores, and variant rows.
- Added AI schema, operation, and prompt builder for `generateFacebookVariants`.
- Added variant helper utilities for readability stats and heuristic score normalization.
- Added dashboard loading for active-campaign variants.
- Added server actions for variant generation, variant editing, and selecting/applying a winner.
- Added Hook Lab UI in the Content tab.
- Added side-by-side variant comparison with editable label/content, length, readability density, heuristic editorial scores, and history.
- Added tests for variant helper behavior and AI variant schema parsing.

Files changed:

- `supabase/migrations/20260713130000_create_social_post_variants.sql`
- `src/types/social.ts`
- `src/lib/social/variants.ts`
- `src/lib/ai/schemas.ts`
- `src/lib/ai/operations.ts`
- `src/lib/ai/prompt-profiles.ts`
- `src/app/cms/social/actions.ts`
- `src/components/social/social-hook-lab.tsx`
- `src/components/social/social-post-editor.tsx`
- `src/components/social/social-post-editor-types.ts`
- `src/components/social/social-tracker-dashboard.tsx`
- `scripts/test-social-renderer.cjs`
- Social documentation files

Migration created:

- `20260713130000_create_social_post_variants.sql`

Validation:

- `npx tsc --noEmit --pretty false` passed during implementation.
- `npm run test:social-renderer` passed with 15 tests.

Known risks:

- Variant selection uses a safe server-action sequence plus a unique partial index, not a database transaction wrapper.
- Headline variants create a minimal visual spec if a post has no `visual_spec` yet.
- Visual direction variants update `visual_prompt`; deeper structured visual spec regeneration remains a separate workflow.
- Heuristic scores are editorial guidance only and intentionally disconnected from analytics.

## Phase 9 - Analytics Dashboard

Date: 2026-07-13

Scope completed:

- Added migration `20260713140000_extend_social_post_metrics_analytics.sql` for additional manual analytics fields.
- Extended `SocialPostMetric` TypeScript type and dashboard payload with analytics-specific datasets.
- Updated `recordPostMetrics()` validation and insert payload for reactions, video views, average watch time, followers gained, metric window hours, and metric source.
- Added `src/lib/social/analytics.ts` for safe rate calculations, total KPI aggregation, and rate formatting.
- Added `SocialAnalyticsDashboard` with filters, KPI cards, top posts, grouped performance tables, recent unreviewed metrics, small-sample warning, and CSV export.
- Extended `SocialMetricsPanel` with additional inputs, metrics history, per-post rates, publication snapshot, notes, and next action.
- Added analytics unit coverage to `scripts/test-social-renderer.cjs`.

Validation:

- `npx tsc --noEmit --pretty false` passed.
- `npm run test:social-renderer` passed with 16 tests.

Risks:

- Supabase CLI is not installed in this workspace, so the migration was written as a committed SQL file and not applied locally.
- Dashboard charts use responsive HTML tables and CSS bars because no chart library exists in the project dependencies.

## 2026-07-13 - Phase 10 Performance Learning Engine

Scope executed:

- Added `social_learnings` migration with RLS, owner policy, indexes, status/confidence/scope constraints, and updated_at trigger.
- Added TypeScript types for learning scope, confidence, status, and dashboard data.
- Added AI schemas, prompt builder, operation, and output normalization for `generateSocialPerformanceReview`.
- Added server action to generate campaign retrospectives from owned campaign data, publication snapshots, metrics, variants, and templates.
- Added server action to approve, reject, or archive proposed learnings.
- Added relevance helper for retrieving at most 8 approved learnings for future AI calls.
- Integrated approved learning context into weekly plan, content map, post draft, carousel draft, and variant generation.
- Added Social Learning Engine UI with Campaign Retrospective, proposed learnings, approved learnings, evidence links, and status actions.
- Added schema tests for retrospective output and approved learning prompt context.

Files changed:

- `supabase/migrations/20260713150000_create_social_learnings.sql`
- `src/types/social.ts`
- `src/lib/ai/schemas.ts`
- `src/lib/ai/operations.ts`
- `src/lib/ai/prompt-profiles.ts`
- `src/app/cms/social/actions.ts`
- `src/components/social/social-learning-engine.tsx`
- `src/components/social/social-tracker-dashboard.tsx`
- `scripts/test-social-renderer.cjs`
- Social documentation files

Validation:

- `npx tsc --noEmit --pretty false` passed.
- `npm run test:social-renderer` passed with 18 tests.
- `git diff --check` passed; only CRLF conversion warnings were reported.
- `npm run lint` failed before linting because the existing `next lint` script is not supported by the installed Next 16 CLI and is interpreted as project path `lint`.
- `npx eslint ...` failed because the repo has no `eslint.config.(js|mjs|cjs)` for ESLint 9.
- `npm run build` compiled successfully, then failed with the existing Windows `spawn EPERM` environment error.
- `supabase --version` failed because Supabase CLI is not installed in this environment.

Known risks:

- Supabase CLI is not installed in this workspace, so the migration was written as SQL and not applied locally.
- Retrospective quality depends on manual metrics completeness.
- `scope_id` is only populated for campaign-scoped learnings; text-scoped categories use title/observation matching for relevance.
- Campaign retrospective summary is appended to `social_campaigns.tone_note` because no dedicated campaign notes column exists yet.

## 2026-07-13 - Phase 11 CSV Import and Screenshot Metrics

Scope executed:

- Added additive migration `20260713160000_add_social_metric_ingestion.sql`.
- Added `metadata` to `social_post_metrics`.
- Added `social_metric_imports` with owner-only RLS, source/status constraints, indexes, row counts, error summary, and metadata.
- Added CSV parser and matching helper in `src/lib/social/metric-ingestion.ts`.
- Added CSV mapping UI with flexible column mapping and max 20-row preview.
- Added exact Facebook URL matching and normalized title/date fallback matching.
- Required explicit row confirmation before saving CSV metrics.
- Prevented ambiguous rows from saving automatically.
- Added screenshot extraction UI with draft review and confirmation.
- Added optional OpenRouter vision abstraction using `OPENROUTER_VISION_MODEL`.
- Validated screenshot MIME type and size, used temporary user-owned storage path, and removed temporary file after extraction.
- Saved confirmed screenshot metrics with `source = 'screenshot'`, extraction metadata, and confidence.
- Added tests for CSV parsing, exact URL matching, and ambiguous matching.

Files changed:

- `supabase/migrations/20260713160000_add_social_metric_ingestion.sql`
- `src/app/cms/social/actions.ts`
- `src/components/social/social-metric-ingestion-panel.tsx`
- `src/components/social/social-tracker-dashboard.tsx`
- `src/components/social/social-post-editor-types.ts`
- `src/lib/ai/social-metrics-vision.ts`
- `src/lib/social/metric-ingestion.ts`
- `src/types/social.ts`
- `scripts/test-social-renderer.cjs`
- Social documentation files

Validation:

- `npx tsc --noEmit --pretty false` passed.
- `npm run test:social-renderer` passed with 21 tests.
- `git diff --check` passed; only CRLF conversion warnings were reported.
- `npm run lint` failed before linting because the existing `next lint` script is not supported by the installed Next 16 CLI and is interpreted as project path `lint`.
- `npx eslint ...` failed because the repo has no `eslint.config.(js|mjs|cjs)` for ESLint 9.
- `npm run build` compiled successfully, then failed with the existing Windows `spawn EPERM` environment error.
- `supabase --version` failed because Supabase CLI is not installed in this environment.

Known risks:

- Vision extraction is inactive until `OPENROUTER_VISION_MODEL` is configured.
- Screenshot AI extraction quality depends on screenshot clarity and provider capability; user confirmation remains mandatory.
- Supabase CLI is not installed in this workspace, so the migration was written as SQL and not applied locally.

## 2026-07-13 - Phase 12 Hardening, QA, and Final Refactor

Scope executed:

- No new product feature was added.
- Reviewed Social Content OS scope: social page/actions, social components, social renderer helpers, social AI schemas/operations/prompts, migrations, storage policies, and docs.
- Fixed lint tooling for Next 16/ESLint 9 by adding flat config and scoping `npm run lint` to Social Content OS files.
- Added ownership hardening before carousel slide creation and metrics insertion.
- Added ZIP entry name sanitization to avoid traversal-style names in generated publish packs.
- Added minimal additional tests for campaign AI input bounds, post AI input defaults, and ZIP entry sanitization.
- Preserved `visual_prompt` and all legacy checklist fields.

Files inspected:

- `package.json`
- `.eslintrc.json`
- `next.config.ts`
- `src/app/cms/social/page.tsx`
- `src/app/cms/social/actions.ts`
- `src/components/social/*`
- `src/lib/social/*`
- `src/lib/social/render/*`
- `src/lib/ai/schemas.ts`
- `src/lib/ai/operations.ts`
- `src/lib/ai/prompt-profiles.ts`
- `src/types/social.ts`
- `scripts/test-social-renderer.cjs`
- `supabase/migrations/*social*.sql`
- `docs/SOCIAL_PRODUCT_SPEC.md`
- `docs/SOCIAL_DATA_MODEL.md`
- `docs/SOCIAL_RENDERER_SPEC.md`
- `docs/SOCIAL_ACCEPTANCE_CRITERIA.md`
- `docs/SOCIAL_IMPLEMENTATION_LOG.md`

Files changed:

- `package.json`
- `eslint.config.mjs`
- `src/app/cms/social/actions.ts`
- `src/components/social/social-strategy-engine-panel.tsx`
- `src/lib/social/zip.ts`
- `scripts/test-social-renderer.cjs`
- `docs/SOCIAL_PRODUCT_SPEC.md`
- `docs/SOCIAL_DATA_MODEL.md`
- `docs/SOCIAL_RENDERER_SPEC.md`
- `docs/SOCIAL_ACCEPTANCE_CRITERIA.md`
- `docs/SOCIAL_IMPLEMENTATION_LOG.md`
- `docs/SOCIAL_FINAL_GAP_REPORT.md`

Migration created:

- None.

Technical decisions:

- Kept final lint scope to Social Content OS files to avoid unrelated legacy CMS lint refactors.
- Disabled React Compiler lint rules `react-hooks/error-boundaries` and `react-hooks/set-state-in-effect` in flat config because they were newly surfaced by ESLint 9/Next 16 and would require broad UI refactors outside this phase.
- Kept public social asset preview `<img>` usage for storage URLs as non-blocking debt rather than changing image loading behavior.
- Kept deterministic renderer on existing `sharp`; no browser automation or new render dependency added.

Dependency changes:

- No new dependency added in Phase 12.
- Existing `sharp` remains the renderer rasterization dependency.

Validation:

- `npm run lint`: passed for Social Content OS scope, with 2 non-blocking `<img>` warnings.
- `npx tsc --noEmit --pretty false`: passed.
- `npm run test:social-renderer`: passed, 24 tests.
- `npm run build`: first sandbox run compiled then failed with Windows `spawn EPERM`; escalated rerun passed.
- `supabase --version`: failed because Supabase CLI is not installed.
- Static checks found no `localStorage` in social scope.
- Static checks found no Node-only renderer dependency imported by social client components.
- Static migration review confirmed owner RLS and storage policies exist for social tables and `social-assets` bucket.

Technical debt remaining:

- Supabase migrations were not applied/reset locally because the Supabase CLI is missing.
- Social asset preview components still use `<img>` and produce lint warnings.
- Large carousel publish ZIPs may need streamed route handling later.
- SVG text measurement remains approximate and should keep fixture coverage as templates evolve.
- Vision screenshot extraction remains provider-optional and depends on `OPENROUTER_VISION_MODEL`.
- Full browser/mobile QA was not run in Phase 12; build and static checks passed.

Features intentionally not built:

- Meta API integration.
- Facebook autoposting.
- CSV import auto-save for ambiguous rows.
- Screenshot metrics auto-confirmation.
- Live performance prediction from heuristic scores.
- Automatic causal claims from analytics.

Future integration:

- Meta API/autopost can be added later as a separate integration behind explicit permissions, token storage, retry handling, and publication audit logs. It is intentionally outside the Social Content OS manual-publishing release.