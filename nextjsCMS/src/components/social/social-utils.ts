"use client";

import { buildSocialCaption } from "@/lib/social/publish-pack";
import type { SocialPost } from "@/types/social";

export const DAY_LABELS = [
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
  "Minggu",
] as const;

export function getPostDayIndex(post: Pick<SocialPost, "scheduled_date">) {
  if (!post.scheduled_date) return 99;
  const day = new Date(`${post.scheduled_date}T00:00:00`).getDay();
  return day === 0 ? 6 : day - 1;
}

export function getPostDayLabel(post: Pick<SocialPost, "scheduled_date">) {
  const index = getPostDayIndex(post);
  return index >= 0 && index < DAY_LABELS.length
    ? DAY_LABELS[index]
    : "Tanpa Hari";
}

export function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

export function buildCaption(
  post: Pick<SocialPost, "hook" | "body" | "cta" | "target_url">,
) {
  return buildSocialCaption(post);
}