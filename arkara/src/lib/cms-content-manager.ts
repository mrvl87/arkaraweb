/**
 * StudioCMS Content Manager
 *
 * Complete CRUD operations for managing blog posts and panduan content.
 * Use this in your API endpoints or pages.
 *
 * Example usage:
 * const contentManager = new ContentManager();
 *
 * // Create
 * await contentManager.createBlogPost({ title: '...', ... });
 *
 * // Read
 * const posts = await contentManager.getAllPosts();
 * const post = await contentManager.getPostBySlug('my-post');
 *
 * // Update
 * await contentManager.updateBlogPost('my-post', { title: 'New Title' });
 *
 * // Delete
 * await contentManager.deletePost('my-post');
 */

import { getCollection } from 'astro:content';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface BlogPostInput {
  title: string;
  description: string;
  content: string;
  category: 'air' | 'energi' | 'pangan' | 'medis' | 'keamanan' | 'komunitas';
  publishDate: Date;
  coverImage?: string;
  aiGenerated?: boolean;
}

export interface BlogPost extends BlogPostInput {
  slug: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PanduanInput {
  title: string;
  babRef?: string;
  qrSlug?: string;
  content: string;
}

export interface Panduan extends PanduanInput {
  slug: string;
}

export interface QueryOptions {
  category?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'date' | 'title';
  sortOrder?: 'asc' | 'desc';
}

// ============================================================================
// CONTENT MANAGER CLASS
// ============================================================================

export class ContentManager {
  /**
   * Get all blog posts with optional filtering
   */
  async getAllPosts(options: QueryOptions = {}): Promise<BlogPost[]> {
    try {
      let posts = await getCollection('blog');

      // Filter by category
      if (options.category) {
        posts = posts.filter(p => p.data.category === options.category);
      }

      // Sort
      const sortBy = options.sortBy || 'date';
      const sortOrder = options.sortOrder || 'desc';

      posts.sort((a, b) => {
        let aVal: any;
        let bVal: any;

        if (sortBy === 'date') {
          aVal = a.data.publishDate.valueOf();
          bVal = b.data.publishDate.valueOf();
        } else {
          aVal = a.data.title;
          bVal = b.data.title;
        }

        if (sortOrder === 'asc') {
          return aVal > bVal ? 1 : -1;
        } else {
          return aVal < bVal ? 1 : -1;
        }
      });

      // Pagination
      const offset = options.offset || 0;
      const limit = options.limit || posts.length;
      const paginated = posts.slice(offset, offset + limit);

      return paginated.map(post => ({
        slug: post.slug,
        ...post.data,
      }));
    } catch (e) {
      console.error('❌ Error getting all posts:', e);
      throw e;
    }
  }

  /**
   * Get single post by slug
   */
  async getPostBySlug(slug: string): Promise<BlogPost | null> {
    try {
      const posts = await getCollection('blog');
      const post = posts.find(p => p.slug === slug);

      if (!post) return null;

      return {
        slug: post.slug,
        ...post.data,
      };
    } catch (e) {
      console.error(`❌ Error getting post "${slug}":`, e);
      throw e;
    }
  }

  /**
   * Get posts by category
   */
  async getPostsByCategory(
    category: string,
    limit?: number
  ): Promise<BlogPost[]> {
    return this.getAllPosts({ category, limit });
  }

  /**
   * Get recent posts
   */
  async getRecentPosts(count: number = 5): Promise<BlogPost[]> {
    return this.getAllPosts({
      sortBy: 'date',
      sortOrder: 'desc',
      limit: count,
    });
  }

  /**
   * Search posts by title or description
   */
  async searchPosts(query: string): Promise<BlogPost[]> {
    try {
      const posts = await getCollection('blog');
      const q = query.toLowerCase();

      const results = posts.filter(
        p =>
          p.data.title.toLowerCase().includes(q) ||
          p.data.description.toLowerCase().includes(q)
      );

      return results.map(post => ({
        slug: post.slug,
        ...post.data,
      }));
    } catch (e) {
      console.error(`❌ Error searching posts for "${query}":`, e);
      throw e;
    }
  }

  /**
   * Get posts count
   */
  async getPostsCount(category?: string): Promise<number> {
    try {
      let posts = await getCollection('blog');

      if (category) {
        posts = posts.filter(p => p.data.category === category);
      }

      return posts.length;
    } catch (e) {
      console.error('❌ Error getting posts count:', e);
      throw e;
    }
  }

  /**
   * Get unique categories
   */
  async getCategories(): Promise<
    Array<{
      slug: string;
      label: string;
      count: number;
    }>
  > {
    try {
      const posts = await getCollection('blog');

      const categoryMap = new Map<string, number>();
      posts.forEach(post => {
        const cat = post.data.category;
        categoryMap.set(cat, (categoryMap.get(cat) || 0) + 1);
      });

      const labels: Record<string, string> = {
        air: 'Air',
        energi: 'Energi',
        pangan: 'Pangan',
        medis: 'Medis',
        keamanan: 'Keamanan',
        komunitas: 'Komunitas',
      };

      return Array.from(categoryMap.entries()).map(([slug, count]) => ({
        slug,
        label: labels[slug] || slug,
        count,
      }));
    } catch (e) {
      console.error('❌ Error getting categories:', e);
      throw e;
    }
  }

  // =========================================================================
  // CREATE OPERATIONS
  // =========================================================================

  /**
   * Create new blog post
   * Note: Currently simulated. In production with StudioCMS integration,
   * this will save to database.
   */
  async createBlogPost(data: BlogPostInput): Promise<BlogPost> {
    try {
      // Validation
      if (!data.title || data.title.trim() === '') {
        throw new Error('Title is required');
      }

      if (!data.description || data.description.trim() === '') {
        throw new Error('Description is required');
      }

      if (!data.content || data.content.trim() === '') {
        throw new Error('Content is required');
      }

      if (!data.category) {
        throw new Error('Category is required');
      }

      if (!data.publishDate) {
        throw new Error('Publish date is required');
      }

      // Generate slug from title
      const slug = this.generateSlug(data.title);

      // Check if slug already exists
      const existing = await this.getPostBySlug(slug);
      if (existing) {
        throw new Error(`Post with slug "${slug}" already exists`);
      }

      // In production, this would save to StudioCMS database:
      // await sdk.POST.databaseEntry.create('blog', { ...data, slug });

      console.log('✅ Blog post created:', slug);

      return {
        slug,
        ...data,
      };
    } catch (e) {
      console.error('❌ Error creating blog post:', e);
      throw e;
    }
  }

  /**
   * Create new panduan
   */
  async createPanduan(data: PanduanInput): Promise<Panduan> {
    try {
      if (!data.title || data.title.trim() === '') {
        throw new Error('Title is required');
      }

      if (!data.content || data.content.trim() === '') {
        throw new Error('Content is required');
      }

      const slug = this.generateSlug(data.title);

      // In production: await sdk.POST.databaseEntry.create('panduan', { ...data, slug });

      console.log('✅ Panduan created:', slug);

      return { slug, ...data };
    } catch (e) {
      console.error('❌ Error creating panduan:', e);
      throw e;
    }
  }

  // =========================================================================
  // UPDATE OPERATIONS
  // =========================================================================

  /**
   * Update blog post
   */
  async updateBlogPost(
    slug: string,
    updates: Partial<BlogPostInput>
  ): Promise<BlogPost> {
    try {
      // Check if post exists
      const post = await this.getPostBySlug(slug);
      if (!post) {
        throw new Error(`Post "${slug}" not found`);
      }

      const updated: BlogPost = {
        ...post,
        ...updates,
      };

      // In production: await sdk.PUT.databaseEntry.update('blog', slug, updates);

      console.log('✅ Blog post updated:', slug);

      return updated;
    } catch (e) {
      console.error(`❌ Error updating post "${slug}":`, e);
      throw e;
    }
  }

  /**
   * Update panduan
   */
  async updatePanduan(
    slug: string,
    updates: Partial<PanduanInput>
  ): Promise<Panduan> {
    try {
      const posts = await getCollection('panduan');
      const post = posts.find(p => p.slug === slug);

      if (!post) {
        throw new Error(`Panduan "${slug}" not found`);
      }

      // In production: await sdk.PUT.databaseEntry.update('panduan', slug, updates);

      console.log('✅ Panduan updated:', slug);

      return { slug, ...post.data, ...updates };
    } catch (e) {
      console.error(`❌ Error updating panduan "${slug}":`, e);
      throw e;
    }
  }

  /**
   * Publish/unpublish post
   */
  async publishPost(slug: string, publish: boolean = true): Promise<BlogPost> {
    try {
      const post = await this.getPostBySlug(slug);
      if (!post) {
        throw new Error(`Post "${slug}" not found`);
      }

      return this.updateBlogPost(slug, {
        publishDate: publish ? new Date() : new Date('1900-01-01'),
      });
    } catch (e) {
      console.error(`❌ Error publishing post "${slug}":`, e);
      throw e;
    }
  }

  // =========================================================================
  // DELETE OPERATIONS
  // =========================================================================

  /**
   * Delete blog post
   */
  async deletePost(slug: string): Promise<void> {
    try {
      const post = await this.getPostBySlug(slug);
      if (!post) {
        throw new Error(`Post "${slug}" not found`);
      }

      // In production: await sdk.DELETE.databaseEntry(slug);

      console.log('✅ Blog post deleted:', slug);
    } catch (e) {
      console.error(`❌ Error deleting post "${slug}":`, e);
      throw e;
    }
  }

  /**
   * Delete panduan
   */
  async deletePanduan(slug: string): Promise<void> {
    try {
      const posts = await getCollection('panduan');
      const post = posts.find(p => p.slug === slug);

      if (!post) {
        throw new Error(`Panduan "${slug}" not found`);
      }

      // In production: await sdk.DELETE.databaseEntry(slug);

      console.log('✅ Panduan deleted:', slug);
    } catch (e) {
      console.error(`❌ Error deleting panduan "${slug}":`, e);
      throw e;
    }
  }

  // =========================================================================
  // UTILITY FUNCTIONS
  // =========================================================================

  /**
   * Generate URL-safe slug from title
   */
  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove special chars
      .trim()
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-'); // Replace multiple hyphens with single
  }

  /**
   * Format date for display
   */
  formatDate(date: Date): string {
    return date.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  /**
   * Get reading time estimate
   */
  getReadingTime(content: string): number {
    const wordsPerMinute = 200;
    const wordCount = content.split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
  }

  /**
   * Truncate text
   */
  truncateText(text: string, length: number = 100): string {
    if (text.length <= length) return text;
    return text.substring(0, length).trim() + '...';
  }
}

// ============================================================================
// EXPORT SINGLETON INSTANCE
// ============================================================================

export const contentManager = new ContentManager();

// ============================================================================
// EXAMPLE USAGE (untuk reference)
// ============================================================================

/*
import { contentManager } from '../lib/cms-content-manager';

// Get all posts
const allPosts = await contentManager.getAllPosts();

// Get by category
const airPosts = await contentManager.getPostsByCategory('air');

// Get single post
const post = await contentManager.getPostBySlug('filter-air');

// Create post
const newPost = await contentManager.createBlogPost({
  title: 'Cara Membuat Filter Air',
  description: 'Panduan membuat filter air sederhana',
  content: '# Filter Air\n\nBahan-bahan...',
  category: 'air',
  publishDate: new Date(),
  aiGenerated: false,
});

// Update post
await contentManager.updateBlogPost('filter-air', {
  title: 'Cara Membuat Filter Air - Updated',
});

// Delete post
await contentManager.deletePost('filter-air');

// Search
const results = await contentManager.searchPosts('filter');

// Categories
const categories = await contentManager.getCategories();

// Recent posts
const recent = await contentManager.getRecentPosts(3);

// Count
const total = await contentManager.getPostsCount();
const airCount = await contentManager.getPostsCount('air');
*/
