import { defineStudioCMSConfig } from 'studiocms/config';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Load .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: resolve(__dirname, '.env') });

// Get environment variables (process.env is needed for CLI, import.meta.env for Astro)
const tursoUrl = process.env.TURSO_CONNECTION_URL || 'file:./data/studio.db';
const tursoToken = process.env.TURSO_AUTH_TOKEN;

export default defineStudioCMSConfig({
  dbType: 'libsql',
  setupPage: false,
  dbConnection: {
    connection: {
      url: tursoUrl,
      ...(tursoToken && { authToken: tursoToken }),
    },
  },
});
