import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  // 브라우저 탭 제목
  title: "Macro-Watch | 실시간 거시경제 지표 및 AI 분석 대시보드",
  // 검색 결과에 노출되는 설명
  description:
    "개인 투자자를 위한 실시간 시장 유동성(TGA, RRP, SOFR) 및 금리, VIX 지표 추적. AI가 분석한 한글 요약 리포트를 제공합니다.",
  // 핵심 키워드 (검색 엔진이 사이트를 분류하는 기준)
  keywords: [
    "거시경제",
    "매크로",
    "주식투자",
    "FedWatch",
    "VIX",
    "TGA",
    "RRP",
    "실시간지표",
    "금리",
    "AI분석",
    "유동성",
  ].join(", "),
  // 기타 설정 (파비콘 등)
  // ...
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
