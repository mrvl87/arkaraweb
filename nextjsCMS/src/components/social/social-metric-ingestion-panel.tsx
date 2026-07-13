"use client";

import { useMemo, useState } from "react";
import { FileSpreadsheet, ImageUp, Loader2, Save, Upload } from "lucide-react";
import {
  confirmSocialCsvMetricImport,
  confirmSocialScreenshotMetrics,
  extractSocialScreenshotMetrics,
} from "@/app/cms/social/actions";
import {
  buildCsvMetricImportPreview,
  parseSocialMetricsCsv,
  type CsvMetricColumnMapping,
  type CsvMetricImportPreviewRow,
} from "@/lib/social/metric-ingestion";
import type { SocialCampaign, SocialMetricImport, SocialPost, SocialPublication } from "@/types/social";
import type { SocialActionRunner } from "./social-post-editor-types";

interface SocialMetricIngestionPanelProps {
  activeCampaign: SocialCampaign | null;
  posts: SocialPost[];
  publications: SocialPublication[];
  metricImports: SocialMetricImport[];
  isPending: boolean;
  runAction: SocialActionRunner;
}

const CSV_MAX_BYTES = 1024 * 1024;
const EMPTY_MAPPING: CsvMetricColumnMapping = {};

interface ScreenshotDraft {
  postId: string;
  reach: string;
  reactions: string;
  comments: string;
  shares: string;
  link_clicks: string;
  video_views: string;
  captured_date: string;
  confidence: number;
  notes: string;
  metadata: Record<string, unknown>;
}

function nullableNumber(value: string) {
  const trimmed = value.trim();
  return trimmed ? Number(trimmed) : null;
}

function previewStatusLabel(row: CsvMetricImportPreviewRow) {
  if (row.errors.length) return "error";
  return row.match_status.replace("_", " ");
}

export function SocialMetricIngestionPanel({
  activeCampaign,
  posts,
  publications,
  metricImports,
  isPending,
  runAction,
}: SocialMetricIngestionPanelProps) {
  const [csvFileName, setCsvFileName] = useState("");
  const [csvErrors, setCsvErrors] = useState<string[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [rows, setRows] = useState<Array<Record<string, string>>>([]);
  const [mapping, setMapping] = useState<CsvMetricColumnMapping>(EMPTY_MAPPING);
  const [selectedRows, setSelectedRows] = useState<Record<number, boolean>>({});
  const [manualPosts, setManualPosts] = useState<Record<number, string>>({});
  const [screenshotPostId, setScreenshotPostId] = useState("");
  const [screenshotDraft, setScreenshotDraft] = useState<ScreenshotDraft | null>(null);

  const previewRows = useMemo(() => buildCsvMetricImportPreview({
    rows,
    mapping,
    posts: posts.map((post) => ({ id: post.id, title: post.title, scheduled_date: post.scheduled_date })),
    publications: publications.map((publication) => ({
      id: publication.id,
      post_id: publication.post_id,
      facebook_url: publication.facebook_url,
      published_at: publication.published_at,
    })),
  }), [mapping, posts, publications, rows]);

  const visiblePreviewRows = previewRows.slice(0, 20);
  const latestImports = metricImports.slice(0, 5);

  const readCsv = async (file: File | null) => {
    setCsvErrors([]);
    setRows([]);
    setColumns([]);
    setSelectedRows({});
    setManualPosts({});
    if (!file) return;
    if (file.size > CSV_MAX_BYTES) {
      setCsvErrors(["CSV maksimal 1 MB."]);
      return;
    }
    if (file.type && !["text/csv", "application/vnd.ms-excel", "text/plain"].includes(file.type) && !file.name.toLowerCase().endsWith(".csv")) {
      setCsvErrors(["File harus CSV atau text."]);
      return;
    }

    const text = await file.text();
    const parsed = parseSocialMetricsCsv(text);
    setCsvFileName(file.name);
    setColumns(parsed.columns);
    setRows(parsed.rows);
    setCsvErrors(parsed.errors.slice(0, 8));
  };

  const updateMapping = (key: keyof CsvMetricColumnMapping, value: string) => {
    setMapping((current) => ({ ...current, [key]: value || undefined }));
  };

  const confirmCsv = async () => {
    const confirmedRows = previewRows
      .filter((row) => selectedRows[row.row_index])
      .map((row) => ({
        row,
        postId: manualPosts[row.row_index] || row.matched_post_id,
      }))
      .filter((item) => item.postId && item.row.errors.length === 0);

    if (confirmedRows.length === 0) {
      setCsvErrors(["Pilih dan confirm minimal satu row dengan match yang jelas."]);
      return;
    }

    await runAction(() => confirmSocialCsvMetricImport({
      campaign_id: activeCampaign?.id ?? null,
      file_name: csvFileName,
      row_count: rows.length,
      skipped_count: rows.length - confirmedRows.length,
      error_summary: {
        parser_errors: csvErrors,
        ambiguous_rows: previewRows.filter((row) => row.match_status === "ambiguous" && !selectedRows[row.row_index]).length,
        unmatched_rows: previewRows.filter((row) => row.match_status === "unmatched" && !selectedRows[row.row_index]).length,
      },
      rows: confirmedRows.map(({ row, postId }) => ({
        post_id: postId!,
        row_index: row.row_index,
        reach: row.values.reach,
        reactions: row.values.reactions,
        comments: row.values.comments,
        shares: row.values.shares,
        link_clicks: row.values.link_clicks,
        video_views: row.values.video_views,
        published_date: row.values.published_date ?? "",
        post_url: row.values.post_url ?? "",
        title: row.values.title ?? "",
        match_reason: manualPosts[row.row_index] ? "manual_confirmed" : row.match_reason,
      })),
    }));
  };

  const extractScreenshot = async (file: File | null) => {
    if (!file || !screenshotPostId) return;
    const formData = new FormData();
    formData.set("post_id", screenshotPostId);
    formData.set("file", file);
    const result = await runAction(() => extractSocialScreenshotMetrics(formData));
    if (result.error || !result.draft) return;
    setScreenshotDraft({
      postId: screenshotPostId,
      reach: result.draft.reach == null ? "" : String(result.draft.reach),
      reactions: result.draft.reactions == null ? "" : String(result.draft.reactions),
      comments: result.draft.comments == null ? "" : String(result.draft.comments),
      shares: result.draft.shares == null ? "" : String(result.draft.shares),
      link_clicks: result.draft.link_clicks == null ? "" : String(result.draft.link_clicks),
      video_views: result.draft.video_views == null ? "" : String(result.draft.video_views),
      captured_date: result.draft.captured_date ?? "",
      confidence: result.draft.confidence ?? 0,
      notes: result.draft.notes ?? "",
      metadata: result.metadata ?? {},
    });
  };

  const confirmScreenshot = async () => {
    if (!screenshotDraft) return;
    const result = await runAction(() => confirmSocialScreenshotMetrics({
      post_id: screenshotDraft.postId,
      reach: nullableNumber(screenshotDraft.reach),
      reactions: nullableNumber(screenshotDraft.reactions),
      comments: nullableNumber(screenshotDraft.comments),
      shares: nullableNumber(screenshotDraft.shares),
      link_clicks: nullableNumber(screenshotDraft.link_clicks),
      video_views: nullableNumber(screenshotDraft.video_views),
      source: "screenshot",
      captured_date: screenshotDraft.captured_date,
      confidence: screenshotDraft.confidence,
      extraction_metadata: screenshotDraft.metadata,
      notes: screenshotDraft.notes,
      next_action: "",
    }));
    if (!result.error) setScreenshotDraft(null);
  };

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center gap-2 border-b border-gray-100 pb-3 text-xs font-black uppercase tracking-widest text-gray-400">
        <Upload className="h-4 w-4 text-arkara-amber" />
        Metrics Ingestion
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
          <div className="mb-3 flex items-center gap-2 text-sm font-black text-arkara-green">
            <FileSpreadsheet className="h-4 w-4" />
            CSV Import
          </div>
          <input type="file" accept=".csv,text/csv,text/plain" disabled={isPending} onChange={(event) => readCsv(event.target.files?.[0] ?? null)} className="block w-full text-sm text-gray-600" />

          {columns.length > 0 ? (
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              <ColumnSelect label="Reach" value={mapping.reach ?? ""} columns={columns} onChange={(value) => updateMapping("reach", value)} />
              <ColumnSelect label="Reactions" value={mapping.reactions ?? ""} columns={columns} onChange={(value) => updateMapping("reactions", value)} />
              <ColumnSelect label="Comments" value={mapping.comments ?? ""} columns={columns} onChange={(value) => updateMapping("comments", value)} />
              <ColumnSelect label="Shares" value={mapping.shares ?? ""} columns={columns} onChange={(value) => updateMapping("shares", value)} />
              <ColumnSelect label="Clicks" value={mapping.link_clicks ?? ""} columns={columns} onChange={(value) => updateMapping("link_clicks", value)} />
              <ColumnSelect label="Video Views" value={mapping.video_views ?? ""} columns={columns} onChange={(value) => updateMapping("video_views", value)} />
              <ColumnSelect label="Published Date" value={mapping.published_date ?? ""} columns={columns} onChange={(value) => updateMapping("published_date", value)} />
              <ColumnSelect label="Post URL" value={mapping.post_url ?? ""} columns={columns} onChange={(value) => updateMapping("post_url", value)} />
              <ColumnSelect label="Title" value={mapping.title ?? ""} columns={columns} onChange={(value) => updateMapping("title", value)} />
            </div>
          ) : null}

          {csvErrors.length > 0 ? <div className="mt-3 rounded-lg bg-amber-50 p-2 text-xs font-semibold text-amber-800">{csvErrors.join(" | ")}</div> : null}

          {visiblePreviewRows.length > 0 ? (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[820px] text-xs">
                <thead>
                  <tr className="text-left font-black uppercase tracking-widest text-gray-400">
                    <th className="py-2">Confirm</th>
                    <th>Match</th>
                    <th>Post</th>
                    <th>Reach</th>
                    <th>React</th>
                    <th>Comment</th>
                    <th>Share</th>
                    <th>Click</th>
                  </tr>
                </thead>
                <tbody>
                  {visiblePreviewRows.map((row) => (
                    <tr key={row.row_index} className="border-t border-gray-100">
                      <td className="py-2"><input type="checkbox" checked={Boolean(selectedRows[row.row_index])} onChange={(event) => setSelectedRows((current) => ({ ...current, [row.row_index]: event.target.checked }))} /></td>
                      <td className="font-bold text-gray-600">{previewStatusLabel(row)}</td>
                      <td>
                        <select value={manualPosts[row.row_index] || row.matched_post_id || ""} onChange={(event) => setManualPosts((current) => ({ ...current, [row.row_index]: event.target.value }))} className="input-social py-1 text-xs">
                          <option value="">No match</option>
                          {posts.map((post) => <option key={post.id} value={post.id}>{post.title}</option>)}
                        </select>
                      </td>
                      <td>{row.values.reach ?? ""}</td>
                      <td>{row.values.reactions ?? ""}</td>
                      <td>{row.values.comments ?? ""}</td>
                      <td>{row.values.shares ?? ""}</td>
                      <td>{row.values.link_clicks ?? ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button type="button" onClick={confirmCsv} disabled={isPending} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-arkara-green px-3 py-2 text-sm font-black text-white disabled:opacity-50">
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Confirm Selected CSV Rows
              </button>
            </div>
          ) : null}
        </div>

        <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
          <div className="mb-3 flex items-center gap-2 text-sm font-black text-arkara-green">
            <ImageUp className="h-4 w-4" />
            Screenshot Extraction
          </div>
          <select value={screenshotPostId} onChange={(event) => setScreenshotPostId(event.target.value)} className="input-social mb-2">
            <option value="">Pilih post</option>
            {posts.map((post) => <option key={post.id} value={post.id}>{post.title}</option>)}
          </select>
          <input type="file" accept="image/png,image/jpeg,image/webp" disabled={isPending || !screenshotPostId} onChange={(event) => extractScreenshot(event.target.files?.[0] ?? null)} className="block w-full text-sm text-gray-600" />

          {screenshotDraft ? (
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              <MetricDraftInput label="Reach" value={screenshotDraft.reach} onChange={(value) => setScreenshotDraft({ ...screenshotDraft, reach: value })} />
              <MetricDraftInput label="Reactions" value={screenshotDraft.reactions} onChange={(value) => setScreenshotDraft({ ...screenshotDraft, reactions: value })} />
              <MetricDraftInput label="Comments" value={screenshotDraft.comments} onChange={(value) => setScreenshotDraft({ ...screenshotDraft, comments: value })} />
              <MetricDraftInput label="Shares" value={screenshotDraft.shares} onChange={(value) => setScreenshotDraft({ ...screenshotDraft, shares: value })} />
              <MetricDraftInput label="Link Clicks" value={screenshotDraft.link_clicks} onChange={(value) => setScreenshotDraft({ ...screenshotDraft, link_clicks: value })} />
              <MetricDraftInput label="Video Views" value={screenshotDraft.video_views} onChange={(value) => setScreenshotDraft({ ...screenshotDraft, video_views: value })} />
              <label className="text-xs font-bold uppercase tracking-wide text-gray-500 md:col-span-2">
                Captured Date
                <input value={screenshotDraft.captured_date} onChange={(event) => setScreenshotDraft({ ...screenshotDraft, captured_date: event.target.value })} className="input-social mt-1 normal-case" />
              </label>
              <div className="rounded-lg bg-white p-2 text-xs font-semibold text-gray-500 md:col-span-2">Confidence: {Math.round(screenshotDraft.confidence * 100)}%. Confirm only after checking the numbers.</div>
              <button type="button" onClick={confirmScreenshot} disabled={isPending} className="inline-flex items-center justify-center gap-2 rounded-lg bg-arkara-green px-3 py-2 text-sm font-black text-white disabled:opacity-50 md:col-span-2">
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Confirm Screenshot Metrics
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {latestImports.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2 text-xs text-gray-500">
          {latestImports.map((item) => <span key={item.id} className="rounded-full bg-gray-100 px-3 py-1 font-bold">{item.source}: {item.imported_count}/{item.row_count} rows</span>)}
        </div>
      ) : null}
    </section>
  );
}

function ColumnSelect({ label, value, columns, onChange }: { label: string; value: string; columns: string[]; onChange: (value: string) => void }) {
  return (
    <label className="text-xs font-bold uppercase tracking-wide text-gray-500">
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)} className="input-social mt-1 normal-case">
        <option value="">Ignore</option>
        {columns.map((column) => <option key={column} value={column}>{column}</option>)}
      </select>
    </label>
  );
}

function MetricDraftInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="text-xs font-bold uppercase tracking-wide text-gray-500">
      {label}
      <input type="number" min="0" value={value} onChange={(event) => onChange(event.target.value)} className="input-social mt-1 normal-case" />
    </label>
  );
}
