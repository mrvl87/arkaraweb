import type {
  SocialCarouselSlide,
  SocialPost,
  SocialPostMetric,
} from "@/types/social";

export interface SocialActionResult {
  error?: string;
  success?: boolean;
  summary?: string;
}

export type SocialActionRunner = (
  task: () => Promise<SocialActionResult>,
) => Promise<SocialActionResult>;

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
  latestMetric: SocialPostMetric | null;
  isPending: boolean;
  runAction: SocialActionRunner;
  savePost: () => void;
}