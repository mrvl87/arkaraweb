/**
 * CMS API Endpoints: /api/cms/posts/[slug]
 *
 * GET:    Retrieve single post by slug
 * PUT:    Update post
 * DELETE: Delete post
 *
 * Usage:
 * GET    http://localhost:4321/api/cms/posts/filter-air
 * PUT    http://localhost:4321/api/cms/posts/filter-air
 * DELETE http://localhost:4321/api/cms/posts/filter-air
 */

import type { APIRoute } from 'astro';
import { contentManager, type BlogPostInput } from '../../../../lib/cms-content-manager';

// ============================================================================
// GET - Retrieve single post
// ============================================================================

export const GET: APIRoute = async ({ params }) => {
  try {
    const { slug } = params;

    if (!slug) {
      return new Response(
        JSON.stringify({ success: false, error: 'Slug parameter required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const post = await contentManager.getPostBySlug(slug);

    if (!post) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Post with slug "${slug}" not found`,
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify({ success: true, data: { post } }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('❌ Error in GET /api/cms/posts/[slug]:', error);
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
// PUT - Update post
// ============================================================================

interface UpdatePostRequest {
  title?: string;
  description?: string;
  content?: string;
  category?: string;
  publishDate?: string;
  coverImage?: string;
  aiGenerated?: boolean;
}

export const PUT: APIRoute = async ({ params, request }) => {
  try {
    const { slug } = params;

    if (!slug) {
      return new Response(
        JSON.stringify({ success: false, error: 'Slug parameter required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if post exists
    const existingPost = await contentManager.getPostBySlug(slug);
    if (!existingPost) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Post with slug "${slug}" not found`,
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const body = (await request.json()) as UpdatePostRequest;

    // Create update object with only provided fields
    const updates: Partial<BlogPostInput> = {};

    if (body.title !== undefined) updates.title = body.title;
    if (body.description !== undefined) updates.description = body.description;
    if (body.content !== undefined) updates.content = body.content;
    if (body.category !== undefined)
      updates.category = body.category as any;
    if (body.publishDate !== undefined)
      updates.publishDate = new Date(body.publishDate);
    if (body.coverImage !== undefined) updates.coverImage = body.coverImage;
    if (body.aiGenerated !== undefined) updates.aiGenerated = body.aiGenerated;

    // Update post
    const updatedPost = await contentManager.updateBlogPost(slug, updates);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Post updated successfully',
        data: { post: updatedPost },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('❌ Error in PUT /api/cms/posts/[slug]:', error);
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
// DELETE - Delete post
// ============================================================================

export const DELETE: APIRoute = async ({ params }) => {
  try {
    const { slug } = params;

    if (!slug) {
      return new Response(
        JSON.stringify({ success: false, error: 'Slug parameter required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if post exists
    const post = await contentManager.getPostBySlug(slug);
    if (!post) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Post with slug "${slug}" not found`,
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Delete post
    await contentManager.deletePost(slug);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Post "${slug}" deleted successfully`,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('❌ Error in DELETE /api/cms/posts/[slug]:', error);
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
