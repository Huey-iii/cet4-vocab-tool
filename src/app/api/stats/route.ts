import { NextResponse } from "next/server";
import { getDB } from "@/lib/d1";

export const runtime = "edge";

export async function GET() {
  try {
    const db = getDB();
    const stats = await db
      .prepare(
        `SELECT
          COUNT(*) as total,
          COALESCE(SUM(CASE WHEN mastered = 1 THEN 1 ELSE 0 END), 0) as mastered,
          COALESCE(SUM(CASE WHEN mastered = 0 THEN 1 ELSE 0 END), 0) as unmastered
        FROM words`
      )
      .first<{ total: number; mastered: number; unmastered: number }>();

    return NextResponse.json({
      total: stats?.total ?? 0,
      mastered: stats?.mastered ?? 0,
      unmastered: stats?.unmastered ?? 0,
      recentSessions: 0,
    });
  } catch (error) {
    console.error("获取统计失败:", error);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
