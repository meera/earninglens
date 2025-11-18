'use server';

import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

const r2Endpoint = `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;

if (!process.env.R2_BUCKET_NAME) {
  throw new Error('R2_BUCKET_NAME environment variable is required');
}

const BUCKET_NAME = process.env.R2_BUCKET_NAME;

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
 * Fetch transcript paragraphs from R2
 */
export async function getTranscriptFromR2(r2Path: string) {
  'use server';

  try {
    const r2Client = getR2Client();

    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: r2Path,
    });

    const response = await r2Client.send(command);

    if (!response.Body) {
      throw new Error('No response body from R2');
    }

    const bodyContents = await response.Body.transformToString();
    const data = JSON.parse(bodyContents);

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('Error fetching transcript from R2:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
