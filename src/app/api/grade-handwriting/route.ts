import { NextResponse } from "next/server";
import { gradeHandwriting } from "@/lib/ai";

export async function POST(request: Request) {
  try {
    const { image, expected_words } = await request.json();

    if (!image || typeof image !== "string") {
      return NextResponse.json(
        { error: "请提供手写图片的 base64 数据" },
        { status: 400 }
      );
    }

    if (!Array.isArray(expected_words) || expected_words.length === 0) {
      return NextResponse.json(
        { error: "请提供正确答案列表" },
        { status: 400 }
      );
    }

    const results = await gradeHandwriting(image, expected_words);

    if (results.length === 0) {
      return NextResponse.json(
        { error: "无法辨认手写内容，建议重新拍摄清晰照片" },
        { status: 422 }
      );
    }

    const correctCount = results.filter((r) => r.correct).length;
    const score = results.length > 0 ? correctCount / results.length : 0;

    return NextResponse.json({ results, score, total: results.length, correct: correctCount });
  } catch (error) {
    console.error("批改失败:", error);
    return NextResponse.json(
      { error: "批改服务暂时不可用，请稍后重试" },
      { status: 500 }
    );
  }
}
