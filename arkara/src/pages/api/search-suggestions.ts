import type { APIRoute } from 'astro';
import { searchPublishedContent } from '../../lib/content';

export const GET: APIRoute = async ({ url }) => {
  const query = (url.searchParams.get('q') || '').trim().slice(0, 120);

  if (query.length < 2) {
    return new Response(JSON.stringify({ results: [] }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=30, s-maxage=120',
      },
    });
  }

  const results = await searchPublishedContent(query, 5);

  return new Response(
    JSON.stringify({
      results: results.map((result) => ({
        title: result.title,
        href: result.href,
        type: result.type,
      })),
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=30, s-maxage=120',
      },
    }
  );
};
