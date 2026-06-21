const SUPABASE_URL = "https://yjbizzvuzvhffmdzwcc.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqYml6enZ1enZoZmZtZHp3Y2MiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTc0OTkwNjczOCwiZXhwIjoyMDY1NDgyNzM4fQ.bMSr39K7Ql-KY_13igHcnleX8snoXBZSUPxArhTJS2Y";

function corsHeaders(): Headers {
  const h = new Headers();
  h.set("access-control-allow-origin", "*");
  h.set("access-control-allow-headers", "*");
  h.set("access-control-allow-methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  h.set("access-control-max-age", "86400");
  return h;
}

export default {
  async fetch(request: Request): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    const url = new URL(request.url);
    const target = `${SUPABASE_URL}${url.pathname}${url.search}`;

    const headers = new Headers();
    request.headers.forEach((value, name) => {
      if (!["host", "cf-connecting-ip", "cf-ipcountry", "cf-ray", "cf-visitor", "x-forwarded-proto", "x-real-ip"].includes(name.toLowerCase())) {
        headers.set(name, value);
      }
    });
    headers.set("apikey", SUPABASE_ANON_KEY);

    let body: ArrayBuffer | null = null;
    if (request.method !== "GET" && request.method !== "HEAD") {
      body = await request.arrayBuffer();
    }

    const res = await fetch(target, {
      method: request.method,
      headers,
      body: body || undefined,
    });

    const merged = corsHeaders();
    res.headers.forEach((value, name) => {
      if (!["content-encoding", "transfer-encoding"].includes(name.toLowerCase())) {
        merged.set(name, value);
      }
    });

    return new Response(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers: merged,
    });
  },
};
