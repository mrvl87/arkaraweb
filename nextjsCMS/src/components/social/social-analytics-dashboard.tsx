"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, BarChart3, Download, ExternalLink } from "lucide-react";
import {
  calculateSocialMetricRates,
  calculateSocialMetricTotals,
  formatSocialRate,
  metricValue,
} from "@/lib/social/analytics";
import type { SocialCampaign, SocialPost, SocialPostMetric, SocialPublication } from "@/types/social";

interface SocialAnalyticsDashboardProps {
  campaigns: SocialCampaign[];
  posts: SocialPost[];
  metrics: SocialPostMetric[];
  publications: SocialPublication[];
  onEditPost: (post: SocialPost) => void;
}

type AnalyticsRow = {
  post: SocialPost;
  campaign: SocialCampaign | null;
  latestMetric: SocialPostMetric | null;
  latestPublication: SocialPublication | null;
};

type GroupRow = {
  label: string;
  postCount: number;
  reach: number;
  interactions: number;
  rate: number | null;
};

const ALL = "__all__";
const TIME_BUCKETS = [
  { id: ALL, label: "All Times" },
  { id: "morning", label: "Morning" },
  { id: "afternoon", label: "Afternoon" },
  { id: "evening", label: "Evening" },
  { id: "night", label: "Night" },
  { id: "unknown", label: "No Time" },
] as const;

function latestByPost<T extends { post_id: string; recorded_at?: string; published_at?: string }>(rows: T[], dateKey: "recorded_at" | "published_at") {
  const map = new Map<string, T>();
  for (const row of [...rows].sort((left, right) => {
    const leftDate = new Date(left[dateKey] ?? "").getTime();
    const rightDate = new Date(right[dateKey] ?? "").getTime();
    return rightDate - leftDate;
  })) {
    if (!map.has(row.post_id)) map.set(row.post_id, row);
  }
  return map;
}

function publishingBucket(time?: string | null) {
  if (!time) return "unknown";
  const hour = Number(time.slice(0, 2));
  if (!Number.isFinite(hour)) return "unknown";
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 22) return "evening";
  return "night";
}

function postTemplate(post: SocialPost) {
  return post.selected_template_id || post.visual_spec?.template_id || "No template";
}

function postDay(post: SocialPost) {
  if (!post.scheduled_date) return "No date";
  return new Date(`${post.scheduled_date}T00:00:00`).toLocaleDateString("id-ID", { weekday: "long" });
}

function postHour(post: SocialPost) {
  return post.scheduled_time ? post.scheduled_time.slice(0, 5) : "No time";
}

function uniqueOptions(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.map((value) => value?.trim()).filter(Boolean) as string[])).sort((a, b) => a.localeCompare(b));
}

function csvCell(value: string | number | null | undefined) {
  const text = value === null || value === undefined ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function exportCsv(rows: AnalyticsRow[]) {
  const headers = [
    "post_title",
    "campaign",
    "publish_date",
    "published_at",
    "post_type",
    "content_pillar",
    "template",
    "aspect_ratio",
    "objective",
    "reach",
    "reactions",
    "comments",
    "shares",
    "link_clicks",
    "video_views",
    "average_watch_time_seconds",
    "followers_gained",
    "metric_window_hours",
    "share_rate",
    "comment_rate",
    "click_rate",
    "interaction_rate",
    "next_action",
  ];
  const lines = rows.map(({ post, campaign, latestMetric, latestPublication }) => {
    const rates = latestMetric ? calculateSocialMetricRates(latestMetric) : null;
    return [
      post.title,
      campaign?.title ?? "",
      post.scheduled_date ?? "",
      latestPublication?.published_at ?? "",
      post.post_type,
      post.content_pillar ?? "",
      postTemplate(post),
      post.aspect_ratio,
      post.objective ?? "",
      latestMetric?.reach ?? "",
      latestMetric?.reactions ?? "",
      latestMetric?.comments ?? "",
      latestMetric?.shares ?? "",
      latestMetric?.link_clicks ?? "",
      latestMetric?.video_views ?? "",
      latestMetric?.average_watch_time_seconds ?? "",
      latestMetric?.followers_gained ?? "",
      latestMetric?.metric_window_hours ?? "",
      rates?.share_rate ?? "",
      rates?.comment_rate ?? "",
      rates?.click_rate ?? "",
      rates?.interaction_rate ?? "",
      latestMetric?.next_action ?? "",
    ].map(csvCell).join(",");
  });
  const blob = new Blob([[headers.join(","), ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `social-analytics-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function groupRows(rows: AnalyticsRow[], getLabel: (row: AnalyticsRow) => string): GroupRow[] {
  const groups = new Map<string, SocialPostMetric[]>();
  for (const row of rows) {
    if (!row.latestMetric) continue;
    const label = getLabel(row) || "N/A";
    groups.set(label, [...(groups.get(label) ?? []), row.latestMetric]);
  }

  return Array.from(groups.entries())
    .map(([label, groupMetrics]) => {
      const totals = calculateSocialMetricTotals(groupMetrics);
      return {
        label,
        postCount: totals.post_count,
        reach: totals.total_reach,
        interactions: totals.total_reactions + totals.total_comments + totals.total_shares + totals.total_link_clicks,
        rate: totals.interaction_rate,
      };
    })
    .sort((left, right) => right.reach - left.reach);
}

export function SocialAnalyticsDashboard({
  campaigns,
  posts,
  metrics,
  publications,
  onEditPost,
}: SocialAnalyticsDashboardProps) {
  const [campaignId, setCampaignId] = useState(ALL);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [postType, setPostType] = useState(ALL);
  const [pillar, setPillar] = useState(ALL);
  const [template, setTemplate] = useState(ALL);
  const [aspectRatio, setAspectRatio] = useState(ALL);
  const [publishingTime, setPublishingTime] = useState(ALL);
  const [objective, setObjective] = useState(ALL);

  const campaignById = useMemo(() => new Map(campaigns.map((campaign) => [campaign.id, campaign])), [campaigns]);
  const latestMetrics = useMemo(() => latestByPost(metrics, "recorded_at"), [metrics]);
  const latestPublications = useMemo(() => latestByPost(publications, "published_at"), [publications]);

  const filteredRows = useMemo(() => {
    return posts
      .filter((post) => {
        if (campaignId !== ALL && post.campaign_id !== campaignId) return false;
        if (startDate && (!post.scheduled_date || post.scheduled_date < startDate)) return false;
        if (endDate && (!post.scheduled_date || post.scheduled_date > endDate)) return false;
        if (postType !== ALL && post.post_type !== postType) return false;
        if (pillar !== ALL && (post.content_pillar || "") !== pillar) return false;
        if (template !== ALL && postTemplate(post) !== template) return false;
        if (aspectRatio !== ALL && post.aspect_ratio !== aspectRatio) return false;
        if (publishingTime !== ALL && publishingBucket(post.scheduled_time) !== publishingTime) return false;
        if (objective !== ALL && (post.objective || "") !== objective) return false;
        return true;
      })
      .map((post) => ({
        post,
        campaign: post.campaign_id ? campaignById.get(post.campaign_id) ?? null : null,
        latestMetric: latestMetrics.get(post.id) ?? null,
        latestPublication: latestPublications.get(post.id) ?? null,
      }));
  }, [aspectRatio, campaignById, campaignId, endDate, latestMetrics, latestPublications, objective, pillar, postType, posts, publishingTime, startDate, template]);

  const measuredRows = filteredRows.filter((row) => row.latestMetric);
  const totals = calculateSocialMetricTotals(measuredRows.map((row) => row.latestMetric!));
  const sampleTooSmall = measuredRows.length > 0 && measuredRows.length < 5;
  const topPosts = [...measuredRows]
    .sort((left, right) => metricValue(right.latestMetric?.reach) - metricValue(left.latestMetric?.reach))
    .slice(0, 8);
  const linkRows = measuredRows.filter((row) => row.post.post_type === "article_link" || Boolean(row.post.target_url));
  const recentUnreviewed = metrics
    .filter((metric) => {
      const post = posts.find((item) => item.id === metric.post_id);
      return post && (!post.metrics_done || post.status !== "reviewed");
    })
    .slice(0, 8);

  return (
    <section className="space-y-4">
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 border-b border-gray-100 pb-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-400">
              <BarChart3 className="h-4 w-4 text-arkara-amber" />
              Analytics Workspace
            </div>
            <h3 className="mt-1 text-xl font-black text-arkara-green">Manual Performance Dashboard</h3>
            <p className="mt-1 text-sm text-gray-500">Sample: {measuredRows.length} post dengan metrics dari {filteredRows.length} post terfilter.</p>
          </div>
          <button
            type="button"
            onClick={() => exportCsv(filteredRows)}
            disabled={filteredRows.length === 0}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-arkara-green px-3 py-2 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <FilterSelect label="Campaign" value={campaignId} onChange={setCampaignId} options={campaigns.map((campaign) => ({ value: campaign.id, label: campaign.title }))} />
          <FilterSelect label="Post Type" value={postType} onChange={setPostType} options={uniqueOptions(posts.map((post) => post.post_type)).map((value) => ({ value, label: value.replace(/_/g, " ") }))} />
          <FilterSelect label="Content Pillar" value={pillar} onChange={setPillar} options={uniqueOptions(posts.map((post) => post.content_pillar)).map((value) => ({ value, label: value }))} />
          <FilterSelect label="Template" value={template} onChange={setTemplate} options={uniqueOptions(posts.map(postTemplate)).map((value) => ({ value, label: value }))} />
          <FilterSelect label="Aspect Ratio" value={aspectRatio} onChange={setAspectRatio} options={uniqueOptions(posts.map((post) => post.aspect_ratio)).map((value) => ({ value, label: value }))} />
          <FilterSelect label="Publishing Time" value={publishingTime} onChange={setPublishingTime} options={TIME_BUCKETS.filter((item) => item.id !== ALL).map((item) => ({ value: item.id, label: item.label }))} />
          <FilterSelect label="Objective" value={objective} onChange={setObjective} options={uniqueOptions(posts.map((post) => post.objective)).map((value) => ({ value, label: value }))} />
          <div className="grid grid-cols-2 gap-2">
            <DateInput label="From" value={startDate} onChange={setStartDate} />
            <DateInput label="To" value={endDate} onChange={setEndDate} />
          </div>
        </div>
      </div>

      {sampleTooSmall ? (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
          <AlertTriangle className="mt-0.5 h-4 w-4" />
          Sample masih kecil. Gunakan angka ini sebagai sinyal awal, bukan kesimpulan kuat.
        </div>
      ) : null}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <Kpi label="Total Reach" value={totals.total_reach} />
        <Kpi label="Reactions" value={totals.total_reactions} />
        <Kpi label="Comments" value={totals.total_comments} />
        <Kpi label="Shares" value={totals.total_shares} />
        <Kpi label="Link Clicks" value={totals.total_link_clicks} />
        <Kpi label="Average Reach" value={totals.average_reach === null ? "N/A" : Math.round(totals.average_reach)} />
        <Kpi label="Share Rate" value={formatSocialRate(totals.share_rate)} />
        <Kpi label="Comment Rate" value={formatSocialRate(totals.comment_rate)} />
        <Kpi label="Click Rate" value={formatSocialRate(totals.click_rate)} />
        <Kpi label="Interaction Rate" value={formatSocialRate(totals.interaction_rate)} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <TopPosts rows={topPosts} onEditPost={onEditPost} />
        <RecentUnreviewed metrics={recentUnreviewed} posts={posts} onEditPost={onEditPost} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <GroupTable title="Performance by Post Type" rows={groupRows(measuredRows, (row) => row.post.post_type.replace(/_/g, " "))} />
        <GroupTable title="Performance by Content Pillar" rows={groupRows(measuredRows, (row) => row.post.content_pillar || "No pillar")} />
        <GroupTable title="Performance by Template" rows={groupRows(measuredRows, (row) => postTemplate(row.post))} />
        <GroupTable title="Performance by Day" rows={groupRows(measuredRows, (row) => postDay(row.post))} />
        <GroupTable title="Performance by Hour" rows={groupRows(measuredRows, (row) => postHour(row.post))} />
        <GroupTable title="Link Post Performance" rows={groupRows(linkRows, (row) => row.post.post_type === "article_link" ? "Article link" : "Post with URL")} />
      </div>
    </section>
  );
}

function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: Array<{ value: string; label: string }> }) {
  return (
    <label className="text-xs font-bold uppercase tracking-wide text-gray-500">
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)} className="input-social mt-1 normal-case tracking-normal">
        <option value={ALL}>All</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  );
}

function DateInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="text-xs font-bold uppercase tracking-wide text-gray-500">
      {label}
      <input type="date" value={value} onChange={(event) => onChange(event.target.value)} className="input-social mt-1 normal-case tracking-normal" />
    </label>
  );
}

function Kpi({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">{label}</div>
      <div className="mt-2 text-2xl font-black text-arkara-green">{value}</div>
    </div>
  );
}

function TopPosts({ rows, onEditPost }: { rows: AnalyticsRow[]; onEditPost: (post: SocialPost) => void }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="mb-3 text-xs font-black uppercase tracking-widest text-gray-500">Top Posts</div>
      <div className="space-y-2">
        {rows.map((row) => {
          const rates = row.latestMetric ? calculateSocialMetricRates(row.latestMetric) : null;
          return (
            <div key={row.post.id} className="grid gap-2 rounded-lg border border-gray-100 p-3 md:grid-cols-[1fr_auto]">
              <div>
                <div className="font-bold text-gray-800">{row.post.title}</div>
                <div className="mt-1 text-xs text-gray-500">Reach {metricValue(row.latestMetric?.reach)} | Interaction {formatSocialRate(rates?.interaction_rate ?? null)}</div>
              </div>
              <button type="button" onClick={() => onEditPost(row.post)} className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-black text-arkara-green hover:bg-arkara-cream">
                <ExternalLink className="h-3.5 w-3.5" />
                Open
              </button>
            </div>
          );
        })}
        {rows.length === 0 ? <EmptyState text="Belum ada metrics pada filter ini." /> : null}
      </div>
    </div>
  );
}

function RecentUnreviewed({ metrics, posts, onEditPost }: { metrics: SocialPostMetric[]; posts: SocialPost[]; onEditPost: (post: SocialPost) => void }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="mb-3 text-xs font-black uppercase tracking-widest text-gray-500">Recent Metrics Not Yet Reviewed</div>
      <div className="space-y-2">
        {metrics.map((metric) => {
          const post = posts.find((item) => item.id === metric.post_id);
          if (!post) return null;
          return (
            <button key={metric.id} type="button" onClick={() => onEditPost(post)} className="block w-full rounded-lg border border-gray-100 p-3 text-left hover:bg-gray-50">
              <div className="font-bold text-gray-800">{post.title}</div>
              <div className="mt-1 text-xs text-gray-500">Reach {metricValue(metric.reach)} | {new Date(metric.recorded_at).toLocaleString("id-ID")}</div>
            </button>
          );
        })}
        {metrics.length === 0 ? <EmptyState text="Tidak ada metrics pending review." /> : null}
      </div>
    </div>
  );
}

function GroupTable({ title, rows }: { title: string; rows: GroupRow[] }) {
  const maxReach = Math.max(...rows.map((row) => row.reach), 1);
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="mb-3 text-xs font-black uppercase tracking-widest text-gray-500">{title}</div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">
              <th className="py-2">Segment</th>
              <th className="py-2">Posts</th>
              <th className="py-2">Reach</th>
              <th className="py-2">Interaction</th>
              <th className="py-2">Rate</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-b border-gray-50">
                <td className="py-2 font-bold text-gray-700">
                  {row.label}
                  <div className="mt-1 h-1.5 rounded-full bg-gray-100">
                    <div className="h-1.5 rounded-full bg-arkara-amber" style={{ width: `${Math.max(4, (row.reach / maxReach) * 100)}%` }} />
                  </div>
                </td>
                <td className="py-2 text-gray-600">{row.postCount}</td>
                <td className="py-2 text-gray-600">{row.reach}</td>
                <td className="py-2 text-gray-600">{row.interactions}</td>
                <td className="py-2 text-gray-600">{formatSocialRate(row.rate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length === 0 ? <EmptyState text="Belum ada data untuk segment ini." /> : null}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-4 text-center text-xs font-medium text-gray-400">{text}</div>;
}
