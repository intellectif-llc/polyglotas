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

# Enums

| enum_name                   | enum_value           | enumsortorder |
| --------------------------- | -------------------- | ------------- |
| account_status_enum         | pending_verification | 1             |
| account_status_enum         | active               | 2             |
| account_status_enum         | suspended            | 3             |
| account_status_enum         | deactivated          | 4             |
| invoice_status_enum         | draft                | 1             |
| invoice_status_enum         | open                 | 2             |
| invoice_status_enum         | paid                 | 3             |
| invoice_status_enum         | void                 | 4             |
| invoice_status_enum         | uncollectible        | 5             |
| invoice_status_enum         | past_due             | 6             |
| invoice_status_enum         | refunded             | 7             |
| invoice_status_enum         | pending              | 8             |
| level_enum                  | A1                   | 1             |
| level_enum                  | A2                   | 2             |
| level_enum                  | B1                   | 3             |
| level_enum                  | B2                   | 4             |
| level_enum                  | C1                   | 5             |
| price_billing_interval_enum | day                  | 1             |
| price_billing_interval_enum | week                 | 2             |
| price_billing_interval_enum | month                | 3             |
| price_billing_interval_enum | year                 | 4             |
| price_type_enum             | recurring            | 1             |
| price_type_enum             | one_time             | 2             |
| sender_type_enum            | user                 | 1             |
| sender_type_enum            | ai                   | 2             |
| subscription_status_enum    | trialing             | 1             |
| subscription_status_enum    | active               | 2             |
| subscription_status_enum    | past_due             | 3             |
| subscription_status_enum    | unpaid               | 4             |
| subscription_status_enum    | canceled             | 5             |
| subscription_status_enum    | incomplete           | 6             |
| subscription_status_enum    | incomplete_expired   | 7             |
| subscription_status_enum    | paused               | 8             |
| subscription_tier_enum      | free                 | 1             |
| subscription_tier_enum      | starter              | 2             |
| subscription_tier_enum      | pro                  | 3             |
