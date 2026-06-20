import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  return proxyToSupabase(request);
}

export async function POST(request: NextRequest) {
  return proxyToSupabase(request);
}

export async function PUT(request: NextRequest) {
  return proxyToSupabase(request);
}

export async function PATCH(request: NextRequest) {
  return proxyToSupabase(request);
}

export async function DELETE(request: NextRequest) {
  return proxyToSupabase(request);
}

async function proxyToSupabase(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return NextResponse.json({ error: "Supabase env not configured" }, { status: 500 });
  }

  const supabasePath = request.nextUrl.pathname.replace(/^\/api\/supabase/, "");
  const target = `${url}${supabasePath}${request.nextUrl.search}`;

  const headers = new Headers();
  request.headers.forEach((value, name) => {
    if (!["host", "content-length"].includes(name.toLowerCase())) {
      headers.set(name, value);
    }
  });
  headers.set("host", new URL(url).host);
  headers.set("apikey", key);

  let body: ArrayBuffer | undefined;
  if (request.body) {
    body = await request.arrayBuffer();
  }

  const res = await fetch(target, { method: request.method, headers, body });

  return new NextResponse(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers: { "content-type": res.headers.get("content-type") || "application/json" },
  });
}
