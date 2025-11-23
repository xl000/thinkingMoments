import React from 'react';
import { DictionaryResult } from '../types';
import { SpeakerIcon, XIcon } from './Icons';

interface WordModalProps {
  data: DictionaryResult | null;
  loading: boolean;
  onClose: () => void;
  position: { x: number; y: number } | null;
}

export const WordModal: React.FC<WordModalProps> = ({ data, loading, onClose, position }) => {
  if (!position && !loading && !data) return null;

  const playAudio = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
  };

  // Fixed style if mobile, absolute if desktop
  const isMobile = window.innerWidth < 768;

  const style: React.CSSProperties = isMobile
    ? { bottom: 0, left: 0, right: 0, position: 'fixed', transform: 'none' }
    : { top: position?.y || 0, left: position?.x || 0, position: 'absolute', transform: 'translate(-50%, 10px)' };

  return (
    <>
       {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40 bg-black/20" 
        onClick={onClose}
      />
      
      <div 
        className={`z-50 bg-white shadow-2xl rounded-xl border border-gray-100 p-6 w-full md:w-80 transition-all duration-200 ${isMobile ? 'rounded-b-none' : ''}`}
        style={style}
      >
        {loading ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-3">
                <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm text-gray-500">Analyzing word context...</p>
            </div>
        ) : data ? (
          <div>
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{data.word}</h3>
                <div className="flex items-center space-x-2 text-gray-500 mt-1">
                  <span className="font-mono text-sm bg-gray-100 px-1.5 rounded text-gray-600">{data.phonetic}</span>
                  <span className="italic text-sm">{data.partOfSpeech}</span>
                  <button 
                    onClick={() => playAudio(data.word)}
                    className="p-1 hover:bg-gray-100 rounded-full text-brand-500 transition-colors"
                    title="Play pronunciation"
                  >
                    <SpeakerIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 mt-4">
              <div className="border-l-2 border-brand-500 pl-3">
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider text-[10px] mb-0.5">Chinese Definition</p>
                <p className="text-gray-800 font-medium">{data.chineseDefinition}</p>
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider text-[10px] mb-0.5">English Definition</p>
                <p className="text-gray-700 text-sm leading-relaxed">{data.englishDefinition}</p>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider text-[10px] mb-1">Example</p>
                <p className="text-gray-600 text-sm italic">"{data.exampleSentence}"</p>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
};