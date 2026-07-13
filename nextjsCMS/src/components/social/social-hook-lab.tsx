"use client";

import { useMemo, useState } from "react";
import { Check, Edit3, Loader2, Sparkles } from "lucide-react";
import {
  generateFacebookVariantsForPost,
  selectSocialPostVariant,
  updateSocialPostVariant,
} from "@/app/cms/social/actions";
import {
  getVariantReadabilityStats,
  getVariantScoreAverage,
} from "@/lib/social/variants";
import type {
  SocialPostVariant,
  SocialPostVariantType,
} from "@/types/social";
import { SOCIAL_POST_VARIANT_TYPES } from "@/types/social";
import type { PostDraft, SocialActionRunner } from "./social-post-editor-types";

interface SocialHookLabProps {
  post: PostDraft;
  variants: SocialPostVariant[];
  isPending: boolean;
  runAction: SocialActionRunner;
}

type VariantDraftMap = Record<string, { label: string; content: string }>;

const VARIANT_TYPE_LABELS: Record<SocialPostVariantType, string> = {
  hook: "Hook",
  headline: "Headline",
  caption: "Caption Body",
  cta: "CTA",
  first_comment: "First Comment",
  visual_direction: "Visual Direction",
};

function formatScore(value?: number) {
  return typeof value === "number" ? value.toFixed(1).replace(/\.0$/, "") : "-";
}

function metadataText(variant: SocialPostVariant) {
  const direction = typeof variant.metadata?.direction === "string" ? variant.metadata.direction : null;
  const rationale = typeof variant.metadata?.rationale === "string" ? variant.metadata.rationale : null;
  return [direction, rationale].filter(Boolean).join(" | ");
}

export function SocialHookLab({ post, variants, isPending, runAction }: SocialHookLabProps) {
  const [variantType, setVariantType] = useState<SocialPostVariantType>("hook");
  const [desiredCount, setDesiredCount] = useState(5);
  const [tone, setTone] = useState("tenang, tajam, realistis");
  const [historicalLearnings, setHistoricalLearnings] = useState("");
  const [drafts, setDrafts] = useState<VariantDraftMap>({});
  const [localError, setLocalError] = useState<string | null>(null);

  const visibleVariants = useMemo(
    () => variants.filter((variant) => variant.variant_type === variantType),
    [variants, variantType],
  );

  const selectedVariant = visibleVariants.find((variant) => variant.is_selected) ?? null;

  const updateDraft = (variant: SocialPostVariant, key: "label" | "content", value: string) => {
    setDrafts((current) => ({
      ...current,
      [variant.id]: {
        label: current[variant.id]?.label ?? variant.label ?? "Variant",
        content: current[variant.id]?.content ?? variant.content,
        [key]: value,
      },
    }));
  };

  const generateVariants = () => {
    if (!post.id) {
      setLocalError("Simpan post sebelum generate variants.");
      return;
    }
    setLocalError(null);
    runAction(() =>
      generateFacebookVariantsForPost({
        post_id: post.id!,
        variant_type: variantType,
        desired_count: desiredCount,
        tone,
        historical_learnings: historicalLearnings,
      }),
    );
  };

  const saveVariant = (variant: SocialPostVariant) => {
    const draft = drafts[variant.id];
    if (!draft) return;
    runAction(() =>
      updateSocialPostVariant({
        id: variant.id,
        label: draft.label,
        content: draft.content,
      }),
    );
  };

  const selectVariant = (variant: SocialPostVariant) => {
    runAction(() => selectSocialPostVariant({ id: variant.id }));
  };

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-xs font-black uppercase tracking-widest text-gray-400">Hook Lab</div>
          <h3 className="mt-1 text-base font-black text-arkara-green">Content Variants</h3>
          <p className="mt-1 text-xs font-semibold text-gray-500">
            Heuristic editorial score, bukan prediksi performa.
          </p>
        </div>
        {selectedVariant ? (
          <div className="rounded-lg bg-arkara-green px-3 py-2 text-xs font-black text-white">
            Selected: {selectedVariant.label || VARIANT_TYPE_LABELS[selectedVariant.variant_type]}
          </div>
        ) : null}
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_90px_1fr_auto]">
        <select
          value={variantType}
          onChange={(event) => setVariantType(event.target.value as SocialPostVariantType)}
          className="input-social"
        >
          {SOCIAL_POST_VARIANT_TYPES.map((type) => (
            <option key={type} value={type}>{VARIANT_TYPE_LABELS[type]}</option>
          ))}
        </select>
        <input
          type="number"
          min={1}
          max={8}
          value={desiredCount}
          onChange={(event) => setDesiredCount(Number(event.target.value))}
          className="input-social"
          aria-label="Jumlah variants"
        />
        <input
          value={tone}
          onChange={(event) => setTone(event.target.value)}
          className="input-social"
          placeholder="Tone"
        />
        <button
          type="button"
          disabled={isPending || !post.id}
          onClick={generateVariants}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-arkara-green px-4 text-sm font-black text-white disabled:opacity-50"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Generate
        </button>
      </div>

      <textarea
        value={historicalLearnings}
        onChange={(event) => setHistoricalLearnings(event.target.value)}
        rows={2}
        className="input-social mt-3 resize-y text-sm"
        placeholder="Historical learnings optional"
      />

      {localError ? (
        <div className="mt-3 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
          {localError}
        </div>
      ) : null}

      <div className="mt-4 grid gap-3 xl:grid-cols-2">
        {visibleVariants.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-200 p-4 text-sm text-gray-500 xl:col-span-2">
            Belum ada variant untuk tipe ini.
          </div>
        ) : visibleVariants.map((variant) => {
          const draft = drafts[variant.id] ?? {
            label: variant.label ?? "Variant",
            content: variant.content,
          };
          const stats = getVariantReadabilityStats(draft.content, variant.variant_type);
          const averageScore = getVariantScoreAverage(variant.heuristic_scores);
          const meta = metadataText(variant);

          return (
            <article
              key={variant.id}
              className={`rounded-lg border p-3 ${variant.is_selected ? "border-arkara-amber bg-arkara-amber/10" : "border-gray-200 bg-white"}`}
            >
              <div className="flex items-center justify-between gap-2">
                <input
                  value={draft.label}
                  onChange={(event) => updateDraft(variant, "label", event.target.value)}
                  className="h-9 min-w-0 flex-1 rounded-md border border-gray-200 px-3 text-sm font-black text-arkara-green outline-none focus:border-arkara-amber"
                />
                <span className="rounded-md bg-gray-100 px-2 py-1 text-xs font-black text-gray-600">
                  {averageScore ?? "-"}/10
                </span>
              </div>

              <textarea
                value={draft.content}
                onChange={(event) => updateDraft(variant, "content", event.target.value)}
                rows={variant.variant_type === "caption" ? 5 : 3}
                className="input-social mt-2 resize-y text-sm leading-6"
              />

              <div className="mt-2 grid gap-2 text-xs text-gray-500 sm:grid-cols-2">
                <div className={stats.overLimit ? "font-bold text-red-600" : ""}>
                  Length {stats.characters}/{stats.hardLimit} | {stats.words} kata
                </div>
                <div>Readability {stats.density} | {stats.averageWordsPerSentence} kata/kalimat</div>
              </div>

              <div className="mt-2 grid gap-1 rounded-md bg-gray-50 p-2 text-xs text-gray-600 sm:grid-cols-5">
                <span>Clarity {formatScore(variant.heuristic_scores.clarity)}</span>
                <span>Curiosity {formatScore(variant.heuristic_scores.curiosity)}</span>
                <span>Relevance {formatScore(variant.heuristic_scores.relevance)}</span>
                <span>Brand {formatScore(variant.heuristic_scores.brand_fit)}</span>
                <span>Risk {formatScore(variant.heuristic_scores.clickbait_risk)}</span>
              </div>

              {meta ? <p className="mt-2 text-xs font-semibold text-gray-500">{meta}</p> : null}

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => saveVariant(variant)}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs font-black text-gray-700 disabled:opacity-50"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  Save Edit
                </button>
                <button
                  type="button"
                  disabled={isPending || stats.overLimit}
                  onClick={() => selectVariant(variant)}
                  className="inline-flex items-center gap-2 rounded-lg bg-arkara-amber px-3 py-2 text-xs font-black text-arkara-green disabled:opacity-50"
                >
                  <Check className="h-3.5 w-3.5" />
                  Select Winner
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}