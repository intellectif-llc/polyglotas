# Pronunciation Feature Migration Plan

## 1. Overview

This document outlines the plan to migrate the pronunciation learning feature from the `sample-project` into the new multilingual Next.js application. The migration will involve adapting the backend logic to Next.js API routes, updating frontend components to TypeScript and Tailwind CSS, integrating Supabase for authentication, and aligning all functionalities with the new multilingual database schema.

## 2. Analysis of the `sample-project`

### Backend (`sample-project/backend`)

- **Framework:** Serverless with Node.js.
- **Authentication:** AWS Cognito.
- **Database:** Supabase (but with a different schema than the new project).
- **Key Dependencies:** `@aws-sdk/client-cognito-identity-provider`, `@supabase/supabase-js`, `axios`, `elevenlabs`, `@google/generative-ai`, `microsoft-cognitiveservices-speech-sdk`.
- **Core Functionalities (Endpoints from `serverless.yml`):**
  - **Units & Lessons:**
    - `GET /pronunciation/units`: Fetches all pronunciation units.
    - `GET /pronunciation/units/{unitId}/lessons`: Fetches lessons for a specific unit.
    - `GET /pronunciation/lessons/{lessonId}`: Fetches details for a specific lesson.
  - **User Progress & Stats:**
    - `GET /profile/me/pronunciation-stats`: Fetches user stats (streak, points).
    - `GET /pronunciation/continue`: Gets the user's next practice location.
    - `GET /pronunciation/practice/words`: Fetches words that need practice.
    - `POST /pronunciation/practice/words/review`: Marks a practice word as reviewed.
  - **Speech Assessment:**
    - `GET /pronunciation/speech-token`: Gets an Azure Speech SDK token.
    - `POST /pronunciation/attempt`: Saves a speech attempt.
    - `GET /pronunciation/student/{studentId}/lesson/{lessonId}/phrase/{phraseId}/last-attempt`: Gets the last speech attempt for a phrase.
  - **Chat:**
    - `GET /pronunciation/lesson/{lessonId}/chat-prompts`: Fetches chat prompts for a lesson.
    - `POST /pronunciation/lesson/{lessonId}/chat/conversation`: Starts or gets a chat conversation.
    - `GET /pronunciation/lesson/{lessonId}/chat/conversation/{conversationId}/messages`: Gets messages for a conversation.
    - `POST /pronunciation/lesson/{lessonId}/chat/conversation/{conversationId}/message`: Posts a message to a conversation.
  - **Utilities:**
    - `POST /pronunciation/phrases/{phraseId}/translate`: Translates a phrase.
    - `POST /pronunciation/generate/{phraseId}`: Generates audio for a phrase.
    - `POST /pronunciation/chat/stream-audio`: Streams AI chat audio.
    - `POST /pronunciation/lookup/translate-text`: Translates text on demand.

### Frontend (`sample-project/frontend`)

- **Framework:** React with Vite.
- **Routing:** `react-router-dom`.
- **State Management:** React Query for server state.
- **UI:** A mix of custom components, Tailwind CSS, and other libraries like `recharts` and `framer-motion`.
- **Key Dependencies:** `@tanstack/react-query`, `axios`, `microsoft-cognitiveservices-speech-sdk`, `react-router-dom`, `lucide-react`.
- **Entry Point:** `PronunciationPage.jsx`, which sets up the nested routing for units, lessons, practice, and chat views.

## 3. Migration Strategy

The migration will be performed in phases, starting with setting up the necessary backend infrastructure (API routes) and then porting over the frontend components and logic.

### Phase 1: Backend & API Routes

1.  **Environment Setup:**

    - Add all necessary environment variables from the `sample-project`'s `serverless.yml` to the Next.js project's `.env.local` file. This includes keys for Supabase, Azure Speech, ElevenLabs, etc.

2.  **API Route Creation:**

    - For each endpoint in `serverless.yml`, create a corresponding API route in the Next.js project under `src/app/api/`. For example:
      - `GET /pronunciation/units` -> `src/app/api/pronunciation/units/route.ts`
      - `GET /pronunciation/lessons/{lessonId}` -> `src/app/api/pronunciation/lessons/[lessonId]/route.ts`
    - All new API routes will use the Next.js App Router conventions.

3.  **Authentication:**

    - Implement middleware (`src/middleware.ts`) to protect the new API routes.
    - Use Supabase's server-side client (`@supabase/ssr`) to handle authentication and retrieve the user's session.
    - Replace all Cognito-related logic in the backend handlers with Supabase authentication checks.

4.  **Database Adaptation:**
    - Update all Supabase queries in the backend handlers to match the new multilingual schema in `database-schema.md`.
    - This will involve joining with translation tables (e.g., `unit_translations`, `lesson_translations`) based on a language code (which should be passed as a parameter or inferred from the user's profile).
    - Update table and column names where they differ (e.g., `student_id` to `profile_id`).

### Phase 2: Frontend Components & Hooks

1.  **Dependency Installation:**

    - Install all necessary frontend dependencies from the `sample-project`'s `package.json` into the Next.js project. Pay special attention to:
      - `@tanstack/react-query`
      - `microsoft-cognitiveservices-speech-sdk`
      - `axios`
      - `lucide-react`
      - `framer-motion`
      - `recharts`

2.  **Component Migration:**

    - Copy the React components from `sample-project/frontend/pronunciation/components` to `src/components/pronunciation` in the Next.js project.
    - Convert the components from JSX to TSX, adding TypeScript types for props and state.
    - Update styling to use Tailwind CSS utility classes where appropriate, removing any `styled-components` or other styling libraries if not used in the new project.

3.  **Routing:**

    - Re-create the nested routing from `PronunciationPage.jsx` within the Next.js App Router. The main page will be at `src/app/learn/pronunciation/page.tsx`.
    - Use nested layouts and pages to handle the different views (units, lessons, practice, chat). For example:
      - `src/app/learn/pronunciation/page.tsx` (displays the list of units)
      - `src/app/learn/pronunciation/unit/[unitId]/page.tsx` (displays lessons for a unit)
      - `src/app/learn/pronunciation/lesson/[lessonId]/page.tsx` (the practice view)
      - `src/app/learn/pronunciation/lesson/[lessonId]/chat/[conversationId]/page.tsx` (the chat view)

4.  **Hooks & Data Fetching:**

    - Copy the custom hooks from `sample-project/frontend/pronunciation/hooks` to `src/hooks/pronunciation`.
    - Update the `pronunciationApi.js` service to point to the new Next.js API routes (e.g., `/api/pronunciation/units`).
    - Ensure that `usePronunciationData.js` and other hooks correctly use the updated API functions.

5.  **Authentication:**
    - Integrate Supabase client-side authentication.
    - Replace any remaining Cognito logic with Supabase equivalents (e.g., in `useSpeechRecognition.js` for getting a token).

### Phase 3: Final Integration & Testing

1.  **End-to-End Testing:**

    - Thoroughly test each feature, from the UI to the API route and the database.
    - Pay special attention to the multilingual aspects, ensuring that content is correctly fetched and displayed based on the user's selected language.

2.  **Refinement:**
    - Refine the UI/UX to match the new project's design system.
    - Optimize performance, especially for data fetching and real-time speech recognition.

## 4. Detailed Task Breakdown

- [ ] **Setup:** Install dependencies and configure environment variables.
- [ ] **Backend:**
  - [ ] Create API routes for all `pronunciation` endpoints.
  - [ ] Implement Supabase authentication middleware.
  - [ ] Adapt all database queries to the new schema.
- [ ] **Frontend:**
  - [ ] Migrate all components from `sample-project/frontend/pronunciation/components` to the new project.
  - [ ] Convert components to TSX and apply Tailwind CSS.
  - [ ] Set up the routing structure under `/learn/pronunciation`.
  - [ ] Migrate custom hooks and update API service calls.
  - [ ] Integrate Supabase auth on the client side.
- [ ] **Testing:** Perform end-to-end testing of all features.
- [ ] **Refinement:** Polish the UI and optimize performance.
