"use client";

import {
  Bot,
  CheckCircle2,
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
  onMarkReady: () => void;
  onMarkPosted: () => void;
  onMarkReviewed: () => void;
  onGenerateCaption: () => void;
  onGenerateVisual: () => void;
  onDeletePost: () => void;
}

export function SocialPostActionBar({
  post,
  isPending,
  onSave,
  onCopyCaption,
  onMarkReady,
  onMarkPosted,
  onMarkReviewed,
  onGenerateCaption,
  onGenerateVisual,
  onDeletePost,
}: SocialPostActionBarProps) {
  const existingPost = Boolean(post.id);

  return (
    <div className="sticky bottom-0 -mx-5 flex flex-wrap gap-2 border-t border-gray-100 bg-white p-4">
      <button
        type="button"
        onClick={onSave}
        disabled={isPending}
        className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-arkara-amber px-3 py-2.5 text-sm font-black text-arkara-green disabled:cursor-not-allowed disabled:opacity-50"
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
        disabled={isPending || !existingPost}
        className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-3 py-2.5 text-sm font-bold text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Clipboard className="h-4 w-4" />
        Copy Caption
      </button>
      {existingPost ? (
        <>
          <button
            type="button"
            onClick={onMarkReady}
            disabled={isPending || post.status === "ready"}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-green-100 px-3 py-2.5 text-sm font-bold text-green-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <CheckCircle2 className="h-4 w-4" />
            Ready
          </button>
          <button
            type="button"
            onClick={onMarkPosted}
            disabled={isPending || post.status === "posted" || post.status === "reviewed"}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-blue-100 px-3 py-2.5 text-sm font-bold text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <CheckCircle2 className="h-4 w-4" />
            Posted
          </button>
          <button
            type="button"
            onClick={onMarkReviewed}
            disabled={isPending || post.status === "reviewed"}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-purple-100 px-3 py-2.5 text-sm font-bold text-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <CheckCircle2 className="h-4 w-4" />
            Reviewed
          </button>
          <button
            type="button"
            onClick={onGenerateCaption}
            disabled={isPending}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-3 py-2.5 text-sm font-bold text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4" />
            Caption
          </button>
          <button
            type="button"
            onClick={onGenerateVisual}
            disabled={isPending}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-3 py-2.5 text-sm font-bold text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Bot className="h-4 w-4" />
            Visual Spec
          </button>
          <button
            type="button"
            onClick={onDeletePost}
            disabled={isPending}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-100 px-3 py-2.5 text-sm font-bold text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </>
      ) : null}
    </div>
  );
}