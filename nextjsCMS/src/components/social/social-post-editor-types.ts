import type {
  SocialCarouselSlide,
  SocialPost,
} from "@/types/social";

export type SocialActionRunner = (
  task: () => Promise<{
    error?: string;
    success?: boolean;
    summary?: string;
  }>,
) => void;

export type PostDraft = Omit<
  SocialPost,
  "id" | "user_id" | "created_at" | "updated_at"
> & {
  id?: string;
};

export type PostDraftUpdater = <K extends keyof PostDraft>(
  key: K,
  value: PostDraft[K],
) => void;

export interface PostEditorProps {
  post: PostDraft | null;
  setPost: (post: PostDraft | null) => void;
  slides: SocialCarouselSlide[];
  isPending: boolean;
  runAction: SocialActionRunner;
  savePost: () => void;
  copyCaption: (post: PostDraft | SocialPost) => Promise<void>;
}