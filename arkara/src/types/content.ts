export interface MediaFormats {
  sm?: string;
  md?: string;
  lg?: string;
}

export interface MediaAsset {
  url?: string;
  src?: string;
  formats?: MediaFormats;
}

export type MediaValue = string | MediaAsset | null | undefined;

export interface ContentPost {
  slug: string;
  title: string;
  description?: string | null;
  category?: string | null;
  thumbnail_image?: MediaValue;
  banner_image?: MediaValue;
  cover_image?: MediaValue;
}
