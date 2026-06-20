import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center p-8">
      <div className="text-center">
        <h2 className="mb-2 text-3xl font-bold text-gray-200">404</h2>
        <p className="mb-1 text-sm font-medium text-gray-900">页面不存在</p>
        <p className="mb-4 text-xs text-gray-400">你访问的页面可能已被移除或地址输入有误</p>
        <Link
          href="/"
          className="inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
        >
          返回首页
        </Link>
      </div>
    </div>
  );
}
