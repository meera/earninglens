'use server';

import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const r2Endpoint = `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
const BUCKET_NAME = 'markeyhawkeye';

const getR2Client = () => {
  return new S3Client({
    region: 'auto',
    endpoint: r2Endpoint,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });
};

/**
 * Get signed URL for R2 media (audio/video)
 * @param key - R2 object key (e.g., "aehr-test-systems/Q4-2023/nov-13-2025-test-xw6oCFYNz8c_4312/audio.mp3")
 * @returns Signed URL valid for 1 hour
 */
export async function getSignedUrlForR2Media(key: string): Promise<string> {
  console.log(`Getting signed URL for key: ${key}`);
  const r2Client = getR2Client();

  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  try {
    const signedUrl = await getSignedUrl(r2Client, command, { expiresIn: 3600 });
    return signedUrl;
  } catch (error) {
    console.error('Error generating media access URL:', error);
    throw error;
  }
}

/**
 * Extract R2 path from metadata
 * @param metadata - Earnings call metadata object
 * @returns R2 path or null
 */
export function getR2PathFromMetadata(metadata: Record<string, any>): string | null {
  return metadata?.r2_path || null;
}
