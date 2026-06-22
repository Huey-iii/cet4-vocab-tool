import { NextResponse } from "next/server";
import { getDB } from "@/lib/d1";

export const runtime = "edge";

export async function GET() {
  try {
    const db = getDB();
    const totalR = await db.prepare(`SELECT COUNT(*) as total FROM words`).first<{ total: number }>();
    const masteredR = await db.prepare(`SELECT COUNT(*) as total FROM words WHERE mastered = 1`).first<{ total: number }>();
    const unmasteredR = await db.prepare(`SELECT COUNT(*) as total FROM words WHERE mastered = 0`).first<{ total: number }>();

    return NextResponse.json({
      total: totalR?.total ?? 0,
      mastered: masteredR?.total ?? 0,
      unmastered: unmasteredR?.total ?? 0,
      recentSessions: 0,
    });
  } catch (error) {
    console.error("获取统计失败:", error);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
