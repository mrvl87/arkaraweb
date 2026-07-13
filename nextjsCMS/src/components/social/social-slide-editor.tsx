"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import {
  deleteCarouselSlide,
  updateCarouselSlide,
} from "@/app/cms/social/actions";
import type { SocialCarouselSlide, SocialVisualSpec } from "@/types/social";
import type { SocialActionRunner } from "./social-post-editor-types";

interface SocialSlideEditorProps {
  slide: SocialCarouselSlide;
  runAction: SocialActionRunner;
}

export function SocialSlideEditor({
  slide,
  runAction,
}: SocialSlideEditorProps) {
  const [draft, setDraft] = useState(slide);
  const copyPrompt = async () => {
    const scenePrompt = draft.visual_spec?.scene_prompt ?? draft.visual_prompt;
    if (!scenePrompt) return;
    await navigator.clipboard.writeText(scenePrompt);
  };

  const updateVisualSpec = <K extends keyof SocialVisualSpec>(
    key: K,
    value: SocialVisualSpec[K],
  ) => {
    if (!draft.visual_spec) return;
    setDraft({
      ...draft,
      visual_spec: { ...draft.visual_spec, [key]: value },
    });
  };

  return (
    <div className="rounded-lg bg-gray-50 p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-black text-gray-500">
          Slide {draft.slide_number}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={copyPrompt}
            disabled={!draft.visual_prompt && !draft.visual_spec?.scene_prompt}
            className="rounded-md px-2 py-1 text-xs font-bold text-arkara-green hover:bg-white disabled:text-gray-300"
          >
            Copy Prompt
          </button>
          <button
            type="button"
            onClick={() => {
              const confirmed = window.confirm(
                `Hapus Slide ${draft.slide_number}?`,
              );
              if (!confirmed) return;

              runAction(() => deleteCarouselSlide(draft.id));
            }}
            className="text-red-500"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      <input
        value={draft.purpose ?? ""}
        onChange={(event) =>
          setDraft({ ...draft, purpose: event.target.value })
        }
        placeholder="Purpose"
        className="input-social"
      />
      <input
        value={draft.title_text}
        onChange={(event) =>
          setDraft({ ...draft, title_text: event.target.value })
        }
        className="input-social mt-2"
      />
      <textarea
        value={draft.paragraph_text ?? ""}
        onChange={(event) =>
          setDraft({ ...draft, paragraph_text: event.target.value })
        }
        rows={2}
        className="input-social mt-2"
      />
      {draft.visual_spec ? (
        <div className="mt-2 space-y-2 rounded-md border border-gray-200 bg-white p-2">
          <input
            value={draft.visual_spec.headline}
            onChange={(event) => updateVisualSpec("headline", event.target.value)}
            className="input-social"
            maxLength={90}
          />
          <textarea
            value={draft.visual_spec.subheadline}
            onChange={(event) => updateVisualSpec("subheadline", event.target.value)}
            rows={2}
            className="input-social"
            maxLength={180}
          />
          <textarea
            value={draft.visual_spec.scene_prompt}
            onChange={(event) => updateVisualSpec("scene_prompt", event.target.value)}
            rows={3}
            className="input-social font-mono text-xs"
          />
        </div>
      ) : (
        <textarea
          value={draft.visual_prompt ?? ""}
          onChange={(event) =>
            setDraft({ ...draft, visual_prompt: event.target.value })
          }
          rows={3}
          className="input-social mt-2 font-mono text-xs"
        />
      )}
      <button
        type="button"
        onClick={() =>
          runAction(() =>
            updateCarouselSlide({
              id: draft.id,
              post_id: draft.post_id,
              slide_number: draft.slide_number,
              purpose: draft.purpose ?? "",
              title_text: draft.title_text,
              paragraph_text: draft.paragraph_text ?? "",
              visual_prompt: draft.visual_spec?.scene_prompt ?? draft.visual_prompt ?? "",
              visual_spec: draft.visual_spec,
              image_status: draft.image_status,
            }),
          )
        }
        className="mt-2 rounded-lg bg-white px-3 py-2 text-xs font-black text-arkara-green"
      >
        Save Slide
      </button>
    </div>
  );
}