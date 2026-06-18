import { ClientSecretCredential } from "@azure/identity";

/**
 * Server-side Azure Blob access for user photos.
 *
 * The `wingy` storage account blocks public/anonymous access, so blobs cannot
 * be hot-linked from an <img>. We authenticate with the same AAD service
 * principal the engine uses (Storage Blob Data Reader) and proxy bytes through
 * an API route. Photo blobs live in the `media` container; the paths stored in
 * `mm_user.photo_paths_json` are container-relative (e.g.
 * `<uuid>/instagram/images/<file>`).
 */

export const BLOB_ACCOUNT = process.env.AZURE_BLOB_ACCOUNT || "wingy";
export const BLOB_CONTAINER = process.env.AZURE_BLOB_CONTAINER || "media";
const BLOB_HOST = `https://${BLOB_ACCOUNT}.blob.core.windows.net`;

declare global {
  // eslint-disable-next-line no-var
  var _wingyAzureCred: ClientSecretCredential | undefined;
  // eslint-disable-next-line no-var
  var _wingyBlobToken: { token: string; expiresOnTimestamp: number } | undefined;
}

function credential(): ClientSecretCredential {
  if (!global._wingyAzureCred) {
    const { AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET } = process.env;
    if (!AZURE_TENANT_ID || !AZURE_CLIENT_ID || !AZURE_CLIENT_SECRET) {
      throw new Error("Missing AZURE_TENANT_ID / AZURE_CLIENT_ID / AZURE_CLIENT_SECRET");
    }
    global._wingyAzureCred = new ClientSecretCredential(
      AZURE_TENANT_ID,
      AZURE_CLIENT_ID,
      AZURE_CLIENT_SECRET
    );
  }
  return global._wingyAzureCred;
}

async function blobToken(): Promise<string> {
  const cached = global._wingyBlobToken;
  // refresh 60s before expiry
  if (cached && cached.expiresOnTimestamp - 60_000 > Date.now()) return cached.token;
  const tok = await credential().getToken("https://storage.azure.com/.default");
  if (!tok) throw new Error("Failed to acquire Azure storage token");
  global._wingyBlobToken = { token: tok.token, expiresOnTimestamp: tok.expiresOnTimestamp };
  return tok.token;
}

/** Reject path traversal / absolute-host injection; allow only container-relative paths. */
export function sanitizeBlobPath(path: string): string | null {
  if (!path) return null;
  const clean = path.replace(/^\/+/, "");
  const segments = clean.split("/");
  if (segments.some((s) => s === "" || s === "." || s === ".." || s.includes("\\"))) return null;
  return clean;
}

export interface BlobResult {
  status: number;
  body: ArrayBuffer | null;
  contentType: string;
}

/** Fetch a blob from the `media` container with an AAD bearer token. */
export async function fetchBlob(relativePath: string): Promise<BlobResult> {
  const clean = sanitizeBlobPath(relativePath);
  if (!clean) return { status: 400, body: null, contentType: "application/json" };

  const token = await blobToken();
  const url = `${BLOB_HOST}/${BLOB_CONTAINER}/${clean
    .split("/")
    .map(encodeURIComponent)
    .join("/")}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, "x-ms-version": "2021-12-02" },
    // images are immutable; let the platform cache the upstream fetch
    cache: "force-cache",
  });

  if (!res.ok) return { status: res.status, body: null, contentType: "application/json" };

  return {
    status: 200,
    body: await res.arrayBuffer(),
    contentType: res.headers.get("content-type") || "image/jpeg",
  };
}
