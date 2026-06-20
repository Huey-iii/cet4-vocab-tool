import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

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
    const search = searchParams.get("search")?.trim() ?? "";
    const status = searchParams.get("status") ?? "";
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const pageSize = Math.min(100, Math.max(10, Number(searchParams.get("pageSize")) || 30));

    let query = supabase
      .from("words")
      .select("*", { count: "exact" })
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (search) {
      query = query.or(`word.ilike.%${search}%,part_of_speech.ilike.%${search}%`);
    }

    if (status === "mastered") {
      query = query.eq("mastered", true);
    } else if (status === "unmastered") {
      query = query.eq("mastered", false);
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await query.range(from, to);

    if (error) {
      console.error("读取 words 失败:", error);
      return NextResponse.json({ error: "读取失败" }, { status: 500 });
    }

    return NextResponse.json({
      words: data ?? [],
      total: count ?? 0,
      page,
      pageSize,
      totalPages: Math.ceil((count ?? 0) / pageSize),
    });
  } catch (error) {
    console.error("获取单词失败:", error);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}

/** 更新单词（掌握状态切换） */
export async function PATCH(request: Request) {
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const { id, mastered } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "缺少单词 ID" }, { status: 400 });
    }

    const { error } = await supabase
      .from("words")
      .update({ mastered: !!mastered })
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("更新单词失败:", error);
      return NextResponse.json({ error: "更新失败" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("更新单词失败:", error);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}

/** 删除单词 */
export async function DELETE(request: Request) {
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "缺少单词 ID" }, { status: 400 });
    }

    const { error } = await supabase
      .from("words")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("删除单词失败:", error);
      return NextResponse.json({ error: "删除失败" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("删除单词失败:", error);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
