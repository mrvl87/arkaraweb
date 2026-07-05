"use client";

import { Plus, Trash2 } from "lucide-react";
import type { SocialCampaign, SocialDashboardData } from "@/types/social";

interface SocialCampaignListProps {
  campaigns: SocialDashboardData["campaigns"];
  activeCampaign: SocialCampaign | null;
  onSelectCampaign: (campaignId: string) => void;
  onCreateCampaign: () => void;
  onDeleteCampaign: (campaignId: string, campaignTitle: string) => void;
}

export function SocialCampaignList({
  campaigns,
  activeCampaign,
  onSelectCampaign,
  onCreateCampaign,
  onDeleteCampaign,
}: SocialCampaignListProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3 border-b border-gray-100 pb-3">
        <div>
          <h3 className="text-sm font-black uppercase tracking-widest text-arkara-green">
            Campaign List
          </h3>
          <p className="mt-1 text-xs font-medium text-gray-400">
            Pilih, arsipkan, atau hapus campaign yang tidak dipakai.
          </p>
        </div>
        <button
          type="button"
          onClick={onCreateCampaign}
          className="inline-flex h-9 items-center gap-2 rounded-lg bg-arkara-amber px-3 text-xs font-black text-arkara-green"
        >
          <Plus className="h-4 w-4" />
          New
        </button>
      </div>
      <div className="grid gap-2 md:grid-cols-2">
        {campaigns.map((campaign) => {
          const isActive = activeCampaign?.id === campaign.id;
          return (
            <div
              key={campaign.id}
              className={`rounded-lg border p-3 transition-colors ${
                isActive
                  ? "border-arkara-amber bg-arkara-cream"
                  : "border-gray-200 bg-gray-50"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <button
                  type="button"
                  onClick={() => onSelectCampaign(campaign.id)}
                  className="min-w-0 text-left"
                >
                  <p className="truncate text-sm font-black text-arkara-green">
                    {campaign.title}
                  </p>
                  <p className="mt-1 text-xs font-medium text-gray-500">
                    {campaign.start_date} - {campaign.end_date}
                  </p>
                </button>
                <button
                  type="button"
                  title="Hapus campaign permanen"
                  onClick={() => onDeleteCampaign(campaign.id, campaign.title)}
                  className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-bold uppercase text-gray-500">
                  {campaign.status.replace("_", " ")}
                </span>
                {isActive ? (
                  <span className="text-[11px] font-black uppercase tracking-wider text-arkara-amber">
                    Active
                  </span>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}