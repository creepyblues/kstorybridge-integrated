# Database Schema Reference

**WARNING**: This schema is for context only and is not meant to be run directly. Table order and constraints may not be valid for execution.

## Authentication & Admin

### Authentication & User Account Types

The application uses two primary account types stored in user metadata:
- `'buyer'` - Content buyers/media companies  
- `'creator'` - Content creators/IP owners

These account types determine:
- Which dashboard interface users see
- Database table for profile storage (`user_buyers` vs `user_creators`)
- Available features and permissions

### admin
Administrative users table linked to auth.users
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

## User Management

### user_buyers
Buyer accounts with tier-based access system
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
  tier USER-DEFINED DEFAULT 'basic'::user_tier,
  CONSTRAINT user_buyers_pkey PRIMARY KEY (id),
  CONSTRAINT user_buyers_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
```

**Field Requirements (UPDATED 2025-01-14)**:
- `id`: UUID primary key, references auth.users(id)
- `email`: Unique email address, NOT NULL
- `full_name`: Full name, NOT NULL
- `buyer_company`: Company name (optional)
- `buyer_role`: Enum type (producer|executive|agent|content_scout|other)
- `linkedin_url`: LinkedIn profile URL (optional)
- `requested`: Boolean flag for premium access requests (default: false)
- `tier`: User access tier (default: 'basic')

**Tier System**: basic (default) | invited | pro | suite
- `basic` (1) - Default tier, standard features
- `invited` (0) - Restricted access (legacy/special cases)
- `pro` (2) - Premium content access
- `suite` (3) - Full feature access

**CRITICAL**: All signup forms must include the `requested` field with default value `false`

### user_creators
Content creator/IP owner accounts (renamed from user_ipowners)
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

**Important**: Always use `pen_name` field for creator profiles.
**Note**: This table was renamed from `user_ipowners` to `user_creators` in 2025-09-10.

### user_favorites
User-favorited titles relationship
```sql
CREATE TABLE public.user_favorites (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT user_favorites_pkey PRIMARY KEY (id),
  CONSTRAINT user_favorites_title_id_fkey FOREIGN KEY (title_id) REFERENCES public.titles(title_id),
  CONSTRAINT user_favorites_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
```

## Content Management

### titles
Main content table with full metadata
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
  description_embedding USER-DEFINED,
  embedding_model text DEFAULT 'text-embedding-ada-002'::text,
  embedding_created_at timestamp with time zone,
  embedding_updated_at timestamp with time zone,
  combined_embedding USER-DEFINED,
  title_embedding USER-DEFINED,
  synopsis_embedding USER-DEFINED,
  content_embedding USER-DEFINED,
  CONSTRAINT titles_pkey PRIMARY KEY (title_id),
  CONSTRAINT titles_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES auth.users(id)
);
```

**Complete Field Categories**:
- **Basic**: title_id, title_name_kr, title_name_en, tagline, note
- **Authors**: art_author, story_author, original_author (+ _kr variants)
- **Rights**: rights, cp, creator_id
- **Content**: genre, content_format, chapters, completed, keywords, comps
- **Media**: title_image, title_url, pitch
- **Metrics**: views, likes, rating, rating_count
- **Market**: perfect_for, tone, audience, age_rating
- **Descriptions**: synopsis, description_kr
- **Embeddings**: Multiple embedding fields for vector search
- **System**: created_at, updated_at

### featured
Featured titles for promotional display
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

### title_content_analysis
AI-powered content analysis and categorization
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

## Chat & AI System

### chat_sessions
User chat session tracking
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

### chat_messages
Individual chat messages with AI responses
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

### chat_interactions
User interaction tracking within chat sessions
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

### chat_suggested_queries
AI-generated follow-up query suggestions
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

### chat_title_recommendations
AI title recommendations within chat responses
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
  CONSTRAINT chat_title_recommendations_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.chat_sessions(id),
  CONSTRAINT chat_title_recommendations_message_id_fkey FOREIGN KEY (message_id) REFERENCES public.chat_messages(id)
);
```

## Analytics & Search

### vector_search_analytics
Vector search performance and usage analytics
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
  CONSTRAINT vector_search_analytics_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT vector_search_analytics_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.chat_sessions(id)
);
```

## Feedback & Requests

### feedback_buyer
Buyer feedback collection
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

### request
General user requests tracking
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

## Key Development Notes

### Recent Schema Changes (2025-09-10)
- **Table Rename**: `user_ipowners` → `user_creators`
  - All application code updated to use new table name
  - Database migration completed successfully  
  - Historical migration files maintain original references
  - Field names and structure remain unchanged

### Query Patterns
- ✅ Always use `email` field for user lookups: `.eq('email', user.email)`
- ✅ Reference creator table as `user_creators` (not `user_ipowners`)
- ❌ Never use `user_id` - this field doesn't exist in user tables
- Handle null/undefined values appropriately
- Always include error handling with try/catch blocks

### User-Defined Types
The schema references several USER-DEFINED types that are specific to this implementation:
- `user_tier`: Basic tier system (basic, invited, pro, suite)
- `buyer_role`: Buyer role classifications
- `ip_owner_role`: Creator role classifications (historical name maintained for compatibility)
- `content_format`: Content format categories

### Vector Embeddings
Multiple embedding fields exist in the `titles` table for advanced search functionality:
- `description_embedding`: Main content description embeddings
- `combined_embedding`: Combined semantic embeddings
- `title_embedding`: Title-specific embeddings
- `synopsis_embedding`: Synopsis-specific embeddings
- `content_embedding`: Full content embeddings

### Important Relationships
- All user tables link to `auth.users(id)` via foreign key
- `titles.creator_id` references the content creator
- Chat system maintains full session > message > interaction hierarchy
- Featured titles link directly to main titles table
- Analytics tables track user behavior across search and chat interactions