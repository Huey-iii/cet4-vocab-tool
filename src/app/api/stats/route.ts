import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export const runtime = "edge";

export async function GET() {
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const { count: total } = await supabase
      .from("words")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    const { count: mastered } = await supabase
      .from("words")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("mastered", true);

    const { count: unmastered } = await supabase
      .from("words")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("mastered", false);

    const { count: recentSessions } = await supabase
      .from("dictation_sessions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    return NextResponse.json({
      total: total ?? 0,
      mastered: mastered ?? 0,
      unmastered: unmastered ?? 0,
      recentSessions: recentSessions ?? 0,
    });
  } catch (error) {
    console.error("获取统计失败:", error);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
