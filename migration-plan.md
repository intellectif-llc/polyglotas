# Migration Plan: Pronunciation Module

The goal is to integrate the sophisticated pronunciation and chat features into the new Next.js application, with `/learn` as the authenticated user's main dashboard.

---

## Part 1: Backend - API Route Implementation

I will create Next.js API routes within `src/app/api/pronunciation/` to handle all the backend logic previously managed by the Serverless framework. This approach centralizes the backend within the Next.js app.

### Key Actions:

- **Service Logic Migration**: The core business logic from `old-project/backend-files/pronunciation/services/` (containing interactions with Supabase, Azure, Gemini, and ElevenLabs) will be moved into `src/lib/` to be reused by the new API routes.

- **Authentication**: All new API routes will be protected, using the existing Supabase Auth setup to identify the logged-in user.

- **API Route Mapping**: The endpoints defined in `serverless.yml` will be mapped as follows:

| Feature Group         | Old Endpoint (`/pronunciation/...`)                               | New API Route (`/api/pronunciation/...`)                                                    |
| :-------------------- | :---------------------------------------------------------------- | :------------------------------------------------------------------------------------------ |
| **Core Content**      | `/units`, `/units/{unitId}/lessons`, `/lessons/{lessonId}`        | `/units`, `/units/{unitId}/lessons`, `/lessons/{lessonId}`                                  |
| **User State**        | `/stats`, `/continue`, `/practice/words`                          | `/stats`, `/continue`, `/practice-words`                                                    |
| **Speech & Practice** | `/speech-token`, `/attempt`, `/phrases/{phraseId}/last-attempt`   | `/speech-token`, `/attempt`, `/lessons/{lessonId}/phrases/{phraseId}/last-attempt`          |
| **AI Chat**           | `/lesson/{id}/chat/... (multiple)`                                | `/lessons/{lessonId}/chat/... (multiple sub-routes)`                                        |
| **Utilities**         | `/phrases/{id}/translate`, `/generate/{id}`, `/chat/stream-audio` | `/phrases/{phraseId}/translate`, `/phrases/{phraseId}/generate-audio`, `/chat/stream-audio` |

---

## Part 2: Frontend - Pages, Components, and Routing

I will structure the user-facing portion of the module using the Next.js App Router, ensuring a logical and scalable component architecture.

### Page Structure & Routing:

- `/learn`: This will be the main dashboard page. It will render a client component (`PronunciationDashboardClient`) responsible for displaying user stats, a "Continue" button, and the level/unit/lesson navigation carousels.
- `/learn/unit/[unitId]`: A page to display the list of all lessons within a specific unit when a user wants to see more than the carousel shows.
- `/learn/lesson/[lessonId]`: This will be the default phrase practice view for a lesson, where users record themselves and receive detailed feedback.
- `/learn/lesson/[lessonId]/chat/[conversationId]`: This page will house the AI chat practice, allowing for a full-screen, immersive conversation experience.

### Component Migration:

- All UI components from `old-project/frontend-files/pronunciation/components/` will be migrated and converted to TypeScript (`.tsx`) inside `src/components/pronunciation/`. They will be organized into subdirectories (`dashboard`, `practice`, `chat`, `feedback`, `shared`) to maintain clarity.
- Styling will be adapted to use **Tailwind CSS**, consistent with the new project's standards.

### Hooks and Services:

- Custom React hooks (`usePronunciationData`, `useSpeechRecognition`, etc.) will be moved to `src/hooks/pronunciation/`.
- The API fetching logic in `pronunciationApi.js` will be migrated to `src/lib/pronunciation/api.ts`, with all functions updated to call the new Next.js API routes.
