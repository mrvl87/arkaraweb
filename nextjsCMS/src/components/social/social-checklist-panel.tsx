"use client";

import { Loader2 } from "lucide-react";
import { togglePostChecklistItem } from "@/app/cms/social/actions";
import type { SocialChecklistKey } from "@/types/social";
import type { PostDraft, SocialActionRunner } from "./social-post-editor-types";

interface SocialChecklistPanelProps {
  post: PostDraft;
  setPost: (post: PostDraft | null) => void;
  isPending: boolean;
  runAction: SocialActionRunner;
}

const CHECKLIST_ITEMS: Array<{ key: SocialChecklistKey; label: string }> = [
  { key: "caption_done", label: "Caption" },
  { key: "cta_done", label: "CTA" },
  { key: "visual_prompt_done", label: "Visual prompt" },
  { key: "asset_done", label: "Asset" },
];

export function SocialChecklistPanel({
  post,
  setPost,
  isPending,
  runAction,
}: SocialChecklistPanelProps) {
  if (!post.id) return null;

  const toggleItem = async (key: SocialChecklistKey, value: boolean) => {
    const previous = post[key];
    setPost({ ...post, [key]: value });
    const result = await runAction(() => togglePostChecklistItem(post.id!, key, value));
    if (result.error) {
      setPost({ ...post, [key]: previous });
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <div className="text-xs font-black uppercase tracking-widest text-gray-500">
            Checklist
          </div>
          <p className="mt-1 text-xs text-gray-400">
            Copy, posted, dan metrics mengikuti workflow utama agar tidak bentrok dengan status.
          </p>
        </div>
        {isPending ? <Loader2 className="h-4 w-4 animate-spin text-gray-400" /> : null}
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {CHECKLIST_ITEMS.map((item) => (
          <label
            key={item.key}
            className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 px-3 py-2 text-sm font-bold text-gray-600"
          >
            <span>{item.label}</span>
            <input
              type="checkbox"
              checked={Boolean(post[item.key])}
              disabled={isPending}
              onChange={(event) => toggleItem(item.key, event.target.checked)}
              className="h-4 w-4 accent-arkara-green disabled:cursor-not-allowed"
            />
          </label>
        ))}
      </div>
    </div>
  );
}