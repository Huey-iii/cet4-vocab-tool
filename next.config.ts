import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
  },
  // 生产环境开启压缩
  compress: true,
  // 生成静态 404 页面，避免 Vercel 默认页
  poweredByHeader: false,
};

export default nextConfig;
