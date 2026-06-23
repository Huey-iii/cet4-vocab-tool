"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Upload, Pencil, Keyboard, BookOpen, Search, Sparkles, TrendingUp } from "lucide-react";

interface Stats {
  total: number;
  mastered: number;
  unmastered: number;
  recentSessions: number;
}

const QUICK_LINKS = [
  {
    href: "/upload",
    label: "上传单词",
    desc: "拍照识别词库",
    icon: Upload,
    bg: "from-blue-50 to-cyan-50",
    iconColor: "text-blue-500",
  },
  {
    href: "/my-words",
    label: "我的词库",
    desc: "管理学习进度",
    icon: BookOpen,
    bg: "from-emerald-50 to-green-50",
    iconColor: "text-emerald-500",
  },
  {
    href: "/dictation/setup?mode=handwrite",
    label: "手写听写",
    desc: "纸上听写 + AI 批改",
    icon: Pencil,
    bg: "from-purple-50 to-pink-50",
    iconColor: "text-purple-500",
  },
  {
    href: "/dictation/setup?mode=typing",
    label: "键入拼写",
    desc: "听音打字练习",
    icon: Keyboard,
    bg: "from-orange-50 to-amber-50",
    iconColor: "text-orange-500",
  },
  {
    href: "/dictionary",
    label: "查词典",
    desc: "中英释义查询",
    icon: Search,
    bg: "from-sky-50 to-indigo-50",
    iconColor: "text-sky-500",
  },
];

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
    <div className="mx-auto max-w-2xl px-5 py-8 animate-fade-in">
      {/* ── 顶部标题 ── */}
      <div className="mb-8 text-center">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-indigo-50 px-4 py-1.5 text-xs font-medium text-indigo-600">
          <Sparkles className="h-3.5 w-3.5" />
          AI 驱动
        </div>
        <h2 className="mb-2 text-2xl font-extrabold tracking-tight text-slate-900">
          英语四级
          <span className="text-gradient-brand">词汇助手</span>
        </h2>
        <p className="text-sm text-slate-500">智能听写 · AI 批改 · 随时学习</p>
      </div>

      {/* ── 统计卡片 ── */}
      {loading ? (
        <div className="mb-8 grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-24 rounded-2xl" />
          ))}
        </div>
      ) : stats ? (
        <div className="mb-8 grid grid-cols-3 gap-3">
          <div className="glass-card p-4 text-center transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
            <div className="mb-1 h-1 w-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 mx-auto" />
            <p className="text-2xl font-extrabold text-slate-900">{stats.total}</p>
            <p className="text-[11px] font-medium text-slate-400">总词汇</p>
          </div>
          <div className="glass-card p-4 text-center transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
            <div className="mb-1 h-1 w-8 rounded-full bg-gradient-to-r from-emerald-500 to-green-500 mx-auto" />
            <p className="text-2xl font-extrabold text-emerald-600">{stats.mastered}</p>
            <p className="text-[11px] font-medium text-slate-400">已掌握</p>
          </div>
          <div className="glass-card p-4 text-center transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
            <div className="mb-1 h-1 w-8 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 mx-auto" />
            <p className="text-2xl font-extrabold text-amber-500">{stats.unmastered}</p>
            <p className="text-[11px] font-medium text-slate-400">未掌握</p>
          </div>
        </div>
      ) : null}

      {/* ── 快捷入口 ── */}
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">快捷入口</h3>
      <div className="grid grid-cols-2 gap-3">
        {QUICK_LINKS.map(({ href, label, desc, icon: Icon, bg, iconColor }) => (
          <Link
            key={href}
            href={href}
            className="glass-card group flex items-start gap-3 p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
          >
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${bg}`}
            >
              <Icon className={`h-5 w-5 ${iconColor}`} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors">
                {label}
              </p>
              <p className="text-xs text-slate-400">{desc}</p>
            </div>
          </Link>
        ))}

        {/* 占位第六项使最后一行对齐 */}
        <div className="hidden" />
      </div>

      {/* ── 学习统计空态 ── */}
      {stats && stats.total === 0 && (
        <div className="mt-8 glass-card flex flex-col items-center px-6 py-10 text-center animate-slide-up">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50">
            <TrendingUp className="h-8 w-8 text-slate-300" />
          </div>
          <p className="mb-1 text-sm font-medium text-slate-500">还没有单词数据</p>
          <p className="text-xs text-slate-400">上传单词后这里会显示学习统计</p>
          <Link
            href="/upload"
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-2 text-xs font-medium text-white shadow-md transition-all hover:shadow-indigo-200 hover:-translate-y-0.5 active:scale-95"
          >
            <Upload className="h-3.5 w-3.5" />
            去上传单词
          </Link>
        </div>
      )}
    </div>
  );
}
