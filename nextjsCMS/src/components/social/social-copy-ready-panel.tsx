"use client";

import { Clipboard } from "lucide-react";

interface SocialCopyReadyPanelProps {
  onCopyCaption: () => void;
}

export function SocialCopyReadyPanel({ onCopyCaption }: SocialCopyReadyPanelProps) {
  return (
    <div className="rounded-xl border border-arkara-amber/30 bg-arkara-cream p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs font-black uppercase tracking-widest text-arkara-amber">
            Copy-ready artifact
          </div>
          <p className="mt-1 text-sm text-gray-600">
            Teks di field Facebook Caption adalah versi final yang akan dicopy
            manual ke Facebook.
          </p>
        </div>
        <button
          type="button"
          onClick={onCopyCaption}
          className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-arkara-green px-3 py-2 text-sm font-black text-white"
        >
          <Clipboard className="h-4 w-4" />
          Copy Caption
        </button>
      </div>
    </div>
  );
}