"use client";

import { Loader2, Pencil, Save } from "lucide-react";
import type { SocialCampaign, SocialCampaignStatus } from "@/types/social";
import { SocialEditorField } from "./social-editor-field";

export interface SocialCampaignSettingsDraft {
  title: string;
  theme: string;
  start_date: string;
  end_date: string;
  primary_goal: string;
  content_pillar: string;
  tone_note: string;
  status: SocialCampaignStatus;
}

interface SocialCampaignSettingsProps {
  activeCampaign: SocialCampaign | null;
  campaignDraft: SocialCampaignSettingsDraft;
  onCampaignDraftChange: (draft: SocialCampaignSettingsDraft) => void;
  onSave: () => void;
  isPending: boolean;
}

export function SocialCampaignSettings({
  activeCampaign,
  campaignDraft,
  onCampaignDraftChange,
  onSave,
  isPending,
}: SocialCampaignSettingsProps) {
  if (!activeCampaign) return null;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center gap-2 border-b border-gray-100 pb-3">
        <Pencil className="h-4 w-4 text-arkara-amber" />
        <div>
          <h3 className="text-sm font-black uppercase tracking-widest text-arkara-green">
            Upload Period
          </h3>
          <p className="mt-1 text-xs font-medium text-gray-400">
            Atur rencana periode post untuk campaign aktif.
          </p>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <SocialEditorField label="Start Date">
          <input
            type="date"
            value={campaignDraft.start_date}
            onChange={(event) =>
              onCampaignDraftChange({
                ...campaignDraft,
                start_date: event.target.value,
              })
            }
            className="input-social"
          />
        </SocialEditorField>
        <SocialEditorField label="End Date">
          <input
            type="date"
            value={campaignDraft.end_date}
            onChange={(event) =>
              onCampaignDraftChange({
                ...campaignDraft,
                end_date: event.target.value,
              })
            }
            className="input-social"
          />
        </SocialEditorField>
        <SocialEditorField label="Title">
          <input
            value={campaignDraft.title}
            onChange={(event) =>
              onCampaignDraftChange({
                ...campaignDraft,
                title: event.target.value,
              })
            }
            className="input-social"
          />
        </SocialEditorField>
        <SocialEditorField label="Status">
          <select
            value={campaignDraft.status}
            onChange={(event) =>
              onCampaignDraftChange({
                ...campaignDraft,
                status: event.target.value as SocialCampaignStatus,
              })
            }
            className="input-social"
          >
            <option value="planned">Planned</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="archived">Archived</option>
          </select>
        </SocialEditorField>
      </div>
      <button
        type="button"
        onClick={onSave}
        disabled={isPending}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-arkara-green px-3 py-2.5 text-sm font-black text-white disabled:opacity-50"
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Save className="h-4 w-4" />
        )}
        Save Period
      </button>
    </div>
  );
}