create type "public"."contact_reason_enum" as enum ('billing_issue', 'partnership_benefits', 'technical_issue', 'feature_request', 'content_error', 'account_question', 'other');

create type "public"."ticket_status_enum" as enum ('open', 'in_progress', 'resolved', 'closed');

create sequence "public"."support_ticket_messages_message_id_seq";

create sequence "public"."support_tickets_ticket_id_seq";

ALTER TYPE public.user_role_enum ADD VALUE 'support';

create table "public"."support_ticket_messages" (
    "message_id" bigint not null default nextval('support_ticket_messages_message_id_seq'::regclass),
    "ticket_id" bigint not null,
    "sender_profile_id" uuid not null,
    "message_text" text not null,
    "attachment_url" text,
    "created_at" timestamp with time zone not null default now()
);


create table "public"."support_tickets" (
    "ticket_id" bigint not null default nextval('support_tickets_ticket_id_seq'::regclass),
    "profile_id" uuid not null,
    "assigned_to_profile_id" uuid,
    "status" ticket_status_enum not null default 'open'::ticket_status_enum,
    "reason" contact_reason_enum not null,
    "subject" text not null,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "resolved_at" timestamp with time zone,
    "last_message_at" timestamp with time zone
);


alter sequence "public"."support_ticket_messages_message_id_seq" owned by "public"."support_ticket_messages"."message_id";

alter sequence "public"."support_tickets_ticket_id_seq" owned by "public"."support_tickets"."ticket_id";

CREATE UNIQUE INDEX support_ticket_messages_pkey ON public.support_ticket_messages USING btree (message_id);

CREATE INDEX support_ticket_messages_sender_profile_id_idx ON public.support_ticket_messages USING btree (sender_profile_id);

CREATE INDEX support_ticket_messages_ticket_id_idx ON public.support_ticket_messages USING btree (ticket_id);

CREATE INDEX support_tickets_assigned_to_profile_id_idx ON public.support_tickets USING btree (assigned_to_profile_id);

CREATE UNIQUE INDEX support_tickets_pkey ON public.support_tickets USING btree (ticket_id);

CREATE INDEX support_tickets_profile_id_idx ON public.support_tickets USING btree (profile_id);

CREATE INDEX support_tickets_status_idx ON public.support_tickets USING btree (status);

alter table "public"."support_ticket_messages" add constraint "support_ticket_messages_pkey" PRIMARY KEY using index "support_ticket_messages_pkey";

alter table "public"."support_tickets" add constraint "support_tickets_pkey" PRIMARY KEY using index "support_tickets_pkey";

alter table "public"."support_ticket_messages" add constraint "support_ticket_messages_sender_profile_id_fkey" FOREIGN KEY (sender_profile_id) REFERENCES profiles(id) not valid;

alter table "public"."support_ticket_messages" validate constraint "support_ticket_messages_sender_profile_id_fkey";

alter table "public"."support_ticket_messages" add constraint "support_ticket_messages_ticket_id_fkey" FOREIGN KEY (ticket_id) REFERENCES support_tickets(ticket_id) ON DELETE CASCADE not valid;

alter table "public"."support_ticket_messages" validate constraint "support_ticket_messages_ticket_id_fkey";

alter table "public"."support_tickets" add constraint "support_tickets_assigned_to_profile_id_fkey" FOREIGN KEY (assigned_to_profile_id) REFERENCES profiles(id) not valid;

alter table "public"."support_tickets" validate constraint "support_tickets_assigned_to_profile_id_fkey";

alter table "public"."support_tickets" add constraint "support_tickets_profile_id_fkey" FOREIGN KEY (profile_id) REFERENCES student_profiles(profile_id) not valid;

alter table "public"."support_tickets" validate constraint "support_tickets_profile_id_fkey";

alter table "public"."support_tickets" add constraint "support_tickets_subject_check" CHECK ((subject <> ''::text)) not valid;

alter table "public"."support_tickets" validate constraint "support_tickets_subject_check";

grant delete on table "public"."support_ticket_messages" to "anon";

grant insert on table "public"."support_ticket_messages" to "anon";

grant references on table "public"."support_ticket_messages" to "anon";

grant select on table "public"."support_ticket_messages" to "anon";

grant trigger on table "public"."support_ticket_messages" to "anon";

grant truncate on table "public"."support_ticket_messages" to "anon";

grant update on table "public"."support_ticket_messages" to "anon";

grant delete on table "public"."support_ticket_messages" to "authenticated";

grant insert on table "public"."support_ticket_messages" to "authenticated";

grant references on table "public"."support_ticket_messages" to "authenticated";

grant select on table "public"."support_ticket_messages" to "authenticated";

grant trigger on table "public"."support_ticket_messages" to "authenticated";

grant truncate on table "public"."support_ticket_messages" to "authenticated";

grant update on table "public"."support_ticket_messages" to "authenticated";

grant delete on table "public"."support_ticket_messages" to "service_role";

grant insert on table "public"."support_ticket_messages" to "service_role";

grant references on table "public"."support_ticket_messages" to "service_role";

grant select on table "public"."support_ticket_messages" to "service_role";

grant trigger on table "public"."support_ticket_messages" to "service_role";

grant truncate on table "public"."support_ticket_messages" to "service_role";

grant update on table "public"."support_ticket_messages" to "service_role";

grant delete on table "public"."support_tickets" to "anon";

grant insert on table "public"."support_tickets" to "anon";

grant references on table "public"."support_tickets" to "anon";

grant select on table "public"."support_tickets" to "anon";

grant trigger on table "public"."support_tickets" to "anon";

grant truncate on table "public"."support_tickets" to "anon";

grant update on table "public"."support_tickets" to "anon";

grant delete on table "public"."support_tickets" to "authenticated";

grant insert on table "public"."support_tickets" to "authenticated";

grant references on table "public"."support_tickets" to "authenticated";

grant select on table "public"."support_tickets" to "authenticated";

grant trigger on table "public"."support_tickets" to "authenticated";

grant truncate on table "public"."support_tickets" to "authenticated";

grant update on table "public"."support_tickets" to "authenticated";

grant delete on table "public"."support_tickets" to "service_role";

grant insert on table "public"."support_tickets" to "service_role";

grant references on table "public"."support_tickets" to "service_role";

grant select on table "public"."support_tickets" to "service_role";

grant trigger on table "public"."support_tickets" to "service_role";

grant truncate on table "public"."support_tickets" to "service_role";

grant update on table "public"."support_tickets" to "service_role";


