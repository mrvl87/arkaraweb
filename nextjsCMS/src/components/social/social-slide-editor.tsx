"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import {
  deleteCarouselSlide,
  updateCarouselSlide,
} from "@/app/cms/social/actions";
import type { SocialCarouselSlide } from "@/types/social";
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
    if (!draft.visual_prompt) return;
    await navigator.clipboard.writeText(draft.visual_prompt);
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
            disabled={!draft.visual_prompt}
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
        value={draft.title_text}
        onChange={(event) =>
          setDraft({ ...draft, title_text: event.target.value })
        }
        className="input-social"
      />
      <textarea
        value={draft.paragraph_text ?? ""}
        onChange={(event) =>
          setDraft({ ...draft, paragraph_text: event.target.value })
        }
        rows={2}
        className="input-social mt-2"
      />
      <textarea
        value={draft.visual_prompt ?? ""}
        onChange={(event) =>
          setDraft({ ...draft, visual_prompt: event.target.value })
        }
        rows={3}
        className="input-social mt-2 font-mono text-xs"
      />
      <button
        type="button"
        onClick={() =>
          runAction(() =>
            updateCarouselSlide({
              id: draft.id,
              post_id: draft.post_id,
              slide_number: draft.slide_number,
              title_text: draft.title_text,
              paragraph_text: draft.paragraph_text ?? "",
              visual_prompt: draft.visual_prompt ?? "",
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