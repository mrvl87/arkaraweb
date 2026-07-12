"use client";

import {
  deleteSocialPost,
  generateFacebookPostDraft,
  generateFacebookVisualPromptForPost,
} from "@/app/cms/social/actions";
import { SocialCarouselEditor } from "./social-carousel-editor";
import { SocialCopyReadyPanel } from "./social-copy-ready-panel";
import { SocialPostActionBar } from "./social-post-action-bar";
import { SocialPostEditorHeader } from "./social-post-editor-header";
import { SocialPostMainFields } from "./social-post-main-fields";
import type {
  PostDraftUpdater,
  PostEditorProps,
} from "./social-post-editor-types";
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
  const handleGenerateCaption = () => {
    if (!post.id) return;
    runAction(() => generateFacebookPostDraft(post.id!));
  };
  const handleGenerateVisual = () => {
    if (!post.id) return;
    runAction(() => generateFacebookVisualPromptForPost(post.id!));
  };
  const handleDeletePost = () => {
    if (!post.id) return;

    const confirmed = window.confirm(
      `Hapus post "${post.title}" secara permanen?`,
    );
    if (!confirmed) return;

    runAction(() => deleteSocialPost(post.id!));
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
            <SocialCarouselEditor
              post={post}
              slides={slides}
              runAction={runAction}
            />
          ) : null}

          <SocialPostActionBar
            post={post}
            isPending={isPending}
            onSave={savePost}
            onCopyCaption={() => copyCaption(post)}
            onGenerateCaption={handleGenerateCaption}
            onGenerateVisual={handleGenerateVisual}
            onDeletePost={handleDeletePost}
          />
        </div>
      </aside>
    </div>
  );
}