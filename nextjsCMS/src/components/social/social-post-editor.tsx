"use client";

import {
  Bot,
  Clipboard,
  Copy,
  Loader2,
  Save,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import {
  deleteSocialPost,
  generateFacebookPostDraft,
  generateFacebookVisualPromptForPost,
} from "@/app/cms/social/actions";
import { SocialCarouselEditor } from "./social-carousel-editor";
import { SocialEditorField } from "./social-editor-field";
import type { PostDraft, PostEditorProps } from "./social-post-editor-types";
import { buildCaption } from "./social-utils";
export function SocialPostEditor({
  post,
  setPost,
  slides,
  sources,
  isPending,
  runAction,
  savePost,
  copyCaption,
}: PostEditorProps) {
  if (!post) {
    return null;
  }

  const update = <K extends keyof PostDraft>(key: K, value: PostDraft[K]) => {
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
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-arkara-green">
              Facebook Post Editor
            </h3>
            <p className="mt-1 text-xs font-medium text-gray-400">
              Caption pendek + prompt poster informatif
            </p>
          </div>
          <button
            type="button"
            onClick={() => setPost(null)}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          <div className="rounded-xl border border-arkara-amber/30 bg-arkara-cream p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-black uppercase tracking-widest text-arkara-amber">
                  Copy-ready artifact
                </div>
                <p className="mt-1 text-sm text-gray-600">
                  Teks di field Facebook Caption adalah versi final yang akan
                  dicopy manual ke Facebook.
                </p>
              </div>
              <button
                type="button"
                onClick={() => copyCaption(post)}
                className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-arkara-green px-3 py-2 text-sm font-black text-white"
              >
                <Clipboard className="h-4 w-4" />
                Copy Caption
              </button>
            </div>
          </div>

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
                  onClick={copyVisualPrompt}
                  disabled={!post.visual_prompt}
                  className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-bold text-arkara-green hover:bg-arkara-cream disabled:text-gray-300"
                >
                  <Copy className="h-3.5 w-3.5" />
                  Copy Prompt
                </button>
              </div>
              <textarea
                value={post.visual_prompt ?? ""}
                onChange={(event) =>
                  update("visual_prompt", event.target.value)
                }
                rows={18}
                className="w-full min-h-[460px] resize-y border-0 bg-transparent px-3 py-3 font-mono text-xs leading-6 text-gray-800 outline-none"
              />
            </div>
          </SocialEditorField>

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
