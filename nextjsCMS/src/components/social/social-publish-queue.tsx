"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, CalendarClock } from "lucide-react";
import { buildSocialCaptionWithUtm } from "@/lib/social/publish-pack";
import type { SocialAsset, SocialCampaign, SocialCarouselSlide, SocialPost } from "@/types/social";

function latestApprovedAsset(assets: SocialAsset[]) {
  return [...assets]
    .filter((asset) => asset.status === "approved")
    .sort((left, right) => right.version - left.version || new Date(right.created_at).getTime() - new Date(left.created_at).getTime())[0] ?? null;
}

function getMissingRequirements(post: SocialPost, slides: SocialCarouselSlide[], assets: SocialAsset[]) {
  const missing: string[] = [];
  const caption = buildSocialCaptionWithUtm(post);
  if (!caption.trim()) missing.push("caption");
  if (post.post_type === "article_link" && !post.target_url?.trim()) missing.push("target URL");

  if (post.post_type === "carousel") {
    const postSlides = slides.filter((slide) => slide.post_id === post.id);
    if (postSlides.length === 0) missing.push("slides");
    const missingSlides = postSlides.filter((slide) => !latestApprovedAsset(assets.filter((asset) =>
      asset.slide_id === slide.id && asset.asset_type === "carousel_slide"
    )));
    if (missingSlides.length > 0) missing.push(`approved slides ${missingSlides.map((slide) => slide.slide_number).join(",")}`);
  } else if (!latestApprovedAsset(assets.filter((asset) =>
    asset.post_id === post.id && !asset.slide_id && asset.asset_type === "poster"
  ))) {
    missing.push("approved poster");
  }

  return missing;
}

interface SocialPublishQueueProps {
  campaigns: SocialCampaign[];
  activeCampaign: SocialCampaign | null;
  posts: SocialPost[];
  slides: SocialCarouselSlide[];
  assets: SocialAsset[];
  onSelectCampaign: (campaignId: string) => void;
  onEditPost: (post: SocialPost) => void;
}

export function SocialPublishQueue({
  campaigns,
  activeCampaign,
  posts,
  slides,
  assets,
  onSelectCampaign,
  onEditPost,
}: SocialPublishQueueProps) {
  const [postType, setPostType] = useState("all");
  const [date, setDate] = useState("");
  const readyPosts = useMemo(() => {
    return posts
      .filter((post) => post.status === "ready")
      .filter((post) => postType === "all" || post.post_type === postType)
      .filter((post) => !date || post.scheduled_date === date)
      .sort((left, right) => {
        const leftKey = `${left.scheduled_date ?? "9999-99-99"} ${left.scheduled_time ?? "99:99"}`;
        const rightKey = `${right.scheduled_date ?? "9999-99-99"} ${right.scheduled_time ?? "99:99"}`;
        return leftKey.localeCompare(rightKey);
      });
  }, [posts, postType, date]);

  if (!activeCampaign) return null;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex flex-col gap-3 border-b border-gray-100 pb-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-400">
            <CalendarClock className="h-4 w-4 text-arkara-amber" />
            Publish Queue
          </div>
          <h3 className="mt-1 text-xl font-black text-arkara-green">Ready Posts</h3>
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          <select value={activeCampaign.id} onChange={(event) => onSelectCampaign(event.target.value)} className="input-social text-xs">
            {campaigns.map((campaign) => <option key={campaign.id} value={campaign.id}>{campaign.title}</option>)}
          </select>
          <select value={postType} onChange={(event) => setPostType(event.target.value)} className="input-social text-xs">
            <option value="all">All types</option>
            {[...new Set(posts.map((post) => post.post_type))].map((type) => <option key={type} value={type}>{type.replace("_", " ")}</option>)}
          </select>
          <input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="input-social text-xs" />
        </div>
      </div>

      <div className="space-y-2">
        {readyPosts.map((post) => {
          const missing = getMissingRequirements(post, slides, assets);
          return (
            <button key={post.id} type="button" onClick={() => onEditPost(post)} className="grid w-full gap-3 rounded-lg border border-gray-100 p-3 text-left hover:border-arkara-amber sm:grid-cols-[1fr_auto]">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-black text-arkara-green">{post.title}</span>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-black uppercase text-gray-500">{post.post_type.replace("_", " ")}</span>
                </div>
                <div className="mt-1 text-xs font-medium text-gray-400">{post.scheduled_date || "Tanpa tanggal"} {post.scheduled_time?.slice(0, 5) || ""} {post.timezone}</div>
              </div>
              <div className={missing.length > 0 ? "text-xs font-bold text-red-600" : "text-xs font-bold text-green-700"}>
                {missing.length > 0 ? (
                  <span className="inline-flex items-center gap-1"><AlertTriangle className="h-3.5 w-3.5" /> {missing.join(", ")}</span>
                ) : "Complete"}
              </div>
            </button>
          );
        })}
        {readyPosts.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-4 text-center text-sm font-medium text-gray-400">Tidak ada post ready sesuai filter.</div>
        ) : null}
      </div>
    </div>
  );
}