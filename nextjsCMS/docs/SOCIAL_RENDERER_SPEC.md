# Social Poster Renderer Spec

Last updated: 2026-07-13

## Scope

This spec defines the renderer principles for future Social Content OS phases. Phase 0 does not implement rendering.

## Core Principle

AI does not write final text directly into background images.

Responsibilities:

- AI creates scene prompt, background prompt, and structured visual specification.
- CMS renders all text deterministically.
- CMS renders Arkara footer deterministically.
- CMS validates overflow, safe zones, and aspect ratio.

## Supported Formats

The poster renderer must support:

- 1:1 feed square.
- 4:5 feed portrait.
- 9:16 story/reel portrait.

Initial dimensions:

- 1:1: 1080 x 1080.
- 4:5: 1080 x 1350.
- 9:16: 1080 x 1920.

Output:

- PNG or WebP raster for publishing.
- Optional SVG source retained for debugging.

## Renderer Dependency Decision

Use existing `sharp`.

Implementation direction:

1. Compose SVG string from deterministic template data.
2. Use `sharp(Buffer.from(svg)).png()` or `.webp()` to rasterize.
3. Store rendered output through the current R2/media upload pattern.

Do not add a browser renderer dependency in the first implementation unless a later phase proves SVG + `sharp` insufficient.

## Visual Spec Contract

A visual spec should include:

- `aspect_ratio`
- `template_key`
- `scene_prompt`
- `background_prompt`
- `background_image_url`
- `text_blocks`
- `safe_zone`
- `footer`
- `brand_tokens`
- `validation`

Example shape:

```json
{
  "aspect_ratio": "4:5",
  "template_key": "arkara_field_card_v1",
  "scene_prompt": "Modern Indonesian apartment during quiet blackout preparation, no text, no signage.",
  "background_prompt": "Text-free editorial illustration background with clear empty zones for overlay.",
  "text_blocks": [
    {
      "role": "eyebrow",
      "text": "RUMAH SIAGA",
      "max_lines": 1
    },
    {
      "role": "headline",
      "text": "Rumah Anda Tahan Berapa Jam Tanpa Listrik?",
      "max_lines": 3
    },
    {
      "role": "body",
      "text": "Mulai dari air, cahaya, komunikasi, dan makanan siap pakai.",
      "max_lines": 5
    }
  ],
  "footer": {
    "text": "ArkaraWeb.com | Survive with Knowledge"
  }
}
```

## Background Image Rules

Background image generation must request:

- No text.
- No labels.
- No signage.
- No watermark.
- No brand logo.
- No UI mockup.
- Clear negative space for deterministic overlay.
- Modern Indonesian household or urban context when relevant.

The prompt may describe mood, lighting, scene, objects, and composition, but must not rely on the model for text layout.

## Text Rendering Rules

The CMS renderer owns:

- Font size.
- Line height.
- Text wrapping.
- Text alignment.
- Contrast layer.
- Panel/card positioning.
- Footer.
- Export dimensions.

Text blocks must have:

- Role.
- Text.
- Bounding box.
- Max lines.
- Minimum font size.
- Preferred font size.
- Weight.
- Color token.
- Overflow policy.

Overflow policy:

- Try wrap within box.
- Reduce font size down to minimum.
- If still overflowing, fail validation and show a warning instead of silently clipping.

## Safe Zone Rules

Every template must define safe zones:

- Outer margin.
- Text safe area.
- Footer area.
- Optional subject focus area.
- Optional no-text area.

Default safe zone guidance:

- 1:1: at least 72 px outer margin.
- 4:5: at least 72 px outer margin, extra bottom allowance for footer.
- 9:16: at least 96 px top/bottom margin to avoid platform UI overlap.

Template data must be explicit. Do not rely on CSS viewport behavior for final render geometry.

## Footer Rules

Footer Arkara is rendered by CMS, not image model.

Default footer text:

- `ArkaraWeb.com | Survive with Knowledge`

Footer must:

- Stay inside safe zone.
- Use deterministic typography.
- Maintain sufficient contrast.
- Never be part of the AI background image.

## Template Principles

Initial templates should be conservative:

- One strong headline area.
- Optional eyebrow.
- Optional body/checklist area.
- Optional CTA emphasis.
- Footer.
- Background image with dark/cream overlay if needed.

Avoid:

- Too many independent text blocks.
- Text over visually noisy areas without overlay.
- Manual per-poster CSS tweaks.
- AI-generated text inside the image.

## Validation Requirements

Before render is considered publishable:

- Aspect ratio is supported.
- Required text blocks are present.
- Text fits within bounding boxes.
- Footer fits within safe zone.
- Contrast meets template minimum.
- Background image exists and is reachable or render uses approved fallback.
- Output dimensions match selected format.
- Rendered asset is stored and linked to the owning `user_id`.

## Backward Compatibility

Existing `visual_prompt` values remain valid as legacy prompt artifacts.

Future phases should add structured visual spec fields/tables rather than replacing `visual_prompt` immediately.

Legacy visual prompt can be shown as:

- "Legacy prompt"
- "Convert to structured visual spec"

## Open Renderer Risks

- SVG text measurement is approximate without a full browser layout engine.
- Indonesian long words can overflow fixed boxes.
- Background contrast can vary; renderer needs overlay and contrast defaults.
- Template count should stay small until validation is proven.
- Live `media` schema must be verified before storing poster asset references.

## Phase 3 Structured Visual Specification

AI social visual generation now produces `visual_spec` instead of poster text-in-image instructions.

Renderer principles remain:

- AI describes only the background scene in `scene_prompt`.
- AI must not ask the image model to render logo, footer, headline, panel text, typography, or Indonesian copy.
- CMS owns deterministic rendering of label, headline, subheadline, information blocks, emphasis text, and footer.
- Legacy `visual_prompt` is preserved as a scene prompt fallback and should mirror `visual_spec.scene_prompt`.
- Footer is fixed as `ArkaraWeb.com | Survive with Knowledge` unless a future template explicitly overrides it.
- Supported aspect ratios remain `1:1`, `4:5`, and `9:16`.
- Text overflow validation remains a renderer responsibility for future phases.

Current implementation stores structured specs for posts and generated carousel slides. It does not render final posters yet.
