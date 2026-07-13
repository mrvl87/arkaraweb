"use client";

import { useEffect, useMemo, useState } from "react";
import { BarChart3, Loader2, Save } from "lucide-react";
import { recordPostMetrics } from "@/app/cms/social/actions";
import { calculateSocialMetricRates, formatSocialRate, metricValue } from "@/lib/social/analytics";
import type { SocialPostMetric, SocialPublication } from "@/types/social";
import type { PostDraft, SocialActionRunner } from "./social-post-editor-types";

interface SocialMetricsPanelProps {
  post: PostDraft;
  setPost: (post: PostDraft | null) => void;
  latestMetric: SocialPostMetric | null;
  metricsHistory: SocialPostMetric[];
  publications: SocialPublication[];
  isPending: boolean;
  runAction: SocialActionRunner;
}

interface MetricsDraft {
  reach: string;
  reactions: string;
  comments: string;
  shares: string;
  link_clicks: string;
  video_views: string;
  average_watch_time_seconds: string;
  followers_gained: string;
  metric_window_hours: string;
  source: "manual" | "csv" | "screenshot";
  notes: string;
  next_action: string;
}

const EMPTY_METRICS: MetricsDraft = {
  reach: "",
  reactions: "",
  comments: "",
  shares: "",
  link_clicks: "",
  video_views: "",
  average_watch_time_seconds: "",
  followers_gained: "",
  metric_window_hours: "",
  source: "manual",
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
  metricsHistory,
  publications,
  isPending,
  runAction,
}: SocialMetricsPanelProps) {
  const [draft, setDraft] = useState<MetricsDraft>(EMPTY_METRICS);
  const latestPublication = publications[0] ?? null;
  const latestRates = latestMetric ? calculateSocialMetricRates(latestMetric) : null;
  const sortedHistory = useMemo(
    () => [...metricsHistory].sort((left, right) => new Date(right.recorded_at).getTime() - new Date(left.recorded_at).getTime()),
    [metricsHistory],
  );

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
        reactions: toNullableNumber(draft.reactions),
        comments: toNullableNumber(draft.comments),
        shares: toNullableNumber(draft.shares),
        link_clicks: toNullableNumber(draft.link_clicks),
        video_views: toNullableNumber(draft.video_views),
        average_watch_time_seconds: toNullableNumber(draft.average_watch_time_seconds),
        followers_gained: toNullableNumber(draft.followers_gained),
        metric_window_hours: toNullableNumber(draft.metric_window_hours),
        source: draft.source,
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
    <div className="space-y-5">
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="mb-4 flex flex-col gap-2 border-b border-gray-100 pb-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-500">
              <BarChart3 className="h-4 w-4 text-arkara-amber" />
              Metrics Entry
            </div>
            <p className="mt-1 text-xs text-gray-400">
              Simpan metrics akan menandai post sebagai reviewed.
            </p>
          </div>
          {latestMetric ? (
            <div className="rounded-lg bg-green-50 px-3 py-2 text-xs font-bold text-green-700">
              Last: reach {latestMetric.reach ?? 0}, reactions {latestMetric.reactions ?? 0}, comments {latestMetric.comments ?? 0}, shares {latestMetric.shares ?? 0}, clicks {latestMetric.link_clicks ?? 0}
            </div>
          ) : null}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <MetricInput label="Reach" value={draft.reach} onChange={(value) => updateDraft("reach", value)} disabled={isPending} />
          <MetricInput label="Reactions" value={draft.reactions} onChange={(value) => updateDraft("reactions", value)} disabled={isPending} />
          <MetricInput label="Comments" value={draft.comments} onChange={(value) => updateDraft("comments", value)} disabled={isPending} />
          <MetricInput label="Shares" value={draft.shares} onChange={(value) => updateDraft("shares", value)} disabled={isPending} />
          <MetricInput label="Link Clicks" value={draft.link_clicks} onChange={(value) => updateDraft("link_clicks", value)} disabled={isPending} />
          <MetricInput label="Video Views" value={draft.video_views} onChange={(value) => updateDraft("video_views", value)} disabled={isPending} />
          <MetricInput label="Avg Watch Sec" value={draft.average_watch_time_seconds} onChange={(value) => updateDraft("average_watch_time_seconds", value)} disabled={isPending} step="0.1" />
          <MetricInput label="Followers Gained" value={draft.followers_gained} onChange={(value) => updateDraft("followers_gained", value)} disabled={isPending} />
          <MetricInput label="Window Hours" value={draft.metric_window_hours} onChange={(value) => updateDraft("metric_window_hours", value)} disabled={isPending} min="1" />
          <label className="block text-xs font-bold uppercase tracking-wide text-gray-500">
            Source
            <select
              value={draft.source}
              onChange={(event) => updateDraft("source", event.target.value)}
              disabled={isPending}
              className="input-social mt-1 normal-case tracking-normal disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="manual">Manual</option>
              <option value="csv">CSV</option>
              <option value="screenshot">Screenshot</option>
            </select>
          </label>
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

      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="mb-3 text-xs font-black uppercase tracking-widest text-gray-500">Per-Post Analytics</div>
        <div className="grid gap-3 md:grid-cols-4">
          <MetricInfo label="Latest Reach" value={latestMetric ? metricValue(latestMetric.reach) : "N/A"} />
          <MetricInfo label="Share Rate" value={formatSocialRate(latestRates?.share_rate ?? null)} />
          <MetricInfo label="Comment Rate" value={formatSocialRate(latestRates?.comment_rate ?? null)} />
          <MetricInfo label="Click Rate" value={formatSocialRate(latestRates?.click_rate ?? null)} />
          <MetricInfo label="Interaction Rate" value={formatSocialRate(latestRates?.interaction_rate ?? null)} />
          <MetricInfo label="Publication" value={latestPublication ? new Date(latestPublication.published_at).toLocaleString("id-ID") : "N/A"} />
          <MetricInfo label="Next Action" value={latestMetric?.next_action || "N/A"} />
          <MetricInfo label="Editor Notes" value={latestMetric?.notes || post.notes || "N/A"} />
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">
                <th className="py-2">Recorded</th>
                <th className="py-2">Reach</th>
                <th className="py-2">React</th>
                <th className="py-2">Comment</th>
                <th className="py-2">Share</th>
                <th className="py-2">Click</th>
                <th className="py-2">Interaction</th>
                <th className="py-2">Source</th>
              </tr>
            </thead>
            <tbody>
              {sortedHistory.map((metric) => {
                const rates = calculateSocialMetricRates(metric);
                return (
                  <tr key={metric.id} className="border-b border-gray-50">
                    <td className="py-2 text-gray-600">{new Date(metric.recorded_at).toLocaleString("id-ID")}</td>
                    <td className="py-2 text-gray-600">{metricValue(metric.reach)}</td>
                    <td className="py-2 text-gray-600">{metricValue(metric.reactions)}</td>
                    <td className="py-2 text-gray-600">{metricValue(metric.comments)}</td>
                    <td className="py-2 text-gray-600">{metricValue(metric.shares)}</td>
                    <td className="py-2 text-gray-600">{metricValue(metric.link_clicks)}</td>
                    <td className="py-2 text-gray-600">{formatSocialRate(rates.interaction_rate)}</td>
                    <td className="py-2 text-gray-600">{metric.source}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {sortedHistory.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-4 text-center text-xs font-medium text-gray-400">
              Belum ada metrics history.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function MetricInput({
  label,
  value,
  onChange,
  disabled,
  min = "0",
  step = "1",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  min?: string;
  step?: string;
}) {
  return (
    <label className="block text-xs font-bold uppercase tracking-wide text-gray-500">
      {label}
      <input
        type="number"
        min={min}
        step={step}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className="input-social mt-1 normal-case tracking-normal disabled:cursor-not-allowed disabled:opacity-60"
      />
    </label>
  );
}

function MetricInfo({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg bg-gray-50 px-3 py-2">
      <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">{label}</div>
      <div className="mt-1 break-words text-sm font-bold text-gray-700">{value}</div>
    </div>
  );
}