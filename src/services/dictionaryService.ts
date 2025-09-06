import { DictionaryEntry, DictionaryResult } from '@/types/dictionary';

class DictionaryService {
  private readonly useInternalApi = true; // Use our API route to avoid CORS issues

  async lookupWord(word: string, language: string = 'en'): Promise<DictionaryResult | null> {
    // Only support English for now
    if (language !== 'en') {
      throw new Error('Dictionary currently only supports English');
    }

    try {
      const url = this.useInternalApi 
        ? `/api/dictionary?word=${encodeURIComponent(word.toLowerCase())}&language=${language}`
        : `https://api.dictionaryapi.dev/api/v2/entries/${language}/${encodeURIComponent(word.toLowerCase())}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        if (response.status === 404) {
          return null; // Word not found
        }
        throw new Error(`Dictionary API error: ${response.status}`);
      }

      const data: DictionaryEntry[] = await response.json();
      const entry = data[0];

      if (!entry) return null;

      // Find the best audio URL
      const audioUrl = entry.phonetics.find(p => p.audio)?.audio || undefined;

      // Process meanings and definitions
      const meanings = entry.meanings.map(meaning => ({
        partOfSpeech: meaning.partOfSpeech,
        definitions: meaning.definitions.slice(0, 3).map(def => def.definition) // Limit to 3 definitions
      }));

      return {
        word: entry.word,
        phonetic: entry.phonetic || entry.phonetics[0]?.text,
        audioUrl,
        meanings
      };
    } catch (error) {
      console.error('Dictionary lookup error:', error);
      throw error;
    }
  }
}

export const dictionaryService = new DictionaryService();