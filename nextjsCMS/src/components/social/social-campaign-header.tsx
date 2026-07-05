"use client";

import { FileText, Plus } from "lucide-react";
import type { SocialCampaign, SocialDashboardData } from "@/types/social";

interface SocialCampaignHeaderProps {
  activeCampaign: SocialCampaign | null;
  campaigns: SocialDashboardData["campaigns"];
  progressText: string;
  onSelectCampaign: (campaignId: string) => void;
  onCreateCampaign: () => void;
  onAddPost: () => void;
}

export function SocialCampaignHeader({
  activeCampaign,
  campaigns,
  progressText,
  onSelectCampaign,
  onCreateCampaign,
  onAddPost,
}: SocialCampaignHeaderProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400">
            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-blue-700">
              Facebook
            </span>
            <span>{progressText}</span>
          </div>
          <h2 className="mt-2 truncate text-xl font-black text-arkara-green">
            {activeCampaign?.title ?? "Belum ada campaign"}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {activeCampaign
              ? `${activeCampaign.start_date} sampai ${activeCampaign.end_date}`
              : "Buat campaign untuk mulai tracking konten Facebook manual."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={activeCampaign?.id ?? ""}
            onChange={(event) => onSelectCampaign(event.target.value)}
            className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 outline-none focus:border-arkara-amber"
          >
            {campaigns.length === 0 ? <option value="">No campaign</option> : null}
            {campaigns.map((campaign) => (
              <option key={campaign.id} value={campaign.id}>
                {campaign.title}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={onCreateCampaign}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-arkara-green/20 bg-white px-3 text-sm font-bold text-arkara-green hover:bg-arkara-green hover:text-white"
          >
            <Plus className="h-4 w-4" />
            New Campaign
          </button>
          <button
            type="button"
            onClick={onAddPost}
            disabled={!activeCampaign}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-arkara-amber px-3 text-sm font-black text-arkara-green disabled:opacity-50"
          >
            <FileText className="h-4 w-4" />
            Add Post
          </button>
        </div>
      </div>
    </div>
  );
}