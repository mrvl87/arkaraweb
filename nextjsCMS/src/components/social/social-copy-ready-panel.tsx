"use client";

import { Clipboard } from "lucide-react";

interface SocialCopyReadyPanelProps {
  disabled: boolean;
  onCopyCaption: () => void;
}

export function SocialCopyReadyPanel({
  disabled,
  onCopyCaption,
}: SocialCopyReadyPanelProps) {
  return (
    <div className="rounded-xl border border-arkara-amber/30 bg-arkara-cream p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs font-black uppercase tracking-widest text-arkara-amber">
            Copy-ready artifact
          </div>
          <p className="mt-1 text-sm text-gray-600">
            Preview gabungan adalah versi final yang akan dicopy manual ke Facebook.
          </p>
        </div>
        <button
          type="button"
          onClick={onCopyCaption}
          disabled={disabled}
          className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-arkara-green px-3 py-2 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Clipboard className="h-4 w-4" />
          Copy Caption
        </button>
      </div>
    </div>
  );
}