import type { APIRoute } from 'astro';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

export const GET: APIRoute = async () => {
  try {
    console.log('Force migrating database...');
    // Run the StudioCMS migration CLI command
    const { stdout, stderr } = await execAsync('npx studiocms migrate --latest');
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Migration completed successfully',
      stdout, 
      stderr 
    }, null, 2), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e: any) {
    console.error('Migration failed:', e);
    return new Response(JSON.stringify({ 
      success: false, 
      message: 'Migration failed',
      error: e.message,
      stdout: e.stdout,
      stderr: e.stderr
    }, null, 2), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
