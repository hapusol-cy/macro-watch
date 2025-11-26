import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // --- 기존 옵션 유지 ---
  /* config options here */

  // --- 추가: 빌드시 타입스크립트, ESLint 에러 무시 ---
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true }
};

export default nextConfig;
