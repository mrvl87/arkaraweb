"use client";

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import type { SocialAspectRatio, SocialVisualSpec } from "@/types/social";
import { SocialEditorField } from "./social-editor-field";
import type { PostDraftUpdater } from "./social-post-editor-types";

export const DEFAULT_VISUAL_FOOTER = "ArkaraWeb.com | Survive with Knowledge";

export const SOCIAL_TEMPLATE_OPTIONS = [
  { value: "editorial-opinion-v1", label: "Editorial Opinion" },
  { value: "editorial-checklist-v1", label: "Editorial Checklist" },
  { value: "editorial-carousel-v1", label: "Editorial Carousel" },
];

export function makeBlankVisualSpec(title: string, aspectRatio: SocialAspectRatio): SocialVisualSpec {
  return {
    template_id: "editorial-opinion-v1",
    aspect_ratio: aspectRatio,
    scene_prompt: "Editorial illustration of a realistic Indonesian household preparedness scene, calm cinematic lighting, detailed painterly graphic novel style, clear empty space for CMS overlay.",
    label: "RUMAH SIAGA",
    headline: title.slice(0, 90) || "Headline visual",
    subheadline: "Ringkasan visual singkat untuk poster Facebook Arkara.",
    information_blocks: [
      { title: "Poin 1", text: "Tulis poin visual pertama." },
      { title: "Poin 2", text: "Tulis poin visual kedua." },
    ],
    emphasis_text: "Kalimat penekanan singkat.",
    footer: DEFAULT_VISUAL_FOOTER,
    alt_text: "Ilustrasi rumah tangga Indonesia sesuai topik post Arkara.",
  };
}

interface SocialVisualSpecFormProps {
  title: string;
  aspectRatio: SocialAspectRatio;
  visualSpec: SocialVisualSpec | null;
  onChange: (spec: SocialVisualSpec) => void;
}

export function SocialVisualSpecForm({
  title,
  aspectRatio,
  visualSpec,
  onChange,
}: SocialVisualSpecFormProps) {
  const spec = visualSpec ?? makeBlankVisualSpec(title, aspectRatio);

  const updateField = <K extends keyof SocialVisualSpec>(
    key: K,
    value: SocialVisualSpec[K],
  ) => {
    onChange({ ...spec, [key]: value });
  };

  const updateBlock = (
    index: number,
    key: "title" | "text" | "icon",
    value: string,
  ) => {
    const blocks = spec.information_blocks.map((block, blockIndex) =>
      blockIndex === index ? { ...block, [key]: value || undefined } : block,
    );
    onChange({ ...spec, information_blocks: blocks });
  };

  const moveBlock = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= spec.information_blocks.length) return;
    const blocks = [...spec.information_blocks];
    const [item] = blocks.splice(index, 1);
    blocks.splice(nextIndex, 0, item);
    onChange({ ...spec, information_blocks: blocks });
  };

  const addBlock = () => {
    if (spec.information_blocks.length >= 6) return;
    onChange({
      ...spec,
      information_blocks: [...spec.information_blocks, { text: "Poin baru" }],
    });
  };

  const removeBlock = (index: number) => {
    if (spec.information_blocks.length <= 2) return;
    onChange({
      ...spec,
      information_blocks: spec.information_blocks.filter((_, blockIndex) => blockIndex !== index),
    });
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="text-xs font-black uppercase tracking-widest text-gray-500">
          Visual Specification
        </div>
        {!visualSpec ? (
          <button
            type="button"
            onClick={() => onChange(spec)}
            className="rounded-md bg-arkara-green px-2 py-1 text-xs font-black text-white"
          >
            Create Spec
          </button>
        ) : null}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <SocialEditorField label="Template">
          <select
            value={spec.template_id}
            onChange={(event) => updateField("template_id", event.target.value)}
            className="input-social"
          >
            {SOCIAL_TEMPLATE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </SocialEditorField>
        <SocialEditorField label="Aspect Ratio">
          <select
            value={spec.aspect_ratio}
            onChange={(event) => updateField("aspect_ratio", event.target.value as SocialAspectRatio)}
            className="input-social"
          >
            <option value="1:1">1:1</option>
            <option value="4:5">4:5</option>
            <option value="9:16">9:16</option>
          </select>
        </SocialEditorField>
      </div>

      <SocialEditorField label="Scene Prompt">
        <textarea
          value={spec.scene_prompt}
          onChange={(event) => updateField("scene_prompt", event.target.value)}
          rows={4}
          className="input-social resize-y font-mono text-xs leading-6"
        />
      </SocialEditorField>

      <div className="grid gap-3 md:grid-cols-2">
        <SocialEditorField label="Label">
          <input
            value={spec.label}
            onChange={(event) => updateField("label", event.target.value)}
            className="input-social"
            maxLength={80}
          />
        </SocialEditorField>
        <SocialEditorField label={`Headline ${spec.headline.length}/90`}>
          <input
            value={spec.headline}
            onChange={(event) => updateField("headline", event.target.value)}
            className="input-social"
            maxLength={110}
          />
        </SocialEditorField>
      </div>

      <SocialEditorField label={`Subheadline ${spec.subheadline.length}/180`}>
        <textarea
          value={spec.subheadline}
          onChange={(event) => updateField("subheadline", event.target.value)}
          rows={2}
          className="input-social resize-y"
          maxLength={220}
        />
      </SocialEditorField>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-widest text-gray-400">
            Information Blocks {spec.information_blocks.length}/6
          </span>
          <button
            type="button"
            onClick={addBlock}
            disabled={spec.information_blocks.length >= 6}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-bold text-arkara-green disabled:text-gray-300"
          >
            <Plus className="h-3.5 w-3.5" />
            Add
          </button>
        </div>
        {spec.information_blocks.map((block, index) => (
          <div key={index} className="grid gap-2 rounded-md bg-gray-50 p-2 md:grid-cols-[0.8fr_1.4fr_0.55fr_auto]">
            <input
              value={block.title ?? ""}
              onChange={(event) => updateBlock(index, "title", event.target.value)}
              placeholder="Title optional"
              className="input-social"
              maxLength={80}
            />
            <input
              value={block.text}
              onChange={(event) => updateBlock(index, "text", event.target.value)}
              placeholder="Text"
              className="input-social"
              maxLength={220}
            />
            <input
              value={block.icon ?? ""}
              onChange={(event) => updateBlock(index, "icon", event.target.value)}
              placeholder="Icon"
              className="input-social"
              maxLength={40}
            />
            <div className="flex items-center justify-end gap-1">
              <button type="button" onClick={() => moveBlock(index, -1)} disabled={index === 0} className="rounded-md p-1 text-gray-500 disabled:text-gray-300">
                <ArrowUp className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => moveBlock(index, 1)} disabled={index === spec.information_blocks.length - 1} className="rounded-md p-1 text-gray-500 disabled:text-gray-300">
                <ArrowDown className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => removeBlock(index)} disabled={spec.information_blocks.length <= 2} className="rounded-md p-1 text-red-500 disabled:text-gray-300">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <SocialEditorField label={`Emphasis Text ${spec.emphasis_text.length}/120`}>
        <input
          value={spec.emphasis_text}
          onChange={(event) => updateField("emphasis_text", event.target.value)}
          className="input-social"
          maxLength={150}
        />
      </SocialEditorField>

      <SocialEditorField label="Footer">
        <input
          value={spec.footer}
          onChange={(event) => updateField("footer", event.target.value)}
          className="input-social"
          maxLength={100}
        />
      </SocialEditorField>

      <SocialEditorField label="Alt Text">
        <textarea
          value={spec.alt_text}
          onChange={(event) => updateField("alt_text", event.target.value)}
          rows={2}
          className="input-social resize-y"
          maxLength={300}
        />
      </SocialEditorField>
    </div>
  );
}

interface SocialVisualSpecEditorProps {
  title: string;
  aspectRatio: SocialAspectRatio;
  visualSpec: SocialVisualSpec | null;
  update: PostDraftUpdater;
}

export function SocialVisualSpecEditor({
  title,
  aspectRatio,
  visualSpec,
  update,
}: SocialVisualSpecEditorProps) {
  return (
    <SocialVisualSpecForm
      title={title}
      aspectRatio={aspectRatio}
      visualSpec={visualSpec}
      onChange={(spec) => update("visual_spec", spec)}
    />
  );
}