import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export const runtime = "edge";

export async function GET(request: Request) {
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const count = Math.min(50, Math.max(5, Number(searchParams.get("count")) || 10));
    const order = searchParams.get("order") || "sequential";

    // 优先取未掌握的
    const { data: unmastered } = await supabase
      .from("words")
      .select("id, word, part_of_speech")
      .eq("user_id", user.id)
      .eq("mastered", false)
      .limit(count);

    let words: { id: string; word: string; part_of_speech: string }[];

    if (unmastered && unmastered.length >= count) {
      words = unmastered.slice(0, count);
    } else {
      // 不够时补充已掌握的
      const needMore = count - (unmastered?.length ?? 0);
      const { data: mastered } = await supabase
        .from("words")
        .select("id, word, part_of_speech")
        .eq("user_id", user.id)
        .eq("mastered", true)
        .limit(needMore)
        .order("created_at", { ascending: false });

      words = [...(unmastered ?? []), ...(mastered ?? [])];
    }

    if (words.length === 0) {
      return NextResponse.json({ error: "词库为空，请先上传单词" }, { status: 400 });
    }

    if (order === "random") {
      // Fisher-Yates 洗牌
      for (let i = words.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [words[i], words[j]] = [words[j], words[i]];
      }
    }

    return NextResponse.json({ words: words.slice(0, count) });
  } catch (error) {
    console.error("获取听写单词失败:", error);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
