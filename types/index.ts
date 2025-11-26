export type SignalColor = 'red' | 'yellow' | 'green';

export type MarketStatus = '위험' | '주의' | '중립' | '안전' | '과열';

export type ChangeType = 'percent' | 'absolute' | 'point' | 'contracts';

export interface IndicatorData {
  id: string;
  name: string;
  nameTranslations?: {
    en?: string;
    ko?: string;
    ja?: string;
    zh?: string;
  };
  value: string;
  change: number;
  changeType: ChangeType;
  signal: SignalColor;
  interpretation: string;
  interpretationTranslations?: {
    en?: string;
    ko?: string;
    ja?: string;
    zh?: string;
  };
  description: string;
  descriptionTranslations?: {
    en?: string;
    ko?: string;
    ja?: string;
    zh?: string;
  };
  importance: string;
  importanceTranslations?: {
    en?: string;
    ko?: string;
    ja?: string;
    zh?: string;
  };
  historicalData: { date: string; value: number }[];
  source: string;
}

export interface SectorData {
  id: string;
  title: string;
  summary: string;
  indicators: IndicatorData[];
}