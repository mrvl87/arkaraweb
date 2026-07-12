"use client";

import { Bot, Loader2, Sparkles } from "lucide-react";
import { generateWeeklyFacebookPlan } from "@/app/cms/social/actions";
import type { SocialCampaign, SocialDashboardData } from "@/types/social";
import type { SocialActionRunner } from "./social-post-editor-types";

interface SocialAIPlanPanelProps {
  sources: SocialDashboardData["sources"];
  selectedSourceForPlan: string;
  onSelectedSourceForPlanChange: (value: string) => void;
  activeCampaign: SocialCampaign | null;
  isPending: boolean;
  runAction: SocialActionRunner;
}

export function SocialAIPlanPanel({
  sources,
  selectedSourceForPlan,
  onSelectedSourceForPlanChange,
  activeCampaign,
  isPending,
  runAction,
}: SocialAIPlanPanelProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400">
        <Bot className="h-4 w-4" />
        OpenRouter
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <select
          value={selectedSourceForPlan}
          onChange={(event) => onSelectedSourceForPlanChange(event.target.value)}
          className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-arkara-amber"
        >
          <option value="">Tanpa sumber</option>
          {sources.map((source) => (
            <option
              key={`${source.type}:${source.id}`}
              value={`${source.type}:${source.id}`}
            >
              {source.type}: {source.title}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={!activeCampaign || isPending}
          onClick={() =>
            activeCampaign &&
            runAction(() =>
              generateWeeklyFacebookPlan(
                activeCampaign.id,
                selectedSourceForPlan || undefined,
              ),
            )
          }
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-arkara-green px-3 text-sm font-black text-white disabled:opacity-50"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          Generate 7-Day Plan
        </button>
      </div>
    </div>
  );
}