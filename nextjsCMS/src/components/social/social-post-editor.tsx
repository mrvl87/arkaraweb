"use client";

import { useState } from "react";
import {
  copyPostCaptionMark,
  deleteSocialPost,
  generateFacebookPostDraft,
  generateFacebookVisualPromptForPost,
  markPostPosted,
  updatePostStatus,
} from "@/app/cms/social/actions";
import { SocialCarouselEditor } from "./social-carousel-editor";
import { SocialChecklistPanel } from "./social-checklist-panel";
import { SocialCopyReadyPanel } from "./social-copy-ready-panel";
import { SocialMetricsPanel } from "./social-metrics-panel";
import { SocialPostActionBar } from "./social-post-action-bar";
import { SocialPostEditorHeader } from "./social-post-editor-header";
import { SocialPostMainFields } from "./social-post-main-fields";
import type {
  PostDraftUpdater,
  PostEditorProps,
} from "./social-post-editor-types";
import { SocialVisualStudio } from "./social-visual-studio";
import { buildCaption } from "./social-utils";

type EditorTab = "content" | "visual" | "publish" | "metrics";

const EDITOR_TABS: Array<{ id: EditorTab; label: string }> = [
  { id: "content", label: "Content" },
  { id: "visual", label: "Visual" },
  { id: "publish", label: "Publish" },
  { id: "metrics", label: "Metrics" },
];

export function SocialPostEditor({
  post,
  setPost,
  slides,
  assets,
  latestMetric,
  isPending,
  runAction,
  savePost,
}: PostEditorProps) {
  const [activeTab, setActiveTab] = useState<EditorTab>("content");

  if (!post) {
    return null;
  }

  const update: PostDraftUpdater = (key, value) => {
    setPost({ ...post, [key]: value });
  };
  const captionValue = buildCaption(post);
  const copyVisualPrompt = async () => {
    const scenePrompt = post.visual_spec?.scene_prompt ?? post.visual_prompt;
    if (!scenePrompt) return;
    await navigator.clipboard.writeText(scenePrompt);
  };
  const handleCopyCaption = () => {
    if (!post.id) return;
    const previousPost = post;
    setPost({ ...post, copied_done: true });
    runAction(async () => {
      await navigator.clipboard.writeText(captionValue);
      return copyPostCaptionMark(post.id!);
    }).then((result) => {
      if (result.error) setPost(previousPost);
    });
  };
  const handleMarkReady = () => {
    if (!post.id) return;
    const previousPost = post;
    setPost({ ...post, status: "ready" });
    runAction(() => updatePostStatus(post.id!, "ready")).then((result) => {
      if (result.error) setPost(previousPost);
    });
  };
  const handleMarkPosted = () => {
    if (!post.id) return;
    const previousPost = post;
    setPost({ ...post, status: "posted", posted_done: true, copied_done: true });
    runAction(() => markPostPosted(post.id!)).then((result) => {
      if (result.error) setPost(previousPost);
    });
  };
  const handleMarkReviewed = () => {
    if (!post.id) return;
    const previousPost = post;
    setPost({ ...post, status: "reviewed" });
    runAction(() => updatePostStatus(post.id!, "reviewed")).then((result) => {
      if (result.error) setPost(previousPost);
    });
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
        className="absolute bottom-0 right-0 top-0 flex w-full max-w-5xl flex-col border-l border-gray-200 bg-white shadow-2xl"
      >
        <SocialPostEditorHeader onClose={() => setPost(null)} />

        <div className="border-b border-gray-100 px-5 pt-4">
          <div className="flex gap-2 overflow-x-auto">
            {EDITOR_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-t-lg px-4 py-2 text-sm font-black ${activeTab === tab.id ? "bg-arkara-green text-white" : "bg-gray-50 text-gray-500 hover:bg-gray-100"}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === "content" ? (
            <div className="space-y-5">
              <SocialPostMainFields
                post={post}
                update={update}
                captionValue={captionValue}
              />
              {post.post_type === "carousel" ? (
                <SocialCarouselEditor
                  post={post}
                  slides={slides}
                  runAction={runAction}
                />
              ) : null}
            </div>
          ) : null}

          {activeTab === "visual" ? (
            <SocialVisualStudio
              post={post}
              update={update}
              slides={slides}
              assets={assets}
              isPending={isPending}
              runAction={runAction}
              savePost={savePost}
              onCopyVisualPrompt={copyVisualPrompt}
            />
          ) : null}

          {activeTab === "publish" ? (
            <div className="space-y-5">
              <SocialCopyReadyPanel disabled={isPending || !post.id} onCopyCaption={handleCopyCaption} />
              <SocialChecklistPanel
                post={post}
                setPost={setPost}
                isPending={isPending}
                runAction={runAction}
              />

            </div>
          ) : null}

          {activeTab === "metrics" ? (
            <SocialMetricsPanel
              post={post}
              setPost={setPost}
              latestMetric={latestMetric}
              isPending={isPending}
              runAction={runAction}
            />
          ) : null}

          <SocialPostActionBar
            post={post}
            isPending={isPending}
            onSave={() => savePost()}
            onCopyCaption={handleCopyCaption}
            onMarkReady={handleMarkReady}
            onMarkPosted={handleMarkPosted}
            onMarkReviewed={handleMarkReviewed}
            onGenerateCaption={handleGenerateCaption}
            onGenerateVisual={handleGenerateVisual}
            onDeletePost={handleDeletePost}
          />
        </div>
      </aside>
    </div>
  );
}