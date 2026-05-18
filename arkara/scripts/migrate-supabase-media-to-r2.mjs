import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { config as loadEnv } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import {
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';

const __dirname = dirname(fileURLToPath(import.meta.url));

for (const envPath of [
  resolve(__dirname, '../.env'),
  resolve(__dirname, '../../nextjsCMS/.env.local'),
  resolve(process.cwd(), '.env.local'),
  resolve(process.cwd(), '.env'),
]) {
  loadEnv({ path: envPath, override: false, quiet: true });
}

function parseArgs(argv) {
  const args = new Map();

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('--')) continue;

    const [rawKey, inlineValue] = token.slice(2).split('=', 2);
    const next = argv[index + 1];

    if (inlineValue !== undefined) {
      args.set(rawKey, inlineValue);
    } else if (next && !next.startsWith('--')) {
      args.set(rawKey, next);
      index += 1;
    } else {
      args.set(rawKey, true);
    }
  }

  return args;
}

const args = parseArgs(process.argv.slice(2));

function argString(name, fallback = undefined) {
  const value = args.get(name);
  if (value === true || value === undefined) return fallback;
  return String(value);
}

function argNumber(name, fallback) {
  const value = Number(argString(name, ''));
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function argBool(name) {
  return args.has(name) && args.get(name) !== 'false';
}

function getEnvAny(names) {
  for (const name of names) {
    const value = process.env[name];
    if (value && value.trim()) return value.trim();
  }
  return '';
}

function requireEnvAny(names, label) {
  const value = getEnvAny(names);
  if (!value) {
    throw new Error(`Missing ${label}: set one of ${names.join(', ')}`);
  }
  return value;
}

function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(unitIndex === 0 ? 0 : 2)} ${units[unitIndex]}`;
}

function encodeObjectPath(path) {
  return path
    .split('/')
    .map((segment) => encodeURIComponent(decodeURIComponent(segment)))
    .join('/');
}

function publicSupabaseObjectUrl(baseUrl, bucket, key) {
  return `${baseUrl.replace(/\/$/, '')}/storage/v1/object/public/${encodeURIComponent(bucket)}/${encodeObjectPath(key)}`;
}

function objectSize(object) {
  const size = Number(object.metadata?.size ?? object.metadata?.contentLength ?? 0);
  return Number.isFinite(size) ? size : 0;
}

function objectContentType(object) {
  return object.metadata?.mimetype || object.metadata?.contentType || 'application/octet-stream';
}

function objectCacheControl(object) {
  const raw = object.metadata?.cacheControl || object.metadata?.cache_control;
  if (!raw) return 'public, max-age=31536000, immutable';
  if (/^\d+$/.test(String(raw))) return `public, max-age=${raw}, immutable`;
  return String(raw);
}

function isNotFound(error) {
  return error?.$metadata?.httpStatusCode === 404
    || error?.name === 'NotFound'
    || error?.name === 'NoSuchKey';
}

async function listSupabaseObjectsFromStorageApi({ supabaseUrl, serviceRoleKey, bucket, prefix }) {
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const pageSize = 1000;
  const objects = [];

  async function walk(folder) {
    let offset = 0;

    while (true) {
      const { data, error } = await supabase.storage.from(bucket).list(folder, {
        limit: pageSize,
        offset,
        sortBy: { column: 'name', order: 'asc' },
      });

      if (error) throw new Error(`Failed to list Supabase storage folder "${folder}": ${error.message}`);
      if (!data || data.length === 0) break;

      for (const item of data) {
        const key = folder ? `${folder.replace(/\/$/, '')}/${item.name}` : item.name;

        if (!item.id && !item.metadata) {
          await walk(key);
          continue;
        }

        objects.push({
          bucket_id: bucket,
          name: key,
          metadata: item.metadata ?? {},
          created_at: item.created_at ?? null,
          updated_at: item.updated_at ?? null,
        });
      }

      if (data.length < pageSize) break;
      offset += pageSize;
    }
  }

  await walk((prefix || '').replace(/\/$/, ''));
  return objects;
}

async function listSupabaseObjects({ supabaseUrl, serviceRoleKey, bucket, prefix }) {
  const storageDb = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    db: {
      schema: 'storage',
    },
  });

  const pageSize = 1000;
  let from = 0;
  const objects = [];

  try {
    while (true) {
      let query = storageDb
        .from('objects')
        .select('bucket_id,name,metadata,created_at,updated_at')
        .eq('bucket_id', bucket)
        .order('name', { ascending: true })
        .range(from, from + pageSize - 1);

      if (prefix) {
        query = query.like('name', `${prefix}%`);
      }

      const { data, error } = await query;
      if (error) throw new Error(error.message);

      objects.push(...(data ?? []));
      if (!data || data.length < pageSize) break;
      from += pageSize;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!/schema|storage/i.test(message)) {
      throw new Error(`Failed to list Supabase storage objects: ${message}`);
    }

    console.log('Storage schema is not exposed through Data API; falling back to Supabase Storage list API.');
    return listSupabaseObjectsFromStorageApi({ supabaseUrl, serviceRoleKey, bucket, prefix });
  }

  return objects;
}

function createR2Client({ endpoint, accessKeyId, secretAccessKey }) {
  return new S3Client({
    region: 'auto',
    endpoint,
    forcePathStyle: true,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

async function headR2Object(client, bucket, key) {
  try {
    return await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
  } catch (error) {
    if (isNotFound(error)) return null;
    throw error;
  }
}

async function listR2Objects(client, bucket, prefix) {
  const objects = [];
  let ContinuationToken;

  do {
    const response = await client.send(new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: prefix || undefined,
      ContinuationToken,
    }));

    objects.push(...(response.Contents ?? []));
    ContinuationToken = response.NextContinuationToken;
  } while (ContinuationToken);

  return objects;
}

async function runPool(items, concurrency, worker) {
  let cursor = 0;
  const workers = Array.from({ length: concurrency }, async () => {
    while (cursor < items.length) {
      const currentIndex = cursor;
      cursor += 1;
      await worker(items[currentIndex], currentIndex);
    }
  });

  await Promise.all(workers);
}

function compareObjects(sourceObjects, destinationObjects) {
  const destinationByKey = new Map(destinationObjects.map((object) => [object.Key, object]));
  const missing = [];
  const sizeMismatches = [];

  for (const source of sourceObjects) {
    const destination = destinationByKey.get(source.name);
    if (!destination) {
      missing.push(source.name);
      continue;
    }

    const sourceSize = objectSize(source);
    const destinationSize = Number(destination.Size ?? 0);
    if (sourceSize !== destinationSize) {
      sizeMismatches.push({
        key: source.name,
        sourceSize,
        destinationSize,
      });
    }
  }

  return {
    missing,
    sizeMismatches,
  };
}

async function writeReport(report) {
  const reportDir = resolve(__dirname, '../migration-reports');
  await mkdir(reportDir, { recursive: true });

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportPath = resolve(reportDir, `r2-media-migration-${stamp}.json`);
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return reportPath;
}

async function main() {
  const dryRun = argBool('dry-run');
  const verifyOnly = argBool('verify-only');
  const force = argBool('force');
  const sourceBucket = argString('source-bucket', process.env.SUPABASE_MEDIA_BUCKET || 'media');
  const sourcePrefix = argString('prefix', process.env.SUPABASE_MEDIA_PREFIX || 'uploads/');
  const limit = argNumber('limit', 0);
  const concurrency = argNumber('concurrency', 4);
  const batchSize = Math.min(argNumber('batch-size', 20), 20);
  const allowGenericS3 = argBool('allow-generic-s3');
  const workerUrl = argString('worker-url', getEnvAny(['R2_MIGRATION_WORKER_URL']));

  const supabaseUrl = requireEnvAny(['SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL'], 'Supabase project URL');
  const serviceRoleKey = requireEnvAny(['SUPABASE_SERVICE_ROLE_KEY'], 'Supabase service role key');

  const r2Bucket = argString('r2-bucket', getEnvAny(['R2_BUCKET', 'S3_BUCKET_NAME']) || 'arkara-media');
  const r2Endpoint = getEnvAny(['R2_ENDPOINT'])
    || (process.env.R2_ACCOUNT_ID ? `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com` : '')
    || getEnvAny(['S3_ENDPOINT']);
  const r2AccessKeyId = getEnvAny(['R2_ACCESS_KEY_ID', 'CLOUDFLARE_R2_ACCESS_KEY_ID', 'S3_ACCESS_KEY_ID', 'AWS_ACCESS_KEY_ID']);
  const r2SecretAccessKey = getEnvAny(['R2_SECRET_ACCESS_KEY', 'CLOUDFLARE_R2_SECRET_ACCESS_KEY', 'S3_SECRET_ACCESS_KEY', 'AWS_SECRET_ACCESS_KEY']);
  const r2PublicBaseUrl = getEnvAny(['R2_PUBLIC_URL', 'S3_PUBLIC_URL']) || 'https://media.arkaraweb.com';

  let r2LooksConfigured = Boolean(r2Endpoint && r2AccessKeyId && r2SecretAccessKey);
  const endpointLooksR2 = /r2\.cloudflarestorage\.com/i.test(r2Endpoint);

  if (r2LooksConfigured && !endpointLooksR2 && !allowGenericS3) {
    if (dryRun && !verifyOnly) {
      console.log(`Ignoring non-R2 endpoint during dry-run: ${r2Endpoint}`);
      r2LooksConfigured = false;
    } else {
      throw new Error(`Refusing non-R2 endpoint "${r2Endpoint}". Set R2_ENDPOINT/R2_ACCOUNT_ID for Cloudflare R2, or pass --allow-generic-s3 intentionally.`);
    }
  }

  if (!dryRun && !workerUrl && !r2LooksConfigured) {
    throw new Error('Missing R2 credentials. Set R2_ENDPOINT or R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_BUCKET.');
  }

  if (verifyOnly && !r2LooksConfigured) {
    throw new Error('Verify mode requires R2 credentials.');
  }

  console.log(`Source: ${supabaseUrl.replace(/\/$/, '')}/${sourceBucket}/${sourcePrefix || ''}`);
  console.log(`Destination: ${workerUrl ? 'temporary migration Worker' : r2Bucket} at ${endpointLooksR2 ? 'Cloudflare R2' : r2Endpoint || 'not configured'}`);
  console.log(`Public base URL target: ${r2PublicBaseUrl.replace(/\/$/, '')}`);
  console.log(`Mode: ${dryRun ? 'dry-run' : verifyOnly ? 'verify-only' : workerUrl ? 'worker-copy' : 'copy'}; concurrency=${concurrency}; batch=${batchSize}${limit ? `; limit=${limit}` : ''}`);

  const allSourceObjects = await listSupabaseObjects({
    supabaseUrl,
    serviceRoleKey,
    bucket: sourceBucket,
    prefix: sourcePrefix,
  });

  const sourceObjects = limit ? allSourceObjects.slice(0, limit) : allSourceObjects;
  const sourceBytes = sourceObjects.reduce((sum, object) => sum + objectSize(object), 0);

  console.log(`Supabase objects selected: ${sourceObjects.length}/${allSourceObjects.length}`);
  console.log(`Supabase selected size: ${formatBytes(sourceBytes)}`);

  const result = {
    createdAt: new Date().toISOString(),
    mode: dryRun ? 'dry-run' : verifyOnly ? 'verify-only' : 'copy',
    source: {
      projectUrl: supabaseUrl.replace(/\/$/, ''),
      bucket: sourceBucket,
      prefix: sourcePrefix,
      selectedObjects: sourceObjects.length,
      totalObjectsInPrefix: allSourceObjects.length,
      selectedBytes: sourceBytes,
    },
    destination: {
      bucket: r2Bucket,
      endpoint: endpointLooksR2 ? 'cloudflare-r2' : r2Endpoint ? 'non-r2-redacted' : 'not-configured',
      publicBaseUrl: r2PublicBaseUrl.replace(/\/$/, ''),
    },
    copied: [],
    skipped: [],
    failed: [],
    verification: null,
  };

  if (workerUrl && !dryRun && !verifyOnly) {
    const endpoint = workerUrl.replace(/\/$/, '');
    const batches = [];
    for (let index = 0; index < sourceObjects.length; index += batchSize) {
      batches.push(sourceObjects.slice(index, index + batchSize));
    }

    for (let index = 0; index < batches.length; index += 1) {
      const batch = batches[index];
      const response = await fetch(`${endpoint}/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: batch.map((object) => ({
            key: object.name,
            size: objectSize(object),
            contentType: objectContentType(object),
          })),
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok || !data) {
        result.failed.push({
          key: `batch-${index + 1}`,
          message: `Worker batch failed with HTTP ${response.status}`,
        });
      } else {
        result.copied.push(...(data.copied ?? []));
        result.skipped.push(...(data.skipped ?? []));
        result.failed.push(...(data.failed ?? []).map((item) => ({
          key: item.key,
          message: item.error || 'worker_failed',
        })));
      }

      console.log(`Worker batch ${index + 1}/${batches.length}: copied=${result.copied.length}, skipped=${result.skipped.length}, failed=${result.failed.length}`);
    }

    const reportPath = await writeReport(result);
    console.log(`Copied: ${result.copied.length}`);
    console.log(`Skipped: ${result.skipped.length}`);
    console.log(`Failed: ${result.failed.length}`);
    console.log(`Report written: ${reportPath}`);

    if (result.failed.length > 0) {
      process.exitCode = 1;
    }
    return;
  }

  if (dryRun && !r2LooksConfigured) {
    console.log('Dry-run source audit completed. R2 credentials are not configured, so destination checks were skipped.');
    const reportPath = await writeReport(result);
    console.log(`Report written: ${reportPath}`);
    return;
  }

  const r2 = createR2Client({
    endpoint: r2Endpoint,
    accessKeyId: r2AccessKeyId,
    secretAccessKey: r2SecretAccessKey,
  });

  if (!dryRun && !verifyOnly) {
    await runPool(sourceObjects, concurrency, async (object, index) => {
      const key = object.name;
      const expectedSize = objectSize(object);

      try {
        const existing = force ? null : await headR2Object(r2, r2Bucket, key);
        if (existing && Number(existing.ContentLength ?? 0) === expectedSize) {
          result.skipped.push({ key, reason: 'exists_same_size', bytes: expectedSize });
          if ((index + 1) % 25 === 0) console.log(`Progress: ${index + 1}/${sourceObjects.length}`);
          return;
        }

        const sourceUrl = publicSupabaseObjectUrl(supabaseUrl, sourceBucket, key);
        const response = await fetch(sourceUrl, {
          headers: {
            Accept: objectContentType(object),
          },
        });

        if (!response.ok) {
          throw new Error(`Download failed with HTTP ${response.status}`);
        }

        const body = Buffer.from(await response.arrayBuffer());
        if (expectedSize && body.byteLength !== expectedSize) {
          throw new Error(`Downloaded size mismatch: expected ${expectedSize}, got ${body.byteLength}`);
        }

        await r2.send(new PutObjectCommand({
          Bucket: r2Bucket,
          Key: key,
          Body: body,
          ContentType: objectContentType(object),
          CacheControl: objectCacheControl(object),
        }));

        result.copied.push({ key, bytes: body.byteLength });
        if ((index + 1) % 25 === 0) console.log(`Progress: ${index + 1}/${sourceObjects.length}`);
      } catch (error) {
        result.failed.push({
          key,
          message: error instanceof Error ? error.message : String(error),
        });
        console.error(`Failed: ${key} - ${error instanceof Error ? error.message : String(error)}`);
      }
    });
  }

  if (dryRun) {
    const destinationObjects = await listR2Objects(r2, r2Bucket, sourcePrefix);
    result.verification = {
      destinationObjects: destinationObjects.length,
      destinationBytes: destinationObjects.reduce((sum, object) => sum + Number(object.Size ?? 0), 0),
      comparison: compareObjects(sourceObjects, destinationObjects),
    };
  } else {
    const destinationObjects = await listR2Objects(r2, r2Bucket, sourcePrefix);
    result.verification = {
      destinationObjects: destinationObjects.length,
      destinationBytes: destinationObjects.reduce((sum, object) => sum + Number(object.Size ?? 0), 0),
      comparison: compareObjects(sourceObjects, destinationObjects),
    };
  }

  const reportPath = await writeReport(result);
  console.log(`Copied: ${result.copied.length}`);
  console.log(`Skipped: ${result.skipped.length}`);
  console.log(`Failed: ${result.failed.length}`);
  console.log(`R2 objects in prefix: ${result.verification.destinationObjects}`);
  console.log(`R2 size in prefix: ${formatBytes(result.verification.destinationBytes)}`);
  console.log(`Missing after compare: ${result.verification.comparison.missing.length}`);
  console.log(`Size mismatches after compare: ${result.verification.comparison.sizeMismatches.length}`);
  console.log(`Report written: ${reportPath}`);

  if (result.failed.length > 0 || result.verification.comparison.missing.length > 0 || result.verification.comparison.sizeMismatches.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
