# Database Schema Reference

**Last Updated**: 2025-10-06

**WARNING**: This schema is for context only and is not meant to be run directly. Table order and constraints may not be valid for execution.

---

## Authentication & Admin

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

**Fields**:
- `id`: UUID primary key, references auth.users(id)
- `email`: Unique email address for admin access
- `full_name`: Administrator's full name
- `active`: Whether admin account is active (default: true)
- `created_at`: Account creation timestamp

---

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

**Fields**:
- `id`: UUID primary key, references auth.users(id)
- `email`: Unique email address
- `full_name`: User's full name
- `buyer_company`: Company name (optional)
- `buyer_role`: Enum type (producer|executive|agent|content_scout|other)
- `linkedin_url`: LinkedIn profile URL (optional)
- `requested`: Boolean flag for premium access requests
- `tier`: Access tier (basic|invited|pro|suite, default: 'basic')
- `created_at`: Account creation timestamp
- `updated_at`: Last update timestamp

**Tier System**:
- `basic` - Default tier, standard features
- `invited` - Restricted access (legacy/special cases)
- `pro` - Premium content access
- `suite` - Full feature access

### user_creators
Content creator/IP owner accounts

```sql
CREATE TABLE public.user_creators (
  id uuid NOT NULL,
  email text NOT NULL,
  full_name text NOT NULL,
  pen_name text,
  ip_owner_role USER-DEFINED,
  ip_owner_company text,
  website_url text,
  invitation_status text DEFAULT 'invited'::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  tier USER-DEFINED DEFAULT 'basic'::user_tier,
  CONSTRAINT user_creators_pkey PRIMARY KEY (id),
  CONSTRAINT user_creators_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
```

**Fields**:
- `id`: UUID primary key, references auth.users(id)
- `email`: Unique email address
- `full_name`: Creator's full name
- `pen_name`: Pen name or studio name (optional)
- `ip_owner_role`: Creator role type (author|agent)
- `ip_owner_company`: Company/publisher name (optional)
- `website_url`: Creator's website URL (optional)
- `invitation_status`: Invitation status (default: 'invited')
- `tier`: Access tier (default: 'basic')
- `created_at`: Account creation timestamp
- `updated_at`: Last update timestamp

### user_favorites
User-favorited titles relationship

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

**Fields**:
- `id`: UUID primary key
- `user_id`: References auth.users(id)
- `title_id`: References titles(title_id)
- `created_at`: When title was favorited

### user_onboarding
User onboarding progress tracking

```sql
CREATE TABLE public.user_onboarding (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL UNIQUE,
  user_email text NOT NULL,
  onboarding_completed boolean DEFAULT false,
  onboarding_started_at timestamp with time zone,
  onboarding_completed_at timestamp with time zone,
  current_step integer DEFAULT 0,
  skipped boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_onboarding_pkey PRIMARY KEY (id),
  CONSTRAINT user_onboarding_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
```

**Fields**:
- `id`: UUID primary key
- `user_id`: References auth.users(id), unique
- `user_email`: User's email address
- `onboarding_completed`: Whether onboarding is complete
- `onboarding_started_at`: When onboarding started
- `onboarding_completed_at`: When onboarding completed
- `current_step`: Current onboarding step number
- `skipped`: Whether user skipped onboarding
- `created_at`: Record creation timestamp
- `updated_at`: Last update timestamp

---

## Content & Titles

### titles
Main content catalog table with vector embeddings

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
  embedding_model text DEFAULT 'text-embedding-ada-002'::text,
  embedding_created_at timestamp with time zone,
  embedding_updated_at timestamp with time zone,
  description_embedding USER-DEFINED,
  combined_embedding USER-DEFINED,
  title_embedding USER-DEFINED,
  synopsis_embedding USER-DEFINED,
  content_embedding USER-DEFINED,
  priority USER-DEFINED NOT NULL DEFAULT '2'::priority,
  CONSTRAINT titles_pkey PRIMARY KEY (title_id),
  CONSTRAINT titles_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES auth.users(id)
);
```

**Core Fields**:
- `title_id`: UUID primary key
- `title_name_en`: English title name
- `title_name_kr`: Korean title name
- `synopsis`: Full story synopsis
- `tagline`: Short tagline
- `description_kr`: Korean description
- `note`: Internal notes
- `note_kr`: Korean notes

**Authors & Credits**:
- `story_author`: Story writer
- `art_author`: Artist
- `story_author_kr`: Story writer (Korean)
- `art_author_kr`: Artist (Korean)
- `original_author`: Original author
- `original_author_kr`: Original author (Korean)
- `creator_id`: References auth.users(id)

**Classification**:
- `genre`: Array of genres
- `genre_kr`: Array of genres (Korean)
- `content_format`: Content type (webtoon|manhwa|novel)
- `tone`: Story tone
- `audience`: Target audience
- `age_rating`: Age rating
- `keywords`: Array of keywords
- `comps`: Array of comparable titles
- `tags`: Array of tags

**Rights & Business**:
- `rights`: Rights status
- `cp`: Copyright information
- `pitch`: Pitch deck URL/text

**Metrics**:
- `views`: View count
- `likes`: Like count
- `rating`: Average rating (0-5)
- `rating_count`: Number of ratings
- `completed`: Completion status
- `chapters`: Total chapters
- `perfect_for`: "Perfect for" description

**Vector Embeddings** (1536 dimensions each):
- `title_embedding`: Title name embedding
- `synopsis_embedding`: Synopsis embedding
- `description_embedding`: Description embedding
- `content_embedding`: Combined content embedding
- `combined_embedding`: Master embedding (used for vector search)
- `embedding_model`: Model used (default: 'text-embedding-ada-002')
- `embedding_created_at`: When embeddings were generated
- `embedding_updated_at`: Last embedding update

**System**:
- `priority`: Content priority level
- `created_at`: Record creation timestamp
- `updated_at`: Last update timestamp

### featured
Featured/highlighted titles

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

**Fields**:
- `id`: UUID primary key
- `title_id`: References titles(title_id)
- `note`: Internal notes about featuring
- `created_at`: When featured
- `updated_at`: Last update timestamp

### title_content_analysis
AI-generated content analysis for enhanced search

```sql
CREATE TABLE public.title_content_analysis (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title_id text NOT NULL UNIQUE,
  semantic_tags ARRAY DEFAULT '{}'::text[],
  mood_analysis jsonb DEFAULT '{}'::jsonb,
  character_types ARRAY DEFAULT '{}'::text[],
  plot_elements ARRAY DEFAULT '{}'::text[],
  cultural_elements ARRAY DEFAULT '{}'::text[],
  target_demographics jsonb DEFAULT '{}'::jsonb,
  content_warnings ARRAY DEFAULT '{}'::text[],
  keyword_density jsonb DEFAULT '{}'::jsonb,
  complexity_score numeric DEFAULT 5.0,
  content_quality_score numeric DEFAULT 5.0,
  search_boost_factor numeric DEFAULT 1.0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT title_content_analysis_pkey PRIMARY KEY (id)
);
```

**Fields**:
- `id`: UUID primary key
- `title_id`: Unique title identifier
- `semantic_tags`: Array of semantic tags
- `mood_analysis`: JSONB mood analysis data
- `character_types`: Array of character archetypes
- `plot_elements`: Array of plot elements
- `cultural_elements`: Array of cultural references
- `target_demographics`: JSONB demographic data
- `content_warnings`: Array of content warnings
- `keyword_density`: JSONB keyword frequency data
- `complexity_score`: Content complexity (0-10)
- `content_quality_score`: Quality rating (0-10)
- `search_boost_factor`: Search ranking boost
- `created_at`: Analysis creation timestamp
- `updated_at`: Last update timestamp

---

## AI Chatbot System

### chat_sessions
Chat conversation sessions

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
  messages jsonb DEFAULT '[]'::jsonb,
  CONSTRAINT chat_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT chat_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
```

**Fields**:
- `id`: UUID primary key
- `user_id`: References auth.users(id)
- `user_email`: User's email address
- `session_type`: Type of chatbot (default: 'openai')
- `started_at`: Session start time
- `ended_at`: Session end time (null = active)
- `messages`: JSONB array of conversation messages
- `created_at`: Record creation timestamp
- `updated_at`: Last update timestamp

### chat_messages
Individual chat messages

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
  CONSTRAINT chat_messages_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.chat_sessions(id),
  CONSTRAINT chat_messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
```

**Fields**:
- `id`: UUID primary key
- `session_id`: References chat_sessions(id)
- `user_id`: References auth.users(id)
- `message_type`: 'user_prompt' or 'ai_response'
- `content`: Message text
- `tokens_used`: OpenAI tokens consumed
- `response_time_ms`: Response generation time
- `created_at`: Message timestamp

### chat_title_recommendations
Titles recommended in chat responses

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

**Fields**:
- `id`: UUID primary key
- `message_id`: References chat_messages(id)
- `session_id`: References chat_sessions(id)
- `title_id`: Recommended title identifier
- `title_name_en`: English title name (cached)
- `title_name_kr`: Korean title name (cached)
- `recommendation_score`: Similarity score (0-1)
- `recommendation_reason`: Why recommended
- `created_at`: Recommendation timestamp

### chat_suggested_queries
Follow-up query suggestions

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
  CONSTRAINT chat_suggested_queries_message_id_fkey FOREIGN KEY (message_id) REFERENCES public.chat_messages(id),
  CONSTRAINT chat_suggested_queries_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.chat_sessions(id)
);
```

**Fields**:
- `id`: UUID primary key
- `message_id`: References chat_messages(id)
- `session_id`: References chat_sessions(id)
- `suggested_query`: Suggested query text
- `query_position`: Order in suggestion list
- `clicked`: Whether user clicked this suggestion
- `created_at`: Suggestion timestamp

### chat_interactions
User interaction tracking

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

**Fields**:
- `id`: UUID primary key
- `session_id`: References chat_sessions(id)
- `user_id`: References auth.users(id)
- `interaction_type`: Type of interaction (title_click|suggestion_click|title_view|session_end)
- `target_id`: Target identifier (title_id, query text, etc.)
- `target_title`: Target title name
- `metadata`: Additional JSONB metadata
- `created_at`: Interaction timestamp

### chat_message_feedback
User feedback on chat responses

```sql
CREATE TABLE public.chat_message_feedback (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL,
  session_id uuid NOT NULL,
  user_id uuid NOT NULL,
  overall_rating integer NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
  response_quality character varying NOT NULL CHECK (response_quality::text = ANY (ARRAY['excellent'::character varying, 'good'::character varying, 'fair'::character varying, 'poor'::character varying]::text[])),
  title_relevance character varying NOT NULL CHECK (title_relevance::text = ANY (ARRAY['excellent'::character varying, 'good'::character varying, 'fair'::character varying, 'poor'::character varying]::text[])),
  title_feedback jsonb,
  general_feedback text,
  suggested_improvements text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT chat_message_feedback_pkey PRIMARY KEY (id),
  CONSTRAINT chat_message_feedback_message_id_fkey FOREIGN KEY (message_id) REFERENCES public.chat_messages(id),
  CONSTRAINT chat_message_feedback_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.chat_sessions(id)
);
```

**Fields**:
- `id`: UUID primary key
- `message_id`: References chat_messages(id)
- `session_id`: References chat_sessions(id)
- `user_id`: References auth.users(id)
- `overall_rating`: Rating 1-5
- `response_quality`: excellent|good|fair|poor
- `title_relevance`: excellent|good|fair|poor
- `title_feedback`: JSONB feedback data
- `general_feedback`: General feedback text
- `suggested_improvements`: Improvement suggestions
- `created_at`: Feedback timestamp
- `updated_at`: Last update timestamp

---

## Analytics & Tracking

### vector_search_analytics
Vector search performance tracking

```sql
CREATE TABLE public.vector_search_analytics (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  query text NOT NULL,
  search_type text DEFAULT 'vector'::text,
  result_count integer DEFAULT 0,
  clicked_title_id text,
  click_position integer,
  search_duration_ms integer,
  user_id text,
  session_id text NOT NULL,
  query_intent text DEFAULT 'browse'::text,
  query_complexity text DEFAULT 'simple'::text,
  user_satisfaction_score integer,
  refinements ARRAY DEFAULT '{}'::text[],
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT vector_search_analytics_pkey PRIMARY KEY (id)
);
```

**Fields**:
- `id`: UUID primary key
- `query`: Search query text
- `search_type`: Type of search (default: 'vector')
- `result_count`: Number of results returned
- `clicked_title_id`: Title user clicked
- `click_position`: Position in results
- `search_duration_ms`: Search duration in milliseconds
- `user_id`: User identifier
- `session_id`: Session identifier
- `query_intent`: Intent classification (default: 'browse')
- `query_complexity`: Complexity level (default: 'simple')
- `user_satisfaction_score`: Satisfaction rating
- `refinements`: Array of query refinements
- `created_at`: Search timestamp

---

## Payments & Subscriptions

### stripe_customers
Stripe customer and subscription data

```sql
CREATE TABLE public.stripe_customers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  stripe_customer_id text UNIQUE,
  stripe_subscription_id text UNIQUE,
  subscription_status text CHECK (subscription_status = ANY (ARRAY['active'::text, 'canceled'::text, 'incomplete'::text, 'incomplete_expired'::text, 'past_due'::text, 'paused'::text, 'trialing'::text, 'unpaid'::text])),
  current_period_end timestamp with time zone,
  cancel_at_period_end boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT stripe_customers_pkey PRIMARY KEY (id),
  CONSTRAINT stripe_customers_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
```

**Fields**:
- `id`: UUID primary key
- `user_id`: References auth.users(id), unique
- `stripe_customer_id`: Stripe customer ID
- `stripe_subscription_id`: Stripe subscription ID
- `subscription_status`: Subscription status (active|canceled|incomplete|incomplete_expired|past_due|paused|trialing|unpaid)
- `current_period_end`: Current billing period end date
- `cancel_at_period_end`: Whether subscription cancels at period end
- `created_at`: Record creation timestamp
- `updated_at`: Last update timestamp

---

## Feedback & Requests

### feedback_buyer
Buyer user feedback

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

**Fields**:
- `id`: Auto-incrementing primary key
- `feedback`: Feedback text
- `user_id`: References user_buyers(id)
- `created_at`: Feedback timestamp

### request
General request tracking

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

**Fields**:
- `id`: Auto-incrementing primary key
- `title_id`: Related title identifier
- `user_id`: User identifier
- `type`: Request type
- `created_at`: Request timestamp

---

## Query Patterns

### User Profile Queries

**CRITICAL**: Always query by `email`, never by `user_id` (field doesn't exist in user tables).

```typescript
// ✅ CORRECT - Query by email
const { data } = await supabase
  .from('user_buyers')
  .select('*')
  .eq('email', user.email?.toLowerCase())
  .single();

// ❌ INCORRECT - user_id field doesn't exist
const { data } = await supabase
  .from('user_buyers')
  .select('*')
  .eq('user_id', user.id);
```

### Vector Search Query

```typescript
// Vector similarity search using pgvector
const { data, error } = await supabase.rpc('match_titles_by_embedding', {
  query_embedding: embeddingArray,  // float[] (1536 dimensions)
  match_threshold: 0.7,             // Similarity threshold
  match_count: 10                   // Number of results
});
```

---

## Account Types

The application uses two primary account types stored in user metadata:

- `'buyer'` - Content buyers/media companies
- `'creator'` - Content creators/IP owners

These account types determine:
- Which dashboard interface users see
- Database table for profile storage (`user_buyers` vs `user_creators`)
- Available features and permissions

---

## Important Notes

1. **Email-based queries**: Always use `email` field for user lookups, not `user_id`
2. **Vector embeddings**: All title embeddings are 1536-dimension vectors using text-embedding-ada-002
3. **Tier system**: Default tier for new buyers is `'basic'`
4. **Account types**: Only `'buyer'` and `'creator'` are valid account types
5. **Session tracking**: Chat sessions track both user_id and user_email for analytics
6. **Foreign keys**: Most user-related tables reference `auth.users(id)` directly
