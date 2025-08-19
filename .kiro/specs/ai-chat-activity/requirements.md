# Requirements Document

## Introduction

This feature implements an AI-powered conversational chat activity for language learning lessons. The chat functionality will be the third activity type alongside existing dictation and pronunciation practice activities. Users will engage in conversations with an AI assistant using Gemini Flash 2.0 streaming model for both text generation and text-to-speech capabilities. The chat activity includes conversation prompts, speech recognition for user input, AI feedback on pronunciation, and subscription tier-based access restrictions.

## Requirements

### Requirement 1: Chat Activity Route and Navigation

**User Story:** As a language learner, I want to access the chat activity through a dedicated route and navigate between all three activity types (dictation, practice, chat) using tabs, so that I can complete all lesson activities in a structured manner.

#### Acceptance Criteria

1. WHEN a user navigates to `/learn/[unitId]/lesson/[lessonId]/chat` THEN the system SHALL display the chat activity interface
2. WHEN a user is on any lesson activity page THEN the system SHALL display three tabs: "Dictation", "Practice", and "Chat"
3. WHEN a user clicks on the "Chat" tab THEN the system SHALL navigate to the chat activity route
4. WHEN a user is on the chat activity THEN the "Chat" tab SHALL be visually highlighted as active
5. WHEN a user switches between activity tabs THEN the system SHALL preserve the current lesson and unit context

### Requirement 2: AI Conversation Management

**User Story:** As a language learner, I want to engage in AI-powered conversations with contextual prompts related to my lesson content, so that I can practice conversational skills in a structured learning environment.

#### Acceptance Criteria

1. WHEN a user enters the chat activity THEN the system SHALL fetch conversation prompts specific to the current lesson and target language
2. WHEN no existing conversation exists for the lesson THEN the system SHALL create a new conversation and display an initial AI greeting message
3. WHEN an existing conversation exists THEN the system SHALL load and display the conversation history
4. WHEN all conversation prompts have been addressed THEN the system SHALL mark the conversation as complete
5. WHEN the AI generates responses THEN the system SHALL use Gemini 2.0 streaming model for text generation
6. WHEN the AI provides audio responses THEN the system SHALL use Gemini 2.0's text-to-speech capabilities instead of ElevenLabs

### Requirement 3: Text Input and Message Handling

**User Story:** As a language learner, I want to respond to AI prompts using text input, so that I can practice conversational skills through written communication.

#### Acceptance Criteria

1. WHEN a user wants to respond to an AI message THEN the system SHALL provide a text input interface
2. WHEN a user types a message THEN the system SHALL validate and sanitize the input
3. WHEN a user submits a message THEN the system SHALL send it to the AI and display the response
4. WHEN message processing fails THEN the system SHALL provide clear error feedback and retry options
5. WHEN messages are sent THEN the system SHALL provide visual feedback and loading states

### Requirement 4: Subscription Tier Access Control

**User Story:** As a platform administrator, I want to restrict chat activity access based on user subscription tiers, so that premium features are properly gated and monetized.

#### Acceptance Criteria

1. WHEN a free tier user attempts to access chat activity THEN the system SHALL display an upgrade prompt and prevent access
2. WHEN a starter tier user attempts to access chat activity THEN the system SHALL display an upgrade prompt and prevent access
3. WHEN a pro tier user accesses chat activity THEN the system SHALL allow full access to all chat features
4. WHEN a non-pro user views lesson activities THEN the "Chat" tab SHALL be visually disabled with upgrade messaging
5. WHEN checking lesson completion THEN the system SHALL only require completed activities based on user's subscription tier

### Requirement 5: Lesson Completion Logic

**User Story:** As a language learner, I want lesson completion to be determined by my subscription tier's available activities, so that I can progress through lessons appropriately based on my access level.

#### Acceptance Criteria

1. WHEN a free tier user completes dictation activity THEN the system SHALL mark the lesson as complete
2. WHEN a starter tier user completes both dictation and practice activities THEN the system SHALL mark the lesson as complete
3. WHEN a pro tier user completes dictation, practice, and chat activities THEN the system SHALL mark the lesson as complete
4. WHEN a user has not completed all required activities for their tier THEN the lesson SHALL remain incomplete
5. WHEN lesson completion status changes THEN the system SHALL update user progress and award appropriate points

### Requirement 6: Database Integration

**User Story:** As a system administrator, I want the chat functionality to properly integrate with the existing database schema, so that conversation data is stored consistently and efficiently.

#### Acceptance Criteria

1. WHEN a new conversation starts THEN the system SHALL create records in lesson_chat_conversations table
2. WHEN messages are exchanged THEN the system SHALL store them in conversation_messages table with proper sender_type
3. WHEN conversation prompts are addressed THEN the system SHALL update conversation_prompt_status table
4. WHEN conversations are completed THEN the system SHALL update all_prompts_addressed_at timestamp
5. WHEN message data is stored THEN the system SHALL maintain referential integrity across all chat-related tables

### Requirement 7: API Route Implementation

**User Story:** As a developer, I want Next.js API routes that handle chat functionality, so that the frontend can communicate with the backend services efficiently.

#### Acceptance Criteria

1. WHEN frontend requests lesson chat prompts THEN the system SHALL provide GET `/api/lessons/[lessonId]/chat-prompts` endpoint
2. WHEN frontend starts a conversation THEN the system SHALL provide POST `/api/lessons/[lessonId]/chat/conversations` endpoint
3. WHEN frontend requests conversation messages THEN the system SHALL provide GET `/api/chat/conversations/[conversationId]/messages` endpoint
4. WHEN frontend sends a message THEN the system SHALL provide POST `/api/chat/conversations/[conversationId]/messages` endpoint
5. WHEN API routes are called THEN the system SHALL authenticate users and validate subscription tier access
