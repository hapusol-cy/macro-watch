import { SectorData, IndicatorData } from '../types';
import { Language } from '../types/languages';
import { IndicatorCard } from './IndicatorCard';

interface SectorSectionProps {
  sector: SectorData;
  onCardClick: (indicator: IndicatorData) => void;
  language: Language;
}

export function SectorSection({ sector, onCardClick, language }: SectorSectionProps) {
  return (
    <section className="mb-12">
      <div className="mb-5 border-l-4 border-blue-500 pl-5 py-2">
        <h2 className="text-white text-xl mb-1">{sector.title}</h2>
        <p className="text-gray-400">{sector.summary}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sector.indicators.map((indicator) => (
          <IndicatorCard
            key={indicator.id}
            indicator={indicator}
            onClick={() => onCardClick(indicator)}
            language={language}
          />
        ))}
      </div>
    </section>
  );
}