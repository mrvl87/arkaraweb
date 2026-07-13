"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Megaphone,
  Plus,
} from "lucide-react";
import {
  createCampaign,
  createExampleSocialCampaign,
  createSocialPost,
  deleteCampaign,
  updateCampaign,
  updateSocialPost,
} from "@/app/cms/social/actions";
import type {
  SocialCarouselSlide,
  SocialDashboardData,
  SocialPost,
  SocialPostMetric,
  SocialPostVariant,
} from "@/types/social";
import { SocialStrategyEnginePanel } from "./social-strategy-engine-panel";
import { SocialAnalyticsDashboard } from "./social-analytics-dashboard";
import { SocialCampaignList } from "./social-campaign-list";
import { SocialCampaignSettings } from "./social-campaign-settings";
import { SocialCampaignHeader } from "./social-campaign-header";
import type { PostDraft, SocialActionRunner } from "./social-post-editor-types";
import { SocialPostEditor } from "./social-post-editor";
import { SocialPublishQueue } from "./social-publish-queue";
import { SocialWeeklyBoard } from "./social-weekly-board";
import {
  getPostDayIndex,
  todayDate,
} from "./social-utils";

interface SocialTrackerDashboardProps {
  initialData: SocialDashboardData;
}

function makeEmptyPost(campaignId?: string | null): PostDraft {
  return {
    campaign_id: campaignId ?? null,
    platform: "facebook",
    post_type: "narrative",
    title: "",
    hook: null,
    body: null,
    cta: null,
    target_url: null,
    source_type: "none",
    source_id: null,
    scheduled_date: todayDate(),
    scheduled_time: "18:30",
    timezone: "Asia/Jayapura",
    status: "planned",
    visual_prompt: null,
    first_comment: null,
    alt_text: null,
    visual_spec: null,
    selected_template_id: null,
    aspect_ratio: '1:1',
    utm_source: 'facebook',
    utm_medium: 'social',
    utm_campaign: null,
    objective: null,
    content_pillar: null,
    caption_done: false,
    cta_done: false,
    visual_prompt_done: false,
    asset_done: false,
    copied_done: false,
    posted_done: false,
    metrics_done: false,
    notes: null,
  };
}

export function SocialTrackerDashboard({
  initialData,
}: SocialTrackerDashboardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedPost, setSelectedPost] = useState<PostDraft | null>(null);
  const [campaignDraft, setCampaignDraft] = useState(() => ({
    title: initialData.activeCampaign?.title ?? "",
    theme: initialData.activeCampaign?.theme ?? "",
    start_date: initialData.activeCampaign?.start_date ?? todayDate(),
    end_date: initialData.activeCampaign?.end_date ?? todayDate(),
    primary_goal: initialData.activeCampaign?.primary_goal ?? "",
    content_pillar: initialData.activeCampaign?.content_pillar ?? "",
    tone_note: initialData.activeCampaign?.tone_note ?? "",
    status: initialData.activeCampaign?.status ?? "planned",
  }));
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const activeCampaign = initialData.activeCampaign;
  const posts = initialData.posts;
  const weekPosts = useMemo(() => {
    return [...posts].sort((left, right) => {
      const leftDay = getPostDayIndex(left);
      const rightDay = getPostDayIndex(right);
      if (leftDay !== rightDay) return leftDay - rightDay;
      return (left.scheduled_time ?? "").localeCompare(
        right.scheduled_time ?? "",
      );
    });
  }, [posts]);
  const slidesByPost = useMemo(() => {
    const map = new Map<string, SocialCarouselSlide[]>();
    for (const slide of initialData.slides) {
      const current = map.get(slide.post_id) ?? [];
      current.push(slide);
      map.set(slide.post_id, current);
    }
    return map;
  }, [initialData.slides]);
  const variantsByPost = useMemo(() => {
    const map = new Map<string, SocialPostVariant[]>();
    for (const variant of initialData.variants) {
      const current = map.get(variant.post_id) ?? [];
      current.push(variant);
      map.set(variant.post_id, current);
    }
    return map;
  }, [initialData.variants]);

  const latestMetricsByPost = useMemo(() => {
    const map = new Map<string, SocialPostMetric>();
    for (const metric of initialData.metrics) {
      if (!map.has(metric.post_id)) {
        map.set(metric.post_id, metric);
      }
    }
    return map;
  }, [initialData.metrics]);

  const progressText = activeCampaign
    ? `${posts.length || 0} weekly cards`
    : "Belum ada campaign";

  const runAction: SocialActionRunner = (task) => {
    setError(null);
    setInfo(null);

    return new Promise((resolve) => {
      startTransition(async () => {
        try {
          const result = await task();
          if (result?.error) {
            setError(result.error);
            resolve(result);
            return;
          }
          if (result?.summary) setInfo(result.summary);
          router.refresh();
          resolve(result ?? { success: true });
        } catch (actionError) {
          const message =
            actionError instanceof Error
              ? actionError.message
              : "Action gagal dijalankan.";
          const result = { error: message };
          setError(message);
          resolve(result);
        }
      });
    });
  };

  const createQuickCampaign = () => {
    const title = window.prompt(
      "Judul campaign baru",
      "Campaign Facebook Mingguan",
    );
    if (!title) return;

    runAction(() =>
      createCampaign({
        title,
        theme: title,
        platform: "facebook",
        start_date: todayDate(),
        end_date: todayDate(),
        primary_goal: "Trust-building",
        content_pillar: "Krisis Rumah Tangga",
        tone_note: "Dekat, praktis, serius, tidak panik",
        status: "planned",
      }),
    );
  };

  const savePost = (options: { closeOnSuccess?: boolean } = {}) => {
    if (!selectedPost) return Promise.resolve({ error: 'Post belum dipilih.' });
    return runAction(async () => {
      const payload = {
        ...selectedPost,
        platform: "facebook" as const,
        hook: selectedPost.hook ?? "",
        body: selectedPost.body ?? "",
        cta: selectedPost.cta ?? "",
        target_url: selectedPost.target_url ?? "",
        source_id:
          selectedPost.source_type === "none" ? null : selectedPost.source_id,
        scheduled_date: selectedPost.scheduled_date ?? "",
        scheduled_time: selectedPost.scheduled_time?.slice(0, 5) ?? "",
        visual_prompt: selectedPost.visual_prompt ?? "",
        first_comment: selectedPost.first_comment ?? "",
        alt_text: selectedPost.alt_text ?? "",
        visual_spec: selectedPost.visual_spec ?? null,
        selected_template_id: selectedPost.selected_template_id ?? "",
        aspect_ratio: selectedPost.aspect_ratio ?? '1:1',
        utm_source: selectedPost.utm_source ?? 'facebook',
        utm_medium: selectedPost.utm_medium ?? 'social',
        utm_campaign: selectedPost.utm_campaign ?? "",
        objective: selectedPost.objective ?? "",
        content_pillar: selectedPost.content_pillar ?? "",
        notes: selectedPost.notes ?? "",
        caption_done: Boolean(selectedPost.body?.trim()),
        cta_done: Boolean(selectedPost.cta?.trim()),
      };

      const result = selectedPost.id
        ? await updateSocialPost(payload)
        : await createSocialPost(payload);

      if (!result.error && options.closeOnSuccess !== false) setSelectedPost(null);
      return result;
    });
  };

  const selectedSlides = selectedPost?.id
    ? (slidesByPost.get(selectedPost.id) ?? [])
    : [];
  const selectedMetrics = selectedPost?.id
    ? initialData.analyticsMetrics.filter((metric) => metric.post_id === selectedPost.id)
    : [];
  const selectedMetric = selectedMetrics[0] ?? null;
  const selectedAssets = selectedPost?.id
    ? initialData.assets.filter((asset) => asset.post_id === selectedPost.id || selectedSlides.some((slide) => slide.id === asset.slide_id))
    : [];
  const selectedPublications = selectedPost?.id
    ? initialData.publications.filter((publication) => publication.post_id === selectedPost.id)
    : [];
  const selectedVariants = selectedPost?.id
    ? (variantsByPost.get(selectedPost.id) ?? [])
    : [];

  useEffect(() => {
    if (!activeCampaign) return;
    setCampaignDraft({
      title: activeCampaign.title,
      theme: activeCampaign.theme ?? "",
      start_date: activeCampaign.start_date,
      end_date: activeCampaign.end_date,
      primary_goal: activeCampaign.primary_goal ?? "",
      content_pillar: activeCampaign.content_pillar ?? "",
      tone_note: activeCampaign.tone_note ?? "",
      status: activeCampaign.status,
    });
  }, [activeCampaign]);

  useEffect(() => {
    if (!selectedPost?.id) return;
    const freshPost = posts.find((post) => post.id === selectedPost.id);
    if (freshPost) setSelectedPost(freshPost);
  }, [posts, selectedPost?.id]);

  const saveCampaignSettings = () => {
    if (!activeCampaign) return;
    runAction(() =>
      updateCampaign({
        id: activeCampaign.id,
        platform: "facebook",
        ...campaignDraft,
        status: campaignDraft.status as
          | "planned"
          | "in_progress"
          | "completed"
          | "archived",
      }),
    );
  };

  const removeCampaign = (campaignId: string, campaignTitle: string) => {
    const confirmed = window.confirm(
      `Hapus permanen campaign "${campaignTitle}"?\n\nSemua post dan slide di dalam campaign ini juga akan terhapus.`,
    );
    if (!confirmed) return;

    runAction(() => deleteCampaign(campaignId));
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
        <SocialCampaignHeader
          activeCampaign={activeCampaign}
          campaigns={initialData.campaigns}
          progressText={progressText}
          onSelectCampaign={(campaignId) =>
            router.push(`/cms/social?campaign=${campaignId}`)
          }
          onCreateCampaign={createQuickCampaign}
          onAddPost={() => setSelectedPost(makeEmptyPost(activeCampaign?.id))}
        />

        <SocialStrategyEnginePanel
          sources={initialData.sources}
          activeCampaign={activeCampaign}
          isPending={isPending}
          runAction={runAction}
        />
      </div>

      {error ? (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      ) : null}
      {info ? (
        <div className="rounded-xl border border-green-100 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
          {info}
        </div>
      ) : null}

      {initialData.campaigns.length > 0 ? (
        <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <SocialCampaignList
            campaigns={initialData.campaigns}
            activeCampaign={activeCampaign}
            onSelectCampaign={(campaignId) =>
              router.push(`/cms/social?campaign=${campaignId}`)
            }
            onCreateCampaign={createQuickCampaign}
            onDeleteCampaign={removeCampaign}
          />

          <SocialCampaignSettings
            activeCampaign={activeCampaign}
            campaignDraft={campaignDraft}
            onCampaignDraftChange={setCampaignDraft}
            onSave={saveCampaignSettings}
            isPending={isPending}
          />
        </div>
      ) : null}

      {!activeCampaign ? (
        <div className="rounded-xl border border-dashed border-arkara-amber/50 bg-white p-8 text-center">
          <Megaphone className="mx-auto h-10 w-10 text-arkara-amber" />
          <h3 className="mt-4 text-lg font-black text-arkara-green">
            Mulai dari campaign contoh
          </h3>
          <p className="mx-auto mt-2 max-w-xl text-sm text-gray-500">
            Buat campaign Rumah Siaga 72 Jam untuk langsung melihat card
            mingguan Senin sampai Minggu.
          </p>
          <button
            type="button"
            onClick={() => runAction(createExampleSocialCampaign)}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-arkara-amber px-4 py-3 text-sm font-black text-arkara-green"
          >
            <Plus className="h-4 w-4" />
            Create Example Campaign
          </button>
        </div>
      ) : (
        <>
          <SocialPublishQueue
            campaigns={initialData.campaigns}
            activeCampaign={activeCampaign}
            posts={posts}
            slides={initialData.slides}
            assets={initialData.assets}
            onSelectCampaign={(campaignId) => router.push(`/cms/social?campaign=${campaignId}`)}
            onEditPost={(post) => setSelectedPost(post)}
          />
          <SocialAnalyticsDashboard
            campaigns={initialData.campaigns}
            posts={initialData.analyticsPosts}
            metrics={initialData.analyticsMetrics}
            publications={initialData.analyticsPublications}
            onEditPost={(post) => setSelectedPost(post)}
          />
          <SocialWeeklyBoard
            weekPosts={weekPosts}
            metricsByPost={latestMetricsByPost}
            isPending={isPending}
            runAction={runAction}
            onEditPost={(post) => setSelectedPost(post)}
          />
        </>
      )}

      <SocialPostEditor
        post={selectedPost}
        setPost={setSelectedPost}
        slides={selectedSlides}
        assets={selectedAssets}
        publications={selectedPublications}
        variants={selectedVariants}
        latestMetric={selectedMetric}
        metricsHistory={selectedMetrics}
        isPending={isPending}
        runAction={runAction}
        savePost={savePost}
      />
    </div>
  );
}