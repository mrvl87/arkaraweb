"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Loader2 } from "lucide-react";
import {
  copyPostCaptionMark,
  markPostPosted,
} from "@/app/cms/social/actions";
import type { SocialPost, SocialPostMetric } from "@/types/social";
import type { SocialActionRunner } from "./social-post-editor-types";
import {
  buildCaption,
  getPostDayLabel,
} from "./social-utils";

interface SocialWeeklyPostCardProps {
  post: SocialPost;
  latestMetric: SocialPostMetric | null;
  isPending: boolean;
  runAction: SocialActionRunner;
  onEdit: () => void;
}

export function SocialWeeklyPostCard({
  post,
  latestMetric,
  isPending,
  runAction,
  onEdit,
}: SocialWeeklyPostCardProps) {
  const [copied, setCopied] = useState(post.copied_done);
  const [posted, setPosted] = useState(post.posted_done || post.status === "posted" || post.status === "reviewed");
  const [copying, setCopying] = useState(false);
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    setCopied(post.copied_done);
    setPosted(post.posted_done || post.status === "posted" || post.status === "reviewed");
  }, [post.copied_done, post.posted_done, post.status]);

  const handleCopy = async () => {
    const previousCopied = copied;
    setCopied(true);
    setCopying(true);

    try {
      await navigator.clipboard.writeText(buildCaption(post));
      const result = await runAction(() => copyPostCaptionMark(post.id));
      if (result.error) setCopied(previousCopied);
    } finally {
      setCopying(false);
    }
  };

  const handlePosted = async () => {
    const previousCopied = copied;
    const previousPosted = posted;
    setCopied(true);
    setPosted(true);
    setPosting(true);

    try {
      const result = await runAction(() => markPostPosted(post.id));
      if (result.error) {
        setCopied(previousCopied);
        setPosted(previousPosted);
      }
    } finally {
      setPosting(false);
    }
  };

  const statusLabel = post.status.replace("_", " ");

  return (
    <div
      className={`rounded-lg border bg-white p-3 transition-colors ${posted ? "border-gray-200 opacity-80" : "border-blue-200"}`}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-gray-500">
            {post.post_type.replace("_", " ")}
          </span>
          <p className="mt-1 text-[11px] font-medium text-gray-400">
            {post.scheduled_date || "Tanpa tanggal"}{" "}
            {post.scheduled_time?.slice(0, 5) || ""}
          </p>
        </div>
        <button
          type="button"
          title={posted ? "Sudah dibuat di Facebook" : "Tandai sudah dibuat di Facebook"}
          onClick={handlePosted}
          disabled={posted || isPending || posting}
          className={`grid h-8 w-8 shrink-0 place-items-center rounded-full transition-colors disabled:cursor-not-allowed ${
            posted
              ? "bg-gray-200 text-gray-500"
              : "bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
          }`}
        >
          {posting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
        </button>
      </div>

      <button
        type="button"
        onClick={onEdit}
        className="block w-full text-left text-sm font-black leading-snug text-arkara-green hover:text-arkara-amber"
      >
        {post.title}
      </button>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold uppercase text-gray-500 ring-1 ring-gray-100">
          {statusLabel}
        </span>
        {post.metrics_done ? (
          <span className="rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-bold uppercase text-green-700">
            Metrics
          </span>
        ) : null}
      </div>

      {latestMetric ? (
        <div className="mt-3 rounded-md bg-gray-50 px-2 py-1.5 text-[11px] font-medium text-gray-500">
          Reach {latestMetric.reach ?? 0} | C {latestMetric.comments ?? 0} | S {latestMetric.shares ?? 0} | Click {latestMetric.link_clicks ?? 0}
        </div>
      ) : null}

      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="text-[11px] font-bold text-gray-400">
          {getPostDayLabel(post)}
        </span>
        <button
          type="button"
          title={copied ? "Caption sudah dicopy" : "Copy caption"}
          onClick={handleCopy}
          disabled={isPending || copying}
          className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-black transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
            copied
              ? "bg-gray-100 text-gray-500"
              : "bg-arkara-amber text-arkara-green hover:bg-arkara-green hover:text-white"
          }`}
        >
          {copying ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : copied ? (
            <Check className="h-3.5 w-3.5" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}