"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Volume2, Pencil, Keyboard, Loader2 } from "lucide-react";
import { VOICES } from "@/lib/tts";

function SetupPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = (searchParams.get("mode") as "handwrite" | "typing") || "handwrite";

  const [mode, setMode] = useState<"handwrite" | "typing">(initialMode);
  const [count, setCount] = useState(10);
  const [repeat, setRepeat] = useState(2);
  const [intervalSec, setIntervalSec] = useState(5);
  const [order, setOrder] = useState<"random" | "sequential">("sequential");
  const [voiceIdx, setVoiceIdx] = useState(0);

  function startDictation() {
    const params = new URLSearchParams({
      count: String(count),
      repeat: String(repeat),
      voice: VOICES[voiceIdx].name,
    });
    if (mode === "handwrite") {
      params.set("interval", String(intervalSec));
      params.set("order", order);
      router.push(`/dictation/handwrite?${params}`);
    } else {
      router.push(`/dictation/typing?${params}`);
    }
  }

  return (
    <div className="mx-auto max-w-md p-6">
      <h2 className="mb-6 text-xl font-bold text-gray-900">听写设置</h2>

      {/* 模式选择 */}
      <div className="mb-5">
        <div className="flex rounded-xl bg-gray-100 p-1 text-sm">
          {([
            { key: "handwrite", label: "手写", icon: Pencil },
            { key: "typing", label: "键入", icon: Keyboard },
          ] as const).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setMode(key)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 transition ${
                mode === key ? "bg-white font-medium text-gray-900 shadow-sm" : "text-gray-500"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}模式
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-5">
        {/* 单词数量 */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-600">单词数量</label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={5}
              max={50}
              step={5}
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="flex-1"
            />
            <span className="w-8 text-right text-sm font-medium text-gray-900">{count}</span>
          </div>
        </div>

        {/* 朗读次数 */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-600">每个单词朗读次数</label>
          <div className="flex rounded-lg border border-gray-300 text-sm">
            {[1, 2, 3].map((n) => (
              <button
                key={n}
                onClick={() => setRepeat(n)}
                className={`flex-1 py-2 text-center first:rounded-l-lg last:rounded-r-lg transition ${
                  repeat === n ? "bg-blue-50 text-blue-600" : "text-gray-500 hover:bg-gray-50"
                }`}
              >
                {n} 次
              </button>
            ))}
          </div>
        </div>

        {/* 间隔时间（仅手写模式） */}
        {mode === "handwrite" && (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-600">
            单词间隔（秒）
            {intervalSec === 0 && <span className="ml-1 text-xs text-blue-500">手动翻页</span>}
          </label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={0}
              max={30}
              step={1}
              value={intervalSec}
              onChange={(e) => setIntervalSec(Number(e.target.value))}
              className="flex-1"
            />
            <span className="w-8 text-right text-sm font-medium text-gray-900">{intervalSec}s</span>
          </div>
        </div>
        )}

        {/* 播放顺序（仅手写模式） */}
        {mode === "handwrite" && (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-600">播放顺序</label>
          <div className="flex rounded-lg border border-gray-300 text-sm">
            {(["sequential", "random"] as const).map((o) => (
              <button
                key={o}
                onClick={() => setOrder(o)}
                className={`flex-1 py-2 text-center first:rounded-l-lg last:rounded-r-lg transition ${
                  order === o ? "bg-blue-50 text-blue-600" : "text-gray-500 hover:bg-gray-50"
                }`}
              >
                {{ sequential: "按词库顺序", random: "随机打乱" }[o]}
              </button>
            ))}
          </div>
        </div>
        )}

        {/* 音色选择 */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-600">朗读音色</label>
          <div className="grid grid-cols-2 gap-2">
            {VOICES.map((v, i) => (
              <button
                key={v.name}
                onClick={() => setVoiceIdx(i)}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition ${
                  voiceIdx === i ? "border-blue-400 bg-blue-50" : "border-gray-200"
                }`}
              >
                <Volume2 className={`h-4 w-4 ${voiceIdx === i ? "text-blue-500" : "text-gray-400"}`} />
                <span>{v.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 开始按钮 */}
        <button
          onClick={startDictation}
          className="mt-2 w-full rounded-xl bg-blue-600 py-3 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          开始{mode === "handwrite" ? "手写听写" : "键入拼写"}
        </button>
      </div>
    </div>
  );
}

export default function DictationSetupPage() {
  return (
    <Suspense fallback={<div className="flex justify-center pt-20"><Loader2 className="h-6 w-6 animate-spin text-blue-500" /></div>}>
      <SetupPageInner />
    </Suspense>
  );
}
