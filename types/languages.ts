export type Language = 'en' | 'ko' | 'ja' | 'zh';

export interface Translations {
  lastUpdated: string;
  aiMarketBriefing: string;
  sectors: {
    sentiment: string;
    liquidity: string;
    rates: string;
    economy: string;
  };
  modal: {
    oneYearTrend: string;
    whatIsThis: string;
    whyImportant: string;
    dataSource: string;
  };
  copied: string;
}

export const translations: Record<Language, Translations> = {
  en: {
    lastUpdated: 'Last Updated',
    aiMarketBriefing: 'AI Market Briefing',
    sectors: {
      sentiment: 'Sentiment',
      liquidity: 'Liquidity',
      rates: 'Rates',
      economy: 'Economy',
    },
    modal: {
      oneYearTrend: '1-Year Trend',
      whatIsThis: 'What is this indicator?',
      whyImportant: 'Why is it important?',
      dataSource: 'Data source',
    },
    copied: 'Copied to clipboard',
  },
  ko: {
    lastUpdated: '마지막 업데이트',
    aiMarketBriefing: 'AI 시장 브리핑',
    sectors: {
      sentiment: '심리',
      liquidity: '유동성',
      rates: '금리',
      economy: '펀더멘털',
    },
    modal: {
      oneYearTrend: '최근 1년 추이',
      whatIsThis: '이 지표는 무엇인가요?',
      whyImportant: '왜 중요한가요?',
      dataSource: '데이터 출처',
    },
    copied: '복사되었습니다',
  },
  ja: {
    lastUpdated: '最終更新',
    aiMarketBriefing: 'AIマーケットブリーフィング',
    sectors: {
      sentiment: '心理',
      liquidity: '流動性',
      rates: '金利',
      economy: 'ファンダメンタルズ',
    },
    modal: {
      oneYearTrend: '過去1年のトレンド',
      whatIsThis: 'この指標とは？',
      whyImportant: 'なぜ重要なのか？',
      dataSource: 'データソース',
    },
    copied: 'コピーしました',
  },
  zh: {
    lastUpdated: '最后更新',
    aiMarketBriefing: 'AI市场简报',
    sectors: {
      sentiment: '情绪',
      liquidity: '流动性',
      rates: '利率',
      economy: '基本面',
    },
    modal: {
      oneYearTrend: '近一年趋势',
      whatIsThis: '这个指标是什么？',
      whyImportant: '为什么重要？',
      dataSource: '数据来源',
    },
    copied: '已复制',
  },
};
