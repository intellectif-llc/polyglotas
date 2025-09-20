drop extension if exists "pg_net";

create sequence "public"."user_audiobook_chapter_progress_id_seq";

revoke delete on table "public"."audiobook_alignment" from "anon";

revoke insert on table "public"."audiobook_alignment" from "anon";

revoke references on table "public"."audiobook_alignment" from "anon";

revoke select on table "public"."audiobook_alignment" from "anon";

revoke trigger on table "public"."audiobook_alignment" from "anon";

revoke truncate on table "public"."audiobook_alignment" from "anon";

revoke update on table "public"."audiobook_alignment" from "anon";

revoke delete on table "public"."audiobook_alignment" from "authenticated";

revoke insert on table "public"."audiobook_alignment" from "authenticated";

revoke references on table "public"."audiobook_alignment" from "authenticated";

revoke select on table "public"."audiobook_alignment" from "authenticated";

revoke trigger on table "public"."audiobook_alignment" from "authenticated";

revoke truncate on table "public"."audiobook_alignment" from "authenticated";

revoke update on table "public"."audiobook_alignment" from "authenticated";

revoke delete on table "public"."audiobook_alignment" from "service_role";

revoke insert on table "public"."audiobook_alignment" from "service_role";

revoke references on table "public"."audiobook_alignment" from "service_role";

revoke select on table "public"."audiobook_alignment" from "service_role";

revoke trigger on table "public"."audiobook_alignment" from "service_role";

revoke truncate on table "public"."audiobook_alignment" from "service_role";

revoke update on table "public"."audiobook_alignment" from "service_role";

revoke delete on table "public"."audiobook_chapters" from "anon";

revoke insert on table "public"."audiobook_chapters" from "anon";

revoke references on table "public"."audiobook_chapters" from "anon";

revoke select on table "public"."audiobook_chapters" from "anon";

revoke trigger on table "public"."audiobook_chapters" from "anon";

revoke truncate on table "public"."audiobook_chapters" from "anon";

revoke update on table "public"."audiobook_chapters" from "anon";

revoke delete on table "public"."audiobook_chapters" from "authenticated";

revoke insert on table "public"."audiobook_chapters" from "authenticated";

revoke references on table "public"."audiobook_chapters" from "authenticated";

revoke select on table "public"."audiobook_chapters" from "authenticated";

revoke trigger on table "public"."audiobook_chapters" from "authenticated";

revoke truncate on table "public"."audiobook_chapters" from "authenticated";

revoke update on table "public"."audiobook_chapters" from "authenticated";

revoke delete on table "public"."audiobook_chapters" from "service_role";

revoke insert on table "public"."audiobook_chapters" from "service_role";

revoke references on table "public"."audiobook_chapters" from "service_role";

revoke select on table "public"."audiobook_chapters" from "service_role";

revoke trigger on table "public"."audiobook_chapters" from "service_role";

revoke truncate on table "public"."audiobook_chapters" from "service_role";

revoke update on table "public"."audiobook_chapters" from "service_role";

revoke delete on table "public"."audiobooks" from "anon";

revoke insert on table "public"."audiobooks" from "anon";

revoke references on table "public"."audiobooks" from "anon";

revoke select on table "public"."audiobooks" from "anon";

revoke trigger on table "public"."audiobooks" from "anon";

revoke truncate on table "public"."audiobooks" from "anon";

revoke update on table "public"."audiobooks" from "anon";

revoke delete on table "public"."audiobooks" from "authenticated";

revoke insert on table "public"."audiobooks" from "authenticated";

revoke references on table "public"."audiobooks" from "authenticated";

revoke select on table "public"."audiobooks" from "authenticated";

revoke trigger on table "public"."audiobooks" from "authenticated";

revoke truncate on table "public"."audiobooks" from "authenticated";

revoke update on table "public"."audiobooks" from "authenticated";

revoke delete on table "public"."audiobooks" from "service_role";

revoke insert on table "public"."audiobooks" from "service_role";

revoke references on table "public"."audiobooks" from "service_role";

revoke select on table "public"."audiobooks" from "service_role";

revoke trigger on table "public"."audiobooks" from "service_role";

revoke truncate on table "public"."audiobooks" from "service_role";

revoke update on table "public"."audiobooks" from "service_role";

revoke delete on table "public"."conversation_messages" from "anon";

revoke insert on table "public"."conversation_messages" from "anon";

revoke references on table "public"."conversation_messages" from "anon";

revoke select on table "public"."conversation_messages" from "anon";

revoke trigger on table "public"."conversation_messages" from "anon";

revoke truncate on table "public"."conversation_messages" from "anon";

revoke update on table "public"."conversation_messages" from "anon";

revoke delete on table "public"."conversation_messages" from "authenticated";

revoke insert on table "public"."conversation_messages" from "authenticated";

revoke references on table "public"."conversation_messages" from "authenticated";

revoke select on table "public"."conversation_messages" from "authenticated";

revoke trigger on table "public"."conversation_messages" from "authenticated";

revoke truncate on table "public"."conversation_messages" from "authenticated";

revoke update on table "public"."conversation_messages" from "authenticated";

revoke delete on table "public"."conversation_messages" from "service_role";

revoke insert on table "public"."conversation_messages" from "service_role";

revoke references on table "public"."conversation_messages" from "service_role";

revoke select on table "public"."conversation_messages" from "service_role";

revoke trigger on table "public"."conversation_messages" from "service_role";

revoke truncate on table "public"."conversation_messages" from "service_role";

revoke update on table "public"."conversation_messages" from "service_role";

revoke delete on table "public"."conversation_prompt_status" from "anon";

revoke insert on table "public"."conversation_prompt_status" from "anon";

revoke references on table "public"."conversation_prompt_status" from "anon";

revoke select on table "public"."conversation_prompt_status" from "anon";

revoke trigger on table "public"."conversation_prompt_status" from "anon";

revoke truncate on table "public"."conversation_prompt_status" from "anon";

revoke update on table "public"."conversation_prompt_status" from "anon";

revoke delete on table "public"."conversation_prompt_status" from "authenticated";

revoke insert on table "public"."conversation_prompt_status" from "authenticated";

revoke references on table "public"."conversation_prompt_status" from "authenticated";

revoke select on table "public"."conversation_prompt_status" from "authenticated";

revoke trigger on table "public"."conversation_prompt_status" from "authenticated";

revoke truncate on table "public"."conversation_prompt_status" from "authenticated";

revoke update on table "public"."conversation_prompt_status" from "authenticated";

revoke delete on table "public"."conversation_prompt_status" from "service_role";

revoke insert on table "public"."conversation_prompt_status" from "service_role";

revoke references on table "public"."conversation_prompt_status" from "service_role";

revoke select on table "public"."conversation_prompt_status" from "service_role";

revoke trigger on table "public"."conversation_prompt_status" from "service_role";

revoke truncate on table "public"."conversation_prompt_status" from "service_role";

revoke update on table "public"."conversation_prompt_status" from "service_role";

revoke delete on table "public"."conversation_starter_translations" from "anon";

revoke insert on table "public"."conversation_starter_translations" from "anon";

revoke references on table "public"."conversation_starter_translations" from "anon";

revoke select on table "public"."conversation_starter_translations" from "anon";

revoke trigger on table "public"."conversation_starter_translations" from "anon";

revoke truncate on table "public"."conversation_starter_translations" from "anon";

revoke update on table "public"."conversation_starter_translations" from "anon";

revoke delete on table "public"."conversation_starter_translations" from "authenticated";

revoke insert on table "public"."conversation_starter_translations" from "authenticated";

revoke references on table "public"."conversation_starter_translations" from "authenticated";

revoke select on table "public"."conversation_starter_translations" from "authenticated";

revoke trigger on table "public"."conversation_starter_translations" from "authenticated";

revoke truncate on table "public"."conversation_starter_translations" from "authenticated";

revoke update on table "public"."conversation_starter_translations" from "authenticated";

revoke delete on table "public"."conversation_starter_translations" from "service_role";

revoke insert on table "public"."conversation_starter_translations" from "service_role";

revoke references on table "public"."conversation_starter_translations" from "service_role";

revoke select on table "public"."conversation_starter_translations" from "service_role";

revoke trigger on table "public"."conversation_starter_translations" from "service_role";

revoke truncate on table "public"."conversation_starter_translations" from "service_role";

revoke update on table "public"."conversation_starter_translations" from "service_role";

revoke delete on table "public"."conversation_starters" from "anon";

revoke insert on table "public"."conversation_starters" from "anon";

revoke references on table "public"."conversation_starters" from "anon";

revoke select on table "public"."conversation_starters" from "anon";

revoke trigger on table "public"."conversation_starters" from "anon";

revoke truncate on table "public"."conversation_starters" from "anon";

revoke update on table "public"."conversation_starters" from "anon";

revoke delete on table "public"."conversation_starters" from "authenticated";

revoke insert on table "public"."conversation_starters" from "authenticated";

revoke references on table "public"."conversation_starters" from "authenticated";

revoke select on table "public"."conversation_starters" from "authenticated";

revoke trigger on table "public"."conversation_starters" from "authenticated";

revoke truncate on table "public"."conversation_starters" from "authenticated";

revoke update on table "public"."conversation_starters" from "authenticated";

revoke delete on table "public"."conversation_starters" from "service_role";

revoke insert on table "public"."conversation_starters" from "service_role";

revoke references on table "public"."conversation_starters" from "service_role";

revoke select on table "public"."conversation_starters" from "service_role";

revoke trigger on table "public"."conversation_starters" from "service_role";

revoke truncate on table "public"."conversation_starters" from "service_role";

revoke update on table "public"."conversation_starters" from "service_role";

revoke delete on table "public"."dictation_attempts" from "anon";

revoke insert on table "public"."dictation_attempts" from "anon";

revoke references on table "public"."dictation_attempts" from "anon";

revoke select on table "public"."dictation_attempts" from "anon";

revoke trigger on table "public"."dictation_attempts" from "anon";

revoke truncate on table "public"."dictation_attempts" from "anon";

revoke update on table "public"."dictation_attempts" from "anon";

revoke delete on table "public"."dictation_attempts" from "authenticated";

revoke insert on table "public"."dictation_attempts" from "authenticated";

revoke references on table "public"."dictation_attempts" from "authenticated";

revoke select on table "public"."dictation_attempts" from "authenticated";

revoke trigger on table "public"."dictation_attempts" from "authenticated";

revoke truncate on table "public"."dictation_attempts" from "authenticated";

revoke update on table "public"."dictation_attempts" from "authenticated";

revoke delete on table "public"."dictation_attempts" from "service_role";

revoke insert on table "public"."dictation_attempts" from "service_role";

revoke references on table "public"."dictation_attempts" from "service_role";

revoke select on table "public"."dictation_attempts" from "service_role";

revoke trigger on table "public"."dictation_attempts" from "service_role";

revoke truncate on table "public"."dictation_attempts" from "service_role";

revoke update on table "public"."dictation_attempts" from "service_role";

revoke delete on table "public"."invoices" from "anon";

revoke insert on table "public"."invoices" from "anon";

revoke references on table "public"."invoices" from "anon";

revoke select on table "public"."invoices" from "anon";

revoke trigger on table "public"."invoices" from "anon";

revoke truncate on table "public"."invoices" from "anon";

revoke update on table "public"."invoices" from "anon";

revoke delete on table "public"."invoices" from "authenticated";

revoke insert on table "public"."invoices" from "authenticated";

revoke references on table "public"."invoices" from "authenticated";

revoke select on table "public"."invoices" from "authenticated";

revoke trigger on table "public"."invoices" from "authenticated";

revoke truncate on table "public"."invoices" from "authenticated";

revoke update on table "public"."invoices" from "authenticated";

revoke delete on table "public"."invoices" from "service_role";

revoke insert on table "public"."invoices" from "service_role";

revoke references on table "public"."invoices" from "service_role";

revoke select on table "public"."invoices" from "service_role";

revoke trigger on table "public"."invoices" from "service_role";

revoke truncate on table "public"."invoices" from "service_role";

revoke update on table "public"."invoices" from "service_role";

revoke delete on table "public"."language_levels" from "anon";

revoke insert on table "public"."language_levels" from "anon";

revoke references on table "public"."language_levels" from "anon";

revoke select on table "public"."language_levels" from "anon";

revoke trigger on table "public"."language_levels" from "anon";

revoke truncate on table "public"."language_levels" from "anon";

revoke update on table "public"."language_levels" from "anon";

revoke delete on table "public"."language_levels" from "authenticated";

revoke insert on table "public"."language_levels" from "authenticated";

revoke references on table "public"."language_levels" from "authenticated";

revoke select on table "public"."language_levels" from "authenticated";

revoke trigger on table "public"."language_levels" from "authenticated";

revoke truncate on table "public"."language_levels" from "authenticated";

revoke update on table "public"."language_levels" from "authenticated";

revoke delete on table "public"."language_levels" from "service_role";

revoke insert on table "public"."language_levels" from "service_role";

revoke references on table "public"."language_levels" from "service_role";

revoke select on table "public"."language_levels" from "service_role";

revoke trigger on table "public"."language_levels" from "service_role";

revoke truncate on table "public"."language_levels" from "service_role";

revoke update on table "public"."language_levels" from "service_role";

revoke delete on table "public"."languages" from "anon";

revoke insert on table "public"."languages" from "anon";

revoke references on table "public"."languages" from "anon";

revoke select on table "public"."languages" from "anon";

revoke trigger on table "public"."languages" from "anon";

revoke truncate on table "public"."languages" from "anon";

revoke update on table "public"."languages" from "anon";

revoke delete on table "public"."languages" from "authenticated";

revoke insert on table "public"."languages" from "authenticated";

revoke references on table "public"."languages" from "authenticated";

revoke select on table "public"."languages" from "authenticated";

revoke trigger on table "public"."languages" from "authenticated";

revoke truncate on table "public"."languages" from "authenticated";

revoke update on table "public"."languages" from "authenticated";

revoke delete on table "public"."languages" from "service_role";

revoke insert on table "public"."languages" from "service_role";

revoke references on table "public"."languages" from "service_role";

revoke select on table "public"."languages" from "service_role";

revoke trigger on table "public"."languages" from "service_role";

revoke truncate on table "public"."languages" from "service_role";

revoke update on table "public"."languages" from "service_role";

revoke delete on table "public"."learning_outcome_translations" from "anon";

revoke insert on table "public"."learning_outcome_translations" from "anon";

revoke references on table "public"."learning_outcome_translations" from "anon";

revoke select on table "public"."learning_outcome_translations" from "anon";

revoke trigger on table "public"."learning_outcome_translations" from "anon";

revoke truncate on table "public"."learning_outcome_translations" from "anon";

revoke update on table "public"."learning_outcome_translations" from "anon";

revoke delete on table "public"."learning_outcome_translations" from "authenticated";

revoke insert on table "public"."learning_outcome_translations" from "authenticated";

revoke references on table "public"."learning_outcome_translations" from "authenticated";

revoke select on table "public"."learning_outcome_translations" from "authenticated";

revoke trigger on table "public"."learning_outcome_translations" from "authenticated";

revoke truncate on table "public"."learning_outcome_translations" from "authenticated";

revoke update on table "public"."learning_outcome_translations" from "authenticated";

revoke delete on table "public"."learning_outcome_translations" from "service_role";

revoke insert on table "public"."learning_outcome_translations" from "service_role";

revoke references on table "public"."learning_outcome_translations" from "service_role";

revoke select on table "public"."learning_outcome_translations" from "service_role";

revoke trigger on table "public"."learning_outcome_translations" from "service_role";

revoke truncate on table "public"."learning_outcome_translations" from "service_role";

revoke update on table "public"."learning_outcome_translations" from "service_role";

revoke delete on table "public"."learning_outcomes" from "anon";

revoke insert on table "public"."learning_outcomes" from "anon";

revoke references on table "public"."learning_outcomes" from "anon";

revoke select on table "public"."learning_outcomes" from "anon";

revoke trigger on table "public"."learning_outcomes" from "anon";

revoke truncate on table "public"."learning_outcomes" from "anon";

revoke update on table "public"."learning_outcomes" from "anon";

revoke delete on table "public"."learning_outcomes" from "authenticated";

revoke insert on table "public"."learning_outcomes" from "authenticated";

revoke references on table "public"."learning_outcomes" from "authenticated";

revoke select on table "public"."learning_outcomes" from "authenticated";

revoke trigger on table "public"."learning_outcomes" from "authenticated";

revoke truncate on table "public"."learning_outcomes" from "authenticated";

revoke update on table "public"."learning_outcomes" from "authenticated";

revoke delete on table "public"."learning_outcomes" from "service_role";

revoke insert on table "public"."learning_outcomes" from "service_role";

revoke references on table "public"."learning_outcomes" from "service_role";

revoke select on table "public"."learning_outcomes" from "service_role";

revoke trigger on table "public"."learning_outcomes" from "service_role";

revoke truncate on table "public"."learning_outcomes" from "service_role";

revoke update on table "public"."learning_outcomes" from "service_role";

revoke delete on table "public"."lesson_chat_conversations" from "anon";

revoke insert on table "public"."lesson_chat_conversations" from "anon";

revoke references on table "public"."lesson_chat_conversations" from "anon";

revoke select on table "public"."lesson_chat_conversations" from "anon";

revoke trigger on table "public"."lesson_chat_conversations" from "anon";

revoke truncate on table "public"."lesson_chat_conversations" from "anon";

revoke update on table "public"."lesson_chat_conversations" from "anon";

revoke delete on table "public"."lesson_chat_conversations" from "authenticated";

revoke insert on table "public"."lesson_chat_conversations" from "authenticated";

revoke references on table "public"."lesson_chat_conversations" from "authenticated";

revoke select on table "public"."lesson_chat_conversations" from "authenticated";

revoke trigger on table "public"."lesson_chat_conversations" from "authenticated";

revoke truncate on table "public"."lesson_chat_conversations" from "authenticated";

revoke update on table "public"."lesson_chat_conversations" from "authenticated";

revoke delete on table "public"."lesson_chat_conversations" from "service_role";

revoke insert on table "public"."lesson_chat_conversations" from "service_role";

revoke references on table "public"."lesson_chat_conversations" from "service_role";

revoke select on table "public"."lesson_chat_conversations" from "service_role";

revoke trigger on table "public"."lesson_chat_conversations" from "service_role";

revoke truncate on table "public"."lesson_chat_conversations" from "service_role";

revoke update on table "public"."lesson_chat_conversations" from "service_role";

revoke delete on table "public"."lesson_translations" from "anon";

revoke insert on table "public"."lesson_translations" from "anon";

revoke references on table "public"."lesson_translations" from "anon";

revoke select on table "public"."lesson_translations" from "anon";

revoke trigger on table "public"."lesson_translations" from "anon";

revoke truncate on table "public"."lesson_translations" from "anon";

revoke update on table "public"."lesson_translations" from "anon";

revoke delete on table "public"."lesson_translations" from "authenticated";

revoke insert on table "public"."lesson_translations" from "authenticated";

revoke references on table "public"."lesson_translations" from "authenticated";

revoke select on table "public"."lesson_translations" from "authenticated";

revoke trigger on table "public"."lesson_translations" from "authenticated";

revoke truncate on table "public"."lesson_translations" from "authenticated";

revoke update on table "public"."lesson_translations" from "authenticated";

revoke delete on table "public"."lesson_translations" from "service_role";

revoke insert on table "public"."lesson_translations" from "service_role";

revoke references on table "public"."lesson_translations" from "service_role";

revoke select on table "public"."lesson_translations" from "service_role";

revoke trigger on table "public"."lesson_translations" from "service_role";

revoke truncate on table "public"."lesson_translations" from "service_role";

revoke update on table "public"."lesson_translations" from "service_role";

revoke delete on table "public"."lessons" from "anon";

revoke insert on table "public"."lessons" from "anon";

revoke references on table "public"."lessons" from "anon";

revoke select on table "public"."lessons" from "anon";

revoke trigger on table "public"."lessons" from "anon";

revoke truncate on table "public"."lessons" from "anon";

revoke update on table "public"."lessons" from "anon";

revoke delete on table "public"."lessons" from "authenticated";

revoke insert on table "public"."lessons" from "authenticated";

revoke references on table "public"."lessons" from "authenticated";

revoke select on table "public"."lessons" from "authenticated";

revoke trigger on table "public"."lessons" from "authenticated";

revoke truncate on table "public"."lessons" from "authenticated";

revoke update on table "public"."lessons" from "authenticated";

revoke delete on table "public"."lessons" from "service_role";

revoke insert on table "public"."lessons" from "service_role";

revoke references on table "public"."lessons" from "service_role";

revoke select on table "public"."lessons" from "service_role";

revoke trigger on table "public"."lessons" from "service_role";

revoke truncate on table "public"."lessons" from "service_role";

revoke update on table "public"."lessons" from "service_role";

revoke delete on table "public"."partnership_invitations" from "anon";

revoke insert on table "public"."partnership_invitations" from "anon";

revoke references on table "public"."partnership_invitations" from "anon";

revoke select on table "public"."partnership_invitations" from "anon";

revoke trigger on table "public"."partnership_invitations" from "anon";

revoke truncate on table "public"."partnership_invitations" from "anon";

revoke update on table "public"."partnership_invitations" from "anon";

revoke delete on table "public"."partnership_invitations" from "authenticated";

revoke insert on table "public"."partnership_invitations" from "authenticated";

revoke references on table "public"."partnership_invitations" from "authenticated";

revoke select on table "public"."partnership_invitations" from "authenticated";

revoke trigger on table "public"."partnership_invitations" from "authenticated";

revoke truncate on table "public"."partnership_invitations" from "authenticated";

revoke update on table "public"."partnership_invitations" from "authenticated";

revoke delete on table "public"."partnership_invitations" from "service_role";

revoke insert on table "public"."partnership_invitations" from "service_role";

revoke references on table "public"."partnership_invitations" from "service_role";

revoke select on table "public"."partnership_invitations" from "service_role";

revoke trigger on table "public"."partnership_invitations" from "service_role";

revoke truncate on table "public"."partnership_invitations" from "service_role";

revoke update on table "public"."partnership_invitations" from "service_role";

revoke delete on table "public"."partnerships" from "anon";

revoke insert on table "public"."partnerships" from "anon";

revoke references on table "public"."partnerships" from "anon";

revoke select on table "public"."partnerships" from "anon";

revoke trigger on table "public"."partnerships" from "anon";

revoke truncate on table "public"."partnerships" from "anon";

revoke update on table "public"."partnerships" from "anon";

revoke delete on table "public"."partnerships" from "authenticated";

revoke insert on table "public"."partnerships" from "authenticated";

revoke references on table "public"."partnerships" from "authenticated";

revoke select on table "public"."partnerships" from "authenticated";

revoke trigger on table "public"."partnerships" from "authenticated";

revoke truncate on table "public"."partnerships" from "authenticated";

revoke update on table "public"."partnerships" from "authenticated";

revoke delete on table "public"."partnerships" from "service_role";

revoke insert on table "public"."partnerships" from "service_role";

revoke references on table "public"."partnerships" from "service_role";

revoke select on table "public"."partnerships" from "service_role";

revoke trigger on table "public"."partnerships" from "service_role";

revoke truncate on table "public"."partnerships" from "service_role";

revoke update on table "public"."partnerships" from "service_role";

revoke delete on table "public"."phrase_versions" from "anon";

revoke insert on table "public"."phrase_versions" from "anon";

revoke references on table "public"."phrase_versions" from "anon";

revoke select on table "public"."phrase_versions" from "anon";

revoke trigger on table "public"."phrase_versions" from "anon";

revoke truncate on table "public"."phrase_versions" from "anon";

revoke update on table "public"."phrase_versions" from "anon";

revoke delete on table "public"."phrase_versions" from "authenticated";

revoke insert on table "public"."phrase_versions" from "authenticated";

revoke references on table "public"."phrase_versions" from "authenticated";

revoke select on table "public"."phrase_versions" from "authenticated";

revoke trigger on table "public"."phrase_versions" from "authenticated";

revoke truncate on table "public"."phrase_versions" from "authenticated";

revoke update on table "public"."phrase_versions" from "authenticated";

revoke delete on table "public"."phrase_versions" from "service_role";

revoke insert on table "public"."phrase_versions" from "service_role";

revoke references on table "public"."phrase_versions" from "service_role";

revoke select on table "public"."phrase_versions" from "service_role";

revoke trigger on table "public"."phrase_versions" from "service_role";

revoke truncate on table "public"."phrase_versions" from "service_role";

revoke update on table "public"."phrase_versions" from "service_role";

revoke delete on table "public"."prices" from "anon";

revoke insert on table "public"."prices" from "anon";

revoke references on table "public"."prices" from "anon";

revoke select on table "public"."prices" from "anon";

revoke trigger on table "public"."prices" from "anon";

revoke truncate on table "public"."prices" from "anon";

revoke update on table "public"."prices" from "anon";

revoke delete on table "public"."prices" from "authenticated";

revoke insert on table "public"."prices" from "authenticated";

revoke references on table "public"."prices" from "authenticated";

revoke select on table "public"."prices" from "authenticated";

revoke trigger on table "public"."prices" from "authenticated";

revoke truncate on table "public"."prices" from "authenticated";

revoke update on table "public"."prices" from "authenticated";

revoke delete on table "public"."prices" from "service_role";

revoke insert on table "public"."prices" from "service_role";

revoke references on table "public"."prices" from "service_role";

revoke select on table "public"."prices" from "service_role";

revoke trigger on table "public"."prices" from "service_role";

revoke truncate on table "public"."prices" from "service_role";

revoke update on table "public"."prices" from "service_role";

revoke delete on table "public"."products" from "anon";

revoke insert on table "public"."products" from "anon";

revoke references on table "public"."products" from "anon";

revoke select on table "public"."products" from "anon";

revoke trigger on table "public"."products" from "anon";

revoke truncate on table "public"."products" from "anon";

revoke update on table "public"."products" from "anon";

revoke delete on table "public"."products" from "authenticated";

revoke insert on table "public"."products" from "authenticated";

revoke references on table "public"."products" from "authenticated";

revoke select on table "public"."products" from "authenticated";

revoke trigger on table "public"."products" from "authenticated";

revoke truncate on table "public"."products" from "authenticated";

revoke update on table "public"."products" from "authenticated";

revoke delete on table "public"."products" from "service_role";

revoke insert on table "public"."products" from "service_role";

revoke references on table "public"."products" from "service_role";

revoke select on table "public"."products" from "service_role";

revoke trigger on table "public"."products" from "service_role";

revoke truncate on table "public"."products" from "service_role";

revoke update on table "public"."products" from "service_role";

revoke delete on table "public"."profiles" from "anon";

revoke insert on table "public"."profiles" from "anon";

revoke references on table "public"."profiles" from "anon";

revoke select on table "public"."profiles" from "anon";

revoke trigger on table "public"."profiles" from "anon";

revoke truncate on table "public"."profiles" from "anon";

revoke update on table "public"."profiles" from "anon";

revoke delete on table "public"."profiles" from "authenticated";

revoke insert on table "public"."profiles" from "authenticated";

revoke references on table "public"."profiles" from "authenticated";

revoke select on table "public"."profiles" from "authenticated";

revoke trigger on table "public"."profiles" from "authenticated";

revoke truncate on table "public"."profiles" from "authenticated";

revoke update on table "public"."profiles" from "authenticated";

revoke delete on table "public"."profiles" from "service_role";

revoke insert on table "public"."profiles" from "service_role";

revoke references on table "public"."profiles" from "service_role";

revoke select on table "public"."profiles" from "service_role";

revoke trigger on table "public"."profiles" from "service_role";

revoke truncate on table "public"."profiles" from "service_role";

revoke update on table "public"."profiles" from "service_role";

revoke delete on table "public"."speech_attempts" from "anon";

revoke insert on table "public"."speech_attempts" from "anon";

revoke references on table "public"."speech_attempts" from "anon";

revoke select on table "public"."speech_attempts" from "anon";

revoke trigger on table "public"."speech_attempts" from "anon";

revoke truncate on table "public"."speech_attempts" from "anon";

revoke update on table "public"."speech_attempts" from "anon";

revoke delete on table "public"."speech_attempts" from "authenticated";

revoke insert on table "public"."speech_attempts" from "authenticated";

revoke references on table "public"."speech_attempts" from "authenticated";

revoke select on table "public"."speech_attempts" from "authenticated";

revoke trigger on table "public"."speech_attempts" from "authenticated";

revoke truncate on table "public"."speech_attempts" from "authenticated";

revoke update on table "public"."speech_attempts" from "authenticated";

revoke delete on table "public"."speech_attempts" from "service_role";

revoke insert on table "public"."speech_attempts" from "service_role";

revoke references on table "public"."speech_attempts" from "service_role";

revoke select on table "public"."speech_attempts" from "service_role";

revoke trigger on table "public"."speech_attempts" from "service_role";

revoke truncate on table "public"."speech_attempts" from "service_role";

revoke update on table "public"."speech_attempts" from "service_role";

revoke delete on table "public"."student_profiles" from "anon";

revoke insert on table "public"."student_profiles" from "anon";

revoke references on table "public"."student_profiles" from "anon";

revoke select on table "public"."student_profiles" from "anon";

revoke trigger on table "public"."student_profiles" from "anon";

revoke truncate on table "public"."student_profiles" from "anon";

revoke update on table "public"."student_profiles" from "anon";

revoke delete on table "public"."student_profiles" from "authenticated";

revoke insert on table "public"."student_profiles" from "authenticated";

revoke references on table "public"."student_profiles" from "authenticated";

revoke select on table "public"."student_profiles" from "authenticated";

revoke trigger on table "public"."student_profiles" from "authenticated";

revoke truncate on table "public"."student_profiles" from "authenticated";

revoke update on table "public"."student_profiles" from "authenticated";

revoke delete on table "public"."student_profiles" from "service_role";

revoke insert on table "public"."student_profiles" from "service_role";

revoke references on table "public"."student_profiles" from "service_role";

revoke select on table "public"."student_profiles" from "service_role";

revoke trigger on table "public"."student_profiles" from "service_role";

revoke truncate on table "public"."student_profiles" from "service_role";

revoke update on table "public"."student_profiles" from "service_role";

revoke delete on table "public"."student_subscriptions" from "anon";

revoke insert on table "public"."student_subscriptions" from "anon";

revoke references on table "public"."student_subscriptions" from "anon";

revoke select on table "public"."student_subscriptions" from "anon";

revoke trigger on table "public"."student_subscriptions" from "anon";

revoke truncate on table "public"."student_subscriptions" from "anon";

revoke update on table "public"."student_subscriptions" from "anon";

revoke delete on table "public"."student_subscriptions" from "authenticated";

revoke insert on table "public"."student_subscriptions" from "authenticated";

revoke references on table "public"."student_subscriptions" from "authenticated";

revoke select on table "public"."student_subscriptions" from "authenticated";

revoke trigger on table "public"."student_subscriptions" from "authenticated";

revoke truncate on table "public"."student_subscriptions" from "authenticated";

revoke update on table "public"."student_subscriptions" from "authenticated";

revoke delete on table "public"."student_subscriptions" from "service_role";

revoke insert on table "public"."student_subscriptions" from "service_role";

revoke references on table "public"."student_subscriptions" from "service_role";

revoke select on table "public"."student_subscriptions" from "service_role";

revoke trigger on table "public"."student_subscriptions" from "service_role";

revoke truncate on table "public"."student_subscriptions" from "service_role";

revoke update on table "public"."student_subscriptions" from "service_role";

revoke delete on table "public"."student_target_languages" from "anon";

revoke insert on table "public"."student_target_languages" from "anon";

revoke references on table "public"."student_target_languages" from "anon";

revoke select on table "public"."student_target_languages" from "anon";

revoke trigger on table "public"."student_target_languages" from "anon";

revoke truncate on table "public"."student_target_languages" from "anon";

revoke update on table "public"."student_target_languages" from "anon";

revoke delete on table "public"."student_target_languages" from "authenticated";

revoke insert on table "public"."student_target_languages" from "authenticated";

revoke references on table "public"."student_target_languages" from "authenticated";

revoke select on table "public"."student_target_languages" from "authenticated";

revoke trigger on table "public"."student_target_languages" from "authenticated";

revoke truncate on table "public"."student_target_languages" from "authenticated";

revoke update on table "public"."student_target_languages" from "authenticated";

revoke delete on table "public"."student_target_languages" from "service_role";

revoke insert on table "public"."student_target_languages" from "service_role";

revoke references on table "public"."student_target_languages" from "service_role";

revoke select on table "public"."student_target_languages" from "service_role";

revoke trigger on table "public"."student_target_languages" from "service_role";

revoke truncate on table "public"."student_target_languages" from "service_role";

revoke update on table "public"."student_target_languages" from "service_role";

revoke delete on table "public"."tour_steps" from "anon";

revoke insert on table "public"."tour_steps" from "anon";

revoke references on table "public"."tour_steps" from "anon";

revoke select on table "public"."tour_steps" from "anon";

revoke trigger on table "public"."tour_steps" from "anon";

revoke truncate on table "public"."tour_steps" from "anon";

revoke update on table "public"."tour_steps" from "anon";

revoke delete on table "public"."tour_steps" from "authenticated";

revoke insert on table "public"."tour_steps" from "authenticated";

revoke references on table "public"."tour_steps" from "authenticated";

revoke select on table "public"."tour_steps" from "authenticated";

revoke trigger on table "public"."tour_steps" from "authenticated";

revoke truncate on table "public"."tour_steps" from "authenticated";

revoke update on table "public"."tour_steps" from "authenticated";

revoke delete on table "public"."tour_steps" from "service_role";

revoke insert on table "public"."tour_steps" from "service_role";

revoke references on table "public"."tour_steps" from "service_role";

revoke select on table "public"."tour_steps" from "service_role";

revoke trigger on table "public"."tour_steps" from "service_role";

revoke truncate on table "public"."tour_steps" from "service_role";

revoke update on table "public"."tour_steps" from "service_role";

revoke delete on table "public"."tours" from "anon";

revoke insert on table "public"."tours" from "anon";

revoke references on table "public"."tours" from "anon";

revoke select on table "public"."tours" from "anon";

revoke trigger on table "public"."tours" from "anon";

revoke truncate on table "public"."tours" from "anon";

revoke update on table "public"."tours" from "anon";

revoke delete on table "public"."tours" from "authenticated";

revoke insert on table "public"."tours" from "authenticated";

revoke references on table "public"."tours" from "authenticated";

revoke select on table "public"."tours" from "authenticated";

revoke trigger on table "public"."tours" from "authenticated";

revoke truncate on table "public"."tours" from "authenticated";

revoke update on table "public"."tours" from "authenticated";

revoke delete on table "public"."tours" from "service_role";

revoke insert on table "public"."tours" from "service_role";

revoke references on table "public"."tours" from "service_role";

revoke select on table "public"."tours" from "service_role";

revoke trigger on table "public"."tours" from "service_role";

revoke truncate on table "public"."tours" from "service_role";

revoke update on table "public"."tours" from "service_role";

revoke delete on table "public"."unit_translations" from "anon";

revoke insert on table "public"."unit_translations" from "anon";

revoke references on table "public"."unit_translations" from "anon";

revoke select on table "public"."unit_translations" from "anon";

revoke trigger on table "public"."unit_translations" from "anon";

revoke truncate on table "public"."unit_translations" from "anon";

revoke update on table "public"."unit_translations" from "anon";

revoke delete on table "public"."unit_translations" from "authenticated";

revoke insert on table "public"."unit_translations" from "authenticated";

revoke references on table "public"."unit_translations" from "authenticated";

revoke select on table "public"."unit_translations" from "authenticated";

revoke trigger on table "public"."unit_translations" from "authenticated";

revoke truncate on table "public"."unit_translations" from "authenticated";

revoke update on table "public"."unit_translations" from "authenticated";

revoke delete on table "public"."unit_translations" from "service_role";

revoke insert on table "public"."unit_translations" from "service_role";

revoke references on table "public"."unit_translations" from "service_role";

revoke select on table "public"."unit_translations" from "service_role";

revoke trigger on table "public"."unit_translations" from "service_role";

revoke truncate on table "public"."unit_translations" from "service_role";

revoke update on table "public"."unit_translations" from "service_role";

revoke delete on table "public"."units" from "anon";

revoke insert on table "public"."units" from "anon";

revoke references on table "public"."units" from "anon";

revoke select on table "public"."units" from "anon";

revoke trigger on table "public"."units" from "anon";

revoke truncate on table "public"."units" from "anon";

revoke update on table "public"."units" from "anon";

revoke delete on table "public"."units" from "authenticated";

revoke insert on table "public"."units" from "authenticated";

revoke references on table "public"."units" from "authenticated";

revoke select on table "public"."units" from "authenticated";

revoke trigger on table "public"."units" from "authenticated";

revoke truncate on table "public"."units" from "authenticated";

revoke update on table "public"."units" from "authenticated";

revoke delete on table "public"."units" from "service_role";

revoke insert on table "public"."units" from "service_role";

revoke references on table "public"."units" from "service_role";

revoke select on table "public"."units" from "service_role";

revoke trigger on table "public"."units" from "service_role";

revoke truncate on table "public"."units" from "service_role";

revoke update on table "public"."units" from "service_role";

revoke delete on table "public"."user_audiobook_progress" from "anon";

revoke insert on table "public"."user_audiobook_progress" from "anon";

revoke references on table "public"."user_audiobook_progress" from "anon";

revoke select on table "public"."user_audiobook_progress" from "anon";

revoke trigger on table "public"."user_audiobook_progress" from "anon";

revoke truncate on table "public"."user_audiobook_progress" from "anon";

revoke update on table "public"."user_audiobook_progress" from "anon";

revoke delete on table "public"."user_audiobook_progress" from "authenticated";

revoke insert on table "public"."user_audiobook_progress" from "authenticated";

revoke references on table "public"."user_audiobook_progress" from "authenticated";

revoke select on table "public"."user_audiobook_progress" from "authenticated";

revoke trigger on table "public"."user_audiobook_progress" from "authenticated";

revoke truncate on table "public"."user_audiobook_progress" from "authenticated";

revoke update on table "public"."user_audiobook_progress" from "authenticated";

revoke delete on table "public"."user_audiobook_progress" from "service_role";

revoke insert on table "public"."user_audiobook_progress" from "service_role";

revoke references on table "public"."user_audiobook_progress" from "service_role";

revoke select on table "public"."user_audiobook_progress" from "service_role";

revoke trigger on table "public"."user_audiobook_progress" from "service_role";

revoke truncate on table "public"."user_audiobook_progress" from "service_role";

revoke update on table "public"."user_audiobook_progress" from "service_role";

revoke delete on table "public"."user_audiobook_purchases" from "anon";

revoke insert on table "public"."user_audiobook_purchases" from "anon";

revoke references on table "public"."user_audiobook_purchases" from "anon";

revoke select on table "public"."user_audiobook_purchases" from "anon";

revoke trigger on table "public"."user_audiobook_purchases" from "anon";

revoke truncate on table "public"."user_audiobook_purchases" from "anon";

revoke update on table "public"."user_audiobook_purchases" from "anon";

revoke delete on table "public"."user_audiobook_purchases" from "authenticated";

revoke insert on table "public"."user_audiobook_purchases" from "authenticated";

revoke references on table "public"."user_audiobook_purchases" from "authenticated";

revoke select on table "public"."user_audiobook_purchases" from "authenticated";

revoke trigger on table "public"."user_audiobook_purchases" from "authenticated";

revoke truncate on table "public"."user_audiobook_purchases" from "authenticated";

revoke update on table "public"."user_audiobook_purchases" from "authenticated";

revoke delete on table "public"."user_audiobook_purchases" from "service_role";

revoke insert on table "public"."user_audiobook_purchases" from "service_role";

revoke references on table "public"."user_audiobook_purchases" from "service_role";

revoke select on table "public"."user_audiobook_purchases" from "service_role";

revoke trigger on table "public"."user_audiobook_purchases" from "service_role";

revoke truncate on table "public"."user_audiobook_purchases" from "service_role";

revoke update on table "public"."user_audiobook_purchases" from "service_role";

revoke delete on table "public"."user_lesson_activity_progress" from "anon";

revoke insert on table "public"."user_lesson_activity_progress" from "anon";

revoke references on table "public"."user_lesson_activity_progress" from "anon";

revoke select on table "public"."user_lesson_activity_progress" from "anon";

revoke trigger on table "public"."user_lesson_activity_progress" from "anon";

revoke truncate on table "public"."user_lesson_activity_progress" from "anon";

revoke update on table "public"."user_lesson_activity_progress" from "anon";

revoke delete on table "public"."user_lesson_activity_progress" from "authenticated";

revoke insert on table "public"."user_lesson_activity_progress" from "authenticated";

revoke references on table "public"."user_lesson_activity_progress" from "authenticated";

revoke select on table "public"."user_lesson_activity_progress" from "authenticated";

revoke trigger on table "public"."user_lesson_activity_progress" from "authenticated";

revoke truncate on table "public"."user_lesson_activity_progress" from "authenticated";

revoke update on table "public"."user_lesson_activity_progress" from "authenticated";

revoke delete on table "public"."user_lesson_activity_progress" from "service_role";

revoke insert on table "public"."user_lesson_activity_progress" from "service_role";

revoke references on table "public"."user_lesson_activity_progress" from "service_role";

revoke select on table "public"."user_lesson_activity_progress" from "service_role";

revoke trigger on table "public"."user_lesson_activity_progress" from "service_role";

revoke truncate on table "public"."user_lesson_activity_progress" from "service_role";

revoke update on table "public"."user_lesson_activity_progress" from "service_role";

revoke delete on table "public"."user_lesson_progress" from "anon";

revoke insert on table "public"."user_lesson_progress" from "anon";

revoke references on table "public"."user_lesson_progress" from "anon";

revoke select on table "public"."user_lesson_progress" from "anon";

revoke trigger on table "public"."user_lesson_progress" from "anon";

revoke truncate on table "public"."user_lesson_progress" from "anon";

revoke update on table "public"."user_lesson_progress" from "anon";

revoke delete on table "public"."user_lesson_progress" from "authenticated";

revoke insert on table "public"."user_lesson_progress" from "authenticated";

revoke references on table "public"."user_lesson_progress" from "authenticated";

revoke select on table "public"."user_lesson_progress" from "authenticated";

revoke trigger on table "public"."user_lesson_progress" from "authenticated";

revoke truncate on table "public"."user_lesson_progress" from "authenticated";

revoke update on table "public"."user_lesson_progress" from "authenticated";

revoke delete on table "public"."user_lesson_progress" from "service_role";

revoke insert on table "public"."user_lesson_progress" from "service_role";

revoke references on table "public"."user_lesson_progress" from "service_role";

revoke select on table "public"."user_lesson_progress" from "service_role";

revoke trigger on table "public"."user_lesson_progress" from "service_role";

revoke truncate on table "public"."user_lesson_progress" from "service_role";

revoke update on table "public"."user_lesson_progress" from "service_role";

revoke delete on table "public"."user_level_completion" from "anon";

revoke insert on table "public"."user_level_completion" from "anon";

revoke references on table "public"."user_level_completion" from "anon";

revoke select on table "public"."user_level_completion" from "anon";

revoke trigger on table "public"."user_level_completion" from "anon";

revoke truncate on table "public"."user_level_completion" from "anon";

revoke update on table "public"."user_level_completion" from "anon";

revoke delete on table "public"."user_level_completion" from "authenticated";

revoke insert on table "public"."user_level_completion" from "authenticated";

revoke references on table "public"."user_level_completion" from "authenticated";

revoke select on table "public"."user_level_completion" from "authenticated";

revoke trigger on table "public"."user_level_completion" from "authenticated";

revoke truncate on table "public"."user_level_completion" from "authenticated";

revoke update on table "public"."user_level_completion" from "authenticated";

revoke delete on table "public"."user_level_completion" from "service_role";

revoke insert on table "public"."user_level_completion" from "service_role";

revoke references on table "public"."user_level_completion" from "service_role";

revoke select on table "public"."user_level_completion" from "service_role";

revoke trigger on table "public"."user_level_completion" from "service_role";

revoke truncate on table "public"."user_level_completion" from "service_role";

revoke update on table "public"."user_level_completion" from "service_role";

revoke delete on table "public"."user_phrase_progress" from "anon";

revoke insert on table "public"."user_phrase_progress" from "anon";

revoke references on table "public"."user_phrase_progress" from "anon";

revoke select on table "public"."user_phrase_progress" from "anon";

revoke trigger on table "public"."user_phrase_progress" from "anon";

revoke truncate on table "public"."user_phrase_progress" from "anon";

revoke update on table "public"."user_phrase_progress" from "anon";

revoke delete on table "public"."user_phrase_progress" from "authenticated";

revoke insert on table "public"."user_phrase_progress" from "authenticated";

revoke references on table "public"."user_phrase_progress" from "authenticated";

revoke select on table "public"."user_phrase_progress" from "authenticated";

revoke trigger on table "public"."user_phrase_progress" from "authenticated";

revoke truncate on table "public"."user_phrase_progress" from "authenticated";

revoke update on table "public"."user_phrase_progress" from "authenticated";

revoke delete on table "public"."user_phrase_progress" from "service_role";

revoke insert on table "public"."user_phrase_progress" from "service_role";

revoke references on table "public"."user_phrase_progress" from "service_role";

revoke select on table "public"."user_phrase_progress" from "service_role";

revoke trigger on table "public"."user_phrase_progress" from "service_role";

revoke truncate on table "public"."user_phrase_progress" from "service_role";

revoke update on table "public"."user_phrase_progress" from "service_role";

revoke delete on table "public"."user_points_log" from "anon";

revoke insert on table "public"."user_points_log" from "anon";

revoke references on table "public"."user_points_log" from "anon";

revoke select on table "public"."user_points_log" from "anon";

revoke trigger on table "public"."user_points_log" from "anon";

revoke truncate on table "public"."user_points_log" from "anon";

revoke update on table "public"."user_points_log" from "anon";

revoke delete on table "public"."user_points_log" from "authenticated";

revoke insert on table "public"."user_points_log" from "authenticated";

revoke references on table "public"."user_points_log" from "authenticated";

revoke select on table "public"."user_points_log" from "authenticated";

revoke trigger on table "public"."user_points_log" from "authenticated";

revoke truncate on table "public"."user_points_log" from "authenticated";

revoke update on table "public"."user_points_log" from "authenticated";

revoke delete on table "public"."user_points_log" from "service_role";

revoke insert on table "public"."user_points_log" from "service_role";

revoke references on table "public"."user_points_log" from "service_role";

revoke select on table "public"."user_points_log" from "service_role";

revoke trigger on table "public"."user_points_log" from "service_role";

revoke truncate on table "public"."user_points_log" from "service_role";

revoke update on table "public"."user_points_log" from "service_role";

revoke delete on table "public"."user_tour_progress" from "anon";

revoke insert on table "public"."user_tour_progress" from "anon";

revoke references on table "public"."user_tour_progress" from "anon";

revoke select on table "public"."user_tour_progress" from "anon";

revoke trigger on table "public"."user_tour_progress" from "anon";

revoke truncate on table "public"."user_tour_progress" from "anon";

revoke update on table "public"."user_tour_progress" from "anon";

revoke delete on table "public"."user_tour_progress" from "authenticated";

revoke insert on table "public"."user_tour_progress" from "authenticated";

revoke references on table "public"."user_tour_progress" from "authenticated";

revoke select on table "public"."user_tour_progress" from "authenticated";

revoke trigger on table "public"."user_tour_progress" from "authenticated";

revoke truncate on table "public"."user_tour_progress" from "authenticated";

revoke update on table "public"."user_tour_progress" from "authenticated";

revoke delete on table "public"."user_tour_progress" from "service_role";

revoke insert on table "public"."user_tour_progress" from "service_role";

revoke references on table "public"."user_tour_progress" from "service_role";

revoke select on table "public"."user_tour_progress" from "service_role";

revoke trigger on table "public"."user_tour_progress" from "service_role";

revoke truncate on table "public"."user_tour_progress" from "service_role";

revoke update on table "public"."user_tour_progress" from "service_role";

revoke delete on table "public"."user_word_pronunciation" from "anon";

revoke insert on table "public"."user_word_pronunciation" from "anon";

revoke references on table "public"."user_word_pronunciation" from "anon";

revoke select on table "public"."user_word_pronunciation" from "anon";

revoke trigger on table "public"."user_word_pronunciation" from "anon";

revoke truncate on table "public"."user_word_pronunciation" from "anon";

revoke update on table "public"."user_word_pronunciation" from "anon";

revoke delete on table "public"."user_word_pronunciation" from "authenticated";

revoke insert on table "public"."user_word_pronunciation" from "authenticated";

revoke references on table "public"."user_word_pronunciation" from "authenticated";

revoke select on table "public"."user_word_pronunciation" from "authenticated";

revoke trigger on table "public"."user_word_pronunciation" from "authenticated";

revoke truncate on table "public"."user_word_pronunciation" from "authenticated";

revoke update on table "public"."user_word_pronunciation" from "authenticated";

revoke delete on table "public"."user_word_pronunciation" from "service_role";

revoke insert on table "public"."user_word_pronunciation" from "service_role";

revoke references on table "public"."user_word_pronunciation" from "service_role";

revoke select on table "public"."user_word_pronunciation" from "service_role";

revoke trigger on table "public"."user_word_pronunciation" from "service_role";

revoke truncate on table "public"."user_word_pronunciation" from "service_role";

revoke update on table "public"."user_word_pronunciation" from "service_role";

revoke delete on table "public"."user_word_spelling" from "anon";

revoke insert on table "public"."user_word_spelling" from "anon";

revoke references on table "public"."user_word_spelling" from "anon";

revoke select on table "public"."user_word_spelling" from "anon";

revoke trigger on table "public"."user_word_spelling" from "anon";

revoke truncate on table "public"."user_word_spelling" from "anon";

revoke update on table "public"."user_word_spelling" from "anon";

revoke delete on table "public"."user_word_spelling" from "authenticated";

revoke insert on table "public"."user_word_spelling" from "authenticated";

revoke references on table "public"."user_word_spelling" from "authenticated";

revoke select on table "public"."user_word_spelling" from "authenticated";

revoke trigger on table "public"."user_word_spelling" from "authenticated";

revoke truncate on table "public"."user_word_spelling" from "authenticated";

revoke update on table "public"."user_word_spelling" from "authenticated";

revoke delete on table "public"."user_word_spelling" from "service_role";

revoke insert on table "public"."user_word_spelling" from "service_role";

revoke references on table "public"."user_word_spelling" from "service_role";

revoke select on table "public"."user_word_spelling" from "service_role";

revoke trigger on table "public"."user_word_spelling" from "service_role";

revoke truncate on table "public"."user_word_spelling" from "service_role";

revoke update on table "public"."user_word_spelling" from "service_role";

revoke delete on table "public"."vocabulary_phrases" from "anon";

revoke insert on table "public"."vocabulary_phrases" from "anon";

revoke references on table "public"."vocabulary_phrases" from "anon";

revoke select on table "public"."vocabulary_phrases" from "anon";

revoke trigger on table "public"."vocabulary_phrases" from "anon";

revoke truncate on table "public"."vocabulary_phrases" from "anon";

revoke update on table "public"."vocabulary_phrases" from "anon";

revoke delete on table "public"."vocabulary_phrases" from "authenticated";

revoke insert on table "public"."vocabulary_phrases" from "authenticated";

revoke references on table "public"."vocabulary_phrases" from "authenticated";

revoke select on table "public"."vocabulary_phrases" from "authenticated";

revoke trigger on table "public"."vocabulary_phrases" from "authenticated";

revoke truncate on table "public"."vocabulary_phrases" from "authenticated";

revoke update on table "public"."vocabulary_phrases" from "authenticated";

revoke delete on table "public"."vocabulary_phrases" from "service_role";

revoke insert on table "public"."vocabulary_phrases" from "service_role";

revoke references on table "public"."vocabulary_phrases" from "service_role";

revoke select on table "public"."vocabulary_phrases" from "service_role";

revoke trigger on table "public"."vocabulary_phrases" from "service_role";

revoke truncate on table "public"."vocabulary_phrases" from "service_role";

revoke update on table "public"."vocabulary_phrases" from "service_role";

alter table "public"."audiobooks" drop constraint "fk_audiobooks_language";

alter table "public"."audiobooks" drop constraint "fk_audiobooks_level";

alter table "public"."user_audiobook_progress" drop constraint "user_audiobook_progress_chapter_id_fkey";


  create table "public"."user_audiobook_chapter_progress" (
    "id" integer not null default nextval('user_audiobook_chapter_progress_id_seq'::regclass),
    "profile_id" uuid not null,
    "book_id" integer not null,
    "chapter_id" integer not null,
    "current_position_seconds" numeric default 0,
    "is_completed" boolean default false,
    "completed_at" timestamp with time zone,
    "last_listened_at" timestamp with time zone default now(),
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."user_audiobook_chapter_progress" enable row level security;

alter table "public"."audiobook_alignment" enable row level security;

alter table "public"."audiobook_chapters" add column "video_url" text;

alter table "public"."audiobook_chapters" alter column "audio_url" drop not null;

alter table "public"."audiobook_chapters" alter column "book_id" set data type integer using "book_id"::integer;

alter table "public"."audiobook_chapters" enable row level security;

alter table "public"."audiobooks" drop column "audio_url";

alter table "public"."audiobooks" enable row level security;

alter table "public"."products" add column "book_id" integer;

alter table "public"."products" add column "product_type" character varying default 'subscription'::character varying;

alter table "public"."student_profiles" add column "preferences" jsonb default '{}'::jsonb;

alter table "public"."user_audiobook_progress" add column "completed_chapters" integer default 0;

alter table "public"."user_audiobook_progress" add column "completion_percentage" numeric default 0;

alter table "public"."user_audiobook_progress" add column "total_chapters" integer default 0;

alter table "public"."user_audiobook_progress" enable row level security;

alter table "public"."user_audiobook_purchases" enable row level security;

alter sequence "public"."user_audiobook_chapter_progress_id_seq" owned by "public"."user_audiobook_chapter_progress"."id";

CREATE INDEX idx_products_book_id ON public.products USING btree (book_id);

CREATE INDEX idx_products_type ON public.products USING btree (product_type);

CREATE INDEX idx_user_audiobook_chapter_progress_chapter ON public.user_audiobook_chapter_progress USING btree (chapter_id);

CREATE INDEX idx_user_audiobook_chapter_progress_completed ON public.user_audiobook_chapter_progress USING btree (profile_id, book_id, is_completed);

CREATE INDEX idx_user_audiobook_chapter_progress_profile_book ON public.user_audiobook_chapter_progress USING btree (profile_id, book_id);

CREATE UNIQUE INDEX user_audiobook_chapter_progre_profile_id_book_id_chapter_id_key ON public.user_audiobook_chapter_progress USING btree (profile_id, book_id, chapter_id);

CREATE UNIQUE INDEX user_audiobook_chapter_progress_pkey ON public.user_audiobook_chapter_progress USING btree (id);

alter table "public"."user_audiobook_chapter_progress" add constraint "user_audiobook_chapter_progress_pkey" PRIMARY KEY using index "user_audiobook_chapter_progress_pkey";

alter table "public"."audiobooks" add constraint "audiobooks_language_code_fkey" FOREIGN KEY (language_code) REFERENCES languages(language_code) not valid;

alter table "public"."audiobooks" validate constraint "audiobooks_language_code_fkey";

alter table "public"."audiobooks" add constraint "audiobooks_level_code_fkey" FOREIGN KEY (level_code) REFERENCES language_levels(level_code) not valid;

alter table "public"."audiobooks" validate constraint "audiobooks_level_code_fkey";

alter table "public"."products" add constraint "products_book_id_fkey" FOREIGN KEY (book_id) REFERENCES audiobooks(book_id) not valid;

alter table "public"."products" validate constraint "products_book_id_fkey";

alter table "public"."user_audiobook_chapter_progress" add constraint "user_audiobook_chapter_progre_profile_id_book_id_chapter_id_key" UNIQUE using index "user_audiobook_chapter_progre_profile_id_book_id_chapter_id_key";

alter table "public"."user_audiobook_chapter_progress" add constraint "user_audiobook_chapter_progress_book_id_fkey" FOREIGN KEY (book_id) REFERENCES audiobooks(book_id) not valid;

alter table "public"."user_audiobook_chapter_progress" validate constraint "user_audiobook_chapter_progress_book_id_fkey";

alter table "public"."user_audiobook_chapter_progress" add constraint "user_audiobook_chapter_progress_chapter_id_fkey" FOREIGN KEY (chapter_id) REFERENCES audiobook_chapters(chapter_id) not valid;

alter table "public"."user_audiobook_chapter_progress" validate constraint "user_audiobook_chapter_progress_chapter_id_fkey";

alter table "public"."user_audiobook_chapter_progress" add constraint "user_audiobook_chapter_progress_profile_id_fkey" FOREIGN KEY (profile_id) REFERENCES student_profiles(profile_id) not valid;

alter table "public"."user_audiobook_chapter_progress" validate constraint "user_audiobook_chapter_progress_profile_id_fkey";

alter table "public"."user_audiobook_progress" add constraint "user_audiobook_progress_current_chapter_id_fkey" FOREIGN KEY (current_chapter_id) REFERENCES audiobook_chapters(chapter_id) not valid;

alter table "public"."user_audiobook_progress" validate constraint "user_audiobook_progress_current_chapter_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.calculate_book_completion(p_profile_id uuid, p_book_id integer)
 RETURNS TABLE(total_chapters integer, completed_chapters integer, completion_percentage numeric, is_book_completed boolean)
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_total_chapters INTEGER;
    v_completed_chapters INTEGER;
    v_completion_percentage NUMERIC;
    v_is_book_completed BOOLEAN;
BEGIN
    -- Get total chapters for the book
    SELECT COUNT(*) INTO v_total_chapters
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
$function$
;

CREATE OR REPLACE FUNCTION public.check_audiobook_ownership(p_profile_id uuid, p_book_id integer)
 RETURNS boolean
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_audiobook_purchases
    WHERE profile_id = p_profile_id AND book_id = p_book_id
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_audiobook_purchases(p_profile_id uuid)
 RETURNS TABLE(book_id integer, title character varying, author character varying, cover_image_url character varying, purchase_type purchase_type_enum, amount_paid_cents integer, points_spent integer, purchased_at timestamp with time zone, invoice_pdf_url text, hosted_invoice_url text)
 LANGUAGE plpgsql
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_chapter_added()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    -- When a new chapter is added, update all user progress for this book
    -- to reflect the new total and recalculate completion
    UPDATE public.user_audiobook_progress 
    SET 
        total_chapters = (
            SELECT COUNT(*) 
            FROM public.audiobook_chapters 
            WHERE book_id = NEW.book_id
        ),
        completion_percentage = (
            SELECT LEAST(100, CASE 
                WHEN COUNT(ac.*) > 0 THEN 
                    (COUNT(CASE WHEN uacp.is_completed THEN 1 END)::NUMERIC / COUNT(ac.*)::NUMERIC) * 100
                ELSE 0 
            END)
            FROM public.audiobook_chapters ac
            LEFT JOIN public.user_audiobook_chapter_progress uacp 
                ON ac.chapter_id = uacp.chapter_id 
                AND uacp.profile_id = user_audiobook_progress.profile_id
            WHERE ac.book_id = NEW.book_id
        ),
        is_completed = false, -- Reset completion status when new chapters are added
        completed_at = NULL   -- Clear completion timestamp
    WHERE book_id = NEW.book_id;
    
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.redeem_partnership_invitation(p_token uuid, p_user_id uuid)
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
  SELECT * INTO v_invitation
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
$function$
;

CREATE OR REPLACE FUNCTION public.update_audiobook_duration()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.update_chapter_progress(p_profile_id uuid, p_book_id integer, p_chapter_id integer, p_position_seconds numeric, p_chapter_duration_seconds integer DEFAULT NULL::integer)
 RETURNS boolean
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_is_completed BOOLEAN := false;
    v_completion_threshold NUMERIC := 0.95;
BEGIN
    -- Determine if chapter is completed (95% watched or explicit completion)
    IF p_chapter_duration_seconds IS NOT NULL AND p_position_seconds >= (p_chapter_duration_seconds * v_completion_threshold) THEN
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
$function$
;

CREATE OR REPLACE FUNCTION public.upsert_audiobook_purchase(p_stripe_invoice_id text, p_stripe_customer_id text, p_invoice_data jsonb)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
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
$function$
;

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
;

CREATE OR REPLACE FUNCTION public.can_user_access_lesson(profile_id_param uuid, lesson_id_param integer)
 RETURNS boolean
 LANGUAGE plpgsql
AS $function$
DECLARE
    lesson_unit_id integer;
    lesson_order_val integer;
    previous_lesson_id integer;
BEGIN
    -- Get the unit and order of the requested lesson
    SELECT l.unit_id, l.lesson_order INTO lesson_unit_id, lesson_order_val 
    FROM public.lessons l WHERE l.lesson_id = lesson_id_param;

    -- Robustness: If the lesson doesn't exist, access is denied.
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    -- Check if user can access the parent unit
    IF NOT public.can_user_access_unit(profile_id_param, lesson_unit_id) THEN
        RETURN FALSE;
    END IF;

    -- FIXED: If this is the first lesson in the unit (lesson_order = 1), always allow access
    IF lesson_order_val = 1 THEN
        RETURN TRUE;
    END IF;

    -- Find the previous lesson in the same unit (by lesson_order)
    SELECT l.lesson_id INTO previous_lesson_id
    FROM public.lessons l
    WHERE l.unit_id = lesson_unit_id
      AND l.lesson_order = lesson_order_val - 1;

    -- If no previous lesson found, something is wrong with data, but allow access
    IF previous_lesson_id IS NULL THEN
        RETURN TRUE;
    END IF;

    -- Check if previous lesson is completed using the helper function
    RETURN public.is_lesson_complete(profile_id_param, previous_lesson_id);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.can_user_access_level(profile_id_param uuid, level_code_param level_enum)
 RETURNS boolean
 LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN level_code_param = ANY(public.get_user_available_levels(profile_id_param));
END;
$function$
;

CREATE OR REPLACE FUNCTION public.can_user_access_unit(profile_id_param uuid, unit_id_param integer)
 RETURNS boolean
 LANGUAGE plpgsql
AS $function$
DECLARE
    unit_level level_enum;
    unit_order_val integer;
    previous_unit_id integer;
BEGIN
    -- Get the level and order of the requested unit
    SELECT u.level, u.unit_order INTO unit_level, unit_order_val 
    FROM public.units u WHERE u.unit_id = unit_id_param;

    -- Robustness: If the unit doesn't exist, access is denied.
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    -- Check if user can access this level
    IF NOT public.can_user_access_level(profile_id_param, unit_level) THEN
        RETURN FALSE;
    END IF;

    -- FIXED: If this is the first unit in the level (unit_order = 1), always allow access
    IF unit_order_val = 1 THEN
        RETURN TRUE;
    END IF;

    -- Find the previous unit in the same level (by unit_order)
    SELECT u.unit_id INTO previous_unit_id
    FROM public.units u
    WHERE u.level = unit_level
      AND u.unit_order = unit_order_val - 1;

    -- If no previous unit found, something is wrong with data, but allow access
    IF previous_unit_id IS NULL THEN
        RETURN TRUE;
    END IF;

    -- Check if the previous unit is completed
    RETURN public.is_unit_complete(profile_id_param, previous_unit_id);
END;
$function$
;

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
$function$
;

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
;

CREATE OR REPLACE FUNCTION public.expire_partnership_trials()
 RETURNS void
 LANGUAGE plpgsql
AS $function$
DECLARE
  expired_profile_id uuid;
BEGIN
  -- Loop through expired trials and update each user's tier
  FOR expired_profile_id IN 
    SELECT DISTINCT profile_id 
    FROM student_subscriptions 
    WHERE status = 'trialing'
      AND trial_end_at <= NOW()
      AND stripe_subscription_id LIKE 'trial_%'
  LOOP
    -- Update the subscription status first
    UPDATE student_subscriptions 
    SET 
      status = 'canceled',
      ended_at = NOW(),
      updated_at = NOW()
    WHERE profile_id = expired_profile_id
      AND status = 'trialing'
      AND stripe_subscription_id LIKE 'trial_%';
    
    -- Then update the user's subscription tier using existing function
    PERFORM update_user_subscription_tier(expired_profile_id);
  END LOOP;
END;
$function$
;

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
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_billing_summary(user_profile_id uuid)
 RETURNS TABLE(current_tier text, active_subscriptions_count integer, next_billing_date timestamp with time zone, monthly_amount integer, has_payment_method boolean)
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    sp.subscription_tier::TEXT as current_tier,
    (
      SELECT COUNT(*)::INTEGER
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
;

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
;

CREATE OR REPLACE FUNCTION public.get_user_progression_status(profile_id_param uuid)
 RETURNS TABLE(level_code level_enum, level_available boolean, unit_id integer, unit_available boolean, lesson_id integer, lesson_available boolean, lesson_completed boolean)
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
            -- Check if the *previous* lesson in the same unit was completed. Default to TRUE for the first lesson.
            LAG(lc.is_completed, 1, TRUE) OVER (PARTITION BY l.unit_id ORDER BY l.lesson_order) AS prev_lesson_completed,
            -- Check if the *previous* unit in the same level was completed. Default to TRUE for the first unit.
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
$function$
;

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
;

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
;

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
;

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
;

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
$function$
;

CREATE OR REPLACE FUNCTION public.is_unit_complete(p_profile_id uuid, p_unit_id integer)
 RETURNS boolean
 LANGUAGE sql
 STABLE
AS $function$
  SELECT
    -- A unit is complete if it has lessons and none of them are incomplete.
    (SELECT COUNT(*) FROM public.lessons WHERE unit_id = p_unit_id) > 0
    AND
    (
      SELECT COUNT(*)
      FROM public.lessons l
      WHERE l.unit_id = p_unit_id
      AND NOT public.is_lesson_complete(p_profile_id, l.lesson_id)
    ) = 0;
$function$
;

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
;

CREATE OR REPLACE FUNCTION public.process_user_activity(profile_id_param uuid, lesson_id_param integer, language_code_param character varying, activity_type_param activity_type_enum, phrase_id_param integer DEFAULT NULL::integer, reference_text_param text DEFAULT NULL::text, recognized_text_param text DEFAULT NULL::text, accuracy_score_param numeric DEFAULT NULL::numeric, fluency_score_param numeric DEFAULT NULL::numeric, completeness_score_param numeric DEFAULT NULL::numeric, pronunciation_score_param numeric DEFAULT NULL::numeric, prosody_score_param numeric DEFAULT NULL::numeric, phonetic_data_param jsonb DEFAULT NULL::jsonb, written_text_param text DEFAULT NULL::text, overall_similarity_score_param numeric DEFAULT NULL::numeric, word_level_feedback_param jsonb DEFAULT NULL::jsonb)
 RETURNS TABLE(points_awarded_total integer)
 LANGUAGE plpgsql
AS $function$
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
        SELECT l.total_phrases INTO total_phrases_in_lesson FROM public.lessons l WHERE l.lesson_id = lesson_id_param;
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
$function$
;

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
;

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
;

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
;

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
;


  create policy "Allow admin users to insert audiobook alignment"
  on "public"."audiobook_alignment"
  as permissive
  for insert
  to authenticated
with check ((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = 'admin'::user_role_enum)))));



  create policy "Allow admin users to update audiobook alignment"
  on "public"."audiobook_alignment"
  as permissive
  for update
  to authenticated
using ((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = 'admin'::user_role_enum)))))
with check ((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = 'admin'::user_role_enum)))));



  create policy "Allow authenticated users to read audiobook alignment"
  on "public"."audiobook_alignment"
  as permissive
  for select
  to authenticated
using (true);



  create policy "Allow admin users to insert audiobook chapters"
  on "public"."audiobook_chapters"
  as permissive
  for insert
  to authenticated
with check ((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = 'admin'::user_role_enum)))));



  create policy "Allow admin users to update audiobook chapters"
  on "public"."audiobook_chapters"
  as permissive
  for update
  to authenticated
using ((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = 'admin'::user_role_enum)))))
with check ((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = 'admin'::user_role_enum)))));



  create policy "Allow authenticated users to read audiobook chapters"
  on "public"."audiobook_chapters"
  as permissive
  for select
  to authenticated
using (true);



  create policy "Allow admin users to delete audiobooks"
  on "public"."audiobooks"
  as permissive
  for delete
  to authenticated
using ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::user_role_enum)))));



  create policy "Allow admin users to insert audiobooks"
  on "public"."audiobooks"
  as permissive
  for insert
  to authenticated
with check ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::user_role_enum)))));



  create policy "Allow admin users to update audiobooks"
  on "public"."audiobooks"
  as permissive
  for update
  to authenticated
using ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::user_role_enum)))))
with check ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::user_role_enum)))));



  create policy "Allow authenticated users to read active audiobooks"
  on "public"."audiobooks"
  as permissive
  for select
  to authenticated
using ((is_active = true));



  create policy "Users can insert their own chapter progress"
  on "public"."user_audiobook_chapter_progress"
  as permissive
  for insert
  to authenticated
with check ((profile_id = auth.uid()));



  create policy "Users can read their own chapter progress"
  on "public"."user_audiobook_chapter_progress"
  as permissive
  for select
  to authenticated
using ((profile_id = auth.uid()));



  create policy "Users can update their own chapter progress"
  on "public"."user_audiobook_chapter_progress"
  as permissive
  for update
  to authenticated
using ((profile_id = auth.uid()))
with check ((profile_id = auth.uid()));



  create policy "Users can insert their own audiobook progress"
  on "public"."user_audiobook_progress"
  as permissive
  for insert
  to authenticated
with check ((profile_id = auth.uid()));



  create policy "Users can read their own audiobook progress"
  on "public"."user_audiobook_progress"
  as permissive
  for select
  to authenticated
using ((profile_id = auth.uid()));



  create policy "Users can update their own audiobook progress"
  on "public"."user_audiobook_progress"
  as permissive
  for update
  to authenticated
using ((profile_id = auth.uid()))
with check ((profile_id = auth.uid()));



  create policy "Users can insert their own audiobook purchases"
  on "public"."user_audiobook_purchases"
  as permissive
  for insert
  to authenticated
with check ((profile_id = auth.uid()));



  create policy "Users can read their own audiobook purchases"
  on "public"."user_audiobook_purchases"
  as permissive
  for select
  to authenticated
using ((profile_id = auth.uid()));


CREATE TRIGGER trigger_new_chapter_added AFTER INSERT ON public.audiobook_chapters FOR EACH ROW EXECUTE FUNCTION handle_new_chapter_added();

CREATE TRIGGER trigger_update_audiobook_duration AFTER INSERT OR DELETE OR UPDATE OF duration_seconds ON public.audiobook_chapters FOR EACH ROW EXECUTE FUNCTION update_audiobook_duration();


