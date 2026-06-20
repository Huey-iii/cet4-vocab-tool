"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, Trash2, CheckCircle, Circle, ChevronLeft, ChevronRight, BookOpen } from "lucide-react";

interface Word {
  id: string;
  word: string;
  part_of_speech: string;
  mastered: boolean;
  created_at: string;
}

interface WordListResponse {
  words: Word[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export default function MyWordsPage() {
  const [words, setWords] = useState<Word[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "mastered" | "unmastered">("all");
  const [loading, setLoading] = useState(true);
  const pageSize = 30;

  const fetchWords = useCallback(async (p: number, s: string, status: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), pageSize: String(pageSize) });
      if (s) params.set("search", s);
      if (status !== "all") params.set("status", status);

      const res = await fetch(`/api/words?${params}`);
      const data: WordListResponse = await res.json();
      setWords(data.words);
      setTotal(data.total);
      setPage(data.page);
      setTotalPages(data.totalPages);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    fetchWords(page, search, statusFilter);
  }, [page, search, statusFilter, fetchWords]);

  async function toggleMastered(word: Word) {
    try {
      await fetch("/api/words", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: word.id, mastered: !word.mastered }),
      });
      setWords((prev) => prev.map((w) => (w.id === word.id ? { ...w, mastered: !w.mastered } : w)));
    } catch {
      // ignore
    }
  }

  async function deleteWord(word: Word) {
    try {
      await fetch("/api/words", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: word.id }),
      });
      setWords((prev) => prev.filter((w) => w.id !== word.id));
      setTotal((t) => t - 1);
    } catch {
      // ignore
    }
  }

  function handleSearch(value: string) {
    setSearch(value);
    setPage(1);
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h2 className="mb-6 text-xl font-bold text-gray-900">我的词库</h2>

      {/* 搜索 & 过滤 */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1" style={{ minWidth: 200 }}>
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="搜索单词或词性..."
            className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm"
          />
        </div>
        <div className="flex rounded-lg border border-gray-300 text-sm">
          {(["all", "unmastered", "mastered"] as const).map((f) => (
            <button
              key={f}
              onClick={() => { setStatusFilter(f); setPage(1); }}
              className={`px-3 py-2 first:rounded-l-lg last:rounded-r-lg transition ${
                statusFilter === f ? "bg-blue-50 text-blue-600" : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              {{ all: "全部", unmastered: "未掌握", mastered: "已掌握" }[f]}
            </button>
          ))}
        </div>
      </div>

      {/* 统计 */}
      <p className="mb-3 text-xs text-gray-400">共 {total} 个单词</p>

      {/* 列表 */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-lg bg-gray-100" />
          ))}
        </div>
      ) : words.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-gray-400">
          <BookOpen className="mb-3 h-10 w-10" />
          <p>还没有单词，去上传页添加吧</p>
        </div>
      ) : (
        <div className="space-y-1">
          {words.map((w) => (
            <div
              key={w.id}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition hover:bg-gray-50 ${
                w.mastered ? "opacity-60" : ""
              }`}
            >
              <button onClick={() => toggleMastered(w)} className="shrink-0">
                {w.mastered ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <Circle className="h-5 w-5 text-gray-300" />
                )}
              </button>

              <div className="min-w-0 flex-1">
                <span className={`text-sm font-medium ${w.mastered ? "line-through" : ""}`}>
                  {w.word}
                </span>
              </div>

              <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                {w.part_of_speech || "-"}
              </span>

              <button
                onClick={() => deleteWord(w)}
                className="shrink-0 rounded p-1 text-gray-300 hover:text-red-500"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="rounded-lg border p-2 text-sm disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm text-gray-500">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="rounded-lg border p-2 text-sm disabled:opacity-30"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
