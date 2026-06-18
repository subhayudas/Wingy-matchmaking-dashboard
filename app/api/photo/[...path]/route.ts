import { NextRequest, NextResponse } from "next/server";
import { fetchBlob } from "../../../lib/azure";

export const runtime = "nodejs";
// Photos are immutable; allow Next to cache the rendered response.
export const revalidate = false;

export async function GET(
  _req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const relativePath = (params.path || []).map(decodeURIComponent).join("/");
  if (!relativePath) {
    return NextResponse.json({ error: "missing path" }, { status: 400 });
  }

  let result;
  try {
    result = await fetchBlob(relativePath);
  } catch (err) {
    console.error("photo proxy error", relativePath, err);
    return NextResponse.json({ error: "blob fetch failed" }, { status: 502 });
  }

  if (!result.body) {
    return NextResponse.json({ error: "not found" }, { status: result.status });
  }

  return new NextResponse(result.body, {
    status: 200,
    headers: {
      "Content-Type": result.contentType,
      "Cache-Control": "public, max-age=86400, s-maxage=604800, immutable",
    },
  });
}
