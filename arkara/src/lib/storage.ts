/**
 * S3 / Tigris Storage Client
 *
 * TODO: Configure S3_* environment variables in .env file
 * For Railway: add Tigris plugin, which auto-injects AWS_* vars
 * Map them to S3_* variables in Railway dashboard
 */

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3 = new S3Client({
  region: import.meta.env.S3_REGION ?? 'auto',
  endpoint: import.meta.env.S3_ENDPOINT,
  credentials: {
    accessKeyId: import.meta.env.S3_ACCESS_KEY_ID || '',
    secretAccessKey: import.meta.env.S3_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET = import.meta.env.S3_BUCKET_NAME;

export async function uploadToStorage(sourceUrl: string, key: string): Promise<string> {
  if (!BUCKET) {
    throw new Error('S3_BUCKET_NAME not configured');
  }

  const res = await fetch(sourceUrl);
  const body = Buffer.from(await res.arrayBuffer());

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: res.headers.get('content-type') ?? 'image/webp',
      ACL: 'public-read',
    })
  );

  return `${import.meta.env.S3_PUBLIC_URL}/${key}`;
}

export async function getSignedUploadUrl(key: string): Promise<string> {
  if (!BUCKET) {
    throw new Error('S3_BUCKET_NAME not configured');
  }

  return getSignedUrl(
    s3,
    new PutObjectCommand({ Bucket: BUCKET, Key: key }),
    { expiresIn: 3600 }
  );
}

export async function listImages(prefix = 'generated/'): Promise<string[]> {
  if (!BUCKET) {
    throw new Error('S3_BUCKET_NAME not configured');
  }

  const res = await s3.send(
    new ListObjectsV2Command({ Bucket: BUCKET, Prefix: prefix })
  );

  return (res.Contents ?? []).map((obj) => `${import.meta.env.S3_PUBLIC_URL}/${obj.Key}`);
}
