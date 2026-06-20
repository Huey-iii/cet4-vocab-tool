export default function Loading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-8">
      <div className="space-y-3 text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-gray-200 border-t-blue-600" />
        <p className="text-sm text-gray-400">加载中...</p>
      </div>
    </div>
  );
}
