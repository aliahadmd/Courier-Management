import { getCloudflareContext } from "@opennextjs/cloudflare";

export async function getDatabase() {
  const context = await getCloudflareContext({ async: true });
  const db = context.env.COURIER_DB;
  if (!db) {
    throw new Error("COURIER_DB binding is not configured on this environment.");
  }
  return db;
}

export async function getProofBucket() {
  const context = await getCloudflareContext({ async: true });
  const bucket = context.env.PROOF_BUCKET;
  if (!bucket) {
    throw new Error("PROOF_BUCKET binding is not configured on this environment.");
  }
  return bucket;
}
