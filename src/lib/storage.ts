import "server-only";
import { Files } from "files-sdk";
import { neon } from "files-sdk/neon";

// Neon Object Storage (S3-compatible), via the Files SDK `neon` adapter as recommended by the
// neon-object-storage skill. Endpoint, region and credentials come from the AWS_* variables that
// `neon deploy` / `neon env pull` write for the linked branch (AWS_ENDPOINT_URL_S3, AWS_REGION,
// AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY). The bucket is declared in neon.ts (`buckets.assets`,
// private), so objects are only reachable through short-lived presigned URLs.
export const ASSETS_BUCKET = "assets";

const PRESIGNED_URL_TTL_SECONDS = 300;

let files: Files | null = null;

function storage(): Files {
  if (!process.env.AWS_ENDPOINT_URL_S3) {
    throw new Error("Object storage is not configured: AWS_ENDPOINT_URL_S3 is missing (run `neon env pull`).");
  }
  files ??= new Files({ adapter: neon({ bucket: ASSETS_BUCKET }) });
  return files;
}

export async function putObject(key: string, body: Uint8Array, contentType: string) {
  return storage().upload(key, body, { contentType });
}

export async function presignedGetUrl(key: string): Promise<string> {
  return storage().url(key, { expiresIn: PRESIGNED_URL_TTL_SECONDS });
}

export async function objectExists(key: string): Promise<boolean> {
  return storage().exists(key);
}

export async function deleteObject(key: string): Promise<void> {
  return storage().delete(key);
}
