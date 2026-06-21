import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    const { word } = await req.json();
    if (!word || typeof word !== "string") {
      return NextResponse.json({ error: "Missing word" }, { status: 400 });
    }

    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "DeepSeek not configured" }, { status: 500 });
    }

    const prompt = `你是一个CET-4英语词典助手。请为单词"${word}"提供学习信息，严格按JSON返回：{"word":"原词","phonetic":"国际音标","part_of_speech":"词性","chinese_meaning":"中文释义（多个含义分号分隔）","example_en":"一个典型英文例句","example_cn":"例句中文翻译","synonyms":"2-3个近义词英文逗号分隔","word_forms":"词形变化（复数/过去式/过去分词/现在分词/比较级/最高级等，没有填空串）"}`;

    const res = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
        max_tokens: 500,
      }),
    });

    if (!res.ok) {
      return NextResponse.json({ error: `DeepSeek API ${res.status}` }, { status: 502 });
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ error: "Empty response" }, { status: 502 });
    }

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "Parse failed" }, { status: 502 });
    }

    return NextResponse.json(JSON.parse(jsonMatch[0]));
  } catch (err) {
    console.error("DeepSeek error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
