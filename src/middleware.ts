import { NextResponse } from "next/server";

export function middleware() {
  // TODO: 可在此添加认证检查、限流等逻辑
  return NextResponse.next();
}

// 当前仅应用于 API 路由，可按需扩展
export const config = {
  matcher: ["/api/:path*"],
};
