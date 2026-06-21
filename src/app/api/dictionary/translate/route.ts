import { NextRequest, NextResponse } from "next/server";

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

    const res = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content:
              "你是一个英汉词典助手。用户输入一个英文单词，请输出：1) 中文释义（多个含义用分号分隔）2) 词性。格式严格为 JSON：{\"word\":\"...\",\"part_of_speech\":\"...\",\"chinese_meaning\":\"...\"}。只返回 JSON，不要其他内容。",
          },
          {
            role: "user",
            content: word,
          },
        ],
        temperature: 0.1,
        max_tokens: 300,
      }),
    });

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || "";
    // Extract JSON from response (may be wrapped in ```json blocks)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const result = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

    return NextResponse.json(result);
  } catch (err) {
    console.error("DeepSeek translation error:", err);
    return NextResponse.json({ error: "Translation failed" }, { status: 500 });
  }
}
