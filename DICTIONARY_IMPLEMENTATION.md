# Dictionary Functionality Implementation

## Overview
The dictionary functionality provides English word definitions, pronunciations, and grammar categories using the Free Dictionary API. It's designed to be language-aware and extensible for future multi-language support.

## Architecture

### Components
- **Dictionary Component** (`src/components/shared/Dictionary.tsx`)
  - Floating button positioned bottom-right
  - Animated modal with search functionality
  - Mobile-optimized design
  - Only shows when target language is English

### Services
- **Dictionary Service** (`src/services/dictionaryService.ts`)
  - Handles Free Dictionary API integration
  - Language detection and validation
  - Data transformation and error handling

### Hooks
- **useDictionary** (`src/hooks/useDictionary.ts`)
  - State management for dictionary functionality
  - Integration with user profile for language detection
  - React Query for caching and error handling

### API Routes
- **Dictionary API** (`src/app/api/dictionary/route.ts`)
  - Server-side proxy to avoid CORS issues
  - Error handling and validation
  - Future-ready for API key management

## Features

### Current Implementation
- ✅ English word lookup using Free Dictionary API
- ✅ Definitions, part of speech, and pronunciation
- ✅ Audio pronunciation playback
- ✅ Language-aware (only shows for English target language)
- ✅ Mobile-responsive design
- ✅ Error handling and loading states
- ✅ Caching with React Query

### Future Extensions
- 🔄 Collins API integration for other languages
- 🔄 Offline dictionary support
- 🔄 Word history and favorites
- 🔄 Integration with lesson vocabulary

## Usage

The dictionary automatically appears as a floating button in the bottom-right corner when:
1. User is in the learn section
2. User's target language is English (`current_target_language_code = 'en'`)

### User Flow
1. Click floating dictionary button
2. Search for any English word
3. View definitions, part of speech, and pronunciation
4. Play audio pronunciation if available
5. Close modal or search for another word

## Technical Details

### Language Detection
```typescript
const isDictionaryAvailable = userProfile?.current_target_language_code === 'en';
```

### API Integration
- Primary: Free Dictionary API (`https://api.dictionaryapi.dev/api/v2/entries/en/{word}`)
- Fallback: Internal API route for CORS handling
- Response caching: 5 minutes via React Query

### Mobile Optimization
- Bottom sheet design on mobile
- Fixed modal on desktop
- Touch-friendly button sizing (44px minimum)
- Positioned above "Next" buttons

## Database Integration

The dictionary uses existing user profile data:
- `student_profiles.current_target_language_code` - determines dictionary availability
- No additional database tables required for basic functionality

## Future Multi-Language Support

The architecture is designed for easy extension:

```typescript
// Future implementation example
const dictionaryProviders = {
  'en': FreeDictionaryAPI,
  'es': CollinsAPI,
  'fr': CollinsAPI,
  // ... other languages
};
```

## Performance Considerations

- React Query caching reduces API calls
- Lazy loading of audio files
- Debounced search input (can be added)
- Minimal bundle size impact

## Accessibility

- Proper ARIA labels
- Keyboard navigation support
- Focus management
- Screen reader friendly
- High contrast support