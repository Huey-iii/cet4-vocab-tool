export const onRequest = async (context: EventContext<unknown, never, unknown>) => {
  const { request, env } = context;
  const url = new URL(request.url);

  const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL as string;
  const SUPABASE_ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

  // Strip /api/supabase prefix to get the Supabase path
  const supabasePath = url.pathname.replace(/^\/api\/supabase/, "") + url.search;
  const targetUrl = `${SUPABASE_URL}${supabasePath}`;

  const headers = new Headers(request.headers);
  headers.set("host", new URL(SUPABASE_URL).host);

  if (!headers.has("apikey")) {
    headers.set("apikey", SUPABASE_ANON_KEY);
  }
  if (!headers.has("authorization")) {
    headers.set("authorization", `Bearer ${SUPABASE_ANON_KEY}`);
  }

  const res = await fetch(targetUrl, {
    method: request.method,
    headers,
    body: request.body,
  });

  const responseHeaders = new Headers(res.headers);
  responseHeaders.delete("content-encoding");

  return new Response(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers: responseHeaders,
  });
};
