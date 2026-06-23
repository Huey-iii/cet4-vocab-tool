"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Search, Trash2, CheckCircle, Circle, ChevronLeft, ChevronRight, BookOpen, Sparkles } from "lucide-react";

interface Word {
  id: string;
  word: string;
  part_of_speech: string;
  chinese_meaning: string;
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

const FILTERS = [
  { key: "all", label: "全部" },
  { key: "unmastered", label: "未掌握" },
  { key: "mastered", label: "已掌握" },
] as const;

export default function MyWordsPage() {
  const [words, setWords] = useState<Word[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "mastered" | "unmastered">("all");
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Word | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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
    setSearchInput(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearch(value);
      setPage(1);
    }, 300);
  }

  return (
    <div className="mx-auto max-w-2xl px-5 py-8 animate-fade-in">
      {/* ── 标题 ── */}
      <div className="mb-6">
        <h2 className="text-xl font-extrabold text-slate-900">我的词库</h2>
        <p className="mt-0.5 text-xs text-slate-400">共 {total} 个单词</p>
      </div>

      {/* ── 搜索 & 过滤 ── */}
      <div className="mb-4 space-y-3">
        {/* 搜索 */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={searchInput}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="搜索单词或词性..."
            className="input-glow glass-card w-full py-2.5 pl-10 pr-4 text-sm text-slate-700 placeholder:text-slate-300"
          />
        </div>

        {/* 过滤 */}
        <div className="flex rounded-2xl bg-slate-100/80 p-1 text-sm">
          {FILTERS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => { setStatusFilter(key); setPage(1); }}
              className={`flex-1 rounded-xl py-2 text-center text-xs font-medium transition-all duration-200 ${
                statusFilter === key
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── 列表 ── */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-14 rounded-2xl" />
          ))}
        </div>
      ) : words.length === 0 ? (
        <div className="glass-card flex flex-col items-center px-6 py-14 text-center animate-slide-up">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50">
            <BookOpen className="h-7 w-7 text-slate-300" />
          </div>
          <p className="mb-1 text-sm font-medium text-slate-500">词库为空</p>
          <p className="text-xs text-slate-400">去上传页添加一些单词吧</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {words.map((w) => (
            <div
              key={w.id}
              className={`glass-card flex items-center gap-3 px-3 py-2.5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${
                w.mastered ? "opacity-50" : ""
              }`}
            >
              {/* 已掌握切换 */}
              <button
                onClick={() => toggleMastered(w)}
                className="shrink-0 transition-transform active:scale-90"
              >
                {w.mastered ? (
                  <CheckCircle className="h-5 w-5 text-emerald-500" />
                ) : (
                  <Circle className="h-5 w-5 text-slate-300 hover:text-emerald-400 transition-colors" />
                )}
              </button>

              {/* 单词信息 */}
              <div className="min-w-0 flex-1">
                <span
                  className={`text-sm font-semibold text-slate-800 ${
                    w.mastered ? "line-through" : ""
                  }`}
                >
                  {w.word}
                </span>
                {w.chinese_meaning && (
                  <span className="ml-2 text-xs text-slate-400">{w.chinese_meaning}</span>
                )}
              </div>

              {/* 词性标签 */}
              {w.part_of_speech && (
                <span className="shrink-0 rounded-lg bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                  {w.part_of_speech}
                </span>
              )}

              {/* 删除 */}
              <button
                onClick={() => setDeleteTarget(w)}
                className="shrink-0 rounded-lg p-1.5 text-slate-300 transition-colors hover:bg-red-50 hover:text-red-400"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── 分页 ── */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="glass-card flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition-all hover:text-indigo-600 disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-medium text-slate-500">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="glass-card flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition-all hover:text-indigo-600 disabled:opacity-30"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ── 删除确认弹窗 ── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm animate-fade-in">
          <div className="glass-card w-80 p-6 shadow-xl animate-bounce-in">
            <div className="mb-1 flex items-center justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
                <Trash2 className="h-6 w-6 text-red-400" />
              </div>
            </div>
            <p className="mb-1 text-center text-sm font-semibold text-slate-800">确认删除</p>
            <p className="mb-5 text-center text-xs text-slate-500">
              确定要删除 <span className="font-semibold text-slate-700">&ldquo;{deleteTarget.word}&rdquo;</span> 吗？<br />此操作不可撤销。
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-600 transition-all hover:bg-slate-50"
              >
                取消
              </button>
              <button
                onClick={() => { deleteWord(deleteTarget); setDeleteTarget(null); }}
                className="flex-1 rounded-xl bg-gradient-to-r from-red-500 to-rose-500 py-2.5 text-sm font-medium text-white shadow-md transition-all hover:shadow-lg active:scale-95"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
