'use client';

import { useEffect, useState } from 'react';
import { Toaster } from 'sonner';
import { Header } from '../components/Header';
import { SectorSection } from '../components/SectorSection';
import { DetailModal } from '../components/DetailModal';
import { sectorsData as initialSectorsData, mainBriefing as initialMainBriefing, marketStatus as initialMarketStatus, lastUpdated as initialLastUpdated } from '../data/mockData';
import { IndicatorData, MarketStatus } from '../types';
import { Language } from '../types/languages';

// API에서 들어오는 데이터 형태 정의
interface MarketApiResponse {
  marketData: { 
    [key: string]: { 
      price: number;        // API는 price를 줌
      changePercent: number; 
    } 
  };
  aiAnalysis: { status: string; summary: string[] };
}

// ⭐ 여기를 수정하세요 (모든 이름표 경우의 수 추가)
const KEY_MAPPING: { [key: string]: string } = {
  // [미국 10년물 금리]
  'US 10Y Yield': 'us10y',
  '미국 10년물 금리': 'us10y',
  '10Y Yield': 'us10y',

  // [USD/JPY]
  'USD/JPY': 'usdjpy',
  'USD/JPY (달러-엔)': 'usdjpy',
  'USD/JPY (달러/엔)': 'usdjpy',

  // [VIX]
  'VIX': 'vix',
  'VIX (변동성 지수)': 'vix',
  'VIX (공포 지수)': 'vix',
  'CNN Fear & Greed': 'cnnIndex', // CNN 데이터 없어서 VIX로 대체 -> cnnIndex

  // [CTA Positioning]
  'CTA Positioning': 'bitcoin', // CTA 데이터는 비트코인(위험자산 선호도)으로 대체
  'Smart Money Flow': 'bitcoin',

  // [Breakeven Inflation]
  'Breakeven Inflation': 'breakeven',
  '기대 인플레이션': 'breakeven',
  '10Y Breakeven': 'breakeven',

  // [기타 필수 항목]
  'Net Liquidity': 'tga',
  'WTI Oil (유가)': 'wti',
  'WTI Oil': 'wti',
  'WTI': 'wti',
  'High Yield Spread': 'highYield',
  'FedWatch (동결 확률)': 'fedWatch',
  'FedWatch': 'fedWatch',
  'SOFR (단기 금리)': 'sofr',
  'SOFR': 'sofr',
  'Bitcoin': 'bitcoin',
  'DXY': 'dxy',
  'DXY (달러 인덱스)': 'dxy'
};

export default function Home() {
  const [selectedIndicator, setSelectedIndicator] = useState<IndicatorData | null>(null);
  const [language, setLanguage] = useState<Language>('en');
  
  // 데이터 상태
  const [marketData, setMarketData] = useState<MarketApiResponse['marketData'] | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<MarketApiResponse['aiAnalysis'] | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/macro');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: MarketApiResponse = await response.json();
        
        setMarketData(data.marketData);
        setAiAnalysis(data.aiAnalysis);
        
        // 현재 시간으로 업데이트 타임스탬프 찍기
        const now = new Date();
        setLastUpdated(now.toLocaleString('ko-KR', { 
          year: 'numeric', month: '2-digit', day: '2-digit', 
          hour: '2-digit', minute: '2-digit', hour12: false 
        }));

      } catch (e: any) {
        console.error("Fetch Error:", e);
        setError(e.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // API 키 찾기 함수 (한글 이름 -> 영어 ID)
  const getApiKey = (indicatorName: string) => {
    // 1. 매핑 테이블에서 찾기
    if (KEY_MAPPING[indicatorName]) return KEY_MAPPING[indicatorName];
    // 2. 없으면 이름 그대로 소문자로 찾기 (Fallback)
    return indicatorName.toLowerCase();
  };

  const getDisplayValue = (indicatorName: string) => {
    if (!marketData) return 'N/A';
    
    const key = getApiKey(indicatorName);
    const data = marketData[key];

    if (data && data.price !== undefined) {
      // 숫자가 너무 길면 소수점 2자리로 자름
      return typeof data.price === 'number' ? data.price.toFixed(2) : data.price;
    }
    return 'N/A';
  };

  const getDisplayChange = (indicatorName: string): number => {
    if (!marketData) return 0;
    const key = getApiKey(indicatorName);
    const data = marketData[key];
    if (data && data.changePercent !== undefined) {
      const n = Number(data.changePercent);
      if (isNaN(n)) return 0;
      return Number(n.toFixed(2));
    }
    return 0;
  };

  const getDisplayStatus = (): MarketStatus => {
    if (aiAnalysis && aiAnalysis.status) {
      switch (aiAnalysis.status) {
        case '위험': return '위험';
        case '주의': return '주의';
        case '중립': return '중립';
        case '긍정': return '안전';
        case '안전': return '안전';
        case '과열': return '과열';
        default: return '중립';
      }
    }
    return initialMarketStatus;
  };

  const getDisplayBriefing = () => {
    if (aiAnalysis && aiAnalysis.summary) {
      return aiAnalysis.summary.join(' ');
    }
    return initialMainBriefing;
  };

  // 기존 mockData의 구조를 유지하되, 값(value/change)만 API 데이터로 교체
  const updatedSectorsData = initialSectorsData.map(sector => ({
    ...sector,
    indicators: sector.indicators.map(indicator => ({
      ...indicator,
      // 여기서 API 데이터를 주입
      value: getDisplayValue(indicator.name),
      change: Number(getDisplayChange(indicator.name)),
      // 퍼센트 값이 있으면 무조건 percent 타입으로 표시
      changeType: 'percent' as const, 
    })),
  }));

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#121212] flex flex-col items-center justify-center text-white gap-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white"></div>
        <p>시장 데이터를 분석 중입니다...</p>
      </div>
    );
  }

  // 에러가 났어도 디자인 확인을 위해 화면은 띄워주되 경고 표시
  return (
    <div className="min-h-screen bg-[#121212]">
      <Toaster position="top-center" theme="dark" />

      <Header
        lastUpdated={lastUpdated || initialLastUpdated}
        briefing={getDisplayBriefing()}
        status={getDisplayStatus()}
        language={language}
        onLanguageChange={setLanguage}
      />
      
      {error && (
        <div className="bg-red-900/50 text-red-200 p-2 text-center text-sm">
          ⚠️ 데이터 연결 불안정: {error} (일부 데이터가 N/A로 표시될 수 있습니다)
        </div>
      )}

      <main className="w-full max-w-[1200px] mx-auto px-6 py-8">
        {updatedSectorsData.map((sector) => (
          <SectorSection
            key={sector.id}
            sector={sector}
            onCardClick={setSelectedIndicator}
            language={language}
          />
        ))}
      </main>

      {selectedIndicator && (
        <DetailModal
          indicator={selectedIndicator}
          onClose={() => setSelectedIndicator(null)}
          language={language}
        />
      )}
    </div>
  );
}