import { rewriteMediaUrl } from './media';
import type { ContentPost, MediaValue } from '../types/content';

export function getPostImage(post: ContentPost): MediaValue {
  return post.thumbnail_image || post.banner_image || post.cover_image;
}

export function getPostImageUrl(post: ContentPost): string {
  const image = getPostImage(post);
  const rawUrl = typeof image === 'string'
    ? image
    : image?.formats?.sm || image?.formats?.md || image?.url || image?.src || '';

  return rawUrl ? rewriteMediaUrl(rawUrl, { width: 160, quality: 70 }) : '';
}
