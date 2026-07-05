import type {
  SocialCarouselSlide,
  SocialDashboardData,
  SocialPost,
} from "@/types/social";

export type PostDraft = Omit<
  SocialPost,
  "id" | "user_id" | "created_at" | "updated_at"
> & {
  id?: string;
};

export interface PostEditorProps {
  post: PostDraft | null;
  setPost: (post: PostDraft | null) => void;
  slides: SocialCarouselSlide[];
  sources: SocialDashboardData["sources"];
  isPending: boolean;
  runAction: (
    task: () => Promise<{
      error?: string;
      success?: boolean;
      summary?: string;
    }>,
  ) => void;
  savePost: () => void;
  copyCaption: (post: PostDraft | SocialPost) => Promise<void>;
}
