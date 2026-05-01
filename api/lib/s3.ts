import { S3Client } from "@aws-sdk/client-s3";
import { env } from "./env";

let client: S3Client | null = null;

export function getS3Client(): S3Client {
  if (!env.s3.accessKeyId || !env.s3.secretAccessKey || !env.s3.bucket) {
    throw new Error("S3 storage is not configured");
  }
  if (!client) {
    client = new S3Client({
      region: env.s3.region,
      endpoint: env.s3.endpoint || undefined,
      forcePathStyle: !!env.s3.endpoint,
      credentials: {
        accessKeyId: env.s3.accessKeyId,
        secretAccessKey: env.s3.secretAccessKey,
      },
    });
  }
  return client;
}

export function isS3Configured(): boolean {
  return Boolean(env.s3.accessKeyId && env.s3.secretAccessKey && env.s3.bucket);
}

export function buildPublicUrl(key: string): string {
  if (env.s3.publicBaseUrl) {
    const base = env.s3.publicBaseUrl.replace(/\/+$/, "");
    return `${base}/${key}`;
  }
  if (env.s3.endpoint) {
    const base = env.s3.endpoint.replace(/\/+$/, "");
    return `${base}/${env.s3.bucket}/${key}`;
  }
  return `https://${env.s3.bucket}.s3.${env.s3.region}.amazonaws.com/${key}`;
}
