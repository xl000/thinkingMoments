export enum TranslationLevel {
  Daily = 'Daily',
  Social = 'Social',
  Academic = 'Academic'
}

export interface TranslationItem {
  level: TranslationLevel;
  text: string;
  keywords: string[]; // Key vocabulary used in this translation
}

export interface Note {
  id: string;
  content: string; // The original Chinese text
  translations: TranslationItem[];
  createdAt: number;
  updatedAt: number;
}

export interface DictionaryResult {
  word: string;
  phonetic: string; // IPA
  partOfSpeech: string;
  englishDefinition: string;
  chineseDefinition: string;
  exampleSentence: string;
}

export type ExportFormat = 'txt' | 'json' | 'md';
