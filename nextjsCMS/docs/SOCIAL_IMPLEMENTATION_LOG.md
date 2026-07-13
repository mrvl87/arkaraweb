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
