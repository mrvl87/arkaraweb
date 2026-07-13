"use client";

import { useMemo, useState } from "react";
import { Copy, ImagePlus, Loader2, Play, Wand2 } from "lucide-react";
import {
  renderAllCarouselAssets,
  renderCarouselSlideAsset,
  renderSocialPostAsset,
  updateCarouselSlide,
  uploadSocialBackgroundAsset,
} from "@/app/cms/social/actions";
import { resolveSocialAssetUrl } from "@/lib/social/social-asset-url";
import type { SocialAsset, SocialCarouselSlide, SocialVisualSpec } from "@/types/social";
import { SocialAssetHistory } from "./social-asset-history";
import { SocialEditorField } from "./social-editor-field";
import type { PostDraft, PostDraftUpdater, SocialActionResult, SocialActionRunner } from "./social-post-editor-types";
import { SocialVisualPreview, getVisualSpecWarnings } from "./social-visual-preview";
import { makeBlankVisualSpec, SocialVisualSpecForm } from "./social-visual-spec-editor";

const MAX_BACKGROUND_BYTES = 8 * 1024 * 1024;
const BACKGROUND_TYPES = ["image/png", "image/jpeg", "image/webp"];

interface SocialVisualStudioProps {
  post: PostDraft;
  update: PostDraftUpdater;
  slides: SocialCarouselSlide[];
  assets: SocialAsset[];
  isPending: boolean;
  runAction: SocialActionRunner;
  savePost: (options?: { closeOnSuccess?: boolean }) => Promise<SocialActionResult>;
  onCopyVisualPrompt: () => void;
}

export function SocialVisualStudio({
  post,
  update,
  slides,
  assets,
  isPending,
  runAction,
  savePost,
  onCopyVisualPrompt,
}: SocialVisualStudioProps) {
  const [selectedBackgroundId, setSelectedBackgroundId] = useState<string | null>(null);
  const [batchResults, setBatchResults] = useState<SocialActionResult["slides"]>(undefined);
  const spec = post.visual_spec ?? makeBlankVisualSpec(post.title, post.aspect_ratio);
  const postBackgrounds = assets.filter((asset) => asset.asset_type === "background" && asset.post_id === post.id && !asset.slide_id && asset.status !== "archived");
  const posterAssets = assets.filter((asset) => asset.asset_type === "poster" && asset.post_id === post.id);
  const selectedBackground = postBackgrounds.find((asset) => asset.id === selectedBackgroundId) ?? postBackgrounds[0];
  const selectedBackgroundUrl = resolveSocialAssetUrl(selectedBackground?.storage_path);
  const warnings = getVisualSpecWarnings(spec, post.post_type);

  const updateSpec = (next: SocialVisualSpec) => {
    update("visual_spec", next);
    update("visual_prompt", next.scene_prompt);
    update("selected_template_id", next.template_id);
    update("aspect_ratio", next.aspect_ratio);
    update("alt_text", next.alt_text);
  };

  const uploadBackground = async (file: File | null, slideId?: string) => {
    if (!post.id) return { error: "Simpan post dulu sebelum upload background." };
    if (!file) return { error: "File background wajib dipilih." };
    if (!BACKGROUND_TYPES.includes(file.type)) return { error: "Background harus PNG, JPG, atau WebP." };
    if (file.size > MAX_BACKGROUND_BYTES) return { error: "Ukuran background maksimal 8 MB." };

    const formData = new FormData();
    formData.set("post_id", post.id);
    if (slideId) formData.set("slide_id", slideId);
    formData.set("file", file);
    return runAction(() => uploadSocialBackgroundAsset(formData));
  };

  const renderPost = async () => {
    if (!post.id) return;
    const saved = await savePost({ closeOnSuccess: false });
    if (saved.error) return;
    await runAction(() => renderSocialPostAsset(post.id!, selectedBackground?.id ?? null));
  };

  const renderAllSlides = async () => {
    if (!post.id) return;
    const saved = await savePost({ closeOnSuccess: false });
    if (saved.error) return;
    const result = await runAction(() => renderAllCarouselAssets(post.id!));
    setBatchResults(result.slides);
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-4 xl:grid-cols-[1fr_0.9fr]">
        <div className="space-y-4">
          <SocialVisualSpecForm
            title={post.title}
            aspectRatio={post.aspect_ratio}
            visualSpec={post.visual_spec}
            onChange={updateSpec}
          />

          <SocialEditorField label="Legacy Scene Prompt">
            <div className="rounded-lg border border-gray-200 bg-white">
              <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2">
                <span className="text-xs font-bold text-gray-400">Fallback dari scene_prompt</span>
                <button
                  type="button"
                  onClick={onCopyVisualPrompt}
                  disabled={!post.visual_prompt && !post.visual_spec?.scene_prompt}
                  className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-bold text-arkara-green hover:bg-arkara-cream disabled:text-gray-300"
                >
                  <Copy className="h-3.5 w-3.5" />
                  Copy Prompt
                </button>
              </div>
              <textarea
                value={post.visual_prompt ?? ""}
                onChange={(event) => update("visual_prompt", event.target.value)}
                rows={8}
                className="w-full resize-y border-0 bg-transparent px-3 py-3 font-mono text-xs leading-6 text-gray-800 outline-none"
              />
            </div>
          </SocialEditorField>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="text-xs font-black uppercase tracking-widest text-gray-500">Preview</div>
              <button
                type="button"
                onClick={renderPost}
                disabled={isPending || !post.id || warnings.some((warning) => warning.includes("exceeds hard limit"))}
                className="inline-flex items-center gap-2 rounded-lg bg-arkara-green px-3 py-2 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                Render
              </button>
            </div>
            <SocialVisualPreview spec={spec} postType={post.post_type} backgroundUrl={selectedBackgroundUrl} />
            {warnings.length > 0 ? (
              <div className="mt-3 space-y-1 rounded-lg border border-amber-100 bg-amber-50 p-3 text-xs font-semibold text-amber-800">
                {warnings.map((warning) => <div key={warning}>{warning}</div>)}
              </div>
            ) : null}
          </div>

          <AssetUploadPanel onUpload={(file) => uploadBackground(file)} disabled={isPending || !post.id} />

          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="mb-3 text-xs font-black uppercase tracking-widest text-gray-500">Background Versions</div>
            <SocialAssetHistory
              assets={postBackgrounds}
              type="background"
              selectedAssetId={selectedBackground?.id ?? null}
              onSelectAsset={setSelectedBackgroundId}
              runAction={runAction}
              compact
            />
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="mb-3 text-xs font-black uppercase tracking-widest text-gray-500">Generated Poster History</div>
            <SocialAssetHistory assets={posterAssets} type="poster" runAction={runAction} />
          </div>
        </div>
      </div>

      {post.post_type === "carousel" ? (
        <SocialCarouselVisualStudio
          post={post}
          slides={slides}
          assets={assets}
          isPending={isPending}
          runAction={runAction}
          savePost={savePost}
          onUploadBackground={uploadBackground}
          onRenderAll={renderAllSlides}
          batchResults={batchResults}
        />
      ) : null}
    </div>
  );
}

function AssetUploadPanel({
  onUpload,
  disabled,
}: {
  onUpload: (file: File | null) => Promise<SocialActionResult>;
  disabled: boolean;
}) {
  const [fileName, setFileName] = useState("");

  return (
    <label className="block rounded-xl border border-dashed border-gray-300 bg-white p-4 text-sm font-bold text-gray-600">
      <div className="flex items-center gap-2">
        <ImagePlus className="h-4 w-4 text-arkara-amber" />
        Background Upload
      </div>
      <input
        type="file"
        accept="image/png,image/jpeg,image/webp"
        disabled={disabled}
        className="mt-3 block w-full text-xs text-gray-500 file:mr-3 file:rounded-md file:border-0 file:bg-arkara-green file:px-3 file:py-2 file:text-xs file:font-black file:text-white disabled:opacity-50"
        onChange={async (event) => {
          const file = event.target.files?.[0] ?? null;
          setFileName(file?.name ?? "");
          await onUpload(file);
          event.currentTarget.value = "";
        }}
      />
      {fileName ? <div className="mt-2 text-xs text-gray-400">{fileName}</div> : null}
    </label>
  );
}

function SocialCarouselVisualStudio({
  post,
  slides,
  assets,
  isPending,
  runAction,
  savePost,
  onUploadBackground,
  onRenderAll,
  batchResults,
}: {
  post: PostDraft;
  slides: SocialCarouselSlide[];
  assets: SocialAsset[];
  isPending: boolean;
  runAction: SocialActionRunner;
  savePost: (options?: { closeOnSuccess?: boolean }) => Promise<SocialActionResult>;
  onUploadBackground: (file: File | null, slideId?: string) => Promise<SocialActionResult>;
  onRenderAll: () => Promise<void>;
  batchResults?: SocialActionResult["slides"];
}) {
  const [selectedSlideId, setSelectedSlideId] = useState(slides[0]?.id ?? "");
  const selectedSlide = slides.find((slide) => slide.id === selectedSlideId) ?? slides[0];

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="mb-4 flex flex-col gap-3 border-b border-gray-100 pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-xs font-black uppercase tracking-widest text-gray-500">Carousel Visual Tabs</div>
          <p className="mt-1 text-xs text-gray-400">Setiap slide memakai visual spec dan asset history sendiri.</p>
        </div>
        <button
          type="button"
          onClick={onRenderAll}
          disabled={isPending || !post.id || slides.length === 0}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-arkara-green px-3 py-2 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          Render All Slides
        </button>
      </div>

      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {slides.map((slide) => (
          <button
            key={slide.id}
            type="button"
            onClick={() => setSelectedSlideId(slide.id)}
            className={`shrink-0 rounded-lg border px-3 py-2 text-xs font-black ${selectedSlide?.id === slide.id ? "border-arkara-amber bg-arkara-cream text-arkara-green" : "border-gray-200 text-gray-500"}`}
          >
            Slide {slide.slide_number}
          </button>
        ))}
      </div>

      {selectedSlide ? (
        <SlideVisualPanel
          key={selectedSlide.id}
          slide={selectedSlide}
          assets={assets.filter((asset) => asset.slide_id === selectedSlide.id)}
          isPending={isPending}
          runAction={runAction}
          savePost={savePost}
          onUploadBackground={(file) => onUploadBackground(file, selectedSlide.id)}
        />
      ) : (
        <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-400">Belum ada slide.</div>
      )}

      {batchResults?.length ? (
        <div className="mt-4 rounded-lg bg-gray-50 p-3 text-xs font-semibold text-gray-600">
          {batchResults.map((result) => (
            <div key={result.slideId ?? result.slideNumber} className={result.error ? "text-red-600" : "text-green-700"}>
              Slide {result.slideNumber}: {result.error ?? `rendered v${result.version}`}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function SlideVisualPanel({
  slide,
  assets,
  isPending,
  runAction,
  savePost,
  onUploadBackground,
}: {
  slide: SocialCarouselSlide;
  assets: SocialAsset[];
  isPending: boolean;
  runAction: SocialActionRunner;
  savePost: (options?: { closeOnSuccess?: boolean }) => Promise<SocialActionResult>;
  onUploadBackground: (file: File | null) => Promise<SocialActionResult>;
}) {
  const [selectedBackgroundId, setSelectedBackgroundId] = useState<string | null>(null);
  const [draftSpec, setDraftSpec] = useState<SocialVisualSpec | null>(slide.visual_spec);
  const backgrounds = assets.filter((asset) => asset.asset_type === "background" && asset.status !== "archived");
  const generated = assets.filter((asset) => asset.asset_type === "carousel_slide");
  const selectedBackground = backgrounds.find((asset) => asset.id === selectedBackgroundId) ?? backgrounds[0];
  const selectedBackgroundUrl = resolveSocialAssetUrl(selectedBackground?.storage_path);
  const warnings = useMemo(() => getVisualSpecWarnings(draftSpec, "carousel"), [draftSpec]);

  const renderSlide = async () => {
    const saved = await savePost({ closeOnSuccess: false });
    if (saved.error) return;
    await runAction(() => renderCarouselSlideAsset(slide.id, selectedBackground?.id ?? null));
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_0.9fr]">
      <div className="space-y-4">
        <SocialVisualSpecForm
          title={slide.title_text}
          aspectRatio={draftSpec?.aspect_ratio ?? "1:1"}
          visualSpec={draftSpec}
          onChange={setDraftSpec}
        />
        <button
          type="button"
          onClick={() => {
            if (!draftSpec) return;
            runAction(() => updateCarouselSlide({
              id: slide.id,
              post_id: slide.post_id,
              slide_number: slide.slide_number,
              purpose: slide.purpose ?? "",
              title_text: slide.title_text,
              paragraph_text: slide.paragraph_text ?? "",
              visual_prompt: draftSpec.scene_prompt,
              visual_spec: draftSpec,
              image_status: slide.image_status,
            }));
          }}
          disabled={isPending || !draftSpec}
          className="inline-flex w-full items-center justify-center rounded-lg bg-arkara-amber px-3 py-2 text-xs font-black text-arkara-green disabled:opacity-50"
        >
          Save Slide Visual Spec
        </button>
      </div>
      <div className="space-y-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-xs font-black uppercase tracking-widest text-gray-500">Slide Preview</div>
            <button type="button" onClick={renderSlide} disabled={isPending || !draftSpec} className="rounded-lg bg-arkara-green px-3 py-2 text-xs font-black text-white disabled:opacity-50">
              Render Slide
            </button>
          </div>
          <SocialVisualPreview spec={draftSpec} postType="carousel" backgroundUrl={selectedBackgroundUrl} />
          {warnings.length > 0 ? <div className="mt-3 rounded-lg bg-amber-50 p-3 text-xs font-semibold text-amber-800">{warnings.join(" ")}</div> : null}
        </div>
        <AssetUploadPanel onUpload={onUploadBackground} disabled={isPending} />
        <SocialAssetHistory assets={backgrounds} type="background" selectedAssetId={selectedBackground?.id ?? null} onSelectAsset={setSelectedBackgroundId} runAction={runAction} compact />
        <SocialAssetHistory assets={generated} type="carousel_slide" runAction={runAction} />
      </div>
    </div>
  );
}