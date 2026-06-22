import { NextResponse } from "next/server";
import { getDB } from "@/lib/d1";

export const runtime = "edge";

export async function GET(request: Request) {
  try {
    const db = getDB();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() ?? "";
    const status = searchParams.get("status") ?? "";
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const pageSize = Math.min(100, Math.max(10, Number(searchParams.get("pageSize")) || 30));

    let where = "";
    const params: unknown[] = [];

    if (search) {
      where = `WHERE (word LIKE ? OR part_of_speech LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    if (status === "mastered") {
      where = where ? `${where} AND mastered = 1` : `WHERE mastered = 1`;
    } else if (status === "unmastered") {
      where = where ? `${where} AND mastered = 0` : `WHERE mastered = 0`;
    }

    const countResult = await db.prepare(`SELECT COUNT(*) as total FROM words ${where}`).bind(...params).first<{ total: number }>();
    const total = countResult?.total ?? 0;

    const offset = (page - 1) * pageSize;
    const { results } = await db
      .prepare(`SELECT * FROM words ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`)
      .bind(...params, pageSize, offset)
      .all();

    return NextResponse.json({ words: results, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
  } catch (error) {
    console.error("获取单词失败:", error);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const db = getDB();
    const { id, word, part_of_speech } = await request.json();
    if (!id || !word) {
      return NextResponse.json({ error: "缺少必填字段" }, { status: 400 });
    }
    await db.prepare(`INSERT OR IGNORE INTO words (id, word, part_of_speech) VALUES (?, ?, ?)`).bind(id, word, part_of_speech || "").run();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("添加单词失败:", error);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const db = getDB();
    const { id, mastered } = await request.json();
    if (!id) return NextResponse.json({ error: "缺少单词 ID" }, { status: 400 });
    await db.prepare(`UPDATE words SET mastered = ? WHERE id = ?`).bind(mastered ? 1 : 0, id).run();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("更新单词失败:", error);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const db = getDB();
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: "缺少单词 ID" }, { status: 400 });
    await db.prepare(`DELETE FROM words WHERE id = ?`).bind(id).run();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("删除单词失败:", error);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
