"use client";

import type React from "react";

interface SocialEditorFieldProps {
  label: string;
  children: React.ReactNode;
}

export function SocialEditorField({
  label,
  children,
}: SocialEditorFieldProps) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-black uppercase tracking-widest text-gray-400">
        {label}
      </span>
      {children}
    </label>
  );
}
