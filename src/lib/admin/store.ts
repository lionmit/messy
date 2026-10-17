/**
 * The admin side reads and writes the same private Vercel Blob store as the
 * interview store and the pipeline. It uses the raw BlobApi slice (list, get,
 * put), not the InterviewStore, because it needs the pipeline's files too.
 */
import { vercelBlobApi, type BlobApi } from '@/lib/storage/blob';

let api: BlobApi | null | undefined;

/** The store api, or null when BLOB_READ_WRITE_TOKEN is not set. */
export function getAdminBlobApi(): BlobApi | null {
  if (api === undefined) {
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    api = token ? vercelBlobApi(token) : null;
  }
  return api;
}

/** Tests only. */
export function setAdminBlobApiForTests(next: BlobApi | null | undefined): void {
  api = next;
}
