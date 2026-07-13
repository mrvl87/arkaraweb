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
