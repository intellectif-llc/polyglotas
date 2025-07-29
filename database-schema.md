# Database public schema

-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.conversation_messages (
message_id bigint NOT NULL DEFAULT nextval('conversation_messages_message_id_seq'::regclass),
conversation_id bigint NOT NULL,
sender_type USER-DEFINED NOT NULL,
message_order integer NOT NULL,
message_text text NOT NULL,
message_language_code character varying NOT NULL,
created_at timestamp with time zone DEFAULT now(),
related_prompt_id integer,
feedback_text text,
feedback_language_code character varying,
azure_pronunciation_data jsonb,
CONSTRAINT conversation_messages_pkey PRIMARY KEY (message_id),
CONSTRAINT fk_conversation_messages_fb_lang FOREIGN KEY (feedback_language_code) REFERENCES public.languages(language_code),
CONSTRAINT fk_conversation_messages_msg_lang FOREIGN KEY (message_language_code) REFERENCES public.languages(language_code),
CONSTRAINT conversation_messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.lesson_chat_conversations(conversation_id),
CONSTRAINT conversation_messages_related_prompt_id_fkey FOREIGN KEY (related_prompt_id) REFERENCES public.conversation_starters(id)
);
CREATE TABLE public.conversation_prompt_status (
prompt_status_id bigint NOT NULL DEFAULT nextval('conversation_prompt_status_prompt_status_id_seq'::regclass),
conversation_id bigint NOT NULL,
prompt_id integer NOT NULL,
first_addressed_message_id bigint,
addressed_at timestamp with time zone NOT NULL DEFAULT now(),
CONSTRAINT conversation_prompt_status_pkey PRIMARY KEY (prompt_status_id),
CONSTRAINT conversation_prompt_status_prompt_id_fkey FOREIGN KEY (prompt_id) REFERENCES public.conversation_starters(id),
CONSTRAINT conversation_prompt_status_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.lesson_chat_conversations(conversation_id),
CONSTRAINT conversation_prompt_status_first_addressed_message_id_fkey FOREIGN KEY (first_addressed_message_id) REFERENCES public.conversation_messages(message_id)
);
CREATE TABLE public.conversation_starter_translations (
starter_translation_id integer NOT NULL DEFAULT nextval('conversation_starter_translations_starter_translation_id_seq'::regclass),
starter_id integer NOT NULL,
language_code character varying NOT NULL,
starter_text text NOT NULL,
created_at timestamp with time zone DEFAULT now(),
updated_at timestamp with time zone DEFAULT now(),
CONSTRAINT conversation_starter_translations_pkey PRIMARY KEY (starter_translation_id),
CONSTRAINT conversation_starter_translations_starter_id_fkey FOREIGN KEY (starter_id) REFERENCES public.conversation_starters(id),
CONSTRAINT fk_conversation_starter_translations_lang FOREIGN KEY (language_code) REFERENCES public.languages(language_code)
);
CREATE TABLE public.conversation_starters (
id integer NOT NULL DEFAULT nextval('conversation_starters_id_seq'::regclass),
lesson_id integer NOT NULL,
created_at timestamp with time zone DEFAULT now(),
updated_at timestamp with time zone DEFAULT now(),
CONSTRAINT conversation_starters_pkey PRIMARY KEY (id),
CONSTRAINT conversation_starters_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.lessons(lesson_id)
);
CREATE TABLE public.dictation_attempts (
attempt_id integer NOT NULL DEFAULT nextval('dictation_attempts_attempt_id_seq'::regclass),
profile_id uuid NOT NULL,
lesson_id integer NOT NULL,
phrase_id integer NOT NULL,
language_code character varying NOT NULL,
attempt_number integer NOT NULL,
reference_text text NOT NULL,
written_text text NOT NULL,
overall_similarity_score numeric CHECK (overall_similarity_score IS NULL OR overall_similarity_score >= 0::numeric AND overall_similarity_score <= 100::numeric),
word_level_feedback jsonb,
created_at timestamp with time zone DEFAULT now(),
CONSTRAINT dictation_attempts_pkey PRIMARY KEY (attempt_id),
CONSTRAINT fk_dictation_attempts_lang FOREIGN KEY (language_code) REFERENCES public.languages(language_code),
CONSTRAINT dictation_attempts_phrase_id_fkey FOREIGN KEY (phrase_id) REFERENCES public.vocabulary_phrases(id),
CONSTRAINT dictation_attempts_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.student_profiles(profile_id),
CONSTRAINT dictation_attempts_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.lessons(lesson_id)
);
CREATE TABLE public.invoices (
id integer NOT NULL DEFAULT nextval('invoices_id_seq'::regclass),
profile_id uuid NOT NULL,
stripe_invoice_id character varying NOT NULL UNIQUE,
stripe_subscription_id character varying,
stripe_customer_id character varying,
status USER-DEFINED NOT NULL,
amount_due integer NOT NULL,
amount_paid integer NOT NULL,
amount_remaining integer NOT NULL,
currency character NOT NULL,
due_date timestamp with time zone,
paid_at timestamp with time zone,
invoice_pdf_url text,
hosted_invoice_url text,
billing_reason text,
metadata jsonb,
issued_at timestamp with time zone,
created_at timestamp with time zone DEFAULT now(),
updated_at timestamp with time zone DEFAULT now(),
CONSTRAINT invoices_pkey PRIMARY KEY (id),
CONSTRAINT invoices_stripe_subscription_id_fkey FOREIGN KEY (stripe_subscription_id) REFERENCES public.student_subscriptions(stripe_subscription_id),
CONSTRAINT invoices_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.student_profiles(profile_id)
);
CREATE TABLE public.languages (
language_code character varying NOT NULL,
language_name character varying NOT NULL UNIQUE,
created_at timestamp with time zone DEFAULT now(),
CONSTRAINT languages_pkey PRIMARY KEY (language_code)
);
CREATE TABLE public.learning_outcome_translations (
outcome_translation_id integer NOT NULL DEFAULT nextval('learning_outcome_translations_outcome_translation_id_seq'::regclass),
outcome_id integer NOT NULL,
language_code character varying NOT NULL,
outcome_text text NOT NULL CHECK (outcome_text <> ''::text),
created_at timestamp with time zone DEFAULT now(),
updated_at timestamp with time zone DEFAULT now(),
CONSTRAINT learning_outcome_translations_pkey PRIMARY KEY (outcome_translation_id),
CONSTRAINT learning_outcome_translations_outcome_id_fkey FOREIGN KEY (outcome_id) REFERENCES public.learning_outcomes(outcome_id),
CONSTRAINT fk_learning_outcome_translations_lang FOREIGN KEY (language_code) REFERENCES public.languages(language_code)
);
CREATE TABLE public.learning_outcomes (
outcome_id integer NOT NULL DEFAULT nextval('learning_outcomes_outcome_id_seq'::regclass),
lesson_id integer NOT NULL,
created_at timestamp with time zone DEFAULT now(),
CONSTRAINT learning_outcomes_pkey PRIMARY KEY (outcome_id),
CONSTRAINT learning_outcomes_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.lessons(lesson_id)
);
CREATE TABLE public.lesson_chat_conversations (
conversation_id bigint NOT NULL DEFAULT nextval('lesson_chat_conversations_conversation_id_seq'::regclass),
profile_id uuid NOT NULL,
lesson_id integer NOT NULL,
language_code character varying NOT NULL,
created_at timestamp with time zone DEFAULT now(),
all_prompts_addressed_at timestamp with time zone,
last_message_at timestamp with time zone,
CONSTRAINT lesson_chat_conversations_pkey PRIMARY KEY (conversation_id),
CONSTRAINT lesson_chat_conversations_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.lessons(lesson_id),
CONSTRAINT lesson_chat_conversations_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.student_profiles(profile_id),
CONSTRAINT fk_lesson_chat_conversations_lang FOREIGN KEY (language_code) REFERENCES public.languages(language_code)
);
CREATE TABLE public.lesson_translations (
lesson_translation_id integer NOT NULL DEFAULT nextval('lesson_translations_lesson_translation_id_seq'::regclass),
lesson_id integer NOT NULL,
language_code character varying NOT NULL,
lesson_title character varying NOT NULL,
created_at timestamp with time zone DEFAULT now(),
updated_at timestamp with time zone DEFAULT now(),
grammar_focus text,
CONSTRAINT lesson_translations_pkey PRIMARY KEY (lesson_translation_id),
CONSTRAINT fk_lesson_translations_lang FOREIGN KEY (language_code) REFERENCES public.languages(language_code),
CONSTRAINT lesson_translations_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.lessons(lesson_id)
);
CREATE TABLE public.lessons (
lesson_id integer NOT NULL DEFAULT nextval('lessons_lesson_id_seq'::regclass),
unit_id integer NOT NULL,
lesson_order integer NOT NULL,
total_phrases integer NOT NULL DEFAULT 0,
created_at timestamp with time zone DEFAULT now(),
updated_at timestamp with time zone DEFAULT now(),
CONSTRAINT lessons_pkey PRIMARY KEY (lesson_id),
CONSTRAINT lessons_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES public.units(unit_id)
);
CREATE TABLE public.phrase_versions (
phrase_version_id integer NOT NULL DEFAULT nextval('phrase_versions_phrase_version_id_seq'::regclass),
phrase_id integer NOT NULL,
language_code character varying NOT NULL,
phrase_text text NOT NULL,
audio_url_normal character varying,
created_at timestamp with time zone DEFAULT now(),
updated_at timestamp with time zone DEFAULT now(),
audio_url_slow character varying,
CONSTRAINT phrase_versions_pkey PRIMARY KEY (phrase_version_id),
CONSTRAINT fk_phrase_versions_lang FOREIGN KEY (language_code) REFERENCES public.languages(language_code),
CONSTRAINT phrase_versions_phrase_id_fkey FOREIGN KEY (phrase_id) REFERENCES public.vocabulary_phrases(id)
);
CREATE TABLE public.prices (
id integer NOT NULL DEFAULT nextval('prices_id_seq'::regclass),
stripe_price_id character varying NOT NULL UNIQUE,
product_id integer NOT NULL,
active boolean DEFAULT true,
unit_amount integer,
currency character NOT NULL,
type USER-DEFINED NOT NULL,
billing_interval USER-DEFINED,
interval_count integer,
description text,
trial_period_days integer,
metadata jsonb,
created_at timestamp with time zone DEFAULT now(),
updated_at timestamp with time zone DEFAULT now(),
CONSTRAINT prices_pkey PRIMARY KEY (id),
CONSTRAINT prices_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);
CREATE TABLE public.products (
id integer NOT NULL DEFAULT nextval('products_id_seq'::regclass),
stripe_product_id character varying NOT NULL UNIQUE,
active boolean DEFAULT true,
name character varying NOT NULL,
description text,
tier_key USER-DEFINED,
metadata jsonb,
created_at timestamp with time zone DEFAULT now(),
updated_at timestamp with time zone DEFAULT now(),
CONSTRAINT products_pkey PRIMARY KEY (id)
);
CREATE TABLE public.profiles (
id uuid NOT NULL,
first_name character varying,
last_name character varying,
created_at timestamp with time zone NOT NULL DEFAULT now(),
updated_at timestamp with time zone NOT NULL DEFAULT now(),
CONSTRAINT profiles_pkey PRIMARY KEY (id),
CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.speech_attempts (
attempt_id integer NOT NULL DEFAULT nextval('speech_attempts_attempt_id_seq'::regclass),
profile_id uuid NOT NULL,
lesson_id integer NOT NULL,
phrase_id integer NOT NULL,
language_code character varying NOT NULL,
attempt_number integer NOT NULL,
reference_text text NOT NULL,
recognized_text text,
created_at timestamp with time zone DEFAULT now(),
accuracy_score numeric CHECK (accuracy_score >= 0::numeric AND accuracy_score <= 100::numeric),
fluency_score numeric CHECK (fluency_score >= 0::numeric AND fluency_score <= 100::numeric),
completeness_score numeric CHECK (completeness_score >= 0::numeric AND completeness_score <= 100::numeric),
pronunciation_score numeric CHECK (pronunciation_score >= 0::numeric AND pronunciation_score <= 100::numeric),
prosody_score numeric CHECK (prosody_score >= 0::numeric AND prosody_score <= 100::numeric),
phonetic_data jsonb,
CONSTRAINT speech_attempts_pkey PRIMARY KEY (attempt_id),
CONSTRAINT speech_attempts_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.student_profiles(profile_id),
CONSTRAINT speech_attempts_phrase_id_fkey FOREIGN KEY (phrase_id) REFERENCES public.vocabulary_phrases(id),
CONSTRAINT fk_speech_attempts_lang FOREIGN KEY (language_code) REFERENCES public.languages(language_code),
CONSTRAINT speech_attempts_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.lessons(lesson_id)
);
CREATE TABLE public.student_profiles (
profile_id uuid NOT NULL,
discount numeric,
status USER-DEFINED NOT NULL,
current_streak_days integer NOT NULL DEFAULT 0,
last_streak_date date,
subscription_tier USER-DEFINED NOT NULL DEFAULT 'free'::subscription_tier_enum,
points integer NOT NULL DEFAULT 0 CHECK (points >= 0),
native_language_code character varying,
current_target_language_code character varying,
stripe_customer_id character varying UNIQUE,
default_payment_method_details jsonb,
billing_address jsonb,
created_at timestamp with time zone NOT NULL DEFAULT now(),
updated_at timestamp with time zone NOT NULL DEFAULT now(),
CONSTRAINT student_profiles_pkey PRIMARY KEY (profile_id),
CONSTRAINT student_profiles_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id),
CONSTRAINT fk_student_profiles_native_lang FOREIGN KEY (native_language_code) REFERENCES public.languages(language_code),
CONSTRAINT fk_student_profiles_target_lang FOREIGN KEY (current_target_language_code) REFERENCES public.languages(language_code)
);
CREATE TABLE public.student_subscriptions (
id integer NOT NULL DEFAULT nextval('student_subscriptions_id_seq'::regclass),
profile_id uuid NOT NULL,
price_id integer NOT NULL,
stripe_subscription_id character varying NOT NULL UNIQUE,
status USER-DEFINED NOT NULL,
quantity integer DEFAULT 1,
current_period_start timestamp with time zone NOT NULL,
current_period_end timestamp with time zone NOT NULL,
cancel_at_period_end boolean DEFAULT false,
canceled_at timestamp with time zone,
ended_at timestamp with time zone,
trial_start_at timestamp with time zone,
trial_end_at timestamp with time zone,
metadata jsonb,
stripe_created_at timestamp with time zone,
created_at timestamp with time zone DEFAULT now(),
updated_at timestamp with time zone DEFAULT now(),
CONSTRAINT student_subscriptions_pkey PRIMARY KEY (id),
CONSTRAINT student_subscriptions_price_id_fkey FOREIGN KEY (price_id) REFERENCES public.prices(id),
CONSTRAINT student_subscriptions_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.student_profiles(profile_id)
);
CREATE TABLE public.student_target_languages (
profile_id uuid NOT NULL,
language_code character varying NOT NULL,
added_at timestamp with time zone DEFAULT now(),
CONSTRAINT student_target_languages_pkey PRIMARY KEY (profile_id, language_code),
CONSTRAINT fk_student_target_languages_lang FOREIGN KEY (language_code) REFERENCES public.languages(language_code),
CONSTRAINT student_target_languages_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.student_profiles(profile_id)
);
CREATE TABLE public.unit_translations (
unit_translation_id integer NOT NULL DEFAULT nextval('unit_translations_unit_translation_id_seq'::regclass),
unit_id integer NOT NULL,
language_code character varying NOT NULL,
unit_title character varying NOT NULL,
description text,
created_at timestamp with time zone DEFAULT now(),
updated_at timestamp with time zone DEFAULT now(),
CONSTRAINT unit_translations_pkey PRIMARY KEY (unit_translation_id),
CONSTRAINT unit_translations_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES public.units(unit_id),
CONSTRAINT fk_unit_translations_lang FOREIGN KEY (language_code) REFERENCES public.languages(language_code)
);
CREATE TABLE public.units (
unit_id integer NOT NULL DEFAULT nextval('units_unit_id_seq'::regclass),
level USER-DEFINED NOT NULL,
unit_order integer NOT NULL,
created_at timestamp with time zone DEFAULT now(),
updated_at timestamp with time zone DEFAULT now(),
CONSTRAINT units_pkey PRIMARY KEY (unit_id)
);
CREATE TABLE public.user_lesson_progress (
progress_id integer NOT NULL DEFAULT nextval('user_lesson_progress_progress_id_seq'::regclass),
profile_id uuid NOT NULL,
lesson_id integer NOT NULL,
started_at timestamp with time zone DEFAULT now(),
completed_at timestamp with time zone,
chat_activity_engaged_at timestamp with time zone,
is_completed boolean DEFAULT false,
phrases_completed integer DEFAULT 0,
last_progress_at timestamp with time zone DEFAULT now(),
CONSTRAINT user_lesson_progress_pkey PRIMARY KEY (progress_id),
CONSTRAINT user_lesson_progress_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.student_profiles(profile_id),
CONSTRAINT user_lesson_progress_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.lessons(lesson_id)
);
CREATE TABLE public.user_phrase_progress (
phrase_progress_id integer NOT NULL DEFAULT nextval('user_phrase_progress_phrase_progress_id_seq'::regclass),
profile_id uuid NOT NULL,
lesson_id integer NOT NULL,
phrase_id integer NOT NULL,
language_code character varying NOT NULL,
unscramble_completed boolean DEFAULT false,
unscramble_attempts integer DEFAULT 0,
unscramble_last_attempt_at timestamp with time zone,
pronunciation_completed boolean DEFAULT false,
pronunciation_attempts integer DEFAULT 0,
pronunciation_last_attempt_at timestamp with time zone,
best_accuracy_score numeric CHECK (best_accuracy_score IS NULL OR best_accuracy_score >= 0::numeric AND best_accuracy_score <= 100::numeric),
best_fluency_score numeric CHECK (best_fluency_score IS NULL OR best_fluency_score >= 0::numeric AND best_fluency_score <= 100::numeric),
best_completeness_score numeric CHECK (best_completeness_score IS NULL OR best_completeness_score >= 0::numeric AND best_completeness_score <= 100::numeric),
best_pronunciation_score numeric CHECK (best_pronunciation_score IS NULL OR best_pronunciation_score >= 0::numeric AND best_pronunciation_score <= 100::numeric),
best_prosody_score numeric CHECK (best_prosody_score IS NULL OR best_prosody_score >= 0::numeric AND best_prosody_score <= 100::numeric),
dictation_completed boolean DEFAULT false,
dictation_attempts integer DEFAULT 0,
dictation_last_attempt_at timestamp with time zone,
best_dictation_score numeric CHECK (best_dictation_score IS NULL OR best_dictation_score >= 0::numeric AND best_dictation_score <= 100::numeric),
is_completed boolean DEFAULT false,
last_progress_at timestamp with time zone DEFAULT now(),
CONSTRAINT user_phrase_progress_pkey PRIMARY KEY (phrase_progress_id),
CONSTRAINT user_phrase_progress_phrase_id_fkey FOREIGN KEY (phrase_id) REFERENCES public.vocabulary_phrases(id),
CONSTRAINT fk_user_phrase_progress_lang FOREIGN KEY (language_code) REFERENCES public.languages(language_code),
CONSTRAINT user_phrase_progress_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.lessons(lesson_id),
CONSTRAINT user_phrase_progress_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.student_profiles(profile_id)
);
CREATE TABLE public.user_points_log (
log_id integer NOT NULL DEFAULT nextval('user_points_log_log_id_seq'::regclass),
profile_id uuid NOT NULL,
points_awarded integer NOT NULL,
reason_code character varying NOT NULL,
related_lesson_id integer,
related_phrase_id integer,
related_word_text character varying,
related_word_language_code character varying,
notes text,
created_at timestamp with time zone DEFAULT now(),
CONSTRAINT user_points_log_pkey PRIMARY KEY (log_id),
CONSTRAINT user_points_log_related_phrase_id_fkey FOREIGN KEY (related_phrase_id) REFERENCES public.vocabulary_phrases(id),
CONSTRAINT fk_user_points_log_related_word_lang FOREIGN KEY (related_word_language_code) REFERENCES public.languages(language_code),
CONSTRAINT user_points_log_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.student_profiles(profile_id),
CONSTRAINT user_points_log_related_lesson_id_fkey FOREIGN KEY (related_lesson_id) REFERENCES public.lessons(lesson_id)
);
CREATE TABLE public.user_word_pronunciation (
id integer NOT NULL DEFAULT nextval('user_word_pronunciation_id_seq'::regclass),
profile_id uuid NOT NULL,
word_text character varying NOT NULL,
language_code character varying NOT NULL,
total_attempts integer DEFAULT 0,
error_count integer DEFAULT 0,
sum_accuracy_score numeric DEFAULT 0,
average_accuracy_score numeric DEFAULT 0,
last_accuracy_score numeric,
last_error_type character varying,
last_attempt_at timestamp with time zone,
needs_practice boolean DEFAULT false,
last_reviewed_at timestamp with time zone,
created_at timestamp with time zone DEFAULT now(),
updated_at timestamp with time zone DEFAULT now(),
CONSTRAINT user_word_pronunciation_pkey PRIMARY KEY (id),
CONSTRAINT user_word_pronunciation_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.student_profiles(profile_id),
CONSTRAINT fk_user_word_pronunciation_lang FOREIGN KEY (language_code) REFERENCES public.languages(language_code)
);
CREATE TABLE public.user_word_spelling (
id integer NOT NULL DEFAULT nextval('user_word_spelling_id_seq'::regclass),
profile_id uuid NOT NULL,
word_text character varying NOT NULL,
language_code character varying NOT NULL,
total_dictation_occurrences integer DEFAULT 0,
dictation_error_count integer DEFAULT 0,
sum_word_similarity_score numeric DEFAULT 0,
average_word_similarity_score numeric DEFAULT 0,
last_word_similarity_score numeric CHECK (last_word_similarity_score IS NULL OR last_word_similarity_score >= 0::numeric AND last_word_similarity_score <= 100::numeric),
last_dictation_attempt_at timestamp with time zone,
needs_spelling_practice boolean DEFAULT false,
last_reviewed_at timestamp with time zone,
created_at timestamp with time zone DEFAULT now(),
updated_at timestamp with time zone DEFAULT now(),
CONSTRAINT user_word_spelling_pkey PRIMARY KEY (id),
CONSTRAINT user_word_spelling_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.student_profiles(profile_id),
CONSTRAINT fk_user_word_spelling_lang FOREIGN KEY (language_code) REFERENCES public.languages(language_code)
);
CREATE TABLE public.vocabulary_phrases (
id integer NOT NULL DEFAULT nextval('vocabulary_phrases_id_seq'::regclass),
lesson_id integer NOT NULL,
phrase_order integer NOT NULL,
concept_description text,
created_at timestamp with time zone DEFAULT now(),
updated_at timestamp with time zone DEFAULT now(),
CONSTRAINT vocabulary_phrases_pkey PRIMARY KEY (id),
CONSTRAINT vocabulary_phrases_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.lessons(lesson_id)
);
