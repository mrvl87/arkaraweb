"use client";

import { Plus } from "lucide-react";
import {
  createCarouselSlide,
  generateFacebookCarouselSlides,
} from "@/app/cms/social/actions";
import type { SocialCarouselSlide } from "@/types/social";
import type { PostDraft } from "./social-post-editor-types";
import { SocialSlideEditor } from "./social-slide-editor";
export function SocialCarouselEditor({
  post,
  slides,
  runAction,
}: {
  post: PostDraft;
  slides: SocialCarouselSlide[];
  runAction: (
    task: () => Promise<{
      error?: string;
      success?: boolean;
      summary?: string;
    }>,
  ) => void;
}) {
  const copyAllPrompts = async () => {
    await navigator.clipboard.writeText(
      slides
        .map(
          (slide) =>
            `Slide ${slide.slide_number}: ${slide.title_text}\n${slide.visual_prompt ?? ""}`,
        )
        .join("\n\n"),
    );
  };

  return (
    <div className="rounded-lg border border-gray-200 p-3">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="text-xs font-black uppercase tracking-widest text-gray-500">
          Carousel Slides
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={copyAllPrompts}
            className="rounded-lg border border-gray-200 px-2 py-1 text-xs font-bold text-gray-600"
          >
            Copy Prompts
          </button>
          {post.id ? (
            <button
              type="button"
              onClick={() =>
                runAction(() => generateFacebookCarouselSlides(post.id!))
              }
              className="rounded-lg bg-arkara-green px-2 py-1 text-xs font-black text-white"
            >
              Generate
            </button>
          ) : null}
        </div>
      </div>
      <div className="space-y-2">
        {slides.map((slide) => (
          <SocialSlideEditor key={slide.id} slide={slide} runAction={runAction} />
        ))}
        {slides.length === 0 ? (
          <p className="text-sm text-gray-400">Belum ada slide.</p>
        ) : null}
      </div>
      {post.id ? (
        <button
          type="button"
          onClick={() =>
            runAction(() =>
              createCarouselSlide({
                post_id: post.id!,
                slide_number: slides.length + 1,
                title_text: `Slide ${slides.length + 1}`,
                paragraph_text: "",
                visual_prompt: "",
                image_status: "needed",
              }),
            )
          }
          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 px-3 py-2 text-sm font-bold text-gray-600"
        >
          <Plus className="h-4 w-4" />
          Add Slide
        </button>
      ) : null}
    </div>
  );
}
