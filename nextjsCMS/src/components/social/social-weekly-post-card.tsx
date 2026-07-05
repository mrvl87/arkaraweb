"use client";

import { Check, Copy } from "lucide-react";
import type { SocialPost } from "@/types/social";
import {
  buildCaption,
  getLocalKey,
  getPostDayLabel,
  useLocalBoolean,
} from "./social-utils";

interface SocialWeeklyPostCardProps {
  post: SocialPost;
  onEdit: () => void;
}

export function SocialWeeklyPostCard({ post, onEdit }: SocialWeeklyPostCardProps) {
  const [facebookDone, setFacebookDone] = useLocalBoolean(
    getLocalKey("facebook_done", post.id),
    false,
  );

  return (
    <div
      className={`rounded-lg border bg-white p-3 transition-colors ${facebookDone ? "border-gray-200 opacity-75" : "border-blue-200"}`}
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
          title={
            facebookDone
              ? "Sudah dibuat di Facebook"
              : "Tandai sudah dibuat di Facebook"
          }
          onClick={() => setFacebookDone(!facebookDone)}
          className={`grid h-8 w-8 shrink-0 place-items-center rounded-full transition-colors ${
            facebookDone
              ? "bg-gray-200 text-gray-500"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          <Check className="h-4 w-4" />
        </button>
      </div>

      <button
        type="button"
        onClick={onEdit}
        className="block w-full text-left text-sm font-black leading-snug text-arkara-green hover:text-arkara-amber"
      >
        {post.title}
      </button>

      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="text-[11px] font-bold text-gray-400">
          {getPostDayLabel(post)}
        </span>
        <LocalCopyButton post={post} />
      </div>
    </div>
  );
}

function LocalCopyButton({ post }: { post: SocialPost }) {
  const [copied, setCopied] = useLocalBoolean(
    getLocalKey("copied", post.id),
    Boolean(post.copied_done),
  );

  const handleCopy = async () => {
    await navigator.clipboard.writeText(buildCaption(post));
    setCopied(true);
  };

  return (
    <button
      type="button"
      title={copied ? "Caption sudah dicopy" : "Copy caption"}
      onClick={handleCopy}
      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-black transition-colors ${
        copied
          ? "bg-gray-100 text-gray-500"
          : "bg-arkara-amber text-arkara-green hover:bg-arkara-green hover:text-white"
      }`}
    >
      {copied ? (
        <Check className="h-3.5 w-3.5" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}