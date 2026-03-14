/**
 * CMS API Endpoints: GET /api/cms/categories
 *
 * Get all categories with post count
 *
 * Usage:
 * GET http://localhost:4321/api/cms/categories
 */

import type { APIRoute } from 'astro';
import { contentManager } from '../../../lib/cms-content-manager';

export const GET: APIRoute = async () => {
  try {
    const categories = await contentManager.getCategories();

    return new Response(
      JSON.stringify({
        success: true,
        data: { categories },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('❌ Error in GET /api/cms/categories:', error);
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
