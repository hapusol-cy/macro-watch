import { MarketStatus } from '../types';
import { Language, translations } from '../types/languages';
import { toast } from 'sonner';
import { TrendingUp } from 'lucide-react';
import { LanguageSelector } from './LanguageSelector';

interface HeaderProps {
  lastUpdated: string;
  briefing: string;
  status: MarketStatus;
  language: Language;
  onLanguageChange: (lang: Language) => void;
}

const statusColors: Record<MarketStatus, string> = {
  위험: 'bg-red-500/10 text-red-400 border-red-500/30',
  주의: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
  중립: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
  안전: 'bg-green-500/10 text-green-400 border-green-500/30',
  과열: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
};

export function Header({ lastUpdated, briefing, status, language, onLanguageChange }: HeaderProps) {
  const t = translations[language];
  
  const handleCopyBriefing = () => {
    const textToCopy = briefing.replace(/\*\*/g, '');
    navigator.clipboard.writeText(textToCopy);
    toast.success(t.copied);
  };

  const formatBriefing = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={index} className="font-medium text-white">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  return (
    <header className="w-full border-b border-[#1E2935]">
      <div className="max-w-[1200px] mx-auto px-6 py-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-500 rounded transform rotate-45"></div>
            <h1 className="text-white text-xl">Macro Watch</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-xs text-gray-400">
              {t.lastUpdated}: {lastUpdated}
            </div>
            <LanguageSelector currentLanguage={language} onLanguageChange={onLanguageChange} />
          </div>
        </div>

        <div
          onClick={handleCopyBriefing}
          className="bg-[#1A1F26] border border-[#2A3441] rounded-lg p-5 cursor-pointer hover:border-[#3A4451] transition-colors"
        >
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-500/10 rounded flex items-center justify-center flex-shrink-0 mt-1">
              <TrendingUp className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <h3 className="text-white mb-2">{t.aiMarketBriefing}</h3>
              <div className="text-sm text-gray-400 leading-relaxed">
                {formatBriefing(briefing)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}