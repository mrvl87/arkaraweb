"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Archive, CheckCircle2, FlaskConical, Loader2, XCircle } from "lucide-react";
import {
  generateSocialPerformanceReviewForCampaign,
  updateSocialLearningStatus,
} from "@/app/cms/social/actions";
import type { SocialCampaign, SocialLearning, SocialPost } from "@/types/social";
import type { SocialActionRunner } from "./social-post-editor-types";

interface SocialLearningEngineProps {
  activeCampaign: SocialCampaign | null;
  learnings: SocialLearning[];
  posts: SocialPost[];
  isPending: boolean;
  runAction: SocialActionRunner;
  onEditPost: (post: SocialPost) => void;
}

function getLearningEvidence(learning: SocialLearning) {
  return learning.evidence as { post_ids?: unknown; evidence_post_ids?: unknown; campaign_id?: unknown };
}

function evidencePostIds(learning: SocialLearning) {
  const evidence = getLearningEvidence(learning);
  const rawIds = Array.isArray(evidence.post_ids)
    ? evidence.post_ids
    : Array.isArray(evidence.evidence_post_ids)
      ? evidence.evidence_post_ids
      : [];
  return rawIds.filter((id): id is string => typeof id === "string");
}

export function SocialLearningEngine({
  activeCampaign,
  learnings,
  posts,
  isPending,
  runAction,
  onEditPost,
}: SocialLearningEngineProps) {
  const [startDate, setStartDate] = useState(activeCampaign?.start_date ?? "");
  const [endDate, setEndDate] = useState(activeCampaign?.end_date ?? "");
  const [saveToNotes, setSaveToNotes] = useState(false);
  useEffect(() => {
    setStartDate(activeCampaign?.start_date ?? "");
    setEndDate(activeCampaign?.end_date ?? "");
  }, [activeCampaign?.id, activeCampaign?.start_date, activeCampaign?.end_date]);

  const postById = new Map(posts.map((post) => [post.id, post]));
  const campaignLearnings = learnings.filter((learning) => {
    const evidence = getLearningEvidence(learning);
    return learning.status === "approved" || learning.scope_id === activeCampaign?.id || evidence.campaign_id === activeCampaign?.id;
  });
  const proposed = campaignLearnings.filter((learning) => learning.status === "proposed");
  const approved = campaignLearnings.filter((learning) => learning.status === "approved");
  const other = campaignLearnings.filter((learning) => learning.status !== "proposed" && learning.status !== "approved").slice(0, 8);

  const runRetrospective = () => {
    if (!activeCampaign) return;
    runAction(() => generateSocialPerformanceReviewForCampaign({
      campaign_id: activeCampaign.id,
      start_date: startDate,
      end_date: endDate,
      save_to_notes: saveToNotes,
    }));
  };

  const changeStatus = (learning: SocialLearning, status: "approved" | "rejected" | "archived") => {
    runAction(() => updateSocialLearningStatus({ id: learning.id, status }));
  };

  if (!activeCampaign) return null;

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex flex-col gap-3 border-b border-gray-100 pb-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-400">
            <FlaskConical className="h-4 w-4 text-arkara-amber" />
            Performance Learning Engine
          </div>
          <h3 className="mt-1 text-xl font-black text-arkara-green">Campaign Retrospective</h3>
          <p className="mt-1 text-sm text-gray-500">Learning harus di-approve sebelum dipakai lagi oleh AI.</p>
        </div>
        <button
          type="button"
          onClick={runRetrospective}
          disabled={isPending}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-arkara-green px-3 py-2 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <FlaskConical className="h-4 w-4" />}
          Run Retrospective
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
        <label className="text-xs font-bold uppercase tracking-wide text-gray-500">
          From
          <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="input-social mt-1 normal-case tracking-normal" />
        </label>
        <label className="text-xs font-bold uppercase tracking-wide text-gray-500">
          To
          <input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className="input-social mt-1 normal-case tracking-normal" />
        </label>
        <label className="flex items-center gap-2 self-end rounded-lg border border-gray-200 px-3 py-2 text-sm font-bold text-gray-600">
          <input type="checkbox" checked={saveToNotes} onChange={(event) => setSaveToNotes(event.target.checked)} />
          Save summary to campaign notes
        </label>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        <LearningColumn title="Proposed Learnings" items={proposed} empty="Belum ada proposed learning." postById={postById} onEditPost={onEditPost} onApprove={(learning) => changeStatus(learning, "approved")} onReject={(learning) => changeStatus(learning, "rejected")} onArchive={(learning) => changeStatus(learning, "archived")} />
        <LearningColumn title="Approved Learnings" items={approved} empty="Belum ada approved learning." postById={postById} onEditPost={onEditPost} onArchive={(learning) => changeStatus(learning, "archived")} />
      </div>

      {other.length > 0 ? (
        <div className="mt-4 rounded-lg bg-gray-50 p-3">
          <div className="text-xs font-black uppercase tracking-widest text-gray-400">Rejected / Archived</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {other.map((learning) => (
              <span key={learning.id} className="rounded-full bg-white px-3 py-1 text-xs font-bold text-gray-500">{learning.status}: {learning.title}</span>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function LearningColumn({
  title,
  items,
  empty,
  postById,
  onEditPost,
  onApprove,
  onReject,
  onArchive,
}: {
  title: string;
  items: SocialLearning[];
  empty: string;
  postById: Map<string, SocialPost>;
  onEditPost: (post: SocialPost) => void;
  onApprove?: (learning: SocialLearning) => void;
  onReject?: (learning: SocialLearning) => void;
  onArchive?: (learning: SocialLearning) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="text-xs font-black uppercase tracking-widest text-gray-500">{title}</div>
      {items.map((learning) => (
        <div key={learning.id} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h4 className="font-black text-arkara-green">{learning.title}</h4>
              <div className="mt-1 text-xs font-bold uppercase tracking-wide text-gray-400">
                {learning.scope_type} | evidence {learning.evidence_count} | confidence {learning.confidence}
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {onApprove ? <IconButton label="Approve" onClick={() => onApprove(learning)}><CheckCircle2 className="h-4 w-4" /></IconButton> : null}
              {onReject ? <IconButton label="Reject" onClick={() => onReject(learning)}><XCircle className="h-4 w-4" /></IconButton> : null}
              {onArchive ? <IconButton label="Archive" onClick={() => onArchive(learning)}><Archive className="h-4 w-4" /></IconButton> : null}
            </div>
          </div>
          <p className="mt-3 text-sm leading-6 text-gray-600">{learning.observation}</p>
          <p className="mt-2 text-sm font-semibold leading-6 text-gray-700">{learning.recommendation}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {evidencePostIds(learning).map((postId) => {
              const post = postById.get(postId);
              if (!post) return null;
              return (
                <button key={postId} type="button" onClick={() => onEditPost(post)} className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-bold text-arkara-green hover:bg-arkara-cream">
                  {post.title}
                </button>
              );
            })}
          </div>
        </div>
      ))}
      {items.length === 0 ? <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-4 text-center text-xs font-medium text-gray-400">{empty}</div> : null}
    </div>
  );
}

function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} title={label} aria-label={label} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-arkara-cream hover:text-arkara-green">
      {children}
    </button>
  );
}