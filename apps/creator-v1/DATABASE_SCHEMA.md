# Database Schema Reference

**WARNING: This schema is for context only and is not meant to be run.**
**Table order and constraints may not be valid for execution.**

This file provides a complete reference of the current database schema for development purposes.

## Core Tables

### Auth & Users

#### `public.admin`
Admin users with special privileges.
```sql
CREATE TABLE public.admin (
  id uuid NOT NULL,
  email text NOT NULL UNIQUE,
  full_name text NOT NULL,
  active boolean DEFAULT true,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT admin_pkey PRIMARY KEY (id),
  CONSTRAINT admin_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
```

#### `public.user_buyers`
Buyer user profiles and account information.
```sql
CREATE TABLE public.user_buyers (
  id uuid NOT NULL,
  email text NOT NULL UNIQUE,
  full_name text NOT NULL,
  buyer_company text,
  buyer_role USER-DEFINED,
  linkedin_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  requested boolean,
  tier USER-DEFINED DEFAULT 'invited'::user_tier,
  CONSTRAINT user_buyers_pkey PRIMARY KEY (id),
  CONSTRAINT user_buyers_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
```

#### `public.user_creators`
Creator/IP owner user profiles and account information. (Renamed from `user_ipowners` on 2025-09-10)
```sql
CREATE TABLE public.user_creators (
  id uuid NOT NULL,
  email text NOT NULL UNIQUE,
  full_name text NOT NULL,
  pen_name text,
  ip_owner_role USER-DEFINED,
  ip_owner_company text,
  website_url text,
  invitation_status text DEFAULT 'invited'::text CHECK (invitation_status = ANY (ARRAY['invited'::text, 'accepted'::text])),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT user_creators_pkey PRIMARY KEY (id),
  CONSTRAINT user_creators_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
```

## Content Management

### `public.titles`
Main titles/content table with comprehensive metadata and vector embeddings.
```sql
CREATE TABLE public.titles (
  title_id uuid NOT NULL DEFAULT gen_random_uuid(),
  title_name_kr text,
  title_name_en text,
  title_url text,
  title_image text,
  views bigint,
  likes bigint,
  rating numeric,
  rating_count bigint,
  art_author text,
  content_format USER-DEFINED,
  pitch text,
  creator_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  story_author text,
  tagline text,
  completed text,
  chapters numeric,
  perfect_for text,
  tone text,
  audience text,
  rights text,
  art_author_kr text,
  story_author_kr text,
  note text,
  tagline_kr text,
  note_kr text,
  cp text,
  description_kr text,
  original_author text,
  original_author_kr text,
  age_rating text,
  genre ARRAY,
  genre_kr ARRAY,
  keywords ARRAY,
  comps ARRAY,
  synopsis text,
  -- Vector Search Columns
  content_embedding USER-DEFINED,
  title_embedding USER-DEFINED,
  description_embedding USER-DEFINED,
  combined_embedding USER-DEFINED,
  synopsis_embedding USER-DEFINED,
  embedding_model text DEFAULT 'text-embedding-ada-002'::text,
  embedding_created_at timestamp with time zone,
  embedding_updated_at timestamp with time zone,
  CONSTRAINT titles_pkey PRIMARY KEY (title_id),
  CONSTRAINT titles_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES auth.users(id)
);
```

### `public.user_favorites`
User's favorite titles.
```sql
CREATE TABLE public.user_favorites (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT user_favorites_pkey PRIMARY KEY (id),
  CONSTRAINT user_favorites_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT user_favorites_title_id_fkey FOREIGN KEY (title_id) REFERENCES public.titles(title_id)
);
```

### `public.featured`
Featured/highlighted titles.
```sql
CREATE TABLE public.featured (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title_id uuid NOT NULL,
  note text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT featured_pkey PRIMARY KEY (id),
  CONSTRAINT featured_title_id_fkey FOREIGN KEY (title_id) REFERENCES public.titles(title_id)
);
```

## Vector Search & AI

### `public.title_content_analysis`
AI-powered content analysis and semantic understanding.
```sql
CREATE TABLE public.title_content_analysis (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title_id uuid NOT NULL UNIQUE,
  semantic_tags jsonb DEFAULT '[]'::jsonb,
  mood_analysis jsonb DEFAULT '{}'::jsonb,
  character_types ARRAY DEFAULT '{}'::text[],
  plot_elements ARRAY DEFAULT '{}'::text[],
  cultural_elements ARRAY DEFAULT '{}'::text[],
  complexity_score integer CHECK (complexity_score >= 1 AND complexity_score <= 10),
  reading_time_minutes integer,
  content_quality_score double precision CHECK (content_quality_score >= 0::double precision AND content_quality_score <= 1::double precision),
  target_demographics jsonb DEFAULT '{}'::jsonb,
  content_warnings ARRAY DEFAULT '{}'::text[],
  accessibility_features ARRAY DEFAULT '{}'::text[],
  keyword_density jsonb DEFAULT '{}'::jsonb,
  search_boost_factor double precision DEFAULT 1.0,
  analysis_version text DEFAULT '1.0'::text,
  processed_by text DEFAULT 'openai-gpt-4'::text,
  processing_confidence double precision DEFAULT 0.0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT title_content_analysis_pkey PRIMARY KEY (id),
  CONSTRAINT title_content_analysis_title_id_fkey FOREIGN KEY (title_id) REFERENCES public.titles(title_id)
);
```

### `public.vector_search_analytics`
Analytics and performance tracking for vector search operations.
```sql
CREATE TABLE public.vector_search_analytics (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  session_id uuid,
  original_query text NOT NULL,
  processed_query text,
  query_embedding USER-DEFINED,
  search_type text NOT NULL CHECK (search_type = ANY (ARRAY['vector_only'::text, 'hybrid'::text, 'text_only'::text])),
  match_threshold double precision,
  result_count integer,
  returned_title_ids ARRAY,
  top_similarity_scores ARRAY,
  search_duration_ms integer,
  clicked_title_ids ARRAY DEFAULT '{}'::uuid[],
  user_satisfaction_score integer CHECK (user_satisfaction_score >= 1 AND user_satisfaction_score <= 5),
  embedding_model text DEFAULT 'text-embedding-ada-002'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT vector_search_analytics_pkey PRIMARY KEY (id),
  CONSTRAINT vector_search_analytics_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.chat_sessions(id),
  CONSTRAINT vector_search_analytics_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
```

## Chat History & Analytics

### `public.chat_sessions`
Chat session management and metadata.
```sql
CREATE TABLE public.chat_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  user_email text NOT NULL,
  session_type text NOT NULL DEFAULT 'openai'::text,
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  ended_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT chat_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT chat_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
```

### `public.chat_messages`
Individual chat messages between users and AI.
```sql
CREATE TABLE public.chat_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL,
  user_id uuid NOT NULL,
  message_type text NOT NULL CHECK (message_type = ANY (ARRAY['user_prompt'::text, 'ai_response'::text])),
  content text NOT NULL,
  tokens_used integer DEFAULT 0,
  response_time_ms integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT chat_messages_pkey PRIMARY KEY (id),
  CONSTRAINT chat_messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT chat_messages_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.chat_sessions(id)
);
```

### `public.chat_title_recommendations`
AI-recommended titles during chat conversations.
```sql
CREATE TABLE public.chat_title_recommendations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL,
  session_id uuid NOT NULL,
  title_id text NOT NULL,
  title_name_en text,
  title_name_kr text,
  recommendation_score double precision DEFAULT 0,
  recommendation_reason text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT chat_title_recommendations_pkey PRIMARY KEY (id),
  CONSTRAINT chat_title_recommendations_message_id_fkey FOREIGN KEY (message_id) REFERENCES public.chat_messages(id),
  CONSTRAINT chat_title_recommendations_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.chat_sessions(id)
);
```

### `public.chat_interactions`
User interactions and clicks during chat sessions.
```sql
CREATE TABLE public.chat_interactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL,
  user_id uuid NOT NULL,
  interaction_type text NOT NULL CHECK (interaction_type = ANY (ARRAY['title_click'::text, 'suggestion_click'::text, 'title_view'::text, 'session_end'::text])),
  target_id text,
  target_title text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT chat_interactions_pkey PRIMARY KEY (id),
  CONSTRAINT chat_interactions_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.chat_sessions(id),
  CONSTRAINT chat_interactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
```

### `public.chat_suggested_queries`
AI-suggested follow-up queries and their click status.
```sql
CREATE TABLE public.chat_suggested_queries (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL,
  session_id uuid NOT NULL,
  suggested_query text NOT NULL,
  query_position integer DEFAULT 0,
  clicked boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT chat_suggested_queries_pkey PRIMARY KEY (id),
  CONSTRAINT chat_suggested_queries_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.chat_sessions(id),
  CONSTRAINT chat_suggested_queries_message_id_fkey FOREIGN KEY (message_id) REFERENCES public.chat_messages(id)
);
```

## Feedback & Requests

### `public.feedback_buyer`
Buyer feedback collection.
```sql
CREATE TABLE public.feedback_buyer (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  feedback text,
  user_id uuid,
  CONSTRAINT feedback_buyer_pkey PRIMARY KEY (id),
  CONSTRAINT feedback_buyer_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user_buyers(id)
);
```

### `public.request`
User requests for titles or content.
```sql
CREATE TABLE public.request (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  title_id text,
  user_id text,
  type text,
  CONSTRAINT request_pkey PRIMARY KEY (id)
);
```

## Key Relationships

### User Types
- **Buyers**: Stored in `user_buyers` with tier-based access control
- **IP Owners/Creators**: Stored in `user_creators` with pen name and company info
- **Admins**: Stored in `admin` with special privileges

### Content Flow
- **Titles**: Created by IP owners, viewed by buyers
- **Favorites**: Many-to-many relationship between users and titles
- **Featured**: Curated highlighting of specific titles

### AI & Search
- **Vector Embeddings**: Stored directly in `titles` table for performance
- **Content Analysis**: Semantic analysis stored in `title_content_analysis`
- **Search Analytics**: Performance tracking in `vector_search_analytics`

### Chat System
- **Sessions**: Track conversation boundaries and metadata
- **Messages**: Individual prompts and responses with timing
- **Recommendations**: AI-suggested titles with scoring
- **Interactions**: User clicks and engagement tracking

## Important Notes

1. **UUID Primary Keys**: Most tables use UUID for better distribution
2. **Vector Embeddings**: Stored as `USER-DEFINED` type (PostgreSQL vector extension)
3. **JSONB Fields**: Used for flexible metadata and structured data
4. **Array Fields**: Genre, tags, and other multi-value fields stored as arrays
5. **Timestamps**: Consistent use of `timestamp with time zone`
6. **Foreign Key Constraints**: Proper referential integrity throughout
7. **Check Constraints**: Data validation on critical fields
8. **RLS Policies**: Row Level Security implemented (not shown in schema)

## Usage Guidelines

- Use this schema reference for understanding table relationships
- Check column types before writing queries
- Consider array field handling in application code
- Remember vector embeddings require special handling
- Use proper UUID casting in queries
- Consider performance implications of JSONB queries