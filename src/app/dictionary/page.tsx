"use client";

import { useState } from "react";
import { Search, Volume2, Loader2, AlertCircle, ExternalLink } from "lucide-react";

interface Phonetic {
  text?: string;
  audio?: string;
}

interface Definition {
  definition: string;
  example?: string;
  synonyms?: string[];
  antonyms?: string[];
}

interface Meaning {
  partOfSpeech: string;
  definitions: Definition[];
}

interface DictionaryEntry {
  word: string;
  phonetic?: string;
  phonetics: Phonetic[];
  origin?: string;
  meanings: Meaning[];
}

interface ChineseTranslation {
  word: string;
  part_of_speech: string;
  chinese_meaning: string;
}

export default function DictionaryPage() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<DictionaryEntry[] | null>(null);
  const [chinese, setChinese] = useState<ChineseTranslation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function search(word: string) {
    if (!word.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setChinese(null);

    try {
      const [dictRes] = await Promise.all([
        fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word.trim())}`),
        fetchChinese(word.trim()),
      ]);

      if (!dictRes.ok) {
        if (dictRes.status === 404) {
          setError(`未找到单词 "${word.trim()}"`);
        } else {
          setError("词典服务暂时不可用，请稍后重试");
        }
        return;
      }

      setResult(await dictRes.json());
    } catch {
      setError("网络请求失败，请检查网络连接");
    } finally {
      setLoading(false);
    }
  }

  async function fetchChinese(word: string) {
    try {
      const res = await fetch("/api/dictionary/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data && !data.error) setChinese(data);
      }
    } catch {
      // non-critical, suppress
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    search(query);
  }

  function playAudio(url: string) {
    const audio = new Audio(url);
    audio.play().catch(() => {});
  }

  return (
    <div className="mx-auto max-w-2xl p-4 md:p-6">
      <h2 className="mb-1 text-xl font-bold text-gray-900">词典</h2>
      <p className="mb-6 text-sm text-gray-500">在线查询英文单词释义与例句</p>

      {/* 搜索框 */}
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="输入英文单词，按回车查询..."
            className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </form>

      {/* 加载 */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
          <span className="ml-2 text-sm text-gray-400">查询中...</span>
        </div>
      )}

      {/* 错误 */}
      {error && !loading && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
          <div>
            <p className="text-sm font-medium text-amber-800">{error}</p>
            <p className="mt-1 text-xs text-amber-600">
              请检查拼写或尝试其他单词
            </p>
          </div>
        </div>
      )}

      {/* 搜索结果 */}
      {result && !loading && (
        <div className="space-y-4">
          {result.map((entry, idx) => (
            <div key={idx} className="rounded-xl border bg-white">
              {/* 单词头部 */}
              <div className="border-b px-5 py-4">
                <div className="flex items-center gap-3">
                  <h3 className="text-2xl font-bold text-gray-900">
                    {entry.word}
                  </h3>
                  {entry.phonetic && (
                    <span className="text-sm text-gray-400">
                      {entry.phonetic}
                    </span>
                  )}
                  {entry.phonetics?.find((p) => p.audio)?.audio && (
                    <button
                      onClick={() =>
                        playAudio(entry.phonetics.find((p) => p.audio)!.audio!)
                      }
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition hover:bg-blue-50 hover:text-blue-500"
                      title="播放发音"
                    >
                      <Volume2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* 中文释义 */}
                {chinese && (
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="rounded bg-blue-50 px-1.5 py-0.5 text-xs font-medium text-blue-600">
                      {chinese.part_of_speech}
                    </span>
                    <span className="text-sm text-gray-700">
                      {chinese.chinese_meaning}
                    </span>
                  </div>
                )}
              </div>

              {/* 释义列表 */}
              <div className="p-5">
                {entry.meanings.map((meaning, mi) => (
                  <div key={mi} className="mb-4 last:mb-0">
                    <span className="mb-2 inline-block rounded bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">
                      {meaning.partOfSpeech}
                    </span>
                    <ol className="mt-2 list-inside list-decimal space-y-2">
                      {meaning.definitions.map((def, di) => (
                        <li key={di} className="text-sm text-gray-700">
                          <span>{def.definition}</span>
                          {def.example && (
                            <span className="ml-1 text-xs text-gray-400">
                              e.g. &ldquo;{def.example}&rdquo;
                            </span>
                          )}
                        </li>
                      ))}
                    </ol>
                  </div>
                ))}
              </div>

              {/* 词源（如果有） */}
              {entry.origin && (
                <div className="border-t px-5 py-3">
                  <p className="text-xs text-gray-400">
                    <span className="font-medium text-gray-500">词源：</span>
                    {entry.origin}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 空状态 */}
      {!result && !loading && !error && (
        <div className="rounded-xl border-2 border-dashed border-gray-200 py-12 text-center">
          <Search className="mx-auto mb-2 h-8 w-8 text-gray-300" />
          <p className="text-sm text-gray-400">输入单词开始查询</p>
          <p className="mt-1 text-xs text-gray-300">
            支持英英释义、音标、发音和中文解释
          </p>
        </div>
      )}
    </div>
  );
}
