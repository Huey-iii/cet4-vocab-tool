"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("页面错误:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-8">
      <div className="text-center">
        <h2 className="mb-2 text-lg font-bold text-gray-900">出了点问题</h2>
        <p className="mb-4 text-sm text-gray-500">
          {error.message || "页面加载时发生未知错误"}
        </p>
        <button
          onClick={reset}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
        >
          重试
        </button>
      </div>
    </div>
  );
}
