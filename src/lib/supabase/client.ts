import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export function createBrowserClient() {
  // Client-side: route through Next.js API proxy to bypass GFW block on Supabase IP
  // Server-side (middleware / RSC) uses real URL as Cloudflare edge can reach Supabase
  const url = typeof window !== "undefined" ? "/api/supabase" : SUPABASE_URL;
  return createClient(url, SUPABASE_KEY);
}
