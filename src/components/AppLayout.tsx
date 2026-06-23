"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Upload, BookOpen, Pencil, Search, Sparkles } from "lucide-react";

const NAV_ITEMS = [
  { href: "/upload", label: "上传", icon: Upload },
  { href: "/my-words", label: "词库", icon: BookOpen },
  { href: "/dictation/setup", label: "听写", icon: Pencil },
  { href: "/dictionary", label: "词典", icon: Search },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-[#f5f5f7]">
      {/* ── 桌面侧边栏 ── */}
      <aside className="hidden w-60 flex-col border-r border-black/5 bg-white/60 backdrop-blur-xl md:flex">
        {/* Logo */}
        <div className="flex h-14 items-center gap-2.5 border-b border-black/5 px-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 shadow-sm">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <h1 className="text-sm font-bold text-slate-800">CET-4 词汇</h1>
        </div>

        {/* 导航 */}
        <nav className="flex-1 space-y-0.5 p-3">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  active
                    ? "bg-indigo-50/80 text-indigo-700"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                }`}
              >
                {active && (
                  <div className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-gradient-to-b from-indigo-500 to-purple-600" />
                )}
                <Icon
                  size={18}
                  className={active ? "text-indigo-500" : "text-slate-400 group-hover:text-slate-500"}
                />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* 底部提示 */}
        <div className="border-t border-black/5 px-5 py-3">
          <p className="text-xs text-slate-400">AI 驱动的词汇学习</p>
        </div>
      </aside>

      {/* ── 主内容区 ── */}
      <main className="flex-1 pb-20 md:pb-0 animate-fade-in">{children}</main>

      {/* ── 移动端底部导航 ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-black/5 bg-white/70 backdrop-blur-xl safe-area-bottom md:hidden">
        <div className="mx-auto flex max-w-lg items-center px-2 py-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`relative flex flex-1 flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 text-[11px] font-medium transition-all duration-200 ${
                  active
                    ? "text-indigo-600"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                {active && (
                  <div className="absolute -top-1 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600" />
                )}
                <Icon size={20} />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
