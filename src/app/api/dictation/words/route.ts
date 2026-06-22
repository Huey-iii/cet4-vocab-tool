import { NextResponse } from "next/server";
import { getDB } from "@/lib/d1";

export const runtime = "edge";

export async function GET(request: Request) {
  try {
    const db = getDB();
    const { searchParams } = new URL(request.url);
    const count = Math.min(50, Math.max(5, Number(searchParams.get("count")) || 10));
    const order = searchParams.get("order") || "sequential";

    const { results: unmastered } = await db
      .prepare(`SELECT id, word, part_of_speech FROM words WHERE mastered = 0 LIMIT ?`)
      .bind(count)
      .all<{ id: string; word: string; part_of_speech: string }>();

    let words = unmastered;

    if (words.length < count) {
      const { results: mastered } = await db
        .prepare(`SELECT id, word, part_of_speech FROM words WHERE mastered = 1 ORDER BY created_at DESC LIMIT ?`)
        .bind(count - words.length)
        .all<{ id: string; word: string; part_of_speech: string }>();
      words = [...words, ...mastered];
    }

    if (words.length === 0) {
      return NextResponse.json({ error: "词库为空，请先上传单词" }, { status: 400 });
    }

    if (order === "random") {
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
