"use client";

import { useEffect, useState, useRef, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, Play, Volume2, CheckCircle, XCircle, ArrowRight, RotateCcw } from "lucide-react";
import { resolveVoice } from "@/lib/tts";

interface Word {
  id: string;
  word: string;
  part_of_speech: string;
}

interface WordResult {
  word: Word;
  typed: string;
  correct: boolean;
}

function TypingPageInner() {
  const router = useRouter();
  const params = useSearchParams();

  const count = Number(params.get("count")) || 10;
  const repeat = Number(params.get("repeat")) || 2;
  const order = params.get("order") || "random";
  const voiceName = params.get("voice") || "Samantha";

  const [phase, setPhase] = useState<"loading" | "ready" | "playing" | "result">("loading");
  const [words, setWords] = useState<Word[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState<"idle" | "correct" | "wrong">("idle");
  const [showAnswer, setShowAnswer] = useState(false);
  const [results, setResults] = useState<WordResult[]>([]);
  const [shake, setShake] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const wordsRef = useRef(words);
  const currentIdxRef = useRef(currentIdx);
  wordsRef.current = words;
  currentIdxRef.current = currentIdx;

  // 加载单词
  useEffect(() => {
    async function load() {
      try {
        const q = new URLSearchParams({ count: String(count), order });
        const res = await fetch(`/api/dictation/words?${q}`);
        const data = await res.json();
        if (data.error) { setError(data.error); return; }
        setWords(data.words || []);
        setPhase("ready");
      } catch { setError("加载单词失败"); }
    }
    load();
  }, [count, order]);

  // 初始化 TTS
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

  const speakWord = useCallback((word: string) => {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(word);
    u.rate = 0.85;
    if (voiceRef.current) u.voice = voiceRef.current;
    speechSynthesis.speak(u);
  }, []);

  const playCurrentWord = useCallback(() => {
    const ws = wordsRef.current;
    const idx = currentIdxRef.current;
    if (ws.length === 0) return;
    speakWord(ws[idx].word);
  }, [speakWord]);

  const startPlaying = useCallback(() => {
    setPhase("playing");
    setTimeout(() => {
      const ws = wordsRef.current;
      if (ws.length > 0) speakWord(ws[0].word);
    }, 600);
  }, [speakWord]);

  const replayWord = () => {
    const ws = wordsRef.current;
    const idx = currentIdxRef.current;
    speakWord(ws[idx].word);
  };

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key !== "Enter" || !showAnswer) return;
      e.preventDefault();
      nextWord();
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [showAnswer, currentIdx, words.length]);

  function submitAnswer() {
    if (showAnswer || feedback !== "idle") return;
    const currentWord = words[currentIdx];
    const isCorrect = input.trim().toLowerCase() === currentWord.word.toLowerCase();

    setFeedback(isCorrect ? "correct" : "wrong");
    setShowAnswer(true);
    setResults((prev) => [...prev, { word: currentWord, typed: input.trim(), correct: isCorrect }]);

    if (!isCorrect) {
      setShake(true);
      setTimeout(() => setShake(false), 400);
    }
  }

  const autoAdvanceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (showAnswer && feedback === "correct") {
      autoAdvanceRef.current = setTimeout(() => nextWord(), 1300);
    }
    return () => { if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current); };
  }, [showAnswer, feedback]);

  function nextWord() {
    const ws = wordsRef.current;
    const newIdx = currentIdxRef.current + 1;
    if (newIdx >= ws.length) {
      setPhase("result");
      return;
    }

    const wordText = ws[newIdx].word;

    setCurrentIdx(newIdx);
    setInput("");
    setFeedback("idle");
    setShowAnswer(false);

    setTimeout(() => {
      inputRef.current?.focus();
      speakWord(wordText);
    }, 200);
  }

  useEffect(() => {
    if (phase === "playing" && !showAnswer) {
      inputRef.current?.focus();
    }
  }, [phase, showAnswer, currentIdx]);

  useEffect(() => {
    return () => { speechSynthesis.cancel(); };
  }, []);

  const correctCount = results.filter((r) => r.correct).length;
  const score = results.length > 0 ? Math.round((correctCount / results.length) * 100) : 0;

  if (error || words.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-5 py-20 text-center">
        <p className="text-sm text-slate-600">{error || "词库为空，请先上传单词"}</p>
        <button onClick={() => router.back()} className="mt-4 text-sm font-medium text-indigo-500">返回</button>
      </div>
    );
  }

  // ── 结果 ──
  if (phase === "result") {
    const wrongResults = results.filter((r) => !r.correct);

    return (
      <div className="mx-auto max-w-lg px-5 py-8 animate-fade-in">
        <div className="glass-card mb-6 p-6 text-center">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">成绩</p>
          <p className={`mb-2 text-5xl font-extrabold tracking-tight ${
            score >= 80 ? "text-emerald-500" : score >= 60 ? "text-amber-500" : "text-red-400"
          }`}>{score}</p>
          <p className="text-sm font-medium text-slate-500">
            {correctCount}/{results.length} 正确
          </p>
        </div>

        <div className="mb-6 space-y-1.5">
          {results.map((r, i) => (
            <div key={i} className="glass-card flex items-center gap-3 p-3">
              {r.correct ? (
                <CheckCircle className="h-5 w-5 shrink-0 text-emerald-500" />
              ) : (
                <XCircle className="h-5 w-5 shrink-0 text-red-400" />
              )}
              <div className="min-w-0 flex-1 text-sm">
                <p className="font-semibold text-slate-800">{r.word.word}</p>
                {!r.correct && (
                  <p className="mt-0.5 text-xs text-red-500">
                    你输入了: <span className="font-mono font-medium">{r.typed}</span>
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          {wrongResults.length > 0 && (
            <button
              onClick={() => {
                setWords(wrongResults.map((r) => r.word));
                setCurrentIdx(0);
                setInput("");
                setFeedback("idle");
                setShowAnswer(false);
                setResults([]);
                setPhase("ready");
              }}
              className="w-full rounded-2xl bg-amber-500 py-3.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-amber-600 hover:shadow-lg active:scale-95"
            >
              专练错词（{wrongResults.length} 个）
            </button>
          )}
          <button
            onClick={() => router.push("/dictation/setup?mode=typing")}
            className="w-full rounded-2xl border border-slate-200 py-3 text-sm font-medium text-slate-500 transition-all hover:bg-slate-50"
          >
            重新设置
          </button>
        </div>
      </div>
    );
  }

  // ── 播放 ──
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-5 py-10 animate-fade-in">
      {/* 进度 */}
      <p className="mb-1 text-sm font-medium text-slate-400">
        {currentIdx + 1} <span className="text-slate-300">/</span> {words.length}
      </p>
      <div className="mb-10 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-300"
          style={{ width: `${(currentIdx / words.length) * 100}%` }}
        />
      </div>

      {phase === "ready" ? (
        <button
          onClick={startPlaying}
          className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-200 transition-all hover:shadow-xl hover:shadow-indigo-200 hover:scale-105 active:scale-95"
        >
          <div className="absolute inset-0 animate-pulseGlow rounded-full" />
          <Play className="relative z-10 ml-1 h-7 w-7" />
        </button>
      ) : (
        <>
          {/* 播放控制 */}
          <div className="mb-8 flex gap-3">
            <button
              onClick={playCurrentWord}
              className="glass-card flex h-11 w-11 items-center justify-center rounded-full transition-all hover:shadow-lg active:scale-95"
            >
              <Volume2 className="h-5 w-5 text-slate-500" />
            </button>
            <button
              onClick={replayWord}
              className="glass-card flex items-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-medium text-slate-500 transition-all hover:shadow-lg active:scale-95"
            >
              <RotateCcw className="h-4 w-4" /> 再听一遍
            </button>
          </div>

          {/* 输入区 */}
          <div className="w-full">
            <div className={shake ? "animate-shake" : ""}>
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => { if (!showAnswer) setInput(e.target.value); }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.stopPropagation();
                    if (!showAnswer) { e.preventDefault(); submitAnswer(); }
                    else { e.preventDefault(); nextWord(); }
                  }
                }}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                placeholder="输入你听到的单词..."
                className={`w-full rounded-2xl border-2 px-5 py-4 text-center text-lg font-mono outline-none transition-all duration-300 ${
                  feedback === "correct"
                    ? "border-emerald-400 bg-emerald-50/50"
                    : feedback === "wrong"
                    ? "border-red-300 bg-red-50/50"
                    : "border-slate-200 bg-white/70 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                }`}
                disabled={showAnswer}
              />
            </div>

            {/* 反馈 */}
            {showAnswer && (
              <div className="mt-5 text-center animate-fade-in">
                {feedback === "correct" ? (
                  <span className="inline-flex items-center gap-1.5 text-emerald-600 animate-bounce-in">
                    <CheckCircle className="h-5 w-5" /> 正确!
                  </span>
                ) : (
                  <div className="space-y-1.5">
                    <span className="inline-flex items-center gap-1.5 text-red-400">
                      <XCircle className="h-5 w-5" /> 正确答案
                    </span>
                    <p className="text-2xl font-extrabold tracking-tight text-slate-800">
                      {words[currentIdx].word}
                    </p>
                  </div>
                )}

                {currentIdx + 1 >= words.length ? (
                  <button
                    onClick={() => setPhase("result")}
                    className="mt-5 inline-flex items-center gap-1.5 rounded-2xl bg-indigo-500 px-6 py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-indigo-600 active:scale-95"
                  >
                    查看结果
                    <ArrowRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    onClick={nextWord}
                    className="mt-5 inline-flex items-center gap-1.5 rounded-2xl bg-indigo-500 px-6 py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-indigo-600 active:scale-95"
                  >
                    下一词
                    <ArrowRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default function TypingPage() {
  return (
    <Suspense fallback={<div className="flex justify-center pt-20"><Loader2 className="h-6 w-6 animate-spin text-indigo-500" /></div>}>
      <TypingPageInner />
    </Suspense>
  );
}
