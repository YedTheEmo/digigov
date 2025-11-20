export type PresignParams = { key: string; contentType?: string };
export type PresignResult = { uploadUrl: string; key: string; fields?: Record<string, string> };

// Dev-friendly stub: returns a mock PUT URL. Replace with AWS SDK v3 if env is set.
export async function presignUpload({ key }: PresignParams): Promise<PresignResult> {
  const bucket = process.env.S3_BUCKET;
  const region = process.env.AWS_REGION;
  const hasAws = !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && bucket && region);
  if (!hasAws) {
    // Local dev upload endpoint; client will PUT the file here, and saved file will be served from /public/uploads
    return { uploadUrl: `/api/uploads/local?key=${encodeURIComponent(key)}`, key };
  }
  // Placeholder for real implementation to keep code running without AWS deps
  const base = `https://${bucket}.s3.${region}.amazonaws.com/${encodeURIComponent(key)}`;
  return { uploadUrl: base, key };
}




