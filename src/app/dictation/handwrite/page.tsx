"use client";

import { useEffect, useState, useRef, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Loader2, Play, Pause, SkipForward, Camera,
  CheckCircle, XCircle, AlertTriangle,
} from "lucide-react";

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

const VOICE_MAP: Record<string, string> = {
  Samantha: "en-US", Karen: "en-US", Daniel: "en-GB",
  Alex: "en-US", Tom: "en-US", Oliver: "en-GB",
};

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

  // 用 refs 保持最新值，根治闭包过期
  const wordsRef = useRef(words);
  const currentIdxRef = useRef(currentIdx);
  const currentRepeatRef = useRef(currentRepeat);
  const phaseRef = useRef(phase);
  wordsRef.current = words;
  currentIdxRef.current = currentIdx;
  currentRepeatRef.current = currentRepeat;
  phaseRef.current = phase;

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
      const lang = VOICE_MAP[voiceName] || "en-US";
      voiceRef.current = voices.find((v) => v.name.includes(voiceName) && v.lang.startsWith(lang))
        || voices.find((v) => v.lang.startsWith(lang))
        || voices[0];
    }
    setVoice();
    speechSynthesis.onvoiceschanged = setVoice;
    return () => { speechSynthesis.onvoiceschanged = null; };
  }, [voiceName]);

  // 朗读单词（onend 回调通过 ref 读取最新状态，永不闭包过期）
  const speak = useCallback((word: string) => {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(word);
    u.rate = 0.85;
    if (voiceRef.current) u.voice = voiceRef.current;
    u.onend = () => {
      // 朗读结束 → 自动推进
      advanceToNext();
    };
    speechSynthesis.speak(u);
  }, []);

  // 推进到下一个朗读单元（普通函数，通过 ref 读最新状态）
  function advanceToNext() {
    if (phaseRef.current !== "playing") return;

    const ws = wordsRef.current;
    const idx = currentIdxRef.current;
    const rpt = currentRepeatRef.current;

    if (rpt < repeat - 1) {
      // 重复当前词
      setCurrentRepeat(rpt + 1);
      speak(ws[idx].word);
      return;
    }

    // 下一个词
    if (idx + 1 >= ws.length) {
      setPhase("finished");
      return;
    }

    const nextIdx = idx + 1;
    const wordText = ws[nextIdx].word;

    setCurrentIdx(nextIdx);
    setCurrentRepeat(0);

    if (interval > 0) {
      timerRef.current = setTimeout(() => speak(wordText), interval * 1000);
    }
    // interval === 0 时不自动播放，等用户点"下一词"
  }

  // 手动跳到下一词（interval=0 时使用）
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
    // 立即朗读
    setTimeout(() => speak(ws[idx + 1].word), 100);
  };

  // 开始听写
  const startPlaying = () => {
    setPhase("playing");
    // 用 ref 读最新 words
    setTimeout(() => {
      const ws = wordsRef.current;
      if (ws.length > 0) speak(ws[0].word);
    }, 800);
  };

  // 暂停 / 继续
  const togglePause = () => {
    if (phase === "playing") {
      speechSynthesis.cancel();
      if (timerRef.current) clearTimeout(timerRef.current);
      setPhase("paused");
    } else if (phase === "paused") {
      setPhase("playing");
      // 继续：重读当前词
      const ws = wordsRef.current;
      const idx = currentIdxRef.current;
      speak(ws[idx].word);
    }
  };

  // 清理
  useEffect(() => {
    return () => {
      speechSynthesis.cancel();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // 手写拍照上传
  async function handleFileDrop(file: File) {
    setHandwritingFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function gradeHandwriting() {
    if (!handwritingFile) return;
    setPhase("grading");

    const base64 = await new Promise<string>((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX = 1600;
        let w = img.width, h = img.height;
        if (w > MAX) { h = (h * MAX) / w; w = MAX; }
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.85).split(",")[1]);
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(handwritingFile);
    });

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

  if (error) {
    return (
      <div className="mx-auto max-w-lg p-6 pt-20 text-center">
        <AlertTriangle className="mx-auto mb-3 h-10 w-10 text-amber-500" />
        <p className="text-gray-700">{error}</p>
        <button onClick={() => router.back()} className="mt-4 text-sm text-blue-600 underline">
          返回
        </button>
      </div>
    );
  }

  // 结果阶段
  if (phase === "result") {
    return (
      <div className="mx-auto max-w-lg p-6">
        <h2 className="mb-2 text-xl font-bold text-gray-900">听写结果</h2>
        <div className="mb-4 flex items-center gap-2">
          <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
            {Math.round(score * 100)} 分
          </span>
          <span className="text-sm text-gray-500">
            {correct}/{words.length} 正确
          </span>
        </div>

        {imagePreview && (
          <img src={imagePreview} alt="手写" className="mb-4 max-h-48 w-full rounded-lg border object-contain" />
        )}

        <div className="space-y-2">
          {gradeResults.map((r, i) => {
            const word = words.find((w) => w.id === r.word_id);
            return (
              <div key={i} className="flex items-start gap-3 rounded-lg border p-3">
                {r.correct ? (
                  <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-green-500" />
                ) : (
                  <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
                )}
                <div className="min-w-0 flex-1 text-sm">
                  <p className="font-medium text-gray-900">{word?.word ?? r.word_id}</p>
                  {r.suggestion && <p className="mt-0.5 text-xs text-red-500">{r.suggestion}</p>}
                  {r.user_wrote && r.user_wrote !== "unreadable" && (
                    <p className="mt-0.5 text-xs text-gray-400">你写的是: {r.user_wrote}</p>
                  )}
                </div>
              </div>
            );
          })}
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

  // 已完成播放 → 等待拍照上传
  if (phase === "finished") {
    return (
      <div className="mx-auto max-w-lg p-6">
        <h2 className="mb-2 text-xl font-bold text-gray-900">听写完成</h2>
        <p className="mb-6 text-sm text-gray-500">
          共 {words.length} 个单词。请用手机拍下你的手写纸，上传批改。
        </p>

        {imagePreview ? (
          <div className="mb-4">
            <img src={imagePreview} alt="手写预览" className="max-h-48 w-full rounded-lg border object-contain" />
            <button
              onClick={() => { setImagePreview(null); setHandwritingFile(null); }}
              className="mt-2 text-xs text-blue-500 underline"
            >
              重新选择
            </button>
          </div>
        ) : (
          <label className="mb-4 flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed border-gray-300 p-12 hover:border-gray-400">
            <Camera className="h-8 w-8 text-gray-400" />
            <span className="text-sm text-gray-500">点击拍照或选择图片</span>
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
          className="w-full rounded-xl bg-blue-600 py-3 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
        >
          提交批改
        </button>
      </div>
    );
  }

  // 播放阶段
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center p-6 pt-16">
      <p className="mb-2 text-sm text-gray-400">
        {currentIdx + 1} / {words.length}
      </p>

      {/* 进度条 */}
      <div className="mb-8 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-gray-200">
        <div
          className="h-full rounded-full bg-blue-500 transition-all duration-300"
          style={{ width: `${((currentIdx + currentRepeat / repeat) / words.length) * 100}%` }}
        />
      </div>

      {/* 倒计时提示 */}
      {interval > 0 && phase === "playing" && currentRepeat === 0 && currentIdx < words.length - 1 && (
        <p className="mb-2 text-xs text-gray-400">下一词 {interval} 秒后</p>
      )}

      {/* 控制按钮 */}
      <div className="flex items-center gap-4">
        {phase === "ready" ? (
          <button
            onClick={startPlaying}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700"
          >
            <Play className="ml-1 h-6 w-6" />
          </button>
        ) : phase === "paused" ? (
          <button
            onClick={togglePause}
            className="flex h-12 w-12 items-center justify-center rounded-full border text-gray-600 hover:bg-gray-100"
          >
            <Play className="ml-0.5 h-5 w-5" />
          </button>
        ) : (
          <>
            {/* interval=0 时显示手动跳词按钮 */}
            {interval === 0 && (
              <button
                onClick={manualNext}
                className="flex h-12 w-12 items-center justify-center rounded-full border text-gray-600 hover:bg-gray-100"
              >
                <SkipForward className="h-5 w-5" />
              </button>
            )}
            <button
              onClick={togglePause}
              className="flex h-12 w-12 items-center justify-center rounded-full border text-gray-600 hover:bg-gray-100"
            >
              <Pause className="h-5 w-5" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function HandwritePage() {
  return (
    <Suspense fallback={<div className="flex justify-center pt-20"><Loader2 className="h-6 w-6 animate-spin text-blue-500" /></div>}>
      <HandwritePageInner />
    </Suspense>
  );
}
