"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Loader2, Play, Pause, SkipForward, Camera,
  CheckCircle, XCircle, AlertTriangle, Sparkles,
} from "lucide-react";
import { resolveVoice } from "@/lib/tts";
import { compressAndToBase64 } from "@/lib/image";

interface Word {
  id: string;
  word: string;
  part_of_speech: string;
}

interface GradeResult {
  word_id: string;
  correct: boolean;
  user_wrote: string;
  suggestion: string | null;
}

function HandwritePageInner() {
  const router = useRouter();
  const params = useSearchParams();

  const count = Number(params.get("count")) || 10;
  const repeat = Number(params.get("repeat")) || 2;
  const interval = Number(params.get("interval")) || 5;
  const order = params.get("order") || "sequential";
  const voiceName = params.get("voice") || "Samantha";

  const [phase, setPhase] = useState<
    "loading" | "ready" | "playing" | "paused" | "finished" | "grading" | "result"
  >("loading");
  const [words, setWords] = useState<Word[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [currentRepeat, setCurrentRepeat] = useState(0);
  const [error, setError] = useState("");

  const [gradeResults, setGradeResults] = useState<GradeResult[]>([]);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [handwritingFile, setHandwritingFile] = useState<File | null>(null);

  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const wordsRef = useRef(words);
  const currentIdxRef = useRef(currentIdx);
  const currentRepeatRef = useRef(currentRepeat);
  const phaseRef = useRef(phase);

  useEffect(() => {
    wordsRef.current = words;
    currentIdxRef.current = currentIdx;
    currentRepeatRef.current = currentRepeat;
    phaseRef.current = phase;
  });

  // 加载单词
  useEffect(() => {
    async function load() {
      try {
        const p = new URLSearchParams({ count: String(count), order });
        const res = await fetch(`/api/dictation/words?${p}`);
        const data = await res.json();
        if (data.error) { setError(data.error); return; }
        setWords(data.words || []);
        setPhase("ready");
      } catch { setError("加载单词失败"); }
    }
    load();
  }, [count, order]);

  // 初始化 TTS 音色
  useEffect(() => {
    function setVoice() {
      const voices = speechSynthesis.getVoices();
      if (voices.length === 0) { setTimeout(setVoice, 200); return; }
      voiceRef.current = resolveVoice(voiceName, voices);
    }
    setVoice();
    speechSynthesis.onvoiceschanged = setVoice;
    return () => { speechSynthesis.onvoiceschanged = null; };
  }, [voiceName]);

  function speakWord(word: string) {
    const u = new SpeechSynthesisUtterance(word);
    u.rate = 0.85;
    if (voiceRef.current) u.voice = voiceRef.current;
    u.onend = () => {
      setTimeout(() => advanceToNext(), 0);
    };
    speechSynthesis.speak(u);
  }

  function advanceToNext() {
    if (phaseRef.current !== "playing") return;

    const ws = wordsRef.current;
    const idx = currentIdxRef.current;
    const rpt = currentRepeatRef.current;

    if (rpt < repeat - 1) {
      setCurrentRepeat(rpt + 1);
      speechSynthesis.cancel();
      setTimeout(() => speakWord(ws[idx].word), 50);
      return;
    }

    if (idx + 1 >= ws.length) {
      setPhase("finished");
      return;
    }

    const nextIdx = idx + 1;
    const wordText = ws[nextIdx].word;

    setCurrentIdx(nextIdx);
    setCurrentRepeat(0);

    if (interval > 0) {
      speechSynthesis.cancel();
      timerRef.current = setTimeout(() => speakWord(wordText), interval * 1000);
    }
  }

  const manualNext = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    speechSynthesis.cancel();

    const ws = wordsRef.current;
    const idx = currentIdxRef.current;

    if (idx + 1 >= ws.length) {
      setPhase("finished");
      return;
    }
    setCurrentIdx(idx + 1);
    setCurrentRepeat(0);
    setTimeout(() => speakWord(ws[idx + 1].word), 100);
  };

  const startPlaying = () => {
    setPhase("playing");
    setTimeout(() => {
      const ws = wordsRef.current;
      if (ws.length > 0) speakWord(ws[0].word);
    }, 800);
  };

  const togglePause = () => {
    if (phase === "playing") {
      speechSynthesis.cancel();
      if (timerRef.current) clearTimeout(timerRef.current);
      setPhase("paused");
    } else if (phase === "paused") {
      setPhase("playing");
      const ws = wordsRef.current;
      const idx = currentIdxRef.current;
      speakWord(ws[idx].word);
    }
  };

  useEffect(() => {
    return () => {
      speechSynthesis.cancel();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  async function handleFileDrop(file: File) {
    setHandwritingFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function gradeHandwriting() {
    if (!handwritingFile) return;
    setPhase("grading");

    const base64 = await compressAndToBase64(handwritingFile, 1600, 0.85);

    try {
      const res = await fetch("/api/grade-handwriting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: base64,
          expected_words: words.map((w) => ({ word_id: w.id, expected: w.word })),
        }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
        setPhase("finished");
        return;
      }
      setGradeResults(data.results);
      setScore(data.score);
      setCorrect(data.correct);
      setPhase("result");
    } catch {
      setError("批改失败，请重试");
      setPhase("finished");
    }
  }

  // ── 错误 ──
  if (error) {
    return (
      <div className="mx-auto max-w-lg px-5 py-20 text-center">
        <div className="mb-4 flex items-center justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50">
            <AlertTriangle className="h-7 w-7 text-amber-500" />
          </div>
        </div>
        <p className="mb-5 text-sm text-slate-600">{error}</p>
        <button onClick={() => router.back()} className="rounded-xl bg-indigo-500 px-6 py-2.5 text-sm font-medium text-white shadow-md transition-all hover:bg-indigo-600 active:scale-95">
          返回
        </button>
      </div>
    );
  }

  // ── 结果 ──
  if (phase === "result") {
    const wrongResults = gradeResults.filter((r) => !r.correct);
    const wrongWords = wrongResults
      .map((r) => words.find((w) => w.id === r.word_id))
      .filter((w): w is Word => w != null);
    const pct = Math.round(score * 100);

    return (
      <div className="mx-auto max-w-lg px-5 py-8 animate-fade-in">
        {/* 分数 */}
        <div className="glass-card mb-6 p-6 text-center">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">成绩</p>
          <p className={`mb-2 text-5xl font-extrabold tracking-tight ${
            pct >= 80 ? "text-emerald-500" : pct >= 60 ? "text-amber-500" : "text-red-400"
          }`}>{pct}</p>
          <p className="text-sm font-medium text-slate-500">
            {correct}/{words.length} 正确
          </p>
        </div>

        {imagePreview && (
          <img src={imagePreview} alt="手写" className="mb-4 max-h-40 w-full rounded-2xl border object-contain bg-white" />
        )}

        {/* 结果列表 */}
        <div className="mb-6 space-y-1.5">
          {gradeResults.map((r, i) => {
            const word = words.find((w) => w.id === r.word_id);
            return (
              <div key={i} className="glass-card flex items-start gap-3 p-3">
                {r.correct ? (
                  <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                ) : (
                  <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
                )}
                <div className="min-w-0 flex-1 text-sm">
                  <p className="font-semibold text-slate-800">{word?.word ?? r.word_id}</p>
                  {r.suggestion && <p className="mt-0.5 text-xs text-red-500">{r.suggestion}</p>}
                  {r.user_wrote && r.user_wrote !== "unreadable" && (
                    <p className="mt-0.5 text-xs text-slate-400">你写的是: {r.user_wrote}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* 操作按钮 */}
        <div className="space-y-2">
          {wrongWords.length > 0 && (
            <button
              onClick={() => {
                setWords(wrongWords);
                setCurrentIdx(0);
                setCurrentRepeat(0);
                setGradeResults([]);
                setScore(0);
                setCorrect(0);
                setImagePreview(null);
                setHandwritingFile(null);
                setPhase("ready");
              }}
              className="w-full rounded-2xl bg-amber-500 py-3.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-amber-600 hover:shadow-lg active:scale-95"
            >
              专练错词（{wrongWords.length} 个）
            </button>
          )}
          <button
            onClick={() => router.push("/dictation/setup?mode=handwrite")}
            className="w-full rounded-2xl border border-slate-200 py-3 text-sm font-medium text-slate-500 transition-all hover:bg-slate-50"
          >
            重新设置
          </button>
        </div>
      </div>
    );
  }

  // ── 批改中 ──
  if (phase === "grading") {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center px-5 py-20 animate-fade-in">
        <div className="glass-card p-8 text-center">
          <div className="mb-4 flex items-center justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            </div>
          </div>
          <p className="text-sm font-medium text-slate-700">AI 正在批改...</p>
          <p className="mt-1 text-xs text-slate-400">请稍候，正在识别你的手写内容</p>
        </div>
      </div>
    );
  }

  // ── 已完成播放 ──
  if (phase === "finished") {
    return (
      <div className="mx-auto max-w-lg px-5 py-8 animate-fade-in">
        <div className="glass-card mb-6 p-6 text-center">
          <div className="mb-3 flex items-center justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
              <CheckCircle className="h-7 w-7 text-emerald-500" />
            </div>
          </div>
          <h2 className="mb-1 text-lg font-bold text-slate-800">听写完成</h2>
          <p className="text-sm text-slate-400">共 {words.length} 个单词。拍下你的手写纸，上传批改。</p>
        </div>

        {imagePreview ? (
          <div className="mb-4">
            <img src={imagePreview} alt="手写预览" className="max-h-48 w-full rounded-2xl border bg-white object-contain" />
            <button
              onClick={() => { setImagePreview(null); setHandwritingFile(null); }}
              className="mt-2 text-xs font-medium text-indigo-500 hover:text-indigo-600"
            >
              重新选择
            </button>
          </div>
        ) : (
          <label className="mb-4 flex cursor-pointer flex-col items-center gap-4 rounded-3xl border-2 border-dashed border-slate-200 bg-white/50 py-12 text-center transition-all hover:border-indigo-300 hover:bg-white/80">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50">
              <Camera className="h-7 w-7 text-slate-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">点击拍照或选择图片</p>
              <p className="mt-0.5 text-xs text-slate-400">支持 JPG、PNG 格式</p>
            </div>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileDrop(f); }}
            />
          </label>
        )}

        <button
          onClick={gradeHandwriting}
          disabled={!handwritingFile}
          className="btn-gradient w-full rounded-2xl py-3.5 text-sm font-semibold disabled:opacity-50 disabled:shadow-none"
        >
          提交批改
        </button>
      </div>
    );
  }

  // ── 播放状态（ready / playing / paused） ──
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-5 py-12 animate-fade-in">
      {/* 进度 */}
      <p className="mb-1 text-sm font-medium text-slate-400">
        {currentIdx + 1} <span className="text-slate-300">/</span> {words.length}
      </p>

      {/* 进度条 */}
      <div className="mb-10 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-500"
          style={{ width: `${((currentIdx + currentRepeat / repeat) / words.length) * 100}%` }}
        />
      </div>

      {/* 倒计时提示 */}
      {interval > 0 && phase === "playing" && currentRepeat === 0 && currentIdx < words.length - 1 && (
        <p className="mb-4 rounded-full bg-slate-100 px-4 py-1.5 text-xs font-medium text-slate-500">
          下一词 {interval} 秒后
        </p>
      )}

      {/* 控制按钮 */}
      <div className="flex items-center gap-5">
        {phase === "ready" ? (
          <button
            onClick={startPlaying}
            className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-200 transition-all hover:shadow-xl hover:shadow-indigo-200 hover:scale-105 active:scale-95"
          >
            {/* 脉动光环 */}
            <div className="absolute inset-0 animate-pulseGlow rounded-full" />
            <Play className="relative z-10 ml-1 h-7 w-7" />
          </button>
        ) : phase === "paused" ? (
          <button
            onClick={togglePause}
            className="glass-card flex h-12 w-12 items-center justify-center rounded-full transition-all hover:shadow-lg active:scale-95"
          >
            <Play className="ml-0.5 h-5 w-5 text-slate-600" />
          </button>
        ) : (
          <>
            {interval === 0 && (
              <button
                onClick={manualNext}
                className="glass-card flex h-12 w-12 items-center justify-center rounded-full transition-all hover:shadow-lg active:scale-95"
              >
                <SkipForward className="h-5 w-5 text-slate-500" />
              </button>
            )}
            <button
              onClick={togglePause}
              className="glass-card flex h-12 w-12 items-center justify-center rounded-full transition-all hover:shadow-lg active:scale-95"
            >
              <Pause className="h-5 w-5 text-slate-600" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function HandwritePage() {
  return (
    <Suspense fallback={<div className="flex justify-center pt-20"><Loader2 className="h-6 w-6 animate-spin text-indigo-500" /></div>}>
      <HandwritePageInner />
    </Suspense>
  );
}
