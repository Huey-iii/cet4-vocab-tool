import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CET-4 词汇工具",
  description: "AI 驱动的 CET-4 词汇听写与学习工具",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}
