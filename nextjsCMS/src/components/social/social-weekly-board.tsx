"use client";

import { CalendarDays } from "lucide-react";
import type { SocialPost } from "@/types/social";
import { SocialWeeklyPostCard } from "./social-weekly-post-card";
import { DAY_LABELS, getPostDayIndex } from "./social-utils";

interface SocialWeeklyBoardProps {
  weekPosts: SocialPost[];
  onEditPost: (post: SocialPost) => void;
}

export function SocialWeeklyBoard({
  weekPosts,
  onEditPost,
}: SocialWeeklyBoardProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex flex-col gap-2 border-b border-gray-100 pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-400">
              <CalendarDays className="h-4 w-4 text-arkara-amber" />
              Weekly Facebook Cards
            </div>
            <h3 className="mt-1 text-xl font-black text-arkara-green">
              Senin sampai Minggu
            </h3>
          </div>
          <p className="max-w-md text-sm text-gray-500">
            Check biru disimpan lokal. Saat diklik, warnanya berubah abu-abu
            sebagai tanda post sudah dibuat di Facebook.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-7">
          {DAY_LABELS.map((day, index) => {
            const dayPosts = weekPosts.filter(
              (post) => getPostDayIndex(post) === index,
            );
            return (
              <div
                key={day}
                className="min-h-[220px] rounded-xl border border-gray-200 bg-gray-50 p-3"
              >
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="text-sm font-black uppercase tracking-widest text-arkara-green">
                    {day}
                  </h4>
                  <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-gray-400">
                    {dayPosts.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {dayPosts.map((post) => (
                    <SocialWeeklyPostCard
                      key={post.id}
                      post={post}
                      onEdit={() => onEditPost(post)}
                    />
                  ))}
                  {dayPosts.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-gray-200 bg-white p-4 text-center text-xs font-medium text-gray-400">
                      Belum ada post
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
