import React from 'react';
import { TranslationItem, TranslationLevel } from '../types';

interface TranslationCardProps {
  item: TranslationItem;
  onWordClick: (word: string, context: string, e: React.MouseEvent) => void;
}

const levelColors = {
  [TranslationLevel.Daily]: 'bg-emerald-50 border-emerald-100 text-emerald-900',
  [TranslationLevel.Social]: 'bg-blue-50 border-blue-100 text-blue-900',
  [TranslationLevel.Academic]: 'bg-purple-50 border-purple-100 text-purple-900',
};

const badgeColors = {
  [TranslationLevel.Daily]: 'bg-emerald-200 text-emerald-800',
  [TranslationLevel.Social]: 'bg-blue-200 text-blue-800',
  [TranslationLevel.Academic]: 'bg-purple-200 text-purple-800',
};

export const TranslationCard: React.FC<TranslationCardProps> = ({ item, onWordClick }) => {
  // Simple tokenizer that keeps punctuation separate or attached in a way that allows word selection
  // We split by spaces but clean words on click
  const words = item.text.split(' ');

  const handleWordClick = (e: React.MouseEvent, rawWord: string) => {
    e.stopPropagation();
    // Regex to strip punctuation for the lookup
    const cleanWord = rawWord.replace(/[.,/#!$%^&*;:{}=\-_`~()?"']/g, "");
    if (cleanWord.length > 0) {
      onWordClick(cleanWord, item.text, e);
    }
  };

  return (
    <div className={`p-5 rounded-xl border ${levelColors[item.level]} transition-shadow hover:shadow-sm`}>
      <div className="flex items-center justify-between mb-3">
        <span className={`text-xs font-bold px-2 py-1 rounded-md uppercase tracking-wide ${badgeColors[item.level]}`}>
          {item.level}
        </span>
      </div>
      
      <p className="text-lg leading-relaxed text-gray-800">
        {words.map((word, idx) => (
          <span key={idx}>
            <span 
              className="cursor-pointer hover:bg-black/5 hover:text-black rounded px-0.5 transition-colors duration-150 active:bg-black/10"
              onClick={(e) => handleWordClick(e, word)}
            >
              {word}
            </span>
            {' '}
          </span>
        ))}
      </p>

      {item.keywords && item.keywords.length > 0 && (
        <div className="mt-4 pt-3 border-t border-black/5">
          <p className="text-xs font-semibold opacity-60 uppercase mb-1">Key Vocabulary</p>
          <div className="flex flex-wrap gap-2">
            {item.keywords.map((kw, i) => (
              <span key={i} className="text-xs bg-white/50 px-2 py-1 rounded border border-black/5 text-gray-600">
                {kw}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};