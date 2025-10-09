create extension if not exists "wrappers" with schema "extensions";
create extension if not exists "vector" with schema "public" version '0.8.0';
create type "public"."priority" as enum ('1', '2', '3');
create type "public"."user_tier" as enum ('invited', 'basic', 'pro', 'suite');
drop policy "Buyers can insert their own profile" on "public"."user_buyers";
drop policy "IP owners can insert their own profile" on "public"."user_ipowners";
drop policy "IP owners can update their own profile" on "public"."user_ipowners";
drop policy "IP owners can view their own profile" on "public"."user_ipowners";
revoke delete on table "public"."titles" from "anon";
revoke insert on table "public"."titles" from "anon";
revoke references on table "public"."titles" from "anon";
revoke select on table "public"."titles" from "anon";
revoke trigger on table "public"."titles" from "anon";
revoke truncate on table "public"."titles" from "anon";
revoke update on table "public"."titles" from "anon";
revoke delete on table "public"."titles" from "authenticated";
revoke insert on table "public"."titles" from "authenticated";
revoke references on table "public"."titles" from "authenticated";
revoke select on table "public"."titles" from "authenticated";
revoke trigger on table "public"."titles" from "authenticated";
revoke truncate on table "public"."titles" from "authenticated";
revoke update on table "public"."titles" from "authenticated";
revoke delete on table "public"."titles" from "service_role";
revoke insert on table "public"."titles" from "service_role";
revoke references on table "public"."titles" from "service_role";
revoke select on table "public"."titles" from "service_role";
revoke trigger on table "public"."titles" from "service_role";
revoke truncate on table "public"."titles" from "service_role";
revoke update on table "public"."titles" from "service_role";
revoke delete on table "public"."user_buyers" from "anon";
revoke insert on table "public"."user_buyers" from "anon";
revoke references on table "public"."user_buyers" from "anon";
revoke select on table "public"."user_buyers" from "anon";
revoke trigger on table "public"."user_buyers" from "anon";
revoke truncate on table "public"."user_buyers" from "anon";
revoke update on table "public"."user_buyers" from "anon";
revoke delete on table "public"."user_buyers" from "authenticated";
revoke insert on table "public"."user_buyers" from "authenticated";
revoke references on table "public"."user_buyers" from "authenticated";
revoke select on table "public"."user_buyers" from "authenticated";
revoke trigger on table "public"."user_buyers" from "authenticated";
revoke truncate on table "public"."user_buyers" from "authenticated";
revoke update on table "public"."user_buyers" from "authenticated";
revoke delete on table "public"."user_buyers" from "service_role";
revoke insert on table "public"."user_buyers" from "service_role";
revoke references on table "public"."user_buyers" from "service_role";
revoke select on table "public"."user_buyers" from "service_role";
revoke trigger on table "public"."user_buyers" from "service_role";
revoke truncate on table "public"."user_buyers" from "service_role";
revoke update on table "public"."user_buyers" from "service_role";
revoke delete on table "public"."user_favorites" from "anon";
revoke insert on table "public"."user_favorites" from "anon";
revoke references on table "public"."user_favorites" from "anon";
revoke select on table "public"."user_favorites" from "anon";
revoke trigger on table "public"."user_favorites" from "anon";
revoke truncate on table "public"."user_favorites" from "anon";
revoke update on table "public"."user_favorites" from "anon";
revoke delete on table "public"."user_favorites" from "authenticated";
revoke insert on table "public"."user_favorites" from "authenticated";
revoke references on table "public"."user_favorites" from "authenticated";
revoke select on table "public"."user_favorites" from "authenticated";
revoke trigger on table "public"."user_favorites" from "authenticated";
revoke truncate on table "public"."user_favorites" from "authenticated";
revoke update on table "public"."user_favorites" from "authenticated";
revoke delete on table "public"."user_favorites" from "service_role";
revoke insert on table "public"."user_favorites" from "service_role";
revoke references on table "public"."user_favorites" from "service_role";
revoke select on table "public"."user_favorites" from "service_role";
revoke trigger on table "public"."user_favorites" from "service_role";
revoke truncate on table "public"."user_favorites" from "service_role";
revoke update on table "public"."user_favorites" from "service_role";
revoke delete on table "public"."user_ipowners" from "anon";
revoke insert on table "public"."user_ipowners" from "anon";
revoke references on table "public"."user_ipowners" from "anon";
revoke select on table "public"."user_ipowners" from "anon";
revoke trigger on table "public"."user_ipowners" from "anon";
revoke truncate on table "public"."user_ipowners" from "anon";
revoke update on table "public"."user_ipowners" from "anon";
revoke delete on table "public"."user_ipowners" from "authenticated";
revoke insert on table "public"."user_ipowners" from "authenticated";
revoke references on table "public"."user_ipowners" from "authenticated";
revoke select on table "public"."user_ipowners" from "authenticated";
revoke trigger on table "public"."user_ipowners" from "authenticated";
revoke truncate on table "public"."user_ipowners" from "authenticated";
revoke update on table "public"."user_ipowners" from "authenticated";
revoke delete on table "public"."user_ipowners" from "service_role";
revoke insert on table "public"."user_ipowners" from "service_role";
revoke references on table "public"."user_ipowners" from "service_role";
revoke select on table "public"."user_ipowners" from "service_role";
revoke trigger on table "public"."user_ipowners" from "service_role";
revoke truncate on table "public"."user_ipowners" from "service_role";
revoke update on table "public"."user_ipowners" from "service_role";
alter table "public"."titles" drop constraint "titles_rating_check";
alter table "public"."user_buyers" drop constraint "user_buyers_invitation_status_check";
alter table "public"."user_ipowners" drop constraint "user_ipowners_email_key";
alter table "public"."user_ipowners" drop constraint "user_ipowners_id_fkey";
alter table "public"."user_ipowners" drop constraint "user_ipowners_invitation_status_check";
drop function if exists "public"."handle_new_ipowner"();
drop function if exists "public"."handle_new_user_routing"();
alter table "public"."user_ipowners" drop constraint "user_ipowners_pkey";
drop index if exists "public"."idx_titles_genre";
drop index if exists "public"."user_buyers_invitation_status_idx";
drop index if exists "public"."user_ipowners_email_idx";
drop index if exists "public"."user_ipowners_email_key";
drop index if exists "public"."user_ipowners_invitation_status_idx";
drop index if exists "public"."user_ipowners_pkey";
drop table "public"."user_ipowners";
alter type "public"."account_type" rename to "account_type__old_version_to_be_dropped";
create type "public"."account_type" as enum ('creator', 'buyer');
create table "public"."admin" (
    "id" uuid not null,
    "email" text not null,
    "full_name" text not null,
    "active" boolean default true,
    "created_at" timestamp without time zone default now()
);
alter table "public"."admin" enable row level security;
create table "public"."chat_interactions" (
    "id" uuid not null default gen_random_uuid(),
    "session_id" uuid not null,
    "user_id" uuid not null,
    "interaction_type" text not null,
    "target_id" text,
    "target_title" text,
    "metadata" jsonb default '{}'::jsonb,
    "created_at" timestamp with time zone not null default now()
);
alter table "public"."chat_interactions" enable row level security;
create table "public"."chat_message_feedback" (
    "id" uuid not null default gen_random_uuid(),
    "message_id" uuid not null,
    "session_id" uuid not null,
    "user_id" uuid not null,
    "overall_rating" integer not null,
    "response_quality" character varying(20) not null,
    "title_relevance" character varying(20) not null,
    "title_feedback" jsonb,
    "general_feedback" text,
    "suggested_improvements" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);
alter table "public"."chat_message_feedback" enable row level security;
create table "public"."chat_messages" (
    "id" uuid not null default gen_random_uuid(),
    "session_id" uuid not null,
    "user_id" uuid not null,
    "message_type" text not null,
    "content" text not null,
    "tokens_used" integer default 0,
    "response_time_ms" integer default 0,
    "created_at" timestamp with time zone not null default now()
);
alter table "public"."chat_messages" enable row level security;
create table "public"."chat_sessions" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "user_email" text not null,
    "session_type" text not null default 'openai'::text,
    "started_at" timestamp with time zone not null default now(),
    "ended_at" timestamp with time zone,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "messages" jsonb default '[]'::jsonb
);
alter table "public"."chat_sessions" enable row level security;
create table "public"."chat_suggested_queries" (
    "id" uuid not null default gen_random_uuid(),
    "message_id" uuid not null,
    "session_id" uuid not null,
    "suggested_query" text not null,
    "query_position" integer default 0,
    "clicked" boolean default false,
    "created_at" timestamp with time zone not null default now()
);
alter table "public"."chat_suggested_queries" enable row level security;
create table "public"."chat_title_recommendations" (
    "id" uuid not null default gen_random_uuid(),
    "message_id" uuid not null,
    "session_id" uuid not null,
    "title_id" text not null,
    "title_name_en" text,
    "title_name_kr" text,
    "recommendation_score" double precision default 0,
    "recommendation_reason" text,
    "created_at" timestamp with time zone not null default now()
);
alter table "public"."chat_title_recommendations" enable row level security;
create table "public"."featured" (
    "id" uuid not null default gen_random_uuid(),
    "title_id" uuid not null,
    "note" text,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now())
);
alter table "public"."featured" enable row level security;
create table "public"."feedback_buyer" (
    "id" bigint generated by default as identity not null,
    "created_at" timestamp with time zone not null default now(),
    "feedback" text,
    "user_id" uuid
);
alter table "public"."feedback_buyer" enable row level security;
create table "public"."request" (
    "id" bigint generated by default as identity not null,
    "created_at" timestamp with time zone not null default now(),
    "title_id" text,
    "user_id" text,
    "type" text
);
alter table "public"."request" enable row level security;
create table "public"."stripe_customers" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "stripe_customer_id" text,
    "stripe_subscription_id" text,
    "subscription_status" text,
    "current_period_end" timestamp with time zone,
    "cancel_at_period_end" boolean default false,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);
alter table "public"."stripe_customers" enable row level security;
create table "public"."title_content_analysis" (
    "id" uuid not null default gen_random_uuid(),
    "title_id" text not null,
    "semantic_tags" text[] default '{}'::text[],
    "mood_analysis" jsonb default '{}'::jsonb,
    "character_types" text[] default '{}'::text[],
    "plot_elements" text[] default '{}'::text[],
    "cultural_elements" text[] default '{}'::text[],
    "target_demographics" jsonb default '{}'::jsonb,
    "content_warnings" text[] default '{}'::text[],
    "keyword_density" jsonb default '{}'::jsonb,
    "complexity_score" numeric(3,2) default 5.0,
    "content_quality_score" numeric(3,2) default 5.0,
    "search_boost_factor" numeric(3,2) default 1.0,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);
alter table "public"."title_content_analysis" enable row level security;
create table "public"."user_creators" (
    "id" uuid not null,
    "email" text not null,
    "full_name" text not null,
    "pen_name" text,
    "ip_owner_role" ip_owner_role,
    "ip_owner_company" text,
    "website_url" text,
    "invitation_status" text default 'invited'::text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "tier" user_tier default 'basic'::user_tier
);
alter table "public"."user_creators" enable row level security;
create table "public"."user_onboarding" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "user_id" uuid not null,
    "user_email" text not null,
    "onboarding_completed" boolean default false,
    "onboarding_started_at" timestamp with time zone,
    "onboarding_completed_at" timestamp with time zone,
    "current_step" integer default 0,
    "skipped" boolean default false,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);
alter table "public"."user_onboarding" enable row level security;
create table "public"."vector_search_analytics" (
    "id" uuid not null default gen_random_uuid(),
    "query" text not null,
    "search_type" text default 'vector'::text,
    "result_count" integer default 0,
    "clicked_title_id" text,
    "click_position" integer,
    "search_duration_ms" integer,
    "user_id" text,
    "session_id" text not null,
    "query_intent" text default 'browse'::text,
    "query_complexity" text default 'simple'::text,
    "user_satisfaction_score" integer,
    "refinements" text[] default '{}'::text[],
    "created_at" timestamp with time zone default now()
);
alter table "public"."vector_search_analytics" enable row level security;
drop type "public"."account_type__old_version_to_be_dropped";
alter table "public"."titles" drop column "author";
alter table "public"."titles" drop column "illustrator";
alter table "public"."titles" drop column "tags";
alter table "public"."titles" drop column "writer";
alter table "public"."titles" add column "age_rating" text;
alter table "public"."titles" add column "art_author" text;
alter table "public"."titles" add column "art_author_kr" text;
alter table "public"."titles" add column "audience" text;
alter table "public"."titles" add column "chapters" numeric;
alter table "public"."titles" add column "combined_embedding" vector(1536);
alter table "public"."titles" add column "completed" text;
alter table "public"."titles" add column "comps" text[];
alter table "public"."titles" add column "content_embedding" vector(1536);
alter table "public"."titles" add column "cp" text;
alter table "public"."titles" add column "description_embedding" vector(1536);
alter table "public"."titles" add column "description_kr" text;
alter table "public"."titles" add column "embedding_created_at" timestamp with time zone;
alter table "public"."titles" add column "embedding_model" text default 'text-embedding-ada-002'::text;
alter table "public"."titles" add column "embedding_updated_at" timestamp with time zone;
alter table "public"."titles" add column "genre_kr" text[];
alter table "public"."titles" add column "keywords" text[];
alter table "public"."titles" add column "note" text;
alter table "public"."titles" add column "note_kr" text;
alter table "public"."titles" add column "original_author" text;
alter table "public"."titles" add column "original_author_kr" text;
alter table "public"."titles" add column "perfect_for" text;
alter table "public"."titles" add column "priority" priority not null default '2'::priority;
alter table "public"."titles" add column "rights" text;
alter table "public"."titles" add column "story_author" text;
alter table "public"."titles" add column "story_author_kr" text;
alter table "public"."titles" add column "synopsis_embedding" vector(1536);
alter table "public"."titles" add column "tagline" text;
alter table "public"."titles" add column "tagline_kr" text;
alter table "public"."titles" add column "title_embedding" vector(1536);
alter table "public"."titles" add column "tone" text;
alter table "public"."titles" alter column "genre" set data type text[] using "genre"::text[];
alter table "public"."titles" alter column "likes" drop default;
alter table "public"."titles" alter column "likes" drop not null;
alter table "public"."titles" alter column "likes" set data type bigint using "likes"::bigint;
alter table "public"."titles" alter column "rating" drop default;
alter table "public"."titles" alter column "rating" set data type numeric using "rating"::numeric;
alter table "public"."titles" alter column "rating_count" drop default;
alter table "public"."titles" alter column "rating_count" drop not null;
alter table "public"."titles" alter column "rating_count" set data type bigint using "rating_count"::bigint;
alter table "public"."titles" alter column "title_name_kr" drop not null;
alter table "public"."titles" alter column "views" drop default;
alter table "public"."titles" alter column "views" drop not null;
alter table "public"."titles" alter column "views" set data type bigint using "views"::bigint;
alter table "public"."user_buyers" drop column "invitation_status";
alter table "public"."user_buyers" add column "requested" boolean;
alter table "public"."user_buyers" add column "tier" user_tier default 'basic'::user_tier;
CREATE UNIQUE INDEX admin_email_key ON public.admin USING btree (email);
CREATE UNIQUE INDEX admin_pkey ON public.admin USING btree (id);
CREATE UNIQUE INDEX chat_interactions_pkey ON public.chat_interactions USING btree (id);
CREATE UNIQUE INDEX chat_message_feedback_pkey ON public.chat_message_feedback USING btree (id);
CREATE UNIQUE INDEX chat_messages_pkey ON public.chat_messages USING btree (id);
CREATE UNIQUE INDEX chat_sessions_pkey ON public.chat_sessions USING btree (id);
CREATE UNIQUE INDEX chat_suggested_queries_pkey ON public.chat_suggested_queries USING btree (id);
CREATE UNIQUE INDEX chat_title_recommendations_pkey ON public.chat_title_recommendations USING btree (id);
CREATE UNIQUE INDEX featured_pkey ON public.featured USING btree (id);
CREATE UNIQUE INDEX feedback_buyer_pkey ON public.feedback_buyer USING btree (id);
CREATE INDEX idx_chat_interactions_created_at ON public.chat_interactions USING btree (created_at);
CREATE INDEX idx_chat_interactions_session_id ON public.chat_interactions USING btree (session_id);
CREATE INDEX idx_chat_interactions_type ON public.chat_interactions USING btree (interaction_type);
CREATE INDEX idx_chat_interactions_user_id ON public.chat_interactions USING btree (user_id);
CREATE INDEX idx_chat_message_feedback_created_at ON public.chat_message_feedback USING btree (created_at);
CREATE INDEX idx_chat_message_feedback_message_id ON public.chat_message_feedback USING btree (message_id);
CREATE INDEX idx_chat_message_feedback_overall_rating ON public.chat_message_feedback USING btree (overall_rating);
CREATE INDEX idx_chat_message_feedback_response_quality ON public.chat_message_feedback USING btree (response_quality);
CREATE INDEX idx_chat_message_feedback_session_id ON public.chat_message_feedback USING btree (session_id);
CREATE INDEX idx_chat_message_feedback_title_relevance ON public.chat_message_feedback USING btree (title_relevance);
CREATE INDEX idx_chat_message_feedback_user_id ON public.chat_message_feedback USING btree (user_id);
CREATE INDEX idx_chat_messages_created_at ON public.chat_messages USING btree (created_at);
CREATE INDEX idx_chat_messages_session_id ON public.chat_messages USING btree (session_id);
CREATE INDEX idx_chat_messages_user_id ON public.chat_messages USING btree (user_id);
CREATE INDEX idx_chat_sessions_created_at ON public.chat_sessions USING btree (created_at);
CREATE INDEX idx_chat_sessions_messages ON public.chat_sessions USING gin (messages);
CREATE INDEX idx_chat_sessions_user_email ON public.chat_sessions USING btree (user_email);
CREATE INDEX idx_chat_sessions_user_id ON public.chat_sessions USING btree (user_id);
CREATE INDEX idx_chat_suggested_queries_message_id ON public.chat_suggested_queries USING btree (message_id);
CREATE INDEX idx_chat_suggested_queries_session_id ON public.chat_suggested_queries USING btree (session_id);
CREATE INDEX idx_chat_title_recommendations_message_id ON public.chat_title_recommendations USING btree (message_id);
CREATE INDEX idx_chat_title_recommendations_session_id ON public.chat_title_recommendations USING btree (session_id);
CREATE INDEX idx_chat_title_recommendations_title_id ON public.chat_title_recommendations USING btree (title_id);
CREATE INDEX idx_featured_title_id ON public.featured USING btree (title_id);
CREATE INDEX idx_stripe_customers_stripe_customer_id ON public.stripe_customers USING btree (stripe_customer_id);
CREATE INDEX idx_stripe_customers_stripe_subscription_id ON public.stripe_customers USING btree (stripe_subscription_id);
CREATE INDEX idx_stripe_customers_subscription_status ON public.stripe_customers USING btree (subscription_status);
CREATE INDEX idx_stripe_customers_user_id ON public.stripe_customers USING btree (user_id);
CREATE INDEX idx_title_content_analysis_title_id ON public.title_content_analysis USING btree (title_id);
CREATE INDEX idx_titles_comps ON public.titles USING gin (comps);
CREATE INDEX idx_titles_description_embedding ON public.titles USING ivfflat (description_embedding vector_cosine_ops);
CREATE INDEX idx_user_buyers_tier ON public.user_buyers USING btree (tier);
CREATE INDEX idx_user_onboarding_completed ON public.user_onboarding USING btree (onboarding_completed);
CREATE INDEX idx_user_onboarding_email ON public.user_onboarding USING btree (user_email);
CREATE INDEX idx_user_onboarding_user_id ON public.user_onboarding USING btree (user_id);
CREATE INDEX idx_vector_search_analytics_created_at ON public.vector_search_analytics USING btree (created_at);
CREATE INDEX idx_vector_search_analytics_query ON public.vector_search_analytics USING btree (query);
CREATE INDEX idx_vector_search_analytics_user_id ON public.vector_search_analytics USING btree (user_id);
CREATE UNIQUE INDEX request_pkey ON public.request USING btree (id);
CREATE UNIQUE INDEX stripe_customers_pkey ON public.stripe_customers USING btree (id);
CREATE UNIQUE INDEX stripe_customers_stripe_customer_id_key ON public.stripe_customers USING btree (stripe_customer_id);
CREATE UNIQUE INDEX stripe_customers_stripe_subscription_id_key ON public.stripe_customers USING btree (stripe_subscription_id);
CREATE UNIQUE INDEX stripe_customers_user_id_key ON public.stripe_customers USING btree (user_id);
CREATE UNIQUE INDEX title_content_analysis_pkey ON public.title_content_analysis USING btree (id);
CREATE UNIQUE INDEX title_content_analysis_title_id_key ON public.title_content_analysis USING btree (title_id);
CREATE UNIQUE INDEX unique_user_onboarding ON public.user_onboarding USING btree (user_id);
CREATE INDEX user_creators_email_idx ON public.user_creators USING btree (email);
CREATE INDEX user_creators_invitation_status_idx ON public.user_creators USING btree (invitation_status);
CREATE UNIQUE INDEX user_creators_pkey ON public.user_creators USING btree (id);
CREATE UNIQUE INDEX user_onboarding_pkey ON public.user_onboarding USING btree (id);
CREATE UNIQUE INDEX vector_search_analytics_pkey ON public.vector_search_analytics USING btree (id);
alter table "public"."admin" add constraint "admin_pkey" PRIMARY KEY using index "admin_pkey";
alter table "public"."chat_interactions" add constraint "chat_interactions_pkey" PRIMARY KEY using index "chat_interactions_pkey";
alter table "public"."chat_message_feedback" add constraint "chat_message_feedback_pkey" PRIMARY KEY using index "chat_message_feedback_pkey";
alter table "public"."chat_messages" add constraint "chat_messages_pkey" PRIMARY KEY using index "chat_messages_pkey";
alter table "public"."chat_sessions" add constraint "chat_sessions_pkey" PRIMARY KEY using index "chat_sessions_pkey";
alter table "public"."chat_suggested_queries" add constraint "chat_suggested_queries_pkey" PRIMARY KEY using index "chat_suggested_queries_pkey";
alter table "public"."chat_title_recommendations" add constraint "chat_title_recommendations_pkey" PRIMARY KEY using index "chat_title_recommendations_pkey";
alter table "public"."featured" add constraint "featured_pkey" PRIMARY KEY using index "featured_pkey";
alter table "public"."feedback_buyer" add constraint "feedback_buyer_pkey" PRIMARY KEY using index "feedback_buyer_pkey";
alter table "public"."request" add constraint "request_pkey" PRIMARY KEY using index "request_pkey";
alter table "public"."stripe_customers" add constraint "stripe_customers_pkey" PRIMARY KEY using index "stripe_customers_pkey";
alter table "public"."title_content_analysis" add constraint "title_content_analysis_pkey" PRIMARY KEY using index "title_content_analysis_pkey";
alter table "public"."user_creators" add constraint "user_creators_pkey" PRIMARY KEY using index "user_creators_pkey";
alter table "public"."user_onboarding" add constraint "user_onboarding_pkey" PRIMARY KEY using index "user_onboarding_pkey";
alter table "public"."vector_search_analytics" add constraint "vector_search_analytics_pkey" PRIMARY KEY using index "vector_search_analytics_pkey";
alter table "public"."admin" add constraint "admin_email_key" UNIQUE using index "admin_email_key";
alter table "public"."admin" add constraint "admin_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) not valid;
alter table "public"."admin" validate constraint "admin_id_fkey";
alter table "public"."chat_interactions" add constraint "chat_interactions_interaction_type_check" CHECK ((interaction_type = ANY (ARRAY['title_click'::text, 'suggestion_click'::text, 'title_view'::text, 'session_end'::text]))) not valid;
alter table "public"."chat_interactions" validate constraint "chat_interactions_interaction_type_check";
alter table "public"."chat_interactions" add constraint "chat_interactions_session_id_fkey" FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE not valid;
alter table "public"."chat_interactions" validate constraint "chat_interactions_session_id_fkey";
alter table "public"."chat_interactions" add constraint "chat_interactions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;
alter table "public"."chat_interactions" validate constraint "chat_interactions_user_id_fkey";
alter table "public"."chat_message_feedback" add constraint "chat_message_feedback_message_id_fkey" FOREIGN KEY (message_id) REFERENCES chat_messages(id) ON DELETE CASCADE not valid;
alter table "public"."chat_message_feedback" validate constraint "chat_message_feedback_message_id_fkey";
alter table "public"."chat_message_feedback" add constraint "chat_message_feedback_overall_rating_check" CHECK (((overall_rating >= 1) AND (overall_rating <= 5))) not valid;
alter table "public"."chat_message_feedback" validate constraint "chat_message_feedback_overall_rating_check";
alter table "public"."chat_message_feedback" add constraint "chat_message_feedback_response_quality_check" CHECK (((response_quality)::text = ANY ((ARRAY['excellent'::character varying, 'good'::character varying, 'fair'::character varying, 'poor'::character varying])::text[]))) not valid;
alter table "public"."chat_message_feedback" validate constraint "chat_message_feedback_response_quality_check";
alter table "public"."chat_message_feedback" add constraint "chat_message_feedback_session_id_fkey" FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE not valid;
alter table "public"."chat_message_feedback" validate constraint "chat_message_feedback_session_id_fkey";
alter table "public"."chat_message_feedback" add constraint "chat_message_feedback_title_relevance_check" CHECK (((title_relevance)::text = ANY ((ARRAY['excellent'::character varying, 'good'::character varying, 'fair'::character varying, 'poor'::character varying])::text[]))) not valid;
alter table "public"."chat_message_feedback" validate constraint "chat_message_feedback_title_relevance_check";
alter table "public"."chat_messages" add constraint "chat_messages_message_type_check" CHECK ((message_type = ANY (ARRAY['user_prompt'::text, 'ai_response'::text]))) not valid;
alter table "public"."chat_messages" validate constraint "chat_messages_message_type_check";
alter table "public"."chat_messages" add constraint "chat_messages_session_id_fkey" FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE not valid;
alter table "public"."chat_messages" validate constraint "chat_messages_session_id_fkey";
alter table "public"."chat_messages" add constraint "chat_messages_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;
alter table "public"."chat_messages" validate constraint "chat_messages_user_id_fkey";
alter table "public"."chat_sessions" add constraint "chat_sessions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;
alter table "public"."chat_sessions" validate constraint "chat_sessions_user_id_fkey";
alter table "public"."chat_suggested_queries" add constraint "chat_suggested_queries_message_id_fkey" FOREIGN KEY (message_id) REFERENCES chat_messages(id) ON DELETE CASCADE not valid;
alter table "public"."chat_suggested_queries" validate constraint "chat_suggested_queries_message_id_fkey";
alter table "public"."chat_suggested_queries" add constraint "chat_suggested_queries_session_id_fkey" FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE not valid;
alter table "public"."chat_suggested_queries" validate constraint "chat_suggested_queries_session_id_fkey";
alter table "public"."chat_title_recommendations" add constraint "chat_title_recommendations_message_id_fkey" FOREIGN KEY (message_id) REFERENCES chat_messages(id) ON DELETE CASCADE not valid;
alter table "public"."chat_title_recommendations" validate constraint "chat_title_recommendations_message_id_fkey";
alter table "public"."chat_title_recommendations" add constraint "chat_title_recommendations_session_id_fkey" FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE not valid;
alter table "public"."chat_title_recommendations" validate constraint "chat_title_recommendations_session_id_fkey";
alter table "public"."featured" add constraint "featured_title_id_fkey" FOREIGN KEY (title_id) REFERENCES titles(title_id) ON DELETE CASCADE not valid;
alter table "public"."featured" validate constraint "featured_title_id_fkey";
alter table "public"."feedback_buyer" add constraint "feedback_buyer_user_id_fkey" FOREIGN KEY (user_id) REFERENCES user_buyers(id) not valid;
alter table "public"."feedback_buyer" validate constraint "feedback_buyer_user_id_fkey";
alter table "public"."stripe_customers" add constraint "stripe_customers_stripe_customer_id_key" UNIQUE using index "stripe_customers_stripe_customer_id_key";
alter table "public"."stripe_customers" add constraint "stripe_customers_stripe_subscription_id_key" UNIQUE using index "stripe_customers_stripe_subscription_id_key";
alter table "public"."stripe_customers" add constraint "stripe_customers_subscription_status_check" CHECK ((subscription_status = ANY (ARRAY['active'::text, 'canceled'::text, 'incomplete'::text, 'incomplete_expired'::text, 'past_due'::text, 'paused'::text, 'trialing'::text, 'unpaid'::text]))) not valid;
alter table "public"."stripe_customers" validate constraint "stripe_customers_subscription_status_check";
alter table "public"."stripe_customers" add constraint "stripe_customers_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;
alter table "public"."stripe_customers" validate constraint "stripe_customers_user_id_fkey";
alter table "public"."stripe_customers" add constraint "stripe_customers_user_id_key" UNIQUE using index "stripe_customers_user_id_key";
alter table "public"."title_content_analysis" add constraint "title_content_analysis_title_id_key" UNIQUE using index "title_content_analysis_title_id_key";
alter table "public"."user_creators" add constraint "user_creators_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;
alter table "public"."user_creators" validate constraint "user_creators_id_fkey";
alter table "public"."user_onboarding" add constraint "unique_user_onboarding" UNIQUE using index "unique_user_onboarding";
alter table "public"."user_onboarding" add constraint "user_onboarding_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;
alter table "public"."user_onboarding" validate constraint "user_onboarding_user_id_fkey";
set check_function_bodies = off;
CREATE OR REPLACE FUNCTION public.append_session_message(p_session_id uuid, p_message jsonb)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  UPDATE chat_sessions
  SET
    messages = COALESCE(messages, '[]'::jsonb) || p_message::jsonb,
    updated_at = NOW()
  WHERE id = p_session_id;

  -- Keep only last 30 messages for performance
  UPDATE chat_sessions
  SET messages = (
    SELECT jsonb_agg(elem)
    FROM (
      SELECT elem
      FROM jsonb_array_elements(messages) elem
      ORDER BY (elem->>'timestamp')::timestamptz DESC
      LIMIT 30
    ) recent_messages
  )
  WHERE id = p_session_id
    AND jsonb_array_length(messages) > 30;

  RETURN FOUND;
END;
$function$;
CREATE OR REPLACE FUNCTION public.create_missing_creator_profiles()
 RETURNS TABLE(user_id uuid, email text, action text)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  user_record RECORD;
BEGIN
  -- Find auth.users with creator metadata but no user_creators profile
  FOR user_record IN
    SELECT 
      u.id,
      u.email,
      u.raw_user_meta_data->>'full_name' as full_name,
      u.raw_user_meta_data->>'pen_name' as pen_name,
      u.raw_user_meta_data->>'ip_owner_role' as ip_owner_role,
      u.raw_user_meta_data->>'ip_owner_company' as ip_owner_company,
      u.raw_user_meta_data->>'website_url' as website_url
    FROM auth.users u
    WHERE u.raw_user_meta_data->>'account_type' = 'creator'
      AND NOT EXISTS (
        SELECT 1 FROM public.user_creators uc WHERE uc.id = u.id
      )
  LOOP
    -- Create the missing creator profile
    INSERT INTO public.user_creators (
      id,
      email,
      full_name,
      pen_name,
      ip_owner_role,
      ip_owner_company,
      website_url,
      invitation_status
    )
    VALUES (
      user_record.id,
      user_record.email,
      COALESCE(user_record.full_name, ''),
      user_record.pen_name,
      CASE 
        WHEN user_record.ip_owner_role IS NOT NULL AND user_record.ip_owner_role != ''
        THEN user_record.ip_owner_role::public.ip_owner_role
        ELSE NULL
      END,
      user_record.ip_owner_company,
      user_record.website_url,
      'invited'
    )
    ON CONFLICT (id) DO NOTHING;
    
    -- Return the action taken
    user_id := user_record.id;
    email := user_record.email;
    action := 'Created missing creator profile';
    RETURN NEXT;
  END LOOP;
END;
$function$;
CREATE OR REPLACE FUNCTION public.create_user_profile(user_id uuid, user_email text, account_type text, profile_data jsonb DEFAULT '{}'::jsonb)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  profile_exists BOOLEAN := FALSE;
BEGIN
  -- Check if profile already exists
  IF account_type = 'buyer' THEN
    SELECT EXISTS(SELECT 1 FROM public.user_buyers WHERE id = user_id) INTO profile_exists;
    
    IF NOT profile_exists THEN
      INSERT INTO public.user_buyers (
        id, 
        email, 
        full_name, 
        buyer_company,
        buyer_role,
        linkedin_url,
        tier
      )
      VALUES (
        user_id,
        user_email,
        COALESCE(profile_data->>'full_name', ''),
        profile_data->>'buyer_company',
        CASE 
          WHEN profile_data->>'buyer_role' IS NOT NULL AND profile_data->>'buyer_role' != ''
          THEN (profile_data->>'buyer_role')::public.buyer_role
          ELSE NULL
        END,
        profile_data->>'linkedin_url',
        COALESCE((profile_data->>'tier')::user_tier, 'basic'::user_tier)
      );
      
      RAISE LOG 'Manual buyer profile created for user: %, email: %', user_id, user_email;
    END IF;
    
  ELSIF account_type = 'ip_owner' THEN
    SELECT EXISTS(SELECT 1 FROM public.user_creators WHERE id = user_id) INTO profile_exists;
    
    IF NOT profile_exists THEN
      INSERT INTO public.user_creators (
        id, 
        email, 
        full_name, 
        pen_name,
        ip_owner_role,
        ip_owner_company,
        website_url,
        invitation_status
      )
      VALUES (
        user_id,
        user_email,
        COALESCE(profile_data->>'full_name', ''),
        profile_data->>'pen_name',
        CASE 
          WHEN profile_data->>'ip_owner_role' IS NOT NULL AND profile_data->>'ip_owner_role' != ''
          THEN (profile_data->>'ip_owner_role')::public.ip_owner_role
          ELSE NULL
        END,
        profile_data->>'ip_owner_company',
        profile_data->>'website_url',
        'invited'
      );
      
      RAISE LOG 'Manual creator profile created for user: %, email: %', user_id, user_email;
    END IF;
    
  ELSE
    RAISE EXCEPTION 'Invalid account_type: %. Must be "buyer" or "ip_owner"', account_type;
  END IF;
  
  RETURN NOT profile_exists; -- Return TRUE if new profile was created
END;
$function$;
create or replace view "public"."feedback_analysis" as  SELECT f.id,
    f.message_id,
    f.session_id,
    f.user_id,
    f.overall_rating,
    f.response_quality,
    f.title_relevance,
    f.title_feedback,
    f.general_feedback,
    f.suggested_improvements,
    f.created_at,
    f.updated_at,
    cm.content AS message_content,
    cm.message_type,
    cm.tokens_used,
    cm.response_time_ms,
    cs.session_type,
    cs.started_at AS session_started,
        CASE
            WHEN (f.title_feedback IS NOT NULL) THEN jsonb_array_length(f.title_feedback)
            ELSE 0
        END AS title_count,
        CASE
            WHEN (f.title_feedback IS NOT NULL) THEN ( SELECT avg(((title.value ->> 'relevance_score'::text))::numeric) AS avg
               FROM jsonb_array_elements(f.title_feedback) title(value))
            ELSE NULL::numeric
        END AS avg_title_relevance_score
   FROM ((chat_message_feedback f
     JOIN chat_messages cm ON ((f.message_id = cm.id)))
     JOIN chat_sessions cs ON ((f.session_id = cs.id)))
  ORDER BY f.created_at DESC;
CREATE OR REPLACE FUNCTION public.fix_missing_oauth_profiles()
 RETURNS TABLE(user_id uuid, user_email text, account_type text, profile_created boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  oauth_user RECORD;
  profile_data JSONB;
  created BOOLEAN;
BEGIN
  -- Find OAuth users (those without profiles but with account_type in metadata)
  FOR oauth_user IN 
    SELECT 
      u.id,
      u.email,
      u.raw_user_meta_data->>'account_type' as metadata_account_type,
      u.raw_user_meta_data
    FROM auth.users u
    WHERE u.raw_user_meta_data->>'account_type' IS NOT NULL
      AND u.created_at > NOW() - INTERVAL '30 days' -- Focus on recent users
    ORDER BY u.created_at DESC
  LOOP
    -- Check if buyer exists
    IF oauth_user.metadata_account_type = 'buyer' THEN
      IF NOT EXISTS (SELECT 1 FROM public.user_buyers WHERE id = oauth_user.id) THEN
        SELECT public.create_user_profile(
          oauth_user.id, 
          oauth_user.email, 
          'buyer', 
          oauth_user.raw_user_meta_data
        ) INTO created;
        
        RETURN QUERY SELECT oauth_user.id, oauth_user.email, 'buyer'::TEXT, created;
      END IF;
      
    -- Check if creator exists  
    ELSIF oauth_user.metadata_account_type = 'ip_owner' THEN
      IF NOT EXISTS (SELECT 1 FROM public.user_creators WHERE id = oauth_user.id) THEN
        SELECT public.create_user_profile(
          oauth_user.id, 
          oauth_user.email, 
          'ip_owner', 
          oauth_user.raw_user_meta_data
        ) INTO created;
        
        RETURN QUERY SELECT oauth_user.id, oauth_user.email, 'ip_owner'::TEXT, created;
      END IF;
    END IF;
  END LOOP;
END;
$function$;
CREATE OR REPLACE FUNCTION public.get_conversation_with_titles(p_session_id uuid)
 RETURNS TABLE(message_id uuid, message_type text, content text, created_at timestamp with time zone, titles jsonb, suggested_queries jsonb)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    cm.id as message_id,
    cm.message_type,
    cm.content,
    cm.created_at,
    COALESCE(
      jsonb_agg(
        DISTINCT jsonb_build_object(
          'title_id', ctr.title_id,
          'title_name_en', ctr.title_name_en,
          'title_name_kr', ctr.title_name_kr,
          'recommendation_score', ctr.recommendation_score,
          'recommendation_reason', ctr.recommendation_reason
        )
      ) FILTER (WHERE ctr.title_id IS NOT NULL),
      '[]'::jsonb
    ) as titles,
    COALESCE(
      jsonb_agg(
        DISTINCT cqr.suggested_query
      ) FILTER (WHERE cqr.suggested_query IS NOT NULL),
      '[]'::jsonb
    ) as suggested_queries
  FROM chat_messages cm
  LEFT JOIN chat_title_recommendations ctr ON cm.id = ctr.message_id
  LEFT JOIN chat_suggested_queries cqr ON cm.id = cqr.message_id
  WHERE cm.session_id = p_session_id
  GROUP BY cm.id, cm.message_type, cm.content, cm.created_at
  ORDER BY cm.created_at ASC;
END;
$function$;
CREATE OR REPLACE FUNCTION public.get_recent_messages(p_user_id uuid, p_limit integer DEFAULT 15)
 RETURNS TABLE(session_id uuid, user_id uuid, user_email text, session_type text, messages jsonb, started_at timestamp with time zone, updated_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    cs.id,
    cs.user_id,
    cs.user_email,
    cs.session_type,
    cs.messages,
    cs.started_at,
    cs.updated_at
  FROM chat_sessions cs
  WHERE cs.user_id = p_user_id
    AND cs.ended_at IS NULL  -- Only active sessions
  ORDER BY cs.updated_at DESC
  LIMIT 1; -- Get the most recent active session
END;
$function$;
CREATE OR REPLACE FUNCTION public.handle_user_profile_routing()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  account_type_value TEXT;
  profile_exists BOOLEAN := FALSE;
BEGIN
  -- Get account type from metadata
  account_type_value := NEW.raw_user_meta_data->>'account_type';
  
  -- Log for debugging (will appear in Postgres logs)
  RAISE LOG 'User profile routing for user: %, email: %, account_type: %', 
    NEW.id, NEW.email, account_type_value;
  
  -- Route based on account type in metadata
  IF account_type_value = 'buyer' THEN
    -- Check if buyer profile already exists (prevent duplicates)
    SELECT EXISTS(SELECT 1 FROM public.user_buyers WHERE id = NEW.id) INTO profile_exists;
    
    IF NOT profile_exists THEN
      INSERT INTO public.user_buyers (
        id, 
        email, 
        full_name, 
        buyer_company,
        buyer_role,
        linkedin_url,
        tier
      )
      VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        NEW.raw_user_meta_data->>'buyer_company',
        CASE 
          WHEN NEW.raw_user_meta_data->>'buyer_role' IS NOT NULL 
           AND NEW.raw_user_meta_data->>'buyer_role' != ''
           AND NEW.raw_user_meta_data->>'buyer_role' IN ('producer', 'executive', 'agent', 'content_scout', 'other')
          THEN (NEW.raw_user_meta_data->>'buyer_role')::public.buyer_role
          ELSE NULL
        END,
        NEW.raw_user_meta_data->>'linkedin_url',
        'basic'::user_tier -- Default tier for new signups
      );
      
      RAISE LOG 'Successfully created buyer profile for user: %, email: %', NEW.id, NEW.email;
    ELSE
      RAISE LOG 'Buyer profile already exists for user: %, skipping creation', NEW.id;
    END IF;
    
  ELSIF account_type_value = 'creator' OR account_type_value = 'ip_owner' THEN
    -- Check if creator profile already exists (prevent duplicates)
    SELECT EXISTS(SELECT 1 FROM public.user_creators WHERE id = NEW.id) INTO profile_exists;
    
    IF NOT profile_exists THEN
      INSERT INTO public.user_creators (
        id, 
        email, 
        full_name, 
        pen_name,
        ip_owner_role,
        ip_owner_company,
        website_url,
        invitation_status
      )
      VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        COALESCE(
          NEW.raw_user_meta_data->>'pen_name',
          NEW.raw_user_meta_data->>'pen_name_or_studio',
          NULL
        ),
        CASE 
          WHEN NEW.raw_user_meta_data->>'ip_owner_role' IS NOT NULL 
           AND NEW.raw_user_meta_data->>'ip_owner_role' != ''
           AND NEW.raw_user_meta_data->>'ip_owner_role' IN ('author', 'agent')
          THEN (NEW.raw_user_meta_data->>'ip_owner_role')::public.ip_owner_role
          ELSE NULL
        END,
        NEW.raw_user_meta_data->>'ip_owner_company',
        NEW.raw_user_meta_data->>'website_url',
        'invited'
      );
      
      RAISE LOG 'Successfully created creator profile for user: %, email: %', NEW.id, NEW.email;
    ELSE
      RAISE LOG 'Creator profile already exists for user: %, skipping creation', NEW.id;
    END IF;
    
  ELSE
    -- Log when no account type is specified
    RAISE LOG 'No valid account_type in metadata for user: %, email: %. Metadata: %', 
      NEW.id, NEW.email, NEW.raw_user_meta_data::text;
  END IF;
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't fail user creation
  RAISE WARNING 'Profile creation failed for user % (email: %): % (SQLSTATE: %)', 
    NEW.id, NEW.email, SQLERRM, SQLSTATE;
  -- Still return NEW to allow user creation to proceed
  RETURN NEW;
END;
$function$;
CREATE OR REPLACE FUNCTION public.hybrid_search_titles(query_text text, query_embedding vector, text_weight double precision DEFAULT 0.3, vector_weight double precision DEFAULT 0.7, match_count integer DEFAULT 10)
 RETURNS TABLE(title_id uuid, title_name_en text, title_name_kr text, description text, text_score double precision, vector_score double precision, combined_score double precision)
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    t.title_id,
    t.title_name_en,
    t.title_name_kr,
    t.description,
    -- Text search score using ts_rank
    COALESCE(ts_rank(
      to_tsvector('english', COALESCE(t.title_name_en, '') || ' ' || COALESCE(t.title_name_kr, '') || ' ' || COALESCE(t.description, '') || ' ' || COALESCE(t.synopsis, '')),
      plainto_tsquery('english', query_text)
    ), 0) AS text_score,
    -- Vector similarity score
    COALESCE(1 - (t.combined_embedding <=> query_embedding), 0) AS vector_score,
    -- Combined weighted score
    (text_weight * COALESCE(ts_rank(
      to_tsvector('english', COALESCE(t.title_name_en, '') || ' ' || COALESCE(t.title_name_kr, '') || ' ' || COALESCE(t.description, '') || ' ' || COALESCE(t.synopsis, '')),
      plainto_tsquery('english', query_text)
    ), 0) + 
    vector_weight * COALESCE(1 - (t.combined_embedding <=> query_embedding), 0)) AS combined_score
  FROM titles t
  WHERE t.combined_embedding IS NOT NULL
  ORDER BY combined_score DESC
  LIMIT match_count;
END;
$function$;
CREATE OR REPLACE FUNCTION public.match_titles_by_embedding(query_embedding vector, match_threshold double precision DEFAULT 0.7, match_count integer DEFAULT 10)
 RETURNS TABLE(title_id uuid, title_name_en text, title_name_kr text, description text, similarity double precision, synopsis text, genre text[], tone text, content_format text, perfect_for text, audience text, age_rating text, story_author text, art_author text, comps text[])
 LANGUAGE plpgsql
AS $function$
  BEGIN
    RETURN QUERY
    SELECT
      -- Original fields (same logic as before)
      t.title_id,
      t.title_name_en,
      t.title_name_kr,
      COALESCE(t.synopsis, t.description_kr, '')::text as description,
      CASE
        WHEN t.combined_embedding IS NOT NULL
        THEN (1 - (t.combined_embedding <=> query_embedding))::float
        ELSE 0::float
      END AS similarity,
      -- New metadata fields (all from titles table)
      t.synopsis,
      t.genre,
      t.tone,
      t.content_format::text,
      t.perfect_for,
      t.audience,
      t.age_rating,
      t.story_author,
      t.art_author,
      t.comps
    FROM titles t
    WHERE t.combined_embedding IS NOT NULL
      AND (1 - (t.combined_embedding <=> query_embedding)) > match_threshold
    ORDER BY t.combined_embedding <=> query_embedding
    LIMIT match_count;
  END;
  $function$;
CREATE OR REPLACE FUNCTION public.process_title_for_vector_search(target_title_id uuid)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- This function would typically call external embedding service
  -- For now, it just updates the processing timestamp
  UPDATE titles 
  SET embedding_updated_at = NOW() 
  WHERE title_id = target_title_id;
  
  -- Log the processing
  RAISE NOTICE 'Title % marked for vector processing', target_title_id;
END;
$function$;
CREATE OR REPLACE FUNCTION public.test_admin_connectivity()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN jsonb_build_object(
    'admin_table_accessible', EXISTS(SELECT 1 FROM public.admin LIMIT 1),
    'titles_table_accessible', EXISTS(SELECT 1 FROM public.titles LIMIT 1),
    'timestamp', NOW()
  );
END;
$function$;
CREATE OR REPLACE FUNCTION public.update_session_messages(p_session_id uuid, p_messages jsonb)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  UPDATE chat_sessions
  SET
    messages = p_messages,
    updated_at = NOW()
  WHERE id = p_session_id;

  RETURN FOUND;
END;
$function$;
CREATE OR REPLACE FUNCTION public.update_stripe_customers_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;
CREATE OR REPLACE FUNCTION public.update_title_content_analysis_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;
CREATE OR REPLACE FUNCTION public.update_user_metadata_on_profile_creation()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  account_type_value TEXT;
BEGIN
  -- Determine account type based on which table triggered this
  IF TG_TABLE_NAME = 'user_buyers' THEN
    account_type_value := 'buyer';
  ELSIF TG_TABLE_NAME = 'user_creators' THEN
    account_type_value := 'creator';
  ELSE
    -- Unknown table, skip
    RETURN NEW;
  END IF;

  -- Log the metadata update
  RAISE LOG 'METADATA INJECTION: Updating user % with account_type: %', NEW.id, account_type_value;

  -- Update the auth.users metadata directly
  UPDATE auth.users
  SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('account_type', account_type_value)
  WHERE id = NEW.id;

  -- Check if update was successful
  IF FOUND THEN
    RAISE LOG 'METADATA INJECTION: Successfully updated metadata for user %', NEW.id;
  ELSE
    RAISE WARNING 'METADATA INJECTION: Failed to find user % in auth.users', NEW.id;
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Don't fail profile creation if metadata update fails
  RAISE WARNING 'METADATA INJECTION: Failed to update metadata for user %: % (SQLSTATE: %)',
    NEW.id, SQLERRM, SQLSTATE;
  RETURN NEW;
END;
$function$;
CREATE OR REPLACE FUNCTION public.update_user_onboarding_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;
create or replace view "public"."user_buyers_with_email" as  SELECT id,
    id AS user_id,
    tier,
    requested,
    created_at,
    COALESCE(email, (('user_'::text || "substring"((id)::text, 1, 8)) || '@kstorybridge.com'::text)) AS email,
    COALESCE(full_name, ('User '::text || "substring"((id)::text, 1, 8))) AS full_name
   FROM user_buyers ub
  ORDER BY created_at DESC;
CREATE OR REPLACE FUNCTION public.handle_new_buyer()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.user_buyers (
    id, 
    email, 
    full_name, 
    buyer_company,
    buyer_role,
    linkedin_url
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.raw_user_meta_data->>'buyer_company',
    CASE 
      WHEN NEW.raw_user_meta_data->>'buyer_role' IS NOT NULL 
      THEN (NEW.raw_user_meta_data->>'buyer_role')::buyer_role
      ELSE NULL
    END,
    NEW.raw_user_meta_data->>'linkedin_url'
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Failed to create buyer profile for user %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$function$;
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$;
create policy "Allow authenticated users to read admin table"
on "public"."admin"
as permissive
for select
to authenticated
using (true);
create policy "admin_full_select"
on "public"."admin"
as permissive
for select
to public
using (true);
create policy "Users can insert their own chat interactions"
on "public"."chat_interactions"
as permissive
for insert
to public
with check ((user_id = auth.uid()));
create policy "Users can view their own chat interactions"
on "public"."chat_interactions"
as permissive
for select
to public
using ((user_id = auth.uid()));
create policy "Admins can view all feedback"
on "public"."chat_message_feedback"
as permissive
for select
to public
using (((auth.jwt() ->> 'email'::text) = ANY (ARRAY['sungho@dadble.com'::text, 'kevin@sandstoneartists.com'::text])));
create policy "Users can insert their own feedback"
on "public"."chat_message_feedback"
as permissive
for insert
to public
with check ((EXISTS ( SELECT 1
   FROM chat_messages cm
  WHERE ((cm.id = chat_message_feedback.message_id) AND (cm.user_id = auth.uid())))));
create policy "Users can update their own feedback"
on "public"."chat_message_feedback"
as permissive
for update
to public
using ((user_id = auth.uid()));
create policy "Users can view their own feedback"
on "public"."chat_message_feedback"
as permissive
for select
to public
using ((user_id = auth.uid()));
create policy "Users can insert their own chat messages"
on "public"."chat_messages"
as permissive
for insert
to public
with check ((user_id = auth.uid()));
create policy "Users can view their own chat messages"
on "public"."chat_messages"
as permissive
for select
to public
using ((user_id = auth.uid()));
create policy "Users can insert their own chat sessions"
on "public"."chat_sessions"
as permissive
for insert
to public
with check ((user_id = auth.uid()));
create policy "Users can update their own chat sessions"
on "public"."chat_sessions"
as permissive
for update
to public
using ((user_id = auth.uid()));
create policy "Users can view their own chat sessions"
on "public"."chat_sessions"
as permissive
for select
to public
using ((user_id = auth.uid()));
create policy "Users can insert their own suggested queries"
on "public"."chat_suggested_queries"
as permissive
for insert
to public
with check ((session_id IN ( SELECT chat_sessions.id
   FROM chat_sessions
  WHERE (chat_sessions.user_id = auth.uid()))));
create policy "Users can update their own suggested queries"
on "public"."chat_suggested_queries"
as permissive
for update
to public
using ((session_id IN ( SELECT chat_sessions.id
   FROM chat_sessions
  WHERE (chat_sessions.user_id = auth.uid()))));
create policy "Users can view their own suggested queries"
on "public"."chat_suggested_queries"
as permissive
for select
to public
using ((session_id IN ( SELECT chat_sessions.id
   FROM chat_sessions
  WHERE (chat_sessions.user_id = auth.uid()))));
create policy "Users can insert their own title recommendations"
on "public"."chat_title_recommendations"
as permissive
for insert
to public
with check ((session_id IN ( SELECT chat_sessions.id
   FROM chat_sessions
  WHERE (chat_sessions.user_id = auth.uid()))));
create policy "Users can view their own title recommendations"
on "public"."chat_title_recommendations"
as permissive
for select
to public
using ((session_id IN ( SELECT chat_sessions.id
   FROM chat_sessions
  WHERE (chat_sessions.user_id = auth.uid()))));
create policy "Allow full access to authenticated users"
on "public"."featured"
as permissive
for all
to public
using ((auth.role() = 'authenticated'::text));
create policy "Allow read access to featured titles"
on "public"."featured"
as permissive
for select
to public
using (true);
create policy "Users can delete their own requests"
on "public"."request"
as permissive
for delete
to public
using ((auth.uid() = (user_id)::uuid));
create policy "Users can insert their own requests"
on "public"."request"
as permissive
for insert
to public
with check ((auth.uid() = (user_id)::uuid));
create policy "Users can update their own requests"
on "public"."request"
as permissive
for update
to public
using ((auth.uid() = (user_id)::uuid))
with check ((auth.uid() = (user_id)::uuid));
create policy "Users can view their own requests"
on "public"."request"
as permissive
for select
to public
using ((auth.uid() = (user_id)::uuid));
create policy "Service role can manage stripe customers"
on "public"."stripe_customers"
as permissive
for all
to public
using (((auth.jwt() ->> 'role'::text) = 'service_role'::text));
create policy "Users can view own stripe customer data"
on "public"."stripe_customers"
as permissive
for select
to public
using ((auth.uid() = user_id));
create policy "Allow all operations on title_content_analysis"
on "public"."title_content_analysis"
as permissive
for all
to public
using (true);
create policy "titles_full_select"
on "public"."titles"
as permissive
for select
to public
using (true);
create policy "Enable insert for authenticated users own profile"
on "public"."user_buyers"
as permissive
for insert
to authenticated
with check ((auth.uid() = id));
create policy "Enable select for authenticated users own profile"
on "public"."user_buyers"
as permissive
for select
to authenticated
using ((auth.uid() = id));
create policy "Enable update for authenticated users own profile"
on "public"."user_buyers"
as permissive
for update
to authenticated
using ((auth.uid() = id))
with check ((auth.uid() = id));
create policy "OAuth-friendly buyer profile creation"
on "public"."user_buyers"
as permissive
for insert
to authenticated
with check (((auth.uid() = id) OR (((auth.jwt() ->> 'aud'::text) = 'authenticated'::text) AND (current_setting('request.jwt.claim.sub'::text, true) = (id)::text))));
create policy "OAuth-friendly buyer profile select"
on "public"."user_buyers"
as permissive
for select
to authenticated
using (((auth.uid() = id) OR (((auth.jwt() ->> 'aud'::text) = 'authenticated'::text) AND (current_setting('request.jwt.claim.sub'::text, true) = (id)::text))));
create policy "Service role can insert buyer profiles"
on "public"."user_buyers"
as permissive
for insert
to service_role
with check (true);
create policy "Authenticated users can insert creator profile"
on "public"."user_creators"
as permissive
for insert
to authenticated
with check ((auth.uid() = id));
create policy "Authenticated users can update creator profile"
on "public"."user_creators"
as permissive
for update
to authenticated
using ((auth.uid() = id))
with check ((auth.uid() = id));
create policy "Enable insert for authenticated users own creator profile"
on "public"."user_creators"
as permissive
for insert
to authenticated
with check ((auth.uid() = id));
create policy "Enable select for authenticated users own creator profile"
on "public"."user_creators"
as permissive
for select
to authenticated
using ((auth.uid() = id));
create policy "Enable update for authenticated users own creator profile"
on "public"."user_creators"
as permissive
for update
to authenticated
using ((auth.uid() = id))
with check ((auth.uid() = id));
create policy "OAuth-friendly creator profile creation"
on "public"."user_creators"
as permissive
for insert
to authenticated
with check (((auth.uid() = id) OR (((auth.jwt() ->> 'aud'::text) = 'authenticated'::text) AND (current_setting('request.jwt.claim.sub'::text, true) = (id)::text))));
create policy "OAuth-friendly creator profile select"
on "public"."user_creators"
as permissive
for select
to authenticated
using (((auth.uid() = id) OR (((auth.jwt() ->> 'aud'::text) = 'authenticated'::text) AND (current_setting('request.jwt.claim.sub'::text, true) = (id)::text))));
create policy "Service role can insert creator profiles"
on "public"."user_creators"
as permissive
for insert
to service_role
with check (true);
create policy "Users can select their own profile"
on "public"."user_creators"
as permissive
for select
to authenticated
using ((auth.uid() = id));
create policy "Users can insert own onboarding"
on "public"."user_onboarding"
as permissive
for insert
to public
with check ((auth.uid() = user_id));
create policy "Users can update own onboarding"
on "public"."user_onboarding"
as permissive
for update
to public
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));
create policy "Users can view own onboarding"
on "public"."user_onboarding"
as permissive
for select
to public
using ((auth.uid() = user_id));
create policy "Allow all operations on vector_search_analytics"
on "public"."vector_search_analytics"
as permissive
for all
to public
using (true);
CREATE TRIGGER update_chat_message_feedback_updated_at BEFORE UPDATE ON public.chat_message_feedback FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_chat_sessions_updated_at BEFORE UPDATE ON public.chat_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_stripe_customers_updated_at BEFORE UPDATE ON public.stripe_customers FOR EACH ROW EXECUTE FUNCTION update_stripe_customers_updated_at();
CREATE TRIGGER update_buyer_metadata_trigger AFTER INSERT ON public.user_buyers FOR EACH ROW EXECUTE FUNCTION update_user_metadata_on_profile_creation();
CREATE TRIGGER update_creator_metadata_trigger AFTER INSERT ON public.user_creators FOR EACH ROW EXECUTE FUNCTION update_user_metadata_on_profile_creation();
CREATE TRIGGER trigger_update_user_onboarding_updated_at BEFORE UPDATE ON public.user_onboarding FOR EACH ROW EXECUTE FUNCTION update_user_onboarding_updated_at();
drop trigger if exists "on_auth_user_created" on "auth"."users";
CREATE TRIGGER on_auth_user_profile_routing AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_user_profile_routing();
CREATE TRIGGER on_auth_user_profile_routing_update AFTER UPDATE OF raw_user_meta_data ON auth.users FOR EACH ROW WHEN ((((new.raw_user_meta_data ->> 'account_type'::text) IS NOT NULL) AND (((old.raw_user_meta_data ->> 'account_type'::text) IS NULL) OR ((old.raw_user_meta_data ->> 'account_type'::text) <> (new.raw_user_meta_data ->> 'account_type'::text))))) EXECUTE FUNCTION handle_user_profile_routing();
create policy "Allow authenticated uploads"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check ((bucket_id = 'title-images'::text));
create policy "Allow public viewing"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'title-images'::text));
create policy "Allow read access to pitch-pdfs"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'pitch-pdfs'::text));
create policy "allow all access 1tbin1q_0"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'pitch-pdfs'::text));
create policy "temp_storage_fix"
  on "storage"."objects"
  as permissive
  for select
  to anon, authenticated
using (true);
