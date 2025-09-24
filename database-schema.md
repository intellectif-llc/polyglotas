# Database public schema

-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.audiobook_alignment (
alignment_id integer NOT NULL DEFAULT nextval('audiobook_alignment_alignment_id_seq'::regclass),
book_id integer NOT NULL,
full_text text NOT NULL,
characters_data jsonb NOT NULL,
words_data jsonb NOT NULL,
loss_score numeric,
created_at timestamp with time zone DEFAULT now(),
chapter_id integer,
CONSTRAINT audiobook_alignment_pkey PRIMARY KEY (alignment_id),
CONSTRAINT audiobook_alignment_book_id_fkey FOREIGN KEY (book_id) REFERENCES public.audiobooks(book_id),
CONSTRAINT audiobook_alignment_chapter_id_fkey FOREIGN KEY (chapter_id) REFERENCES public.audiobook_chapters(chapter_id)
);
CREATE TABLE public.audiobook_chapters (
chapter_id integer NOT NULL DEFAULT nextval('audiobook_chapters_chapter_id_seq'::regclass),
book_id bigint NOT NULL,
chapter_title text NOT NULL,
audio_url text NOT NULL,
duration_seconds integer,
is_free_sample boolean DEFAULT false,
chapter_order integer NOT NULL,
created_at timestamp with time zone DEFAULT now(),
CONSTRAINT audiobook_chapters_pkey PRIMARY KEY (chapter_id),
CONSTRAINT audiobook_chapters_book_id_fkey FOREIGN KEY (book_id) REFERENCES public.audiobooks(book_id)
);
CREATE TABLE public.audiobooks (
book_id integer NOT NULL DEFAULT nextval('audiobooks_book_id_seq'::regclass),
title character varying NOT NULL,
author character varying NOT NULL,
description text,
cover_image_url character varying,
audio_url character varying NOT NULL,
language_code character varying NOT NULL,
level_code USER-DEFINED NOT NULL,
duration_seconds integer,
points_cost integer NOT NULL DEFAULT 0,
price_cents integer NOT NULL DEFAULT 0,
is_active boolean NOT NULL DEFAULT true,
created_at timestamp with time zone DEFAULT now(),
updated_at timestamp with time zone DEFAULT now(),
CONSTRAINT audiobooks_pkey PRIMARY KEY (book_id),
CONSTRAINT fk_audiobooks_language FOREIGN KEY (language_code) REFERENCES public.languages(language_code),
CONSTRAINT fk_audiobooks_level FOREIGN KEY (level_code) REFERENCES public.language_levels(level_code)
);
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
suggested_answer jsonb,
CONSTRAINT conversation_messages_pkey PRIMARY KEY (message_id),
CONSTRAINT conversation_messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.lesson_chat_conversations(conversation_id),
CONSTRAINT conversation_messages_related_prompt_id_fkey FOREIGN KEY (related_prompt_id) REFERENCES public.conversation_starters(id),
CONSTRAINT fk_conversation_messages_fb_lang FOREIGN KEY (feedback_language_code) REFERENCES public.languages(language_code),
CONSTRAINT fk_conversation_messages_msg_lang FOREIGN KEY (message_language_code) REFERENCES public.languages(language_code)
);
CREATE TABLE public.conversation_prompt_status (
prompt_status_id bigint NOT NULL DEFAULT nextval('conversation_prompt_status_prompt_status_id_seq'::regclass),
conversation_id bigint NOT NULL,
prompt_id integer NOT NULL,
first_addressed_message_id bigint,
addressed_at timestamp with time zone NOT NULL DEFAULT now(),
CONSTRAINT conversation_prompt_status_pkey PRIMARY KEY (prompt_status_id),
CONSTRAINT conversation_prompt_status_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.lesson_chat_conversations(conversation_id),
CONSTRAINT conversation_prompt_status_first_addressed_message_id_fkey FOREIGN KEY (first_addressed_message_id) REFERENCES public.conversation_messages(message_id),
CONSTRAINT conversation_prompt_status_prompt_id_fkey FOREIGN KEY (prompt_id) REFERENCES public.conversation_starters(id)
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
CONSTRAINT dictation_attempts_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.lessons(lesson_id),
CONSTRAINT dictation_attempts_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.student_profiles(profile_id),
CONSTRAINT fk_dictation_attempts_lang FOREIGN KEY (language_code) REFERENCES public.languages(language_code),
CONSTRAINT dictation_attempts_phrase_id_fkey FOREIGN KEY (phrase_id) REFERENCES public.phrases(phrase_id)
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
CONSTRAINT invoices_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.student_profiles(profile_id),
CONSTRAINT invoices_stripe_subscription_id_fkey FOREIGN KEY (stripe_subscription_id) REFERENCES public.student_subscriptions(stripe_subscription_id)
);
CREATE TABLE public.language_levels (
level_code USER-DEFINED NOT NULL,
level_name text NOT NULL,
sort_order integer NOT NULL UNIQUE,
is_available boolean NOT NULL DEFAULT false,
description text,
CONSTRAINT language_levels_pkey PRIMARY KEY (level_code)
);
CREATE TABLE public.languages (
language_code character varying NOT NULL,
language_name character varying NOT NULL UNIQUE,
created_at timestamp with time zone DEFAULT now(),
is_enabled boolean NOT NULL DEFAULT true,
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
CONSTRAINT fk_learning_outcome_translations_lang FOREIGN KEY (language_code) REFERENCES public.languages(language_code),
CONSTRAINT learning_outcome_translations_outcome_id_fkey FOREIGN KEY (outcome_id) REFERENCES public.learning_outcomes(outcome_id)
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
CONSTRAINT fk_lesson_chat_conversations_lang FOREIGN KEY (language_code) REFERENCES public.languages(language_code),
CONSTRAINT lesson_chat_conversations_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.lessons(lesson_id),
CONSTRAINT lesson_chat_conversations_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.student_profiles(profile_id)
);
CREATE TABLE public.lesson_phrases (
lesson_phrase_id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
lesson_id integer NOT NULL,
phrase_id integer NOT NULL,
phrase_order integer NOT NULL,
CONSTRAINT lesson_phrases_pkey PRIMARY KEY (lesson_phrase_id),
CONSTRAINT lesson_phrases_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.lessons(lesson_id),
CONSTRAINT lesson_phrases_phrase_id_fkey FOREIGN KEY (phrase_id) REFERENCES public.phrases(phrase_id)
);
CREATE TABLE public.lesson_translations (
lesson_translation_id integer NOT NULL DEFAULT nextval('lesson_translations_lesson_translation_id_seq'::regclass),
lesson_id integer NOT NULL,
language_code character varying NOT NULL,
lesson_title character varying NOT NULL,
created_at timestamp with time zone DEFAULT now(),
updated_at timestamp with time zone DEFAULT now(),
grammar_focus ARRAY,
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
has_dictation boolean NOT NULL DEFAULT true,
has_pronunciation boolean NOT NULL DEFAULT true,
has_chat boolean NOT NULL DEFAULT true,
CONSTRAINT lessons_pkey PRIMARY KEY (lesson_id),
CONSTRAINT lessons_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES public.units(unit_id)
);
CREATE TABLE public.partnership_invitations (
id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
partnership_id bigint NOT NULL,
token uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
intended_for_email text NOT NULL,
redeemed_by_profile_id uuid UNIQUE,
redeemed_at timestamp with time zone,
expires_at timestamp with time zone NOT NULL,
created_at timestamp with time zone NOT NULL DEFAULT now(),
status USER-DEFINED NOT NULL DEFAULT 'pending'::partnership_invitation_status,
CONSTRAINT partnership_invitations_pkey PRIMARY KEY (id),
CONSTRAINT partnership_invitations_partnership_id_fkey FOREIGN KEY (partnership_id) REFERENCES public.partnerships(id),
CONSTRAINT partnership_invitations_redeemed_by_profile_id_fkey FOREIGN KEY (redeemed_by_profile_id) REFERENCES public.student_profiles(profile_id)
);
CREATE TABLE public.partnerships (
id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
name character varying NOT NULL,
description text,
trial_duration_days integer NOT NULL DEFAULT 7,
trial_tier USER-DEFINED NOT NULL DEFAULT 'pro'::subscription_tier_enum,
discount_percentage numeric NOT NULL DEFAULT 0 CHECK (discount_percentage >= 0::numeric AND discount_percentage <= 100::numeric),
is_active boolean NOT NULL DEFAULT true,
created_at timestamp with time zone NOT NULL DEFAULT now(),
updated_at timestamp with time zone NOT NULL DEFAULT now(),
CONSTRAINT partnerships_pkey PRIMARY KEY (id)
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
CONSTRAINT phrase_versions_phrase_id_fkey FOREIGN KEY (phrase_id) REFERENCES public.phrases(phrase_id)
);
CREATE TABLE public.phrases (
phrase_id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
concept_description text,
created_at timestamp with time zone DEFAULT now(),
CONSTRAINT phrases_pkey PRIMARY KEY (phrase_id)
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
role USER-DEFINED NOT NULL DEFAULT 'student'::user_role_enum,
partnership_id bigint,
CONSTRAINT profiles_pkey PRIMARY KEY (id),
CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id),
CONSTRAINT profiles_partnership_id_fkey FOREIGN KEY (partnership_id) REFERENCES public.partnerships(id)
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
CONSTRAINT fk_speech_attempts_lang FOREIGN KEY (language_code) REFERENCES public.languages(language_code),
CONSTRAINT speech_attempts_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.lessons(lesson_id),
CONSTRAINT speech_attempts_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.student_profiles(profile_id),
CONSTRAINT speech_attempts_phrase_id_fkey FOREIGN KEY (phrase_id) REFERENCES public.phrases(phrase_id)
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
partnership_id bigint,
selected_level_code USER-DEFINED,
CONSTRAINT student_profiles_pkey PRIMARY KEY (profile_id),
CONSTRAINT fk_student_profiles_native_lang FOREIGN KEY (native_language_code) REFERENCES public.languages(language_code),
CONSTRAINT fk_student_profiles_selected_level FOREIGN KEY (selected_level_code) REFERENCES public.language_levels(level_code),
CONSTRAINT fk_student_profiles_target_lang FOREIGN KEY (current_target_language_code) REFERENCES public.languages(language_code),
CONSTRAINT student_profiles_partnership_id_fkey FOREIGN KEY (partnership_id) REFERENCES public.partnerships(id),
CONSTRAINT student_profiles_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id)
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
CREATE TABLE public.tour_steps (
step_id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
tour_id integer NOT NULL,
step_order integer NOT NULL,
page_route text NOT NULL,
target_selector text NOT NULL,
title text NOT NULL,
content text NOT NULL,
tour_props jsonb,
created_at timestamp with time zone NOT NULL DEFAULT now(),
updated_at timestamp with time zone NOT NULL DEFAULT now(),
media_url text,
CONSTRAINT tour_steps_pkey PRIMARY KEY (step_id),
CONSTRAINT tour_steps_tour_id_fkey FOREIGN KEY (tour_id) REFERENCES public.tours(tour_id)
);
CREATE TABLE public.tours (
tour_id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
tour_key text NOT NULL UNIQUE,
name text NOT NULL,
is_active boolean NOT NULL DEFAULT true,
created_at timestamp with time zone NOT NULL DEFAULT now(),
updated_at timestamp with time zone NOT NULL DEFAULT now(),
CONSTRAINT tours_pkey PRIMARY KEY (tour_id)
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
CONSTRAINT fk_unit_translations_lang FOREIGN KEY (language_code) REFERENCES public.languages(language_code),
CONSTRAINT unit_translations_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES public.units(unit_id)
);
CREATE TABLE public.units (
unit_id integer NOT NULL DEFAULT nextval('units_unit_id_seq'::regclass),
level USER-DEFINED NOT NULL,
unit_order integer NOT NULL,
created_at timestamp with time zone DEFAULT now(),
updated_at timestamp with time zone DEFAULT now(),
CONSTRAINT units_pkey PRIMARY KEY (unit_id),
CONSTRAINT fk_units_to_language_levels FOREIGN KEY (level) REFERENCES public.language_levels(level_code)
);
CREATE TABLE public.user_audiobook_progress (
progress_id integer NOT NULL DEFAULT nextval('user_audiobook_progress_progress_id_seq'::regclass),
profile_id uuid NOT NULL,
book_id integer NOT NULL,
current_position_seconds numeric DEFAULT 0,
last_read_at timestamp with time zone DEFAULT now(),
is_completed boolean DEFAULT false,
completed_at timestamp with time zone,
current_chapter_id integer,
CONSTRAINT user_audiobook_progress_pkey PRIMARY KEY (progress_id),
CONSTRAINT user_audiobook_progress_book_id_fkey FOREIGN KEY (book_id) REFERENCES public.audiobooks(book_id),
CONSTRAINT user_audiobook_progress_chapter_id_fkey FOREIGN KEY (current_chapter_id) REFERENCES public.audiobook_chapters(chapter_id),
CONSTRAINT user_audiobook_progress_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.student_profiles(profile_id)
);
CREATE TABLE public.user_audiobook_purchases (
purchase_id integer NOT NULL DEFAULT nextval('user_audiobook_purchases_purchase_id_seq'::regclass),
profile_id uuid NOT NULL,
book_id integer NOT NULL,
purchase_type USER-DEFINED NOT NULL,
points_spent integer DEFAULT 0,
amount_paid_cents integer DEFAULT 0,
purchased_at timestamp with time zone DEFAULT now(),
CONSTRAINT user_audiobook_purchases_pkey PRIMARY KEY (purchase_id),
CONSTRAINT user_audiobook_purchases_book_id_fkey FOREIGN KEY (book_id) REFERENCES public.audiobooks(book_id),
CONSTRAINT user_audiobook_purchases_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.student_profiles(profile_id)
);
CREATE TABLE public.user_lesson_activity_progress (
activity_progress_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
user_lesson_progress_id integer NOT NULL,
activity_type USER-DEFINED NOT NULL,
status USER-DEFINED NOT NULL DEFAULT 'not_started'::activity_status_enum,
started_at timestamp with time zone,
completed_at timestamp with time zone,
CONSTRAINT user_lesson_activity_progress_pkey PRIMARY KEY (activity_progress_id),
CONSTRAINT user_lesson_activity_progress_user_lesson_progress_id_fkey FOREIGN KEY (user_lesson_progress_id) REFERENCES public.user_lesson_progress(progress_id)
);
CREATE TABLE public.user_lesson_progress (
progress_id integer NOT NULL DEFAULT nextval('user_lesson_progress_progress_id_seq'::regclass),
profile_id uuid NOT NULL,
lesson_id integer NOT NULL,
started_at timestamp with time zone DEFAULT now(),
last_progress_at timestamp with time zone DEFAULT now(),
CONSTRAINT user_lesson_progress_pkey PRIMARY KEY (progress_id),
CONSTRAINT user_lesson_progress_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.lessons(lesson_id),
CONSTRAINT user_lesson_progress_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.student_profiles(profile_id)
);
CREATE TABLE public.user_level_completion (
profile_id uuid NOT NULL,
level_code USER-DEFINED NOT NULL,
completed_at timestamp with time zone NOT NULL DEFAULT now(),
created_at timestamp with time zone NOT NULL DEFAULT now(),
CONSTRAINT user_level_completion_pkey PRIMARY KEY (profile_id, level_code),
CONSTRAINT user_level_completion_level_code_fkey FOREIGN KEY (level_code) REFERENCES public.language_levels(level_code),
CONSTRAINT user_level_completion_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.student_profiles(profile_id)
);
CREATE TABLE public.user_phrase_progress (
phrase_progress_id integer NOT NULL DEFAULT nextval('user_phrase_progress_phrase_progress_id_seq'::regclass),
profile_id uuid NOT NULL,
lesson_id integer NOT NULL,
phrase_id integer NOT NULL,
language_code character varying NOT NULL,
pronunciation_completed boolean DEFAULT false,
pronunciation_attempts integer DEFAULT 0,
pronunciation_last_attempt_at timestamp with time zone,
dictation_completed boolean DEFAULT false,
dictation_attempts integer DEFAULT 0,
dictation_last_attempt_at timestamp with time zone,
last_progress_at timestamp with time zone DEFAULT now(),
CONSTRAINT user_phrase_progress_pkey PRIMARY KEY (phrase_progress_id),
CONSTRAINT fk_user_phrase_progress_lang FOREIGN KEY (language_code) REFERENCES public.languages(language_code),
CONSTRAINT user_phrase_progress_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.lessons(lesson_id),
CONSTRAINT user_phrase_progress_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.student_profiles(profile_id),
CONSTRAINT user_phrase_progress_phrase_id_fkey FOREIGN KEY (phrase_id) REFERENCES public.phrases(phrase_id)
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
activity_type USER-DEFINED,
CONSTRAINT user_points_log_pkey PRIMARY KEY (log_id),
CONSTRAINT fk_user_points_log_related_word_lang FOREIGN KEY (related_word_language_code) REFERENCES public.languages(language_code),
CONSTRAINT user_points_log_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.student_profiles(profile_id),
CONSTRAINT user_points_log_related_lesson_id_fkey FOREIGN KEY (related_lesson_id) REFERENCES public.lessons(lesson_id),
CONSTRAINT user_points_log_related_phrase_id_fkey FOREIGN KEY (related_phrase_id) REFERENCES public.phrases(phrase_id)
);
CREATE TABLE public.user_srs_data (
user_srs_data_id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
profile_id uuid NOT NULL,
phrase_id integer NOT NULL,
due_at timestamp with time zone NOT NULL DEFAULT now(),
interval real NOT NULL DEFAULT 0,
ease_factor real NOT NULL DEFAULT 2.5,
repetitions integer NOT NULL DEFAULT 0,
last_reviewed_at timestamp with time zone,
language_code character varying NOT NULL,
CONSTRAINT user_srs_data_pkey PRIMARY KEY (user_srs_data_id),
CONSTRAINT user_srs_data_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.student_profiles(profile_id),
CONSTRAINT user_srs_data_phrase_id_fkey FOREIGN KEY (phrase_id) REFERENCES public.phrases(phrase_id),
CONSTRAINT fk_user_srs_data_lang FOREIGN KEY (language_code) REFERENCES public.languages(language_code)
);
CREATE TABLE public.user_tour_progress (
profile_id uuid NOT NULL,
tour_id integer NOT NULL,
status USER-DEFINED NOT NULL DEFAULT 'pending'::tour_progress_status,
last_completed_step integer NOT NULL DEFAULT 0,
completed_at timestamp with time zone,
updated_at timestamp with time zone NOT NULL DEFAULT now(),
CONSTRAINT user_tour_progress_pkey PRIMARY KEY (profile_id, tour_id),
CONSTRAINT user_tour_progress_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.student_profiles(profile_id),
CONSTRAINT user_tour_progress_tour_id_fkey FOREIGN KEY (tour_id) REFERENCES public.tours(tour_id)
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
created_at timestamp with time zone DEFAULT now(),
updated_at timestamp with time zone DEFAULT now(),
CONSTRAINT user_word_pronunciation_pkey PRIMARY KEY (id),
CONSTRAINT fk_user_word_pronunciation_lang FOREIGN KEY (language_code) REFERENCES public.languages(language_code),
CONSTRAINT user_word_pronunciation_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.student_profiles(profile_id)
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
CONSTRAINT fk_user_word_spelling_lang FOREIGN KEY (language_code) REFERENCES public.languages(language_code),
CONSTRAINT user_word_spelling_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.student_profiles(profile_id)
);

# Enums

| enum_name                     | enum_value           | enumsortorder |
| ----------------------------- | -------------------- | ------------- |
| account_status_enum           | pending_verification | 1             |
| account_status_enum           | active               | 2             |
| account_status_enum           | suspended            | 3             |
| account_status_enum           | deactivated          | 4             |
| invoice_status_enum           | draft                | 1             |
| invoice_status_enum           | open                 | 2             |
| invoice_status_enum           | paid                 | 3             |
| invoice_status_enum           | void                 | 4             |
| invoice_status_enum           | uncollectible        | 5             |
| invoice_status_enum           | past_due             | 6             |
| invoice_status_enum           | refunded             | 7             |
| invoice_status_enum           | pending              | 8             |
| level_enum                    | A1                   | 1             |
| level_enum                    | A2                   | 2             |
| level_enum                    | B1                   | 3             |
| level_enum                    | B2                   | 4             |
| level_enum                    | C1                   | 5             |
| level_enum                    | C2                   | 6             |
| price_billing_interval_enum   | day                  | 1             |
| price_billing_interval_enum   | week                 | 2             |
| price_billing_interval_enum   | month                | 3             |
| price_billing_interval_enum   | year                 | 4             |
| price_type_enum               | recurring            | 1             |
| price_type_enum               | one_time             | 2             |
| sender_type_enum              | user                 | 1             |
| sender_type_enum              | ai                   | 2             |
| subscription_status_enum      | trialing             | 1             |
| subscription_status_enum      | active               | 2             |
| subscription_status_enum      | past_due             | 3             |
| subscription_status_enum      | unpaid               | 4             |
| subscription_status_enum      | canceled             | 5             |
| subscription_status_enum      | incomplete           | 6             |
| subscription_status_enum      | incomplete_expired   | 7             |
| subscription_status_enum      | paused               | 8             |
| subscription_tier_enum        | free                 | 1             |
| subscription_tier_enum        | starter              | 2             |
| subscription_tier_enum        | pro                  | 3             |
| activity_status_enum          | not_started          | 1             |
| activity_status_enum          | in_progress          | 2             |
| activity_status_enum          | completed            | 3             |
| activity_type_enum            | dictation            | 1             |
| activity_type_enum            | pronunciation        | 2             |
| activity_type_enum            | chat                 | 3             |
| partnership_invitation_status | pending              | 1             |
| partnership_invitation_status | redeemed             | 2             |
| partnership_invitation_status | expired              | 3             |
| user_role_enum                | student              | 1             |
| user_role_enum                | partnership_manager  | 2             |
| user_role_enum                | admin                | 3             |
| purchase_type_enum            | points               | 1             |
| purchase_type_enum            | money                | 2             |

# Database auth schema

-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE auth.audit_log_entries (
instance_id uuid,
id uuid NOT NULL,
payload json,
created_at timestamp with time zone,
ip_address character varying NOT NULL DEFAULT ''::character varying,
CONSTRAINT audit_log_entries_pkey PRIMARY KEY (id)
);
CREATE TABLE auth.flow_state (
id uuid NOT NULL,
user_id uuid,
auth_code text NOT NULL,
code_challenge_method USER-DEFINED NOT NULL,
code_challenge text NOT NULL,
provider_type text NOT NULL,
provider_access_token text,
provider_refresh_token text,
created_at timestamp with time zone,
updated_at timestamp with time zone,
authentication_method text NOT NULL,
auth_code_issued_at timestamp with time zone,
CONSTRAINT flow_state_pkey PRIMARY KEY (id)
);
CREATE TABLE auth.identities (
provider_id text NOT NULL,
user_id uuid NOT NULL,
identity_data jsonb NOT NULL,
provider text NOT NULL,
last_sign_in_at timestamp with time zone,
created_at timestamp with time zone,
updated_at timestamp with time zone,
email text DEFAULT lower((identity_data ->> 'email'::text)),
id uuid NOT NULL DEFAULT gen_random_uuid(),
CONSTRAINT identities_pkey PRIMARY KEY (id),
CONSTRAINT identities_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE auth.instances (
id uuid NOT NULL,
uuid uuid,
raw_base_config text,
created_at timestamp with time zone,
updated_at timestamp with time zone,
CONSTRAINT instances_pkey PRIMARY KEY (id)
);
CREATE TABLE auth.mfa_amr_claims (
session_id uuid NOT NULL,
created_at timestamp with time zone NOT NULL,
updated_at timestamp with time zone NOT NULL,
authentication_method text NOT NULL,
id uuid NOT NULL,
CONSTRAINT mfa_amr_claims_pkey PRIMARY KEY (id),
CONSTRAINT mfa_amr_claims_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id)
);
CREATE TABLE auth.mfa_challenges (
id uuid NOT NULL,
factor_id uuid NOT NULL,
created_at timestamp with time zone NOT NULL,
verified_at timestamp with time zone,
ip_address inet NOT NULL,
otp_code text,
web_authn_session_data jsonb,
CONSTRAINT mfa_challenges_pkey PRIMARY KEY (id),
CONSTRAINT mfa_challenges_auth_factor_id_fkey FOREIGN KEY (factor_id) REFERENCES auth.mfa_factors(id)
);
CREATE TABLE auth.mfa_factors (
id uuid NOT NULL,
user_id uuid NOT NULL,
friendly_name text,
factor_type USER-DEFINED NOT NULL,
status USER-DEFINED NOT NULL,
created_at timestamp with time zone NOT NULL,
updated_at timestamp with time zone NOT NULL,
secret text,
phone text,
last_challenged_at timestamp with time zone UNIQUE,
web_authn_credential jsonb,
web_authn_aaguid uuid,
CONSTRAINT mfa_factors_pkey PRIMARY KEY (id),
CONSTRAINT mfa_factors_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE auth.one_time_tokens (
id uuid NOT NULL,
user_id uuid NOT NULL,
token_type USER-DEFINED NOT NULL,
token_hash text NOT NULL CHECK (char_length(token_hash) > 0),
relates_to text NOT NULL,
created_at timestamp without time zone NOT NULL DEFAULT now(),
updated_at timestamp without time zone NOT NULL DEFAULT now(),
CONSTRAINT one_time_tokens_pkey PRIMARY KEY (id),
CONSTRAINT one_time_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE auth.refresh_tokens (
instance_id uuid,
id bigint NOT NULL DEFAULT nextval('auth.refresh_tokens_id_seq'::regclass),
token character varying UNIQUE,
user_id character varying,
revoked boolean,
created_at timestamp with time zone,
updated_at timestamp with time zone,
parent character varying,
session_id uuid,
CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id),
CONSTRAINT refresh_tokens_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id)
);
CREATE TABLE auth.saml_providers (
id uuid NOT NULL,
sso_provider_id uuid NOT NULL,
entity_id text NOT NULL UNIQUE CHECK (char_length(entity_id) > 0),
metadata_xml text NOT NULL CHECK (char_length(metadata_xml) > 0),
metadata_url text CHECK (metadata_url = NULL::text OR char_length(metadata_url) > 0),
attribute_mapping jsonb,
created_at timestamp with time zone,
updated_at timestamp with time zone,
name_id_format text,
CONSTRAINT saml_providers_pkey PRIMARY KEY (id),
CONSTRAINT saml_providers_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id)
);
CREATE TABLE auth.saml_relay_states (
id uuid NOT NULL,
sso_provider_id uuid NOT NULL,
request_id text NOT NULL CHECK (char_length(request_id) > 0),
for_email text,
redirect_to text,
created_at timestamp with time zone,
updated_at timestamp with time zone,
flow_state_id uuid,
CONSTRAINT saml_relay_states_pkey PRIMARY KEY (id),
CONSTRAINT saml_relay_states_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id),
CONSTRAINT saml_relay_states_flow_state_id_fkey FOREIGN KEY (flow_state_id) REFERENCES auth.flow_state(id)
);
CREATE TABLE auth.schema_migrations (
version character varying NOT NULL,
CONSTRAINT schema_migrations_pkey PRIMARY KEY (version)
);
CREATE TABLE auth.sessions (
id uuid NOT NULL,
user_id uuid NOT NULL,
created_at timestamp with time zone,
updated_at timestamp with time zone,
factor_id uuid,
aal USER-DEFINED,
not_after timestamp with time zone,
refreshed_at timestamp without time zone,
user_agent text,
ip inet,
tag text,
CONSTRAINT sessions_pkey PRIMARY KEY (id),
CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE auth.sso_domains (
id uuid NOT NULL,
sso_provider_id uuid NOT NULL,
domain text NOT NULL CHECK (char_length(domain) > 0),
created_at timestamp with time zone,
updated_at timestamp with time zone,
CONSTRAINT sso_domains_pkey PRIMARY KEY (id),
CONSTRAINT sso_domains_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id)
);
CREATE TABLE auth.sso_providers (
id uuid NOT NULL,
resource_id text CHECK (resource_id = NULL::text OR char_length(resource_id) > 0),
created_at timestamp with time zone,
updated_at timestamp with time zone,
CONSTRAINT sso_providers_pkey PRIMARY KEY (id)
);
CREATE TABLE auth.users (
instance_id uuid,
id uuid NOT NULL,
aud character varying,
role character varying,
email character varying,
encrypted_password character varying,
email_confirmed_at timestamp with time zone,
invited_at timestamp with time zone,
confirmation_token character varying,
confirmation_sent_at timestamp with time zone,
recovery_token character varying,
recovery_sent_at timestamp with time zone,
email_change_token_new character varying,
email_change character varying,
email_change_sent_at timestamp with time zone,
last_sign_in_at timestamp with time zone,
raw_app_meta_data jsonb,
raw_user_meta_data jsonb,
is_super_admin boolean,
created_at timestamp with time zone,
updated_at timestamp with time zone,
phone text DEFAULT NULL::character varying UNIQUE,
phone_confirmed_at timestamp with time zone,
phone_change text DEFAULT ''::character varying,
phone_change_token character varying DEFAULT ''::character varying,
phone_change_sent_at timestamp with time zone,
confirmed_at timestamp with time zone DEFAULT LEAST(email_confirmed_at, phone_confirmed_at),
email_change_token_current character varying DEFAULT ''::character varying,
email_change_confirm_status smallint DEFAULT 0 CHECK (email_change_confirm_status >= 0 AND email_change_confirm_status <= 2),
banned_until timestamp with time zone,
reauthentication_token character varying DEFAULT ''::character varying,
reauthentication_sent_at timestamp with time zone,
is_sso_user boolean NOT NULL DEFAULT false,
deleted_at timestamp with time zone,
is_anonymous boolean NOT NULL DEFAULT false,
CONSTRAINT users_pkey PRIMARY KEY (id)
);

# Sql functions

## admin_fix_user_tier

### Description

An administrative function to recalculate and correct a user's subscription tier based on their active subscriptions. It returns the tier before and after the fix, along with a list of their active subscriptions.

### Parameters

user_profile_id (uuid): The unique identifier for the user's profile.

### Returns

A table with the following columns:

old_tier (text): The user's subscription tier before the function was executed.

new_tier (text): The user's subscription tier after recalculation.

active_subscriptions (text[]): An array of strings describing the user's active subscriptions.

### Definition

CREATE OR REPLACE FUNCTION public.admin_fix_user_tier(user_profile_id uuid)
RETURNS TABLE(old_tier text, new_tier text, active_subscriptions text[])
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
old_tier_val TEXT;
new_tier_val TEXT;
active_subs TEXT[];
BEGIN
-- Get current tier
SELECT sp.subscription_tier::TEXT INTO old_tier_val
FROM public.student_profiles sp
WHERE sp.profile_id = user_profile_id;

-- Get active subscriptions
SELECT ARRAY_AGG(prod.tier_key || ' (' || ss.stripe_subscription_id || ')')
INTO active_subs
FROM public.student_subscriptions ss
JOIN public.prices pr ON ss.price_id = pr.id
JOIN public.products prod ON pr.product_id = prod.id
WHERE ss.profile_id = user_profile_id
AND ss.status IN ('active', 'trialing')
AND (ss.ended_at IS NULL OR ss.ended_at > NOW());

-- Update tier
new_tier_val := public.update_user_subscription_tier(user_profile_id);

RETURN QUERY SELECT old_tier_val, new_tier_val, COALESCE(active_subs, ARRAY[]::TEXT[]);
END;
$function$

## check_and_award_unit_completion_bonus

### Description

Checks if a user has completed all required lessons in a unit. If the unit is newly completed, it awards points for UNIT_COMPLETION. It then proceeds to check if this unit completion also leads to a level completion, awarding LEVEL_COMPLETION points if applicable.

### Parameters

profile_id_param (uuid): The unique identifier for the user's profile.

unit_id_param (integer): The ID of the unit being checked.

triggering_lesson_id_param (integer): The ID of the lesson that triggered this check.

### Returns

void - This function does not return a value.

### Definition

CREATE OR REPLACE FUNCTION public.check_and_award_unit_completion_bonus(profile_id_param uuid, unit_id_param integer, triggering_lesson_id_param integer)
RETURNS void
LANGUAGE plpgsql
AS $function$
DECLARE
-- ### FIX: Changed variable type from TEXT to level_enum ###
v_level_code public.level_enum;
is_unit_now_completed BOOLEAN;
is_level_now_completed BOOLEAN;
BEGIN
-- Check if a UNIT_COMPLETION bonus was already given for any lesson within this unit.
IF EXISTS (
SELECT 1 FROM public.user_points_log
WHERE profile_id = profile_id_param
AND reason_code = 'UNIT_COMPLETION'
AND related_lesson_id IN (SELECT lesson_id FROM public.lessons WHERE unit_id = unit_id_param)
) THEN
RETURN;
END IF;

    is_unit_now_completed := public.is_unit_complete(profile_id_param, unit_id_param);

    IF is_unit_now_completed THEN
        -- Award unit completion points, logging the lesson ID that triggered it.
        INSERT INTO public.user_points_log (profile_id, points_awarded, reason_code, related_lesson_id)
        VALUES (profile_id_param, 25, 'UNIT_COMPLETION', triggering_lesson_id_param);

        UPDATE public.student_profiles SET points = points + 25 WHERE profile_id = profile_id_param;

        -- Now, check for level completion.
        SELECT u.level INTO v_level_code FROM public.units u WHERE u.unit_id = unit_id_param;

        -- Check if a LEVEL_COMPLETION bonus was already given for any lesson within this level.
        IF NOT EXISTS (
            SELECT 1 FROM public.user_points_log
            WHERE profile_id = profile_id_param
              AND reason_code = 'LEVEL_COMPLETION'
              AND related_lesson_id IN (
                  SELECT l.lesson_id FROM public.lessons l
                  JOIN public.units u ON l.unit_id = u.unit_id
                  WHERE u.level = v_level_code -- This comparison is now valid (level_enum = level_enum)
              )
        ) THEN
            is_level_now_completed := NOT EXISTS (
                SELECT 1 FROM public.units u
                WHERE u.level = v_level_code -- This comparison is now valid (level_enum = level_enum)
                AND NOT public.is_unit_complete(profile_id_param, u.unit_id)
            );

            IF is_level_now_completed THEN
                -- Award level completion points, logging the lesson ID that triggered it.
                INSERT INTO public.user_points_log (profile_id, points_awarded, reason_code, related_lesson_id)
                VALUES (profile_id_param, 100, 'LEVEL_COMPLETION', triggering_lesson_id_param);

                UPDATE public.student_profiles SET points = points + 100 WHERE profile_id = profile_id_param;
            END IF;
        END IF;
    END IF;

END;
$function$;

## cleanup_user_subscriptions

### Description

A maintenance function that marks expired subscriptions as 'canceled' and then recalculates the user's overall subscription tier to ensure it's accurate.

### Parameters

user_profile_id (uuid): The unique identifier for the user whose subscriptions need cleanup.

### Returns

text - The new, recalculated subscription tier for the user.

### Definition

CREATE OR REPLACE FUNCTION public.cleanup_user_subscriptions(user_profile_id uuid)
RETURNS text
LANGUAGE plpgsql
AS $function$
DECLARE
new_tier TEXT;
BEGIN
-- Mark expired subscriptions as ended if they're not already
UPDATE public.student_subscriptions
SET
status = 'canceled',
ended_at = COALESCE(ended_at, NOW()),
updated_at = NOW()
WHERE profile_id = user_profile_id
AND status IN ('active', 'trialing')
AND current_period_end < NOW();

-- Update user's subscription tier based on remaining active subscriptions
new_tier := public.update_user_subscription_tier(user_profile_id);

RETURN new_tier;
END;
$function$

## get_user_billing_summary

### Description

Retrieves a summary of a user's billing information, including their current subscription tier, the number of active subscriptions, the next billing date, the total monthly cost, and whether they have a payment method on file.

### Parameters

user_profile_id (uuid): The unique identifier for the user's profile.

### Returns

A table with the following columns:

current_tier (text): The user's current subscription tier.

active_subscriptions_count (integer): The number of active or trialing subscriptions.

next_billing_date (timestamp with time zone): The earliest upcoming billing date for active subscriptions.

monthly_amount (integer): The sum of monthly subscription costs.

has_payment_method (boolean): true if the user has a default payment method stored.

### Definition

CREATE OR REPLACE FUNCTION public.get_user_billing_summary(user_profile_id uuid)
RETURNS TABLE(current_tier text, active_subscriptions_count integer, next_billing_date timestamp with time zone, monthly_amount integer, has_payment_method boolean)
LANGUAGE plpgsql
AS $function$
BEGIN
RETURN QUERY
SELECT
sp.subscription_tier::TEXT as current_tier,
(
SELECT COUNT(\*)::INTEGER
FROM public.student_subscriptions ss
WHERE ss.profile_id = user_profile_id
AND ss.status IN ('active', 'trialing')
AND (ss.ended_at IS NULL OR ss.ended_at > NOW())
) as active_subscriptions_count,
(
SELECT MIN(ss.current_period_end)
FROM public.student_subscriptions ss
WHERE ss.profile_id = user_profile_id
AND ss.status IN ('active', 'trialing')
AND (ss.ended_at IS NULL OR ss.ended_at > NOW())
) as next_billing_date,
(
SELECT SUM(pr.unit_amount)::INTEGER
FROM public.student_subscriptions ss
JOIN public.prices pr ON ss.price_id = pr.id
WHERE ss.profile_id = user_profile_id
AND ss.status IN ('active', 'trialing')
AND (ss.ended_at IS NULL OR ss.ended_at > NOW())
AND pr.billing_interval = 'month'
) as monthly_amount,
(sp.default_payment_method_details IS NOT NULL) as has_payment_method
FROM public.student_profiles sp
WHERE sp.profile_id = user_profile_id;
END;
$function$

## get_user_highest_tier

### Description

Determines the highest subscription tier ('pro', 'starter', or 'free') a user is entitled to based on their currently active subscriptions.

### Parameters

user_profile_id (uuid): The unique identifier for the user's profile.

### Returns

text - The highest active subscription tier ('pro', 'starter', or 'free'). Defaults to 'free' if no active subscriptions are found.

### Definition

CREATE OR REPLACE FUNCTION public.get_user_highest_tier(user_profile_id uuid)
RETURNS text
LANGUAGE plpgsql
AS $function$
DECLARE
highest_tier TEXT := 'free';
tier_record RECORD;
BEGIN
-- Check for active subscriptions and find the highest tier
FOR tier_record IN
SELECT p.tier_key
FROM public.student_subscriptions ss
JOIN public.prices pr ON ss.price_id = pr.id
JOIN public.products p ON pr.product_id = p.id
WHERE ss.profile_id = user_profile_id
AND ss.status IN ('active', 'trialing')
AND (ss.ended_at IS NULL OR ss.ended_at > NOW())
ORDER BY
CASE p.tier_key
WHEN 'pro' THEN 3
WHEN 'starter' THEN 2
WHEN 'free' THEN 1
ELSE 0
END DESC
LIMIT 1
LOOP
highest_tier := tier_record.tier_key;
EXIT;
END LOOP;

RETURN highest_tier;
END;
$function$

## handle_new_user_profile

### Description

A trigger function that automatically runs when a new user signs up (a new row is added to auth.users). It populates the public.profiles and public.student_profiles tables with the new user's information, setting their initial subscription tier to 'free'.

### Parameters

None. This is a trigger function that operates on the NEW record.

### Returns

trigger - Returns the NEW record to be inserted into the auth.users table.

### Definition

CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
-- Create entry in public.profiles with proper name extraction
INSERT INTO public.profiles (id, first_name, last_name)
VALUES (
NEW.id,
COALESCE(
NEW.raw_user_meta_data->>'first_name',
NEW.raw_user_meta_data->>'given_name',
SPLIT_PART(NEW.raw_user_meta_data->>'full_name', ' ', 1),
SPLIT_PART(NEW.raw_user_meta_data->>'name', ' ', 1)
),
COALESCE(
NEW.raw_user_meta_data->>'last_name',
NEW.raw_user_meta_data->>'family_name',
CASE
WHEN NEW.raw_user_meta_data->>'full_name' IS NOT NULL
THEN TRIM(SUBSTRING(NEW.raw_user_meta_data->>'full_name' FROM POSITION(' ' IN NEW.raw_user_meta_data->>'full_name') + 1))
WHEN NEW.raw_user_meta_data->>'name' IS NOT NULL
THEN TRIM(SUBSTRING(NEW.raw_user_meta_data->>'name' FROM POSITION(' ' IN NEW.raw_user_meta_data->>'name') + 1))
ELSE NULL
END
)
);

-- Create corresponding entry in public.student_profiles with free tier
INSERT INTO public.student_profiles (
profile_id,
status,
subscription_tier
)
VALUES (
NEW.id,
'active'::public.account_status_enum,
'free'::public.subscription_tier_enum
);

RETURN NEW;
END;
$function$

## handle_subscription_tier_conflict

### Description

Manages subscription conflicts. Specifically, if a user upgrades to the 'pro' tier, this function automatically cancels any existing 'starter' subscriptions to prevent redundant billing.

### Parameters

user_profile_id (uuid): The unique identifier for the user's profile.

new_tier (subscription_tier_enum): The new subscription tier the user is acquiring.

### Returns

void - This function does not return a value.

### Definition

CREATE OR REPLACE FUNCTION public.handle_subscription_tier_conflict(user_profile_id uuid, new_tier subscription_tier_enum)
RETURNS void
LANGUAGE plpgsql
AS $function$
DECLARE
existing_sub RECORD;
BEGIN
-- If upgrading to pro, cancel any active starter subscriptions
IF new_tier = 'pro' THEN
FOR existing_sub IN
SELECT ss.stripe_subscription_id
FROM public.student_subscriptions ss
JOIN public.prices pr ON ss.price_id = pr.id
JOIN public.products p ON pr.product_id = p.id
WHERE ss.profile_id = user_profile_id
AND p.tier_key = 'starter'
AND ss.status IN ('active', 'trialing')
AND (ss.ended_at IS NULL OR ss.ended_at > NOW())
LOOP
-- Mark the subscription as canceled
UPDATE public.student_subscriptions
SET
status = 'canceled',
cancel_at_period_end = true,
canceled_at = NOW(),
updated_at = NOW()
WHERE stripe_subscription_id = existing_sub.stripe_subscription_id;

      -- Log that this subscription was auto-canceled due to upgrade
      INSERT INTO public.user_points_log (profile_id, points_awarded, reason_code, notes)
      VALUES (user_profile_id, 0, 'SUBSCRIPTION_UPGRADE_CANCELLATION',
              'Starter subscription auto-canceled due to Pro upgrade: ' || existing_sub.stripe_subscription_id);
    END LOOP;

END IF;
END;
$function$

## handle_user_word_pronunciation_update

### Description

A core function for tracking a user's pronunciation progress on a per-word basis. It upserts a record in user_word_pronunciation with detailed statistics from a user's attempt, including accuracy scores and error types, and determines if the word needs_practice.

### Parameters

profile_id_param (uuid): The unique identifier for the user's profile.

language_code_param (character varying): The language code for the word (e.g., 'en-US').

word_data (jsonb): A JSON object containing details of the pronunciation attempt, including word, accuracyScore, and errorType.

### Returns

void - This function does not return a value.

### Definition

CREATE OR REPLACE FUNCTION public.handle_user_word_pronunciation_update(profile_id_param uuid, language_code_param character varying, word_data jsonb)
RETURNS void
LANGUAGE plpgsql
AS $function$
DECLARE
v_word_text TEXT := lower(word_data->>'word');
v_accuracy_score NUMERIC := (word_data->>'accuracyScore')::NUMERIC;
v_error_type TEXT := word_data->>'errorType';
v_error_increment INT;
BEGIN
-- Exit if essential data is missing
IF v_word_text IS NULL OR v_accuracy_score IS NULL THEN
RETURN;
END IF;

    -- Determine if the attempt had an error
    v_error_increment := CASE WHEN v_error_type IS NOT NULL AND v_error_type <> 'None' THEN 1 ELSE 0 END;

    -- Upsert the word pronunciation record, setting `needs_practice` based on the CURRENT attempt's score.
    INSERT INTO public.user_word_pronunciation (
        profile_id, word_text, language_code, total_attempts, error_count,
        sum_accuracy_score, average_accuracy_score, last_accuracy_score,
        last_error_type, last_attempt_at, updated_at, needs_practice
    )
    VALUES (
        profile_id_param, v_word_text, language_code_param, 1, v_error_increment,
        v_accuracy_score, v_accuracy_score, v_accuracy_score, v_error_type,
        NOW(), NOW(), (v_accuracy_score < 70) -- Correct logic on insert
    )
    ON CONFLICT (profile_id, word_text, language_code) DO UPDATE
    SET
        total_attempts = user_word_pronunciation.total_attempts + 1,
        error_count = user_word_pronunciation.error_count + v_error_increment,
        sum_accuracy_score = user_word_pronunciation.sum_accuracy_score + v_accuracy_score,
        average_accuracy_score = (user_word_pronunciation.sum_accuracy_score + v_accuracy_score) / (user_word_pronunciation.total_attempts + 1),
        last_accuracy_score = v_accuracy_score,
        last_error_type = v_error_type,
        last_attempt_at = NOW(),
        updated_at = NOW(),
        needs_practice = (v_accuracy_score < 70); -- Correct logic on update

END;
$function$

## is_unit_complete

CREATE OR REPLACE FUNCTION public.is*unit_complete(p_profile_id uuid, p_unit_id integer)
RETURNS boolean
LANGUAGE sql
STABLE
AS $function$
SELECT
-- A unit is complete if it has lessons and none of them are incomplete.
(SELECT COUNT(*) FROM public.lessons WHERE unit*id = p_unit_id) > 0
AND
(
SELECT COUNT(*)
FROM public.lessons l
WHERE l.unit_id = p_unit_id
AND NOT public.is_lesson_complete(p_profile_id, l.lesson_id)
) = 0;
$function$;

## is_lesson_complete

-- NEW HELPER FUNCTION: is_lesson_complete
-- Centralizes the logic for checking if a single lesson is complete.
-- Used by `is_unit_complete`, `can_user_access_lesson`, and `get_user_progression_status`.
CREATE OR REPLACE FUNCTION public.is_lesson_complete(p_profile_id uuid, p_lesson_id integer)
RETURNS boolean
LANGUAGE sql
STABLE
AS $function$
SELECT EXISTS (
SELECT 1
FROM public.user_lesson_progress ulp
JOIN public.user_lesson_activity_progress ulap ON ulap.user_lesson_progress_id = ulp.progress_id
JOIN public.lessons l ON l.lesson_id = ulp.lesson_id
WHERE ulp.profile_id = p_profile_id
AND ulp.lesson_id = p_lesson_id
GROUP BY l.lesson_id -- Group by lesson to count activities for that specific lesson
HAVING COUNT(CASE WHEN ulap.status = 'completed' THEN 1 END) =
(
CASE WHEN l.has_chat THEN 1 ELSE 0 END +
CASE WHEN l.has_pronunciation THEN 1 ELSE 0 END +
CASE WHEN l.has_dictation THEN 1 ELSE 0 END
)
);
$function$;

## can_user_access_unit

-- ========== CORE ACCESS-CONTROL FUNCTIONS (IMPROVED) ==========

-- UPDATED FUNCTION: can_user_access_unit
-- Added a robustness check to handle non-existent unit_id_param.
CREATE OR REPLACE FUNCTION public.can_user_access_unit(profile_id_param uuid, unit_id_param integer)
RETURNS boolean
LANGUAGE plpgsql
AS $function$
DECLARE
unit_level level_enum;
previous_unit_id integer;
BEGIN
-- Get the level of the requested unit
SELECT u.level INTO unit_level FROM public.units u WHERE u.unit_id = unit_id_param;

    -- Robustness: If the unit doesn't exist, access is denied.
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    -- Check if user can access this level (Assuming can_user_access_level exists)
    IF NOT public.can_user_access_level(profile_id_param, unit_level) THEN
        RETURN FALSE;
    END IF;

    -- Find the previous unit in the same level (by unit_order)
    SELECT u.unit_id INTO previous_unit_id
    FROM public.units u
    WHERE u.level = unit_level
      AND u.unit_order < (SELECT u_inner.unit_order FROM public.units u_inner WHERE u_inner.unit_id = unit_id_param)
    ORDER BY u.unit_order DESC
    LIMIT 1;

    -- If no previous unit, this is the first unit in the level (accessible)
    IF previous_unit_id IS NULL THEN
        RETURN TRUE;
    END IF;

    -- Check if the previous unit is completed
    RETURN public.is_unit_complete(profile_id_param, previous_unit_id);

END;
$function$;

## can_user_access_lesson

-- UPDATED FUNCTION: can_user_access_lesson
-- Now uses the `is_lesson_complete` helper and has a robustness check.
CREATE OR REPLACE FUNCTION public.can_user_access_lesson(profile_id_param uuid, lesson_id_param integer)
RETURNS boolean
LANGUAGE plpgsql
AS $function$
DECLARE
lesson_unit_id integer;
previous_lesson_id integer;
BEGIN
-- Get the unit of the requested lesson
SELECT l.unit_id INTO lesson_unit_id FROM public.lessons l WHERE l.lesson_id = lesson_id_param;

    -- Robustness: If the lesson doesn't exist, access is denied.
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    -- Check if user can access the parent unit
    IF NOT public.can_user_access_unit(profile_id_param, lesson_unit_id) THEN
        RETURN FALSE;
    END IF;

    -- Find the previous lesson in the same unit (by lesson_order)
    SELECT l.lesson_id INTO previous_lesson_id
    FROM public.lessons l
    WHERE l.unit_id = lesson_unit_id
      AND l.lesson_order < (SELECT l_inner.lesson_order FROM public.lessons l_inner WHERE l_inner.lesson_id = lesson_id_param)
    ORDER BY l.lesson_order DESC
    LIMIT 1;

    -- If no previous lesson, this is the first lesson in the unit (accessible)
    IF previous_lesson_id IS NULL THEN
        RETURN TRUE;
    END IF;

    -- Check if previous lesson is completed using the helper function
    RETURN public.is_lesson_complete(profile_id_param, previous_lesson_id);

END;
$function$;

## get_user_progression_status

-- ========== UI STATUS FUNCTION (PERFORMANCE OPTIMIZED) ==========

-- REWRITTEN FUNCTION: get*user_progression_status
-- This version avoids calling functions for every row, leading to a massive performance gain.
-- It uses CTEs and Window Functions to calculate all statuses in a single pass.
CREATE OR REPLACE FUNCTION public.get_user_progression_status(profile_id_param uuid)
RETURNS TABLE(
level_code level_enum,
level_available boolean,
unit_id integer,
unit_available boolean,
lesson_id integer,
lesson_available boolean,
lesson_completed boolean
)
LANGUAGE plpgsql
AS $function$
BEGIN
RETURN QUERY
WITH lesson_completion AS (
-- Step 1: Determine the completion status for every lesson for the user.
SELECT
l.lesson_id,
COALESCE(lc.is_completed, FALSE) AS is_completed
FROM public.lessons l
LEFT JOIN (
SELECT
ulp.lesson_id,
(COUNT(CASE WHEN ulap.status = 'completed' THEN 1 END) =
(CASE WHEN l_inner.has_chat THEN 1 ELSE 0 END +
CASE WHEN l_inner.has_pronunciation THEN 1 ELSE 0 END +
CASE WHEN l_inner.has_dictation THEN 1 ELSE 0 END)
) AS is_completed
FROM public.user_lesson_progress ulp
JOIN public.user_lesson_activity_progress ulap ON ulap.user_lesson_progress_id = ulp.progress_id
JOIN public.lessons l_inner ON l_inner.lesson_id = ulp.lesson_id
WHERE ulp.profile_id = profile_id_param
GROUP BY ulp.lesson_id, l_inner.has_chat, l_inner.has_pronunciation, l_inner.has_dictation
) lc ON l.lesson_id = lc.lesson_id
),
unit_completion AS (
-- Step 2: Determine the completion status for every unit based on its lessons.
SELECT
u.unit_id,
(COUNT(l.lesson_id) > 0 AND bool_and(lc.is_completed)) as is_completed
FROM public.units u
JOIN public.lessons l ON u.unit_id = l.unit_id
JOIN lesson_completion lc ON l.lesson_id = lc.lesson_id
GROUP BY u.unit_id
),
progression_data AS (
-- Step 3: Combine all data and use window functions to find previous item status.
SELECT
u.level,
u.unit_id,
u.unit_order,
l.lesson_id,
l.lesson_order,
lc.is_completed AS lesson_is_completed,
-- Check if the \_previous* lesson in the same unit was completed. Default to TRUE for the first lesson.
LAG(lc.is*completed, 1, TRUE) OVER (PARTITION BY l.unit_id ORDER BY l.lesson_order) AS prev_lesson_completed,
-- Check if the \_previous* unit in the same level was completed. Default to TRUE for the first unit.
LAG(uc.is_completed, 1, TRUE) OVER (PARTITION BY u.level ORDER BY u.unit_order) AS prev_unit_completed
FROM public.units u
JOIN public.lessons l ON u.unit_id = l.unit_id
LEFT JOIN lesson_completion lc ON l.lesson_id = lc.lesson_id
LEFT JOIN unit_completion uc ON u.unit_id = uc.unit_id
)
-- Final Step: Calculate availability based on the chain of completion.
SELECT
pd.level,
(pd.level IN (SELECT unnest(public.get_user_available_levels(profile_id_param)))) AS level_available,
pd.unit_id,
((pd.level IN (SELECT unnest(public.get_user_available_levels(profile_id_param)))) AND pd.prev_unit_completed) AS unit_available,
pd.lesson_id,
((pd.level IN (SELECT unnest(public.get_user_available_levels(profile_id_param)))) AND pd.prev_unit_completed AND pd.prev_lesson_completed) AS lesson_available,
pd.lesson_is_completed
FROM progression_data pd
JOIN public.units u ON u.unit_id = pd.unit_id
JOIN public.lessons l ON l.lesson_id = pd.lesson_id
ORDER BY
(SELECT sort_order FROM public.language_levels WHERE language_levels.level_code = u.level),
u.unit_order,
l.lesson_order;
END;
$function$;

## process_chat_completion

### Description

Marks the chat activity for a given lesson as complete. It awards points for this completion (if not already awarded) and then triggers a check to see if this completes the entire unit or level, potentially awarding further bonuses.

### Parameters

profile_id_param (uuid): The unique identifier for the user's profile.

lesson_id_param (integer): The ID of the lesson containing the chat activity.

language_code_param (character varying): The language code for the lesson.

### Returns

A table with the following column:

points_awarded_total (integer): The total number of points awarded for this action.

### Definition

CREATE OR REPLACE FUNCTION public.process_chat_completion(profile_id_param uuid, lesson_id_param integer, language_code_param character varying)
RETURNS TABLE(points_awarded_total integer)
LANGUAGE plpgsql
AS $function$
DECLARE
v_lesson_progress_id INT;
v_unit_id INT;
was_already_completed BOOLEAN;
total_points_awarded INT := 0;
BEGIN
-- Check if chat completion points were already awarded for this lesson
SELECT EXISTS(
SELECT 1 FROM public.user_points_log
WHERE profile_id = profile_id_param
AND related_lesson_id = lesson_id_param
AND reason_code = 'CHAT_COMPLETION'
) INTO was_already_completed;

    -- If already completed, return 0 points
    IF was_already_completed THEN
        RETURN QUERY SELECT 0;
        RETURN;
    END IF;

    -- Ensure user_lesson_progress exists
    INSERT INTO public.user_lesson_progress (profile_id, lesson_id, last_progress_at)
    VALUES (profile_id_param, lesson_id_param, NOW())
    ON CONFLICT (profile_id, lesson_id) DO UPDATE SET last_progress_at = NOW();

    SELECT progress_id INTO v_lesson_progress_id
    FROM public.user_lesson_progress
    WHERE profile_id = profile_id_param AND lesson_id = lesson_id_param;

    -- Mark chat activity as completed
    INSERT INTO public.user_lesson_activity_progress (user_lesson_progress_id, activity_type, status, completed_at)
    VALUES (v_lesson_progress_id, 'chat', 'completed', NOW())
    ON CONFLICT (user_lesson_progress_id, activity_type)
    DO UPDATE SET status = 'completed', completed_at = NOW();

    -- Award 5 points for chat completion
    total_points_awarded := 5;

    INSERT INTO public.user_points_log (profile_id, points_awarded, reason_code, related_lesson_id, activity_type)
    VALUES (profile_id_param, 5, 'CHAT_COMPLETION', lesson_id_param, 'chat');

    -- Update user's total points
    UPDATE public.student_profiles
    SET points = points + 5
    WHERE profile_id = profile_id_param;

    -- Check for unit completion bonus
    SELECT unit_id INTO v_unit_id FROM public.lessons WHERE lesson_id = lesson_id_param;
    PERFORM public.check_and_award_unit_completion_bonus(profile_id_param, v_unit_id, lesson_id_param);

    RETURN QUERY SELECT total_points_awarded;

END;
$function$

## process_user_activity

### Description

A comprehensive function that acts as the main entry point for processing all user activity within a lesson. On the first user activity of the day, it calls the handle_user_streak function to award a daily streak bonus. It then handles different activity types ('pronunciation', 'dictation', 'chat'), records attempts, calculates and awards various points bonuses (first-try, accuracy, comeback), updates user progress at the word, phrase, and activity level, and triggers checks for unit completion.

### Parameters

profile_id_param (uuid): The user's profile ID.

lesson_id_param (integer): The lesson ID.

language_code_param (character varying): The language code.

activity_type_param (activity_type_enum): The type of activity ('pronunciation', 'dictation', 'chat').

phrase_id_param (integer, optional): The phrase ID (required for pronunciation/dictation).

reference_text_param (text, optional): The correct text of the phrase.

recognized_text_param (text, optional): The text recognized by speech-to-text.

accuracy_score_param (numeric, optional): Accuracy score from speech analysis.

fluency_score_param (numeric, optional): Fluency score from speech analysis.

completeness_score_param (numeric, optional): Completeness score from speech analysis.

pronunciation_score_param (numeric, optional): Overall pronunciation score from speech analysis.

prosody_score_param (numeric, optional): Prosody score from speech analysis.

phonetic_data_param (jsonb, optional): Detailed word-level feedback from speech analysis.

written_text_param (text, optional): The text submitted by the user for dictation.

overall_similarity_score_param (numeric, optional): Similarity score for dictation.

word_level_feedback_param (jsonb, optional): Word-level feedback for dictation.

### Returns

A table with the following column:

points_awarded_total (integer): The total number of points awarded for the activity, including any streak bonuses.

### Definition

DECLARE
-- IDs and Metadata
v_lesson_progress_id INT;
v_activity_progress_id INT;
v_unit_id INT;

    -- Attempt & Progress Tracking
    next_attempt_number INT;
    was_phrase_already_completed BOOLEAN;
    is_phrase_now_completed BOOLEAN;
    was_activity_already_completed BOOLEAN;
    total_phrases_in_lesson INT;
    phrases_completed_for_activity INT;
    v_score NUMERIC;

    -- Points
    total_points_for_this_attempt INT := 0;

    -- Word-level loop variables (for pronunciation)
    word_record JSONB;
    v_word_text TEXT;
    v_accuracy_score NUMERIC;
    word_needs_practice BOOLEAN;

    -- No longer need streak variables here

BEGIN
-- --- ADDED ---
-- Step 1: Handle Daily Streak Bonus (now robust and centralized)
-- This function will only award points once per day on the first activity.
total_points_for_this_attempt := total_points_for_this_attempt + public.handle_user_streak(profile_id_param);

    -- Step 2: Ensure user_lesson_progress exists for all activity types
    INSERT INTO public.user_lesson_progress (profile_id, lesson_id, last_progress_at)
    VALUES (profile_id_param, lesson_id_param, NOW())
    ON CONFLICT (profile_id, lesson_id) DO UPDATE SET last_progress_at = NOW()
    RETURNING progress_id INTO v_lesson_progress_id;

    IF v_lesson_progress_id IS NULL THEN
      SELECT progress_id INTO v_lesson_progress_id FROM public.user_lesson_progress
      WHERE profile_id = profile_id_param AND lesson_id = lesson_id_param;
    END IF;

    -- Step 3: Handle activity progress creation for all activity types
    SELECT activity_progress_id, (status = 'completed')
    INTO v_activity_progress_id, was_activity_already_completed
    FROM public.user_lesson_activity_progress
    WHERE user_lesson_progress_id = v_lesson_progress_id AND activity_type = activity_type_param;

    IF v_activity_progress_id IS NULL THEN
        INSERT INTO public.user_lesson_activity_progress (user_lesson_progress_id, activity_type, status, started_at)
        VALUES (v_lesson_progress_id, activity_type_param, 'in_progress', NOW())
        RETURNING activity_progress_id INTO v_activity_progress_id;
        was_activity_already_completed := FALSE;
    END IF;

    -- Step 4: Handle chat activity (no phrase_id required)
    IF activity_type_param = 'chat' THEN
        -- The streak logic that was here is now handled at the start of the function.
        -- We only need to handle the final point update and return.

        -- Update total points if any were awarded from the streak
        IF total_points_for_this_attempt > 0 THEN
            UPDATE public.student_profiles SET points = points + total_points_for_this_attempt
            WHERE profile_id = profile_id_param;
        END IF;

        RETURN QUERY SELECT total_points_for_this_attempt;
        RETURN;
    END IF;

    -- Existing logic for pronunciation and dictation (requires phrase_id)
    IF phrase_id_param IS NULL THEN
        RAISE EXCEPTION 'phrase_id_param is required for % activity', activity_type_param;
    END IF;

    -- #############################################################
    -- ### NECESSARY CORRECTION ADDED HERE ###
    -- #############################################################
    -- Ensure the provided phrase_id is actually part of the provided lesson_id
    IF NOT EXISTS (
        SELECT 1
        FROM public.lesson_phrases
        WHERE lesson_id = lesson_id_param AND phrase_id = phrase_id_param
    ) THEN
        RAISE EXCEPTION 'Phrase ID % is not part of Lesson ID %.', phrase_id_param, lesson_id_param;
    END IF;
    -- #############################################################

    -- Step 5: Insert the specific attempt record
    IF activity_type_param = 'pronunciation' THEN
        -- ... (rest of the function remains the same)
        SELECT COALESCE(MAX(attempt_number), 0) + 1 INTO next_attempt_number FROM public.speech_attempts WHERE profile_id = profile_id_param AND lesson_id = lesson_id_param AND phrase_id = phrase_id_param;
        INSERT INTO public.speech_attempts (profile_id, lesson_id, phrase_id, language_code, attempt_number, reference_text, recognized_text, accuracy_score, fluency_score, completeness_score, pronunciation_score, prosody_score, phonetic_data) VALUES (profile_id_param, lesson_id_param, phrase_id_param, language_code_param, next_attempt_number, reference_text_param, recognized_text_param, accuracy_score_param, fluency_score_param, completeness_score_param, pronunciation_score_param, prosody_score_param, phonetic_data_param);
        v_score := accuracy_score_param;
    ELSIF activity_type_param = 'dictation' THEN
        SELECT COALESCE(MAX(attempt_number), 0) + 1 INTO next_attempt_number FROM public.dictation_attempts WHERE profile_id = profile_id_param AND lesson_id = lesson_id_param AND phrase_id = phrase_id_param;
        INSERT INTO public.dictation_attempts (profile_id, lesson_id, phrase_id, language_code, attempt_number, reference_text, written_text, overall_similarity_score, word_level_feedback) VALUES (profile_id_param, lesson_id_param, phrase_id_param, language_code_param, next_attempt_number, reference_text_param, written_text_param, overall_similarity_score_param, word_level_feedback_param);
        v_score := overall_similarity_score_param;
    END IF;

    -- Step 6: Handle word-level analytics (for pronunciation only)
    -- ... (logic remains the same)
    IF activity_type_param = 'pronunciation' AND jsonb_typeof(phonetic_data_param->'words') = 'array' THEN
        FOR word_record IN SELECT * FROM jsonb_array_elements(phonetic_data_param->'words') LOOP
            v_word_text := lower(word_record->>'word');
            v_accuracy_score := (word_record->>'accuracyScore')::numeric;
            IF v_word_text IS NOT NULL AND v_accuracy_score IS NOT NULL THEN
                SELECT needs_practice INTO word_needs_practice FROM public.user_word_pronunciation WHERE profile_id = profile_id_param AND word_text = v_word_text AND language_code = language_code_param;
                IF COALESCE(word_needs_practice, false) AND v_accuracy_score >= 70 THEN
                    total_points_for_this_attempt := total_points_for_this_attempt + 1;
                    INSERT INTO public.user_points_log (profile_id, points_awarded, reason_code, related_word_text, related_word_language_code, related_phrase_id, activity_type) VALUES (profile_id_param, 1, 'COMEBACK_BONUS', v_word_text, language_code_param, phrase_id_param, 'pronunciation');
                END IF;
                PERFORM public.handle_user_word_pronunciation_update(profile_id_param, language_code_param, word_record);
            END IF;
        END LOOP;
    END IF;

    -- Step 7: Upsert phrase progress & handle phrase-level bonuses
    -- ... (logic remains the same)
    is_phrase_now_completed := (v_score >= 70);
    IF activity_type_param = 'pronunciation' THEN
        SELECT pronunciation_completed INTO was_phrase_already_completed FROM public.user_phrase_progress WHERE profile_id = profile_id_param AND lesson_id = lesson_id_param AND phrase_id = phrase_id_param;
    ELSIF activity_type_param = 'dictation' THEN
        SELECT dictation_completed INTO was_phrase_already_completed FROM public.user_phrase_progress WHERE profile_id = profile_id_param AND lesson_id = lesson_id_param AND phrase_id = phrase_id_param;
    END IF;
    was_phrase_already_completed := COALESCE(was_phrase_already_completed, false);
    IF NOT was_phrase_already_completed AND is_phrase_now_completed THEN
        IF next_attempt_number = 1 THEN
            total_points_for_this_attempt := total_points_for_this_attempt + 1;
            INSERT INTO public.user_points_log (profile_id, points_awarded, reason_code, related_lesson_id, related_phrase_id, activity_type) VALUES (profile_id_param, 1, 'FIRST_TRY_BONUS', lesson_id_param, phrase_id_param, activity_type_param);
        END IF;
        IF v_score >= 90 THEN
            total_points_for_this_attempt := total_points_for_this_attempt + 1;
            INSERT INTO public.user_points_log (profile_id, points_awarded, reason_code, related_lesson_id, related_phrase_id, activity_type) VALUES (profile_id_param, 1, 'PHRASE_ACCURACY_BONUS', lesson_id_param, phrase_id_param, activity_type_param);
        END IF;
    END IF;
    INSERT INTO public.user_phrase_progress (profile_id, lesson_id, phrase_id, language_code) VALUES (profile_id_param, lesson_id_param, phrase_id_param, language_code_param) ON CONFLICT (profile_id, lesson_id, phrase_id, language_code) DO NOTHING;
    IF activity_type_param = 'pronunciation' THEN
        UPDATE public.user_phrase_progress SET pronunciation_attempts = COALESCE(pronunciation_attempts, 0) + 1, pronunciation_last_attempt_at = NOW(), pronunciation_completed = was_phrase_already_completed OR is_phrase_now_completed, last_progress_at = NOW() WHERE profile_id = profile_id_param AND lesson_id = lesson_id_param AND phrase_id = phrase_id_param;
    ELSIF activity_type_param = 'dictation' THEN
        UPDATE public.user_phrase_progress SET dictation_attempts = COALESCE(dictation_attempts, 0) + 1, dictation_last_attempt_at = NOW(), dictation_completed = was_phrase_already_completed OR is_phrase_now_completed, last_progress_at = NOW() WHERE profile_id = profile_id_param AND lesson_id = lesson_id_param AND phrase_id = phrase_id_param;
    END IF;

    -- Step 8: Handle Activity Completion for phrase-based activities
    -- ... (logic remains the same)
    IF NOT COALESCE(was_activity_already_completed, false) THEN
        SELECT COUNT(*) INTO total_phrases_in_lesson FROM public.lesson_phrases WHERE lesson_id = lesson_id_param;
        IF activity_type_param = 'pronunciation' THEN
            SELECT COUNT(*) INTO phrases_completed_for_activity FROM public.user_phrase_progress WHERE profile_id = profile_id_param AND lesson_id = lesson_id_param AND pronunciation_completed = TRUE;
        ELSIF activity_type_param = 'dictation' THEN
            SELECT COUNT(*) INTO phrases_completed_for_activity FROM public.user_phrase_progress WHERE profile_id = profile_id_param AND lesson_id = lesson_id_param AND dictation_completed = TRUE;
        END IF;
        IF phrases_completed_for_activity >= total_phrases_in_lesson THEN
            UPDATE public.user_lesson_activity_progress SET status = 'completed', completed_at = NOW() WHERE activity_progress_id = v_activity_progress_id;
            total_points_for_this_attempt := total_points_for_this_attempt + 10;
            INSERT INTO public.user_points_log (profile_id, points_awarded, reason_code, related_lesson_id, activity_type) VALUES (profile_id_param, 10, 'ACTIVITY_COMPLETION', lesson_id_param, activity_type_param);
            SELECT l.unit_id INTO v_unit_id FROM public.lessons l WHERE l.lesson_id = lesson_id_param;
            PERFORM public.check_and_award_unit_completion_bonus(profile_id_param, v_unit_id, lesson_id_param);
        END IF;
    END IF;

    -- --- REMOVED ---
    -- The old streak logic from Step 8 has been removed.

    -- Step 9: Final point update
    IF total_points_for_this_attempt > 0 THEN
        UPDATE public.student_profiles SET points = points + total_points_for_this_attempt
        WHERE profile_id = profile_id_param;
    END IF;

    RETURN QUERY SELECT total_points_for_this_attempt;

END;

## handle_user_streak

### Description

A centralized and idempotent function to manage daily user streaks. It checks if a user has performed an activity for the day, continues or resets their streak accordingly, and awards a tiered points bonus. The points awarded increase based on the length of the streak, up to a maximum of 10 points per day. This function is designed to be called safely on every user activity but will only grant a bonus once per day.

### Parameters

profile_id_param (uuid): The unique identifier for the user's profile.

### Returns

integer: The total number of points awarded for the streak bonus. Returns 0 if a bonus has already been awarded for the current day.

### definition

CREATE OR REPLACE FUNCTION public.handle_user_streak(profile_id_param uuid)
RETURNS integer
LANGUAGE plpgsql
AS $function$
DECLARE
current_streak INT;
last_streak_date DATE;
new_streak INT;
points_for_streak INT := 0;
today DATE := current_date;
yesterday DATE := current_date - 1;
BEGIN
-- Get the user's current streak information
SELECT
p.current_streak_days,
p.last_streak_date
INTO
current_streak,
last_streak_date
FROM public.student_profiles p
WHERE p.profile_id = profile_id_param;

    -- Only proceed if the user hasn't already performed an activity today
    IF last_streak_date IS NULL OR last_streak_date < today THEN
        -- Determine if the streak is continuing or resetting
        IF last_streak_date = yesterday THEN
            new_streak := COALESCE(current_streak, 0) + 1; -- Continue the streak
        ELSE
            new_streak := 1; -- Reset the streak
        END IF;

        -- Calculate points based on the new tiered logic
        -- 1. For every 5 days, the points-per-day increases by 1
        -- 2. LEAST() ensures the maximum points awarded per streak is 10
        points_for_streak := LEAST(floor((new_streak - 1) / 5) + 1, 10);

        -- Update the user's profile with the new streak information
        UPDATE public.student_profiles
        SET
            current_streak_days = new_streak,
            last_streak_date = today
        WHERE profile_id = profile_id_param;

        -- If points were awarded, log them
        IF points_for_streak > 0 THEN
            INSERT INTO public.user_points_log (profile_id, points_awarded, reason_code)
            VALUES (profile_id_param, points_for_streak, 'STREAK_BONUS');
        END IF;

        -- Return the points awarded for this streak
        RETURN points_for_streak;
    END IF;

    -- If a streak was already awarded today, return 0 points
    RETURN 0;

END;
$function$

## process_word_practice_attempt

### Description

Processes a user's attempt in a targeted word practice session. It updates the word's pronunciation statistics, awards a "Comeback Bonus" if a difficult word is successfully pronounced, and returns detailed feedback on the attempt's success and the user's updated progress with that word.

### Parameters

profile_id_param (uuid): The user's profile ID.

word_text_param (character varying): The word being practiced.

language_code_param (character varying): The language of the word.

accuracy_score_param (numeric): The accuracy score of the pronunciation attempt.

### Returns

A table with the following columns:

success (boolean): Always true, indicates the function executed.

word_completed (boolean): true if the word's average score is now >= 70.

new_average_score (numeric): The new average accuracy score for the word.

total_attempts (integer): The total number of attempts for the word.

points_awarded (integer): The number of points awarded for this specific attempt.

needs_practice (boolean): The updated status indicating if the word still needs practice.

### Definition

CREATE OR REPLACE FUNCTION public.process_word_practice_attempt(profile_id_param uuid, word_text_param character varying, language_code_param character varying, accuracy_score_param numeric)
RETURNS TABLE(success boolean, word_completed boolean, new_average_score numeric, total_attempts integer, points_awarded integer, needs_practice boolean)
LANGUAGE plpgsql
AS $function$
DECLARE
word_jsonb jsonb;
points_for_this_attempt integer := 0;
was_needing_practice boolean;
is_now_completed boolean;
v_new_average_score numeric;
v_total_attempts integer;
v_needs_practice boolean;
BEGIN
-- Check if the word was previously needing practice for a potential bonus
SELECT uwp.needs_practice INTO was_needing_practice
FROM public.user_word_pronunciation uwp
WHERE uwp.profile_id = profile_id_param
AND uwp.word_text = word_text_param
AND uwp.language_code = language_code_param;

    -- Construct the JSONB object that handle_user_word_pronunciation_update expects
    word_jsonb := jsonb_build_object(
        'word', word_text_param,
        'accuracyScore', accuracy_score_param,
        'errorType', 'None'
    );

    -- Call the centralized word update logic.
    -- Note: handle_user_word_pronunciation_update now also sets the `needs_practice` flag.
    PERFORM public.handle_user_word_pronunciation_update(profile_id_param, language_code_param, word_jsonb);

    -- Get the updated word stats to return to the client
    SELECT uwp.average_accuracy_score, uwp.total_attempts, uwp.needs_practice
    INTO v_new_average_score, v_total_attempts, v_needs_practice
    FROM public.user_word_pronunciation uwp
    WHERE uwp.profile_id = profile_id_param
      AND uwp.word_text = word_text_param
      AND uwp.language_code = language_code_param;

    -- Award a "comeback bonus" if a difficult word is now mastered
    is_now_completed := v_new_average_score >= 70;
    IF COALESCE(was_needing_practice, false) AND is_now_completed THEN
        points_for_this_attempt := points_for_this_attempt + 1;
        INSERT INTO public.user_points_log (profile_id, points_awarded, reason_code, related_word_text, related_word_language_code)
        VALUES (profile_id_param, 1, 'COMEBACK_BONUS', word_text_param, language_code_param);
    END IF;

    -- Update user's total points if any were awarded
    IF points_for_this_attempt > 0 THEN
        UPDATE public.student_profiles
        SET points = points + points_for_this_attempt, updated_at = now()
        WHERE profile_id = profile_id_param;
    END IF;

    -- Return the results for the client to update the UI
    RETURN QUERY SELECT
        true as success,
        is_now_completed as word_completed,
        v_new_average_score as new_average_score,
        v_total_attempts as total_attempts,
        points_for_this_attempt as points_awarded,
        v_needs_practice as needs_practice;

END;
$function$

## update_user_subscription_tier

### Description

A utility function that synchronizes a user's subscription tier. It determines the correct highest tier based on active subscriptions and updates the student_profiles table accordingly.

### Parameters

user_profile_id (uuid): The unique identifier for the user's profile to update.

### Returns

text - The new, updated subscription tier for the user.

### Definition

CREATE OR REPLACE FUNCTION public.update_user_subscription_tier(user_profile_id uuid)
RETURNS text
LANGUAGE plpgsql
AS $function$
DECLARE
new_tier TEXT;
BEGIN
-- Get the highest tier the user should have
new_tier := public.get_user_highest_tier(user_profile_id);

-- Update the user's subscription tier
UPDATE public.student_profiles
SET
subscription_tier = new_tier::public.subscription_tier_enum,
updated_at = NOW()
WHERE profile_id = user_profile_id;

RETURN new_tier;
END;
$function$

## upsert_stripe_invoice

### Description

Handles Stripe webhook events for invoices. It finds the associated user profile and creates or updates an invoice record in the local database with the data received from Stripe.

### Parameters

p_stripe_invoice_id (text): The Stripe ID for the invoice.

p_stripe_customer_id (text): The Stripe ID for the customer.

p_stripe_subscription_id (text): The Stripe ID for the subscription related to the invoice.

p_invoice_data (jsonb): The full invoice object from the Stripe webhook event.

### Returns

boolean - true on successful upsert, false if the user profile could not be found.

### Definition

CREATE OR REPLACE FUNCTION public.upsert_stripe_invoice(p_stripe_invoice_id text, p_stripe_customer_id text, p_stripe_subscription_id text, p_invoice_data jsonb)
RETURNS boolean
LANGUAGE plpgsql
AS $function$
DECLARE
user_profile_id UUID;
BEGIN
-- Get user profile
SELECT sp.profile_id INTO user_profile_id
FROM public.student_profiles sp
WHERE sp.stripe_customer_id = p_stripe_customer_id;

IF user_profile_id IS NULL THEN
RAISE WARNING 'Webhook Error: No user profile found for customer: %', p_stripe_customer_id;
RETURN FALSE;
END IF;

-- Upsert invoice record with proper NULL handling
INSERT INTO public.invoices (
profile_id, stripe_invoice_id, stripe_subscription_id, stripe_customer_id,
status, amount_due, amount_paid, amount_remaining, currency,
due_date, paid_at, invoice_pdf_url, hosted_invoice_url,
billing_reason, metadata, issued_at, updated_at
)
VALUES (
user_profile_id,
p_stripe_invoice_id,
NULLIF(p_stripe_subscription_id, ''),
p_stripe_customer_id,
(p_invoice_data->>'status')::public.invoice_status_enum,
COALESCE((p_invoice_data->>'amount_due')::INTEGER, 0),
COALESCE((p_invoice_data->>'amount_paid')::INTEGER, 0),
COALESCE((p_invoice_data->>'amount_remaining')::INTEGER, 0),
COALESCE(p_invoice_data->>'currency', 'usd'),
CASE WHEN p_invoice_data->>'due_date' IS NOT NULL AND p_invoice_data->>'due_date' != 'null'
THEN TO_TIMESTAMP((p_invoice_data->>'due_date')::BIGINT)
ELSE NULL END,
CASE WHEN p_invoice_data->>'status' = 'paid' AND p_invoice_data->'status_transitions'->>'paid_at' IS NOT NULL
THEN TO_TIMESTAMP((p_invoice_data->'status_transitions'->>'paid_at')::BIGINT)
ELSE NULL END,
p_invoice_data->>'invoice_pdf',
p_invoice_data->>'hosted_invoice_url',
p_invoice_data->>'billing_reason',
COALESCE(p_invoice_data->'metadata', '{}'::jsonb),
COALESCE(
CASE WHEN p_invoice_data->>'created' IS NOT NULL
THEN TO_TIMESTAMP((p_invoice_data->>'created')::BIGINT)
ELSE NOW() END,
NOW()
),
NOW()
)
ON CONFLICT (stripe_invoice_id)
DO UPDATE SET
stripe_subscription_id = EXCLUDED.stripe_subscription_id,
status = EXCLUDED.status,
amount_due = EXCLUDED.amount_due,
amount_paid = EXCLUDED.amount_paid,
amount_remaining = EXCLUDED.amount_remaining,
due_date = EXCLUDED.due_date,
paid_at = EXCLUDED.paid_at,
invoice_pdf_url = EXCLUDED.invoice_pdf_url,
hosted_invoice_url = EXCLUDED.hosted_invoice_url,
billing_reason = EXCLUDED.billing_reason,
metadata = EXCLUDED.metadata,
updated_at = NOW();

RETURN TRUE;
END;
$function$

## upsert_stripe_subscription

### Description

Handles Stripe webhook events for subscriptions. It creates or updates a subscription record in the local database, manages potential tier conflicts (e.g., upgrading from 'starter' to 'pro'), and then updates the user's overall subscription tier to reflect the change.

### Parameters

p_stripe_subscription_id (text): The Stripe ID for the subscription.

p_stripe_customer_id (text): The Stripe ID for the customer.

p_stripe_price_id (text): The Stripe ID for the price associated with the subscription.

p_subscription_data (jsonb): The full subscription object from the Stripe webhook event.

### Returns

boolean - true on successful upsert, false if the user or price could not be found.

### Definition

CREATE OR REPLACE FUNCTION public.upsert_stripe_subscription(p_stripe_subscription_id text, p_stripe_customer_id text, p_stripe_price_id text, p_subscription_data jsonb)
RETURNS boolean
LANGUAGE plpgsql
AS $function$
DECLARE
user_profile_id UUID;
price_record RECORD;
tier_before TEXT;
tier_after TEXT;
BEGIN
-- Get user profile
SELECT sp.profile_id INTO user_profile_id
FROM public.student_profiles sp
WHERE sp.stripe_customer_id = p_stripe_customer_id;

IF user_profile_id IS NULL THEN
RAISE WARNING 'Webhook Error: No user profile found for customer: %', p_stripe_customer_id;
RETURN FALSE;
END IF;

-- Get price and product information
SELECT p.id, prod.tier_key
INTO price_record
FROM public.prices p
JOIN public.products prod ON p.product_id = prod.id
WHERE p.stripe_price_id = p_stripe_price_id;

IF price_record.id IS NULL THEN
RAISE WARNING 'Webhook Error: Price not found in database: %', p_stripe_price_id;
RETURN FALSE;
END IF;

-- Store current tier
SELECT sp.subscription_tier INTO tier_before
FROM public.student_profiles sp
WHERE sp.profile_id = user_profile_id;

-- Handle tier conflicts if this is a new active subscription
IF p_subscription_data->>'status' IN ('active', 'trialing') THEN
PERFORM public.handle_subscription_tier_conflict(user_profile_id, price_record.tier_key);
END IF;

-- Upsert subscription record with proper NULL handling
INSERT INTO public.student_subscriptions (
profile_id, price_id, stripe_subscription_id, status, quantity,
current_period_start, current_period_end, cancel_at_period_end,
canceled_at, ended_at, trial_start_at, trial_end_at, metadata,
stripe_created_at, updated_at
)
VALUES (
user_profile_id,
price_record.id,
p_stripe_subscription_id,
(p_subscription_data->>'status')::public.subscription_status_enum,
COALESCE((p_subscription_data->>'quantity')::INTEGER, 1),
COALESCE(
CASE WHEN p_subscription_data->>'current_period_start' IS NOT NULL
THEN TO_TIMESTAMP((p_subscription_data->>'current_period_start')::BIGINT)
ELSE NOW() END,
NOW()
),
COALESCE(
CASE WHEN p_subscription_data->>'current_period_end' IS NOT NULL
THEN TO_TIMESTAMP((p_subscription_data->>'current_period_end')::BIGINT)
ELSE NOW() + INTERVAL '1 month' END,
NOW() + INTERVAL '1 month'
),
COALESCE((p_subscription_data->>'cancel_at_period_end')::BOOLEAN, false),
CASE WHEN p_subscription_data->>'canceled_at' IS NOT NULL
THEN TO_TIMESTAMP((p_subscription_data->>'canceled_at')::BIGINT)
ELSE NULL END,
CASE WHEN p_subscription_data->>'ended_at' IS NOT NULL
THEN TO_TIMESTAMP((p_subscription_data->>'ended_at')::BIGINT)
ELSE NULL END,
CASE WHEN p_subscription_data->>'trial_start' IS NOT NULL
THEN TO_TIMESTAMP((p_subscription_data->>'trial_start')::BIGINT)
ELSE NULL END,
CASE WHEN p_subscription_data->>'trial_end' IS NOT NULL
THEN TO_TIMESTAMP((p_subscription_data->>'trial_end')::BIGINT)
ELSE NULL END,
COALESCE(p_subscription_data->'metadata', '{}'::jsonb),
COALESCE(
CASE WHEN p_subscription_data->>'created' IS NOT NULL
THEN TO_TIMESTAMP((p_subscription_data->>'created')::BIGINT)
ELSE NOW() END,
NOW()
),
NOW()
)
ON CONFLICT (stripe_subscription_id)
DO UPDATE SET
status = EXCLUDED.status,
quantity = EXCLUDED.quantity,
current_period_start = EXCLUDED.current_period_start,
current_period_end = EXCLUDED.current_period_end,
cancel_at_period_end = EXCLUDED.cancel_at_period_end,
canceled_at = EXCLUDED.canceled_at,
ended_at = EXCLUDED.ended_at,
trial_start_at = EXCLUDED.trial_start_at,
trial_end_at = EXCLUDED.trial_end_at,
metadata = EXCLUDED.metadata,
updated_at = NOW();

-- Update user's subscription tier based on all active subscriptions
tier_after := public.update_user_subscription_tier(user_profile_id);

-- Log tier change if it occurred
IF tier_before::TEXT != tier_after THEN
INSERT INTO public.user_points_log (profile_id, points_awarded, reason_code, notes)
VALUES (user_profile_id, 0, 'TIER_CHANGE',
'Subscription tier changed from ' || tier_before::TEXT || ' to ' || tier_after);
END IF;

RETURN TRUE;
END;
$function$

## get_user_available_levels

CREATE OR REPLACE FUNCTION public.get_user_available_levels(profile_id_param uuid)
RETURNS level_enum[]
LANGUAGE plpgsql
AS $function$
DECLARE
completed_levels level_enum[];
available_levels level_enum[];
next_level level_enum;
max_completed_order integer := 0;
BEGIN
-- Get completed levels ordered by language_levels.sort_order
SELECT ARRAY_AGG(ulc.level_code ORDER BY ll.sort_order)
INTO completed_levels
FROM public.user_level_completion ulc
JOIN public.language_levels ll ON ulc.level_code = ll.level_code
WHERE ulc.profile_id = profile_id_param;

    -- Start with A1 (always available)
    available_levels := ARRAY['A1'::level_enum];

    -- Add completed levels
    IF completed_levels IS NOT NULL THEN
        available_levels := available_levels || completed_levels;

        -- Find highest completed level order using language_levels table
        SELECT MAX(ll.sort_order)
        INTO max_completed_order
        FROM unnest(completed_levels) AS level_code
        JOIN public.language_levels ll ON ll.level_code = level_code::level_enum;
    END IF;

    -- Add next level if exists
    SELECT level_code INTO next_level
    FROM public.language_levels
    WHERE sort_order = max_completed_order + 1;

    IF next_level IS NOT NULL AND NOT (next_level = ANY(available_levels)) THEN
        available_levels := available_levels || ARRAY[next_level];
    END IF;

    -- FIXED: Remove duplicates without ORDER BY in ARRAY_AGG DISTINCT
    WITH ordered_levels AS (
        SELECT DISTINCT level::level_enum as level_code, ll.sort_order
        FROM unnest(available_levels) AS level
        JOIN public.language_levels ll ON ll.level_code = level::level_enum
        ORDER BY ll.sort_order
    )
    SELECT ARRAY_AGG(level_code)
    INTO available_levels
    FROM ordered_levels;

    RETURN COALESCE(available_levels, ARRAY['A1'::level_enum]);

END;
$function$;

## can_user_access_level

CREATE OR REPLACE FUNCTION public.can_user_access_level(profile_id_param uuid, level_code_param level_enum)
RETURNS boolean
LANGUAGE plpgsql
AS $function$
BEGIN
RETURN level_code_param = ANY(public.get_user_available_levels(profile_id_param));
END;
$function$;

## calculate_book_completion

### Description

Calculates a user's completion status for a specific audiobook. It determines the total chapters, the number of chapters the user has finished, the completion percentage, and whether the entire book is completed.

### Parameters

p_profile_id (UUID): The unique identifier of the user's profile.
p_book_id (INTEGER): The unique identifier of the audiobook.

### Returns

total_chapters (INTEGER): The total number of chapters in the book.
completed_chapters (INTEGER): The number of chapters the user has marked as complete for the book.
completion_percentage (NUMERIC): The percentage of chapters completed, calculated as (completed / total) \* 100.
is_book_completed (BOOLEAN): true if completed_chapters equals total_chapters (and total_chapters is greater than 0), otherwise false.

### Definition

DECLARE
v_total_chapters INTEGER;
v_completed_chapters INTEGER;
v_completion_percentage NUMERIC;
v_is_book_completed BOOLEAN;
BEGIN
-- Get total chapters for the book
SELECT COUNT(\*) INTO v_total_chapters
FROM public.audiobook_chapters
WHERE book_id = p_book_id;

    -- Get completed chapters for the user
    SELECT COUNT(*) INTO v_completed_chapters
    FROM public.user_audiobook_chapter_progress
    WHERE profile_id = p_profile_id
    AND book_id = p_book_id
    AND is_completed = true;

    -- Calculate completion percentage (capped at 100%)
    v_completion_percentage := CASE
        WHEN v_total_chapters > 0 THEN
            LEAST(100, (v_completed_chapters::NUMERIC / v_total_chapters::NUMERIC) * 100)
        ELSE 0
    END;

    -- Determine if book is completed (all chapters completed)
    v_is_book_completed := v_completed_chapters = v_total_chapters AND v_total_chapters > 0;

    RETURN QUERY SELECT
        v_total_chapters,
        v_completed_chapters,
        v_completion_percentage,
        v_is_book_completed;

END;

## handle_new_chapter_added

### Description

A trigger function designed to run automatically when a new chapter is added to the audiobook_chapters table. It updates all existing user progress records for that specific book, ensuring that the total chapter count and completion percentages are accurate after the new chapter is included. It also resets the book's overall completion status to false.

### Parametesr

This is a trigger function and does not accept any direct arguments. It implicitly receives context from the NEW record, which represents the newly inserted chapter row.

### Returns

Returns a TRIGGER data type. Specifically, it returns the NEW record, which allows the INSERT operation that fired the trigger to proceed successfully.

### Definition

BEGIN
-- When a new chapter is added, update all user progress for this book
-- to reflect the new total and recalculate completion
UPDATE public.user*audiobook_progress
SET
total_chapters = (
SELECT COUNT(*)
FROM public.audiobook*chapters
WHERE book_id = NEW.book_id
),
completion_percentage = (
SELECT LEAST(100, CASE
WHEN COUNT(ac.*) > 0 THEN
(COUNT(CASE WHEN uacp.is*completed THEN 1 END)::NUMERIC / COUNT(ac.*)::NUMERIC) \_ 100
ELSE 0
END)
FROM public.audiobook_chapters ac
LEFT JOIN public.user_audiobook_chapter_progress uacp
ON ac.chapter_id = uacp.chapter_id
AND uacp.profile_id = user_audiobook_progress.profile_id
WHERE ac.book_id = NEW.book_id
),
is_completed = false, -- Reset completion status when new chapters are added
completed_at = NULL -- Clear completion timestamp
WHERE book_id = NEW.book_id;

    RETURN NEW;

END;

## check_audiobook_ownership

### Description

Checks if a specific user has purchased a specific audiobook by looking for a corresponding record in the user_audiobook_purchases table.

### Parameters

p_profile_id (UUID): The unique identifier of the user's profile.
p_book_id (INTEGER): The unique identifier of the audiobook.

### Returns

A BOOLEAN value: true if the user owns the audiobook, otherwise false.

### definition

BEGIN
RETURN EXISTS (
SELECT 1 FROM user_audiobook_purchases
WHERE profile_id = p_profile_id AND book_id = p_book_id
);
END;

## update_chapter_progress

### Description

This is a comprehensive function to track and save a user's listening progress for an audiobook chapter. It performs two key actions:

Upserts Chapter Progress: It creates or updates the user's progress for a specific chapter, storing their current position in seconds. A chapter is automatically marked as "completed" if the user's position surpasses 95% of its total duration.

Updates Overall Book Progress: After updating the chapter, it recalculates and upserts the user's overall progress for the entire book, updating total chapters completed, completion percentage, and the book's final completion status.

### Parameters

p_profile_id (UUID): The unique identifier of the user's profile.
p_book_id (INTEGER): The unique identifier of the audiobook.
p_chapter_id (INTEGER): The unique identifier of the chapter being listened to.
p_position_seconds (NUMERIC): The user's current playback position within the chapter, in seconds.
p_chapter_duration_seconds (INTEGER): The total duration of the chapter in seconds, used to calculate completion.

### Returns

Returns a BOOLEAN value (true) to indicate that the progress was processed successfully.

### Definition

DECLARE
v_is_completed BOOLEAN := false;
v_completion_threshold NUMERIC := 0.95;
BEGIN
-- Determine if chapter is completed (95% watched or explicit completion)
IF p_chapter_duration_seconds IS NOT NULL AND p_position_seconds >= (p_chapter_duration_seconds \* v_completion_threshold) THEN
v_is_completed := true;
END IF;

    -- Upsert chapter progress with FIXED logic
    INSERT INTO public.user_audiobook_chapter_progress (
        profile_id, book_id, chapter_id, current_position_seconds,
        is_completed, completed_at, last_listened_at, created_at, updated_at
    )
    VALUES (
        p_profile_id, p_book_id, p_chapter_id, p_position_seconds,
        v_is_completed,
        CASE WHEN v_is_completed THEN now() ELSE NULL END,
        now(), now(), now()
    )
    ON CONFLICT (profile_id, book_id, chapter_id)
    DO UPDATE SET
        current_position_seconds = EXCLUDED.current_position_seconds,
        -- FIXED: Allow completion to be set to true when threshold is met
        is_completed = CASE
            WHEN user_audiobook_chapter_progress.is_completed = true THEN true  -- Keep completed status
            WHEN EXCLUDED.is_completed = true THEN true  -- Allow new completion
            ELSE false  -- Otherwise keep as incomplete
        END,
        completed_at = CASE
            WHEN user_audiobook_chapter_progress.completed_at IS NOT NULL THEN user_audiobook_chapter_progress.completed_at  -- Keep existing completion time
            WHEN EXCLUDED.is_completed = true AND user_audiobook_chapter_progress.is_completed = false THEN now()  -- Set completion time for newly completed
            ELSE NULL
        END,
        last_listened_at = EXCLUDED.last_listened_at,
        updated_at = EXCLUDED.updated_at;

    -- Update book-level progress
    WITH book_stats AS (
        SELECT * FROM public.calculate_book_completion(p_profile_id, p_book_id)
    )
    INSERT INTO public.user_audiobook_progress (
        profile_id, book_id, current_chapter_id, current_position_seconds,
        total_chapters, completed_chapters, completion_percentage,
        is_completed, completed_at, last_read_at
    )
    SELECT
        p_profile_id, p_book_id, p_chapter_id, p_position_seconds,
        bs.total_chapters, bs.completed_chapters, LEAST(100, bs.completion_percentage),
        bs.is_book_completed,
        CASE WHEN bs.is_book_completed THEN now() ELSE NULL END,
        now()
    FROM book_stats bs
    ON CONFLICT (profile_id, book_id)
    DO UPDATE SET
        current_chapter_id = EXCLUDED.current_chapter_id,
        current_position_seconds = EXCLUDED.current_position_seconds,
        total_chapters = EXCLUDED.total_chapters,
        completed_chapters = EXCLUDED.completed_chapters,
        completion_percentage = LEAST(100, EXCLUDED.completion_percentage),
        -- FIXED: Same logic fix for book completion
        is_completed = CASE
            WHEN user_audiobook_progress.is_completed = true THEN true
            WHEN EXCLUDED.is_completed = true THEN true
            ELSE false
        END,
        completed_at = CASE
            WHEN user_audiobook_progress.completed_at IS NOT NULL THEN user_audiobook_progress.completed_at
            WHEN EXCLUDED.is_completed = true AND user_audiobook_progress.is_completed = false THEN now()
            ELSE NULL
        END,
        last_read_at = EXCLUDED.last_read_at;

    RETURN true;

END;

## get_user_audiobook_purchases

### Description

Retrieves a detailed list of all audiobooks purchased by a specific user, ordered from the most to least recent purchase. It joins purchase information with audiobook details and links to any associated Stripe invoices.

### Parameters

p_profile_id (UUID): The unique identifier of the user's profile.

### Returns

Returns a TABLE containing a set of rows with the following columns for each purchased audiobook:
book_id (INTEGER): The unique identifier of the audiobook.
title (CHARACTER VARYING): The title of the audiobook.
author (CHARACTER VARYING): The author of the audiobook.
cover_image_url (CHARACTER VARYING): The URL for the audiobook's cover image.
purchase_type (purchase_type_enum): The method of purchase (e.g., 'money' or 'points').
amount_paid_cents (INTEGER): The amount paid in cents, if purchased with money.
points_spent (INTEGER): The number of points spent, if purchased with points.
purchased_at (TIMESTAMP WITH TIME ZONE): The timestamp of when the purchase was made.
invoice_pdf_url (TEXT): A URL to the PDF of the Stripe invoice, if available.
hosted_invoice_url (TEXT): A URL to the Stripe-hosted invoice page, if available.

### Definition

BEGIN
RETURN QUERY
SELECT
a.book_id,
a.title,
a.author,
a.cover_image_url,
p.purchase_type,
p.amount_paid_cents,
p.points_spent,
p.purchased_at,
i.invoice_pdf_url,
i.hosted_invoice_url
FROM user_audiobook_purchases p
JOIN audiobooks a ON p.book_id = a.book_id
LEFT JOIN invoices i ON i.profile_id = p.profile_id
AND (i.metadata->>'book_id')::INTEGER = p.book_id
WHERE p.profile_id = p_profile_id
ORDER BY p.purchased_at DESC;
END;

## update_audiobook_duration

### Description

A trigger function that automatically recalculates and updates the total duration_seconds of an audiobook whenever one of its chapters is inserted, updated, or deleted. It ensures the parent audiobooks record always reflects the accurate total duration of all its associated chapters.

### Parameters

This is a trigger function and does not accept any direct arguments. It implicitly receives context from special trigger variables like NEW (the new row data) and OLD (the old row data).

### Returns

Returns a TRIGGER data type. It returns the appropriate record (NEW or OLD) to allow the original INSERT, UPDATE, or DELETE operation to proceed successfully.

### Definition

BEGIN
-- Log trigger execution
RAISE NOTICE 'update_audiobook_duration triggered: operation=%, book_id=%',
TG_OP, COALESCE(NEW.book_id, OLD.book_id);

    -- Update the audiobook's total duration when chapter duration changes
    UPDATE public.audiobooks
    SET
        duration_seconds = (
            SELECT COALESCE(SUM(duration_seconds), 0)
            FROM public.audiobook_chapters
            WHERE book_id = COALESCE(NEW.book_id, OLD.book_id)
            AND duration_seconds IS NOT NULL
        ),
        updated_at = now()
    WHERE book_id = COALESCE(NEW.book_id, OLD.book_id);

    -- Log the result
    RAISE NOTICE 'Audiobook duration updated for book_id=%: new_duration=%',
        COALESCE(NEW.book_id, OLD.book_id),
        (SELECT duration_seconds FROM public.audiobooks WHERE book_id = COALESCE(NEW.book_id, OLD.book_id));

    RETURN COALESCE(NEW, OLD);

END;

## upsert_audiobook_purchase

### Description

Processes a one-time audiobook purchase, typically called from a Stripe webhook handler. This function finds the user's profile via their Stripe customer ID, extracts the audiobook ID from the invoice metadata, and then performs two key database operations:

Creates an entry in the user_audiobook_purchases table to grant ownership of the book to the user.

Creates or updates a corresponding record in the invoices table to log the financial transaction details.

The function will raise an exception if the customer ID or book ID cannot be found.

### Parameters

p_stripe_invoice_id (TEXT): The unique invoice identifier from Stripe.
p_stripe_customer_id (TEXT): The unique customer identifier from Stripe.
p_invoice_data (JSONB): The full JSONB payload of the invoice object, typically received from a Stripe webhook.

### Returns

This function returns VOID as it performs actions on the database but does not return any value.

### Definition

DECLARE
v_profile_id UUID;
v_book_id INTEGER;
v_amount_paid INTEGER;
BEGIN
-- Get profile_id from stripe_customer_id
SELECT profile_id INTO v_profile_id
FROM student_profiles
WHERE stripe_customer_id = p_stripe_customer_id;

IF v_profile_id IS NULL THEN
RAISE EXCEPTION 'Customer not found: %', p_stripe_customer_id;
END IF;

-- Extract book_id from invoice metadata (fixed JSONB access)
v_book_id := (p_invoice_data->'metadata'->>'book_id')::INTEGER;
v_amount_paid := (p_invoice_data->>'amount_paid')::INTEGER;

IF v_book_id IS NULL THEN
RAISE EXCEPTION 'Book ID not found in invoice metadata';
END IF;

-- Insert purchase record
INSERT INTO user_audiobook_purchases (
profile_id,
book_id,
purchase_type,
amount_paid_cents,
purchased_at
) VALUES (
v_profile_id,
v_book_id,
'money',
v_amount_paid,
NOW()
) ON CONFLICT (profile_id, book_id) DO NOTHING;

-- Insert/update invoice record
INSERT INTO invoices (
profile_id,
stripe_invoice_id,
stripe_customer_id,
status,
amount_due,
amount_paid,
amount_remaining,
currency,
paid_at,
invoice_pdf_url,
hosted_invoice_url,
metadata,
issued_at
) VALUES (
v_profile_id,
p_stripe_invoice_id,
p_stripe_customer_id,
(p_invoice_data->>'status')::invoice_status_enum,
COALESCE((p_invoice_data->>'amount_due')::INTEGER, 0),
COALESCE((p_invoice_data->>'amount_paid')::INTEGER, 0),
COALESCE((p_invoice_data->>'amount_remaining')::INTEGER, 0),
COALESCE(p_invoice_data->>'currency', 'usd'),
CASE WHEN p_invoice_data->>'status' = 'paid' THEN NOW() ELSE NULL END,
p_invoice_data->>'invoice_pdf',
p_invoice_data->>'hosted_invoice_url',
p_invoice_data,
TO_TIMESTAMP((p_invoice_data->>'created')::INTEGER)
) ON CONFLICT (stripe_invoice_id) DO UPDATE SET
status = EXCLUDED.status,
amount_paid = EXCLUDED.amount_paid,
amount_remaining = EXCLUDED.amount_remaining,
paid_at = EXCLUDED.paid_at,
invoice_pdf_url = EXCLUDED.invoice_pdf_url,
hosted_invoice_url = EXCLUDED.hosted_invoice_url,
metadata = EXCLUDED.metadata,
updated_at = NOW();

END;

## expire_partnership_trials

### Description

A maintenance function, typically run on a schedule (e.g., daily), that finds and processes all expired partnership trials. For each user with an expired trial, it updates their trial subscription status to 'canceled' and then recalculates their overall subscription tier to ensure their access rights are accurate.

### Parameters

This function does not accept any arguments.

### Returns

This function returns VOID as it performs actions on the database but does not return any value.

### Definition

DECLARE
expired*profile_id uuid;
BEGIN
-- Loop through expired trials and update each user's tier
FOR expired_profile_id IN
SELECT DISTINCT profile_id
FROM student_subscriptions
WHERE status = 'trialing'
AND trial_end_at <= NOW()
AND stripe_subscription_id LIKE 'trial*%'
LOOP
-- Update the subscription status first
UPDATE student*subscriptions
SET
status = 'canceled',
ended_at = NOW(),
updated_at = NOW()
WHERE profile_id = expired_profile_id
AND status = 'trialing'
AND stripe_subscription_id LIKE 'trial*%';

    -- Then update the user's subscription tier using existing function
    PERFORM update_user_subscription_tier(expired_profile_id);

END LOOP;
END;

## can_user_access_level

### Description

An access-control function that checks if a user is permitted to access a specific language level. It works by calling the get_user_available_levels function and checking if the requested level exists in the array of levels available to that user.

### Parameters

profile_id_param (UUID): The unique identifier of the user's profile.
level_code_param (level_enum): The language level code to check for access (e.g., 'A1', 'B2').

### Returns

Returns a BOOLEAN: true if the user can access the level, otherwise false.

### Definition

BEGIN
RETURN level_code_param = ANY(public.get_user_available_levels(profile_id_param));
END;

## redeem_partnership_invitation

### Definition

CREATE OR REPLACE FUNCTION public.redeem_partnership_invitation(
p_token uuid,
p_user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
v_invitation RECORD;
v_user_email TEXT;
v_result jsonb;
BEGIN
-- Get user email
SELECT email INTO v_user_email
FROM auth.users
WHERE id = p_user_id;

-- Get invitation details
SELECT \* INTO v_invitation
FROM partnership_invitations
WHERE token = p_token
AND status = 'pending'
AND expires_at > now();

-- Validate invitation
IF v_invitation IS NULL THEN
RETURN jsonb_build_object('success', false, 'error', 'invalid');
END IF;

-- Check email match
IF v_invitation.intended_for_email != v_user_email THEN
RETURN jsonb_build_object('success', false, 'error', 'wrong_email');
END IF;

-- Update invitation (this bypasses RLS due to SECURITY DEFINER)
UPDATE partnership_invitations
SET
status = 'redeemed',
redeemed_by_profile_id = p_user_id,
redeemed_at = now()
WHERE id = v_invitation.id;

-- Update user profiles
UPDATE profiles
SET partnership_id = v_invitation.partnership_id
WHERE id = p_user_id;

-- Return success with invitation details
RETURN jsonb_build_object(
'success', true,
'invitation', row_to_json(v_invitation)
);
END;
$function$;

# Triggers

## trigger_update_audiobook_duration

CREATE TRIGGER trigger_update_audiobook_duration
AFTER INSERT OR DELETE OR UPDATE OF duration_seconds ON public.audiobook_chapters
FOR EACH ROW EXECUTE FUNCTION public.update_audiobook_duration();

$$
$$

## handle_new_chapter_added

CREATE TRIGGER trigger_new_chapter_added
AFTER INSERT ON public.audiobook_chapters
FOR EACH ROW EXECUTE FUNCTION public.handle_new_chapter_added();

## on_auth_user_created

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();
