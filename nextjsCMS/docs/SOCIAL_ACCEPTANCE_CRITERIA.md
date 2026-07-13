# Social Content OS Acceptance Criteria

Last updated: 2026-07-13

## Phase 0: Audit and Product Spec

Status: complete when documentation exists and no application behavior changes.

Acceptance criteria:

- Existing Social Tracker campaign flow is documented.
- Existing social post flow is documented.
- Existing weekly plan generator is documented.
- Existing caption generator is documented.
- Existing carousel generator is documented.
- Existing visual prompt generator is documented.
- Checklist, copy, asset, posted, and metrics behavior is documented.
- LocalStorage duplication is identified.
- Existing server actions not fully used by UI are identified.
- Renderer dependency decision is documented.
- Existing storage pattern is documented.
- Existing RLS and user ownership pattern is documented.
- Backward compatibility risks are documented.
- No code behavior is changed.
- No database migration is created.

## Phase 1: Existing Social Tracker Stabilization

Acceptance criteria:

- Copied status no longer uses localStorage as source of truth.
- Facebook posted status no longer uses localStorage as source of truth.
- Weekly post cards read copied, posted, reviewed, and metrics state from database-backed fields.
- Optimistic UI is allowed, but successful server action refreshes server data.
- Hook, body, and CTA are edited separately.
- Combined caption preview is read-only and uses `buildCaption()`.
- Editing preview can no longer erase hook or CTA.
- Editor exposes Copy Caption, Mark Ready, Mark Posted, and Mark Reviewed actions.
- Metrics can be entered from UI with reach, comments, shares, link clicks, notes, and next action.
- Saving metrics sets `metrics_done = true` and `status = reviewed` through existing server action.
- Reviewed posts show the latest metrics in the UI.
- Existing campaigns and old posts remain readable.
- No schema migration is required.
- AI prompts are unchanged.
- Documentation and implementation log are updated.
- Typecheck passes.

## Phase 2: Asset and Publication Data Model

Acceptance criteria:

- New migration is additive and does not edit old migrations.
- `social_posts` has first comment, alt text, visual spec, template, aspect ratio, and UTM fields.
- Existing posts remain compatible through nullable fields and defaults.
- `social_assets` stores background, poster, carousel slide, reel cover, and thumbnail assets.
- `social_publications` records manual publication events.
- `social-assets` storage bucket exists and is public-read.
- Storage object writes are limited to the authenticated user's own `user_id` folder.
- RLS limits social assets and publications to rows owned by the authenticated user.
- TypeScript social types match the new schema.
- `getSocialDashboardData()` returns assets and publications for the active campaign.
- Dashboard still typechecks.
## Phase 3: Draft and Publish Copy

Acceptance criteria:

- User can generate or edit caption draft from strategy.
- Caption remains copy-ready for manual Facebook publishing.
- Existing post fields are preserved.
- Existing `copyPostCaptionMark()` or replacement DB-backed action records copy state.
- LocalStorage copy state no longer becomes the source of truth.
- Backward compatibility path for previous localStorage state is handled.

## Phase 4: Visual Specification

Acceptance criteria:

- AI returns structured visual specification, not final text-in-image instructions.
- Visual spec includes aspect ratio, template key, scene prompt, background prompt, text blocks, safe zone, and footer.
- Existing legacy `visual_prompt` is preserved.
- UI can display legacy prompt and structured spec separately.
- AI prompt docs are updated to enforce no text in background image.

## Phase 5: Background Image

Acceptance criteria:

- User can generate or upload a text-free background image.
- Background generation prompt explicitly forbids text, labels, signage, and watermark.
- Generated assets use existing R2/media pattern or documented replacement.
- Background asset is associated with `user_id` and social post or slide.
- Existing media library remains compatible.

## Phase 6: Deterministic Poster Render

Acceptance criteria:

- CMS renders poster text deterministically.
- Renderer supports 1:1, 4:5, and 9:16.
- Renderer validates text overflow before marking render publishable.
- Every template defines safe zones.
- Arkara footer is rendered by CMS.
- Rendered asset is stored and linked to the post or slide.
- Render does not require Meta API.

## Phase 7: Publish Pack and Manual Publishing

Acceptance criteria:

- Publish pack includes caption, poster assets, target URL, alt text, notes, and checklist state.
- User can copy caption and mark copied in database.
- User can mark post as manually posted in database.
- User can enter Facebook permalink manually.
- Existing `posted_done` and `copied_done` are kept compatible.
- No autoposting is implemented.

## Phase 8: Metrics

Acceptance criteria:

- User can record manual metrics for a posted item.
- Existing reach, comments, shares, and link clicks remain supported.
- Metrics save updates `metrics_done`.
- Metrics UI is scoped to the active campaign and owned user data.
- Documentation explains metric fields and limitations.

## Phase 9: Performance Learning

Acceptance criteria:

- System can summarize performance by campaign, pillar, post type, template, and publish window.
- Recommendations are based on owned metrics.
- Learning output cites the metric fields used.
- No external Meta API dependency is required.
- AI suggestions remain reviewable before becoming strategy or draft changes.
