"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Copy, Download, ExternalLink, Loader2, PackageCheck } from "lucide-react";
import {
  copyPostCaptionMark,
  createManualSocialPublication,
  downloadCarouselPublishZip,
  downloadSocialAssetFile,
} from "@/app/cms/social/actions";
import { buildSocialCaptionWithUtm, buildSocialTargetUrl } from "@/lib/social/publish-pack";
import { resolveSocialAssetUrl } from "@/lib/social/social-asset-url";
import type { SocialAsset, SocialCarouselSlide, SocialPost, SocialPublication } from "@/types/social";
import type { PostDraft, SocialActionResult, SocialActionRunner } from "./social-post-editor-types";

function latestAsset(assets: SocialAsset[]) {
  return [...assets].sort((left, right) => {
    if (left.version !== right.version) return right.version - left.version;
    return new Date(right.created_at).getTime() - new Date(left.created_at).getTime();
  })[0] ?? null;
}

function saveBase64File(result: SocialActionResult) {
  if (!result.base64 || !result.fileName) return;
  const binary = atob(result.base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  const blob = new Blob([bytes], { type: result.mimeType || "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = result.fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function toDatetimeLocal(value: Date) {
  const offsetMs = value.getTimezoneOffset() * 60 * 1000;
  return new Date(value.getTime() - offsetMs).toISOString().slice(0, 16);
}

function getApprovedPoster(assets: SocialAsset[], postId?: string) {
  return latestAsset(assets.filter((asset) =>
    asset.post_id === postId &&
    !asset.slide_id &&
    asset.asset_type === "poster" &&
    asset.status === "approved"
  ));
}

function getLatestPoster(assets: SocialAsset[], postId?: string) {
  return latestAsset(assets.filter((asset) =>
    asset.post_id === postId &&
    !asset.slide_id &&
    asset.asset_type === "poster" &&
    asset.status !== "archived"
  ));
}

function getApprovedSlideAssets(assets: SocialAsset[], slides: SocialCarouselSlide[]) {
  return slides.map((slide) => ({
    slide,
    asset: latestAsset(assets.filter((asset) =>
      asset.slide_id === slide.id &&
      asset.asset_type === "carousel_slide" &&
      asset.status === "approved"
    )),
  }));
}

interface SocialPublishPackProps {
  post: PostDraft;
  slides: SocialCarouselSlide[];
  assets: SocialAsset[];
  publications: SocialPublication[];
  isPending: boolean;
  runAction: SocialActionRunner;
}

export function SocialPublishPack({
  post,
  slides,
  assets,
  publications,
  isPending,
  runAction,
}: SocialPublishPackProps) {
  const [facebookUrl, setFacebookUrl] = useState("");
  const [publishedAt, setPublishedAt] = useState(() => toDatetimeLocal(new Date()));
  const [notes, setNotes] = useState("");
  const targetUrl = buildSocialTargetUrl({
    targetUrl: post.target_url,
    utmSource: post.utm_source,
    utmMedium: post.utm_medium,
    utmCampaign: post.utm_campaign,
  });
  const finalCaption = buildSocialCaptionWithUtm(post as SocialPost);
  const approvedPoster = getApprovedPoster(assets, post.id);
  const latestPoster = getLatestPoster(assets, post.id);
  const slideAssets = useMemo(() => getApprovedSlideAssets(assets, slides), [assets, slides]);
  const latestPublication = publications[0] ?? null;

  const missingRequirements = [];
  if (!finalCaption.trim()) missingRequirements.push("caption");
  if (post.post_type === "article_link" && !post.target_url?.trim()) missingRequirements.push("target URL");
  if (post.post_type === "carousel") {
    const missingSlides = slideAssets.filter((item) => !item.asset).map((item) => item.slide.slide_number);
    if (missingSlides.length > 0) missingRequirements.push(`approved carousel slide ${missingSlides.join(", ")}`);
  } else if (!approvedPoster) {
    missingRequirements.push("approved poster");
  }

  const copyText = async (value: string, markCaption = false) => {
    if (!value.trim()) return;
    await navigator.clipboard.writeText(value);
    if (markCaption && post.id) await runAction(() => copyPostCaptionMark(post.id!));
  };

  const downloadPoster = async () => {
    const asset = approvedPoster ?? latestPoster;
    if (!asset) return;
    const result = await runAction(() => downloadSocialAssetFile(asset.id));
    if (!result.error) saveBase64File(result);
  };

  const downloadZip = async () => {
    if (!post.id) return;
    const result = await runAction(() => downloadCarouselPublishZip(post.id!));
    if (!result.error) saveBase64File(result);
  };

  const markPosted = async () => {
    if (!post.id) return;
    await runAction(() => createManualSocialPublication({
      post_id: post.id!,
      facebook_url: facebookUrl,
      published_at: publishedAt,
      notes,
    }));
  };

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="mb-4 flex flex-col gap-2 border-b border-gray-100 pb-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-500">
              <PackageCheck className="h-4 w-4 text-arkara-amber" />
              Facebook Publish Pack
            </div>
            <p className="mt-1 text-xs text-gray-400">Manual publishing. Tidak ada Meta API atau autopost.</p>
          </div>
          {missingRequirements.length > 0 ? (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-700">
              Missing: {missingRequirements.join(", ")}
            </div>
          ) : (
            <div className="rounded-lg bg-green-50 px-3 py-2 text-xs font-bold text-green-700">Ready to publish</div>
          )}
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <Info label="Schedule" value={`${post.scheduled_date || "-"} ${post.scheduled_time?.slice(0, 5) || ""}`} />
          <Info label="Timezone" value={post.timezone || "Asia/Jayapura"} />
          <Info label="Objective" value={post.objective || "-"} />
          <Info label="Pillar" value={post.content_pillar || "-"} />
          <Info label="Post Type" value={post.post_type.replace("_", " ")} />
          <Info label="Status" value={post.status} />
        </div>
      </div>

      <CopyPanel
        title="Final Caption"
        value={finalCaption}
        rows={8}
        onCopy={() => copyText(finalCaption, true)}
        buttonLabel="Copy Caption"
      />
      <CopyPanel
        title="First Comment"
        value={post.first_comment || ""}
        rows={4}
        onCopy={() => copyText(post.first_comment || "")}
        buttonLabel="Copy First Comment"
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <CopyPanel
          title="Target URL with UTM"
          value={targetUrl}
          rows={3}
          onCopy={() => copyText(targetUrl)}
          buttonLabel="Copy Link"
        />
        <CopyPanel
          title="Alt Text"
          value={post.alt_text || post.visual_spec?.alt_text || ""}
          rows={3}
          onCopy={() => copyText(post.alt_text || post.visual_spec?.alt_text || "")}
          buttonLabel="Copy Alt Text"
        />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="mb-3 text-xs font-black uppercase tracking-widest text-gray-500">Final Asset</div>
        {post.post_type === "carousel" ? (
          <div className="space-y-2">
            {slideAssets.map(({ slide, asset }) => (
              <div key={slide.id} className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 p-2 text-sm">
                <span className="font-bold text-gray-700">{String(slide.slide_number).padStart(2, "0")}. {slide.title_text}</span>
                {asset ? <AssetChip asset={asset} /> : <span className="text-xs font-bold text-red-600">Missing approved asset</span>}
              </div>
            ))}
          </div>
        ) : latestPoster ? (
          <div className="grid gap-3 sm:grid-cols-[160px_1fr]">
            <img src={resolveSocialAssetUrl(latestPoster.storage_path)} alt="Final poster" className="aspect-square rounded-lg border border-gray-100 object-cover" />
            <div className="text-sm text-gray-600">
              <AssetChip asset={latestPoster} />
              {!approvedPoster ? <div className="mt-2 text-xs font-bold text-amber-700">Latest poster belum approved.</div> : null}
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-400">Belum ada poster.</div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          {post.post_type === "carousel" ? (
            <button type="button" onClick={downloadZip} disabled={isPending || slideAssets.some((item) => !item.asset)} className="inline-flex items-center justify-center gap-2 rounded-lg bg-arkara-green px-3 py-2 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50">
              <Download className="h-4 w-4" /> Download Carousel ZIP
            </button>
          ) : (
            <button type="button" onClick={downloadPoster} disabled={isPending || !latestPoster} className="inline-flex items-center justify-center gap-2 rounded-lg bg-arkara-green px-3 py-2 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50">
              <Download className="h-4 w-4" /> Download Poster
            </button>
          )}
          <a href="https://www.facebook.com/" target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50">
            <ExternalLink className="h-4 w-4" /> Open Facebook
          </a>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <div className="text-xs font-black uppercase tracking-widest text-gray-500">Manual Publishing Session</div>
            {!facebookUrl.trim() ? <p className="mt-1 text-xs font-semibold text-amber-700">Facebook URL boleh kosong, tapi sebaiknya diisi setelah publish.</p> : null}
          </div>
          {latestPublication ? <div className="text-xs font-bold text-gray-400">Last publish: {new Date(latestPublication.published_at).toLocaleString("id-ID")}</div> : null}
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="text-xs font-bold uppercase tracking-wide text-gray-500">
            Published At
            <input type="datetime-local" value={publishedAt} onChange={(event) => setPublishedAt(event.target.value)} className="input-social mt-1 normal-case tracking-normal" />
          </label>
          <label className="text-xs font-bold uppercase tracking-wide text-gray-500">
            Facebook Post URL
            <input value={facebookUrl} onChange={(event) => setFacebookUrl(event.target.value)} placeholder="https://www.facebook.com/..." className="input-social mt-1 normal-case tracking-normal" />
          </label>
        </div>
        <label className="mt-3 block text-xs font-bold uppercase tracking-wide text-gray-500">
          Notes
          <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} className="input-social mt-1 normal-case tracking-normal" />
        </label>
        <button type="button" onClick={markPosted} disabled={isPending || missingRequirements.length > 0} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-arkara-green px-3 py-2.5 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50">
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
          Mark as Posted
        </button>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-gray-50 px-3 py-2">
      <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">{label}</div>
      <div className="mt-1 text-sm font-bold text-gray-700">{value}</div>
    </div>
  );
}

function CopyPanel({ title, value, rows, onCopy, buttonLabel }: { title: string; value: string; rows: number; onCopy: () => void; buttonLabel: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="text-xs font-black uppercase tracking-widest text-gray-500">{title}</div>
        <button type="button" onClick={onCopy} disabled={!value.trim()} className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-bold text-arkara-green hover:bg-arkara-cream disabled:text-gray-300">
          <Copy className="h-3.5 w-3.5" /> {buttonLabel}
        </button>
      </div>
      <textarea value={value} readOnly rows={rows} className="input-social resize-y bg-gray-50 text-sm leading-6 text-gray-700" />
    </div>
  );
}

function AssetChip({ asset }: { asset: SocialAsset }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-black uppercase text-gray-600">
      {asset.asset_type} v{asset.version} {asset.status}
    </span>
  );
}