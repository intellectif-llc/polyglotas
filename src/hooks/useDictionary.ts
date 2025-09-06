import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dictionaryService } from '@/services/dictionaryService';
import { DictionaryResult } from '@/types/dictionary';
import { useUserProfile } from './useUserProfile';

export const useDictionary = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const { data: userProfile } = useUserProfile();

  // Check if dictionary is available for current target language
  const isDictionaryAvailable = userProfile?.current_target_language_code === 'en';

  const { 
    data: result, 
    isLoading, 
    error, 
    refetch 
  } = useQuery<DictionaryResult | null>({
    queryKey: ['dictionary', searchTerm, userProfile?.current_target_language_code],
    queryFn: () => {
      if (!searchTerm.trim() || !isDictionaryAvailable) return null;
      return dictionaryService.lookupWord(searchTerm, userProfile?.current_target_language_code);
    },
    enabled: !!searchTerm.trim() && isDictionaryAvailable,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1
  });

  const search = useCallback((word: string) => {
    setSearchTerm(word.trim());
  }, []);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => {
    setIsOpen(false);
    setSearchTerm('');
  }, []);

  const playPronunciation = useCallback((audioUrl: string) => {
    const audio = new Audio(audioUrl);
    audio.play().catch(console.error);
  }, []);

  return {
    // State
    isOpen,
    searchTerm,
    result,
    isLoading,
    error,
    isDictionaryAvailable,
    
    // Actions
    search,
    open,
    close,
    playPronunciation,
    retry: refetch
  };
};