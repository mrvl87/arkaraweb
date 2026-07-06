"use client";

import { Copy } from "lucide-react";
import { SocialEditorField } from "./social-editor-field";
import type { PostDraft, PostDraftUpdater } from "./social-post-editor-types";

interface SocialPostMainFieldsProps {
  post: PostDraft;
  update: PostDraftUpdater;
  setPost: (post: PostDraft | null) => void;
  captionValue: string;
  onCopyVisualPrompt: () => void;
}

export function SocialPostMainFields({
  post,
  update,
  setPost,
  captionValue,
  onCopyVisualPrompt,
}: SocialPostMainFieldsProps) {
  return (
    <>
      <SocialEditorField label="Internal Title">
        <input
          value={post.title}
          onChange={(event) => update("title", event.target.value)}
          className="input-social"
        />
      </SocialEditorField>
      <SocialEditorField label="Short Caption">
        <textarea
          value={captionValue}
          onChange={(event) =>
            setPost({
              ...post,
              hook: null,
              body: event.target.value,
              cta: null,
              caption_done: event.target.value.trim().length > 0,
            })
          }
          rows={4}
          className="input-social resize-y text-[15px] leading-7"
        />
      </SocialEditorField>

      <SocialEditorField label="Target URL">
        <input
          value={post.target_url ?? ""}
          onChange={(event) => update("target_url", event.target.value)}
          className="input-social"
        />
      </SocialEditorField>
      <SocialEditorField label="Text-to-Image Prompt">
        <div className="rounded-lg border border-gray-200 bg-white">
          <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2">
            <span className="text-xs font-bold text-gray-400">
              Poster prompt dengan teks di dalam gambar
            </span>
            <button
              type="button"
              onClick={onCopyVisualPrompt}
              disabled={!post.visual_prompt}
              className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-bold text-arkara-green hover:bg-arkara-cream disabled:text-gray-300"
            >
              <Copy className="h-3.5 w-3.5" />
              Copy Prompt
            </button>
          </div>
          <textarea
            value={post.visual_prompt ?? ""}
            onChange={(event) => update("visual_prompt", event.target.value)}
            rows={18}
            className="w-full min-h-[460px] resize-y border-0 bg-transparent px-3 py-3 font-mono text-xs leading-6 text-gray-800 outline-none"
          />
        </div>
      </SocialEditorField>
    </>
  );
}
