"use client";

import { useState } from "react";
import { Search, Loader2, AlertCircle, BookOpen, Volume2, Sparkles } from "lucide-react";

interface WordInfo {
  word: string;
  phonetic: string;
  part_of_speech: string;
  chinese_meaning: string;
  example_en: string;
  example_cn: string;
  synonyms: string;
  word_forms: string;
}

export default function DictionaryPage() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<WordInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function search(word: string) {
    if (!word.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/dictionary/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word: word.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "查询失败，请稍后重试");
        return;
      }

      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setResult(data);
      }
    } catch {
      setError("网络请求失败，请检查网络连接");
    } finally {
      setLoading(false);
    }
  }

  function speak(word: string) {
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = "en-US";
    utterance.rate = 0.85;
    speechSynthesis.speak(utterance);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    search(query);
  }

  return (
    <div className="mx-auto max-w-xl px-5 py-8 animate-fade-in">
      {/* ── 标题 ── */}
      <div className="mb-6 text-center">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-sky-50 px-4 py-1.5 text-xs font-medium text-sky-600">
          <Sparkles className="h-3.5 w-3.5" />
          AI 翻译
        </div>
        <h2 className="text-xl font-extrabold text-slate-900">查词典</h2>
        <p className="mt-1 text-xs text-slate-400">输入英文单词，查看中文释义与例句</p>
      </div>

      {/* ── 搜索框 ── */}
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="输入单词，回车查询"
            className="input-glow glass-card w-full py-3.5 pl-11 pr-4 text-sm font-medium text-slate-700 placeholder:text-slate-300"
          />
        </div>
      </form>

      {/* ── 加载 ── */}
      {loading && (
        <div className="glass-card flex items-center justify-center gap-3 px-6 py-12">
          <Loader2 className="h-5 w-5 animate-spin text-indigo-500" />
          <span className="text-sm text-slate-400">查询中...</span>
        </div>
      )}

      {/* ── 错误 ── */}
      {error && !loading && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/80 p-4 animate-fade-in">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
          <div>
            <p className="text-sm font-medium text-amber-800">{error}</p>
            <p className="mt-0.5 text-xs text-amber-600">请检查拼写或换个单词试试</p>
          </div>
        </div>
      )}

      {/* ── 结果卡片 ── */}
      {result && !loading && (
        <div className="glass-card overflow-hidden animate-slide-up">
          {/* 词头 — 渐变背景 */}
          <div className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-5 py-5">
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <h3 className="text-3xl font-extrabold tracking-tight text-slate-900">
                    {result.word}
                  </h3>
                  {result.phonetic && (
                    <span className="font-mono text-base text-slate-400">{result.phonetic}</span>
                  )}
                  {result.part_of_speech && (
                    <span className="rounded-lg bg-indigo-100/80 px-2 py-0.5 text-xs font-semibold text-indigo-600">
                      {result.part_of_speech}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => speak(result.word)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500 text-white shadow-md transition-all hover:bg-indigo-600 hover:shadow-lg active:scale-95"
              >
                <Volume2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* 中文释义 */}
          <div className="border-t border-slate-100 px-5 py-4">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">释义</p>
            <p className="text-lg font-semibold leading-relaxed text-slate-700">
              {result.chinese_meaning || "暂无"}
            </p>
          </div>

          {/* 词形变化 */}
          {result.word_forms && (
            <div className="border-t border-slate-100 px-5 py-3">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">词形变化</p>
              <p className="text-sm text-slate-600">{result.word_forms}</p>
            </div>
          )}

          {/* 近义词 */}
          {result.synonyms && (
            <div className="border-t border-slate-100 px-5 py-3">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">近义词</p>
              <div className="flex flex-wrap gap-2">
                {result.synonyms.split(/[,，]/).filter(Boolean).map((s, i) => (
                  <button
                    key={i}
                    onClick={() => { setQuery(s.trim()); search(s.trim()); }}
                    className="rounded-xl bg-sky-50 px-3 py-1.5 text-xs font-medium text-sky-600 transition-all hover:bg-sky-100 hover:text-sky-700 active:scale-95"
                  >
                    {s.trim()}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 例句 */}
          {result.example_en && (
            <div className="border-t border-slate-100 px-5 py-4">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">例句</p>
              <p className="mb-1.5 text-sm italic leading-relaxed text-slate-700">
                &ldquo;{result.example_en}&rdquo;
              </p>
              {result.example_cn && (
                <p className="text-xs text-slate-400">{result.example_cn}</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── 空态 ── */}
      {!result && !loading && !error && (
        <div className="glass-card flex flex-col items-center px-6 py-16 text-center animate-slide-up">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50">
            <BookOpen className="h-8 w-8 text-slate-300" />
          </div>
          <p className="mb-1 text-sm font-medium text-slate-500">输入单词，开始查词</p>
          <p className="text-xs text-slate-400">支持 CET-4 词汇及常见英语单词</p>
        </div>
      )}
    </div>
  );
}
