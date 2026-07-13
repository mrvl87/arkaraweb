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

## Phase 3 - Structured Visual Specification

Acceptance criteria:

- AI social visual generation outputs validated `visual_spec` objects.
- `scene_prompt` describes only background illustration and is not used for text-in-image instructions.
- `visual_prompt` is preserved as legacy fallback and stores the safe scene prompt.
- `social_posts.visual_spec` is saved for weekly plan, post draft generation, and regenerate visual spec actions.
- `social_carousel_slides.visual_spec` and `purpose` are available through additive migration.
- Generated carousel slides preserve `purpose`, `title_text`, `paragraph_text`, `visual_prompt`, and `visual_spec`.
- Old posts and slides with null `visual_spec` remain editable.
- Editor can edit structured post headline, subheadline, information blocks, emphasis text, footer, alt text, and scene prompt without regenerating the scene.
- Renderer is still future scope; no poster image generation is added in this phase.

## Phase 4 - Deterministic Social Renderer

Acceptance criteria:

- Post render action can produce a PNG buffer and upload it as a `poster` asset.
- Carousel slide render action can produce PNG per slide and upload it as a `carousel_slide` asset.
- Batch carousel render action renders all slides and marks the post asset checklist complete.
- Renderer works without a background image using deterministic fallback backgrounds.
- Background image, when present as latest ready/approved `background` asset, is loaded from Supabase Storage and placed behind CMS-rendered text.
- Footer and headline are rendered by CMS templates, not by the image model.
- Asset versions increment and old files are not overwritten.
- Storage path begins with `user_id/post_id`.
- Unit tests cover dimensions, missing visual spec, long headline, too many blocks, aspect ratios, registry, version increment, and storage ownership path.

## Phase 5 - Social Visual Studio

Acceptance criteria:

- Social Post Editor is split into Content, Visual, Publish, and Metrics tabs.
- Headline can be edited in `visual_spec` without regenerating the image prompt.
- User can choose `editorial-opinion-v1`, `editorial-checklist-v1`, or `editorial-carousel-v1`.
- User can change aspect ratio between `1:1`, `4:5`, and `9:16`.
- User can edit scene prompt, label, headline, subheadline, information blocks, emphasis text, footer, and alt text.
- Information blocks support add, remove, and reorder.
- Live validation displays template and overflow warnings.
- Background PNG, JPG, and WebP files can be uploaded to `social-assets` as user-owned background assets.
- User can select a background version for preview and render.
- User can render final poster PNG from the UI.
- Generated asset history displays versions and provides download, approve, and archive controls.
- Carousel Visual tab supports per-slide visual spec, preview, background upload, render, and asset history.
- Batch carousel render continues after slide-level errors and reports per-slide result.
- Existing Publish and Metrics workflows remain available and database-backed.

## Phase 6 - Facebook Publish Pack

Acceptance criteria:

- Publish tab shows schedule, timezone, objective, content pillar, final caption, first comment, alt text, target URL with UTM, final poster or carousel slide assets, and checklist state.
- User can copy caption, first comment, link, and alt text from one place.
- User can download a poster through an ownership-checked server action.
- User can download carousel assets as an ordered ZIP with `publish-notes.txt`.
- User can open Facebook manually; no Meta API or token is requested.
- Manual Mark as Posted creates a `social_publications` record.
- Publication stores caption, first comment, and asset id snapshots.
- Later caption edits do not change existing publication history.
- Mark as Posted is blocked without caption.
- `article_link` Mark as Posted is blocked without target URL.
- Non-carousel Mark as Posted is blocked without an approved poster.
- Carousel Mark as Posted is blocked if any slide lacks an approved asset.
- Facebook URL may be empty, but the UI warns before save.
- Publish Queue shows only ready posts for the active campaign and displays missing requirements.

## Phase 7 - Strategy Engine and Content Molecule

Acceptance criteria:

- Strategy presets exist for balanced week, traffic sprint, engagement week, evergreen education, breaking issue response, campaign launch, article amplification, community discussion, and classic weekly.
- Classic Weekly Plan keeps the existing Generate 7-Day Plan workflow.
- Non-classic strategy generation produces a content map before any post is created.
- Content map output includes strategy summary, audience hypothesis, central narrative, proposed content items, and relationships between items.
- User can select or unselect proposed content items before creation.
- User can edit proposed title, angle, post type, and publishing order before creation.
- Create Selected Posts inserts only selected items into `social_posts`.
- Content derivative post types include editorial poster, checklist, carousel, myth vs fact, scenario, question, poll, opinion, article link, short video, recap, and quote statement.
- Similar proposed titles from the last 90 days show warnings without blocking creation.
- Weekly planning does not force day-based post types except for Classic Weekly Plan.
- Documentation and implementation log are updated.

## Phase 8 - Hook Lab and Content Variants

Acceptance criteria:

- Migration creates `social_post_variants` with indexes, RLS, owner policy, and updated_at trigger.
- Supported variant types are hook, headline, caption, CTA, first comment, and visual direction.
- AI operation `generateFacebookVariants` exists.
- Five hook variants can be generated by default.
- Hook generation can cover direct consequence, question, scenario, concrete number, and contrarian statement directions.
- UI can generate variants for a saved post.
- UI can edit a variant label and content.
- UI compares variants side by side.
- UI can select a winner.
- Only one selected variant exists per post and variant type.
- Previous selected variants remain in history and are not deleted.
- Selected variant content is copied into the matching main post field.
- Heuristic scores are labeled as editorial heuristics, not performance prediction.
- Visual comparison displays headline/content length and readability density.
- Analytics data is not connected to heuristic scores in this phase.
- Documentation and implementation log are updated.

## Phase 9 - Analytics Dashboard

- Metrics entry supports reactions, video views, average watch time, followers gained, metric window hours, and source.
- Analytics can be filtered by campaign, date range, post type, content pillar, template, aspect ratio, publishing time, and objective.
- KPI formulas match the roadmap definitions.
- Division by zero displays `N/A` instead of throwing or showing misleading rates.
- Dashboard displays post count as sample context and warns when sample size is small.
- Top posts can be opened in the post editor.
- Per-post metrics tab displays latest metrics, history, rates, publication snapshot, next action, and notes.
- CSV export uses stable column headers and includes post title, campaign, publish date, raw metrics, and calculated rates.
- No CSV import or screenshot extraction is included in this phase.

## Phase 10 - Performance Learning Engine

- Migration creates `social_learnings` with indexes, RLS, owner policy, and updated_at trigger.
- AI operation `generateSocialPerformanceReview` exists.
- Campaign Retrospective uses real campaign posts, publication snapshots, metrics, variants, and templates.
- Retrospective output includes campaign summary, strongest observations, weak observations, patterns worth testing, content to repeat, content to stop, next experiment, and proposed learnings.
- Proposed learnings require user approval before reuse.
- Rejected and archived learnings are not injected into future AI prompts.
- Small samples and single-post observations are forced toward low confidence or anecdotal language.
- Approved learnings are retrieved by relevance and capped at 8 items.
- Approved learning context is integrated into weekly plan, content map, post draft, and variant generation.
- No Meta API or autoposting is added.
- Documentation and implementation log are updated.
