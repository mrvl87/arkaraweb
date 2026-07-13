"use client";

import { useEffect, useMemo, useState } from "react";
import { Bot, Check, Loader2, Sparkles, Wand2, X } from "lucide-react";
import {
  createSelectedContentMapPosts,
  generateFacebookContentMapForCampaign,
  generateWeeklyFacebookPlan,
} from "@/app/cms/social/actions";
import {
  CONTENT_DERIVATIVE_POST_TYPES,
  SOCIAL_STRATEGY_PRESET_IDS,
  SOCIAL_STRATEGY_PRESETS,
  type SocialStrategyPresetId,
} from "@/lib/social/strategy-presets";
import type { SocialCampaign, SocialDashboardData, SocialPostType } from "@/types/social";
import type { SocialActionRunner } from "./social-post-editor-types";

interface ContentMapItemDraft {
  selected: boolean;
  title: string;
  angle: string;
  post_type: SocialPostType;
  objective: string;
  audience_action: string;
  source_reference: string;
  suggested_publishing_order: number;
  hook_direction: string;
  visual_direction: string;
  estimated_production_complexity: "low" | "medium" | "high";
}

interface ContentMapState {
  strategy_summary: string;
  audience_hypothesis: string;
  central_narrative: string;
  relationship_between_items: string;
  proposed_content_items: ContentMapItemDraft[];
}

interface SimilarityWarning {
  title: string;
  matchedPostId: string;
  matchedTitle: string;
  similarity: number;
}

interface SocialStrategyEnginePanelProps {
  sources: SocialDashboardData["sources"];
  activeCampaign: SocialCampaign | null;
  isPending: boolean;
  runAction: SocialActionRunner;
}

function sourceKey(source: SocialDashboardData["sources"][number]) {
  return `${source.type}:${source.id}`;
}

export function SocialStrategyEnginePanel({
  sources,
  activeCampaign,
  isPending,
  runAction,
}: SocialStrategyEnginePanelProps) {
  const [strategyId, setStrategyId] = useState<SocialStrategyPresetId>("balanced_week");
  const [selectedSourceKeys, setSelectedSourceKeys] = useState<string[]>([]);
  const [desiredCount, setDesiredCount] = useState(7);
  const [startDate, setStartDate] = useState(activeCampaign?.start_date ?? "");
  const [endDate, setEndDate] = useState(activeCampaign?.end_date ?? "");
  const [editorNotes, setEditorNotes] = useState("");
  const [previousSummary, setPreviousSummary] = useState("");
  const [contentMap, setContentMap] = useState<ContentMapState | null>(null);
  const [warnings, setWarnings] = useState<SimilarityWarning[]>([]);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const preset = SOCIAL_STRATEGY_PRESETS[strategyId];
  const isClassic = strategyId === "classic_weekly";
  const selectedCount = contentMap?.proposed_content_items.filter((item) => item.selected).length ?? 0;

  useEffect(() => {
    if (!activeCampaign) return;
    setStartDate(activeCampaign.start_date);
    setEndDate(activeCampaign.end_date ?? "");
    setContentMap(null);
    setWarnings([]);
  }, [activeCampaign?.id, activeCampaign?.start_date, activeCampaign?.end_date]);

  const warningByTitle = useMemo(() => {
    const map = new Map<string, SimilarityWarning>();
    warnings.forEach((warning) => map.set(warning.title, warning));
    return map;
  }, [warnings]);

  const toggleSource = (key: string) => {
    setSelectedSourceKeys((current) =>
      current.includes(key) ? current.filter((item) => item !== key) : [...current, key],
    );
  };

  const updateItem = <K extends keyof ContentMapItemDraft>(
    index: number,
    key: K,
    value: ContentMapItemDraft[K],
  ) => {
    setContentMap((current) => {
      if (!current) return current;
      const nextItems = current.proposed_content_items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: value } : item,
      );
      return { ...current, proposed_content_items: nextItems };
    });
  };

  const generateContentMap = async () => {
    if (!activeCampaign) return;
    setLocalError(null);

    if (isClassic) {
      await runAction(() => generateWeeklyFacebookPlan(activeCampaign.id, selectedSourceKeys[0]));
      return;
    }

    if (selectedSourceKeys.length === 0) {
      setLocalError("Pilih minimal satu source.");
      return;
    }

    setIsGenerating(true);
    try {
      const result = await generateFacebookContentMapForCampaign({
        campaign_id: activeCampaign.id,
        strategy_id: strategyId,
        source_keys: selectedSourceKeys,
        desired_count: desiredCount,
        start_date: startDate || activeCampaign.start_date,
        end_date: endDate || activeCampaign.end_date || "",
        editor_notes: editorNotes,
        previous_campaign_summary: previousSummary,
      });

      if (result.error) {
        setLocalError(result.error);
        return;
      }

      if (result.contentMap) {
        setContentMap({
          ...result.contentMap,
          proposed_content_items: result.contentMap.proposed_content_items.map((item) => ({
            ...item,
            selected: true,
          })),
        });
        setWarnings(result.similarityWarnings ?? []);
      }
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : "Gagal generate content map.");
    } finally {
      setIsGenerating(false);
    }
  };

  const createSelected = async () => {
    if (!activeCampaign || !contentMap) return;
    await runAction(() =>
      createSelectedContentMapPosts({
        campaign_id: activeCampaign.id,
        strategy_id: strategyId,
        start_date: startDate || activeCampaign.start_date,
        end_date: endDate || activeCampaign.end_date || "",
        source_keys: selectedSourceKeys,
        items: contentMap.proposed_content_items,
      }),
    );
    setContentMap(null);
    setWarnings([]);
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm lg:min-w-[420px]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400">
            <Bot className="h-4 w-4" />
            Strategy Engine
          </div>
          <p className="mt-1 text-sm font-black text-arkara-green">{preset.label}</p>
        </div>
        {contentMap ? (
          <button
            type="button"
            onClick={() => setContentMap(null)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500"
            aria-label="Clear content map"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      <div className="mt-3 grid gap-2 md:grid-cols-2">
        <select
          value={strategyId}
          onChange={(event) => {
            const next = event.target.value as SocialStrategyPresetId;
            setStrategyId(next);
            setDesiredCount(SOCIAL_STRATEGY_PRESETS[next].recommendedCount);
            setContentMap(null);
          }}
          className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-arkara-amber"
        >
          {SOCIAL_STRATEGY_PRESET_IDS.map((id) => (
            <option key={id} value={id}>{SOCIAL_STRATEGY_PRESETS[id].label}</option>
          ))}
        </select>
        <input
          type="number"
          min={3}
          max={12}
          value={desiredCount}
          disabled={isClassic}
          onChange={(event) => setDesiredCount(Number(event.target.value))}
          className="h-10 rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-arkara-amber disabled:bg-gray-50"
          aria-label="Jumlah ide"
        />
        <input
          type="date"
          value={startDate}
          onChange={(event) => setStartDate(event.target.value)}
          className="h-10 rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-arkara-amber"
        />
        <input
          type="date"
          value={endDate}
          onChange={(event) => setEndDate(event.target.value)}
          className="h-10 rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-arkara-amber"
        />
      </div>

      <div className="mt-3 rounded-lg border border-gray-100 bg-gray-50 p-3">
        <p className="text-xs font-black uppercase tracking-wider text-gray-400">Source</p>
        <div className="mt-2 max-h-32 space-y-1 overflow-auto pr-1">
          {sources.length === 0 ? (
            <p className="text-sm text-gray-500">Belum ada source.</p>
          ) : sources.map((source) => {
            const key = sourceKey(source);
            const checked = selectedSourceKeys.includes(key);
            return (
              <label key={key} className="flex cursor-pointer items-start gap-2 rounded-md px-2 py-1.5 hover:bg-white">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleSource(key)}
                  className="mt-1 h-4 w-4 accent-arkara-amber"
                />
                <span className="min-w-0 text-xs text-gray-700">
                  <span className="font-bold uppercase text-gray-400">{source.type}</span> {source.title}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {!isClassic ? (
        <div className="mt-3 grid gap-2">
          <textarea
            value={editorNotes}
            onChange={(event) => setEditorNotes(event.target.value)}
            placeholder="Editor notes"
            rows={2}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-arkara-amber"
          />
          <textarea
            value={previousSummary}
            onChange={(event) => setPreviousSummary(event.target.value)}
            placeholder="Previous campaign summary (optional)"
            rows={2}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-arkara-amber"
          />
        </div>
      ) : null}

      {localError ? (
        <div className="mt-3 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
          {localError}
        </div>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={!activeCampaign || isPending || isGenerating}
          onClick={generateContentMap}
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-arkara-green px-3 text-sm font-black text-white disabled:opacity-50"
        >
          {isGenerating || isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {isClassic ? "Generate 7-Day Plan" : "Generate Content Map"}
        </button>
        {contentMap ? (
          <button
            type="button"
            disabled={selectedCount === 0 || isPending}
            onClick={createSelected}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-arkara-amber px-3 text-sm font-black text-arkara-green disabled:opacity-50"
          >
            <Check className="h-4 w-4" />
            Create Selected ({selectedCount})
          </button>
        ) : null}
      </div>

      {contentMap ? (
        <div className="mt-4 space-y-3">
          <div className="rounded-lg border border-arkara-amber/30 bg-arkara-amber/10 p-3 text-sm text-arkara-green">
            <p className="font-black">{contentMap.strategy_summary}</p>
            <p className="mt-1 text-xs">{contentMap.central_narrative}</p>
          </div>

          {contentMap.proposed_content_items.map((item, index) => {
            const warning = warningByTitle.get(item.title);
            return (
              <div key={`${item.suggested_publishing_order}-${index}`} className="rounded-lg border border-gray-200 p-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={item.selected}
                    onChange={(event) => updateItem(index, "selected", event.target.checked)}
                    className="h-4 w-4 accent-arkara-amber"
                  />
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={item.suggested_publishing_order}
                    onChange={(event) => updateItem(index, "suggested_publishing_order", Number(event.target.value))}
                    className="h-9 w-16 rounded-md border border-gray-200 px-2 text-sm"
                    aria-label="Order"
                  />
                  <select
                    value={item.post_type}
                    onChange={(event) => updateItem(index, "post_type", event.target.value as SocialPostType)}
                    className="h-9 rounded-md border border-gray-200 px-2 text-sm"
                  >
                    {CONTENT_DERIVATIVE_POST_TYPES.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <input
                  value={item.title}
                  onChange={(event) => updateItem(index, "title", event.target.value)}
                  className="mt-2 h-10 w-full rounded-md border border-gray-200 px-3 text-sm font-bold outline-none focus:border-arkara-amber"
                />
                <textarea
                  value={item.angle}
                  onChange={(event) => updateItem(index, "angle", event.target.value)}
                  rows={2}
                  className="mt-2 w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-arkara-amber"
                />
                {warning ? (
                  <div className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
                    Similarity warning {Math.round(warning.similarity * 100)}%: {warning.matchedTitle}
                  </div>
                ) : null}
                <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                  <Wand2 className="h-3.5 w-3.5" />
                  {item.hook_direction} | {item.visual_direction}
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}