"use client";

import { useState } from "react";
import { Search, Loader2, AlertCircle, BookOpen, Volume2 } from "lucide-react";

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
    <div className="mx-auto max-w-2xl p-4 md:p-6">
      <div className="mb-6 text-center">
        <h2 className="text-xl font-bold text-gray-900">查词典</h2>
        <p className="mt-1 text-xs text-gray-400">输入英文单词，查看中文释义与例句</p>
      </div>

      <form onSubmit={handleSubmit} className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="输入单词，回车查询"
            className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </form>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
          <span className="ml-2 text-sm text-gray-400">查询中...</span>
        </div>
      )}

      {error && !loading && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
          <div>
            <p className="text-sm font-medium text-amber-800">{error}</p>
            <p className="mt-1 text-xs text-amber-600">请检查拼写或换个单词试试</p>
          </div>
        </div>
      )}

      {result && !loading && (
        <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
          {/* 词头 */}
          <div className="border-b bg-gradient-to-r from-blue-50 to-white px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex items-baseline gap-3">
                <h3 className="text-3xl font-bold text-gray-900">{result.word}</h3>
                {result.phonetic && (
                  <span className="text-lg text-gray-400 font-mono">{result.phonetic}</span>
                )}
                {result.part_of_speech && (
                  <span className="rounded bg-blue-100 px-1.5 py-0.5 text-xs font-medium text-blue-700">
                    {result.part_of_speech}
                  </span>
                )}
              </div>
              <button
                onClick={() => speak(result.word)}
                className="ml-auto flex h-9 w-9 items-center justify-center rounded-full bg-blue-500 text-white shadow transition hover:bg-blue-600 active:scale-95"
                title="播放读音"
              >
                <Volume2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* 中文释义 */}
          <div className="border-b border-gray-100 px-5 py-4">
            <div className="mb-1 text-xs text-gray-400">释义</div>
            <p className="text-lg font-medium leading-relaxed text-gray-800">
              {result.chinese_meaning || "暂无"}
            </p>
          </div>

          {/* 词形变化 */}
          {result.word_forms && (
            <div className="border-b border-gray-100 px-5 py-3">
              <div className="mb-1 text-xs text-gray-400">词形变化</div>
              <p className="text-sm text-gray-600">{result.word_forms}</p>
            </div>
          )}

          {/* 近义词 */}
          {result.synonyms && (
            <div className="border-b border-gray-100 px-5 py-3">
              <div className="mb-1 text-xs text-gray-400">近义词</div>
              <div className="flex flex-wrap gap-1.5">
                {result.synonyms.split(/[,，]/).filter(Boolean).map((s, i) => (
                  <button
                    key={i}
                    onClick={() => { setQuery(s.trim()); search(s.trim()); }}
                    className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 transition hover:bg-blue-50 hover:text-blue-600"
                  >
                    {s.trim()}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 例句 */}
          {result.example_en && (
            <div className="px-5 py-4">
              <div className="mb-2 text-xs text-gray-400">例句</div>
              <p className="mb-1 text-sm italic text-gray-700">&ldquo;{result.example_en}&rdquo;</p>
              {result.example_cn && (
                <p className="text-xs text-gray-400">{result.example_cn}</p>
              )}
            </div>
          )}
        </div>
      )}

      {!result && !loading && !error && (
        <div className="rounded-xl border-2 border-dashed border-gray-200 py-16 text-center">
          <BookOpen className="mx-auto mb-2 h-10 w-10 text-gray-200" />
          <p className="text-sm text-gray-400">输入单词，开始查词</p>
        </div>
      )}
    </div>
  );
}
