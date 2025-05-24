# Application Requirements: Polyglotas - Multilingual Language Learning SaaS

## 1. Overview 🎯

The primary goal is to build a **Polyglotas** web application, a Software as a Service (SaaS) platform offering tiered subscription plans for accessing comprehensive language learning features. Key functionalities include user authentication, multilingual content delivery (lessons, phrases), interactive pronunciation practice with AI-driven assessment, AI-powered chat exercises, and subscription management.

The application will utilize **Supabase** for backend services (database, authentication) and **Stripe** for payment processing and subscription management. The frontend will be built with **Next.js**.

The core free offering will grant users access to the **first lesson of a language course** to experience the platform. Paid subscriptions will unlock full access to all lessons and premium features.

## 2. Core Features ✨

### 2.1. User Authentication & Management (Supabase Auth)

- **Social Sign-Up/Sign-In:**
  - Users must be able to sign up and sign in using social identity providers (e.g., Google, GitHub, Facebook). This will be the primary authentication method.
  - Authentication will be centralized using Supabase Auth. Google sign in has been set up on google console and the authorized URIs that has been set are: http://localhost:3000/auth/callback and also the one provided by supabase.
- **Account Management Page (`/account`):**
  - Authenticated users must have a dedicated account page.
  - **Profile Information:** Users should be able to view and potentially update their full name. Email updates are managed via Supabase Auth.
  - **Language Preferences:** Users can set their native language and current target learning language(s).
  - **Subscription Management (via Stripe Customer Portal):**
    - View current subscription plan (e.g., Standard, Premium), status, and billing cycle.
    - Ability to upgrade, downgrade, or cancel their subscription.
    - View billing history.
- **Session Management:** Secure and persistent user sessions using Supabase Auth helpers.

### 2.2. Subscription Plans & Access Control

- **Dynamic Pricing Page (`/pricing`):**
  - Display available subscription plans (e.g., Free, Standard, Premium) with their respective features and pricing (monthly/yearly).
  - Products and prices are managed in Stripe and synced to the Supabase database.
  - Allow users to toggle between monthly and yearly billing intervals if available.
- **Tiered Access:**
  - **Free Tier:** Grants access to the first lesson of any language course.
  - **Paid Tiers (e.g., Standard, Premium):** Grant access to all lessons and potentially other premium features. Feature differentiation will be based on the `subscription_tier` in the user's profile.
- **Stripe Integration for Subscriptions:**
  - **Stripe Checkout:** Redirect users to Stripe Checkout to subscribe to a paid plan. Handle success/failure scenarios.
  - **Stripe Customer Portal:** Integrate for subscription self-management.
  - **Stripe Webhooks:** Implement a secure webhook endpoint to sync data (products, prices, subscriptions, customers, invoices) between Stripe and Supabase. Key events include:
    - `product.created`, `product.updated`
    - `price.created`, `price.updated`
    - `customer.created`, `customer.updated`
    - `checkout.session.completed`
    - `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`
    - `invoice.paid`, `invoice.payment_failed`
    - Webhook signatures must be verified.

### 2.3. Language Learning Core Functionality (Polyglotas)

- **Multilingual Content Delivery:**
  - All learning content (units, lessons, phrases, chat prompts) will be available in multiple languages.
  - Users will interact with content primarily in their `current_target_language_code`.
  - Translations of phrases into the user's `native_language_code` (or other languages) will be available.
- **Learning Dashboard (`/learn` or `/dashboard`):**
  - Display user stats (e.g., points, current streak).
  - "Continue learning" feature to resume from the last point.
  - Browse language courses, units, and lessons.
  - Visual progress tracking (units, lessons, phrases).
- **Lesson & Phrase Practice (`/learn/lesson/[lessonId]`):**
  - Display lesson phrases in the target language, with optional translations.
  - Play pre-recorded audio for phrases (target language).
  - **Pronunciation Practice:**
    - Users record their pronunciation of phrases.
    - Integrate with **Azure Speech Services** for speech-to-text and detailed pronunciation assessment (accuracy, fluency, completeness, prosody, word/phoneme level feedback).
    - Display visual feedback on pronunciation.
  - **Unscramble the Phrase:**
    - Users will be presented with the words of a phrase in a scrambled order.
    - They must drag and drop or select the words to arrange them into the correct sequence.
    - This activity reinforces sentence structure and word order.
  - **Dictation:**
    - Users listen to the pre-recorded audio of a phrase.
    - They must type the phrase as they hear it.
    - The system compares their typed input against the original phrase text for accuracy.
    - This activity helps with listening comprehension and spelling in the target language.
  - These three activities (Pronunciation, Unscramble the Phrase, Dictation) form the core practice for each phrase within a lesson before proceeding to the lesson's chat section.
  - Other exercise types can be incorporated as supplementary activities if needed in the future.
- **Targeted Word Practice (`/learn/practice-words`):**
  - Users can review and practice words/phrases where they previously had pronunciation difficulties.
- **Interactive Chat (`/learn/lesson/[lessonId]/chat`):**
  - Lesson-specific chat scenarios with an AI.
  - Users interact (text or voice) in their target language.
  - AI responses generated by an **LLM (e.g., Gemini)**.
  - AI voice responses generated using **ElevenLabs Text-to-Speech**.
  - Conversation history is saved.
- **On-Demand Translation (Utility):**
  - Provide a utility to translate ad-hoc text snippets using **Azure Translate** for learning support.

## 3. Data Model (Supabase PostgreSQL) 🐘

The database will store user data, subscription information, and all multilingual learning content. Row Level Security (RLS) policies must be implemented for data security.

Key tables include:

- **`languages`**: Stores supported language codes and names.
- **`persons`**: Basic individual information.
- **`student_profiles`**: Central user table. Includes `person_id`, `native_language_code`, `current_target_language_code`, `subscription_tier` (ENUM: 'free', 'standard', 'premium', etc.), `stripe_customer_id`, `default_payment_method_details` (JSONB for display), `billing_address` (JSONB), points, streak.
  - A trigger (`handle_new_user`) will create a profile from `auth.users`.
- **`student_target_languages`**: Links students to all languages they are learning.
- **Stripe-related Tables (synced via webhooks):**
  - **`products`**: Defines service tiers (e.g., Standard, Premium) and links to `stripe_product_id`.
  - **`prices`**: Defines specific prices for products (monthly/yearly, currency) and links to `stripe_price_id`.
  - **`student_subscriptions`**: Tracks individual student subscriptions to specific `prices`, including `stripe_subscription_id`, status, current period, etc.
  - **`invoices`**: (Recommended) Stores key invoice details from Stripe for billing history.
- **Content Structure Tables (Language-Agnostic Cores):**
  - **`units`**: (level, unit_order)
  - **`lessons`**: (unit_id, lesson_order, grammar_focus, total_phrases)
  - **`learning_outcomes`**: (lesson_id)
  - **`vocabulary_phrases`**: (lesson_id, phrase_order, concept_description)
  - **`conversation_starters`**: (lesson_id)
- **Content Translations Tables (Language-Specific Content):**
  - **`unit_translations`**: (unit_id, language_code, unit_title, description)
  - **`lesson_translations`**: (lesson_id, language_code, lesson_title)
  - **`learning_outcome_translations`**: (outcome_id, language_code, outcome_text)
  - **`phrase_versions`**: (phrase_id, language_code, phrase_text, audio_url)
  - **`conversation_starter_translations`**: (starter_id, language_code, starter_text)
- **User Progress & Interaction Tables (with language context):**
  - **`speech_attempts`**: (student_id, lesson_id, phrase_id, `language_code`, attempt_number, reference_text, recognized_text, scores, phonetic_data).
  - **`user_word_pronunciation`**: (student_id, word_text, `language_code`, scores, stats).
  - **`user_lesson_progress`**: (student_id, lesson_id, status, phrases_completed).
  - **`user_phrase_progress`**: (student*id, lesson_id, phrase_id, status, best_scores). Consider adding `language_code` if progress on the \_same phrase concept* needs to be distinct per language.
  - **`user_points_log`**: (student_id, points, reason, related_ids, `related_word_language_code`).
- **Chat Functionality Tables (with language context):**
  - **`lesson_chat_conversations`**: (student_id, lesson_id, `language_code`).
  - **`conversation_messages`**: (conversation_id, sender_type, message_order, message_text, `message_language_code`, feedback_text, `feedback_language_code`, azure_pronunciation_data for user voice input).
  - **`conversation_prompt_status`**: (conversation_id, prompt_id).

## 4. API Endpoints (Next.js API Routes) ↔️

Backend logic will be implemented as Next.js API Routes, secured using Supabase Auth and RLS.

- **Authentication:** Handled by Supabase Auth client libraries and redirect flows.
- **Stripe Webhooks:** A single endpoint (`/api/stripe/webhooks`) to securely receive and process all Stripe events.
- **Content Delivery:**
  - `GET /api/languages`: List available languages.
  - `GET /api/content/units?level=A1&lang={target_lang}`: Fetch units for a level in the target language.
  - `GET /api/content/units/[unitId]/lessons?lang={target_lang}`: Fetch lessons for a unit.
  - `GET /api/content/lessons/[lessonId]?lang={target_lang}&native_lang={native_lang}`: Fetch lesson details, phrases (in target lang), and translations (in native lang).
- **Learning & Practice:**
  - `GET /api/speech/token`: Generate Azure Speech Services client token.
  - `POST /api/speech/attempt`: Save speech attempt (audio upload to Supabase Storage, assessment via Azure). Requires `phrase_id`, `language_code`.
  - `POST /api/learn/phrases/{phraseVersionId}/activity-result`: Submit the result of a phrase-based learning activity (Unscramble or Dictation).
    - Request body would include `activityType` ("unscramble" | "dictation"), `isSuccessful` (boolean), `attemptData` (object with activity-specific details like typed text or chosen word order), and optional `score`.
    - This endpoint would update the `user_phrase_progress` table and potentially log detailed attempts to tables like `unscramble_attempts` or contribute to `user_word_spelling` data.
  - `GET /api/users/me/practice-words?lang={target_lang}`: Fetch user's practice words in target language.
- **User Profile & Progress:**
  - `GET /api/users/me/profile`: Fetch current user's profile including language preferences, subscription status, points, streak.
  - `PUT /api/users/me/profile`: Update user profile (name, language preferences).
  - `GET /api/users/me/progress/lessons`: Fetch overall lesson progress.
  - `GET /api/users/me/continue-learning`: Get data for "continue learning" feature.
- **Chat Activity:**
  - `GET /api/lessons/[lessonId]/chat-prompts?lang={target_lang}`: Fetch chat prompts for a lesson in the target language.
  - `POST /api/lessons/[lessonId]/chat/conversations?lang={target_lang}`: Start or get existing chat conversation for a lesson in a specific language.
  - `GET /api/chat/conversations/[conversationId]/messages`: Get messages for a conversation.
  - `POST /api/chat/conversations/[conversationId]/messages`: Post user message (text/audio) or get AI response. Handles LLM interaction and ElevenLabs TTS.
- **Utilities:**
  - `POST /api/translate`: Translate ad-hoc text using Azure Translate (request includes text and target language).
  - Internal endpoint/mechanism for batch-generating phrase audio using ElevenLabs and uploading to Supabase Storage.

## 4.1. Conceptual TypeScript Interfaces

This section outlines conceptual TypeScript interfaces that can be used on the frontend to model data structures related to learning content and user progress. These are illustrative and may evolve during development.

**1. `PhraseVersion`**

Represents a specific language version of a phrase concept.

```typescript
interface PhraseVersion {
  id: number; // Corresponds to phrase_versions.id (the specific language version)
  phraseConceptId: number; // Corresponds to vocabulary_phrases.id (the language-agnostic concept)
  languageCode: string; // The language code of this version (e.g., 'en-US', 'es-ES')
  text: string; // The phrase text in this language
  audioUrl?: string; // URL to the audio for this phrase version
  // concept_description?: string; // Optional: from vocabulary_phrases.concept_description if needed
}
```

**2. `LessonContent`**

Represents the content of a lesson a user will interact with.

```typescript
interface LessonContent {
  id: number; // lessons.lesson_id
  title: string; // lesson_translations.lesson_title (in user's target language)
  phrases: PhraseVersion[]; // Array of all phrase versions for this lesson, in order
  // Other lesson metadata like grammar_focus, etc., can be added here
}
```

**3. `UserSinglePhraseProgress`**

Reflects the structure of a row in the `user_phrase_progress` table, detailing the student's progress on a single phrase concept _in a specific language_ across all its activities.

```typescript
interface UserSinglePhraseProgress {
  phraseProgressId?: number; // Optional: from user_phrase_progress.phrase_progress_id
  studentId: number; // student_profiles.student_id
  lessonId: number; // lessons.lesson_id
  phraseConceptId: number; // vocabulary_phrases.id
  languageCode: string; // The language of this specific phrase progress

  // Unscramble Step
  unscrambleCompleted: boolean;
  unscrambleAttempts: number;
  unscrambleLastAttemptAt?: string | Date | null; // ISO date string or Date object

  // Pronunciation Step (maps to speech_attempts summary or best scores in user_phrase_progress)
  pronunciationCompleted: boolean;
  pronunciationAttempts: number;
  pronunciationLastAttemptAt?: string | Date | null;
  bestAccuracyScore?: number | null;
  bestFluencyScore?: number | null;
  bestCompletenessScore?: number | null;
  bestPronunciationScore?: number | null; // Overall pronunciation score
  bestProsodyScore?: number | null;

  // Dictation Step
  dictationCompleted: boolean;
  dictationAttempts: number;
  dictationLastAttemptAt?: string | Date | null;
  bestDictationScore?: number | null; // e.g., a similarity score or simple correct/incorrect

  // Overall status for this phrase in this language
  isCompleted: boolean; // True if all required activities for this phrase are completed
  lastProgressAt?: string | Date | null; // Timestamp of the last update
}
```

**4. `LessonPlayerState`**

This is the state managed by the main `LessonPlayer.tsx` client component (conceptual).

```typescript
type ActivityType = "pronunciation" | "unscramble" | "dictation";

interface LessonPlayerState {
  lessonContent: LessonContent | null;
  currentPhraseIndex: number; // Index in lessonContent.phrases
  currentActivityForPhrase: ActivityType | null; // Which activity is active for the currentPhraseIndex

  // Stores the progress for each phrase in the current lesson.
  // Keyed by phraseConceptId, as progress is per concept and language.
  // The language is implicitly the user's current_target_language for this lesson instance.
  userProgressForLesson: Record<number, UserSinglePhraseProgress>;

  isChatActive: boolean; // True if the lesson has moved to the chat phase

  isLoading: boolean; // For fetching lesson data or submitting progress
  error: string | null; // For displaying errors

  // Temporary state for the current active activity (could be more detailed)
  // For example, for dictation, what the user has typed so far.
  // This would be cleared or reset when moving between activities/phrases.
  currentActivityAttemptData?: {
    type: ActivityType;
    userInput?: string; // For dictation
    userArrangement?: string[]; // For unscramble (e.g., array of word IDs/texts in chosen order)
    // Other relevant temporary data
  };
}
```

**5. `ActivityResultPayload` (Conceptual - for API payloads)**

Conceptual payload for submitting activity results.

```typescript
interface ActivityResultPayload {
  activityType: ActivityType;
  phraseConceptId: number; // or phraseVersionId, depending on API design
  languageCode: string;

  isSuccessful: boolean; // Overall success for this attempt
  score?: number | null; // Score for this specific attempt, if applicable

  // Activity-specific detailed data for logging
  attemptDetails: {
    // For unscramble
    actionsTaken?: any[]; // e.g., sequence of moves [{ wordId: 'abc', fromIndex: 2, toIndex: 0 }, ...]
    finalArrangement?: string[]; // User's final word order
    timeTakenMs?: number;

    // For dictation
    typedText?: string;
    similarityToOriginal?: number; // if calculated client-side for immediate feedback or server-side

    // For pronunciation (if this endpoint were also used, though you have /api/speech/attempt)
    // recognizedText?: string;
    // audioBlob?: Blob; // if sending audio
    // detailedScores?: any; // from Azure
  };
}
```

## 5. Third-Party Integrations 🛠️

- **Supabase:** Database (PostgreSQL), Authentication, Storage (for audio files), Edge Functions (potentially for webhook processing or secure backend logic).
- **Stripe:** Payments (Checkout), Subscription Management (Customer Portal, Subscriptions API), Webhooks.
- **Azure Speech Services:** Speech-to-text, pronunciation assessment.
- **Azure Translate:** Text translation.
- **ElevenLabs:** Text-to-speech for pre-recorded phrases and AI chat responses.
- **LLM (e.g., Google Gemini API):** For AI-powered chat conversations.

## 6. Technology Stack 💻

- **Framework:** Next.js (latest stable version, App Router)
- **Language:** TypeScript
- **Backend & Database:** Supabase
- **Styling:** Tailwind CSS
- **State Management (Frontend):** React Query (TanStack Query) for server state; Zustand or React Context for minimal global client state.
- **Payment Processing:** Stripe
- **Speech & Translation AI:** Azure AI Services
- **Voice Generation AI:** ElevenLabs
- **Conversational AI:** LLM (e.g., Gemini)

## 7. Non-Functional Requirements ⚙️

- **Security:** Secure environment variables, webhook signature verification, strict RLS, input validation, protection against common web vulnerabilities.
- **User Experience:** Clean, modern, responsive UI. Clear feedback (loading, success, error states). Intuitive navigation.
- **Performance:** Fast page loads, responsive interactions, optimized database queries.
- **Scalability:** Design to handle a growing user base and content library.
- **Maintainability:** Clean, well-documented, modular code.

## 8. Development Practices & Deployment 🚀

- **Version Control:** Git (e.g., GitHub/GitLab) with a clear branching strategy.
- **Code Quality:** ESLint, Prettier, TypeScript strict mode.
- **Testing:** Unit and integration tests (e.g., Vitest/Jest, React Testing Library). Consider E2E tests (e.g., Playwright) for critical flows.
- **Local Development Environment:**
  - Utilize Docker for running a local Supabase instance (via Supabase CLI `supabase start`). This provides an isolated and consistent development database. (Alternatively, Supabase Cloud can be used during development if Docker is not preferred, but local instance via Docker is recommended for isolation.)
  - Stripe CLI for testing webhooks locally.
- **Deployment:** Vercel is recommended for Next.js applications.
- **Environment Variables:** All API keys, Supabase URLs/keys, Stripe keys, webhook secrets must be managed via environment variables.

## 9. UI Flow Highlights 🌊

- **Public:** Pricing page. Sign-in prompts if trying to subscribe without being logged in.
- **Auth:** Social sign-in/sign-up flow.
- **Authenticated:**
  - Dashboard: Overview, course/unit/lesson navigation, progress.
  - Lesson View: Phrase display, audio, recording, feedback.
  - Chat View: Interactive conversation with AI.
  - Account Page: Profile, language preferences, subscription management (redirect to Stripe Customer Portal).
- **Navigation:** Consistent navbar with relevant links based on auth state.

## 10. Databas schema

-- ENUM for Levels (Provided by you)
CREATE TYPE level_enum AS ENUM ('A1', 'A2', 'B1', 'B2', 'C1');

-- ENUM for Message Sender (Provided by you)
CREATE TYPE sender_type_enum AS ENUM ('user', 'ai');

CREATE TYPE subscription_tier_enum AS ENUM ('free', 'starter','pro');

-- NEW ENUM for Price Types (used in `prices` table)
CREATE TYPE price_type_enum AS ENUM ('recurring', 'one_time');

-- NEW ENUM for Price Billing Intervals (used in `prices` table)
CREATE TYPE price_billing_interval_enum AS ENUM ('day', 'week', 'month', 'year');

-- NEW ENUM for Subscription Statuses (used in `student_subscriptions` table)
CREATE TYPE subscription_status_enum AS ENUM (
'trialing',
'active',
'past_due',
'unpaid',
'canceled',
'incomplete',
'incomplete_expired',
'paused'
);

-- NEW ENUM for Invoice Statuses (used in `invoices` table)
CREATE TYPE subscription_status_enum AS ENUM (
'trialing',
'active',
'past_due',
'unpaid',
'canceled',
'incomplete',
'incomplete_expired',
'paused'
);

CREATE TYPE account_status_enum AS ENUM (
'pending_verification', -- Account created, but awaiting initial verification (e.g., email confirmation)
'active', -- Account is active and in good standing; user can access the platform based on their subscription tier
'suspended', -- Account access has been temporarily or permanently revoked by an administrator
'deactivated' -- Account has been deactivated, either by the user or due to other reasons (e.g., end of a deletion grace period)
);

-- Table to store supported languages
CREATE TABLE languages (
language_code CHAR(5) PRIMARY KEY, -- BCP 47 language codes (e.g., 'en', 'es', 'en-US', 'fr-CA')
language_name VARCHAR(100) NOT NULL UNIQUE,
created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE languages IS 'Stores all supported languages for content and UI.';
COMMENT ON COLUMN languages.language_code IS 'BCP 47 language code, e.g., ''en'', ''es'', ''en-US''.';
COMMENT ON COLUMN languages.language_name IS 'Human-readable name of the language.';

Supabase auth.users Table Definition
Note: The auth.users table is automatically created and managed by Supabase within the auth schema. Developers should not attempt to modify its structure directly. This documentation is for understanding its fields and how they are used by the Supabase authentication system, enabling better integration with your application's public schema tables.

Here are the columns typically found in the auth.users table, based on the provided image and common Supabase configurations:

instance_id (uuid): This identifier is for Supabase's internal use, often linking the user record to the specific Supabase project instance. It's generally not directly used in application logic.
id (uuid): This is the Primary Key for the table and the unique identifier for each user. This UUID is crucial for linking your public schema tables (like public.profiles) to an authenticated user.
aud (character varying): Stands for "Audience." This field typically stores the audience claim for JWTs (JSON Web Tokens) issued for the user, usually 'authenticated'.
role (character varying): Defines the user's role within the Supabase authentication system (e.g., 'authenticated', 'anon'). This is vital for setting up Row Level Security (RLS) policies.
email (character varying): The user's primary email address. It's used for login, password recovery, email confirmations, and other communications.
encrypted_password (character varying): Stores the user's password in a securely hashed format. You will never access or use the plain text password; Supabase handles password verification.
email_confirmed_at (timestamp with time zone): A timestamp indicating when the user confirmed their email address by clicking a confirmation link. If NULL, the email is not yet confirmed.
invited_at (timestamp with time zone): If the user was invited to the platform (e.g., by an administrator), this timestamp records when the invitation was created/sent.
confirmation_token (character varying): A unique token sent to the user's email address to verify their email. This token is short-lived.
confirmation_sent_at (timestamp with time zone): A timestamp indicating when the most recent email confirmation token was sent to the user.
recovery_token (character varying): A unique token sent to the user's email (or phone) to allow them to reset their password.
recovery_sent_at (timestamp with time zone): A timestamp indicating when the most recent password recovery token was sent.
email_change_token_new (character varying): A token used during the process of changing a user's email address. This token is typically sent to the new email address for verification.
email_change (character varying): Stores the new email address that a user has requested to change to, while it's pending confirmation.
email_change_sent_at (timestamp with time zone): A timestamp indicating when the confirmation token for an email address change was sent.
last_sign_in_at (timestamp with time zone): A timestamp recording the last time the user successfully signed into the application.
raw_app_meta_data (jsonb): A JSONB field for storing application-specific metadata about the user that is typically managed by the application administrators or backend processes and not directly by the user (e.g., internal flags, group memberships).
raw_user_meta_data (jsonb): A JSONB field for storing user-specific metadata that can often be set or updated by the user themselves or through your application logic (e.g., display name, preferences, avatar URL if not in a dedicated profile table).
is_super_admin (boolean): A flag (true/false) that indicates if the user has super administrator privileges within the Supabase instance. This is typically for Supabase's internal management and rarely used directly by application developers.
created_at (timestamp with time zone): A timestamp indicating when the user's record was first created in the auth.users table.
updated_at (timestamp with time zone): A timestamp indicating when the user's record in auth.users was last modified.
phone (text): The user's phone number, which can be used for phone-based login (e.g., with OTP) or account recovery.
phone_confirmed_at (timestamp with time zone): A timestamp indicating when the user confirmed their phone number, typically by entering an OTP.
phone_change (text): Stores the new phone number that a user has requested to change to, while it's pending confirmation.
phone_change_token (character varying): A unique token sent to the user's new phone number to verify the change.
phone_change_sent_at (timestamp with time zone): A timestamp indicating when the OTP or verification token for a phone number change was sent.
confirmed_at (timestamp with time zone): A general confirmation timestamp. This often reflects the earliest confirmation time if multiple methods are used (e.g., email or phone), or it might be an alias for email_confirmed_at in simpler setups.
email_change_token_current (character varying): In some email change flows, this token might be used to verify ownership of the current email address before proceeding with the change, or it could be another name for email_change_token_new depending on Supabase version/flow. It's related to the security of the email change process.
email_change_confirm_status (smallint): An integer field indicating the status of an email change request (e.g., 0 for pending, 1 for confirmed). The specific integer values and their meanings are defined by Supabase's internal logic.
banned_until (timestamp with time zone): If the user account is banned, this timestamp indicates when the ban expires. If NULL, the user is not currently banned or the ban is indefinite.
reauthentication_token (character varying): A token used to confirm a user's identity again (re-authenticate) before performing sensitive operations, even if they have an active session.
reauthentication_sent_at (timestamp with time zone): A timestamp indicating when a reauthentication request or token was sent.
is_sso_user (boolean): A flag (true/false) that is set to true if the user account was created or linked via a Single Sign-On (SSO) provider. As noted in the image's description, "The user may have duplicate emails" in the system if they also have a non-SSO account with the same email.
deleted_at (timestamp with time zone): If Supabase is configured for or uses soft deletes for users, this timestamp would indicate when the user account was marked as deleted.
is_anonymous (boolean): A flag (true/false) indicating whether the user is an anonymous user. Anonymous users are typically temporary accounts with limited privileges, often used before full sign-up.

-- Profiles Table

CREATE TABLE public.profiles (
-- This ID is the same as the user's ID in auth.users, serving as both PK and FK
id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
first_name VARCHAR(255) NULL, -- Made nullable; can be populated from raw_user_meta_data or post-signup
last_name VARCHAR(255) NULL, -- Made nullable
-- Timestamps for the profile record itself
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.profiles IS 'Stores application-specific common profile information for users, extending auth.users. Email and primary auth phone are managed in auth.users.';

-- Student Profiles Table (Updated)
CREATE TABLE public.student_profiles (
profile_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
discount NUMERIC(5,2) NULL,
status public.account_status_enum NOT NULL,
current_streak_days INTEGER NOT NULL DEFAULT 0,
last_streak_date DATE NULL,
subscription_tier public.subscription_tier_enum NOT NULL DEFAULT 'free',
points INTEGER NOT NULL DEFAULT 0 CHECK (points >= 0),
native_language_code CHAR(5) REFERENCES public.languages(language_code) NULL,
current_target_language_code CHAR(5) REFERENCES public.languages(language_code) NULL,

    -- Stripe-related columns integrated directly
    stripe_customer_id VARCHAR(255) UNIQUE NULL,
    default_payment_method_details JSONB NULL,
    billing_address JSONB NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()

);

-- Table Comment
COMMENT ON TABLE public.student_profiles IS 'Stores student-specific academic progress, subscription details, and payment information, extending a user''s general profile from public.profiles.';

-- Column Comments (Revised and Expanded)
COMMENT ON COLUMN public.student_profiles.profile_id IS 'The unique identifier for this student profile, referencing the primary key (id) of the corresponding user in public.profiles.';
COMMENT ON COLUMN public.student_profiles.discount IS 'Any applicable discount percentage for the student''s subscription (e.g., 10.00 for 10% discount). NULL if no discount applies.';
COMMENT ON COLUMN public.student_profiles.status IS 'Overall status of the student profile on the platform (e.g., active, suspended, pending_verification, deactivated). Uses the public.account_status_enum type.';
COMMENT ON COLUMN public.student_profiles.current_streak_days IS 'Number of consecutive days the student has maintained an activity streak (e.g., lesson completion, practice).';
COMMENT ON COLUMN public.student_profiles.last_streak_date IS 'The most recent date on which the student successfully contributed to their current activity streak.';
COMMENT ON COLUMN public.student_profiles.subscription_tier IS 'The current subscription tier of the student (e.g., free, standard, pro). Uses the public.subscription_tier_enum type.';
COMMENT ON COLUMN public.student_profiles.points IS 'Gamification points or rewards earned by the student within the platform.';
COMMENT ON COLUMN public.student_profiles.native_language_code IS 'The student''s declared native language, referencing language_code in the public.languages table.';
COMMENT ON COLUMN public.student_profiles.current_target_language_code IS 'The language the student is currently actively learning or using as a target, referencing language_code in the public.languages table.';
COMMENT ON COLUMN public.student_profiles.stripe_customer_id IS 'The Stripe Customer ID associated with this student. Typically created when the student initiates their first payment or subscription with Stripe.';
COMMENT ON COLUMN public.student_profiles.default_payment_method_details IS 'Non-sensitive, displayable details of the student''s default payment method, usually sourced from Stripe (e.g., card brand, last four digits, expiry). For display purposes only.';
COMMENT ON COLUMN public.student_profiles.billing_address IS 'The billing address associated with the student''s payment methods, often collected by Stripe and can be stored here for reference, display, or local analytics.';
COMMENT ON COLUMN public.student_profiles.created_at IS 'Timestamp indicating when this student profile record was created.';
COMMENT ON COLUMN public.student_profiles.updated_at IS 'Timestamp indicating when this student profile record was last updated.';

-- Student Target Languages Table
CREATE TABLE public.student_target_languages (
profile_id UUID NOT NULL REFERENCES public.student_profiles(profile_id) ON DELETE CASCADE,
language_code CHAR(5) NOT NULL REFERENCES public.languages(language_code) ON DELETE CASCADE,
added_at TIMESTAMPTZ DEFAULT NOW(),
PRIMARY KEY (profile_id, language_code)
);

COMMENT ON TABLE public.student_target_languages IS 'Stores all languages a student intends to learn or has learned.';

-- Units Table
CREATE TABLE units (
unit_id SERIAL PRIMARY KEY,
level level_enum NOT NULL,
unit_order INT NOT NULL,
created_at TIMESTAMPTZ DEFAULT NOW(),
updated_at TIMESTAMPTZ DEFAULT NOW(),
UNIQUE (level, unit_order)
);

COMMENT ON TABLE units IS 'Groups lessons by level and defines their order. Title and description are in unit_translations.';

-- Lessons Table
CREATE TABLE lessons (
lesson_id SERIAL PRIMARY KEY,
unit_id INT NOT NULL REFERENCES units(unit_id) ON DELETE CASCADE,
lesson_order INT NOT NULL,
grammar_focus TEXT[] NOT NULL,
total_phrases INT NOT NULL DEFAULT 0,
created_at TIMESTAMPTZ DEFAULT NOW(),
updated_at TIMESTAMPTZ DEFAULT NOW(),
UNIQUE (unit_id, lesson_order)
);

COMMENT ON TABLE lessons IS 'Main lessons table. Title is in lesson_translations.';
COMMENT ON COLUMN lessons.grammar_focus IS 'Array of grammar topic keys. Actual display text might be handled by i18n on client or a dedicated translation table if complex.';

-- Learning Outcomes Table
CREATE TABLE learning_outcomes (
outcome_id SERIAL PRIMARY KEY,
lesson_id INT NOT NULL REFERENCES lessons(lesson_id) ON DELETE CASCADE,
created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE learning_outcomes IS 'Defines learning outcomes for lessons. Actual outcome text is in learning_outcome_translations.';

-- Vocabulary Phrases Table (Represents phrase concept)
CREATE TABLE vocabulary_phrases (
id SERIAL PRIMARY KEY,
lesson_id INT NOT NULL REFERENCES lessons(lesson_id) ON DELETE CASCADE,
phrase_order INT NOT NULL,
concept_description TEXT NULL,
created_at TIMESTAMPTZ DEFAULT NOW(),
updated_at TIMESTAMPTZ DEFAULT NOW(),
UNIQUE (lesson_id, phrase_order)
);

COMMENT ON TABLE vocabulary_phrases IS 'Stores language-agnostic phrase concepts, ordered within a lesson. Actual text/audio are in phrase_versions.';
COMMENT ON COLUMN vocabulary_phrases.concept_description IS 'Optional language-neutral description of the phrase''s meaning or concept.';

-- Conversation Starters Table
CREATE TABLE conversation_starters (
id SERIAL PRIMARY KEY,
lesson_id INT NOT NULL REFERENCES lessons(lesson_id) ON DELETE CASCADE,
created_at TIMESTAMPTZ DEFAULT NOW(),
updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE conversation_starters IS 'Stores conversation starter concepts for lessons. Actual text is in conversation_starter_translations.';

-- Unit Translations Table
CREATE TABLE unit_translations (
unit_translation_id SERIAL PRIMARY KEY,
unit_id INT NOT NULL REFERENCES units(unit_id) ON DELETE CASCADE,
language_code CHAR(5) NOT NULL REFERENCES languages(language_code) ON DELETE CASCADE,
unit_title VARCHAR(255) NOT NULL,
description TEXT,
created_at TIMESTAMPTZ DEFAULT NOW(),
updated_at TIMESTAMPTZ DEFAULT NOW(),
UNIQUE (unit_id, language_code)
);

COMMENT ON TABLE unit_translations IS 'Stores language-specific titles and descriptions for units.';

-- Lesson Translations Table
CREATE TABLE lesson_translations (
lesson_translation_id SERIAL PRIMARY KEY,
lesson_id INT NOT NULL REFERENCES lessons(lesson_id) ON DELETE CASCADE,
language_code CHAR(5) NOT NULL REFERENCES languages(language_code) ON DELETE CASCADE,
lesson_title VARCHAR(255) NOT NULL,
created_at TIMESTAMPTZ DEFAULT NOW(),
updated_at TIMESTAMPTZ DEFAULT NOW(),
UNIQUE (lesson_id, language_code)
);

COMMENT ON TABLE lesson_translations IS 'Stores language-specific titles for lessons.';

-- Learning Outcome Translations Table
CREATE TABLE learning_outcome_translations (
outcome_translation_id SERIAL PRIMARY KEY,
outcome_id INT NOT NULL REFERENCES learning_outcomes(outcome_id) ON DELETE CASCADE,
language_code CHAR(5) NOT NULL REFERENCES languages(language_code) ON DELETE CASCADE,
outcome_text TEXT NOT NULL CHECK (outcome_text <> ''),
created_at TIMESTAMPTZ DEFAULT NOW(),
updated_at TIMESTAMPTZ DEFAULT NOW(),
UNIQUE (outcome_id, language_code)
);

COMMENT ON TABLE learning_outcome_translations IS 'Stores language-specific text for learning outcomes.';

-- Phrase Versions Table (Translations for Vocabulary Phrases)
CREATE TABLE phrase_versions (
phrase_version_id SERIAL PRIMARY KEY,
phrase_id INT NOT NULL REFERENCES vocabulary_phrases(id) ON DELETE CASCADE,
language_code CHAR(5) NOT NULL REFERENCES languages(language_code) ON DELETE CASCADE,
phrase_text TEXT NOT NULL,
audio_url VARCHAR(255),
created_at TIMESTAMPTZ DEFAULT NOW(),
updated_at TIMESTAMPTZ DEFAULT NOW(),
UNIQUE (phrase_id, language_code)
);

COMMENT ON TABLE phrase_versions IS 'Stores language-specific text and audio for vocabulary phrases.';

-- Conversation Starter Translations Table
CREATE TABLE conversation_starter_translations (
starter_translation_id SERIAL PRIMARY KEY,
starter_id INT NOT NULL REFERENCES conversation_starters(id) ON DELETE CASCADE,
language_code CHAR(5) NOT NULL REFERENCES languages(language_code) ON DELETE CASCADE,
starter_text TEXT NOT NULL,
created_at TIMESTAMPTZ DEFAULT NOW(),
updated_at TIMESTAMPTZ DEFAULT NOW(),
UNIQUE (starter_id, language_code)
);

COMMENT ON TABLE conversation_starter_translations IS 'Stores language-specific text for conversation starters.';

-- Speech Attempts Table
CREATE TABLE speech_attempts (
attempt_id SERIAL PRIMARY KEY,
profile_id UUID NOT NULL REFERENCES public.student_profiles(profile_id) ON DELETE CASCADE,
lesson_id INT NOT NULL REFERENCES lessons(lesson_id) ON DELETE CASCADE,
phrase_id INT NOT NULL REFERENCES vocabulary_phrases(id) ON DELETE CASCADE,
language_code CHAR(5) NOT NULL REFERENCES languages(language_code),
attempt_number INT NOT NULL,
reference_text TEXT NOT NULL,
recognized_text TEXT NULL,
created_at TIMESTAMPTZ DEFAULT NOW(),
accuracy_score NUMERIC(5,2) CHECK (accuracy_score BETWEEN 0 AND 100),
fluency_score NUMERIC(5,2) CHECK (fluency_score BETWEEN 0 AND 100),
completeness_score NUMERIC(5,2) CHECK (completeness_score BETWEEN 0 AND 100),
pronunciation_score NUMERIC(5,2) CHECK (pronunciation_score BETWEEN 0 AND 100),
prosody_score NUMERIC(5,2) CHECK (prosody_score BETWEEN 0 AND 100),
phonetic_data JSONB,
CONSTRAINT speech_attempts_profile_lesson_phrase_lang_attempt_key UNIQUE (profile_id, lesson_id, phrase_id, language_code, attempt_number)
);

COMMENT ON TABLE speech_attempts IS 'Stores records of student speech attempts for specific phrases and languages.';
COMMENT ON COLUMN speech_attempts.profile_id IS 'References the student profile ID.';
COMMENT ON COLUMN speech_attempts.phrase_id IS 'References the language-agnostic phrase concept in vocabulary_phrases.';

-- User Word Pronunciation Table
CREATE TABLE user_word_pronunciation (
id SERIAL PRIMARY KEY,
profile_id UUID NOT NULL REFERENCES public.student_profiles(profile_id) ON DELETE CASCADE,
word_text VARCHAR(100) NOT NULL,
language_code CHAR(5) NOT NULL REFERENCES languages(language_code),
total_attempts INT DEFAULT 0,
error_count INT DEFAULT 0,
sum_accuracy_score NUMERIC DEFAULT 0,
average_accuracy_score NUMERIC(5, 2) DEFAULT 0,
last_accuracy_score NUMERIC(5,2),
last_error_type VARCHAR(50),
last_attempt_at TIMESTAMPTZ,
needs_practice BOOLEAN DEFAULT FALSE,
last_reviewed_at TIMESTAMPTZ,
created_at TIMESTAMPTZ DEFAULT NOW(),
updated_at TIMESTAMPTZ DEFAULT NOW(),
UNIQUE (profile_id, word_text, language_code)
);

COMMENT ON TABLE user_word_pronunciation IS 'Tracks student''s pronunciation performance for individual words in specific languages.';
COMMENT ON COLUMN user_word_pronunciation.profile_id IS 'References the student profile ID.';
COMMENT ON COLUMN user_word_pronunciation.language_code IS 'The language of the word_text being tracked.';

-- User Lesson Progress Table
CREATE TABLE user_lesson_progress (
progress_id SERIAL PRIMARY KEY,
profile_id UUID NOT NULL REFERENCES public.student_profiles(profile_id) ON DELETE CASCADE,
lesson_id INT NOT NULL REFERENCES lessons(lesson_id) ON DELETE CASCADE,
started_at TIMESTAMPTZ DEFAULT NOW(),
completed_at TIMESTAMPTZ,
chat_activity_engaged_at TIMESTAMPTZ NULL,
is_completed BOOLEAN DEFAULT FALSE,
phrases_completed INT DEFAULT 0,
last_progress_at TIMESTAMPTZ DEFAULT NOW(),
UNIQUE (profile_id, lesson_id)
);

COMMENT ON TABLE user_lesson_progress IS 'Tracks student progress at the lesson level.';
COMMENT ON COLUMN user_lesson_progress.profile_id IS 'References the student profile ID.';
COMMENT ON COLUMN user_lesson_progress.chat_activity_engaged_at IS 'Timestamp when the student first sent a message in the end-of-lesson chat activity for this lesson for any language.';

-- User Phrase Progress Table
CREATE TABLE user_phrase_progress (
phrase_progress_id SERIAL PRIMARY KEY,
profile_id UUID NOT NULL REFERENCES public.student_profiles(profile_id) ON DELETE CASCADE,
lesson_id INT NOT NULL REFERENCES lessons(lesson_id) ON DELETE CASCADE,
phrase_id INT NOT NULL REFERENCES vocabulary_phrases(id) ON DELETE CASCADE,
language_code CHAR(5) NOT NULL REFERENCES languages(language_code), -- Explicitly added as per discussion below

    -- Unscramble Step (Non-Scored)
    unscramble_completed BOOLEAN DEFAULT FALSE,
    unscramble_attempts INT DEFAULT 0,
    unscramble_last_attempt_at TIMESTAMPTZ,

    -- Pronunciation Step (Incorporates fields from your original table)
    pronunciation_completed BOOLEAN DEFAULT FALSE, -- Renamed from your original 'is_completed'
    pronunciation_attempts INT DEFAULT 0,
    pronunciation_last_attempt_at TIMESTAMPTZ,
    best_accuracy_score NUMERIC(5,2) CHECK (best_accuracy_score IS NULL OR best_accuracy_score BETWEEN 0 AND 100),
    best_fluency_score NUMERIC(5,2) CHECK (best_fluency_score IS NULL OR best_fluency_score BETWEEN 0 AND 100),
    best_completeness_score NUMERIC(5,2) CHECK (best_completeness_score IS NULL OR best_completeness_score BETWEEN 0 AND 100),
    best_pronunciation_score NUMERIC(5,2) CHECK (best_pronunciation_score IS NULL OR best_pronunciation_score BETWEEN 0 AND 100),
    best_prosody_score NUMERIC(5,2) CHECK (best_prosody_score IS NULL OR best_prosody_score BETWEEN 0 AND 100),

    -- Dictation Step
    dictation_completed BOOLEAN DEFAULT FALSE,
    dictation_attempts INT DEFAULT 0,
    dictation_last_attempt_at TIMESTAMPTZ,
    best_dictation_score NUMERIC(5,2) CHECK (best_dictation_score IS NULL OR best_dictation_score BETWEEN 0 AND 100),

    -- Overall status for this phrase in this specific language, considering all its applicable activity types
    is_completed BOOLEAN DEFAULT FALSE,
    last_progress_at TIMESTAMPTZ DEFAULT NOW(), -- Tracks the latest interaction with any part of this phrase progress

    UNIQUE (profile_id, lesson_id, phrase_id, language_code) -- Updated UNIQUE constraint

);

COMMENT ON TABLE user_phrase_progress IS 'Tracks student summary progress across different activity types for a single phrase, specific to a language.';
COMMENT ON COLUMN user_phrase_progress.profile_id IS 'References the student profile ID.';
COMMENT ON COLUMN user_phrase_progress.language_code IS 'The language in which the student is progressing with this specific phrase concept.';

CREATE TABLE user_word_spelling (
id SERIAL PRIMARY KEY,
profile_id UUID NOT NULL REFERENCES public.student_profiles(profile_id) ON DELETE CASCADE,
word_text VARCHAR(100) NOT NULL,
language_code CHAR(5) NOT NULL REFERENCES languages(language_code), -- Added: Language of the word
total_dictation_occurrences INT DEFAULT 0,
dictation_error_count INT DEFAULT 0,
sum_word_similarity_score NUMERIC DEFAULT 0,
average_word_similarity_score NUMERIC(5,2) DEFAULT 0,
last_word_similarity_score NUMERIC(5,2) CHECK (last_word_similarity_score IS NULL OR last_word_similarity_score BETWEEN 0 AND 100),
last_dictation_attempt_at TIMESTAMPTZ,
needs_spelling_practice BOOLEAN DEFAULT FALSE,
last_reviewed_at TIMESTAMPTZ,
created_at TIMESTAMPTZ DEFAULT NOW(),
updated_at TIMESTAMPTZ DEFAULT NOW(), -- Added for consistency
UNIQUE (profile_id, word_text, language_code) -- Added language_code
);

COMMENT ON TABLE user_word_spelling IS 'Tracks student spelling performance for individual words in specific languages, primarily from dictation activities.';
COMMENT ON COLUMN user_word_spelling.profile_id IS 'References the student profile ID.';
COMMENT ON COLUMN user_word_spelling.language_code IS 'The language of the word_text being tracked for spelling.';

CREATE TABLE dictation_attempts (
attempt_id SERIAL PRIMARY KEY,
profile_id UUID NOT NULL REFERENCES student_profiles(profile_id) ON DELETE CASCADE,
lesson_id INT NOT NULL REFERENCES lessons(lesson_id) ON DELETE CASCADE,
phrase_id INT NOT NULL REFERENCES vocabulary_phrases(id) ON DELETE CASCADE,
language_code CHAR(5) NOT NULL REFERENCES languages(language_code), -- Added: Language of the dictation
attempt_number INT NOT NULL,
reference_text TEXT NOT NULL,
written_text TEXT NOT NULL,
overall_similarity_score NUMERIC(5,2) CHECK (overall_similarity_score IS NULL OR overall_similarity_score BETWEEN 0 AND 100),
word_level_feedback JSONB NULL,
created_at TIMESTAMPTZ DEFAULT NOW(),
UNIQUE (profile_id, lesson_id, phrase_id, language_code, attempt_number) -- Added language_code
);

COMMENT ON TABLE dictation_attempts IS 'Logs detailed information for each dictation attempt by a student.';
COMMENT ON COLUMN dictation_attempts.language_code IS 'The language in which the dictation was performed.';
COMMENT ON COLUMN dictation_attempts.reference_text IS 'Snapshot of the target phrase text in the specific language at the time of the attempt.';
COMMENT ON COLUMN dictation_attempts.word_level_feedback IS 'Array of objects detailing word-level comparison, e.g., [{reference_word: "text", written_word: "txet", similarity_score: 75.00, position_in_phrase: 0}, ...].';

-- User Points Log Table
CREATE TABLE user_points_log (
log_id SERIAL PRIMARY KEY,
profile_id UUID NOT NULL REFERENCES public.student_profiles(profile_id) ON DELETE CASCADE,
points_awarded INT NOT NULL,
reason_code VARCHAR(50) NOT NULL,
related_lesson_id INT NULL REFERENCES lessons(lesson_id),
related_phrase_id INT NULL REFERENCES vocabulary_phrases(id),
related_word_text VARCHAR(100) NULL,
related_word_language_code CHAR(5) NULL REFERENCES languages(language_code),
notes TEXT,
created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE user_points_log IS 'Logs points awarded or spent by students, with language context for word-related points.';
COMMENT ON COLUMN user_points_log.profile_id IS 'References the student profile ID.';
COMMENT ON COLUMN user_points_log.related_phrase_id IS 'References the language-agnostic phrase concept, if applicable.';

-- Lesson Chat Conversations Table
CREATE TABLE lesson_chat_conversations (
conversation_id BIGSERIAL PRIMARY KEY,
profile_id UUID NOT NULL REFERENCES public.student_profiles(profile_id) ON DELETE CASCADE,
lesson_id INT NOT NULL REFERENCES lessons(lesson_id) ON DELETE CASCADE,
language_code CHAR(5) NOT NULL REFERENCES languages(language_code),
created_at TIMESTAMPTZ DEFAULT NOW(),
all_prompts_addressed_at TIMESTAMPTZ NULL,
last_message_at TIMESTAMPTZ NULL
);

CREATE INDEX idx_lesson_chat_conversations_profile_lesson_lang ON lesson_chat_conversations (profile_id, lesson_id, language_code);
COMMENT ON TABLE lesson_chat_conversations IS 'Tracks each distinct conversation attempt for a lesson, specific to a language.';
COMMENT ON COLUMN lesson_chat_conversations.profile_id IS 'References the student profile ID.';
COMMENT ON COLUMN lesson_chat_conversations.language_code IS 'The language in which this conversation took place.';

-- Conversation Messages Table
CREATE TABLE conversation_messages (
message_id BIGSERIAL PRIMARY KEY,
conversation_id BIGINT NOT NULL REFERENCES lesson_chat_conversations(conversation_id) ON DELETE CASCADE,
sender_type sender_type_enum NOT NULL,
message_order INT NOT NULL,
message_text TEXT NOT NULL,
message_language_code CHAR(5) NOT NULL REFERENCES languages(language_code),
created_at TIMESTAMPTZ DEFAULT NOW(),
related_prompt_id INT NULL REFERENCES conversation_starters(id) ON DELETE SET NULL,
feedback_text TEXT NULL,
feedback_language_code CHAR(5) NULL REFERENCES languages(language_code),
azure_pronunciation_data JSONB NULL,
UNIQUE (conversation_id, message_order)
);

CREATE INDEX idx_conversation_messages_conversation ON conversation_messages (conversation_id);
CREATE INDEX idx_conversation_messages_prompt ON conversation_messages (related_prompt_id);
COMMENT ON TABLE conversation_messages IS 'Stores messages within a conversation, with language context for message and feedback.';
COMMENT ON COLUMN conversation_messages.message_language_code IS 'Language of the message_text (user utterance or AI response).';
COMMENT ON COLUMN conversation_messages.feedback_language_code IS 'Language of the feedback_text, if different from message_language_code.';
COMMENT ON COLUMN conversation_messages.related_prompt_id IS 'Links to the language-agnostic conversation starter concept.';

-- Conversation Prompt Status Table
CREATE TABLE conversation_prompt_status (
prompt_status_id BIGSERIAL PRIMARY KEY,
conversation_id BIGINT NOT NULL REFERENCES lesson_chat_conversations(conversation_id) ON DELETE CASCADE,
prompt_id INT NOT NULL REFERENCES conversation_starters(id) ON DELETE CASCADE,
first_addressed_message_id BIGINT NULL REFERENCES conversation_messages(message_id) ON DELETE SET NULL,
addressed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
UNIQUE (conversation_id, prompt_id)
);

CREATE INDEX idx_conversation_prompt_status_convo_prompt ON conversation_prompt_status (conversation_id, prompt_id);
COMMENT ON TABLE conversation_prompt_status IS 'Tracks addressed status of conversation starter concepts within a specific language-bound conversation attempt.';
COMMENT ON COLUMN conversation_prompt_status.prompt_id IS 'References the language-agnostic conversation starter concept.';

CREATE TABLE products (
id SERIAL PRIMARY KEY, -- Your internal ID for the product
stripe_product_id VARCHAR(255) UNIQUE NOT NULL, -- Stripe's Product ID (prod_xxxxxx)
active BOOLEAN DEFAULT TRUE,
name VARCHAR(255) NOT NULL, -- e.g., "Standard Tier", "Premium Tier"
description TEXT NULL,
tier_key subscription_tier_enum NULL, -- Optional: Maps this product to your internal tier ENUM
metadata JSONB NULL, -- Any additional custom data from Stripe or for your use
created_at TIMESTAMPTZ DEFAULT NOW(),
updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_products_stripe_product_id ON products(stripe_product_id);
CREATE INDEX idx_products_tier_key ON products(tier_key);

COMMENT ON TABLE products IS 'Represents the core subscription products/tiers offered (e.g., Standard, Premium).';
COMMENT ON COLUMN products.tier_key IS 'Optionally links this product to an internal subscription_tier_enum.';

CREATE TYPE price_type_enum AS ENUM ('recurring', 'one_time');
CREATE TYPE price_billing_interval_enum AS ENUM ('day', 'week', 'month', 'year');

CREATE TABLE prices (
id SERIAL PRIMARY KEY, -- Your internal ID for the price
stripe_price_id VARCHAR(255) UNIQUE NOT NULL, -- Stripe's Price ID (price_xxxxxx)
product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
active BOOLEAN DEFAULT TRUE,
unit_amount INT NULL, -- Amount in the smallest currency unit (e.g., cents for USD). NULL for metered/tiered pricing not defined here.
currency CHAR(3) NOT NULL,
type price_type_enum NOT NULL, -- 'recurring' or 'one_time'
billing_interval price_billing_interval_enum NULL, -- e.g., 'month', 'year'; NULL if type is 'one_time'
interval_count INT NULL, -- e.g., 1 for every month/year, 3 for every 3 months
description TEXT NULL, -- Optional description for this specific price
trial_period_days INT NULL, -- Only if you use Stripe-managed trial periods for this price
metadata JSONB NULL,
created_at TIMESTAMPTZ DEFAULT NOW(),
updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_prices_stripe_price_id ON prices(stripe_price_id);
CREATE INDEX idx_prices_product_id ON prices(product_id);

COMMENT ON TABLE prices IS 'Defines specific prices for products, including currency, amount, and billing interval.';
COMMENT ON COLUMN prices.unit_amount IS 'Price in the smallest currency unit (e.g., cents for USD).';
COMMENT ON COLUMN prices.trial_period_days IS 'Number of trial days offered by Stripe for this specific price, if applicable.';

-- subscription_status_enum was defined in the previous response, ensure it exists:
-- CREATE TYPE subscription_status_enum AS ENUM (
-- 'trialing', 'active', 'past_due', 'unpaid', 'canceled', 'incomplete', 'incomplete_expired', 'paused'
-- );

CREATE TABLE student_subscriptions (
id SERIAL PRIMARY KEY, -- Your internal subscription ID
profile_id UUID NOT NULL REFERENCES public.student_profiles(profile_id) ON DELETE CASCADE,
price_id INT NOT NULL REFERENCES prices(id), -- Link to the specific price they are subscribed to
stripe_subscription_id VARCHAR(255) UNIQUE NOT NULL,
status subscription_status_enum NOT NULL,
quantity INT DEFAULT 1,
current_period_start TIMESTAMPTZ NOT NULL,
current_period_end TIMESTAMPTZ NOT NULL,
cancel_at_period_end BOOLEAN DEFAULT FALSE,
canceled_at TIMESTAMPTZ NULL,
ended_at TIMESTAMPTZ NULL,
-- Stripe trial fields: only relevant if a specific subscription has a Stripe-managed trial
trial_start_at TIMESTAMPTZ NULL,
trial_end_at TIMESTAMPTZ NULL,
metadata JSONB NULL, -- For any extra data from Stripe's subscription object
stripe_created_at TIMESTAMPTZ NULL, -- Timestamp from Stripe for when the subscription was created
created_at TIMESTAMPTZ DEFAULT NOW(), -- Your record's creation timestamp
updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_student_subscriptions_profile_id ON student_subscriptions(profile_id);
CREATE INDEX idx_student_subscriptions_stripe_subscription_id ON student_subscriptions(stripe_subscription_id);
CREATE INDEX idx_student_subscriptions_status ON student_subscriptions(status);

COMMENT ON TABLE student_subscriptions IS 'Tracks individual student subscriptions to specific prices/plans.';
COMMENT ON COLUMN student_subscriptions.profile_id IS 'References the student profile ID.';
COMMENT ON COLUMN student_subscriptions.price_id IS 'The specific price (monthly/yearly/etc.) the student is subscribed to.';

CREATE TABLE invoices (
id SERIAL PRIMARY KEY, -- Your internal invoice ID
profile_id UUID NOT NULL REFERENCES public.student_profiles(profile_id) ON DELETE CASCADE,
stripe_invoice_id VARCHAR(255) UNIQUE NOT NULL,
stripe_subscription_id VARCHAR(255) NULL REFERENCES student_subscriptions(stripe_subscription_id), -- Link to subscription if applicable
stripe_customer_id VARCHAR(255) NULL, -- No direct FK to student_profiles.stripe_customer_id here, as it's more for informational/denormalized data from Stripe
status invoice_status_enum NOT NULL,
amount_due INT NOT NULL, -- In smallest currency unit (cents)
amount_paid INT NOT NULL,
amount_remaining INT NOT NULL,
currency CHAR(3) NOT NULL,
due_date TIMESTAMPTZ NULL,
paid_at TIMESTAMPTZ NULL,
invoice_pdf_url TEXT NULL, -- Link to download the PDF from Stripe
hosted_invoice_url TEXT NULL, -- Link for user to view invoice on Stripe
billing_reason TEXT NULL, -- e.g., 'subscription_create', 'subscription_cycle', 'manual'
metadata JSONB NULL,
issued_at TIMESTAMPTZ NULL, -- Timestamp from Stripe for when the invoice was created
created_at TIMESTAMPTZ DEFAULT NOW(),
updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_invoices_profile_id ON invoices(profile_id);
CREATE INDEX idx_invoices_stripe_invoice_id ON invoices(stripe_invoice_id);
CREATE INDEX idx_invoices_stripe_subscription_id ON invoices(stripe_subscription_id);

COMMENT ON TABLE invoices IS 'Stores key information about Stripe invoices for billing history and support.';
COMMENT ON COLUMN invoices.profile_id IS 'References the student profile ID this invoice is associated with.';
COMMENT ON COLUMN invoices.stripe_customer_id IS 'The Stripe Customer ID. This is stored for reference; primary link to student is via profile_id.';

## 11. Database functions

This section contains all the PL/pgSQL functions. Some of these are called directly by the application, while others are designed to be used by triggers.

---

-- FUNCTION: update_updated_at_column
-- Automatically sets the `updated_at` timestamp for a row.

---

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
NEW.updated_at = NOW();
RETURN NEW;
END;

$$
LANGUAGE plpgsql VOLATILE;

COMMENT ON FUNCTION update_updated_at_column() IS 'Trigger function to automatically update the updated_at timestamp column to the current time upon row modification.';

--------------------------------------------------------------------------------
-- FUNCTION: increment_points
-- Increments points for a student.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION increment_points(
    p_profile_id UUID,
    p_points_to_add INT
)
RETURNS INT AS
$$

DECLARE
v_new_point_total INT;
BEGIN
UPDATE student_profiles
SET points = points + p_points_to_add
WHERE profile_id = p_profile_id
RETURNING points INTO v_new_point_total;

    RETURN v_new_point_total;

END;

$$
LANGUAGE plpgsql VOLATILE SECURITY DEFINER;

COMMENT ON FUNCTION increment_points(UUID, INT) IS 'Increments the points for a given student and returns the new total. p_profile_id: UUID of the student profile. p_points_to_add: Number of points to add (can be negative to subtract). Consider RLS implications if SECURITY DEFINER is used.';

--------------------------------------------------------------------------------
-- FUNCTION: update_chat_engagement
-- Updates or inserts user_lesson_progress on first chat engagement for a lesson.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_chat_engagement(
    p_profile_id UUID,
    p_lesson_id INT
)
RETURNS VOID AS
$$

BEGIN
-- Attempt to update first
UPDATE user_lesson_progress
SET chat_activity_engaged_at = NOW(),
last_progress_at = NOW() -- Also update last_progress_at
WHERE profile_id = p_profile_id
AND lesson_id = p_lesson_id
AND chat_activity_engaged_at IS NULL;

    -- If no row was updated (either no record, or chat_activity_engaged_at was already set)
    -- and specifically if no record exists, then insert.
    IF NOT FOUND THEN
        INSERT INTO user_lesson_progress (
            profile_id,
            lesson_id,
            started_at,
            chat_activity_engaged_at,
            phrases_completed,
            is_completed,
            last_progress_at
        )
        SELECT
            p_profile_id,
            p_lesson_id,
            NOW(),
            NOW(),
            0,
            FALSE,
            NOW()
        WHERE NOT EXISTS ( -- Ensure no record exists before inserting
            SELECT 1 FROM user_lesson_progress
            WHERE profile_id = p_profile_id AND lesson_id = p_lesson_id
        );
    END IF;

END;

$$
LANGUAGE plpgsql VOLATILE SECURITY DEFINER;

COMMENT ON FUNCTION update_chat_engagement(UUID, INT) IS 'Sets the chat_activity_engaged_at timestamp for a student''s lesson progress. If no progress record exists, it creates one. p_profile_id: UUID of the student profile. p_lesson_id: ID of the lesson. Consider RLS implications if SECURITY DEFINER is used.';

--------------------------------------------------------------------------------
-- FUNCTION: update_lesson_phrase_count (Trigger Function)
-- Updates total_phrases in the lessons table.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_lesson_phrase_count()
RETURNS TRIGGER AS
$$

DECLARE
v*lesson_id_old INT;
v_lesson_id_new INT;
BEGIN
IF (TG_OP = 'DELETE') THEN
v_lesson_id_old := OLD.lesson_id;
IF v_lesson_id_old IS NOT NULL THEN
UPDATE lessons
SET total_phrases = (SELECT COUNT(*) FROM vocabulary*phrases WHERE lesson_id = v_lesson_id_old)
WHERE lesson_id = v_lesson_id_old;
END IF;
RETURN OLD;
ELSIF (TG_OP = 'INSERT') THEN
v_lesson_id_new := NEW.lesson_id;
UPDATE lessons
SET total_phrases = (SELECT COUNT(*) FROM vocabulary_phrases WHERE lesson_id = v_lesson_id_new)
WHERE lesson_id = v_lesson_id_new;
RETURN NEW;
ELSIF (TG_OP = 'UPDATE') THEN
-- This part handles if a phrase is moved from one lesson to another
IF OLD.lesson_id IS DISTINCT FROM NEW.lesson_id THEN
v_lesson_id_old := OLD.lesson_id;
v_lesson_id_new := NEW.lesson_id;

            IF v_lesson_id_old IS NOT NULL THEN
                UPDATE lessons
                SET total_phrases = (SELECT COUNT(*) FROM vocabulary_phrases WHERE lesson_id = v_lesson_id_old)
                WHERE lesson_id = v_lesson_id_old;
            END IF;
            IF v_lesson_id_new IS NOT NULL THEN
                UPDATE lessons
                SET total_phrases = (SELECT COUNT(*) FROM vocabulary_phrases WHERE lesson_id = v_lesson_id_new)
                WHERE lesson_id = v_lesson_id_new;
            END IF;
        END IF;
        RETURN NEW;
    END IF;
    RETURN NULL; -- Should only be reached if TG_OP is not INSERT, DELETE, or UPDATE

END;

$$
LANGUAGE plpgsql VOLATILE;

COMMENT ON FUNCTION update_lesson_phrase_count() IS 'Trigger function to update the total_phrases count in the lessons table when vocabulary_phrases are added, deleted, or their lesson_id is changed.';

--------------------------------------------------------------------------------
-- FUNCTION: upsert_word_pronunciation
-- Upserts word pronunciation statistics for a student.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION upsert_word_pronunciation(
    p_profile_id UUID,
    p_language_code CHAR(5),
    p_word_data JSONB -- Expects: {"word_text": "...", "accuracy_score": ..., "error_type": "...", "attempt_timestamp": "..."}
)
RETURNS VOID AS
$$

DECLARE
v_word_text TEXT := lower(p_word_data->>'word_text');
v_accuracy_score NUMERIC := (p_word_data->>'accuracy_score')::NUMERIC;
v_error_type TEXT := p_word_data->>'error_type';
v_attempt_timestamp TIMESTAMPTZ := COALESCE((p_word_data->>'attempt_timestamp')::TIMESTAMPTZ, NOW());
v_error_increment INT;
v_current_total_attempts INT;
v_current_error_count INT;
v_current_sum_accuracy_score NUMERIC;
v_final_needs_practice BOOLEAN;
v_new_average_accuracy_score NUMERIC;
BEGIN
IF v_word_text IS NULL OR v_accuracy_score IS NULL THEN
RAISE EXCEPTION 'word_text and accuracy_score must be provided in p_word_data';
END IF;
v_accuracy_score := GREATEST(0, LEAST(100, v_accuracy_score));

    IF v_error_type IS NULL OR v_error_type = 'None' OR v_error_type = '' THEN
        v_error_increment := 0;
        v_error_type := NULL;
    ELSE
        v_error_increment := 1;
    END IF;

    INSERT INTO user_word_pronunciation (
        profile_id, word_text, language_code,
        total_attempts, error_count, sum_accuracy_score, average_accuracy_score,
        last_accuracy_score, last_error_type, last_attempt_at,
        needs_practice, created_at, updated_at
    )
    VALUES (
        p_profile_id, v_word_text, p_language_code,
        1, v_error_increment, v_accuracy_score, v_accuracy_score,
        v_accuracy_score, v_error_type, v_attempt_timestamp,
        (v_error_increment = 1 OR v_accuracy_score < 70), NOW(), NOW()
    )
    ON CONFLICT (profile_id, word_text, language_code) DO UPDATE
    SET
        total_attempts = user_word_pronunciation.total_attempts + 1,
        error_count = user_word_pronunciation.error_count + v_error_increment,
        sum_accuracy_score = user_word_pronunciation.sum_accuracy_score + v_accuracy_score,
        last_accuracy_score = v_accuracy_score,
        last_error_type = v_error_type,
        last_attempt_at = v_attempt_timestamp,
        updated_at = NOW()
    RETURNING total_attempts, error_count, sum_accuracy_score
    INTO v_current_total_attempts, v_current_error_count, v_current_sum_accuracy_score;

    IF v_current_total_attempts > 0 THEN
        v_new_average_accuracy_score := ROUND(v_current_sum_accuracy_score / v_current_total_attempts, 2);
    ELSE
        v_new_average_accuracy_score := 0;
    END IF;

    IF v_accuracy_score >= 85 AND v_error_increment = 0 THEN
        v_final_needs_practice := FALSE;
    ELSIF v_accuracy_score < 70 OR v_error_increment = 1 THEN
        v_final_needs_practice := TRUE;
    ELSE
        v_final_needs_practice := (v_new_average_accuracy_score < 75);
    END IF;

    UPDATE user_word_pronunciation uwp
    SET average_accuracy_score = v_new_average_accuracy_score, needs_practice = v_final_needs_practice
    WHERE uwp.profile_id = p_profile_id AND uwp.word_text = v_word_text AND uwp.language_code = p_language_code;

END;

$$
LANGUAGE plpgsql VOLATILE SECURITY DEFINER;

COMMENT ON FUNCTION upsert_word_pronunciation(UUID, CHAR(5), JSONB) IS 'Upserts word pronunciation statistics for a student. p_word_data expects {"word_text", "accuracy_score", "error_type", "attempt_timestamp"}. Consider RLS implications if SECURITY DEFINER is used.';

--------------------------------------------------------------------------------
-- FUNCTION: upsert_word_spelling
-- Upserts word spelling statistics for a student.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION upsert_word_spelling(
    p_profile_id UUID,
    p_language_code CHAR(5),
    p_word_data JSONB -- Expects: {"word_text": "...", "similarity_score": ..., "is_error": boolean, "attempt_timestamp": "..."}
)
RETURNS VOID AS
$$

DECLARE
v_word_text TEXT := lower(p_word_data->>'word_text');
v_similarity_score NUMERIC := (p_word_data->>'similarity_score')::NUMERIC;
v_is_error BOOLEAN := (p_word_data->>'is_error')::BOOLEAN;
v_attempt_timestamp TIMESTAMPTZ := COALESCE((p_word_data->>'attempt_timestamp')::TIMESTAMPTZ, NOW());
v_error_increment INT;
v_current_total_occurrences INT;
v_current_error_count INT;
v_current_sum_similarity_score NUMERIC;
v_final_needs_practice BOOLEAN;
v_new_average_similarity_score NUMERIC;
BEGIN
IF v_word_text IS NULL OR v_similarity_score IS NULL THEN
RAISE EXCEPTION 'word_text and similarity_score must be provided in p_word_data';
END IF;
v_similarity_score := GREATEST(0, LEAST(100, v_similarity_score));

    IF v_is_error THEN v_error_increment := 1; ELSE v_error_increment := 0; END IF;

    INSERT INTO user_word_spelling (
        profile_id, word_text, language_code,
        total_dictation_occurrences, dictation_error_count, sum_word_similarity_score, average_word_similarity_score,
        last_word_similarity_score, last_dictation_attempt_at,
        needs_spelling_practice, created_at, updated_at
    )
    VALUES (
        p_profile_id, v_word_text, p_language_code,
        1, v_error_increment, v_similarity_score, v_similarity_score,
        v_similarity_score, v_attempt_timestamp,
        (v_error_increment = 1 OR v_similarity_score < 75), NOW(), NOW()
    )
    ON CONFLICT (profile_id, word_text, language_code) DO UPDATE
    SET
        total_dictation_occurrences = user_word_spelling.total_dictation_occurrences + 1,
        dictation_error_count = user_word_spelling.dictation_error_count + v_error_increment,
        sum_word_similarity_score = user_word_spelling.sum_word_similarity_score + v_similarity_score,
        last_word_similarity_score = v_similarity_score,
        last_dictation_attempt_at = v_attempt_timestamp,
        updated_at = NOW()
    RETURNING total_dictation_occurrences, dictation_error_count, sum_word_similarity_score
    INTO v_current_total_occurrences, v_current_error_count, v_current_sum_similarity_score;

    IF v_current_total_occurrences > 0 THEN
        v_new_average_similarity_score := ROUND(v_current_sum_similarity_score / v_current_total_occurrences, 2);
    ELSE
        v_new_average_similarity_score := 0;
    END IF;

    IF v_similarity_score >= 90 AND v_error_increment = 0 THEN
        v_final_needs_practice := FALSE;
    ELSIF v_similarity_score < 75 OR v_error_increment = 1 THEN
        v_final_needs_practice := TRUE;
    ELSE
        v_final_needs_practice := (v_new_average_similarity_score < 80);
    END IF;

    UPDATE user_word_spelling uws
    SET average_word_similarity_score = v_new_average_similarity_score, needs_spelling_practice = v_final_needs_practice
    WHERE uws.profile_id = p_profile_id AND uws.word_text = v_word_text AND uws.language_code = p_language_code;

END;

$$
LANGUAGE plpgsql VOLATILE SECURITY DEFINER;

COMMENT ON FUNCTION upsert_word_spelling(UUID, CHAR(5), JSONB) IS 'Upserts word spelling statistics for a student. p_word_data expects {"word_text", "similarity_score", "is_error", "attempt_timestamp"}. Consider RLS implications if SECURITY DEFINER is used.';

--------------------------------------------------------------------------------
-- FUNCTION: update_lesson_completion_stats (Trigger Function)
-- Updates user_lesson_progress based on user_phrase_progress changes.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_lesson_completion_stats()
RETURNS TRIGGER AS
$$

DECLARE
v_lesson_total_phrases INT;
v_phrases_now_completed_for_lang INT;
v_lesson_progress_exists BOOLEAN;
BEGIN
-- This trigger fires on INSERT or UPDATE of user_phrase_progress
IF (TG_OP = 'INSERT' AND NEW.is_completed) OR
(TG_OP = 'UPDATE' AND NEW.is_completed AND (OLD.is_completed IS NULL OR NOT OLD.is_completed)) OR
(TG_OP = 'UPDATE' AND NOT NEW.is_completed AND OLD.is_completed IS NOT NULL AND OLD.is_completed) -- A phrase was un-completed
THEN
-- Recalculate completed phrases for the lesson in this specific language
SELECT COUNT(\*)
INTO v_phrases_now_completed_for_lang
FROM user_phrase_progress upp
WHERE upp.profile_id = NEW.profile_id
AND upp.lesson_id = NEW.lesson_id
AND upp.language_code = NEW.language_code -- Specific to the language of the phrase progress
AND upp.is_completed = TRUE;

        -- Get total phrases for the lesson (this count is language-agnostic from the `lessons` table)
        SELECT total_phrases
        INTO v_lesson_total_phrases
        FROM lessons l
        WHERE l.lesson_id = NEW.lesson_id;

        -- Check if a user_lesson_progress record exists
        SELECT EXISTS (
            SELECT 1 FROM user_lesson_progress
            WHERE profile_id = NEW.profile_id AND lesson_id = NEW.lesson_id
        ) INTO v_lesson_progress_exists;

        -- The definition of overall lesson completion in `user_lesson_progress` needs to be carefully considered.
        -- If `user_lesson_progress.phrases_completed` refers to the count of phrases completed in *any* language
        -- or specifically the student's *current* target language for that lesson, this logic might need adjustment.
        -- For this example, we assume `user_lesson_progress.phrases_completed` reflects progress in a primary language
        -- or the language in which the most recent phrase completion occurred.
        -- Let's assume for now `phrases_completed` should reflect the count for the language of the current target language of the student for that lesson.
        -- This trigger fires based on a specific language phrase completion from `user_phrase_progress (NEW.language_code)`.
        -- We will update based on this language.

        IF v_lesson_progress_exists THEN
            UPDATE user_lesson_progress
            SET
                phrases_completed = v_phrases_now_completed_for_lang, -- This now specifically reflects count for NEW.language_code
                is_completed = (CASE
                                    WHEN v_lesson_total_phrases > 0 AND v_phrases_now_completed_for_lang >= v_lesson_total_phrases THEN TRUE
                                    ELSE FALSE
                                END),
                completed_at = (CASE
                                    WHEN v_lesson_total_phrases > 0 AND v_phrases_now_completed_for_lang >= v_lesson_total_phrases AND completed_at IS NULL THEN NOW()
                                    WHEN v_lesson_total_phrases > 0 AND v_phrases_now_completed_for_lang < v_lesson_total_phrases THEN NULL -- Reset completed_at if no longer complete
                                    ELSE completed_at
                                END),
                last_progress_at = NOW()
            WHERE profile_id = NEW.profile_id
              AND lesson_id = NEW.lesson_id;
        ELSE
             INSERT INTO user_lesson_progress (
                profile_id, lesson_id, started_at, phrases_completed, is_completed, completed_at, last_progress_at, chat_activity_engaged_at
            ) VALUES (
                NEW.profile_id, NEW.lesson_id, NOW(), v_phrases_now_completed_for_lang,
                (CASE WHEN v_lesson_total_phrases > 0 AND v_phrases_now_completed_for_lang >= v_lesson_total_phrases THEN TRUE ELSE FALSE END),
                (CASE WHEN v_lesson_total_phrases > 0 AND v_phrases_now_completed_for_lang >= v_lesson_total_phrases THEN NOW() ELSE NULL END),
                NOW(), NULL
            );
        END IF;
    END IF;

    IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;

END;

$$
LANGUAGE plpgsql VOLATILE;

COMMENT ON FUNCTION update_lesson_completion_stats() IS 'Trigger function to update user_lesson_progress (phrases_completed, is_completed, completed_at) when a user_phrase_progress record is inserted or its is_completed status changes. Assumes phrases_completed count is specific to the language of the phrase just updated.';

-- Function to create a profile in public.profiles when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER AS
$$

BEGIN
INSERT INTO public.profiles (id, first_name, last_name, created_at, updated_at)
VALUES (
NEW.id, -- The id of the new user from auth.users
NEW.raw_user_meta_data->>'first_name', -- Attempt to get first_name from metadata
NEW.raw_user_meta_data->>'last_name', -- Attempt to get last_name from metadata
NOW(),
NOW()
);
-- If first_name/last_name are not in raw_user_meta_data, they will be NULL,
-- which is fine because we made them nullable in public.profiles.
RETURN NEW;
END;

$$
LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function when a new user is created in auth.users
CREATE TRIGGER on_auth_user_created_create_public_profile
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user_profile();


## 12. Database Triggers
This section contains all the CREATE TRIGGER statements.

--------------------------------------------------------------------------------
-- Triggers for `update_updated_at_column` function
--------------------------------------------------------------------------------

-- On 'persons' table
DROP TRIGGER IF EXISTS trg_persons_update_updated_at ON public.persons;
CREATE TRIGGER trg_persons_update_updated_at
BEFORE UPDATE ON public.persons
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- On 'student_profiles' table
DROP TRIGGER IF EXISTS trg_student_profiles_update_updated_at ON public.student_profiles;
CREATE TRIGGER trg_student_profiles_update_updated_at
BEFORE UPDATE ON public.student_profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- On 'units' table
DROP TRIGGER IF EXISTS trg_units_update_updated_at ON public.units;
CREATE TRIGGER trg_units_update_updated_at
BEFORE UPDATE ON public.units
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- On 'lessons' table
DROP TRIGGER IF EXISTS trg_lessons_update_updated_at ON public.lessons;
CREATE TRIGGER trg_lessons_update_updated_at
BEFORE UPDATE ON public.lessons
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- On 'vocabulary_phrases' table
DROP TRIGGER IF EXISTS trg_vocabulary_phrases_update_updated_at ON public.vocabulary_phrases;
CREATE TRIGGER trg_vocabulary_phrases_update_updated_at
BEFORE UPDATE ON public.vocabulary_phrases
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- On 'conversation_starters' table
DROP TRIGGER IF EXISTS trg_conversation_starters_update_updated_at ON public.conversation_starters;
CREATE TRIGGER trg_conversation_starters_update_updated_at
BEFORE UPDATE ON public.conversation_starters
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- On 'unit_translations' table
DROP TRIGGER IF EXISTS trg_unit_translations_update_updated_at ON public.unit_translations;
CREATE TRIGGER trg_unit_translations_update_updated_at
BEFORE UPDATE ON public.unit_translations
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- On 'lesson_translations' table
DROP TRIGGER IF EXISTS trg_lesson_translations_update_updated_at ON public.lesson_translations;
CREATE TRIGGER trg_lesson_translations_update_updated_at
BEFORE UPDATE ON public.lesson_translations
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- On 'learning_outcome_translations' table
DROP TRIGGER IF EXISTS trg_learning_outcome_translations_update_updated_at ON public.learning_outcome_translations;
CREATE TRIGGER trg_learning_outcome_translations_update_updated_at
BEFORE UPDATE ON public.learning_outcome_translations
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- On 'phrase_versions' table
DROP TRIGGER IF EXISTS trg_phrase_versions_update_updated_at ON public.phrase_versions;
CREATE TRIGGER trg_phrase_versions_update_updated_at
BEFORE UPDATE ON public.phrase_versions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- On 'conversation_starter_translations' table
DROP TRIGGER IF EXISTS trg_conversation_starter_translations_update_updated_at ON public.conversation_starter_translations;
CREATE TRIGGER trg_conversation_starter_translations_update_updated_at
BEFORE UPDATE ON public.conversation_starter_translations
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- On 'user_word_pronunciation' table
DROP TRIGGER IF EXISTS trg_user_word_pronunciation_update_updated_at ON public.user_word_pronunciation;
CREATE TRIGGER trg_user_word_pronunciation_update_updated_at
BEFORE UPDATE ON public.user_word_pronunciation
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- On 'user_word_spelling' table
DROP TRIGGER IF EXISTS trg_user_word_spelling_update_updated_at ON public.user_word_spelling;
CREATE TRIGGER trg_user_word_spelling_update_updated_at
BEFORE UPDATE ON public.user_word_spelling
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- On 'products' table
DROP TRIGGER IF EXISTS trg_products_update_updated_at ON public.products;
CREATE TRIGGER trg_products_update_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- On 'prices' table
DROP TRIGGER IF EXISTS trg_prices_update_updated_at ON public.prices;
CREATE TRIGGER trg_prices_update_updated_at
BEFORE UPDATE ON public.prices
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- On 'student_subscriptions' table
DROP TRIGGER IF EXISTS trg_student_subscriptions_update_updated_at ON public.student_subscriptions;
CREATE TRIGGER trg_student_subscriptions_update_updated_at
BEFORE UPDATE ON public.student_subscriptions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- On 'invoices' table
DROP TRIGGER IF EXISTS trg_invoices_update_updated_at ON public.invoices;
CREATE TRIGGER trg_invoices_update_updated_at
BEFORE UPDATE ON public.invoices
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Note: `languages`, `learning_outcomes` currently only have `created_at` in your schema.
-- If you add `updated_at` to them and they can be modified, add triggers for them too.
-- Tables like `user_lesson_progress` and `user_phrase_progress` have `last_progress_at` which might be updated by application logic or other specific triggers,
-- so a generic `updated_at` trigger might be redundant or conflict if you also have a general `updated_at` column on them.
-- Your current `user_lesson_progress` and `user_phrase_progress` already have `last_progress_at TIMESTAMPTZ DEFAULT NOW()`.
-- If you add a general `updated_at` to these, then also add the trigger.

--------------------------------------------------------------------------------
-- Triggers for `update_lesson_phrase_count` function
--------------------------------------------------------------------------------

-- On 'vocabulary_phrases' after DELETE
DROP TRIGGER IF EXISTS trg_vocab_phrases_after_delete_update_lesson_count ON public.vocabulary_phrases;
CREATE TRIGGER trg_vocab_phrases_after_delete_update_lesson_count
AFTER DELETE ON public.vocabulary_phrases
FOR EACH ROW EXECUTE FUNCTION update_lesson_phrase_count();

-- On 'vocabulary_phrases' after INSERT
DROP TRIGGER IF EXISTS trg_vocab_phrases_after_insert_update_lesson_count ON public.vocabulary_phrases;
CREATE TRIGGER trg_vocab_phrases_after_insert_update_lesson_count
AFTER INSERT ON public.vocabulary_phrases
FOR EACH ROW EXECUTE FUNCTION update_lesson_phrase_count();

-- On 'vocabulary_phrases' after UPDATE OF lesson_id (if phrases can change lessons)
DROP TRIGGER IF EXISTS trg_vocab_phrases_after_update_update_lesson_count ON public.vocabulary_phrases;
CREATE TRIGGER trg_vocab_phrases_after_update_update_lesson_count
AFTER UPDATE OF lesson_id ON public.vocabulary_phrases
FOR EACH ROW
WHEN (OLD.lesson_id IS DISTINCT FROM NEW.lesson_id)
EXECUTE FUNCTION update_lesson_phrase_count();

--------------------------------------------------------------------------------
-- Trigger for `update_lesson_completion_stats` function
--------------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_user_phrase_progress_after_insert_update_completion ON public.user_phrase_progress;
CREATE TRIGGER trg_user_phrase_progress_after_insert_update_completion
AFTER INSERT ON public.user_phrase_progress -- Fire on insert if a phrase is immediately completed
FOR EACH ROW EXECUTE FUNCTION update_lesson_completion_stats();

DROP TRIGGER IF EXISTS trg_user_phrase_progress_after_update_completion ON public.user_phrase_progress;
CREATE TRIGGER trg_user_phrase_progress_after_update_completion
AFTER UPDATE OF is_completed ON public.user_phrase_progress -- Fire only when is_completed changes
FOR EACH ROW EXECUTE FUNCTION update_lesson_completion_stats();

-- Ensure profiles has updated_at trigger
DROP TRIGGER IF EXISTS trg_profiles_update_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_update_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


$$
