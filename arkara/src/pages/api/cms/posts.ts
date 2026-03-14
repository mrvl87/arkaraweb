/**
 * CMS API Endpoints: GET /api/cms/posts, POST /api/cms/posts
 *
 * GET:  Retrieve posts with optional filtering
 * POST: Create new blog post
 *
 * Usage:
 * GET  http://localhost:4321/api/cms/posts
 * GET  http://localhost:4321/api/cms/posts?category=air&limit=5
 * POST http://localhost:4321/api/cms/posts
 */

import type { APIRoute } from 'astro';
import { contentManager, type BlogPostInput } from '../../../lib/cms-content-manager';

// ============================================================================
// GET - Retrieve posts
// ============================================================================

export const GET: APIRoute = async ({ url }) => {
  try {
    // Parse query parameters
    const category = url.searchParams.get('category') || undefined;
    const limit = url.searchParams.get('limit')
      ? parseInt(url.searchParams.get('limit')!)
      : undefined;
    const offset = url.searchParams.get('offset')
      ? parseInt(url.searchParams.get('offset')!)
      : undefined;
    const sortBy = (url.searchParams.get('sortBy') as 'date' | 'title') || 'date';
    const sortOrder = (url.searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc';

    // Get posts
    const posts = await contentManager.getAllPosts({
      category,
      limit,
      offset,
      sortBy,
      sortOrder,
    });

    // Get count
    const total = await contentManager.getPostsCount(category);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          posts,
          pagination: {
            total,
            limit: limit || total,
            offset: offset || 0,
          },
        },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('❌ Error in GET /api/cms/posts:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

// ============================================================================
// POST - Create new post
// ============================================================================

interface CreatePostRequest {
  title: string;
  description: string;
  content: string;
  category: 'air' | 'energi' | 'pangan' | 'medis' | 'keamanan' | 'komunitas';
  publishDate?: string; // ISO date string
  coverImage?: string;
  aiGenerated?: boolean;
}

export const POST: APIRoute = async ({ request }) => {
  try {
    // Check method
    if (request.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const body = (await request.json()) as CreatePostRequest;

    // Validate required fields
    if (!body.title) {
      return new Response(
        JSON.stringify({ success: false, error: 'Title is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!body.description) {
      return new Response(
        JSON.stringify({ success: false, error: 'Description is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!body.content) {
      return new Response(
        JSON.stringify({ success: false, error: 'Content is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!body.category) {
      return new Response(
        JSON.stringify({ success: false, error: 'Category is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create post data
    const postData: BlogPostInput = {
      title: body.title,
      description: body.description,
      content: body.content,
      category: body.category,
      publishDate: body.publishDate ? new Date(body.publishDate) : new Date(),
      coverImage: body.coverImage,
      aiGenerated: body.aiGenerated || false,
    };

    // Create post
    const post = await contentManager.createBlogPost(postData);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Post created successfully',
        data: { post },
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('❌ Error in POST /api/cms/posts:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
