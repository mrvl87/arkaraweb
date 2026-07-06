"use client";

import { X } from "lucide-react";

interface SocialPostEditorHeaderProps {
  onClose: () => void;
}

export function SocialPostEditorHeader({ onClose }: SocialPostEditorHeaderProps) {
  return (
    <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
      <div>
        <h3 className="text-sm font-black uppercase tracking-widest text-arkara-green">
          Facebook Post Editor
        </h3>
        <p className="mt-1 text-xs font-medium text-gray-400">
          Caption pendek + prompt poster informatif
        </p>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="rounded-lg p-2 text-gray-400 hover:bg-gray-100"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}