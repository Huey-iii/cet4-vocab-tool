import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

async function handler(request: NextRequest) {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const url = new URL(request.url);
  const supabasePath = url.pathname.replace(/^\/api\/supabase/, "") + url.search;
  const targetUrl = `${SUPABASE_URL}${supabasePath}`;

  const headers = new Headers(request.headers);
  headers.set("host", new URL(SUPABASE_URL).host);
  headers.delete("content-length");

  if (!headers.has("apikey")) {
    headers.set("apikey", SUPABASE_KEY);
  }
  if (!headers.has("authorization")) {
    headers.set("authorization", `Bearer ${SUPABASE_KEY}`);
  }

  const body = request.body ? await request.arrayBuffer() : undefined;

  try {
    const res = await fetch(targetUrl, {
      method: request.method,
      headers,
      body,
    });

    const responseHeaders = new Headers(res.headers);
    responseHeaders.delete("content-encoding");

    return new NextResponse(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers: responseHeaders,
    });
  } catch (e) {
    return NextResponse.json(
      { error: "Supabase unreachable", detail: String(e) },
      { status: 502 }
    );
  }
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const OPTIONS = handler;
