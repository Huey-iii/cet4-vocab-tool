"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Upload, Pencil, Keyboard, BookOpen, TrendingUp, Loader2 } from "lucide-react";

interface Stats {
  total: number;
  mastered: number;
  unmastered: number;
  recentSessions: number;
}

export default function HomePage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/stats");
        if (res.ok) {
          setStats(await res.json());
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h2 className="mb-2 text-xl font-bold text-gray-900">CET-4 词汇工具</h2>
      <p className="mb-8 text-sm text-gray-500">AI 驱动的英语词汇学习助手</p>

      {/* 统计卡片 */}
      {loading ? (
        <div className="mb-8 grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      ) : stats ? (
        <div className="mb-8 grid grid-cols-3 gap-3">
          <div className="rounded-xl border bg-white p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            <p className="text-xs text-gray-500">总词汇</p>
          </div>
          <div className="rounded-xl border bg-white p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{stats.mastered}</p>
            <p className="text-xs text-gray-500">已掌握</p>
          </div>
          <div className="rounded-xl border bg-white p-4 text-center">
            <p className="text-2xl font-bold text-amber-500">{stats.unmastered}</p>
            <p className="text-xs text-gray-500">未掌握</p>
          </div>
        </div>
      ) : null}

      {/* 快捷入口 */}
      <h3 className="mb-3 text-sm font-medium text-gray-600">快捷入口</h3>
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/upload"
          className="flex items-center gap-3 rounded-xl border bg-white p-4 transition hover:border-blue-200 hover:shadow-sm"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
            <Upload className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">上传单词</p>
            <p className="text-xs text-gray-400">拍照识别词库</p>
          </div>
        </Link>

        <Link
          href="/my-words"
          className="flex items-center gap-3 rounded-xl border bg-white p-4 transition hover:border-blue-200 hover:shadow-sm"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50">
            <BookOpen className="h-5 w-5 text-green-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">我的词库</p>
            <p className="text-xs text-gray-400">管理学习进度</p>
          </div>
        </Link>

        <Link
          href="/dictation/setup"
          className="flex items-center gap-3 rounded-xl border bg-white p-4 transition hover:border-blue-200 hover:shadow-sm"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50">
            <Pencil className="h-5 w-5 text-purple-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">手写听写</p>
            <p className="text-xs text-gray-400">纸上听写+AI批改</p>
          </div>
        </Link>

        <Link
          href="/dictation/setup"
          className="flex items-center gap-3 rounded-xl border bg-white p-4 transition hover:border-blue-200 hover:shadow-sm"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50">
            <Keyboard className="h-5 w-5 text-orange-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">键入拼写</p>
            <p className="text-xs text-gray-400">听音打字练习</p>
          </div>
        </Link>
      </div>

      {/* 学习统计空态 */}
      {stats && stats.total === 0 && (
        <div className="mt-8 rounded-xl border-2 border-dashed border-gray-200 p-6 text-center">
          <TrendingUp className="mx-auto mb-2 h-8 w-8 text-gray-300" />
          <p className="text-sm text-gray-400">还没有单词数据</p>
          <p className="text-xs text-gray-300 mt-1">上传单词后这里会显示学习统计</p>
        </div>
      )}
    </div>
  );
}
