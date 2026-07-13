import type {
  SocialAsset,
  SocialCarouselSlide,
  SocialPost,
  SocialPostMetric,
  SocialPostVariant,
  SocialPublication,
} from "@/types/social";

export interface SocialActionResult {
  error?: string;
  success?: boolean;
  summary?: string;
  storagePath?: string;
  version?: number;
  width?: number;
  height?: number;
  warnings?: string[];
  fileName?: string;
  mimeType?: string;
  base64?: string;
  slides?: Array<SocialActionResult & { slideId?: string; slideNumber?: number }>;
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
  assets: SocialAsset[];
  publications: SocialPublication[];
  variants: SocialPostVariant[];
  latestMetric: SocialPostMetric | null;
  metricsHistory: SocialPostMetric[];
  isPending: boolean;
  runAction: SocialActionRunner;
  savePost: (options?: { closeOnSuccess?: boolean }) => Promise<SocialActionResult>;
}