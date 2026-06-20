"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body className="bg-gray-50 antialiased">
        <div className="flex min-h-screen items-center justify-center p-8">
          <div className="text-center">
            <h2 className="mb-2 text-lg font-bold text-gray-900">应用崩溃</h2>
            <p className="mb-4 text-sm text-gray-500">
              {error.message || "发生了致命错误，请刷新页面重试"}
            </p>
            <button
              onClick={reset}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
            >
              刷新页面
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
