import { IndicatorData } from '../types';
import { Language, translations } from '../types/languages';
import { X } from 'lucide-react';

interface DetailModalProps {
  indicator: IndicatorData;
  onClose: () => void;
  language: Language;
}

export function DetailModal({ indicator, onClose, language }: DetailModalProps) {
  const t = translations[language];

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#1A1F26] border border-[#2A3441] rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-[#1A1F26] border-b border-[#2A3441] p-6 flex items-center justify-between">
          <h2 className="text-white text-xl">{indicator.name}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Description */}
          <div>
            <h3 className="text-white mb-2">{t.modal.whatIsThis}</h3>
            <p className="text-gray-400 leading-relaxed text-sm">
              {indicator.description}
            </p>
          </div>

          {/* Importance */}
          <div>
            <h3 className="text-white mb-2">{t.modal.whyImportant}</h3>
            <p className="text-gray-400 leading-relaxed text-sm">
              {indicator.importance}
            </p>
          </div>

          {/* Source */}
          <div className="pt-4 border-t border-[#2A3441]">
            <p className="text-gray-500 text-xs">
              {t.modal.dataSource}: {indicator.source}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}