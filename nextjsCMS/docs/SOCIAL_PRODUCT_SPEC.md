# Social Content OS Product Spec

Last updated: 2026-07-13

## Scope

This document records phase 0 audit findings and the target product shape for the CMS social module. Phase 0 does not change application behavior.

Primary module:

- `src/app/cms/social`
- `src/components/social`
- `src/types/social.ts`
- `src/lib/ai/schemas.ts`
- `src/lib/ai/operations.ts`
- `src/lib/ai/prompt-profiles.ts`
- `supabase/migrations/20260510120000_create_social_tracker.sql`

Out of scope:

- Meta API integration
- Autoposting
- Public frontend renderer changes
- Existing Social Tracker behavior changes during phase 0

## Current Product State

The current Social Tracker is a manual Facebook planning tool. It supports campaign setup, weekly post planning, post editing, caption copying, visual prompt copying, carousel slide generation, manual posted tracking, database-backed copy/posted state, and manual metrics entry.

The current UI name is "Social Tracker". The target product is "Social Content OS", but the name should not be changed until a later phase explicitly changes behavior and navigation.

## Current Campaign Flow

1. `/cms/social` loads dashboard data through `getSocialDashboardData()`.
2. The server action requires an authenticated Supabase user.
3. It loads campaigns owned by `user_id`.
4. It chooses the selected campaign from the `campaign` query parameter, otherwise the first non-archived campaign, otherwise the first campaign.
5. The client dashboard lets the user create, edit, delete, and switch campaigns.
6. A campaign has title, theme, platform, start/end date, goal, pillar, tone note, and status.
7. Campaign settings currently expose only period, title, and status in the UI. Theme, goal, pillar, and tone note are stored but not fully editable in the visible settings panel.

## Current Social Post Flow

1. A post belongs to a campaign and `user_id`.
2. A user can add a manual post through the dashboard.
3. The editor stores title, caption parts, target URL, source, schedule, status, visual prompt, objective, pillar, checklist booleans, and notes.
4. Hook, body, and CTA are edited separately.
5. `buildCaption()` joins hook, body, CTA, and target URL into a read-only combined preview.
6. Copy buttons write the built caption or prompt to the clipboard and persist copy state when a post exists.
7. The editor can call AI actions for caption and visual prompt when the post already exists.
8. Ready and posted states are validated by server action before save/status change.

## Current Weekly Plan Generator

Action: `generateWeeklyFacebookPlan(campaignId, sourceKey)`

AI operation: `generateFacebookWeeklyPlan()`

Output:

- Exactly 7 posts.
- Day/date/time.
- Post type.
- Title, hook, body, CTA.
- Objective and content pillar.
- Visual prompt.
- Optional carousel slides.

Persistence:

- Inserts generated posts into `social_posts`.
- Inserts carousel slides into `social_carousel_slides`.
- Sets campaign status to `in_progress`.
- Marks caption, CTA, and visual prompt checklist items based on generated values.

Current issue for target architecture:

- The prompt asks AI to place primary information as text inside image prompts.
- Target architecture must move text rendering responsibility to CMS.

## Current Caption Generator

Action: `generateFacebookPostDraft(postId)`

AI operation: `generateFacebookPost()`

Output:

- Title.
- Hook.
- Body.
- CTA.
- Visual prompt.

Persistence:

- Updates `social_posts`.
- Sets status to `drafting`.
- Marks caption, CTA, and visual prompt as done.

## Current Carousel Generator

Action: `generateFacebookCarouselSlides(postId)`

AI operation: `generateFacebookCarousel()`

Output:

- 3 to 10 slides.
- Slide purpose.
- Title text.
- Paragraph text.
- Visual prompt.

Persistence:

- Deletes existing slides for that post and user.
- Inserts new slides.
- Sets `visual_prompt_done` and status `drafting` on the post.

Backward compatibility risk:

- Existing carousel data is destructive on regenerate. Future phases should keep this behavior until a replacement versioning flow exists.

## Current Visual Prompt Generator

Action: `generateFacebookVisualPromptForPost(postId)`

AI operation: `generateFacebookVisualPrompt()`

Output:

- One text-to-image prompt string.

Current prompt behavior:

- It asks the image model to include exact Indonesian text in the generated image.
- It asks for Arkara footer text inside the image.

Target behavior:

- AI creates scene prompt and structured visual specification only.
- CMS renders text, layout, footer, and safe-zone constrained typography deterministically.

## Current Checklist and Metrics Flow

Checklist fields on `social_posts`:

- `caption_done`
- `cta_done`
- `visual_prompt_done`
- `asset_done`
- `copied_done`
- `posted_done`
- `metrics_done`

Server actions already available:

- `togglePostChecklistItem(id, key, value)`
- `copyPostCaptionMark(id)`
- `markPostPosted(id)`
- `updatePostStatus(id, status)`
- `recordPostMetrics(input)`

Phase 1 UI usage:

- Weekly card copy state uses `copyPostCaptionMark()` and `copied_done`.
- Weekly card Facebook done state uses `markPostPosted()`, `posted_done`, and `status`.
- Ready, posted, and reviewed buttons use existing status server actions.
- Metrics entry is available in the post editor and uses `recordPostMetrics()`.

Metrics fields:

- Reach.
- Comments.
- Shares.
- Link clicks.
- Notes.
- Next action.

## Publishing State Stabilization

Phase 1 removed `localStorage` as the source of truth for copied and posted state inside the Social Tracker UI.

Database-backed state now drives weekly cards and editor workflow:

- `copied_done` is set through `copyPostCaptionMark()` after a caption copy.
- `posted_done` and `status = posted` are set through `markPostPosted()` after manual Facebook posting.
- Ready, posted, and reviewed status changes use `updatePostStatus()` through explicit buttons.
- Manual checklist toggles use `togglePostChecklistItem()` for non-status checklist items.
- Metrics save uses `recordPostMetrics()`, then sets `metrics_done = true` and `status = reviewed`.

Checklist fields remain in place. `status` is the workflow state, while checklist fields remain operational flags for copy, posted, asset, visual prompt, and metrics readiness.

## Target Product Flow

The target Social Content OS flow is:

1. Idea
   - Capture content opportunity, source, audience, risk, and goal.
   - Can come from manual entry, existing post, existing panduan, or future SEO/keyword signals.

2. Strategy
   - Convert idea into objective, pillar, platform assumptions, format, CTA direction, and publishing window.
   - Campaign remains the container for weekly or thematic strategy.

3. Draft
   - Generate or edit caption, hook, body, CTA, and carousel text.
   - Caption is the manual publishing copy.

4. Visual Specification
   - Generate structured layout data, text blocks, scene brief, background prompt, aspect ratio, template, and validation constraints.
   - AI must not be responsible for final text placement in pixels.

5. Background Image
   - Generate or upload a text-free background image.
   - Store it through the existing media/R2 pipeline where practical.

6. Poster Render
   - CMS renders text deterministically over the selected/generated background.
   - Supports 1:1, 4:5, and 9:16.
   - Validates safe zones and overflow.

7. Publish Pack
   - Groups caption, poster files, alt text, target URL, manual checklist, and publishing notes.
   - Must be copy/download ready.

8. Manual Publishing
   - User manually posts to Facebook.
   - CMS records copy, posted state, publish timestamp, and manual URL/permalink if entered.

9. Metrics
   - User records reach, comments, shares, link clicks, saves/reactions if added later, notes, and next action.

10. Learning
   - CMS summarizes performance by post type, pillar, hook pattern, visual template, and time window.
   - Future AI suggestions must be grounded in owned metrics.

## Dependency Decision

Use the existing `sharp` dependency for phase 1 renderer implementation planning.

Recommended renderer architecture:

- Build deterministic SVG markup in server code.
- Convert SVG to PNG/WebP with `sharp`.
- Store final raster output through the existing R2/media pattern.

Reason:

- `sharp` is already installed.
- Existing image pipeline already uses `sharp`.
- SVG text measurement can be approximated and validated by template rules before rasterization.
- No browser automation or canvas dependency is required for the first production slice.

Optional later dependency:

- Add a dedicated text/layout renderer only if SVG + `sharp` cannot satisfy text wrapping and validation needs.

## Backward Compatibility Rules

- Existing `social_campaigns`, `social_posts`, `social_carousel_slides`, and `social_post_metrics` must remain readable.
- Existing `visual_prompt` text must not be deleted.
- Existing checklist booleans must keep meaning until replacement fields are fully wired.
- New planned fields/tables should be additive.
- Existing `post_type`, `status`, and `image_status` enums should not be narrowed.
- Legacy localStorage state is no longer the source of truth for copied or posted status.
- Existing AI generation logs must remain compatible with current operation names.

## Phase 3 Product Behavior

Visual generation now produces a structured visual specification. Editors can adjust headline, subheadline, information blocks, emphasis text, footer, alt text, and scene prompt separately. AI-generated background prompts are treated as background-only scene prompts; CMS rendering remains responsible for all visible Indonesian copy in future renderer phases.

## Phase 4 Product Behavior

Social posts and carousel slides can now be rendered into deterministic PNG assets from `visual_spec`. The renderer is server-side, versioned, and manual-action ready. It does not publish to Meta and does not require browser automation. UI controls for triggering these actions are reserved for a later phase.

## Phase 5 Product Behavior

Social Post Editor is now organized into tabs: Content, Visual, Publish, and Metrics.

Visual Studio behavior:

- Content tab owns internal title, hook, body, CTA, target URL, first comment, alt text, and read-only combined caption preview.
- Visual tab owns template selection, aspect ratio, scene prompt, structured copy fields, background upload, preview, render, and asset history.
- Publish tab keeps the existing manual copy/checklist/status workflow until the Publish Pack phase.
- Metrics tab keeps the existing metrics entry workflow.
- Carousel posts expose slide-level visual tabs inside the Visual tab so each slide can have its own visual spec, background, render, and asset history.
- Visual changes are stored in `visual_spec`, `selected_template_id`, `aspect_ratio`, `visual_prompt`, and `alt_text` without regenerating AI output.

Background uploads are user-owned `social_assets` rows with `asset_type = 'background'`. Render actions can use a selected background version while preserving old generated poster versions.

## Phase 6 Product Behavior

Facebook Publish Pack now consolidates manual publishing materials inside the Publish tab.

Publish Pack includes:

- Final caption built from hook, body, CTA, and target URL with UTM parameters.
- First comment.
- Alt text.
- Target URL with preserved existing query parameters and `utm_source`, `utm_medium`, `utm_campaign`.
- Approved final poster or approved carousel slide assets.
- Manual schedule, objective, content pillar, post type, and status context.
- Manual publishing session fields for published time, Facebook URL, and notes.
- Publication history from `social_publications`.

Manual publishing remains human-operated:

1. Copy caption and optional first comment.
2. Download poster or ordered carousel ZIP.
3. Open Facebook manually.
4. Publish outside CMS.
5. Return to CMS.
6. Save Facebook URL, published time, and notes.
7. CMS creates a `social_publications` snapshot and marks the post as posted.

No Meta API, access token, or fake autopost behavior is implemented.

A Publish Queue section now shows ready posts for the active campaign, with filters for campaign, post type, and date. Queue rows show missing requirements such as caption, target URL, approved poster, or approved carousel slide assets.

## Phase 7 Product Behavior

Social Strategy Engine adds a pre-production Content Molecule workflow before posts are created.

Strategy presets:

- Balanced Week
- Traffic Sprint
- Engagement Week
- Evergreen Education
- Breaking Issue Response
- Campaign Launch
- Article Amplification
- Community Discussion
- Classic Weekly Plan

Classic Weekly Plan keeps the existing Generate 7-Day Plan behavior. Other presets generate a content map first and do not force a Monday-Sunday post type sequence.

Content Molecule workflow:

1. User selects an active campaign.
2. User selects a strategy preset.
3. User selects one or more source articles or panduan.
4. User chooses 3 to 12 content ideas.
5. AI generates a content map with strategy summary, audience hypothesis, central narrative, proposed content items, and item relationships.
6. Generated ideas are held in UI state only.
7. User selects/unselects items and edits title, angle, type, and order.
8. Create Selected Posts inserts only selected items into `social_posts`.

Deduplication:

- Proposed titles are compared with the user's social posts from the last 90 days.
- Similar titles show warnings in the content map UI.
- Warnings do not block creation because a similar title can still have a different editorial angle.
