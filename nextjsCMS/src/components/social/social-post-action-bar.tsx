"use client";

import {
  Bot,
  Clipboard,
  Loader2,
  Save,
  Sparkles,
  Trash2,
} from "lucide-react";
import type { PostDraft } from "./social-post-editor-types";

interface SocialPostActionBarProps {
  post: PostDraft;
  isPending: boolean;
  onSave: () => void;
  onCopyCaption: () => void;
  onGenerateCaption: () => void;
  onGenerateVisual: () => void;
  onDeletePost: () => void;
}

export function SocialPostActionBar({
  post,
  isPending,
  onSave,
  onCopyCaption,
  onGenerateCaption,
  onGenerateVisual,
  onDeletePost,
}: SocialPostActionBarProps) {
  return (
    <div className="sticky bottom-0 -mx-5 flex flex-wrap gap-2 border-t border-gray-100 bg-white p-4">
      <button
        type="button"
        onClick={onSave}
        disabled={isPending}
        className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-arkara-amber px-3 py-2.5 text-sm font-black text-arkara-green disabled:opacity-50"
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Save className="h-4 w-4" />
        )}
        Save
      </button>
      <button
        type="button"
        onClick={onCopyCaption}
        className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-3 py-2.5 text-sm font-bold text-gray-700"
      >
        <Clipboard className="h-4 w-4" />
        Copy
      </button>
      {post.id ? (
        <>
          <button
            type="button"
            onClick={onGenerateCaption}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-3 py-2.5 text-sm font-bold text-gray-700"
          >
            <Sparkles className="h-4 w-4" />
            Caption
          </button>
          <button
            type="button"
            onClick={onGenerateVisual}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-3 py-2.5 text-sm font-bold text-gray-700"
          >
            <Bot className="h-4 w-4" />
            Visual
          </button>
          <button
            type="button"
            onClick={onDeletePost}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-100 px-3 py-2.5 text-sm font-bold text-red-600"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </>
      ) : null}
    </div>
  );
}