import { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

export const runtime = "edge";

export async function ALL(request: NextRequest) {
  const path = request.nextUrl.pathname.replace("/api/supabase", "");
  const targetUrl = `${SUPABASE_URL}${path}${request.nextUrl.search}`;

  const headers = new Headers(request.headers);
  headers.set("host", new URL(SUPABASE_URL).host);

  // forward apikey from env if not present
  if (!headers.has("apikey")) {
    headers.set("apikey", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  }
  if (!headers.has("authorization")) {
    headers.set("authorization", `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`);
  }

  const res = await fetch(targetUrl, {
    method: request.method,
    headers,
    body: request.body ? await request.arrayBuffer() : undefined,
  });

  const responseHeaders = new Headers(res.headers);
  responseHeaders.delete("set-cookie");
  responseHeaders.delete("content-encoding");

  return new NextResponse(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers: responseHeaders,
  });
}

export { ALL as GET, ALL as POST, ALL as PUT, ALL as PATCH, ALL as DELETE };
