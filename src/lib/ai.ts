import OpenAI from "openai";

// DeepSeek 文本 API
const deepseekClient = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: "https://api.deepseek.com",
});

// 通义千问视觉 API
const qwenClient = new OpenAI({
  apiKey: process.env.QWEN_API_KEY,
  baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
});

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

/** 带指数退避的重试包装 */
async function withRetry<T>(fn: () => Promise<T>, retries = MAX_RETRIES): Promise<T> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error: unknown) {
      if (attempt === retries) throw error;
      const err = error as { status?: number };
      if (err.status === 429 || err.status === 500 || err.status === 503) {
        const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1);
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      throw error;
    }
  }
  throw new Error("unreachable");
}

/** 识别图片中的英语单词（使用通义千问 VL 视觉模型） */
export async function recognizeWords(imageBase64: string): Promise<
  { word: string; partOfSpeech: string; chineseMeaning: string }[]
> {
  return withRetry(async () => {
    const response = await qwenClient.chat.completions.create({
      model: "qwen-vl-plus",
      messages: [
        {
          role: "system",
          content:
            "You are an OCR assistant for CET-4 learners. Identify ALL English words in the image. " +
            "For each word, determine its part of speech (e.g. n., v., adj., adv., prep., conj.) " +
            "and provide a concise Chinese meaning (1-3 Chinese words). " +
            "Return ONLY a JSON array: [{\"word\":\"...\",\"partOfSpeech\":\"n.\",\"chineseMeaning\":\"...\"}]. " +
            "If no English words found, return [].",
        },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: `data:image/jpeg;base64,${imageBase64}` },
            },
          ],
        },
      ],
      max_tokens: 4096,
      temperature: 0.1,
    });

    const text = response.choices[0]?.message?.content?.trim() ?? "[]";
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];
    return JSON.parse(jsonMatch[0]);
  });
}

/** 批改手写单词（使用 DeepSeek 视觉模型） */
export async function gradeHandwriting(
  handwritingBase64: string,
  expectedWords: { word_id: string; expected: string }[]
): Promise<
  {
    word_id: string;
    correct: boolean;
    user_wrote: string;
    suggestion: string | null;
  }[]
> {
  return withRetry(async () => {
    const expectedList = expectedWords
      .map((w, i) => `${i + 1}. ${w.expected}`)
      .join("\n");

    const response = await qwenClient.chat.completions.create({
      model: "qwen-vl-plus",
      messages: [
        {
          role: "system",
          content:
            "You are a handwriting grading assistant. Compare the handwritten words in the image " +
            "against the expected word list. For each expected word, determine: 1) Is the spelling correct? " +
            "2) What did the user actually write? 3) If incorrect, provide a brief suggestion. " +
            "Return ONLY a JSON array: " +
            "[{\"index\":1,\"correct\":true|false,\"user_wrote\":\"...\",\"suggestion\":\"...\" or null}]. " +
            "If the handwriting is too blurry to read, set user_wrote to \"unreadable\" and correct to false.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Expected words (by index):\n${expectedList}`,
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${handwritingBase64}`,
              },
            },
          ],
        },
      ],
      max_tokens: 4096,
      temperature: 0.1,
    });

    const text = response.choices[0]?.message?.content?.trim() ?? "[]";
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];
    const results = JSON.parse(jsonMatch[0]);

    return results.map((r: { index: number; correct: boolean; user_wrote: string; suggestion: string | null }) => ({
      word_id: expectedWords[r.index - 1]?.word_id ?? "",
      correct: r.correct,
      user_wrote: r.user_wrote,
      suggestion: r.suggestion ?? null,
    }));
  });
}
