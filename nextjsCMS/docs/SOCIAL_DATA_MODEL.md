# Social Content OS Data Model

Last updated: 2026-07-13

## Current Tables

Source migration:

- `supabase/migrations/20260510120000_create_social_tracker.sql`

### `social_campaigns`

Purpose:

- Campaign container for a Facebook content period.

Important columns:

- `id uuid primary key`
- `user_id uuid not null references auth.users(id)`
- `title text not null`
- `theme text`
- `platform text default 'facebook'`
- `start_date date not null`
- `end_date date not null`
- `primary_goal text`
- `content_pillar text`
- `tone_note text`
- `status text`
- `created_at timestamptz`
- `updated_at timestamptz`

RLS:

- Enabled.
- Authenticated users can manage rows where `auth.uid() = user_id`.

### `social_posts`

Purpose:

- Individual planned, drafted, posted, reviewed, or archived social post.

Important columns:

- `id uuid primary key`
- `campaign_id uuid references social_campaigns(id)`
- `user_id uuid not null references auth.users(id)`
- `platform text default 'facebook'`
- `post_type text`
- `title text not null`
- `hook text`
- `body text`
- `cta text`
- `target_url text`
- `source_type text`
- `source_id uuid`
- `scheduled_date date`
- `scheduled_time time`
- `timezone text default 'Asia/Jayapura'`
- `status text`
- `visual_prompt text`
- `objective text`
- `content_pillar text`
- Checklist booleans: `caption_done`, `cta_done`, `visual_prompt_done`, `asset_done`, `copied_done`, `posted_done`, `metrics_done`
- `notes text`
- `created_at timestamptz`
- `updated_at timestamptz`

RLS:

- Enabled.
- Authenticated users can manage rows where `auth.uid() = user_id`.

Compatibility note:

- `visual_prompt` currently stores text-to-image instructions that may include requested text inside the image. Future structured visual specification must not overwrite it destructively.

### `social_carousel_slides`

Purpose:

- Slide text and visual prompt for carousel posts.

Important columns:

- `id uuid primary key`
- `post_id uuid not null references social_posts(id)`
- `user_id uuid not null references auth.users(id)`
- `slide_number int not null`
- `title_text text not null`
- `paragraph_text text`
- `visual_prompt text`
- `image_status text`
- `created_at timestamptz`
- `updated_at timestamptz`
- Unique key on `(post_id, slide_number)`

RLS:

- Enabled.
- Authenticated users can manage rows where `auth.uid() = user_id`.

Compatibility note:

- The generator currently deletes and recreates slides for a post.

### `social_post_metrics`

Purpose:

- Manual performance records for posted social content.

Important columns:

- `id uuid primary key`
- `post_id uuid not null references social_posts(id)`
- `user_id uuid not null references auth.users(id)`
- `recorded_at timestamptz`
- `reach int`
- `comments int`
- `shares int`
- `link_clicks int`
- `notes text`
- `next_action text`
- `created_at timestamptz`

RLS:

- Enabled.
- Authenticated users can manage rows where `auth.uid() = user_id`.

### Related Existing Tables

`posts` and `panduan`:

- Used as source content for social plans and drafts.
- Current social source lookup does not filter by user ownership because these are CMS content tables with broader authenticated management policies.

`ai_generations`:

- Logs AI operations including social generation operations.
- Current `target_type` enum in application code includes `social`, while database schema comments still reflect older target types in places. Keep this in mind before tightening constraints.

`media`:

- Used by the media library and image generation pipeline.
- `supabase/schema.sql` shows older columns (`filename`, `url`, `mime_type`).
- Current media actions insert newer columns (`file_name`, `file_path`, `file_type`, `formats`, `dominant_color`, `blurhash`, `aspect_ratio`).
- Before adding poster assets, verify the live database shape or add a compatibility migration.

## Current Storage Pattern

The project currently does not use direct Supabase Storage upload for media generation.

Observed pattern:

- Server action creates an admin Supabase client with service role.
- Binary files are uploaded to Cloudflare R2 through S3-compatible API.
- Public URL base defaults to `https://media.arkaraweb.com`.
- Database row is inserted into `media`.
- `sharp` generates WebP variants and metadata.

Important functions:

- `processAndUploadImage()`
- `uploadR2Object()`
- `deleteR2Objects()`
- `uploadTemporaryReferenceImage()`
- `generateAIImage()`

Implication for Social Content OS:

- Generated backgrounds and rendered posters should use the same R2/media pipeline unless a later phase explicitly creates dedicated storage tables.

## Current Server Action Ownership Pattern

Social actions use:

- `createClient()` from `src/lib/supabase/server.ts`
- `supabase.auth.getUser()`
- `eq('user_id', user.id)` on reads and writes for owned social data
- `revalidatePath('/cms/social')` after mutations

Required rule for all planned social tables:

- Every user-owned social table must include `user_id`.
- RLS must require `auth.uid() = user_id`.
- Server actions must also filter by `user_id`.

## Planned Additive Tables

These are planned tables for future phases. They are not created in phase 0.

### `social_ideas`

Purpose:

- Capture raw content opportunities before they become campaign posts.

Planned columns:

- `id`
- `user_id`
- `campaign_id nullable`
- `source_type`
- `source_id nullable`
- `title`
- `raw_note`
- `audience`
- `problem`
- `promise`
- `status`
- `created_at`
- `updated_at`

### `social_strategies`

Purpose:

- Store strategic decisions for an idea or campaign post.

Planned columns:

- `id`
- `user_id`
- `idea_id nullable`
- `post_id nullable`
- `objective`
- `content_pillar`
- `angle`
- `format`
- `cta_strategy`
- `publish_window`
- `risk_notes`
- `created_at`
- `updated_at`

### `social_visual_specs`

Purpose:

- Store structured poster instructions separate from background image generation.

Planned columns:

- `id`
- `user_id`
- `post_id`
- `slide_id nullable`
- `aspect_ratio`
- `template_key`
- `scene_prompt`
- `background_prompt`
- `layout_json jsonb`
- `text_blocks_json jsonb`
- `safe_zone_json jsonb`
- `footer_json jsonb`
- `status`
- `created_at`
- `updated_at`

### `social_assets`

Purpose:

- Track background images, rendered posters, and pack assets.

Planned columns:

- `id`
- `user_id`
- `post_id`
- `slide_id nullable`
- `asset_type` such as `background`, `poster`, `publish_pack`
- `media_id nullable`
- `url`
- `width`
- `height`
- `aspect_ratio`
- `mime_type`
- `render_status`
- `checksum`
- `created_at`
- `updated_at`

### `social_publish_packs`

Purpose:

- Snapshot all manual publishing artifacts.

Planned columns:

- `id`
- `user_id`
- `post_id`
- `caption_snapshot`
- `poster_asset_id nullable`
- `carousel_asset_ids jsonb`
- `alt_text`
- `target_url`
- `manual_notes`
- `copied_at`
- `posted_at`
- `facebook_url`
- `created_at`
- `updated_at`

### `social_learning_insights`

Purpose:

- Store aggregated learning from metrics.

Planned columns:

- `id`
- `user_id`
- `campaign_id nullable`
- `post_id nullable`
- `metric_window`
- `insight_type`
- `summary`
- `evidence_json jsonb`
- `recommendation`
- `created_at`

## Migration Strategy

Future migrations should be additive:

- Do not drop existing social columns.
- Do not rename existing columns until all callers are migrated.
- Prefer nullable new columns for first release.
- Backfill from existing `visual_prompt`, checklist fields, and metrics only after UI supports both old and new data.
- Keep current RLS and add equivalent policies to new tables.

## Data Risks

- Phase 1 removed Social Tracker localStorage as source of truth for copied and posted state.
- Current AI visual prompts encode text-in-image behavior that conflicts with deterministic renderer goals.
- The live `media` table may differ from `supabase/schema.sql`; verify before linking social assets to `media.id`.
- Existing carousel regeneration deletes slides. Versioning is needed before users can safely preserve previous visual work.
- Metrics model is minimal and lacks reactions, saves, impressions, spend, published URL, and exact publish timestamp.

## Phase 2 Asset and Publication Foundation

Migration:

- `supabase/migrations/20260713090000_add_social_assets_and_publications.sql`

### Additive `social_posts` Columns

New nullable/default columns:

- `first_comment text`
- `alt_text text`
- `visual_spec jsonb`
- `selected_template_id text`
- `aspect_ratio text not null default '1:1'`
- `utm_source text not null default 'facebook'`
- `utm_medium text not null default 'social'`
- `utm_campaign text`

Rules:

- `aspect_ratio` is constrained to `1:1`, `4:5`, or `9:16`.
- Existing posts are kept compatible by nullable columns and defaults.

### `social_assets`

Purpose:

- Store generated or uploaded visual assets for social content: backgrounds, final posters, carousel slides, reel covers, and thumbnails.

Columns:

- `id uuid primary key`
- `user_id uuid not null references auth.users(id) on delete cascade`
- `post_id uuid null references social_posts(id) on delete cascade`
- `slide_id uuid null references social_carousel_slides(id) on delete cascade`
- `asset_type text`
- `storage_path text`
- `mime_type text`
- `width int`
- `height int`
- `aspect_ratio text`
- `template_id text`
- `version int default 1`
- `generation_prompt text`
- `metadata jsonb default '{}'`
- `status text`
- `created_at timestamptz`
- `updated_at timestamptz`

Supported `asset_type` values:

- `background`
- `poster`
- `carousel_slide`
- `reel_cover`
- `thumbnail`

Supported `status` values:

- `processing`
- `ready`
- `approved`
- `archived`
- `failed`

Rules:

- Asset must reference either `post_id` or `slide_id`.
- `version` must be greater than 0.
- `width` and `height` must be positive when present.
- `user_id` is required and protected by RLS.

### `social_publications`

Purpose:

- Record manual publication events after a social post is actually published.

Columns:

- `id uuid primary key`
- `user_id uuid not null references auth.users(id) on delete cascade`
- `post_id uuid not null references social_posts(id) on delete cascade`
- `published_at timestamptz default now()`
- `platform text default 'facebook'`
- `publication_method text default 'manual'`
- `facebook_url text`
- `caption_snapshot text`
- `first_comment_snapshot text`
- `asset_ids uuid[] default '{}'`
- `notes text`
- `created_at timestamptz`

Rules:

- `publication_method` is currently constrained to `manual`.
- `user_id` is required and protected by RLS.

### Storage Bucket

Bucket:

- `social-assets`

Rules:

- Public read is enabled because assets are social publishing materials.
- Authenticated users can insert, update, and delete only object paths whose first folder is their own `user_id`.
- Expected folder convention: `user_id/post_id/filename`.

## Phase 3 Additive Data Model

Migration: `supabase/migrations/20260713100000_add_social_carousel_slide_visual_spec.sql`

### `social_carousel_slides` Additions

- `purpose text`
- `visual_spec jsonb`

Rules:

- Existing `visual_prompt` remains for legacy compatibility.
- `visual_spec` stores the structured slide visual contract used by deterministic CMS rendering.
- `purpose` preserves the slide role such as Hook, Problem, Impact, Checklist, or CTA.
- `visual_spec` is nullable so old carousel slides remain readable.
- New generated slides should persist both `visual_spec` and legacy `visual_prompt`, with `visual_prompt` set to `visual_spec.scene_prompt`.

### Structured Visual Spec Contract

`social_posts.visual_spec` and `social_carousel_slides.visual_spec` use this shape:

```ts
type SocialVisualSpec = {
  template_id: string
  aspect_ratio: '1:1' | '4:5' | '9:16'
  scene_prompt: string
  label: string
  headline: string
  subheadline: string
  information_blocks: Array<{ title?: string; text: string; icon?: string }>
  emphasis_text: string
  footer: string
  alt_text: string
}
```

Validation limits live in `src/lib/ai/schemas.ts`.

## Phase 4 Asset Storage Behavior

No new database migration is required in Phase 4.

Renderer writes to existing Phase 2 tables:

- `social_assets.asset_type = 'poster'` for post-level rendered PNG.
- `social_assets.asset_type = 'carousel_slide'` for carousel slide PNG.
- `social_assets.version` increments from existing rows for the same owner/post/asset type and slide when applicable.
- `social_assets.storage_path` follows `user_id/post_id/filename` ownership folders.
- `social_assets.metadata.render_warnings` stores non-blocking renderer warnings.
- `social_posts.asset_done` becomes true after post poster render or full carousel batch render.

Old asset versions remain in storage and database.
