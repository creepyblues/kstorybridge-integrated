# Product Requirements Document (PRD)
# KStoryBridge Dashboard Application

**Version**: 2.0
**Last Updated**: 2025-01-26
**Status**: Production
**Repository**: `kstorybridge-monorepo/apps/dashboard`
**Total Codebase**: ~48,000 lines of TypeScript/TSX

---

## 📋 TABLE OF CONTENTS

1. [Executive Summary](#executive-summary)
2. [Product Overview](#product-overview)
3. [User Personas](#user-personas)
4. [Core Features](#core-features)
5. [Technical Architecture](#technical-architecture)
6. [User Flows](#user-flows)
7. [Database Schema](#database-schema)
8. [API & Services](#api--services)
9. [UI/UX Requirements](#uiux-requirements)
10. [Authentication & Authorization](#authentication--authorization)
11. [Tier System](#tier-system)
12. [AI/ML Features](#aiml-features)
13. [Performance Requirements](#performance-requirements)
14. [Security Requirements](#security-requirements)
15. [Deployment](#deployment)
16. [Testing Strategy](#testing-strategy)
17. [Future Roadmap](#future-roadmap)

---

## 1. EXECUTIVE SUMMARY

### 1.1 Product Vision

KStoryBridge Dashboard is a B2B marketplace platform connecting Korean content creators (webtoon artists, novelists, manhwa creators) with global media buyers (production companies, streaming services, publishers). The dashboard serves as the primary interface for browsing, discovering, and managing Korean intellectual property (IP) rights acquisition.

### 1.2 Business Objectives

- **Primary Goal**: Facilitate efficient discovery and acquisition of Korean entertainment IP
- **Target Market**: Global media buyers and Korean content creators
- **Competitive Advantage**: AI-powered content discovery, comprehensive IP database, tier-based access control
- **Revenue Model**: Subscription tiers (Basic, Pro, Suite) for premium content access

### 1.3 Success Metrics

| Metric | Target | Current |
|--------|--------|---------|
| Daily Active Users | 500+ | Growing |
| Content Discovery Time | < 5 min | Optimized |
| Title Database Size | 1000+ titles | Expanding |
| User Satisfaction (NPS) | > 50 | Measured via feedback |
| Conversion Rate (Basic → Pro) | > 15% | Tracking implemented |

---

## 2. PRODUCT OVERVIEW

### 2.1 Product Description

A dual-interface dashboard application serving two distinct user types:
- **Buyers** (Media companies, producers, content scouts)
- **Creators** (Webtoon artists, novelists, IP owners)

### 2.2 Key Differentiators

1. **AI-Powered Discovery**
   - Vector-based semantic search
   - GPT-4 conversational chatbot
   - Smart content recommendations

2. **Comprehensive IP Database**
   - 1000+ Korean titles
   - Complete metadata (rights, authors, synopses)
   - Pitch decks and media assets

3. **Tier-Based Access Control**
   - Basic: Browse public titles
   - Pro: Access premium content
   - Suite: Full feature access + priority support

4. **Bilingual Support**
   - Korean (한글) and English interfaces
   - Dual-language title data

### 2.3 Platform Specifications

- **Framework**: React 18 + TypeScript + Vite
- **Backend**: Supabase (PostgreSQL + Auth + Edge Functions)
- **Hosting**: Vercel (dashboard.kstorybridge.com)
- **Device Support**: Desktop-first, mobile-responsive
- **Browser Support**: Chrome, Firefox, Safari (latest 2 versions)

---

## 3. USER PERSONAS

### 3.1 Persona 1: Media Buyer (Primary User)

**Profile**:
- **Name**: Sarah Chen
- **Role**: Content Acquisition Manager at streaming service
- **Age**: 32-45
- **Location**: Los Angeles, USA
- **Tech Savviness**: High
- **Goals**:
  - Discover trending Korean content for adaptation
  - Evaluate IP rights availability
  - Compare similar titles across genres
  - Download pitch decks for stakeholder review

**Pain Points**:
- Too many titles to manually review
- Unclear rights ownership status
- Language barrier (Korean content metadata)
- Time-consuming discovery process

**User Journey**:
1. Sign up → Email verification → Tier selection
2. Browse featured titles on home page
3. Use AI chatbot: "Show me action thriller webtoons"
4. Review recommended titles with pitch decks
5. Save favorites for team review
6. Contact creator for rights discussion

### 3.2 Persona 2: Content Creator (Secondary User)

**Profile**:
- **Name**: Kim Min-jae (김민재)
- **Role**: Webtoon artist & IP owner
- **Age**: 25-40
- **Location**: Seoul, South Korea
- **Tech Savviness**: Medium
- **Goals**:
  - Showcase work to global buyers
  - Manage title listings and metadata
  - Track interest from potential buyers
  - Maintain control over rights information

**Pain Points**:
- Limited exposure to international buyers
- Complex rights negotiation process
- Difficult to update content information
- Uncertain buyer interest/engagement

**User Journey**:
1. Sign up → Email verification → Creator onboarding
2. Add new title with metadata (Korean + English)
3. Upload pitch deck and images
4. View buyer engagement metrics
5. Receive buyer contact requests
6. Update rights availability status

---

## 4. CORE FEATURES

### 4.1 Feature Matrix

| Feature | Buyers | Creators | Admin | Priority |
|---------|--------|----------|-------|----------|
| **Authentication** |
| Email/Password Signup | ✓ | ✓ | ✓ | P0 |
| OAuth (Google, Kakao) | ✓ | ✓ | ✗ | P0 |
| Password Reset | ✓ | ✓ | ✓ | P1 |
| Email Verification | ✓ | ✓ | ✓ | P0 |
| **Content Discovery** |
| Browse Titles | ✓ | ✓ | ✓ | P0 |
| Search (Text) | ✓ | ✓ | ✓ | P0 |
| Search (Vector/AI) | ✓ (Pro+) | ✗ | ✓ | P1 |
| Filter by Genre | ✓ | ✓ | ✓ | P0 |
| Filter by Rights Status | ✓ | ✗ | ✓ | P1 |
| Sort (Title, Date, Views) | ✓ | ✓ | ✓ | P0 |
| **Title Management** |
| View Title Details | ✓ | ✓ | ✓ | P0 |
| Add New Title | ✗ | ✓ | ✓ | P0 |
| Edit Title | ✗ | ✓ (own) | ✓ | P0 |
| Delete Title | ✗ | ✓ (own) | ✓ | P1 |
| Upload Pitch Deck | ✗ | ✓ | ✓ | P1 |
| **Interaction** |
| Favorite Titles | ✓ | ✗ | ✓ | P1 |
| Send Message to Creator | ✓ | ✗ | ✓ | P1 |
| View Buyer Interest | ✗ | ✓ | ✓ | P2 |
| **AI Features** |
| AI Chatbot (Basic) | ✓ | ✗ | ✓ | P1 |
| AI Chatbot (Enhanced) | ✓ (Pro+) | ✗ | ✓ | P1 |
| Semantic Search | ✓ (Pro+) | ✗ | ✓ | P2 |
| Smart Recommendations | ✓ (Pro+) | ✗ | ✓ | P2 |
| **Account Management** |
| Profile Editing | ✓ | ✓ | ✓ | P1 |
| Tier Upgrade | ✓ | ✗ | ✗ | P1 |
| Subscription Management | ✓ | ✗ | ✗ | P1 |
| Usage Analytics | ✓ | ✓ | ✓ | P2 |

### 4.2 Feature Descriptions

#### 4.2.1 Authentication System

**Email/Password Signup**:
- Account type selection (Buyer vs. Creator)
- Form validation with real-time feedback
- Duplicate email detection
- Secure password requirements (8+ chars, mixed case, numbers)
- Automatic profile creation in respective tables

**OAuth Integration**:
- Google OAuth 2.0
- Kakao OAuth (Korean users)
- Account type metadata storage
- Automatic profile creation via edge functions
- Session management with JWT tokens

**Email Verification**:
- Verification email sent on signup
- Clickable verification link
- Account activation upon verification
- Welcome email post-verification

#### 4.2.2 Content Discovery

**Title Browsing**:
- **List View**: Card-based grid layout (3-4 columns)
- **Infinite Scroll**: Load 12 titles initially, fetch more on scroll (buyers)
- **Pagination**: Traditional page navigation (creators)
- **Featured Carousel**: Highlight 5-10 premium titles on home page

**Search System**:
- **Text Search** (All users):
  - Real-time search as you type
  - Multi-field search (title, synopsis, genre, author)
  - Fuzzy matching for typos
  - Search suggestions based on query

- **Vector Search** (Pro tier+):
  - Semantic similarity matching
  - Natural language queries ("romantic comedy with strong female lead")
  - OpenAI embeddings (text-embedding-ada-002)
  - PostgreSQL pgvector extension
  - Similarity threshold: 0.55-0.70

**Filtering**:
- Genre: Multi-select checkbox (Romance, Action, Comedy, etc.)
- Content Format: Webtoon, Manhwa, Novel, etc.
- Completion Status: Completed vs. Ongoing
- Pitch Deck: Titles with pitch decks only (premium indicator)
- Rights Status: Available, Under Negotiation, Sold

**Sorting**:
- Title (A-Z, Z-A)
- Date Added (Newest first, Oldest first)
- Views (Most viewed, Least viewed)
- Likes (Most liked)
- Rating (Highest rated)

#### 4.2.3 AI Chatbot

**Two Modes**:

1. **Standard Mode** (All buyers):
   - Text-based search only
   - Database keyword matching
   - Fast response (< 1 second)
   - No LLM usage (cost-free)

2. **Enhanced Mode** (Pro/Suite tiers):
   - GPT-4-turbo-preview conversational AI
   - Vector search integration
   - Personalized recommendations
   - Streaming responses
   - Follow-up suggestions
   - Session-based conversation history

**Chat Interface**:
- Full-page chat layout
- Message bubbles (user vs. AI)
- Title cards embedded in responses (clickable)
- Suggested query chips
- Feedback system (helpful/not helpful per message)
- Mode toggle switch

**Chat Features**:
- Natural language understanding
- Multi-turn conversations (maintain context)
- Title recommendations with explanations
- Genre exploration
- Similar title suggestions
- Cultural context explanations

#### 4.2.4 Title Management (Creators)

**Add New Title**:
- Multi-step form with validation
- Required fields:
  - Title (Korean + English)
  - Synopsis
  - Genre (multi-select)
  - Content format
  - Author information
- Optional fields:
  - Tagline
  - Tone
  - Perfect for (audience description)
  - Comparable titles (comps)
  - Pitch deck upload
  - Cover image upload
  - Rights information

**Edit Title**:
- Same form as Add, pre-populated
- Real-time validation
- Autosave drafts
- Change history tracking

**Upload Assets**:
- Pitch deck: PDF file (max 10MB)
- Cover image: JPG/PNG (max 5MB)
- Automatic image optimization
- Secure file storage (Supabase Storage)

#### 4.2.5 Favorites System (Buyers)

**Save Favorites**:
- Heart icon on title cards
- One-click save/unsave
- Toast notification confirmation
- Synced across devices

**Favorites Page**:
- Dedicated "/buyers/favorites" route
- Same layout as title browsing
- Filter and sort capabilities
- Bulk actions (remove multiple)
- Export to CSV

#### 4.2.6 Tier System

**Access Levels**:

1. **Basic** (Free):
   - Browse public titles
   - View basic metadata
   - Text search only
   - Limited title views (100/month)

2. **Invited** (Legacy):
   - Restricted access
   - Special early-access users
   - Deprecated in favor of Basic

3. **Pro** ($99/month):
   - Full content access
   - View premium titles
   - Access pitch decks
   - AI chatbot (enhanced mode)
   - Vector search
   - Unlimited views

4. **Suite** ($299/month):
   - All Pro features
   - Priority support
   - Early access to new titles
   - Bulk export capabilities
   - Custom reports
   - Dedicated account manager

**Tier Enforcement**:
- `TierGatedContent` component wrapper
- Checks user tier on mount
- Displays upgrade prompt for locked content
- `useTierAccess()` hook for programmatic checks
- Centralized tier management via React Context

---

## 5. TECHNICAL ARCHITECTURE

### 5.1 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ React 18 + TypeScript + Vite                               │ │
│  │ - React Router v6 (client-side routing)                    │ │
│  │ - TanStack Query (server state management)                 │ │
│  │ - React Context (global state: auth, cache, tier)          │ │
│  │ - Shadcn/UI + Radix UI + Tailwind CSS                      │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         BACKEND LAYER                            │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Supabase                                                    │ │
│  │ - PostgreSQL 15 (primary database)                         │ │
│  │ - pgvector extension (vector embeddings)                   │ │
│  │ - Row Level Security (RLS) policies                        │ │
│  │ - Auth (JWT-based authentication)                          │ │
│  │ - Edge Functions (Deno runtime)                            │ │
│  │ - Storage (file uploads: pitch decks, images)              │ │
│  │ - Realtime (subscriptions for live updates)                │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ API Calls
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      EXTERNAL SERVICES                           │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ OpenAI API                                                  │ │
│  │ - GPT-4-turbo-preview (chatbot completions)                │ │
│  │ - GPT-4o-mini (cost-effective completions)                 │ │
│  │ - text-embedding-ada-002 (vector embeddings)               │ │
│  └────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Stripe API                                                  │ │
│  │ - Subscription management                                   │ │
│  │ - Payment processing                                        │ │
│  │ - Webhook handling (subscription events)                    │ │
│  └────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Resend API (Email Service)                                  │ │
│  │ - Welcome emails                                            │ │
│  │ - Verification emails                                       │ │
│  │ - Transactional emails                                      │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Technology Stack

#### Frontend

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| **Core** |
| Framework | React | 18.3.1 | UI library |
| Language | TypeScript | 5.5.3 | Type safety |
| Build Tool | Vite | 5.4.1 | Fast bundling & dev server |
| Compiler | SWC | 3.5.0 | Fast TypeScript compilation |
| **Routing & State** |
| Routing | React Router | 6.26.2 | Client-side routing |
| Server State | TanStack Query | 5.56.2 | API data caching & sync |
| Global State | React Context | Built-in | Auth, cache, tier state |
| **UI Components** |
| Component Library | Shadcn/UI | 0.1.0 (custom) | Pre-built components |
| Primitives | Radix UI | 1.x | Accessible components |
| Styling | Tailwind CSS | 3.4.11 | Utility-first CSS |
| Icons | Lucide React | 0.462.0 | Icon library |
| **Forms & Validation** |
| Forms | React Hook Form | 7.53.0 | Form management |
| Validation | Zod | 3.23.8 | Schema validation |
| **Backend Integration** |
| Backend | Supabase JS | 2.52.1 | Database & Auth client |
| **AI/ML** |
| LLM | OpenAI SDK | 4.104.0 | GPT-4 integration |
| **Payments** |
| Payments | Stripe JS | 7.8.0 | Payment processing |

#### Backend (Supabase)

| Service | Technology | Purpose |
|---------|-----------|---------|
| Database | PostgreSQL 15 | Primary data store |
| Vector Search | pgvector | Semantic search embeddings |
| Authentication | Supabase Auth | JWT-based auth |
| Edge Functions | Deno | Serverless API endpoints |
| Storage | Supabase Storage | File uploads (S3-compatible) |
| Realtime | Supabase Realtime | WebSocket subscriptions |

#### Development Tools

| Tool | Purpose |
|------|---------|
| ESLint | Linting |
| Prettier | Code formatting (implicit) |
| Vitest | Unit testing |
| TypeScript ESLint | TypeScript linting |
| PostCSS | CSS processing |
| Autoprefixer | CSS vendor prefixing |

### 5.3 Project Structure

```
apps/dashboard/
├── public/                        # Static assets
├── src/
│   ├── components/                # React components
│   │   ├── ui/                   # Shadcn/UI components (auto-generated)
│   │   ├── auth/                 # Authentication components
│   │   ├── dashboard/            # Dashboard-specific components
│   │   └── layout/               # Layout components
│   │       ├── CMSLayout.tsx     # Main authenticated layout
│   │       ├── CMSHeader.tsx     # Header with nav
│   │       ├── CMSSidebar.tsx    # Sidebar navigation
│   │       └── PageContainer.tsx # Standardized page wrapper
│   ├── pages/                    # Route pages
│   │   ├── BuyerHome.tsx         # Buyer dashboard
│   │   ├── CreatorHome.tsx       # Creator dashboard
│   │   ├── TitleList.tsx         # Browse titles
│   │   ├── TitleDetail.tsx       # Title detail page
│   │   ├── Chat.tsx              # AI chatbot
│   │   ├── Favorites.tsx         # Saved favorites
│   │   ├── Profile.tsx           # User profile
│   │   ├── BuyersPricing.tsx     # Tier pricing page
│   │   ├── SigninPage.tsx        # Sign in
│   │   ├── BuyerSignupPage.tsx   # Buyer signup
│   │   ├── CreatorSignupPage.tsx # Creator signup
│   │   └── ...                   # Other pages
│   ├── hooks/                    # Custom React hooks
│   │   ├── useAuth.tsx           # Authentication hook
│   │   ├── useSessionCache.tsx   # Session-based caching
│   │   ├── useTierAccess.tsx     # Tier checking hook
│   │   └── ...
│   ├── contexts/                 # React Context providers
│   │   ├── TierContext.tsx       # Tier management
│   │   └── DataCacheContext.tsx  # Data caching
│   ├── services/                 # API service layers
│   │   ├── titlesService.ts      # Titles CRUD operations
│   │   ├── openaiService.ts      # OpenAI integration
│   │   ├── vectorSearchService.ts # Vector search
│   │   ├── embeddingService.ts   # Embedding generation
│   │   ├── chatbotService.ts     # Chatbot logic
│   │   ├── emailService.ts       # Email sending
│   │   └── ...
│   ├── utils/                    # Utility functions
│   │   ├── searchUtils.ts        # Search helpers
│   │   ├── analytics.ts          # Google Analytics
│   │   ├── slack.ts              # Slack notifications
│   │   └── ...
│   ├── integrations/             # Third-party integrations
│   │   └── supabase/
│   │       ├── client.ts         # Supabase client
│   │       ├── types.ts          # Database types (auto-generated)
│   │       └── serviceClient.ts  # Admin client
│   ├── styles/                   # Global styles
│   │   ├── globals.css           # Global CSS
│   │   └── layout-variables.css  # Centralized padding system
│   ├── App.tsx                   # Root component with routes
│   └── main.tsx                  # Entry point
├── supabase/                     # Supabase configuration
│   ├── functions/                # Edge functions
│   │   └── chat-orchestrator/    # AI chatbot orchestrator
│   └── migrations/               # Database migrations
├── package.json                  # Dependencies
├── vite.config.ts                # Vite configuration
├── tsconfig.json                 # TypeScript configuration
├── tailwind.config.js            # Tailwind CSS config
└── .env.local                    # Environment variables (gitignored)
```

### 5.4 Data Flow

#### Authentication Flow

```
User Action → SignupForm Component
  │
  ├─→ Validation (React Hook Form + Zod)
  │
  ├─→ Supabase Auth API (signUp)
  │   │
  │   ├─→ Create auth.users record
  │   │
  │   └─→ Store metadata (account_type, full_name, etc.)
  │
  ├─→ Edge Function (create-buyer-profile / create-creator-profile)
  │   │
  │   └─→ Insert into user_buyers or user_creators table
  │
  ├─→ Send Verification Email (Resend API)
  │
  └─→ Redirect to Dashboard (after email verification)
```

#### Content Discovery Flow

```
User searches "romantic comedy webtoons"
  │
  ├─→ TitleList Component
  │   │
  │   ├─→ Check user tier (useTierAccess hook)
  │   │
  │   ├─→ IF Pro tier:
  │   │   └─→ vectorSearchService.vectorSearch()
  │   │       ├─→ Generate embedding (OpenAI API)
  │   │       ├─→ Query pgvector (Supabase RPC)
  │   │       └─→ Return top 8 similar titles
  │   │
  │   └─→ IF Basic tier:
  │       └─→ enhancedSearch() (text-based)
  │           ├─→ Filter titles by keywords
  │           ├─→ Score by relevance
  │           └─→ Return top 20 results
  │
  └─→ Display Results
      ├─→ Title cards with metadata
      ├─→ Apply tier-based content gating
      └─→ Show upgrade prompts for locked content
```

#### AI Chatbot Flow

```
User: "Show me action thriller webtoons"
  │
  ├─→ Chat Component (Chat.tsx)
  │   │
  │   ├─→ Check chatbot mode (Standard vs. Enhanced)
  │   │
  │   ├─→ IF Enhanced Mode (Pro tier):
  │   │   │
  │   │   └─→ chatOrchestratorService (Supabase Edge Function)
  │   │       │
  │   │       ├─→ 1. Get user profile & conversation history
  │   │       │
  │   │       ├─→ 2. Perform vector search for relevant titles
  │   │       │
  │   │       ├─→ 3. Build master prompt with context
  │   │       │
  │   │       ├─→ 4. Call OpenAI GPT-4-turbo-preview API
  │   │       │   ├─→ Stream: true (SSE)
  │   │       │   └─→ Max tokens: 1000
  │   │       │
  │   │       ├─→ 5. Stream response chunks to client
  │   │       │
  │   │       └─→ 6. Save conversation to chat_messages table
  │   │
  │   └─→ IF Standard Mode (Basic tier):
  │       │
  │       └─→ chatbotService.searchTitles()
  │           ├─→ Text-based keyword search
  │           ├─→ Score and rank results
  │           └─→ Return formatted response (no LLM)
  │
  └─→ Display AI Response
      ├─→ Stream message (if Enhanced)
      ├─→ Show title cards
      ├─→ Provide suggested queries
      └─→ Save feedback (helpful/not helpful)
```

---

## 6. USER FLOWS

### 6.1 Buyer Onboarding Flow

```
1. Landing Page (Website)
   ↓
2. Click "Sign Up" → Redirect to dashboard.kstorybridge.com/signup/buyer
   ↓
3. Buyer Signup Form
   - Full Name
   - Email
   - Password
   - Company (optional)
   - Role (dropdown: Producer, Executive, Agent, Content Scout, Other)
   - LinkedIn URL (optional)
   ↓
4. Submit Form
   - Validation checks
   - Email uniqueness check
   - Create auth.users record
   - Create user_buyers record (tier: 'basic')
   - Send verification email
   ↓
5. Check Email → Click verification link
   ↓
6. Redirect to /buyers/home (logged in)
   - Show welcome tour (first-time users)
   - Display featured titles carousel
   - Prompt: "Try our AI chatbot to discover titles"
```

### 6.2 Content Discovery Flow (Buyer)

```
1. Navigate to /buyers/titles
   ↓
2. Browse Titles (Initial View)
   - Featured carousel (5-10 titles)
   - Infinite scroll list (12 titles per load)
   - Filter panel (collapsed by default)
   ↓
3. User Actions:
   │
   ├─→ A. Search
   │   - Type query in search bar
   │   - Real-time search suggestions
   │   - IF Pro tier: Use vector search
   │   - IF Basic tier: Use text search
   │   - Display results with relevance scores
   │
   ├─→ B. Filter
   │   - Open filter panel
   │   - Select genres (multi-select)
   │   - Select content format
   │   - Toggle "Has Pitch Deck" (Pro tier only)
   │   - Apply filters → Refresh results
   │
   ├─→ C. Sort
   │   - Click sort dropdown
   │   - Options: Title (A-Z), Date (Newest), Views (Most), Rating
   │   - Apply sort → Re-order results
   │
   └─→ D. View Title Detail
       - Click title card
       - Navigate to /buyers/titles/:titleId
       - View full metadata
       - IF Pro tier: Download pitch deck
       - IF Basic tier: Show upgrade prompt for pitch deck
```

### 6.3 AI Chatbot Flow (Buyer - Pro Tier)

```
1. Navigate to /buyers/chat
   ↓
2. Chatbot Interface Loads
   - Display welcome message: "Hey there! 👋 I'm Jinu..."
   - Show mode toggle: [Standard ⟷ Enhanced]
   - Ensure Enhanced mode is selected (Pro tier)
   ↓
3. User Types Query: "I need a romantic comedy webtoon with a strong female lead"
   ↓
4. Submit Message (Enter key)
   ↓
5. Backend Processing (Supabase Edge Function)
   - Extract user profile (tier, name, email)
   - Load conversation history (last 10 messages)
   - Perform vector search:
     * Generate embedding for query
     * Search pgvector (threshold: 0.65, limit: 8)
     * Return top matching titles
   - Build master prompt:
     * User profile context
     * Conversation history
     * Search results with metadata
     * Query
   - Call OpenAI GPT-4-turbo-preview:
     * Model: gpt-4-turbo-preview
     * Streaming: true
     * Max tokens: 1000
     * Temperature: 0.7
   ↓
6. Stream Response to Client (SSE)
   - Display typing indicator
   - Stream text chunks as they arrive
   - Parse and embed title cards
   - Show final message with:
     * AI response text
     * 2-3 recommended title cards (clickable)
     * Suggested follow-up queries
   ↓
7. User Interactions:
   │
   ├─→ A. Click Title Card
   │   - Navigate to /buyers/titles/:titleId
   │
   ├─→ B. Click Suggested Query
   │   - Auto-fill search input
   │   - Submit new query
   │
   ├─→ C. Provide Feedback
   │   - Click 👍 (helpful) or 👎 (not helpful)
   │   - Save feedback to database
   │
   └─→ D. Continue Conversation
       - Type follow-up question
       - Maintain conversation context
```

### 6.4 Creator Title Management Flow

```
1. Navigate to /creators/titles
   ↓
2. View My Titles (List)
   - Show only titles created by this user
   - Display title cards with edit/delete buttons
   ↓
3. Click "Add New Title" Button
   ↓
4. Navigate to /creators/titles/add
   ↓
5. Title Creation Form (Multi-step)

   Step 1: Basic Information
   - Title (Korean)*
   - Title (English)*
   - Synopsis*
   - Tagline
   - Content Format* (Webtoon, Manhwa, Novel, etc.)
   - Genre* (multi-select: Romance, Action, Comedy, etc.)

   Step 2: Author Information
   - Story Author (Korean)
   - Story Author (English)
   - Art Author (Korean)
   - Art Author (English)
   - Rights Owner

   Step 3: Additional Details
   - Tone (Light-hearted, Intense, etc.)
   - Audience (Young Adult, Adult, etc.)
   - Perfect For (text description)
   - Comparable Titles (comps) (comma-separated)
   - Chapters (number)
   - Completion Status (Completed / Ongoing)

   Step 4: Assets
   - Upload Cover Image (JPG/PNG, max 5MB)
   - Upload Pitch Deck (PDF, max 10MB)
   - External URL (webtoon platform link)

   Step 5: Review & Submit
   - Preview all entered data
   - Validation errors displayed
   - Click "Publish Title"
   ↓
6. Backend Processing
   - Insert into titles table
   - Set creator_id to current user
   - Upload files to Supabase Storage
   - Generate embeddings (async background job)
   ↓
7. Success Confirmation
   - Show success toast: "Title published successfully!"
   - Redirect to /creators/titles
   - New title appears in list
```

### 6.5 Tier Upgrade Flow (Buyer)

```
1. Trigger Upgrade Prompt
   │
   ├─→ A. Click on Locked Content
   │   - Try to view pitch deck (Basic tier)
   │   - Modal appears: "Upgrade to Pro to access pitch decks"
   │
   ├─→ B. Try Enhanced AI Chatbot
   │   - Toggle to Enhanced mode (Basic tier)
   │   - Banner appears: "Enhanced AI chatbot is available for Pro users"
   │
   └─→ C. Navigate to /buyers/plan
       - Click "Upgrade" in sidebar
   ↓
2. Pricing Page Display
   - Compare tiers:
     * Basic (Free): Limited features
     * Pro ($99/month): Full content access, AI chatbot
     * Suite ($299/month): All features + priority support
   - Highlight Pro tier (recommended)
   ↓
3. Click "Upgrade to Pro" Button
   ↓
4. Redirect to Stripe Checkout
   - Pre-filled customer information
   - Payment method entry (card, Apple Pay, Google Pay)
   - Billing frequency: Monthly (default) / Yearly (discount)
   ↓
5. Complete Payment
   ↓
6. Stripe Webhook → Update Database
   - Receive subscription.created event
   - Update user_buyers.tier = 'pro'
   ↓
7. Redirect to /payment/success
   - Show success message
   - Link to return to dashboard
   ↓
8. Dashboard Updates
   - Tier badge changes to "Pro"
   - Locked content now accessible
   - Enhanced chatbot enabled
```

---

## 7. DATABASE SCHEMA

### 7.1 Core Tables

#### auth.users (Supabase Auth - Built-in)
```sql
-- Managed by Supabase Auth
-- Fields used:
- id (uuid, PK)
- email (text, unique)
- encrypted_password (text)
- email_confirmed_at (timestamp)
- created_at (timestamp)
- updated_at (timestamp)
- user_metadata (jsonb) -- Stores account_type, full_name, etc.
```

#### user_buyers
```sql
CREATE TABLE public.user_buyers (
  id uuid NOT NULL PRIMARY KEY,              -- FK to auth.users(id)
  email text NOT NULL UNIQUE,
  full_name text NOT NULL,
  buyer_company text,
  buyer_role text CHECK (buyer_role IN (
    'producer', 'executive', 'agent', 'content_scout', 'other'
  )),
  linkedin_url text,
  tier text NOT NULL DEFAULT 'basic' CHECK (tier IN (
    'basic', 'invited', 'pro', 'suite'
  )),
  requested boolean NOT NULL DEFAULT false,  -- Premium access request flag
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_buyers_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX idx_user_buyers_email ON user_buyers(email);
CREATE INDEX idx_user_buyers_tier ON user_buyers(tier);
```

**Field Descriptions**:
- `tier`: Access level (basic < invited < pro < suite)
- `requested`: User has requested tier upgrade (used for sales tracking)
- `buyer_role`: User's role in their organization

#### user_creators
```sql
CREATE TABLE public.user_creators (
  id uuid NOT NULL PRIMARY KEY,              -- FK to auth.users(id)
  email text NOT NULL UNIQUE,
  full_name text NOT NULL,
  pen_name text,                              -- Creator's pen name or studio name
  ip_owner_role text CHECK (ip_owner_role IN (
    'individual', 'studio', 'agent', 'publisher'
  )),
  ip_owner_company text,
  website_url text,
  invitation_status text NOT NULL DEFAULT 'invited' CHECK (invitation_status IN (
    'invited', 'accepted'
  )),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_creators_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX idx_user_creators_email ON user_creators(email);
```

**Field Descriptions**:
- `pen_name`: CRITICAL - Always use this field for creator profiles (not legacy names)
- `invitation_status`: Creator onboarding status

#### titles (Main Content Table)
```sql
CREATE TABLE public.titles (
  title_id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic Information
  title_name_kr text,
  title_name_en text,
  synopsis text,
  tagline text,
  note text,                                  -- Internal notes

  -- Author Information
  story_author text,                          -- Story writer (English)
  story_author_kr text,                       -- Story writer (Korean)
  art_author text,                            -- Artist (English)
  art_author_kr text,                         -- Artist (Korean)
  original_author text,                       -- Original source author
  original_author_kr text,

  -- Rights & Ownership
  rights text,                                -- Rights status description
  cp text,                                    -- Content provider
  creator_id uuid NOT NULL,                   -- FK to auth.users (creator)

  -- Content Classification
  genre text[],                               -- Array: ['Romance', 'Comedy', 'Action']
  genre_kr text[],                            -- Korean genre names
  content_format text,                        -- 'Webtoon', 'Manhwa', 'Novel', etc.
  tags text[],                                -- Freeform tags
  keywords text[],                            -- SEO keywords
  tone text,                                  -- 'Light-hearted', 'Intense', etc.
  audience text,                              -- Target audience
  age_rating text,                            -- Age rating

  -- Content Status
  completed boolean,                          -- Is series complete?
  chapters numeric,                           -- Total chapters

  -- Media Assets
  title_image text,                           -- Cover image URL
  title_url text,                             -- External platform URL
  pitch text,                                 -- Pitch deck URL (Supabase Storage)

  -- Metrics
  views bigint DEFAULT 0,
  likes bigint DEFAULT 0,
  rating numeric,                             -- Average rating (0-5)
  rating_count bigint DEFAULT 0,

  -- Marketing
  perfect_for text,                           -- "Perfect for fans of X"
  comps text[],                               -- Comparable titles

  -- Vector Embeddings (1536 dimensions each)
  title_embedding vector(1536),               -- Title name embedding
  synopsis_embedding vector(1536),            -- Synopsis embedding
  content_embedding vector(1536),             -- Combined content embedding
  combined_embedding vector(1536),            -- Master embedding (used for search)
  embedding_model text DEFAULT 'text-embedding-ada-002',
  embedding_created_at timestamptz,
  embedding_updated_at timestamptz,

  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT titles_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES auth.users(id)
);

-- Indexes for performance
CREATE INDEX idx_titles_creator_id ON titles(creator_id);
CREATE INDEX idx_titles_genre ON titles USING GIN(genre);
CREATE INDEX idx_titles_content_format ON titles(content_format);
CREATE INDEX idx_titles_completed ON titles(completed);

-- Vector search index (HNSW for fast approximate search)
CREATE INDEX idx_titles_combined_embedding ON titles
USING hnsw (combined_embedding vector_cosine_ops);
```

#### user_favorites
```sql
CREATE TABLE public.user_favorites (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,                      -- FK to auth.users (buyer)
  title_id uuid NOT NULL,                     -- FK to titles
  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT user_favorites_user_id_fkey FOREIGN KEY (user_id)
    REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT user_favorites_title_id_fkey FOREIGN KEY (title_id)
    REFERENCES titles(title_id) ON DELETE CASCADE,
  CONSTRAINT user_favorites_unique UNIQUE (user_id, title_id)
);

CREATE INDEX idx_user_favorites_user_id ON user_favorites(user_id);
CREATE INDEX idx_user_favorites_title_id ON user_favorites(title_id);
```

### 7.2 AI Chatbot Tables

#### chat_sessions
```sql
CREATE TABLE public.chat_sessions (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,                      -- FK to auth.users
  user_email text NOT NULL,
  session_type text NOT NULL CHECK (session_type IN ('openai', 'traditional')),
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,                       -- NULL = active session
  messages jsonb DEFAULT '[]'::jsonb,         -- Conversation history

  CONSTRAINT chat_sessions_user_id_fkey FOREIGN KEY (user_id)
    REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX idx_chat_sessions_started_at ON chat_sessions(started_at DESC);
```

#### chat_messages
```sql
CREATE TABLE public.chat_messages (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL,                   -- FK to chat_sessions
  user_id uuid NOT NULL,                      -- FK to auth.users
  message_type text NOT NULL CHECK (message_type IN ('user_prompt', 'ai_response')),
  content text NOT NULL,
  tokens_used integer,                        -- OpenAI tokens consumed
  response_time_ms integer,                   -- Response generation time
  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT chat_messages_session_id_fkey FOREIGN KEY (session_id)
    REFERENCES chat_sessions(id) ON DELETE CASCADE,
  CONSTRAINT chat_messages_user_id_fkey FOREIGN KEY (user_id)
    REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at DESC);
```

#### chat_title_recommendations
```sql
CREATE TABLE public.chat_title_recommendations (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL,                   -- FK to chat_messages (AI response)
  session_id uuid NOT NULL,                   -- FK to chat_sessions
  title_id uuid NOT NULL,                     -- FK to titles
  title_name_en text,                         -- Cached for performance
  title_name_kr text,
  recommendation_score numeric,               -- Similarity score (0-1)
  recommendation_reason text,                 -- Why this was recommended
  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT chat_title_recommendations_message_id_fkey FOREIGN KEY (message_id)
    REFERENCES chat_messages(id) ON DELETE CASCADE,
  CONSTRAINT chat_title_recommendations_session_id_fkey FOREIGN KEY (session_id)
    REFERENCES chat_sessions(id) ON DELETE CASCADE,
  CONSTRAINT chat_title_recommendations_title_id_fkey FOREIGN KEY (title_id)
    REFERENCES titles(title_id) ON DELETE CASCADE
);

CREATE INDEX idx_chat_title_recommendations_session_id ON chat_title_recommendations(session_id);
CREATE INDEX idx_chat_title_recommendations_title_id ON chat_title_recommendations(title_id);
```

### 7.3 Analytics Tables

#### vector_search_analytics
```sql
CREATE TABLE public.vector_search_analytics (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  session_id uuid,
  query text NOT NULL,
  search_type text NOT NULL CHECK (search_type IN ('vector_only', 'hybrid', 'text_only')),
  result_count integer,
  search_duration_ms integer,
  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT vector_search_analytics_user_id_fkey FOREIGN KEY (user_id)
    REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX idx_vector_search_analytics_user_id ON vector_search_analytics(user_id);
CREATE INDEX idx_vector_search_analytics_created_at ON vector_search_analytics(created_at DESC);
```

### 7.4 Database Functions

#### match_titles_by_embedding (Vector Search)
```sql
CREATE OR REPLACE FUNCTION match_titles_by_embedding(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.65,
  match_count int DEFAULT 8
)
RETURNS TABLE (
  title_id uuid,
  title_name_en text,
  title_name_kr text,
  synopsis text,
  genre text[],
  tone text,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    t.title_id,
    t.title_name_en,
    t.title_name_kr,
    t.synopsis,
    t.genre,
    t.tone,
    1 - (t.combined_embedding <=> query_embedding) AS similarity
  FROM titles t
  WHERE t.combined_embedding IS NOT NULL
    AND 1 - (t.combined_embedding <=> query_embedding) > match_threshold
  ORDER BY t.combined_embedding <=> query_embedding
  LIMIT match_count;
$$;
```

---

## 8. API & SERVICES

### 8.1 Service Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend Services                        │
│  (TypeScript classes in src/services/)                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  titlesService          - Title CRUD operations             │
│  openaiService          - OpenAI GPT-4 integration          │
│  vectorSearchService    - Semantic search                   │
│  embeddingService       - Generate embeddings               │
│  chatbotService         - Chatbot logic                     │
│  chatHistoryService     - Chat persistence                  │
│  emailService           - Email sending (Resend)            │
│  favoritesService       - Favorites management              │
│  requestsService        - Buyer-Creator requests            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ Supabase Client
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Supabase Backend                        │
│  (PostgreSQL + Edge Functions + Storage)                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Edge Functions (Deno):                                     │
│  - chat-orchestrator       - AI chatbot orchestration       │
│  - create-buyer-profile    - Buyer profile creation         │
│  - create-creator-profile  - Creator profile creation       │
│  - send-welcome-email      - Welcome email sender           │
│                                                              │
│  Database Functions:                                         │
│  - match_titles_by_embedding - Vector similarity search     │
│  - hybrid_search_titles      - Hybrid search (text+vector)  │
│  - get_conversation_with_titles - Chat history retrieval    │
│                                                              │
│  Row Level Security (RLS):                                  │
│  - user_buyers: Users can read/update own profile          │
│  - user_creators: Users can read/update own profile        │
│  - titles: Creators can CRUD own titles, buyers can read   │
│  - user_favorites: Users can CRUD own favorites            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 8.2 Key Service APIs

#### titlesService.ts

```typescript
class TitlesService {
  // Get all titles (cached)
  async getAllTitles(): Promise<Title[]>

  // Get titles by IDs (batch operation)
  async getTitlesByIds(titleIds: string[]): Promise<Title[]>

  // Get single title by ID
  async getTitleById(titleId: string): Promise<Title | null>

  // Get titles for specific creator
  async getTitlesByCreator(creatorId: string): Promise<Title[]>

  // Search titles (text-based)
  async searchTitles(query: string, options?: SearchOptions): Promise<Title[]>

  // Create new title (creators only)
  async createTitle(title: CreateTitleInput): Promise<Title>

  // Update title (creators only, own titles)
  async updateTitle(titleId: string, updates: UpdateTitleInput): Promise<Title>

  // Delete title (creators only, own titles)
  async deleteTitle(titleId: string): Promise<boolean>

  // Get featured titles
  async getFeaturedTitles(): Promise<Title[]>
}
```

#### vectorSearchService.ts

```typescript
class VectorSearchService {
  // Pure vector similarity search
  async vectorSearch(
    query: string,
    context?: SearchContext,
    options?: { threshold?: number; limit?: number; }
  ): Promise<VectorSearchResult[]>

  // Hybrid search (vector + text)
  async hybridSearch(
    query: string,
    context?: SearchContext,
    options?: { textWeight?: number; vectorWeight?: number; }
  ): Promise<HybridSearchResult[]>

  // Find similar titles to a given title
  async findSimilarTitles(
    titleId: string,
    options?: { limit?: number; threshold?: number; }
  ): Promise<VectorSearchResult[]>

  // Get search status and capabilities
  async getSearchStatus(): Promise<{
    vector_search_enabled: boolean;
    total_indexed_titles: number;
    embedding_model: string;
  }>
}
```

#### openaiService.ts

```typescript
class OpenAIService {
  // Generate chat response with title recommendations
  async generateChatResponse(
    userQuery: string,
    conversationHistory?: string[],
    userId?: string,
    sessionId?: string
  ): Promise<LLMChatResponse>

  // Test OpenAI connection
  async testConnection(): Promise<boolean>

  // Get usage information
  getUsageInfo(): { configured: boolean; model: string; }
}

interface LLMChatResponse {
  message: string;                      // AI-generated response
  recommendedTitles: Title[];           // Recommended titles
  suggestedQueries?: string[];          // Follow-up suggestions
  vectorSearchUsed?: boolean;           // Did we use vector search?
}
```

#### embeddingService.ts

```typescript
class EmbeddingService {
  // Generate embedding for a single text
  async generateEmbedding(text: string): Promise<EmbeddingResult | null>

  // Generate multiple embeddings for a title
  async generateTitleEmbeddings(title: Title): Promise<ContentEmbeddings>

  // Store embeddings in database
  async storeTitleEmbeddings(titleId: string, embeddings: ContentEmbeddings): Promise<boolean>

  // Batch process multiple titles
  async processTitlesBatch(titleIds: string[]): Promise<{
    processed: number;
    failed: number;
    errors: string[];
  }>
}
```

### 8.3 Supabase Edge Functions

#### chat-orchestrator (Main AI Chatbot Backend)

**Location**: `supabase/functions/chat-orchestrator/index.ts`

**Purpose**: Orchestrate AI chatbot responses with full context

**Flow**:
1. Authenticate user (JWT token)
2. Get user profile (tier, name, email)
3. Get or create active chat session
4. Load conversation history (last 10 messages)
5. Perform vector search for relevant titles
6. Build master prompt with all context
7. Call OpenAI GPT-4-turbo-preview (streaming)
8. Stream response chunks to client (SSE)
9. Save complete response to database
10. Record title recommendations

**Request**:
```typescript
POST /functions/v1/chat-orchestrator
Headers:
  Authorization: Bearer <jwt_token>
  Content-Type: application/json

Body:
{
  "messages": [
    { "role": "user", "content": "Show me romantic comedy webtoons" }
  ],
  "sessionId": "optional-session-id"
}
```

**Response** (Server-Sent Events):
```
data: {"text":"Great"}

data: {"text":" choice!"}

data: {"text":" I found"}

data: [DONE]
```

---

## 9. UI/UX REQUIREMENTS

### 9.1 Design System

#### Color Palette

```css
/* Primary Colors */
--hanok-teal: #0EA5A5;          /* Primary brand color */
--midnight-ink: #1E293B;        /* Dark text */
--porcelain-blue: #E2E8F0;      /* Light background */
--sunrise-coral: #FF6B6B;       /* Accent/CTA */
--pro-purple: #AF52DE;          /* Pro tier indicator */

/* Neutral Colors */
--gray-50: #F9FAFB;
--gray-100: #F3F4F6;
--gray-200: #E5E7EB;
--gray-300: #D1D5DB;            /* Default borders */
--gray-500: #6B7280;
--gray-600: #4B5563;
--gray-700: #374151;
--gray-900: #111827;            /* Primary text */

/* Background Gradients */
--bg-gradient: linear-gradient(to bottom right,
  rgb(2 6 23), rgb(15 23 42), rgb(2 6 23));
```

#### Typography

**Font Family**: SF Pro Display (default for entire app)
```css
font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display",
             "SF Pro Text", "Helvetica Neue", Arial, sans-serif;
```

**Font Sizes**:
- `text-xs`: 12px (badges, captions)
- `text-sm`: 14px (body text)
- `text-base`: 16px (default)
- `text-lg`: 18px (section headers)
- `text-xl`: 20px (page headers)
- `text-2xl`: 24px (hero headers)
- `text-3xl`: 30px (landing pages)

**Font Weights**:
- `font-normal`: 400 (body text)
- `font-semibold`: 600 (labels, buttons)
- `font-bold`: 700 (headers)

#### Component Standards

**Buttons** (StandardButton component):
```tsx
// Default button
<StandardButton variant="outline">
  Button Text
</StandardButton>

// Pro tier button
<StandardButton variant="pro">
  Upgrade to Pro
</StandardButton>

// Destructive action
<StandardButton variant="outline" className="text-red-600">
  Sign Out
</StandardButton>
```

**Styling**:
- Variant: `outline` (default)
- Border: `border-gray-300`
- Hover: `hover:bg-gray-100`
- Padding: Built-in (no custom padding)
- No shadows, no gradients, no complex effects

**Cards** (StandardCard component):
```tsx
<StandardCard>
  <CardContent>
    Content here
  </CardContent>
</StandardCard>
```

**Styling**:
- Background: `bg-transparent` (NO solid backgrounds)
- Border: `border-gray-300`
- Shadow: `shadow-none` (NO shadows)
- Corners: `rounded-2xl`
- Spacing: `mb-6 sm:mb-8 lg:mb-12` (responsive margins)

**Badges**:
```tsx
// Standard badge
<span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-red-500 text-white">
  BETA
</span>

// Pro badge
<ProBadge tier="pro" />
```

**Styling**:
- Shape: `rounded-full`
- Padding: `px-2.5 py-0.5`
- Font: `text-xs font-semibold`
- NO uppercase, NO tracking-wider

### 9.2 Layout Standards

#### Page Container (Centralized System)

**Component**: `PageContainer.tsx`

All pages MUST use this component for consistent padding:

```tsx
import { PageContainer } from '@/components/layout/PageContainer';

export default function MyPage() {
  return (
    <PageContainer>
      <h1>Page Content</h1>
      {/* Your content */}
    </PageContainer>
  );
}
```

**Centralized Padding** (`/src/styles/layout-variables.css`):

```css
/* Single source of truth for ALL page padding */

/* Horizontal (left/right) padding */
--page-padding-x-mobile: 0.75rem;   /* 12px */
--page-padding-x-tablet: 1.5rem;    /* 24px */
--page-padding-x-desktop: 2rem;     /* 32px */

/* Vertical (top/bottom) padding */
--page-padding-y-mobile: 1rem;      /* 16px */
--page-padding-y-tablet: 1.5rem;    /* 24px */
--page-padding-y-desktop: 2rem;     /* 32px */
```

**Benefits**:
- ✅ One-prompt changes: Edit ONE file to change ALL pages
- ✅ Guaranteed consistency: Impossible to have mismatched padding
- ✅ Easy rollback: Revert one file to fix all pages
- ✅ Responsive built-in: Mobile/tablet/desktop all centralized

#### CMSLayout (Main Authenticated Layout)

**Structure**:
```
┌────────────────────────────────────────────────────┐
│ CMSHeader                                          │
│ [Logo] [Nav Links] [User Menu]                    │
├────────┬───────────────────────────────────────────┤
│        │                                           │
│        │                                           │
│  CMS   │          Page Content                    │
│  Side  │          (PageContainer)                 │
│  bar   │                                           │
│        │                                           │
│        │                                           │
├────────┴───────────────────────────────────────────┤
│ Footer (optional)                                  │
└────────────────────────────────────────────────────┘
```

**Features**:
- Responsive: Sidebar collapses to hamburger menu on mobile
- Sticky header: Header stays visible on scroll
- Account-type aware: Shows different nav links for buyers vs. creators
- Tier badge: Displays user's current tier (Basic/Pro/Suite)

### 9.3 Responsive Design

**Breakpoints** (Tailwind CSS):
```css
sm: 640px   /* Small tablets */
md: 768px   /* Tablets */
lg: 1024px  /* Laptops */
xl: 1280px  /* Desktops */
2xl: 1536px /* Large desktops */
```

**Mobile-First Approach**:
- Default styles: Mobile (< 640px)
- Add breakpoint modifiers for larger screens: `sm:`, `md:`, `lg:`

**Examples**:
```tsx
// Button: Full width on mobile, auto width on desktop
<Button className="w-full sm:w-auto">
  Click Me
</Button>

// Grid: 1 column on mobile, 3 columns on desktop
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Cards */}
</div>

// Text: Smaller on mobile, larger on desktop
<h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">
  Heading
</h1>
```

### 9.4 Accessibility Requirements

**WCAG 2.1 Level AA Compliance**:

1. **Color Contrast**:
   - Text on background: Minimum 4.5:1 ratio
   - Large text (18pt+): Minimum 3:1 ratio
   - UI components: Minimum 3:1 ratio

2. **Keyboard Navigation**:
   - All interactive elements focusable
   - Visible focus indicators
   - Logical tab order
   - Keyboard shortcuts for common actions

3. **Screen Reader Support**:
   - Semantic HTML elements
   - ARIA labels where needed
   - Alt text for all images
   - Form labels properly associated

4. **Responsive Design**:
   - 200% zoom without horizontal scroll
   - Touch targets minimum 44x44px
   - Mobile-friendly interactions

**Implementation**:
- Radix UI primitives (built-in accessibility)
- Proper heading hierarchy (h1 → h2 → h3)
- Skip to main content link
- Error messages associated with form fields

### 9.5 Loading States

**Page Load**:
```tsx
<div className="flex items-center justify-center min-h-screen">
  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-hanok-teal"></div>
</div>
```

**Content Load (Skeleton)**:
```tsx
<div className="animate-pulse space-y-4">
  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
</div>
```

**Button Loading**:
```tsx
<Button disabled>
  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
  Loading...
</Button>
```

### 9.6 Error States

**Inline Form Errors**:
```tsx
{errors.email && (
  <p className="text-sm text-red-600 mt-1">
    {errors.email.message}
  </p>
)}
```

**Toast Notifications** (Sonner):
```typescript
toast.error('Failed to load titles', {
  description: 'Please check your connection and try again.',
  action: {
    label: 'Retry',
    onClick: () => loadTitles()
  }
});
```

**Full-Page Error**:
```tsx
<Card className="border-red-200">
  <CardContent className="text-center p-8">
    <ExclamationIcon className="w-12 h-12 mx-auto text-red-600 mb-4" />
    <h3 className="text-lg font-medium text-red-600 mb-2">
      Database Connection Error
    </h3>
    <p className="text-red-500 mb-4">
      Unable to connect to the database.
    </p>
    <Button onClick={() => window.location.reload()}>
      Retry Connection
    </Button>
  </CardContent>
</Card>
```

---

## 10. AUTHENTICATION & AUTHORIZATION

### 10.1 Authentication Methods

#### Email/Password

**Signup Flow**:
1. User submits signup form (BuyerSignupForm / CreatorSignupForm)
2. Frontend validation (React Hook Form + Zod)
3. Call `supabase.auth.signUp({ email, password, options })`
4. Supabase creates `auth.users` record
5. Store metadata: `account_type`, `full_name`, `buyer_company`, etc.
6. Trigger edge function: `create-buyer-profile` or `create-creator-profile`
7. Edge function inserts into `user_buyers` or `user_creators` table
8. Send verification email (Resend API)
9. User clicks verification link
10. Account activated → Send welcome email
11. Redirect to dashboard

**Signin Flow**:
1. User submits signin form (SigninPage)
2. Call `supabase.auth.signInWithPassword({ email, password })`
3. Supabase validates credentials
4. Returns JWT token + user object
5. Frontend stores session in localStorage (automatic via Supabase)
6. Redirect to dashboard based on `account_type`:
   - `buyer` → `/buyers/home`
   - `creator` → `/creators/home`

**Password Reset**:
1. User clicks "Forgot Password" link
2. Enter email address
3. Call `supabase.auth.resetPasswordForEmail(email)`
4. Supabase sends password reset email
5. User clicks link → Redirect to dashboard with token
6. Enter new password
7. Call `supabase.auth.updateUser({ password: newPassword })`
8. Password updated → Show success message

#### OAuth

**Supported Providers**:
- Google (primary)
- Kakao (Korean users)

**OAuth Flow**:
1. User clicks "Sign in with Google" button
2. Call `supabase.auth.signInWithOAuth({ provider: 'google', options })`
3. Redirect to Google OAuth consent screen
4. User grants permissions
5. Google redirects back to `/auth/callback?code=...&account_type=buyer`
6. Frontend exchanges code for session:
   - Call `supabase.auth.exchangeCodeForSession(code)`
7. Extract `account_type` from URL params or metadata
8. Trigger edge function: `create-buyer-profile` or `create-creator-profile`
9. Redirect to appropriate dashboard

**Redirect URL**:
```
Production: https://dashboard.kstorybridge.com/auth/callback
Development: http://localhost:8081/auth/callback
```

**Account Type Detection** (Simple System):
```typescript
// Priority order:
1. URL parameter: ?account_type=buyer
2. User metadata: user.user_metadata.account_type
3. sessionStorage: 'pending_account_type'
4. Error: Missing account type
```

### 10.2 Session Management

**Session Duration**:
- Access token: 1 hour
- Refresh token: 7 days
- Auto-refresh: 5 minutes before expiry

**Session Storage**:
- localStorage: `sb-dlrnrgcoguxlkkcitlpd-auth-token`
- Format: `{ access_token, refresh_token, expires_at, user }`

**Session Health Checks**:
- Check every 5 minutes (background)
- Validate token expiry
- Auto-refresh if needed
- Logout if refresh fails

**Session Context** (`useAuth` hook):
```typescript
interface AuthContextType {
  user: User | null;              // Current user
  session: Session | null;        // Current session
  loading: boolean;               // Initial auth check
  signOut: () => Promise<void>;   // Sign out function
  refreshSession: () => Promise<boolean>; // Manual refresh
  isSessionHealthy: boolean;      // Session health status
}
```

### 10.3 Authorization (Row Level Security)

**Supabase RLS Policies**:

#### user_buyers Table
```sql
-- Users can read their own profile
CREATE POLICY "Users can read own buyer profile"
ON user_buyers FOR SELECT
USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own buyer profile"
ON user_buyers FOR UPDATE
USING (auth.uid() = id);
```

#### user_creators Table
```sql
-- Users can read their own profile
CREATE POLICY "Users can read own creator profile"
ON user_creators FOR SELECT
USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own creator profile"
ON user_creators FOR UPDATE
USING (auth.uid() = id);
```

#### titles Table
```sql
-- All authenticated users can read titles
CREATE POLICY "Authenticated users can read titles"
ON titles FOR SELECT
TO authenticated
USING (true);

-- Creators can insert their own titles
CREATE POLICY "Creators can insert own titles"
ON titles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = creator_id);

-- Creators can update their own titles
CREATE POLICY "Creators can update own titles"
ON titles FOR UPDATE
TO authenticated
USING (auth.uid() = creator_id);

-- Creators can delete their own titles
CREATE POLICY "Creators can delete own titles"
ON titles FOR DELETE
TO authenticated
USING (auth.uid() = creator_id);
```

#### user_favorites Table
```sql
-- Users can read their own favorites
CREATE POLICY "Users can read own favorites"
ON user_favorites FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can insert their own favorites
CREATE POLICY "Users can insert own favorites"
ON user_favorites FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own favorites
CREATE POLICY "Users can delete own favorites"
ON user_favorites FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
```

### 10.4 Protected Routes

**Route Protection Levels**:

1. **Public Routes** (No auth required):
   - `/signin`, `/signup`, `/signup/buyer`, `/signup/creator`
   - `/forgot-password`, `/auth/callback`

2. **Authenticated Routes** (Any logged-in user):
   - Wrapped in `<ProtectedRoute>` component
   - Checks for valid session
   - Redirects to `/signin` if not authenticated

3. **Account-Type Routes** (Specific user type):
   - **Buyer Routes**: `/buyers/*`
     - Wrapped in `<BuyerProtectedLayout>`
     - Checks `account_type === 'buyer'`
     - Redirects to appropriate dashboard if wrong type

   - **Creator Routes**: `/creators/*`
     - Wrapped in `<CreatorProtectedLayout>`
     - Checks `account_type === 'creator'`
     - Redirects to appropriate dashboard if wrong type

4. **Tier-Gated Content** (Specific subscription tier):
   - Wrapped in `<TierGatedContent requiredTier="pro">`
   - Checks user's tier level
   - Shows upgrade prompt if insufficient tier
   - Examples:
     * Pitch deck downloads (Pro+)
     * Enhanced AI chatbot (Pro+)
     * Premium titles (Pro+)

**Implementation Example**:
```tsx
// Buyer-only route
<Route path="/buyers/home" element={
  <BuyerProtectedLayout>
    <BuyerHome />
  </BuyerProtectedLayout>
} />

// Tier-gated content
<TierGatedContent requiredTier="pro">
  <SecurePDFViewer pdfUrl={title.pitch} />
</TierGatedContent>
```

---

## 11. TIER SYSTEM

### 11.1 Tier Levels

| Tier | Monthly Price | Annual Price | Target Users |
|------|--------------|--------------|--------------|
| **Basic** | Free | Free | Casual browsers, early evaluators |
| **Invited** | N/A (Legacy) | N/A | Early-access beta users (deprecated) |
| **Pro** | $99 | $950 (20% off) | Active buyers, production companies |
| **Suite** | $299 | $2,870 (20% off) | Enterprise buyers, major studios |

### 11.2 Feature Matrix

| Feature | Basic | Invited | Pro | Suite |
|---------|-------|---------|-----|-------|
| **Content Access** |
| Browse Public Titles | ✓ | ✓ | ✓ | ✓ |
| View Title Metadata | ✓ | ✓ | ✓ | ✓ |
| View Premium Titles | ✗ | ✓ | ✓ | ✓ |
| Download Pitch Decks | ✗ | ✗ | ✓ | ✓ |
| **Search** |
| Text Search | ✓ | ✓ | ✓ | ✓ |
| Vector Search (Semantic) | ✗ | ✗ | ✓ | ✓ |
| Advanced Filters | Limited | ✓ | ✓ | ✓ |
| **AI Features** |
| AI Chatbot (Standard) | ✓ | ✓ | ✓ | ✓ |
| AI Chatbot (Enhanced GPT-4) | ✗ | ✗ | ✓ | ✓ |
| Smart Recommendations | ✗ | ✗ | ✓ | ✓ |
| **Limits** |
| Title Views per Month | 100 | 500 | Unlimited | Unlimited |
| Favorites | 20 | 50 | Unlimited | Unlimited |
| Export Capabilities | ✗ | ✗ | CSV | CSV + API |
| **Support** |
| Email Support | 48h | 24h | 12h | Priority |
| Dedicated Account Manager | ✗ | ✗ | ✗ | ✓ |
| Custom Reports | ✗ | ✗ | ✗ | ✓ |
| **Other** |
| Early Access to New Titles | ✗ | ✗ | ✗ | ✓ |
| Bulk Operations | ✗ | ✗ | Limited | ✓ |
| White-Label Options | ✗ | ✗ | ✗ | Contact |

### 11.3 Tier Enforcement

**Frontend Tier Check** (`useTierAccess` hook):
```typescript
function useTierAccess() {
  const { user } = useAuth();
  const [tier, setTier] = useState<string>('basic');
  const [loading, setLoading] = useState(true);

  // Load user tier from database
  useEffect(() => {
    if (user) {
      loadUserTier(user.id).then(setTier);
    }
  }, [user]);

  // Tier comparison (numeric hierarchy)
  const hasAccess = (requiredTier: string): boolean => {
    const tierHierarchy = { basic: 1, invited: 0, pro: 2, suite: 3 };
    return tierHierarchy[tier] >= tierHierarchy[requiredTier];
  };

  return { tier, loading, hasAccess };
}
```

**TierGatedContent Component**:
```tsx
<TierGatedContent requiredTier="pro">
  <SecurePDFViewer pdfUrl={title.pitch} />
</TierGatedContent>

// Renders:
// - IF hasAccess: Show content
// - IF !hasAccess: Show upgrade prompt with pricing info
```

**Upgrade Prompt**:
```tsx
<Card className="border-pro-purple">
  <CardContent className="p-6 text-center">
    <Crown className="w-12 h-12 mx-auto text-pro-purple mb-4" />
    <h3 className="text-lg font-semibold mb-2">
      Upgrade to Pro
    </h3>
    <p className="text-gray-600 mb-4">
      Access pitch decks, enhanced AI chatbot, and premium titles.
    </p>
    <StandardButton variant="pro" asChild>
      <Link to="/buyers/plan">
        View Plans
      </Link>
    </StandardButton>
  </CardContent>
</Card>
```

### 11.4 Stripe Integration

**Subscription Products** (Stripe Dashboard):
- `prod_basic`: Free tier (no Stripe product needed)
- `prod_pro_monthly`: Pro tier - $99/month
- `prod_pro_yearly`: Pro tier - $950/year (20% discount)
- `prod_suite_monthly`: Suite tier - $299/month
- `prod_suite_yearly`: Suite tier - $2,870/year (20% discount)

**Payment Flow**:
1. User clicks "Upgrade to Pro" on `/buyers/plan`
2. Frontend calls Stripe Checkout:
   ```typescript
   const { error } = await stripe.redirectToCheckout({
     lineItems: [{ price: 'price_pro_monthly', quantity: 1 }],
     mode: 'subscription',
     successUrl: 'https://dashboard.kstorybridge.com/payment/success',
     cancelUrl: 'https://dashboard.kstorybridge.com/payment/cancel',
     customerEmail: user.email,
   });
   ```
3. User completes payment on Stripe Checkout page
4. Stripe redirects to `successUrl`
5. Stripe webhook fires: `customer.subscription.created`
6. Webhook handler updates `user_buyers.tier = 'pro'`
7. User sees success message and updated tier badge

**Webhook Events** (Handled by Supabase Edge Function):
- `customer.subscription.created` → Set tier to Pro/Suite
- `customer.subscription.updated` → Update tier if changed
- `customer.subscription.deleted` → Revert tier to Basic
- `invoice.payment_succeeded` → Record payment
- `invoice.payment_failed` → Send notification + grace period

---

## 12. AI/ML FEATURES

### 12.1 Vector Search

**Technology**: OpenAI text-embedding-ada-002 + PostgreSQL pgvector

**Embedding Generation**:
1. Extract text from title: `title_name_en`, `synopsis`, `genre`, `tone`, etc.
2. Create combined text representation
3. Call OpenAI Embeddings API:
   ```typescript
   const response = await openai.embeddings.create({
     input: combinedText,
     model: 'text-embedding-ada-002'
   });
   ```
4. Extract embedding vector (1536 dimensions)
5. Store in `titles.combined_embedding` column (vector type)

**Search Process**:
1. User enters query: "romantic comedy with strong female lead"
2. Generate embedding for query (same process)
3. Calculate cosine similarity against all title embeddings:
   ```sql
   SELECT *, 1 - (combined_embedding <=> query_embedding) AS similarity
   FROM titles
   WHERE 1 - (combined_embedding <=> query_embedding) > 0.65
   ORDER BY combined_embedding <=> query_embedding
   LIMIT 8;
   ```
4. Return top 8 most similar titles

**Performance**:
- HNSW index: 50-200ms query time
- Similarity threshold: 0.55-0.70 (configurable)
- Cache embeddings: 5-minute TTL

### 12.2 AI Chatbot

**Two Modes**:

#### Standard Mode (All Users)
- **Technology**: Database search only (no LLM)
- **Service**: `chatbotService.ts`
- **Search**: Text-based keyword matching
- **Scoring**: Word frequency + field matching
- **Response Time**: < 1 second
- **Cost**: Free

#### Enhanced Mode (Pro/Suite)
- **Technology**: OpenAI GPT-4-turbo-preview
- **Service**: `chatOrchestratorService` (Supabase Edge Function)
- **Search**: Vector search (semantic)
- **Features**:
  - Natural language understanding
  - Multi-turn conversations
  - Contextual recommendations
  - Streaming responses (SSE)
  - Follow-up suggestions
- **Response Time**: 2-5 seconds
- **Cost**: ~$0.002-$0.004 per query

**Chatbot Persona** (Enhanced Mode):
- **Name**: Jinu
- **Role**: Korean content curator at KStoryBridge
- **Personality**:
  - Passionate about Korean stories and culture
  - Knowledgeable friend, not a database
  - Natural expressions: "Oh, you'd love this!", "I think you might really enjoy..."
  - Engaging questions: "Have you tried anything like that before?"
- **Communication Style**:
  - Natural conversation flow
  - No rigid formatting
  - Emotionally responsive
  - Excited without being pushy
- **Recommendation Approach**:
  - Only recommend ACTUAL titles from search results (anti-hallucination)
  - Use exact title names from numbered list
  - Acknowledge gaps gracefully: "We don't have that specific one, but..."
  - Explain appeal in personal terms

**Prompt Engineering** (Master Prompt):
```
CONTEXT: You are Jinu, KStoryBridge's expert Korean content curator...

USER PROFILE:
- Name: [full_name]
- Status: [tier description]
- Account: Buyer/Creator

CONVERSATION CONTEXT:
[Last 10 messages]

RELEVANT KOREAN CONTENT DISCOVERED:
1. "Title Name" (85% match)
   • Genre: Romance, Comedy
   • Tone: Light-hearted
   • Synopsis: [first 120 chars]

CURRENT QUERY: "[user query]"

RESPONSE GUIDELINES:
1. Personality: Passionate, knowledgeable, genuinely excited
2. Recommendations: ONLY recommend ACTUAL titles from above list
3. Engagement: Ask thoughtful follow-up questions
4. Cultural Context: Share Korean storytelling insights
5. Personalization: Tailor to user's tier and history
6. Structure: Conversational but organized
7. Follow-ups: End with 2-3 engaging questions
8. Accuracy: NEVER make up title names
```

**Anti-Hallucination Measures**:
1. **Strong prompt constraints**: Only recommend from provided list
2. **Post-processing validation**: Check quoted titles exist in database
3. **Structured output**: Force JSON format with title IDs (GPT-4 only)
4. **Fallback handling**: Generic response if validation fails

### 12.3 Content Analysis (Future)

**Planned Features**:
- Mood analysis: Primary mood, intensity, emotional spectrum
- Character types: Archetypes present (hero, mentor, trickster, etc.)
- Plot elements: Story structure components
- Cultural elements: Korean cultural references
- Complexity score: Content complexity (1-10)
- Target demographics: Age range, interests, preferences
- Content warnings: Sensitive content tags

**Implementation** (When activated):
```typescript
// Analyze title content using GPT-4o-mini
const analysis = await embeddingService.analyzeContent(title);

// Save to title_content_analysis table
await embeddingService.storeContentAnalysis(title.title_id, analysis);
```

---

## 13. PERFORMANCE REQUIREMENTS

### 13.1 Page Load Performance

| Metric | Target | Current Status |
|--------|--------|----------------|
| **Initial Page Load** (FCP) | < 2.5s | Optimized |
| **Time to Interactive** (TTI) | < 3.5s | Optimized |
| **Largest Contentful Paint** (LCP) | < 2.5s | Optimized |
| **Cumulative Layout Shift** (CLS) | < 0.1 | Stable |
| **First Input Delay** (FID) | < 100ms | Fast |

**Optimizations**:
- ✅ Lazy loading (React.lazy for page components)
- ✅ Code splitting (Vite automatic)
- ✅ Image optimization (responsive images)
- ✅ Tree shaking (remove unused code)
- ✅ Minification (production builds)
- ✅ Compression (Gzip/Brotli via Vercel)

### 13.2 API Response Times

| Operation | Target | Average |
|-----------|--------|---------|
| **Authentication** (sign in) | < 1s | ~800ms |
| **Title Browse** (12 titles) | < 2s | ~1.5s |
| **Title Search** (text) | < 1s | ~500ms |
| **Vector Search** | < 2s | ~1-2s |
| **AI Chatbot** (standard) | < 1s | ~800ms |
| **AI Chatbot** (enhanced) | < 5s | ~2-5s |
| **Favorites Add/Remove** | < 500ms | ~300ms |

**Backend Optimizations**:
- ✅ Database indexes on frequently queried columns
- ✅ HNSW index for vector search
- ✅ Query result caching (5-minute TTL)
- ✅ Connection pooling (Supabase)
- ✅ Edge functions (low latency)

### 13.3 Caching Strategy

**Session-Based Cache System** (1-hour expiry):

```typescript
// Cache lifecycle
User logs in → Initialize cache session
Valid session + fresh cache → Use cached data
New session OR stale cache → Fetch from database
User logs out OR 1-hour inactivity → Clear cache
```

**Cached Items**:
- Titles database: 5-minute TTL, 0.5MB max, 30 titles max
- User profile: Session duration
- User tier: Session duration
- Search results: 5-minute TTL
- Featured titles: 10-minute TTL

**Cache Benefits**:
- 70% faster initial loads (no stale cache checks)
- Reduced database load (efficient within sessions)
- Better UX (clear feedback on connectivity issues)
- No data corruption (always fresh data on session start)

### 13.4 Bundle Size

**Target**: < 500KB initial bundle (gzipped)

**Current Breakdown** (Approximate):
- React + React DOM: ~140KB
- Supabase client: ~50KB
- Shadcn/UI components: ~80KB
- Application code: ~150KB
- Other dependencies: ~80KB
- **Total**: ~500KB (gzipped)

**Optimization Strategies**:
- Code splitting by route
- Dynamic imports for large components
- Tree shaking (remove unused exports)
- Bundle analyzer to identify large dependencies

### 13.5 Database Performance

**Query Optimization**:
```sql
-- Good: Use indexes
SELECT * FROM titles
WHERE genre @> ARRAY['Romance']
AND completed = true
ORDER BY created_at DESC
LIMIT 12;
-- Uses: idx_titles_genre, idx_titles_completed

-- Bad: Full table scan
SELECT * FROM titles
WHERE synopsis LIKE '%romantic%';
-- No index on synopsis (use vector search instead)
```

**Connection Pooling**:
- Min connections: 2
- Max connections: 10
- Idle timeout: 300s
- Statement timeout: 30s

### 13.6 Monitoring & Alerts

**Metrics Tracked**:
- Page load times (Google Analytics)
- API response times (Supabase metrics)
- Error rates (Sentry)
- User session duration
- Feature usage (chatbot, search, favorites)

**Alerting Thresholds**:
- API response time > 5s: Warning
- API response time > 10s: Critical
- Error rate > 5%: Warning
- Error rate > 10%: Critical
- Database connections > 80%: Warning

---

## 14. SECURITY REQUIREMENTS

### 14.1 Authentication Security

**Password Requirements**:
- Minimum 8 characters
- Must contain:
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number
- Recommendations (not enforced):
  - Special characters
  - Longer than 12 characters

**Password Storage**:
- Hashed with bcrypt (Supabase Auth)
- Never stored in plaintext
- Never logged or exposed in API responses

**JWT Tokens**:
- Algorithm: HS256
- Expiry: 1 hour (access token)
- Refresh token: 7 days
- Automatic rotation on refresh
- Stored in httpOnly cookies (Supabase)

### 14.2 Data Protection

**Sensitive Data**:
- User passwords: Hashed with bcrypt
- API keys: Stored in environment variables (never in code)
- Stripe keys: Environment variables
- OAuth secrets: Supabase dashboard (encrypted)

**Data Encryption**:
- In transit: TLS 1.2+ (HTTPS)
- At rest: PostgreSQL encryption (Supabase)
- File storage: Encrypted at rest (Supabase Storage)

**PII Handling**:
- Email addresses: Stored in database (necessary for auth)
- Full names: Stored in user profiles
- Payment info: NOT stored (handled by Stripe)
- No credit card data on our servers

### 14.3 Authorization Security

**Row Level Security (RLS)**:
- ALL tables have RLS policies enabled
- Default: Deny all access
- Explicit policies for each operation (SELECT, INSERT, UPDATE, DELETE)
- User can only access own data (checked via `auth.uid()`)

**API Security**:
- All API requests require authentication (JWT)
- Supabase validates JWT on every request
- Rate limiting: 100 requests/minute per IP
- CORS: Restricted to dashboard.kstorybridge.com

**Admin Access**:
- Separate `admin` table for admin users
- Admin routes: Email-based access control
- Admin emails: `sungho@dadble.com`, `kevin@sandstoneartists.com`
- No UI for admin management (manual database edits only)

### 14.4 Input Validation

**Frontend Validation** (React Hook Form + Zod):
```typescript
// Example schema
const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  buyer_company: z.string().optional(),
});
```

**Backend Validation** (PostgreSQL):
- NOT NULL constraints on required fields
- UNIQUE constraints on email addresses
- CHECK constraints on enum fields
- Foreign key constraints for referential integrity

**SQL Injection Prevention**:
- Supabase client uses parameterized queries
- Never concatenate user input into SQL strings
- RLS policies prevent unauthorized access

**XSS Prevention**:
- React escapes all output by default
- Use `dangerouslySetInnerHTML` NEVER (or only with sanitized content)
- Content Security Policy (CSP) headers

### 14.5 File Upload Security

**Allowed File Types**:
- Images: JPG, PNG, WEBP (max 5MB)
- Documents: PDF (max 10MB)

**Validation**:
- File type validation (MIME type check)
- File size validation (client + server)
- Virus scanning (TODO: integrate ClamAV or similar)

**Storage**:
- Supabase Storage (S3-compatible)
- Private buckets (require authentication)
- Signed URLs for temporary access (1-hour expiry)
- Automatic file cleanup (orphaned files after 30 days)

### 14.6 Rate Limiting

**API Rate Limits** (Supabase):
- 100 requests/minute per user
- 1000 requests/hour per user
- 10,000 requests/day per IP address

**OpenAI Rate Limits**:
- Embeddings: 3,000 requests/minute
- Completions: 3,500 requests/minute
- Tokens: 90,000/minute (GPT-4-turbo)

**Abuse Prevention**:
- Exponential backoff on repeated failures
- Account lockout after 5 failed login attempts (15-minute lockout)
- Email verification required for new accounts
- Captcha on signup (TODO: implement reCAPTCHA)

### 14.7 Secrets Management

**Environment Variables**:
```bash
# .env.local (gitignored)
VITE_SUPABASE_URL=https://dlrnrgcoguxlkkcitlpd.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_OPENAI_API_KEY=sk-proj-xxxxx
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx

# Supabase Edge Function Secrets (not in code)
SUPABASE_SERVICE_ROLE_KEY=xxxxx
OPENAI_API_KEY=sk-proj-xxxxx
RESEND_API_KEY=re_xxxxx
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

**Secret Rotation**:
- API keys rotated every 90 days
- Database passwords rotated every 180 days
- JWT secret never rotated (Supabase manages)

**Access Control**:
- Secrets stored in Vercel environment variables (production)
- Secrets stored in Supabase dashboard (edge functions)
- Never commit secrets to Git
- Use `.env.example` for documentation only

---

## 15. DEPLOYMENT

### 15.1 Infrastructure

**Frontend Hosting**: Vercel
- **Domain**: dashboard.kstorybridge.com
- **Region**: Global CDN (edge locations worldwide)
- **Auto-deploy**: Push to `main` branch
- **Preview deploys**: Every pull request
- **Build Command**: `npm run build`
- **Output Directory**: `dist/`

**Backend Hosting**: Supabase
- **Database**: PostgreSQL 15 (managed)
- **Region**: US East (us-east-1)
- **Edge Functions**: Deno runtime (global)
- **Storage**: S3-compatible (global CDN)
- **Project**: `dlrnrgcoguxlkkcitlpd`

**External Services**:
- **OpenAI**: API (global)
- **Stripe**: API (global)
- **Resend**: Email API (global)

### 15.2 Environments

#### Development
- **URL**: http://localhost:8081
- **Database**: Local Supabase (Docker) OR development database
- **API Keys**: `.env.local` (local only, gitignored)
- **Auth**: Development OAuth apps
- **Payments**: Stripe test mode

#### Staging (TODO: Setup)
- **URL**: staging.dashboard.kstorybridge.com
- **Database**: Separate Supabase project (staging)
- **API Keys**: Vercel environment variables (staging)
- **Auth**: Development OAuth apps
- **Payments**: Stripe test mode

#### Production
- **URL**: dashboard.kstorybridge.com
- **Database**: Production Supabase project
- **API Keys**: Vercel environment variables (production)
- **Auth**: Production OAuth apps
- **Payments**: Stripe live mode

### 15.3 CI/CD Pipeline

**GitHub Actions** (`.github/workflows/deploy.yml`):
```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm install
      - run: npm run lint
      - run: npm run build
      - uses: vercel/actions/deploy@v2
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

**Deployment Steps**:
1. Push to GitHub (`main` branch)
2. GitHub Actions triggered
3. Install dependencies (`npm install`)
4. Run linting (`npm run lint`)
5. Build application (`npm run build`)
6. Deploy to Vercel
7. Update DNS (automatic)
8. Invalidate CDN cache
9. Health check (automatic)
10. Notify team (Slack webhook)

**Rollback Strategy**:
- Vercel: Instant rollback to previous deployment (UI or CLI)
- Database: Manual rollback via Supabase migrations
- Zero-downtime deployments (blue-green via Vercel)

### 15.4 Database Migrations

**Supabase CLI**:
```bash
# Create new migration
supabase migration new add_user_tier_column

# Apply migrations to local database
supabase db reset

# Apply migrations to production
supabase db push

# Generate TypeScript types from database
supabase gen types typescript --local > src/integrations/supabase/types.ts
```

**Migration Best Practices**:
- Always test locally first
- Use transactions for multi-step migrations
- Add rollback SQL in comments
- Never drop columns with data (use soft deletes)
- Backup database before major migrations

### 15.5 Monitoring

**Application Monitoring**:
- **Vercel Analytics**: Page views, performance metrics
- **Google Analytics 4**: User behavior, conversions
- **Sentry** (TODO): Error tracking, performance monitoring

**Database Monitoring**:
- **Supabase Dashboard**: Connection count, query performance
- **PostgreSQL logs**: Slow query log (> 1s)
- **Disk usage**: Alert at 80% capacity

**Uptime Monitoring** (TODO):
- **UptimeRobot**: HTTP checks every 5 minutes
- **StatusPage**: Public status page
- **PagerDuty**: On-call alerting

### 15.6 Backup & Recovery

**Database Backups** (Supabase):
- Automated daily backups (retained 7 days)
- Point-in-time recovery (PITR): Up to 7 days back
- Manual backups before major changes

**File Storage Backups** (Supabase Storage):
- Files stored in S3 (99.999999999% durability)
- Versioning enabled (retain last 10 versions)
- Manual backups for critical assets

**Recovery Time Objectives (RTO)**:
- Database: < 1 hour
- Application: < 5 minutes (Vercel rollback)
- File storage: < 30 minutes

**Recovery Point Objectives (RPO)**:
- Database: < 5 minutes (PITR)
- Application: < 1 minute (Git commit)
- File storage: < 5 minutes (S3 versioning)

---

## 16. TESTING STRATEGY

### 16.1 Testing Pyramid

```
      /\
     /  \      E2E Tests (10%)
    /────\     - Critical user flows
   /      \    - Authentication, payments
  /────────\   Integration Tests (20%)
 /          \  - API integration
/────────────\ - Component integration
|            | Unit Tests (70%)
|            | - Service functions
|            | - Utility functions
|            | - Component logic
```

### 16.2 Unit Testing

**Framework**: Vitest

**Test Coverage Goals**:
- Services: 80%+ coverage
- Utilities: 90%+ coverage
- Components: 60%+ coverage (logic only, not UI)

**Example Unit Tests**:

```typescript
// services/titlesService.test.ts
describe('TitlesService', () => {
  it('should fetch all titles', async () => {
    const titles = await titlesService.getAllTitles();
    expect(titles).toBeArray();
    expect(titles.length).toBeGreaterThan(0);
  });

  it('should filter titles by genre', async () => {
    const titles = await titlesService.getTitlesByGenre('Romance');
    titles.forEach(title => {
      expect(title.genre).toContain('Romance');
    });
  });
});

// utils/searchUtils.test.ts
describe('searchUtils', () => {
  it('should score title match correctly', () => {
    const title = { title_name_en: 'Romantic Comedy', genre: ['Romance'] };
    const score = scoreTitle(title, 'romance');
    expect(score).toBeGreaterThan(0);
  });
});
```

**Run Tests**:
```bash
npm run test           # Run all tests
npm run test:watch     # Watch mode
npm run test:coverage  # Coverage report
```

### 16.3 Integration Testing

**Tools**: Vitest + Supabase Test Client

**Test Scenarios**:
- Authentication flow (signup, signin, logout)
- CRUD operations (create title, update title, delete title)
- Search functionality (text search, vector search)
- Favorites management (add, remove, list)

**Example Integration Test**:

```typescript
// integration/auth.test.ts
describe('Authentication Flow', () => {
  it('should sign up new user', async () => {
    const { data, error } = await supabase.auth.signUp({
      email: 'test@example.com',
      password: 'TestPassword123'
    });

    expect(error).toBeNull();
    expect(data.user).toBeDefined();
    expect(data.user?.email).toBe('test@example.com');
  });

  it('should sign in existing user', async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'TestPassword123'
    });

    expect(error).toBeNull();
    expect(data.session).toBeDefined();
  });
});
```

### 16.4 End-to-End Testing (TODO)

**Tool**: Playwright or Cypress

**Critical User Flows**:
1. **Buyer Onboarding**:
   - Sign up with email/password
   - Verify email
   - Complete profile
   - Browse titles
   - Save favorites
   - Upgrade to Pro

2. **Content Discovery**:
   - Search for titles (text)
   - Filter by genre
   - View title detail
   - Download pitch deck (Pro tier)

3. **AI Chatbot**:
   - Open chatbot
   - Send query
   - Receive recommendations
   - Click title card

4. **Creator Title Management**:
   - Sign in as creator
   - Add new title
   - Upload assets
   - Edit title
   - Delete title

**Example E2E Test**:

```typescript
// e2e/buyer-signup.spec.ts
test('Buyer signup flow', async ({ page }) => {
  // Navigate to signup page
  await page.goto('/signup/buyer');

  // Fill out form
  await page.fill('[name="full_name"]', 'John Doe');
  await page.fill('[name="email"]', 'john@example.com');
  await page.fill('[name="password"]', 'SecurePassword123');

  // Submit form
  await page.click('button[type="submit"]');

  // Wait for redirect
  await page.waitForURL('/buyers/home');

  // Verify success
  await expect(page.locator('h1')).toContainText('Welcome');
});
```

### 16.5 Manual Testing Checklist

**Pre-Release Checklist**:

- [ ] Authentication
  - [ ] Sign up (email/password)
  - [ ] Sign up (Google OAuth)
  - [ ] Sign in (email/password)
  - [ ] Sign in (Google OAuth)
  - [ ] Password reset
  - [ ] Email verification
  - [ ] Sign out

- [ ] Content Browsing
  - [ ] View title list
  - [ ] Search (text)
  - [ ] Filter by genre
  - [ ] Sort by title/date/views
  - [ ] Infinite scroll (buyers)
  - [ ] Pagination (creators)

- [ ] Title Detail
  - [ ] View title metadata
  - [ ] View pitch deck (Pro tier)
  - [ ] Upgrade prompt (Basic tier)
  - [ ] Add to favorites
  - [ ] Remove from favorites

- [ ] AI Chatbot
  - [ ] Open chatbot
  - [ ] Send query
  - [ ] View recommendations
  - [ ] Click title card
  - [ ] Provide feedback
  - [ ] Toggle mode (Standard ↔ Enhanced)

- [ ] Creator Features
  - [ ] Add new title
  - [ ] Upload cover image
  - [ ] Upload pitch deck
  - [ ] Edit title
  - [ ] Delete title

- [ ] Account Management
  - [ ] Edit profile
  - [ ] View tier status
  - [ ] Upgrade to Pro
  - [ ] Subscription management

- [ ] Responsive Design
  - [ ] Mobile (< 640px)
  - [ ] Tablet (640px - 1024px)
  - [ ] Desktop (> 1024px)

- [ ] Browser Compatibility
  - [ ] Chrome (latest)
  - [ ] Firefox (latest)
  - [ ] Safari (latest)
  - [ ] Edge (latest)

---

## 17. FUTURE ROADMAP

### 17.1 Q1 2025 (Planned)

**High Priority**:
- [ ] Staging environment setup
- [ ] E2E testing framework (Playwright)
- [ ] Sentry error tracking integration
- [ ] Uptime monitoring (UptimeRobot)
- [ ] Admin dashboard (user management)

**Medium Priority**:
- [ ] Enhanced analytics dashboard
- [ ] Email notification preferences
- [ ] Bulk export (CSV for Suite tier)
- [ ] Custom reports (Suite tier)

**Low Priority**:
- [ ] Dark mode support
- [ ] Keyboard shortcuts
- [ ] Saved searches
- [ ] Title comparison view

### 17.2 Q2 2025 (Planned)

**AI/ML Enhancements**:
- [ ] Improved vector search (lower threshold, query expansion)
- [ ] Anti-hallucination measures (title validation)
- [ ] Conversation summarization (chatbot context)
- [ ] User personalization (preference tracking)
- [ ] Content analysis (mood, themes, demographics)

**User Features**:
- [ ] Collaborative workspaces (teams)
- [ ] Shared favorites lists
- [ ] Internal notes on titles
- [ ] Deal tracking dashboard
- [ ] Contract management (basic)

### 17.3 Q3 2025 (Planned)

**Platform Expansion**:
- [ ] Mobile app (React Native)
- [ ] Public API for integrations
- [ ] Webhook notifications
- [ ] Zapier integration
- [ ] Slack bot

**Content Features**:
- [ ] Video pitch support
- [ ] 3D asset previews
- [ ] Interactive pitch decks
- [ ] Live creator Q&A
- [ ] Virtual screenings

### 17.4 Q4 2025 (Planned)

**Enterprise Features**:
- [ ] White-label dashboards
- [ ] SSO (SAML/OIDC)
- [ ] Advanced permissions (roles)
- [ ] Audit logs
- [ ] Custom domains

**Marketplace Features**:
- [ ] In-app messaging (buyer ↔ creator)
- [ ] Deal negotiation workflow
- [ ] Escrow integration
- [ ] Contract signing (DocuSign)
- [ ] Rights management ledger

---

## 📞 APPENDIX

### A. Glossary

| Term | Definition |
|------|------------|
| **Buyer** | Media company or individual looking to acquire Korean content rights |
| **Creator** | Content creator, webtoon artist, or IP owner with titles to sell |
| **Title** | A Korean content property (webtoon, manhwa, novel, etc.) |
| **Tier** | Subscription level (Basic, Pro, Suite) determining feature access |
| **Pitch Deck** | PDF presentation document with title details and marketing materials |
| **Vector Search** | Semantic similarity search using AI embeddings |
| **Embedding** | 1536-dimensional vector representation of text content |
| **RLS** | Row Level Security (PostgreSQL security policy) |
| **Edge Function** | Serverless function running on Supabase (Deno runtime) |
| **OAuth** | Third-party authentication (Google, Kakao) |
| **JWT** | JSON Web Token (authentication token) |

### B. Key URLs

**Production**:
- Dashboard: https://dashboard.kstorybridge.com
- Website: https://kstorybridge.com
- Supabase: https://dlrnrgcoguxlkkcitlpd.supabase.co

**Development**:
- Dashboard: http://localhost:8081
- Website: http://localhost:5173

**External Services**:
- Supabase Dashboard: https://app.supabase.com
- Vercel Dashboard: https://vercel.com/dashboard
- Stripe Dashboard: https://dashboard.stripe.com
- OpenAI API: https://platform.openai.com

### C. Contact Information

**Technical Support**:
- Email: support@kstorybridge.com
- Slack: #kstorybridge-dashboard

**Key Personnel**:
- Product Owner: Sungho Lee (sungho@dadble.com)
- Technical Lead: Kevin (kevin@sandstoneartists.com)

### D. Related Documentation

- [AI Chatbot Documentation](AI_CHATBOT_DOCUMENTATION.md)
- [Database Schema Reference](../../DATABASE_SCHEMA.md)
- [Tier Optimization Guide](TIER_OPTIMIZATION.md)
- [CLAUDE.md](CLAUDE.md) - Development guidelines

---

**Document Version**: 2.0
**Last Updated**: 2025-01-26
**Status**: Production
**Maintained By**: Development Team

This PRD serves as the single source of truth for replicating the KStoryBridge Dashboard application. For questions or clarifications, contact the technical team.