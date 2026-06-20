import { NextResponse } from "next/server";

/**
 * TTS 路由 — 使用浏览器内置 Web Speech API
 *
 * DeepSeek 无 TTS 服务，朗读由前端 window.speechSynthesis 完成。
 * 零网络请求、零延迟、零成本，macOS 内置高质量英语音色。
 * 本路由仅作为配置端点返回可用音色信息，供前端设置页展示。
 */

export const runtime = "edge";

const AVAILABLE_VOICES = [
  { id: "en-US", name: "英语（美国）", lang: "en-US" },
  { id: "en-GB", name: "英语（英国）", lang: "en-GB" },
  { id: "default", name: "系统默认", lang: "en-US" },
];

export async function GET() {
  return NextResponse.json({
    provider: "Web Speech API (browser built-in)",
    voices: AVAILABLE_VOICES,
    note: "朗读由浏览器本地语音引擎完成，无需联网。",
  });
}
