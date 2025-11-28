# Database Schema Reference

**Last Updated**: 2025-11-15

**WARNING**: This schema is for context only and is not meant to be run directly. Table order and constraints may not be valid for execution.

**Recent Updates (2025-11-15)**:
- Added creator payment system tables: `creator_stripe_customers`, `creator_subscriptions`, `creator_payments`
- Added discount system tables: `discount_coupons`, `coupon_redemptions`
- Added content management tables: `content_posts`, `title_marketing_assets`
- Updated `title_content_analysis` schema: `semantic_tags` changed from `text[]` to `jsonb`
- Added CHECK constraints for numeric fields in `title_content_analysis`

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
  has_seen_welcome_video boolean DEFAULT false,
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
- `has_seen_welcome_video`: Whether user has viewed welcome video (Added 2025-10-24, default: false)
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
  title_url text,        -- URL to the original Korean version of the title
  title_url_en text,     -- URL to the English version of the title
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
  rights text, -- DEPRECATED: Use rights_available instead
  rights_available text[], -- Multi-select rights (film_tv, animation, publication, merchandising, game, other)
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
  verified boolean DEFAULT false,
  is_official_english_title boolean,
  english_title_type text CHECK (english_title_type = ANY (ARRAY['official'::text, 'translation'::text])),
  script_title_kr text,
  script_title_en text,
  art_title_kr text,
  art_title_en text,
  underlying_novel_kr text,
  underlying_novel_en text,
  rights_holder_name text,
  rights_holder_company text,
  inspiration text,
  important_issues text,
  setting_description text,
  world_lore text,
  supernatural_concepts text,
  character_details jsonb DEFAULT '[]'::jsonb,
  story_structure text,
  planned_ending text,
  narrative_arc text,
  awards ARRAY,
  sales_records text,
  merchandise_deals text,
  print_editions boolean DEFAULT false,
  print_edition_details text,
  media_coverage text,
  celebrity_endorsements text,
  creator_achievements jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT titles_pkey PRIMARY KEY (title_id),
  CONSTRAINT titles_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES auth.users(id)
);
```

**Core Fields**:
- `title_id`: UUID primary key
- `title_name_en`: English title name
- `title_name_kr`: Korean title name
- `is_official_english_title`: Whether English title is official (boolean)
- `english_title_type`: Type of English title ('official' | 'translation')
- `synopsis`: Full story synopsis
- `tagline`: Short tagline
- `tagline_kr`: Short tagline (Korean)
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
- `script_title_kr`: Script title (Korean)
- `script_title_en`: Script title (English)
- `art_title_kr`: Art title (Korean)
- `art_title_en`: Art title (English)
- `underlying_novel_kr`: Underlying novel title (Korean)
- `underlying_novel_en`: Underlying novel title (English)
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

**Rights & Business**:
- `rights`: **DEPRECATED** (migrated 2025-11-12) - Use `rights_available` instead
- `rights_available`: Multi-select array of available rights for licensing
  - Type: `text[]` (PostgreSQL array)
  - Valid values: `film_tv`, `animation`, `publication`, `merchandising`, `game`, `other`
  - UI: Checkbox group in creator AddTitle/EditTitle forms
  - Migration: 244 titles migrated from old `rights` field
- `rights_holder_name`: Rights holder's name
- `rights_holder_company`: Rights holder's company
- `cp`: Copyright information
- `pitch`: Pitch deck URL/text

**Story Details** (Questionnaire fields added 2025-10-24):
- `inspiration`: What inspired the story
- `important_issues`: Important themes/issues addressed
- `setting_description`: Story setting details
- `world_lore`: World-building and lore
- `supernatural_concepts`: Supernatural elements description
- `character_details`: JSONB array of character information
- `story_structure`: Narrative structure details
- `planned_ending`: How the story will end
- `narrative_arc`: Character/story arcs

**Achievements & Recognition** (Added 2025-10-24):
- `awards`: Array of awards received
- `sales_records`: Sales performance text
- `merchandise_deals`: Merchandising information
- `print_editions`: Whether print versions exist (boolean, default: false)
- `print_edition_details`: Print edition information
- `media_coverage`: Media mentions and coverage
- `celebrity_endorsements`: Celebrity endorsements
- `creator_achievements`: JSONB object of creator's achievements

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
- `priority`: Content priority level (enum: '1' = high, '2' = medium, '3' = low)
- `verified`: Boolean flag indicating official/verified content (default: false)
  - **Purpose**: Marks titles as officially verified/authenticated content
  - **Default**: false for all new titles
  - **UI Display**: Shows VerifiedBadge component (image overlay) on title cards
  - **Badge Location**: Top-left corner overlay on title images
  - **Component**: `VerifiedBadge` from `@/components/VerifiedBadge`
  - **Badge Image**: Stored in Supabase Storage (`images/verified.png`)
  - **Size Variants**: sm (card overlays), default, lg
  - **Migration**: See `20251016000000_add_verified_column_to_titles.sql`
  - **Usage**: Displayed on TitleList, Favorites, SearchResults, FeaturedTitlesCarousel pages
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

### title_platforms
Platform-specific metrics and URLs (Added 2025-10-24)

```sql
CREATE TABLE public.title_platforms (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title_id uuid NOT NULL,
  platform_name text NOT NULL CHECK (platform_name = ANY (ARRAY['naver'::text, 'kakao'::text, 'lezhin'::text, 'ridibooks'::text, 'toomics'::text, 'bomtoon'::text, 'ktoon'::text, 'kakaopage'::text, 'munpia'::text, 'joara'::text, 'novelpia'::text, 'other'::text])),
  platform_url text NOT NULL,
  views bigint DEFAULT 0,
  subscribers bigint DEFAULT 0,
  other_metrics jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT title_platforms_pkey PRIMARY KEY (id),
  CONSTRAINT title_platforms_title_id_fkey FOREIGN KEY (title_id) REFERENCES public.titles(title_id)
);
```

**Fields**:
- `id`: UUID primary key
- `title_id`: References titles(title_id)
- `platform_name`: Platform name (naver|kakao|lezhin|ridibooks|toomics|bomtoon|ktoon|kakaopage|munpia|joara|novelpia|other)
- `platform_url`: URL to content on platform
- `views`: View count on platform
- `subscribers`: Subscriber count on platform
- `other_metrics`: JSONB object for additional platform-specific metrics
- `created_at`: Record creation timestamp
- `updated_at`: Last update timestamp

### title_documents
Document attachments for titles (Added 2025-10-24)

```sql
CREATE TABLE public.title_documents (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title_id uuid NOT NULL,
  document_type text NOT NULL CHECK (document_type = ANY (ARRAY['source_pdf'::text, 'story_bible'::text, 'outline'::text, 'script'::text, 'press_release'::text, 'interview'::text, 'review'::text, 'wiki'::text, 'other'::text])),
  file_url text NOT NULL,
  file_name text NOT NULL,
  file_size bigint,
  shareable_with_nda boolean DEFAULT false,
  external_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT title_documents_pkey PRIMARY KEY (id),
  CONSTRAINT title_documents_title_id_fkey FOREIGN KEY (title_id) REFERENCES public.titles(title_id)
);
```

**Fields**:
- `id`: UUID primary key
- `title_id`: References titles(title_id)
- `document_type`: Type of document (source_pdf|story_bible|outline|script|press_release|interview|review|wiki|other)
- `file_url`: Supabase Storage URL to file
- `file_name`: Original filename
- `file_size`: File size in bytes
- `shareable_with_nda`: Whether document can be shared under NDA
- `external_url`: External URL if document hosted elsewhere
- `created_at`: Upload timestamp
- `updated_at`: Last update timestamp

### title_drafts
Creator draft storage for multi-step form (Added 2025-10-24)
**UPDATED 2025-11-04**: Added submission approval workflow

```sql
CREATE TABLE public.title_drafts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL,
  draft_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  current_step integer DEFAULT 1 CHECK (current_step >= 1 AND current_step <= 5),
  last_saved_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')),
  submitted_at timestamp with time zone,
  approved_at timestamp with time zone,
  rejected_at timestamp with time zone,
  approved_by uuid REFERENCES auth.users(id),
  rejection_reason text,
  CONSTRAINT title_drafts_pkey PRIMARY KEY (id),
  CONSTRAINT title_drafts_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES auth.users(id)
);
```

**Note**: As of 2025-11-04, the UNIQUE constraint on `creator_id` was removed to allow multiple drafts per creator.

**Fields**:
- `id`: UUID primary key
- `creator_id`: References auth.users(id), can have multiple drafts
- `draft_data`: JSONB object containing all form data
- `current_step`: Current step in multi-step form (1-5)
- `last_saved_at`: When draft was last saved
- `created_at`: Draft creation timestamp
- `updated_at`: Last update timestamp
- `status`: Workflow status (draft | submitted | approved | rejected, default: 'draft')
- `submitted_at`: Timestamp when creator clicked Submit Title
- `approved_at`: Timestamp when admin approved submission
- `rejected_at`: Timestamp when admin rejected submission
- `approved_by`: Admin user UUID who approved or rejected (references auth.users)
- `rejection_reason`: Admin feedback for rejected submissions

**Purpose**: Allows creators to save progress while filling out the multi-step title questionnaire and submit for admin approval.

**Workflow**:
1. Creator saves progress → status: 'draft'
2. Creator submits for review → status: 'submitted', `submitted_at` set
3. Admin reviews:
   - Approve → status: 'approved', `approved_at` and `approved_by` set
   - Reject → status: 'rejected', `rejected_at`, `approved_by`, and `rejection_reason` set

### title_content_analysis
AI-generated content analysis for enhanced search

```sql
CREATE TABLE public.title_content_analysis (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title_id uuid NOT NULL UNIQUE,
  semantic_tags jsonb DEFAULT '[]'::jsonb,
  mood_analysis jsonb DEFAULT '{}'::jsonb,
  character_types ARRAY DEFAULT '{}'::text[],
  plot_elements ARRAY DEFAULT '{}'::text[],
  cultural_elements ARRAY DEFAULT '{}'::text[],
  complexity_score numeric DEFAULT 5.0 CHECK (complexity_score >= 1.0 AND complexity_score <= 10.0),
  reading_time_minutes integer,
  content_quality_score numeric DEFAULT 5.0 CHECK (content_quality_score >= 0.0 AND content_quality_score <= 10.0),
  target_demographics jsonb DEFAULT '{}'::jsonb,
  content_warnings ARRAY DEFAULT '{}'::text[],
  accessibility_features ARRAY DEFAULT '{}'::text[],
  keyword_density jsonb DEFAULT '{}'::jsonb,
  search_boost_factor numeric DEFAULT 1.0 CHECK (search_boost_factor >= 0.5 AND search_boost_factor <= 2.0),
  pitch_analysis jsonb DEFAULT '{}'::jsonb,
  analysis_version text DEFAULT '1.0'::text,
  processed_by text DEFAULT 'openai-gpt-4'::text,
  processing_confidence double precision DEFAULT 0.0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT title_content_analysis_pkey PRIMARY KEY (id),
  CONSTRAINT title_content_analysis_title_id_fkey FOREIGN KEY (title_id) REFERENCES public.titles(title_id)
);
```

**Fields**:
- `id`: UUID primary key
- `title_id`: Unique title identifier (UUID)
- `semantic_tags`: JSONB array of semantic tags (type changed from text[] to jsonb)
- `mood_analysis`: JSONB mood analysis data
- `character_types`: Array of character archetypes
- `plot_elements`: Array of plot elements
- `cultural_elements`: Array of cultural references
- `complexity_score`: Content complexity (1.0-10.0, default: 5.0)
- `reading_time_minutes`: Estimated reading time in minutes
- `content_quality_score`: Quality rating (0.0-10.0, default: 5.0)
- `target_demographics`: JSONB demographic data
- `content_warnings`: Array of content warnings
- `accessibility_features`: Array of accessibility features (Added 2025-10-21)
- `keyword_density`: JSONB keyword frequency data
- `search_boost_factor`: Search ranking boost (0.5-2.0, default: 1.0)
- `pitch_analysis`: JSONB pitch analytics data (Added 2025-10-21, **CRITICAL for Phase 3 chatbot**)
- `analysis_version`: Version of analysis algorithm used (default: '1.0', Added 2025-10-21)
- `processed_by`: Processing system identifier (default: 'openai-gpt-4', Added 2025-10-21)
- `processing_confidence`: Confidence score 0.0-1.0 (Added 2025-10-21, used for Phase 3 chatbot quality threshold)
- `created_at`: Analysis creation timestamp
- `updated_at`: Last update timestamp

**Phase 3 Chatbot Integration**:
The `pitch_analysis` field stores structured pitch deck data extracted from PDFs, enabling enhanced chatbot responses with:
- Character details (archetypes, relationships)
- Story loglines and conflicts
- Market positioning and comparables
- Source material metrics (views, chapters)
- Korean cultural elements
- Only data with `processing_confidence >= 0.70` is used by the chatbot

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

### webhook_events
Stripe webhook event deduplication

```sql
CREATE TABLE public.webhook_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  stripe_event_id text NOT NULL UNIQUE,
  processed_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT webhook_events_pkey PRIMARY KEY (id)
);
```

**Fields**:
- `id`: UUID primary key
- `stripe_event_id`: Stripe event ID (unique)
- `processed_at`: When event was processed
- `created_at`: Record creation timestamp

**Purpose**: Prevents duplicate processing of Stripe webhook events by tracking which event IDs have already been handled

### creator_stripe_customers
Creator-specific Stripe customer tracking (Added 2025-11-14)

```sql
CREATE TABLE public.creator_stripe_customers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  creator_email text NOT NULL UNIQUE,
  stripe_customer_id text NOT NULL UNIQUE,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT creator_stripe_customers_pkey PRIMARY KEY (id)
);
```

**Fields**:
- `id`: UUID primary key
- `creator_email`: Creator's email address (unique)
- `stripe_customer_id`: Stripe customer ID (unique)
- `created_at`: Record creation timestamp
- `updated_at`: Last update timestamp

**Purpose**: Tracks Stripe customer records for creators who purchase subscription plans for their titles

### creator_subscriptions
Creator subscription management (Added 2025-11-14)

```sql
CREATE TABLE public.creator_subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  creator_email text NOT NULL,
  title_id uuid NOT NULL,
  stripe_subscription_id text NOT NULL UNIQUE,
  stripe_customer_id text NOT NULL,
  plan_type text NOT NULL CHECK (plan_type = ANY (ARRAY['packaging'::text, 'premium'::text])),
  billing_period text NOT NULL CHECK (billing_period = ANY (ARRAY['monthly'::text, 'yearly'::text])),
  status text NOT NULL CHECK (status = ANY (ARRAY['active'::text, 'canceled'::text, 'past_due'::text, 'unpaid'::text, 'trialing'::text])),
  current_period_start timestamp with time zone,
  current_period_end timestamp with time zone,
  cancel_at_period_end boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT creator_subscriptions_pkey PRIMARY KEY (id),
  CONSTRAINT creator_subscriptions_title_id_fkey FOREIGN KEY (title_id) REFERENCES public.titles(title_id)
);
```

**Fields**:
- `id`: UUID primary key
- `creator_email`: Creator's email address
- `title_id`: References titles(title_id)
- `stripe_subscription_id`: Stripe subscription ID (unique)
- `stripe_customer_id`: Stripe customer ID
- `plan_type`: Subscription plan type (packaging|premium)
- `billing_period`: Billing frequency (monthly|yearly)
- `status`: Subscription status (active|canceled|past_due|unpaid|trialing)
- `current_period_start`: Current billing period start date
- `current_period_end`: Current billing period end date
- `cancel_at_period_end`: Whether subscription cancels at period end
- `created_at`: Record creation timestamp
- `updated_at`: Last update timestamp

**Purpose**: Manages creator subscriptions for title-specific premium features (packaging, premium listing)

### creator_payments
Creator payment tracking (Added 2025-11-14)

```sql
CREATE TABLE public.creator_payments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  creator_email text NOT NULL,
  subscription_id text,
  stripe_payment_intent_id text UNIQUE,
  stripe_invoice_id text,
  amount numeric NOT NULL,
  currency text DEFAULT 'usd'::text,
  status text NOT NULL CHECK (status = ANY (ARRAY['succeeded'::text, 'failed'::text, 'pending'::text, 'refunded'::text])),
  invoice_url text,
  receipt_url text,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT creator_payments_pkey PRIMARY KEY (id),
  CONSTRAINT creator_payments_subscription_id_fkey FOREIGN KEY (subscription_id) REFERENCES public.creator_subscriptions(stripe_subscription_id)
);
```

**Fields**:
- `id`: UUID primary key
- `creator_email`: Creator's email address
- `subscription_id`: References creator_subscriptions(stripe_subscription_id)
- `stripe_payment_intent_id`: Stripe payment intent ID (unique)
- `stripe_invoice_id`: Stripe invoice ID
- `amount`: Payment amount
- `currency`: Payment currency (default: 'usd')
- `status`: Payment status (succeeded|failed|pending|refunded)
- `invoice_url`: URL to Stripe invoice
- `receipt_url`: URL to payment receipt
- `description`: Payment description
- `created_at`: Payment timestamp

**Purpose**: Tracks individual payment transactions for creator subscriptions

### discount_coupons
Discount coupon management (Added 2025-11-14)

```sql
CREATE TABLE public.discount_coupons (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  discount_type text NOT NULL CHECK (discount_type = ANY (ARRAY['percentage'::text, 'fixed_amount'::text])),
  discount_value numeric NOT NULL,
  valid_from timestamp with time zone DEFAULT now(),
  valid_until timestamp with time zone,
  usage_limit integer,
  usage_count integer DEFAULT 0,
  applicable_plans ARRAY,
  created_by text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT discount_coupons_pkey PRIMARY KEY (id)
);
```

**Fields**:
- `id`: UUID primary key
- `code`: Coupon code (unique)
- `discount_type`: Type of discount (percentage|fixed_amount)
- `discount_value`: Discount value (percentage or amount)
- `valid_from`: Coupon valid start date (default: now)
- `valid_until`: Coupon expiration date
- `usage_limit`: Maximum number of uses
- `usage_count`: Current usage count (default: 0)
- `applicable_plans`: Array of plan types this coupon applies to
- `created_by`: Admin email who created the coupon
- `is_active`: Whether coupon is currently active (default: true)
- `created_at`: Record creation timestamp
- `updated_at`: Last update timestamp

**Purpose**: Manages discount coupons for creator subscription plans

### coupon_redemptions
Coupon redemption tracking (Added 2025-11-14)

```sql
CREATE TABLE public.coupon_redemptions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  coupon_id uuid,
  creator_email text NOT NULL,
  subscription_id text,
  title_id uuid,
  discount_applied numeric NOT NULL,
  redeemed_at timestamp with time zone DEFAULT now(),
  CONSTRAINT coupon_redemptions_pkey PRIMARY KEY (id),
  CONSTRAINT coupon_redemptions_coupon_id_fkey FOREIGN KEY (coupon_id) REFERENCES public.discount_coupons(id),
  CONSTRAINT coupon_redemptions_subscription_id_fkey FOREIGN KEY (subscription_id) REFERENCES public.creator_subscriptions(stripe_subscription_id),
  CONSTRAINT coupon_redemptions_title_id_fkey FOREIGN KEY (title_id) REFERENCES public.titles(title_id)
);
```

**Fields**:
- `id`: UUID primary key
- `coupon_id`: References discount_coupons(id)
- `creator_email`: Creator's email address
- `subscription_id`: References creator_subscriptions(stripe_subscription_id)
- `title_id`: References titles(title_id)
- `discount_applied`: Actual discount amount applied
- `redeemed_at`: Redemption timestamp (default: now)

**Purpose**: Tracks coupon redemptions and links them to specific subscriptions

---

## Content Management

### content_posts
Content management for blog/learning articles (Added 2025-11-14)

```sql
CREATE TABLE public.content_posts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  excerpt text,
  content text NOT NULL,
  featured_image_url text,
  category text NOT NULL CHECK (category = ANY (ARRAY['learning'::text, 'news'::text])),
  tags ARRAY DEFAULT '{}'::text[],
  author_email text NOT NULL,
  author_name text NOT NULL,
  status text NOT NULL DEFAULT 'draft'::text CHECK (status = ANY (ARRAY['draft'::text, 'published'::text, 'archived'::text])),
  published_at timestamp with time zone,
  meta_description text,
  meta_keywords ARRAY,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT content_posts_pkey PRIMARY KEY (id)
);
```

**Fields**:
- `id`: UUID primary key
- `title`: Article title
- `slug`: URL-friendly slug (unique)
- `excerpt`: Short excerpt/summary
- `content`: Full article content
- `featured_image_url`: URL to featured image
- `category`: Article category (learning|news)
- `tags`: Array of tags
- `author_email`: Author's email address
- `author_name`: Author's name
- `status`: Publication status (draft|published|archived, default: 'draft')
- `published_at`: Publication timestamp
- `meta_description`: SEO meta description
- `meta_keywords`: SEO keywords array
- `created_at`: Record creation timestamp
- `updated_at`: Last update timestamp

**Purpose**: Manages blog posts and educational content for the platform

### title_marketing_assets
AI-generated marketing assets for titles (Added 2025-11-14)

```sql
CREATE TABLE public.title_marketing_assets (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title_id text NOT NULL,
  title_name text NOT NULL,
  asset_category text NOT NULL CHECK (asset_category = ANY (ARRAY['social_media'::text, 'ad_creative'::text, 'pitch_material'::text])),
  asset_type text NOT NULL,
  asset_format text,
  description text NOT NULL,
  prompt_template text NOT NULL,
  prompt_used text,
  image_url text,
  video_url text,
  generation_api text CHECK (generation_api = ANY (ARRAY['dall-e-3'::text, 'openai-video'::text])),
  generation_model text,
  generation_cost numeric DEFAULT 0,
  generation_attempts integer DEFAULT 0,
  error_message text,
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'generating'::text, 'completed'::text, 'failed'::text])),
  approved boolean DEFAULT false,
  approved_by_email text,
  approved_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT title_marketing_assets_pkey PRIMARY KEY (id)
);
```

**Fields**:
- `id`: UUID primary key
- `title_id`: Associated title identifier (text, not UUID foreign key)
- `title_name`: Title name for reference
- `asset_category`: Category of marketing asset (social_media|ad_creative|pitch_material)
- `asset_type`: Specific type of asset
- `asset_format`: File format of asset
- `description`: Asset description
- `prompt_template`: Template used for AI generation
- `prompt_used`: Actual prompt sent to AI
- `image_url`: URL to generated image
- `video_url`: URL to generated video
- `generation_api`: API used for generation (dall-e-3|openai-video)
- `generation_model`: Specific model used
- `generation_cost`: Cost of generation
- `generation_attempts`: Number of generation attempts
- `error_message`: Error message if generation failed
- `status`: Generation status (pending|generating|completed|failed, default: 'pending')
- `approved`: Whether asset is approved for use
- `approved_by_email`: Email of approver
- `approved_at`: Approval timestamp
- `created_at`: Record creation timestamp
- `updated_at`: Last update timestamp

**Purpose**: Manages AI-generated marketing assets for titles (social media posts, ad creatives, pitch materials)

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

### Verified Titles Query

```typescript
// Query only verified/official titles
const { data, error } = await supabase
  .from('titles')
  .select('*')
  .eq('verified', true);

// Query with priority and verified filters
const { data, error } = await supabase
  .from('titles')
  .select('*')
  .eq('verified', true)
  .eq('priority', '1')  // High priority verified titles
  .order('created_at', { ascending: false });

// Check if title is verified (frontend conditional rendering)
{title.verified && <VerifiedBadge size="sm" />}
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
7. **Priority system**: Priority enum values are strings ('1', '2', '3') where '1' = high, '2' = medium, '3' = low
8. **Verified content**: The `verified` column defaults to false; requires manual update to mark titles as officially verified
9. **Content curation**: Use `priority` and `verified` together for curated title displays (e.g., `verified=true` AND `priority='1'` for featured official content)
