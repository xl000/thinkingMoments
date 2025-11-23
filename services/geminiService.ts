import { GoogleGenAI, Type } from '@google/genai';
import { TranslationItem, TranslationLevel, DictionaryResult } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const translateText = async (text: string): Promise<TranslationItem[]> => {
  const prompt = `
    Translate the following Chinese text into English in three distinct styles:
    1. Daily (Oral/Casual): Elementary school vocabulary, simple sentence structures.
    2. Social (Communication): University level vocabulary, sitcom/drama style, natural phrasing.
    3. Academic (Formal): IELTS/TOEFL vocabulary, formal register, complex structures.
    
    Source Text: "${text}"
  `;

  // We use JSON schema to ensure strictly structured output
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            level: { type: Type.STRING, enum: ['Daily', 'Social', 'Academic'] },
            text: { type: Type.STRING },
            keywords: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ['level', 'text', 'keywords']
        }
      }
    }
  });

  const rawData = JSON.parse(response.text || '[]');
  
  // Map string enums back to TS enums if necessary, though direct mapping usually works with strict schema
  return rawData.map((item: any) => ({
    level: item.level as TranslationLevel,
    text: item.text,
    keywords: item.keywords
  }));
};

export const lookupWord = async (word: string, contextSentence: string): Promise<DictionaryResult> => {
  const prompt = `
    Analyze the word "${word}" found in this sentence: "${contextSentence}".
    Provide the definition, phonetic (IPA), Chinese meaning, part of speech, and an example sentence relevant to this context.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          word: { type: Type.STRING },
          phonetic: { type: Type.STRING, description: "IPA format" },
          partOfSpeech: { type: Type.STRING },
          englishDefinition: { type: Type.STRING, description: "Simple English definition" },
          chineseDefinition: { type: Type.STRING },
          exampleSentence: { type: Type.STRING }
        },
        required: ['word', 'phonetic', 'partOfSpeech', 'englishDefinition', 'chineseDefinition', 'exampleSentence']
      }
    }
  });

  return JSON.parse(response.text || '{}');
};