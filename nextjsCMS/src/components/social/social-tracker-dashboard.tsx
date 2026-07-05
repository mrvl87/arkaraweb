"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Bot,
  CalendarDays,
  Clipboard,
  Copy,
  Loader2,
  Megaphone,
  Plus,
  Save,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import {
  createCampaign,
  createCarouselSlide,
  createExampleSocialCampaign,
  createSocialPost,
  deleteCarouselSlide,
  deleteCampaign,
  deleteSocialPost,
  generateFacebookCarouselSlides,
  generateFacebookPostDraft,
  generateFacebookVisualPromptForPost,
  updateCarouselSlide,
  updateCampaign,
  updateSocialPost,
} from "@/app/cms/social/actions";
import type {
  SocialCarouselSlide,
  SocialDashboardData,
  SocialPost,
} from "@/types/social";
import { SocialAIPlanPanel } from "./social-ai-plan-panel";
import { SocialCampaignList } from "./social-campaign-list";
import { SocialCampaignSettings } from "./social-campaign-settings";
import { SocialCampaignHeader } from "./social-campaign-header";
import { SocialWeeklyPostCard } from "./social-weekly-post-card";
import {
  DAY_LABELS,
  buildCaption,
  getPostDayIndex,
  todayDate,
} from "./social-utils";

interface SocialTrackerDashboardProps {
  initialData: SocialDashboardData;
}

type PostDraft = Omit<
  SocialPost,
  "id" | "user_id" | "created_at" | "updated_at"
> & {
  id?: string;
};


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
  const [selectedSourceForPlan, setSelectedSourceForPlan] = useState("");
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

  const progressText = activeCampaign
    ? `${posts.length || 0} weekly cards`
    : "Belum ada campaign";

  const runAction = (
    task: () => Promise<{
      error?: string;
      success?: boolean;
      summary?: string;
    }>,
  ) => {
    setError(null);
    setInfo(null);
    startTransition(async () => {
      const result = await task();
      if (result?.error) {
        setError(result.error);
        return;
      }
      if (result?.summary) setInfo(result.summary);
      router.refresh();
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

  const savePost = () => {
    if (!selectedPost) return;
    runAction(async () => {
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
        objective: selectedPost.objective ?? "",
        content_pillar: selectedPost.content_pillar ?? "",
        notes: selectedPost.notes ?? "",
      };

      const result = selectedPost.id
        ? await updateSocialPost(payload)
        : await createSocialPost(payload);

      if (!result.error) setSelectedPost(null);
      return result;
    });
  };

  const copyCaption = async (post: PostDraft | SocialPost) => {
    await navigator.clipboard.writeText(buildCaption(post));
  };

  const selectedSlides = selectedPost?.id
    ? (slidesByPost.get(selectedPost.id) ?? [])
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

        <SocialAIPlanPanel
          sources={initialData.sources}
          selectedSourceForPlan={selectedSourceForPlan}
          onSelectedSourceForPlanChange={setSelectedSourceForPlan}
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
        <div className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex flex-col gap-2 border-b border-gray-100 pb-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-400">
                  <CalendarDays className="h-4 w-4 text-arkara-amber" />
                  Weekly Facebook Cards
                </div>
                <h3 className="mt-1 text-xl font-black text-arkara-green">
                  Senin sampai Minggu
                </h3>
              </div>
              <p className="max-w-md text-sm text-gray-500">
                Check biru disimpan lokal. Saat diklik, warnanya berubah abu-abu
                sebagai tanda post sudah dibuat di Facebook.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-7">
              {DAY_LABELS.map((day, index) => {
                const dayPosts = weekPosts.filter(
                  (post) => getPostDayIndex(post) === index,
                );
                return (
                  <div
                    key={day}
                    className="min-h-[220px] rounded-xl border border-gray-200 bg-gray-50 p-3"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <h4 className="text-sm font-black uppercase tracking-widest text-arkara-green">
                        {day}
                      </h4>
                      <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-gray-400">
                        {dayPosts.length}
                      </span>
                    </div>
                    <div className="space-y-3">
                      {dayPosts.map((post) => (
                        <SocialWeeklyPostCard
                          key={post.id}
                          post={post}
                          onEdit={() => setSelectedPost(post)}
                        />
                      ))}
                      {dayPosts.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-gray-200 bg-white p-4 text-center text-xs font-medium text-gray-400">
                          Belum ada post
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <PostEditor
        post={selectedPost}
        setPost={setSelectedPost}
        slides={selectedSlides}
        sources={initialData.sources}
        isPending={isPending}
        runAction={runAction}
        savePost={savePost}
        copyCaption={copyCaption}
      />
    </div>
  );
}

interface PostEditorProps {
  post: PostDraft | null;
  setPost: (post: PostDraft | null) => void;
  slides: SocialCarouselSlide[];
  sources: SocialDashboardData["sources"];
  isPending: boolean;
  runAction: (
    task: () => Promise<{
      error?: string;
      success?: boolean;
      summary?: string;
    }>,
  ) => void;
  savePost: () => void;
  copyCaption: (post: PostDraft | SocialPost) => Promise<void>;
}

function PostEditor({
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

          <Field label="Internal Title">
            <input
              value={post.title}
              onChange={(event) => update("title", event.target.value)}
              className="input-social"
            />
          </Field>
          <Field label="Short Caption">
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
          </Field>

          <Field label="Target URL">
            <input
              value={post.target_url ?? ""}
              onChange={(event) => update("target_url", event.target.value)}
              className="input-social"
            />
          </Field>
          <Field label="Text-to-Image Prompt">
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
          </Field>

          {post.post_type === "carousel" ? (
            <CarouselEditor post={post} slides={slides} runAction={runAction} />
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

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-black uppercase tracking-widest text-gray-400">
        {label}
      </span>
      {children}
    </label>
  );
}

function CarouselEditor({
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
          <SlideEditor key={slide.id} slide={slide} runAction={runAction} />
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

function SlideEditor({
  slide,
  runAction,
}: {
  slide: SocialCarouselSlide;
  runAction: (
    task: () => Promise<{
      error?: string;
      success?: boolean;
      summary?: string;
    }>,
  ) => void;
}) {
  const [draft, setDraft] = useState(slide);
  const copyPrompt = async () => {
    if (!draft.visual_prompt) return;
    await navigator.clipboard.writeText(draft.visual_prompt);
  };

  return (
    <div className="rounded-lg bg-gray-50 p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-black text-gray-500">
          Slide {draft.slide_number}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={copyPrompt}
            disabled={!draft.visual_prompt}
            className="rounded-md px-2 py-1 text-xs font-bold text-arkara-green hover:bg-white disabled:text-gray-300"
          >
            Copy Prompt
          </button>
          <button
            type="button"
            onClick={() => {
              const confirmed = window.confirm(
                `Hapus Slide ${draft.slide_number}?`,
              );
              if (!confirmed) return;

              runAction(() => deleteCarouselSlide(draft.id));
            }}
            className="text-red-500"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      <input
        value={draft.title_text}
        onChange={(event) =>
          setDraft({ ...draft, title_text: event.target.value })
        }
        className="input-social"
      />
      <textarea
        value={draft.paragraph_text ?? ""}
        onChange={(event) =>
          setDraft({ ...draft, paragraph_text: event.target.value })
        }
        rows={2}
        className="input-social mt-2"
      />
      <textarea
        value={draft.visual_prompt ?? ""}
        onChange={(event) =>
          setDraft({ ...draft, visual_prompt: event.target.value })
        }
        rows={3}
        className="input-social mt-2 font-mono text-xs"
      />
      <button
        type="button"
        onClick={() =>
          runAction(() =>
            updateCarouselSlide({
              id: draft.id,
              post_id: draft.post_id,
              slide_number: draft.slide_number,
              title_text: draft.title_text,
              paragraph_text: draft.paragraph_text ?? "",
              visual_prompt: draft.visual_prompt ?? "",
              image_status: draft.image_status,
            }),
          )
        }
        className="mt-2 rounded-lg bg-white px-3 py-2 text-xs font-black text-arkara-green"
      >
        Save Slide
      </button>
    </div>
  );
}
