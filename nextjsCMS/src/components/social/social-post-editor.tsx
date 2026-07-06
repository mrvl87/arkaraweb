"use client";

import {
  Bot,
  Clipboard,
  Loader2,
  Save,
  Sparkles,
  Trash2,
} from "lucide-react";
import {
  deleteSocialPost,
  generateFacebookPostDraft,
  generateFacebookVisualPromptForPost,
} from "@/app/cms/social/actions";
import { SocialCarouselEditor } from "./social-carousel-editor";
import { SocialCopyReadyPanel } from "./social-copy-ready-panel";
import { SocialPostEditorHeader } from "./social-post-editor-header";
import { SocialPostMainFields } from "./social-post-main-fields";
import type { PostDraftUpdater, PostEditorProps } from "./social-post-editor-types";
import { buildCaption } from "./social-utils";

export function SocialPostEditor({
  post,
  setPost,
  slides,
  isPending,
  runAction,
  savePost,
  copyCaption,
}: PostEditorProps) {
  if (!post) {
    return null;
  }

  const update: PostDraftUpdater = (key, value) => {
    setPost({ ...post, [key]: value });
  };
  const captionValue = buildCaption(post);
  const copyVisualPrompt = async () => {
    if (!post.visual_prompt) return;
    await navigator.clipboard.writeText(post.visual_prompt);
  };

  return (
    <div className="fixed inset-0 z-[80]">
      <button
        type="button"
        aria-label="Close post editor"
        onClick={() => setPost(null)}
        className="absolute inset-0 bg-arkara-green/30 backdrop-blur-[2px]"
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Edit social post"
        className="absolute bottom-0 right-0 top-0 flex w-full max-w-3xl flex-col border-l border-gray-200 bg-white shadow-2xl"
      >
        <SocialPostEditorHeader onClose={() => setPost(null)} />

        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          <SocialCopyReadyPanel onCopyCaption={() => copyCaption(post)} />

          <SocialPostMainFields
            post={post}
            update={update}
            setPost={setPost}
            captionValue={captionValue}
            onCopyVisualPrompt={copyVisualPrompt}
          />

          {post.post_type === "carousel" ? (
            <SocialCarouselEditor post={post} slides={slides} runAction={runAction} />
          ) : null}

          <div className="sticky bottom-0 -mx-5 flex flex-wrap gap-2 border-t border-gray-100 bg-white p-4">
            <button
              type="button"
              onClick={savePost}
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
              onClick={() => copyCaption(post)}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-3 py-2.5 text-sm font-bold text-gray-700"
            >
              <Clipboard className="h-4 w-4" />
              Copy
            </button>
            {post.id ? (
              <>
                <button
                  type="button"
                  onClick={() =>
                    runAction(() => generateFacebookPostDraft(post.id!))
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-3 py-2.5 text-sm font-bold text-gray-700"
                >
                  <Sparkles className="h-4 w-4" />
                  Caption
                </button>
                <button
                  type="button"
                  onClick={() =>
                    runAction(() =>
                      generateFacebookVisualPromptForPost(post.id!),
                    )
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-3 py-2.5 text-sm font-bold text-gray-700"
                >
                  <Bot className="h-4 w-4" />
                  Visual
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const confirmed = window.confirm(
                      `Hapus post "${post.title}" secara permanen?`,
                    );
                    if (!confirmed) return;

                    runAction(() => deleteSocialPost(post.id!));
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-100 px-3 py-2.5 text-sm font-bold text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </>
            ) : null}
          </div>
        </div>
      </aside>
    </div>
  );
}
