# Implementation Plan

- [x] 1. Set up chat activity route structure

  - Create the chat page component at `/learn/[unitId]/lesson/[lessonId]/chat`
  - Implement basic route handling and parameter extraction
  - Add proper TypeScript interfaces for route parameters
  - _Requirements: 1.1, 1.2_

- [ ] 2. Enhance activity navigation with chat tab

  - [x] 2.1 Update LessonDictationView activity switcher

    - Modify the activity switcher in `LessonDictationView.tsx` to include "Chat" tab
    - Add navigation logic to chat route with proper state preservation
    - Implement subscription tier-based tab visibility (disabled for non-pro users)
    - _Requirements: 1.2, 1.3, 1.4, 4.4_

  - [x] 2.2 Update LessonPracticeView activity switcher

    - Modify the activity switcher in `LessonPracticeView.tsx` to include "Chat" tab
    - Ensure consistent styling and behavior across all activity views
    - Add proper accessibility attributes for disabled states
    - _Requirements: 1.2, 1.3, 1.4, 4.4_

- [ ] 3. Create subscription tier validation utilities

  - [x] 3.1 Implement client-side subscription checking

    - Create utility functions to check user subscription tier
    - Add hook for accessing current user's subscription status
    - Implement tier-based feature access logic
    - _Requirements: 4.1, 4.2, 4.3_

  - [x] 3.2 Create server-side subscription middleware

    - Implement API middleware to validate subscription tier access
    - Add proper error responses for unauthorized access attempts
    - Create reusable validation functions for different endpoints
    - _Requirements: 4.1, 4.2, 4.3, 7.5_

- [ ] 4. Implement chat API routes

  - [x] 4.1 Create lesson chat prompts endpoint

    - Implement `GET /api/lessons/[lessonId]/chat-prompts` route
    - Query conversation starters from database with proper language filtering
    - Add authentication and subscription tier validation
    - _Requirements: 2.1, 6.1, 7.1_

  - [x] 4.2 Create start conversation endpoint

    - Implement `POST /api/lessons/[lessonId]/chat/conversations` route
    - Handle conversation creation in `lesson_chat_conversations` table
    - Generate initial AI greeting message using Gemini 2.0
    - Return conversation ID and initial message
    - _Requirements: 2.2, 2.3, 6.1, 7.2_

  - [x] 4.3 Create get messages endpoint

    - Implement `GET /api/chat/conversations/[conversationId]/messages` route
    - Query conversation history from `conversation_messages` table
    - Add proper message ordering and pagination support
    - _Requirements: 2.4, 6.2, 7.3_

  - [x] 4.4 Create send message endpoint

    - Implement `POST /api/chat/conversations/[conversationId]/messages` route
    - Handle text message processing
    - Generate AI responses using Gemini 2.0 streaming
    - Store messages in database with proper relationships
    - _Requirements: 2.5, 6.2, 7.4_

- [ ] 5. Integrate Gemini 2.0 streaming services

  - [x] 5.1 Set up Gemini 2.0 client configuration

    - Configure Gemini 2.0 API client with proper authentication
    - Add environment variables for API keys and endpoints
    - Implement error handling and retry logic
    - _Requirements: 2.6_

  - [x] 5.2 Implement conversational AI text generation

    - Create service functions for generating AI responses
    - Include lesson context and conversation history in prompts
    - Implement streaming response handling
    - Add proper error handling and fallback mechanisms
    - _Requirements: 2.5, 2.6_

  - [x] 5.3 Implement Gemini 2.0 text-to-speech

    - Replace ElevenLabs integration with Gemini 2.0 TTS
    - Create audio generation service functions
    - Implement audio streaming and playback capabilities
    - Add voice configuration and quality settings
    - _Requirements: 2.6_

- [ ] 6. Create core chat components

  - [x] 6.1 Build LessonChatView main component

    - Create the main chat activity container component
    - Implement conversation initialization and state management
    - Add loading states and error handling
    - Integrate with existing lesson data hooks
    - _Requirements: 1.1, 2.2, 2.3, 2.4_

  - [x] 6.2 Create MessageBubble component

    - Build individual message display component
    - Implement different styling for user vs AI messages
    - Add audio playback controls for AI messages
    - Add timestamp and message status indicators
    - _Requirements: 2.5, 3.4_

  - [x] 6.3 Build ChatInputControls component

    - Create text input interface for chat messages
    - Implement message sending with visual feedback
    - Add typing indicators and loading states
    - Include proper form validation and error handling
    - _Requirements: 3.1, 3.5_

  - [x] 6.4 Create ConversationStarters component

    - Build component to display available conversation prompts
    - Implement prompt selection and conversation initiation
    - Add visual indicators for addressed prompts
    - _Requirements: 2.1, 6.3_

- [ ] 7. Implement text input handling

  - [ ] 7.1 Create chat message input validation

    - Implement text input validation and sanitization
    - Add message length limits and content filtering
    - Create proper error handling for invalid inputs
    - _Requirements: 3.1, 3.5_

  - [ ] 7.2 Add message formatting and processing
    - Implement text formatting and emoji support
    - Add message preprocessing before sending to AI
    - Handle special characters and multilingual text
    - _Requirements: 3.1, 3.5_

- [ ] 8. Update lesson completion logic

  - [ ] 8.1 Modify lesson completion checking

    - Update existing completion logic to consider subscription tiers
    - Implement tier-specific activity requirements
    - Add chat activity completion tracking
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [ ] 8.2 Update progress tracking system
    - Modify user progress updates to include chat activity
    - Add points awarding for chat participation
    - Update lesson completion status based on tier requirements
    - _Requirements: 5.5, 6.3_

- [ ] 9. Implement database integration

  - [ ] 9.1 Create conversation management functions

    - Implement functions to create and manage conversations
    - Add conversation status tracking and updates
    - Handle conversation completion logic
    - _Requirements: 6.1, 6.5_

  - [ ] 9.2 Implement message storage and retrieval

    - Create functions to store chat messages with proper relationships
    - Add message ordering and pagination logic
    - Implement basic message metadata storage
    - _Requirements: 6.2, 6.5_

  - [ ] 9.3 Update prompt status tracking
    - Implement conversation prompt status management
    - Track which prompts have been addressed
    - Update completion timestamps appropriately
    - _Requirements: 6.3, 6.5_

- [ ] 10. Add error handling and validation

  - [ ] 10.1 Implement comprehensive error handling

    - Add error boundaries for chat components
    - Implement graceful degradation for API failures
    - Add user-friendly error messages and recovery options
    - _Requirements: 2.5, 3.5_

  - [ ] 10.2 Add input validation and sanitization
    - Implement proper validation for all chat text inputs
    - Add sanitization for user messages and text data
    - Validate conversation and message parameters
    - _Requirements: 7.5_

- [ ] 11. Create chat-specific hooks and utilities

  - [ ] 11.1 Build conversation management hooks

    - Create hooks for conversation initialization and management
    - Implement message history loading and caching
    - Add real-time message updates
    - _Requirements: 2.2, 2.3, 2.4_

  - [ ] 11.2 Create audio playback utilities
    - Implement audio playback controls for AI messages
    - Add audio caching and preloading capabilities
    - Create audio visualization and progress indicators
    - _Requirements: 2.6_

- [ ] 12. Implement responsive design and accessibility

  - [ ] 12.1 Ensure mobile responsiveness

    - Optimize chat interface for mobile devices
    - Implement touch-friendly controls and interactions
    - Add proper viewport handling for different screen sizes
    - _Requirements: 1.1, 1.2_

  - [ ] 12.2 Add accessibility features
    - Implement proper ARIA labels and roles
    - Add keyboard navigation support
    - Ensure screen reader compatibility
    - Add high contrast and reduced motion support
    - _Requirements: 1.1, 1.2_

- [ ] 13. Add comprehensive testing

  - [ ] 13.1 Write unit tests for components

    - Test all chat components with various props and states
    - Mock external dependencies and API calls
    - Test error handling and edge cases
    - _Requirements: All requirements_

  - [ ] 13.2 Write integration tests for API routes

    - Test all chat API endpoints with proper authentication
    - Test subscription tier validation
    - Test database operations and error scenarios
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [ ] 13.3 Add end-to-end tests
    - Test complete chat flow from initialization to completion
    - Test cross-activity navigation and state preservation
    - Test subscription tier restrictions and upgrade flows
    - _Requirements: All requirements_

- [ ] 14. Final integration and polish

  - [ ] 14.1 Integrate all components into lesson flow

    - Ensure seamless integration with existing dictation and practice activities
    - Test complete lesson flow with all three activities
    - Verify proper state management across activity switches
    - _Requirements: 1.5, 5.1, 5.2, 5.3_

  - [ ] 14.2 Performance optimization and cleanup
    - Optimize component rendering and re-renders
    - Implement proper cleanup for audio resources
    - Add loading optimizations and caching strategies
    - Remove any temporary code and add proper documentation
    - _Requirements: All requirements_
