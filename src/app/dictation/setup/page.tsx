"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Volume2, Pencil, Keyboard, Loader2, Play } from "lucide-react";
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
    <div className="mx-auto max-w-md px-5 py-8 animate-fade-in">
      {/* ── 标题 ── */}
      <div className="mb-6">
        <h2 className="text-xl font-extrabold text-slate-900">听写设置</h2>
        <p className="mt-0.5 text-xs text-slate-400">自定义你的听写练习方式</p>
      </div>

      <div className="space-y-6">
        {/* ── 模式选择 ── */}
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">模式</label>
          <div className="flex rounded-2xl bg-slate-100/80 p-1.5 text-sm">
            {([
              { key: "handwrite", label: "手写练习", desc: "纸上听写", icon: Pencil },
              { key: "typing", label: "键入拼写", desc: "打字练习", icon: Keyboard },
            ] as const).map(({ key, label, desc, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setMode(key)}
                className={`flex flex-1 items-center gap-2.5 rounded-xl px-4 py-3 text-left transition-all duration-200 ${
                  mode === key
                    ? "bg-white text-slate-800 shadow-sm"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                  mode === key ? "bg-indigo-50" : "bg-white/50"
                }`}>
                  <Icon className={`h-4 w-4 ${mode === key ? "text-indigo-500" : "text-slate-400"}`} />
                </div>
                <div>
                  <p className="text-sm font-semibold">{label}</p>
                  <p className="text-[11px] text-slate-400">{desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ── 单词数量 ── */}
        <div className="glass-card px-4 py-4">
          <div className="mb-1 flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-600">单词数量</label>
            <span className="rounded-lg bg-indigo-50 px-2.5 py-0.5 text-sm font-bold text-indigo-600">{count}</span>
          </div>
          <input
            type="range"
            min={5}
            max={50}
            step={5}
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            className="mt-2 w-full"
          />
          <div className="mt-0.5 flex justify-between text-[10px] text-slate-400">
            <span>5</span>
            <span>50</span>
          </div>
        </div>

        {/* ── 朗读次数 ── */}
        <div className="glass-card px-4 py-4">
          <label className="mb-2 block text-xs font-semibold text-slate-600">每个单词朗读次数</label>
          <div className="flex rounded-xl bg-slate-100/80 p-1 text-sm">
            {[1, 2, 3].map((n) => (
              <button
                key={n}
                onClick={() => setRepeat(n)}
                className={`flex-1 rounded-lg py-2 text-center text-sm font-medium transition-all duration-200 ${
                  repeat === n
                    ? "bg-white text-indigo-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {n} 次
              </button>
            ))}
          </div>
        </div>

        {/* ── 手写模式专属设置 ── */}
        {mode === "handwrite" && (
          <>
            {/* 间隔时间 */}
            <div className="glass-card px-4 py-4">
              <div className="mb-1 flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-600">单词间隔</label>
                <span className="rounded-lg bg-indigo-50 px-2.5 py-0.5 text-sm font-bold text-indigo-600">
                  {intervalSec === 0 ? "手动" : `${intervalSec}s`}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={30}
                step={1}
                value={intervalSec}
                onChange={(e) => setIntervalSec(Number(e.target.value))}
                className="mt-2 w-full"
              />
              <div className="mt-0.5 flex justify-between text-[10px] text-slate-400">
                <span>手动</span>
                <span>30s</span>
              </div>
            </div>

            {/* 播放顺序 */}
            <div className="glass-card px-4 py-4">
              <label className="mb-2 block text-xs font-semibold text-slate-600">播放顺序</label>
              <div className="flex rounded-xl bg-slate-100/80 p-1 text-sm">
                {([
                  { key: "sequential", label: "按词库顺序" },
                  { key: "random", label: "随机打乱" },
                ] as const).map((o) => (
                  <button
                    key={o.key}
                    onClick={() => setOrder(o.key)}
                    className={`flex-1 rounded-lg py-2 text-center text-sm font-medium transition-all duration-200 ${
                      order === o.key
                        ? "bg-white text-indigo-600 shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── 音色选择 ── */}
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">朗读音色</label>
          <div className="grid grid-cols-2 gap-2">
            {VOICES.map((v, i) => (
              <button
                key={v.name}
                onClick={() => setVoiceIdx(i)}
                className={`flex items-center gap-2.5 rounded-xl border-2 px-3.5 py-3 text-left transition-all duration-200 ${
                  voiceIdx === i
                    ? "border-indigo-400 bg-indigo-50/50 shadow-sm"
                    : "border-slate-100 bg-white/50 hover:border-slate-200"
                }`}
              >
                <Volume2 className={`h-4 w-4 shrink-0 ${voiceIdx === i ? "text-indigo-500" : "text-slate-400"}`} />
                <span className={`text-xs font-medium ${voiceIdx === i ? "text-slate-800" : "text-slate-500"}`}>
                  {v.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* ── 开始按钮 ── */}
        <button
          onClick={startDictation}
          className="btn-gradient mt-2 flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm"
        >
          <Play className="h-4 w-4" />
          开始{mode === "handwrite" ? "手写听写" : "键入拼写"}
        </button>
      </div>
    </div>
  );
}

export default function DictationSetupPage() {
  return (
    <Suspense fallback={<div className="flex justify-center pt-20"><Loader2 className="h-6 w-6 animate-spin text-indigo-500" /></div>}>
      <SetupPageInner />
    </Suspense>
  );
}
