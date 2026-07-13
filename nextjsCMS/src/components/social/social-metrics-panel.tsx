"use client";

import { useEffect, useState } from "react";
import { BarChart3, Loader2, Save } from "lucide-react";
import { recordPostMetrics } from "@/app/cms/social/actions";
import type { SocialPostMetric } from "@/types/social";
import type { PostDraft, SocialActionRunner } from "./social-post-editor-types";

interface SocialMetricsPanelProps {
  post: PostDraft;
  setPost: (post: PostDraft | null) => void;
  latestMetric: SocialPostMetric | null;
  isPending: boolean;
  runAction: SocialActionRunner;
}

interface MetricsDraft {
  reach: string;
  comments: string;
  shares: string;
  link_clicks: string;
  notes: string;
  next_action: string;
}

const EMPTY_METRICS: MetricsDraft = {
  reach: "",
  comments: "",
  shares: "",
  link_clicks: "",
  notes: "",
  next_action: "",
};

function toNullableNumber(value: string) {
  const trimmed = value.trim();
  return trimmed ? Number(trimmed) : null;
}

export function SocialMetricsPanel({
  post,
  setPost,
  latestMetric,
  isPending,
  runAction,
}: SocialMetricsPanelProps) {
  const [draft, setDraft] = useState<MetricsDraft>(EMPTY_METRICS);

  useEffect(() => {
    setDraft(EMPTY_METRICS);
  }, [post.id]);

  if (!post.id) {
    return (
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm font-medium text-gray-400">
        Simpan post dulu sebelum memasukkan metrics.
      </div>
    );
  }

  const updateDraft = (key: keyof MetricsDraft, value: string) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const saveMetrics = async () => {
    const result = await runAction(() =>
      recordPostMetrics({
        post_id: post.id!,
        reach: toNullableNumber(draft.reach),
        comments: toNullableNumber(draft.comments),
        shares: toNullableNumber(draft.shares),
        link_clicks: toNullableNumber(draft.link_clicks),
        notes: draft.notes,
        next_action: draft.next_action,
      }),
    );

    if (!result.error) {
      setPost({ ...post, metrics_done: true, status: "reviewed" });
      setDraft(EMPTY_METRICS);
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="mb-4 flex flex-col gap-2 border-b border-gray-100 pb-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-500">
            <BarChart3 className="h-4 w-4 text-arkara-amber" />
            Metrics
          </div>
          <p className="mt-1 text-xs text-gray-400">
            Simpan metrics akan menandai post sebagai reviewed.
          </p>
        </div>
        {latestMetric ? (
          <div className="rounded-lg bg-green-50 px-3 py-2 text-xs font-bold text-green-700">
            Last: reach {latestMetric.reach ?? 0}, comments {latestMetric.comments ?? 0}, shares {latestMetric.shares ?? 0}, clicks {latestMetric.link_clicks ?? 0}
          </div>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <MetricInput label="Reach" value={draft.reach} onChange={(value) => updateDraft("reach", value)} disabled={isPending} />
        <MetricInput label="Comments" value={draft.comments} onChange={(value) => updateDraft("comments", value)} disabled={isPending} />
        <MetricInput label="Shares" value={draft.shares} onChange={(value) => updateDraft("shares", value)} disabled={isPending} />
        <MetricInput label="Link clicks" value={draft.link_clicks} onChange={(value) => updateDraft("link_clicks", value)} disabled={isPending} />
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="block text-xs font-bold uppercase tracking-wide text-gray-500">
          Notes
          <textarea
            value={draft.notes}
            onChange={(event) => updateDraft("notes", event.target.value)}
            rows={3}
            disabled={isPending}
            className="input-social mt-1 normal-case tracking-normal disabled:cursor-not-allowed disabled:opacity-60"
          />
        </label>
        <label className="block text-xs font-bold uppercase tracking-wide text-gray-500">
          Next Action
          <textarea
            value={draft.next_action}
            onChange={(event) => updateDraft("next_action", event.target.value)}
            rows={3}
            disabled={isPending}
            className="input-social mt-1 normal-case tracking-normal disabled:cursor-not-allowed disabled:opacity-60"
          />
        </label>
      </div>

      <button
        type="button"
        onClick={saveMetrics}
        disabled={isPending}
        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-arkara-green px-3 py-2.5 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Save Metrics
      </button>
    </div>
  );
}

function MetricInput({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}) {
  return (
    <label className="block text-xs font-bold uppercase tracking-wide text-gray-500">
      {label}
      <input
        type="number"
        min="0"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className="input-social mt-1 normal-case tracking-normal disabled:cursor-not-allowed disabled:opacity-60"
      />
    </label>
  );
}