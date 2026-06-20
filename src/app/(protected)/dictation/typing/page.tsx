"use client";

import { useEffect, useState, useRef, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, Play, Volume2, CheckCircle, XCircle, ArrowRight, RotateCcw } from "lucide-react";

const VOICE_MAP: Record<string, string> = {
  Samantha: "en-US", Karen: "en-US", Daniel: "en-GB",
  Alex: "en-US", Tom: "en-US", Oliver: "en-GB",
};

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
  const voiceName = params.get("voice") || "Samantha";

  const [phase, setPhase] = useState<"loading" | "ready" | "playing" | "result">("loading");
  const [words, setWords] = useState<Word[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [currentRepeat, setCurrentRepeat] = useState(0);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState<"idle" | "correct" | "wrong">("idle");
  const [showAnswer, setShowAnswer] = useState(false);
  const [results, setResults] = useState<WordResult[]>([]);
  const [repeatListening, setRepeatListening] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);

  // 加载单词
  useEffect(() => {
    async function load() {
      try {
        const q = new URLSearchParams({ count: String(count), order: "random" });
        const res = await fetch(`/api/dictation/words?${q}`);
        const data = await res.json();
        if (data.error) { setError(data.error); return; }
        setWords(data.words || []);
        setPhase("ready");
      } catch { setError("加载单词失败"); }
    }
    load();
  }, [count]);

  // 初始化 TTS
  useEffect(() => {
    function setVoice() {
      const voices = speechSynthesis.getVoices();
      if (voices.length === 0) { setTimeout(setVoice, 200); return; }
      const lang = VOICE_MAP[voiceName] || "en-US";
      voiceRef.current = voices.find((v) => v.name.includes(voiceName) && v.lang.startsWith(lang))
        || voices.find((v) => v.lang.startsWith(lang))
        || voices[0];
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

  // 读当前词
  const playCurrentWord = useCallback(() => {
    if (words.length === 0) return;
    speakWord(words[currentIdx].word);
  }, [words, currentIdx, speakWord]);

  // 开始
  const startPlaying = useCallback(() => {
    setPhase("playing");
    setTimeout(() => playCurrentWord(), 600);
  }, [playCurrentWord]);

  // 重复朗读当前词
  const replayWord = () => {
    setRepeatListening(true);
    speakWord(words[currentIdx].word);
  };

  // 键盘事件：Enter 提交
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key !== "Enter" || phase !== "playing") return;
      e.preventDefault();
      submitAnswer();
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [phase, currentIdx, input, showAnswer, feedback]);

  // 实际是在 showAnswer 后的回车 → 下一词
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key !== "Enter" || !showAnswer) return;
      e.preventDefault();
      nextWord();
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [showAnswer, currentIdx, words]);

  // 提交拼写
  function submitAnswer() {
    if (showAnswer || feedback !== "idle") return;
    const currentWord = words[currentIdx];
    const isCorrect = input.trim().toLowerCase() === currentWord.word.toLowerCase();

    setFeedback(isCorrect ? "correct" : "wrong");
    setShowAnswer(true);

    setResults((prev) => [...prev, { word: currentWord, typed: input.trim(), correct: isCorrect }]);
  }

  // 下一个词
  function nextWord() {
    if (currentIdx + 1 >= words.length) {
      setPhase("result");
      return;
    }

    setCurrentIdx((i) => i + 1);
    setCurrentRepeat(0);
    setInput("");
    setFeedback("idle");
    setShowAnswer(false);
    setRepeatListening(false);

    setTimeout(() => {
      inputRef.current?.focus();
      playCurrentWord();
    }, 200);
  }

  // 自动聚焦
  useEffect(() => {
    if (phase === "playing" && !showAnswer) {
      inputRef.current?.focus();
    }
  }, [phase, showAnswer, currentIdx]);

  // 清理
  useEffect(() => {
    return () => { speechSynthesis.cancel(); };
  }, []);

  // 计算成绩
  const correctCount = results.filter((r) => r.correct).length;
  const score = results.length > 0 ? Math.round((correctCount / results.length) * 100) : 0;

  if (error || words.length === 0) {
    return (
      <div className="mx-auto max-w-lg p-6 pt-20 text-center">
        <p className="text-gray-700">{error || "词库为空，请先上传单词"}</p>
        <button onClick={() => router.back()} className="mt-4 text-sm text-blue-600 underline">返回</button>
      </div>
    );
  }

  if (phase === "result") {
    return (
      <div className="mx-auto max-w-lg p-6">
        <h2 className="mb-2 text-xl font-bold text-gray-900">拼写结果</h2>
        <div className="mb-6 flex items-center gap-4">
          <span className={`rounded-full px-3 py-1 text-sm font-medium ${
            score >= 80 ? "bg-green-100 text-green-700" : score >= 60 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
          }`}>
            {score} 分
          </span>
          <span className="text-sm text-gray-500">
            {correctCount}/{results.length} 正确
          </span>
        </div>

        <div className="space-y-2">
          {results.map((r, i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg border p-3">
              {r.correct ? (
                <CheckCircle className="h-5 w-5 shrink-0 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 shrink-0 text-red-400" />
              )}
              <div className="min-w-0 flex-1 text-sm">
                <p className="font-medium">{r.word.word}</p>
                {!r.correct && (
                  <p className="text-xs text-red-500">
                    你输入了: <span className="font-mono">{r.typed}</span>
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={() => router.push("/dictation/setup")}
          className="mt-6 w-full rounded-xl border py-2.5 text-sm text-gray-600 hover:bg-gray-50"
        >
          再来一次
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center p-6 pt-12">
      {/* 进度 */}
      <p className="mb-1 text-sm text-gray-400">
        {currentIdx + 1} / {words.length}
      </p>
      <div className="mb-8 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-gray-200">
        <div
          className="h-full rounded-full bg-blue-500 transition-all"
          style={{ width: `${((currentIdx) / words.length) * 100}%` }}
        />
      </div>

      {phase === "ready" ? (
        <button
          onClick={startPlaying}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700"
        >
          <Play className="ml-1 h-6 w-6" />
        </button>
      ) : (
        <>
          {/* 播放按钮 */}
          <div className="mb-8 flex gap-3">
            <button
              onClick={playCurrentWord}
              className="flex h-12 w-12 items-center justify-center rounded-full border text-gray-600 hover:bg-gray-100"
            >
              <Volume2 className="h-5 w-5" />
            </button>
            <button
              onClick={replayWord}
              className="flex items-center gap-1 rounded-full border px-4 text-sm text-gray-500 hover:bg-gray-100"
            >
              <RotateCcw className="h-4 w-4" /> 再听一遍
            </button>
          </div>

          {/* 输入区 */}
          <div className="w-full">
            <div className="relative">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => { if (!showAnswer) setInput(e.target.value); }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    if (!showAnswer) { e.preventDefault(); submitAnswer(); }
                    else { e.preventDefault(); nextWord(); }
                  }
                }}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                placeholder="输入你听到的单词..."
                className={`w-full rounded-xl border-2 px-5 py-4 text-center text-lg font-mono outline-none transition ${
                  feedback === "correct"
                    ? "border-green-400 bg-green-50"
                    : feedback === "wrong"
                    ? "border-red-400 bg-red-50"
                    : "border-gray-300 focus:border-blue-400"
                }`}
                disabled={showAnswer}
              />
            </div>

            {/* 反馈 */}
            {showAnswer && (
              <div className="mt-4 text-center">
                {feedback === "correct" ? (
                  <span className="inline-flex items-center gap-1 text-green-600">
                    <CheckCircle className="h-4 w-4" /> 正确
                  </span>
                ) : (
                  <div className="space-y-1">
                    <span className="inline-flex items-center gap-1 text-red-500">
                      <XCircle className="h-4 w-4" /> 正确答案
                    </span>
                    <p className="text-xl font-bold text-gray-900">{words[currentIdx].word}</p>
                  </div>
                )}

                <button
                  onClick={nextWord}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-5 py-2 text-sm text-white hover:bg-blue-700"
                >
                  {currentIdx + 1 >= words.length ? "查看结果" : "下一词"}
                  <ArrowRight className="h-4 w-4" />
                </button>
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
    <Suspense fallback={<div className="flex justify-center pt-20"><Loader2 className="h-6 w-6 animate-spin text-blue-500" /></div>}>
      <TypingPageInner />
    </Suspense>
  );
}
