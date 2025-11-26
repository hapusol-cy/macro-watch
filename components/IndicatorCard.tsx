import { IndicatorData, SignalColor } from '../types';
import { Language } from '../types/languages';

interface IndicatorCardProps {
  indicator: IndicatorData;
  onClick: () => void;
  language: Language;
}

const signalColors: Record<SignalColor, { dot: string; text: string }> = {
  red: {
    dot: 'bg-red-500',
    text: 'text-gray-400',
  },
  yellow: {
    dot: 'bg-yellow-500',
    text: 'text-gray-400',
  },
  green: {
    dot: 'bg-green-500',
    text: 'text-gray-400',
  },
};

const fromYesterdayText: Record<Language, string> = {
  en: '(vs Yesterday)',
  ko: '(어제보다)',
  ja: '(前日比)',
  zh: '(较昨日)',
};

export function IndicatorCard({ indicator, onClick, language }: IndicatorCardProps) {
  const colors = signalColors[indicator.signal];
  const changeColor = indicator.change >= 0 ? 'text-green-400' : 'text-red-400';
  const changeSymbol = indicator.change >= 0 ? '+' : '';

  const formatChange = () => {
    const absChange = Math.abs(indicator.change);
    
    switch (indicator.changeType) {
      case 'percent':
        return `${changeSymbol}${indicator.change}%`;
      case 'absolute':
        return `${changeSymbol}${indicator.change.toFixed(2)}`;
      case 'point':
        return `${changeSymbol}${indicator.change}%p`;
      case 'contracts':
        return `${changeSymbol}${indicator.change.toLocaleString()}`;
      default:
        return `${changeSymbol}${indicator.change}%`;
    }
  };

  return (
    <div
      onClick={onClick}
      className="bg-[#1A1F26] border border-[#2A3441] rounded-lg p-5 cursor-pointer transition-all hover:border-[#3A4451] hover:bg-[#1E2430]"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="text-gray-300 text-sm">{indicator.name}</div>
        <div className={`w-2.5 h-2.5 rounded-full ${colors.dot} ring-4 ring-${colors.dot.split('-')[1]}-500/20`}></div>
      </div>

      <div className="mb-3">
        <div className="text-white text-3xl mb-1">{indicator.value}</div>
        <div className={`text-sm ${changeColor}`}>
          {formatChange()} <span className="text-gray-500 text-xs">{fromYesterdayText[language]}</span>
        </div>
      </div>

      <div className={`text-xs ${colors.text} leading-relaxed`}>
        {indicator.interpretation}
      </div>
    </div>
  );
}