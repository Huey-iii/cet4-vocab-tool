import { NextResponse } from "next/server";
import { recognizeWords } from "@/lib/ai";

export const runtime = "edge";

export async function POST(request: Request) {
  try {
    const { image } = await request.json();

    if (!image || typeof image !== "string") {
      return NextResponse.json(
        { error: "请提供 base64 格式的图片数据" },
        { status: 400 }
      );
    }

    const words = await recognizeWords(image);

    if (words.length === 0) {
      return NextResponse.json({
        words: [],
        warning: "未识别到英语单词，请检查图片清晰度后重试",
      });
    }

    return NextResponse.json({ words });
  } catch (error) {
    const err = error as { status?: number; message?: string; code?: string; type?: string };
    console.error("识别失败:", err);

    if (err.status === 429) {
      return NextResponse.json(
        { error: `请求过于频繁，请稍后重试 (${err.message || ""})` },
        { status: 429 }
      );
    }

    console.error("识别失败详情:", JSON.stringify(err, Object.getOwnPropertyNames(err)));
    return NextResponse.json(
      { error: "识别失败，请稍后重试" },
      { status: 500 }
    );
  }
}
