"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Upload, BookOpen, Pencil, Search } from "lucide-react";

const NAV_ITEMS = [
  { href: "/upload", label: "上传", icon: Upload },
  { href: "/my-words", label: "词库", icon: BookOpen },
  { href: "/dictation/setup", label: "听写", icon: Pencil },
  { href: "/dictionary", label: "词典", icon: Search },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="hidden w-56 flex-col border-r border-gray-200 bg-white md:flex">
        <div className="flex h-14 items-center border-b px-4">
          <h1 className="text-base font-bold text-gray-900">CET-4 词汇</h1>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                  active ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <Icon size={18} />
                {label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <main className="flex-1 pb-16 md:pb-0">{children}</main>
      <nav className="fixed bottom-0 left-0 right-0 flex border-t border-gray-200 bg-white md:hidden">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-1 flex-col items-center gap-1 py-2 text-xs ${
                active ? "text-blue-600" : "text-gray-400"
              }`}
            >
              <Icon size={20} />
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
