/**
 * CMS API Endpoints: GET /api/cms/search
 *
 * Search posts by query string
 *
 * Usage:
 * GET http://localhost:4321/api/cms/search?q=filter
 * GET http://localhost:4321/api/cms/search?q=air&limit=10
 */

import type { APIRoute } from 'astro';
import { contentManager } from '../../../lib/cms-content-manager';

export const GET: APIRoute = async ({ url }) => {
  try {
    const query = url.searchParams.get('q');

    if (!query || query.trim() === '') {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Query parameter "q" is required',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const limit = url.searchParams.get('limit')
      ? parseInt(url.searchParams.get('limit')!)
      : 20;

    // Search posts
    const results = await contentManager.searchPosts(query);
    const limited = results.slice(0, limit);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          query,
          count: limited.length,
          total: results.length,
          posts: limited,
        },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('❌ Error in GET /api/cms/search:', error);
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
