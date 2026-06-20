// 保持向后兼容，实际实现已拆分到 client.ts 和 server.ts
export { createBrowserClient } from "./supabase/client";
export { createServerSupabase } from "./supabase/server";
