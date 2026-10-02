import "server-only";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

function getClient() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "R2 credentials belum diset (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY)",
    );
  }
  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
}

function getBucket() {
  const bucket = process.env.R2_BUCKET_NAME;
  if (!bucket) throw new Error("R2_BUCKET_NAME belum diset");
  return bucket;
}

function getPublicUrl() {
  const url = process.env.R2_PUBLIC_URL;
  if (!url) throw new Error("R2_PUBLIC_URL belum diset");
  return url.replace(/\/$/, "");
}

const MAX_SIZE = 2 * 1024 * 1024; // 2 MB
const ALLOWED_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
];

export async function uploadFile(file: File, key: string): Promise<string> {
  if (file.size > MAX_SIZE) throw new Error("Fail terlalu besar (maks 2MB)");
  if (!ALLOWED_TYPES.includes(file.type))
    throw new Error("Jenis fail tak disokong (PNG, JPG, WebP, SVG sahaja)");

  const buffer = Buffer.from(await file.arrayBuffer());
  await getClient().send(
    new PutObjectCommand({
      Bucket: getBucket(),
      Key: key,
      Body: buffer,
      ContentType: file.type,
    }),
  );
  return `${getPublicUrl()}/${key}`;
}
