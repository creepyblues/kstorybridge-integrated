# AI Chatbot System Documentation

**Last Updated**: 2025-01-26
**Version**: 2.0
**Status**: Production (All Buyers)

---

## 📊 SYSTEM OVERVIEW

The KStoryBridge AI chatbot is a **dual-mode conversational recommendation engine** designed to help users discover Korean content (webtoons, manhwa, novels) through natural language queries.

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    USER INTERFACE LAYER                      │
│  • Chat.tsx (Main Interface - All Buyers)                   │
│  • AIChatbot.tsx (Legacy/Admin Only)                        │
└────────────────┬────────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────────┐
│                 SERVICE ORCHESTRATION LAYER                  │
│  • chatOrchestratorService (GPT-4 via Edge Function)       │
│  • openaiService (Direct GPT-4o-mini)                       │
│  • chatbotService (Database Search Only)                    │
└────────────────┬────────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────────┐
│                   DATA RETRIEVAL LAYER                       │
│  • vectorSearchService (Semantic Search)                    │
│  • embeddingService (OpenAI Embeddings)                     │
│  • titlesService (Database CRUD)                            │
└────────────────┬────────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────────┐
│                    DATABASE LAYER                            │
│  • Supabase PostgreSQL                                      │
│  • Vector embeddings (pgvector)                             │
│  • Chat history & analytics                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 TWO CHATBOT MODES

### Mode 1: Standard Mode (Database Search Only)
**File**: `AIChatbot.tsx`

- **Access**: Admin only (`sungho@dadble.com`, `kevin@sandstoneartists.com`)
- **Model**: Pure database search (no LLM)
- **Service**: `chatbotService.searchTitles()`
- **Search Method**: Text-based keyword matching with scoring
- **Speed**: Very fast (< 1 second)
- **Accuracy**: Limited to exact keyword matches
- **Use Case**: Testing, debugging, performance baseline

### Mode 2: Enhanced Mode (AI-Powered)
**File**: `Chat.tsx`

- **Access**: All buyers (default chatbot)
- **Two Execution Paths**:

#### Path A - Legacy Mode (Default)
- **Model**: GPT-4o-mini
- **Service**: `openaiService.generateChatResponse()`
- **Search**: Vector search with text search fallback
- **Prompt**: Optimized Korean IP context (6 titles)
- **Features**: Fast, cost-effective, good for simple queries

#### Path B - Orchestrator Mode (Pro Feature)
- **Model**: GPT-4-turbo-preview
- **Service**: `chatOrchestratorService` via Supabase Edge Function
- **Search**: Vector search with hybrid scoring
- **Prompt**: Master prompt with full user profile + conversation history
- **Features**: Streaming responses, session context, advanced personalization
- **Location**: `apps/dashboard/supabase/functions/chat-orchestrator/index.ts`

---

## 📦 DATA STRUCTURES

### Database Schema

#### `titles` Table (Main Content)
```typescript
interface Title {
  // Identity
  title_id: string;              // UUID primary key

  // Names
  title_name_en: string;         // English title
  title_name_kr: string;         // Korean title (한글)

  // Descriptions
  synopsis: string;              // Full synopsis (text)
  tagline: string;               // Short tagline
  note: string;                  // Internal notes

  // Classification
  genre: string[] | string;      // ["Romance", "Comedy"] or "Romance, Comedy"
  tone: string;                  // "Light-hearted", "Intense", etc.
  content_format: string;        // "Webtoon", "Novel", "Manhwa"
  tags: string[];                // ["slice-of-life", "friendship"]

  // Authorship
  author: string;                // General author
  story_author: string;          // Story writer
  art_author: string;            // Artist
  writer: string;                // Writer (legacy)
  illustrator: string;           // Illustrator (legacy)

  // Rights & Ownership
  rights: string;                // Rights status
  rights_owner: string;          // Rights holder name
  creator_id: string;            // FK to user_creators

  // Media
  title_image: string;           // Cover image URL
  title_url: string;             // External link
  pitch: string;                 // Pitch deck URL/text

  // Metrics
  views: number;                 // View count
  likes: number;                 // Like count
  rating: number;                // Average rating (0-5)
  rating_count: number;          // Number of ratings

  // Status
  completed: boolean;            // Is series complete?
  chapters: number;              // Total chapters

  // Marketing
  perfect_for: string;           // "Fans of X will love Y"
  comps: string[];               // ["Breaking Bad", "Narcos"]
  audience: string;              // Target audience

  // Vector Embeddings (1536 dimensions each)
  title_embedding: number[];          // Title name embedding
  synopsis_embedding: number[];       // Synopsis embedding
  content_embedding: number[];        // Combined content embedding
  combined_embedding: number[];       // Master embedding (used for search)
  embedding_model: string;            // "text-embedding-ada-002"
  embedding_created_at: timestamp;    // When embeddings were generated
  embedding_updated_at: timestamp;    // Last embedding update

  // Timestamps
  created_at: timestamp;
  updated_at: timestamp;
}
```

#### `chat_sessions` Table
```typescript
interface ChatSession {
  id: string;                    // UUID
  user_id: string;               // FK to auth.users
  user_email: string;            // User email (for analytics)
  session_type: 'openai' | 'traditional';  // Which chatbot mode
  started_at: timestamp;         // Session start time
  ended_at: timestamp | null;    // Session end time (null = active)
  messages: JSONB;               // Full conversation history
}
```

#### `chat_messages` Table
```typescript
interface ChatMessage {
  id: string;                    // UUID
  session_id: string;            // FK to chat_sessions
  user_id: string;               // FK to auth.users
  message_type: 'user_prompt' | 'ai_response';
  content: string;               // Message text
  tokens_used: number;           // OpenAI tokens consumed
  response_time_ms: number;      // Response generation time
  created_at: timestamp;
}
```

#### `chat_title_recommendations` Table
```typescript
interface TitleRecommendation {
  id: string;                    // UUID
  message_id: string;            // FK to chat_messages (AI response)
  session_id: string;            // FK to chat_sessions
  title_id: string;              // FK to titles
  title_name_en: string;         // Cached title name
  title_name_kr: string;         // Cached Korean name
  recommendation_score: number;  // Similarity score (0-1)
  recommendation_reason: string; // Why this was recommended
  created_at: timestamp;
}
```

#### `chat_suggested_queries` Table
```typescript
interface SuggestedQuery {
  id: string;                    // UUID
  message_id: string;            // FK to chat_messages
  session_id: string;            // FK to chat_sessions
  suggested_query: string;       // The suggested query text
  query_position: number;        // Order in suggestion list
  clicked: boolean;              // Was this clicked?
  created_at: timestamp;
}
```

### TypeScript Interfaces

#### Search Results
```typescript
interface VectorSearchResult {
  title_id: string;
  title_name_en?: string;
  title_name_kr?: string;
  synopsis?: string;
  similarity: number;            // Cosine similarity (0-1)
  score?: number;                // Additional computed score
}

interface ScoredTitle extends Title {
  score: number;                 // Text-based relevance score
  vectorScore: number;           // Semantic similarity (0-1)
  relevance: string;             // 'text-match' | 'semantic' | 'none'
}
```

#### LLM Response
```typescript
interface LLMChatResponse {
  message: string;               // AI-generated response text
  recommendedTitles: Title[];    // Array of recommended titles
  suggestedQueries?: string[];   // Follow-up query suggestions
  vectorSearchUsed?: boolean;    // Did we use vector search?
  searchContext?: {
    query?: string;
    results?: unknown[];
    metadata?: Record<string, unknown>;
  };
}
```

---

## 🔍 TITLE EXTRACTION & SEARCH

### Search Pipeline Flow

```
User Query: "Show me romantic comedy webtoons"
    │
    ├─→ [Vector Search] (Primary - 95% accuracy)
    │   │
    │   ├─ 1. Generate query embedding
    │   │    • Model: text-embedding-ada-002
    │   │    • Dimensions: 1536
    │   │    • Cost: ~$0.0001 per request
    │   │
    │   ├─ 2. Search PostgreSQL pgvector
    │   │    • Function: match_titles_by_embedding()
    │   │    • Threshold: 0.65 similarity (cosine distance)
    │   │    • Limit: 8 results
    │   │    • Index: HNSW (fast approximate search)
    │   │
    │   ├─ 3. Fetch full title metadata
    │   │    • Batch query by title_ids
    │   │    • Include all fields for context
    │   │
    │   └─ 4. Return scored results
    │        • Sort by similarity descending
    │        • Include similarity scores
    │
    └─→ [Text Search] (Fallback - if vector fails)
        │
        ├─ 1. Tokenize query
        │    • Split by whitespace
        │    • Filter words < 3 characters
        │    • Lowercase normalization
        │
        ├─ 2. Score each title
        │    • Base: 2 points per word occurrence
        │    • Title match: +5 points
        │    • Genre match: +3 points
        │    • Special boosts (action, romance, etc.)
        │
        ├─ 3. Sort and filter
        │    • Remove score = 0
        │    • Sort by score descending
        │    • Take top 8 results
        │
        └─ 4. Return scored titles
```

### Vector Search Implementation

**File**: `vectorSearchService.ts`

```typescript
async vectorSearch(
  query: string,
  context?: SearchContext,
  options?: {
    threshold?: number;  // Default: 0.65
    limit?: number;      // Default: 8
    includeAnalysis?: boolean;
  }
): Promise<VectorSearchResult[]> {
  // 1. Generate embedding for user query
  const queryEmbedding = await embeddingService.generateEmbedding(query);

  // 2. Perform vector similarity search using PostgreSQL
  const { data: results, error } = await supabase.rpc('match_titles_by_embedding', {
    query_embedding: queryEmbedding.embedding,  // float[] array
    match_threshold: options?.threshold || 0.65,
    match_count: options?.limit || 8
  });

  // 3. Fetch complete title metadata
  const titleIds = results.map(r => r.title_id);
  const fullTitles = await titlesService.getTitlesByIds(titleIds);

  // 4. Merge similarity scores with title data
  return results.map(result => {
    const fullTitle = fullTitles.find(t => t.title_id === result.title_id);
    return {
      ...fullTitle,
      similarity: result.similarity,
      score: Math.round(result.similarity * 100)
    };
  });
}
```

**PostgreSQL Function** (`match_titles_by_embedding`):
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
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    title_id,
    title_name_en,
    title_name_kr,
    synopsis,
    1 - (combined_embedding <=> query_embedding) AS similarity
  FROM titles
  WHERE combined_embedding IS NOT NULL
    AND 1 - (combined_embedding <=> query_embedding) > match_threshold
  ORDER BY combined_embedding <=> query_embedding
  LIMIT match_count;
$$;
```

### Text Search Scoring Algorithm

**File**: `chatbotService.ts` / `openaiService.ts`

```typescript
class UnifiedTitleScorer {
  static scoreTitle(title: Title, query: string, queryWords: string[]): ScoredTitle {
    let score = 0;

    // Create comprehensive searchable text
    const searchableText = [
      title.title_name_en,
      title.title_name_kr,
      title.synopsis,
      title.tagline,
      Array.isArray(title.genre) ? title.genre.join(' ') : title.genre,
      title.tone,
      Array.isArray(title.tags) ? title.tags.join(' ') : title.tags,
      title.story_author,
      title.art_author,
      title.perfect_for,
      title.audience
    ].filter(Boolean).join(' ').toLowerCase();

    // Base scoring: 2 points per word occurrence
    queryWords.forEach(word => {
      if (word.length <= 2) return;
      const count = (searchableText.match(new RegExp(word, 'g')) || []).length;
      score += count * 2;

      // Title match boost: +5 points
      if (title.title_name_en?.toLowerCase().includes(word) ||
          title.title_name_kr?.toLowerCase().includes(word)) {
        score += 5;
      }

      // Genre/tone match boost: +3 points
      const genreStr = Array.isArray(title.genre)
        ? title.genre.join(' ').toLowerCase()
        : (title.genre || '').toLowerCase();
      const toneStr = (title.tone || '').toLowerCase();

      if (genreStr.includes(word) || toneStr.includes(word)) {
        score += 3;
      }
    });

    // Special query type detection
    const isActionQuery = query.toLowerCase().match(/action|fight|combat|assassin/);
    if (isActionQuery) {
      const genreStr = Array.isArray(title.genre)
        ? title.genre.join(' ').toLowerCase()
        : (title.genre || '').toLowerCase();

      if (genreStr.includes('action') || genreStr.includes('thriller')) score += 10;
      if (title.tone?.toLowerCase().match(/intense|exciting/)) score += 5;
    }

    // Quality indicators
    if (title.synopsis?.length > 50) score += 1;
    if (title.tagline?.length > 10) score += 1;
    if (title.views > 10000) score += 1;
    if (title.completed) score += 1;
    if (title.pitch) score += 2;

    return {
      ...title,
      score,
      vectorScore: 0,
      relevance: score > 0 ? 'text-match' : 'none'
    };
  }
}
```

---

## 💬 PROMPT ENGINEERING

### Orchestrator Mode Master Prompt

**File**: `supabase/functions/chat-orchestrator/index.ts`

```typescript
function buildMasterPrompt(context: {
  userProfile: UserProfile;
  conversationHistory: ChatMessage[];
  searchResults: VectorSearchResult[];
  userQuery: string;
}): string {
  const { userProfile, conversationHistory, searchResults, userQuery } = context;

  const tierDescription = {
    'basic': 'exploring Korean content',
    'invited': 'special access member',
    'pro': 'premium content enthusiast',
    'suite': 'full platform access with exclusive content'
  }[userProfile.tier || 'basic'] || 'Korean content explorer';

  return `CONTEXT: You are Jinu, KStoryBridge's expert Korean content curator. You have deep knowledge of Korean entertainment including manhwa, webtoons, dramas, movies, and novels. You excel at personalized recommendations and engaging conversations about Korean culture and storytelling.

USER PROFILE:
- Name: ${userProfile.full_name || 'Fellow Korean content enthusiast'}
- Status: ${tierDescription}
- Account: ${userProfile.account_type === 'buyer' ? 'Content Buyer' : 'Content Creator'}
- Experience Level: ${userProfile.tier === 'basic' ? 'Getting started' : userProfile.tier === 'pro' ? 'Experienced' : 'Expert'}

CONVERSATION CONTEXT:
${conversationHistory.length > 0 ? conversationHistory.map(msg =>
  `${msg.role === 'user' ? 'User' : 'Jinu'}: ${msg.content}`
).join('\n') : 'This is the start of our conversation.'}

${searchResults.length > 0 ? `
RELEVANT KOREAN CONTENT DISCOVERED:
${searchResults.map((result, idx) => {
  const title = result.title_name_en || result.title_name_kr;
  const genres = Array.isArray(result.genre) ? result.genre.join(', ') : result.genre || 'Mixed Genre';
  const matchScore = (result.similarity * 100).toFixed(0);

  return `${idx + 1}. "${title}" (${matchScore}% match)
   • Genre: ${genres}
   • Tone: ${result.tone || 'Varied'}
   • Synopsis: ${result.synopsis?.substring(0, 120) || 'Compelling Korean storytelling'}${result.synopsis?.length > 120 ? '...' : ''}`;
}).join('\n\n')}

SEARCH INSIGHTS: Found ${searchResults.length} titles matching the user's interests with high relevance scores.` : ''}

CURRENT QUERY: "${userQuery}"

RESPONSE GUIDELINES:
1. **Personality**: Be Jinu - passionate, knowledgeable, and genuinely excited about Korean content
2. **Recommendations**: IMPORTANT - Only recommend ACTUAL titles from the search results above. Never invent or create fictional titles. If search results exist, enthusiastically recommend the most relevant titles using quotes with their EXACT names
3. **Engagement**: Ask thoughtful follow-up questions about preferences, genres, or specific interests
4. **Cultural Context**: Share insights about Korean storytelling trends, cultural elements, or industry highlights
5. **Personalization**: Tailor recommendations based on user's tier and conversation history
6. **Structure**: Keep responses conversational but organized, with clear title recommendations
7. **Follow-ups**: End with 2-3 engaging questions or suggestions to continue the conversation
8. **Accuracy**: NEVER make up title names. Only mention titles that appear in the search results provided above

Focus on creating an engaging, personalized experience that helps discover amazing Korean content!`;
}
```

### Legacy Mode Prompt

**File**: `openaiService.ts`

```typescript
const prompt = `
${optimizedKoreanIPContext}  // Context with 6 relevant titles
${conversationHistory}       // Last 6 messages

You are Alex, an enthusiastic Korean content curator at KStoryBridge who absolutely loves discussing Korean entertainment. You're chatting with someone who shares your passion for discovering amazing stories.

🎭 Your Personality:
- Genuinely excited about Korean stories and culture
- Speak like a knowledgeable friend, not a database
- Use natural expressions: "Oh, you'd love this!", "I think you might really enjoy...", "That reminds me of..."
- Ask engaging questions: "Have you tried anything like that before?", "What drew you to that genre?"
- Share brief cultural insights when relevant

💬 Communication Style:
- Natural conversation flow - no rigid formatting or mandatory sections
- Respond to the user's emotions and enthusiasm
- Use casual transitions between topics
- Sound excited about recommendations without being pushy
- Ask follow-up questions to keep the conversation engaging

🎯 Recommendation Approach:
- Start by connecting emotionally with what the user is looking for
- Naturally weave in 2-3 title suggestions from our database when relevant
- Use exact title names from the numbered list above, but mention them conversationally
- If we don't have exact matches, acknowledge this naturally: "We don't have that specific one, but based on what you're looking for, I think you'd really enjoy..."
- Explain appeal in personal terms, not just features
- Never apologize for what we don't have - get excited about what we do have

User just said: "${userQuery}"

Respond as if you're having a friendly, engaging conversation about Korean entertainment. Be natural, enthusiastic, and helpful while mentioning relevant titles from our collection when appropriate.`;
```

**Model Parameters**:
```typescript
{
  model: "gpt-4o-mini",           // Cost-effective for general queries
  max_tokens: 700,                // Enough for 2-3 title recommendations + context
  temperature: 0.8,               // Higher = more natural, varied responses
  presence_penalty: 0.3,          // Encourage diverse vocabulary
  frequency_penalty: 0.2          // Reduce repetitive phrasing
}
```

### Key Prompt Strategies

✅ **DO:**
- Ground recommendations in actual search results
- Use specific title names with quotes
- Include similarity scores to show relevance
- Add conversational personality (Jinu/Alex)
- Provide cultural context
- Ask engaging follow-up questions
- Personalize based on user tier

❌ **DON'T:**
- Give examples of fictional titles (AI will copy the pattern)
- Use rigid formatting (bullets, numbered lists)
- Apologize excessively for missing content
- Make recommendations without search results
- Assume user knowledge level

---

## 🌍 ENVIRONMENT & EXECUTION

### Production Architecture

```
User Browser
    │
    ├─→ [Authentication]
    │   Supabase JWT Token
    │
    └─→ [Edge Function]
        /functions/chat-orchestrator
            │
            ├─→ [OpenAI API]
            │   • Model: GPT-4-turbo-preview
            │   • API Key: Supabase Secrets
            │   • Streaming: Server-Sent Events
            │
            ├─→ [Vector Search]
            │   • PostgreSQL pgvector
            │   • Embeddings: text-embedding-ada-002
            │
            └─→ [Response]
                • Save to database
                • Stream to client
```

**Configuration**:
```bash
# Supabase Edge Function Secrets
OPENAI_API_KEY=sk-proj-xxxxx
SUPABASE_URL=https://dlrnrgcoguxlkkcitlpd.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxxxx
```

**Deployment**:
```bash
# Deploy edge function
supabase functions deploy chat-orchestrator

# Set secrets
supabase secrets set OPENAI_API_KEY=sk-proj-xxxxx
```

### Development Architecture

```
User Browser
    │
    └─→ [Direct OpenAI Client]
        openaiService.ts
            │
            ├─→ [OpenAI API]
            │   • Model: GPT-4o-mini
            │   • API Key: .env.local
            │   • Warning: Exposed to browser
            │
            ├─→ [Vector Search]
            │   • Supabase Database
            │   • Fallback to text search
            │
            └─→ [Response]
                • Return JSON
                • No streaming
```

**Configuration** (`.env.local`):
```bash
# OpenAI
VITE_OPENAI_ENABLED=true
VITE_OPENAI_API_KEY=sk-proj-xxxxx

# Execution mode
VITE_FORCE_OPENAI_PRODUCTION=false  # false = direct client
VITE_USE_LOCAL_BACKEND=false        # false = no local backend

# Supabase
VITE_SUPABASE_URL=https://dlrnrgcoguxlkkcitlpd.supabase.co
VITE_SUPABASE_ANON_KEY=xxxxx
```

### Caching Strategy

**Unified Cache Manager** (`openaiService.ts`):
```typescript
class UnifiedCacheManager {
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private static caches = new Map<string, CacheEntry<unknown>>();

  static set<T>(key: string, data: T, environment: string): void {
    this.caches.set(key, {
      data,
      timestamp: Date.now(),
      environment
    });
  }

  static get<T>(key: string, environment: string): T | null {
    const entry = this.caches.get(key);
    if (!entry) return null;

    const isExpired = (Date.now() - entry.timestamp) >= this.CACHE_DURATION;
    if (isExpired) {
      this.caches.delete(key);
      return null;
    }

    return entry.data as T;
  }
}
```

**Cached Items**:
- Titles database (5 min)
- Query embeddings (5 min)
- Search results (5 min)

---

## 🎨 PRESENTATION LAYER

### UI Layout (`Chat.tsx`)

```
┌─────────────────────────────────────────────────────────┐
│ HEADER                                                  │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 🤖 AI ASSISTANT  [BETA]  [Enhanced ✓]              │ │
│ └─────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────┤
│ MESSAGES (Scrollable)                                   │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ [Bot Avatar] Jinu                                   │ │
│ │ Hey there! 👋 I'm Jinu, your Korean content guide. │ │
│ │ What kind of stories are you in the mood for?      │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ You                              [User Avatar]      │ │
│ │ Show me romantic comedy webtoons with strong        │ │
│ │ female leads                                        │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ [Bot Avatar] Jinu                                   │ │
│ │ Great choice! I found some perfect matches for you: │ │
│ │                                                     │ │
│ │ ┌─────────────────────────────────────────────┐   │ │
│ │ │ [IMAGE] First Love                          │   │ │
│ │ │         첫사랑                              │   │ │
│ │ │         Romance • Comedy   Lighthearted     │   │ │
│ │ │         A charming story about...           │   │ │
│ │ │         [👍 Helpful] [👎 Not Helpful]       │   │ │
│ │ └─────────────────────────────────────────────┘   │ │
│ │                                                     │ │
│ │ ┌─────────────────────────────────────────────┐   │ │
│ │ │ [IMAGE] My Secret Romance                   │   │ │
│ │ │         나의 비밀 로맨스                    │   │ │
│ │ │         Romance • Comedy   Heartwarming     │   │ │
│ │ │         An office romance with a twist...   │   │ │
│ │ │         [👍 Helpful] [👎 Not Helpful]       │   │ │
│ │ └─────────────────────────────────────────────┘   │ │
│ │                                                     │ │
│ │ Try searching:                                      │ │
│ │ [comedy with strong female lead]                   │ │
│ │ [workplace romance webtoons]                       │ │
│ └─────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────┤
│ INPUT                                                   │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Type your message...                       [Send] │ │
│ │ Press Enter to send, Shift+Enter for new line      │ │
│ └─────────────────────────────────────────────────────┘ │
│ [Standard Mode ⟷ Enhanced Mode]                       │
└─────────────────────────────────────────────────────────┘
```

### Key UI Components

**Title Card** (`TitleCard.tsx`):
```tsx
<div className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
     onClick={() => navigate(`/buyers/titles/${title.title_id}`)}>
  <div className="flex gap-4">
    {/* Cover Image */}
    <img
      src={title.title_image}
      alt={title.title_name_en}
      className="w-20 h-28 object-cover rounded"
    />

    {/* Content */}
    <div className="flex-1">
      <h3 className="font-semibold text-lg">{title.title_name_en}</h3>
      <p className="text-sm text-gray-600">{title.title_name_kr}</p>

      {/* Genres & Tone */}
      <div className="flex gap-2 mt-2">
        {title.genre.map(g => (
          <span className="text-xs bg-gray-100 px-2 py-1 rounded">{g}</span>
        ))}
        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
          {title.tone}
        </span>
      </div>

      {/* Synopsis Preview */}
      <p className="text-sm text-gray-700 mt-2 line-clamp-2">
        {title.synopsis}
      </p>

      {/* Feedback Buttons */}
      <div className="flex gap-2 mt-3">
        <button className="text-xs text-gray-600 hover:text-green-600">
          👍 Helpful
        </button>
        <button className="text-xs text-gray-600 hover:text-red-600">
          👎 Not Helpful
        </button>
      </div>
    </div>
  </div>
</div>
```

**Suggested Query Chips**:
```tsx
<div className="flex gap-2 flex-wrap mt-3">
  {suggestedQueries.map((query, idx) => (
    <button
      key={idx}
      onClick={() => handleSuggestedQuery(query)}
      className="text-sm bg-blue-50 text-blue-700 px-3 py-1 rounded-full
                 hover:bg-blue-100 transition-colors"
    >
      {query}
    </button>
  ))}
</div>
```

### Features

✅ **Implemented**:
- Real-time streaming responses (Orchestrator mode)
- Message history with truncation (greeting + last 4 messages)
- Clickable title cards → navigate to detail page
- Suggested query chips
- Title feedback system (helpful/not helpful)
- Mode toggle (Standard ↔ Enhanced)
- Mobile-responsive layout
- Session persistence (24 hours)
- Loading states with skeleton UI
- Error handling with retry

⏳ **Planned**:
- Voice input
- Image-based search
- Multi-language support (beyond EN/KR)
- Conversation export
- Advanced filtering UI

---

## 📊 PERFORMANCE METRICS

### Current System Performance

| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| **Response Time** | 2-5s | < 2s | 🟡 Needs Optimization |
| **Vector Search** | 1-2s | < 1s | ✅ Good |
| **Text Search** | < 1s | < 500ms | ✅ Excellent |
| **Accuracy** | 70-80% | > 85% | 🟡 Needs Improvement |
| **Cache Hit Rate** | 60% | > 75% | 🟡 Needs Optimization |
| **Token Usage** | 500-800 | < 600 | 🟡 Optimize Prompts |
| **Hallucination Rate** | 5-10% | < 2% | 🔴 Critical Issue |

### Cost Analysis

**Per-Query Costs** (GPT-4o-mini):
- Embedding generation: ~$0.0001
- LLM completion: ~$0.002 - $0.004
- Total per query: ~$0.002 - $0.004

**Monthly Estimates** (1000 queries/month):
- Embedding: $0.10
- Completions: $2.00 - $4.00
- Total: ~$2.10 - $4.10/month

### Database Query Performance

```sql
-- Vector search (with HNSW index)
EXPLAIN ANALYZE
SELECT * FROM match_titles_by_embedding(query_embedding, 0.65, 8);
-- Result: 50-200ms (depends on index quality)

-- Text search (full table scan)
EXPLAIN ANALYZE
SELECT * FROM titles WHERE title_name_en ILIKE '%romance%';
-- Result: 100-500ms (no index optimization yet)
```

---

## 🚀 AREAS FOR IMPROVEMENT

### 🔴 HIGH PRIORITY

#### 1. Hallucination Prevention

**Issue**: AI invents fictional titles not in database (~5-10% of responses)

**Root Cause**:
- Weak prompt grounding
- No post-processing validation
- AI pattern-matches from examples

**Solution 1: Post-Processing Validation**

```typescript
// Add to openaiService.ts
function validateTitleMentions(
  response: string,
  availableTitles: Title[]
): { valid: boolean; error?: string; sanitized?: string } {

  // Extract all quoted titles from AI response
  const quotedTitles = response.match(/"([^"]+)"/g)?.map(t => t.replace(/"/g, '')) || [];

  const availableTitleNames = new Set([
    ...availableTitles.map(t => t.title_name_en?.toLowerCase()),
    ...availableTitles.map(t => t.title_name_kr?.toLowerCase())
  ].filter(Boolean));

  const invalidTitles: string[] = [];

  for (const quotedTitle of quotedTitles) {
    const normalized = quotedTitle.toLowerCase().trim();

    // Check if this title exists in our database
    if (!availableTitleNames.has(normalized)) {
      // Double-check with fuzzy matching (80% similarity)
      const fuzzyMatch = availableTitles.find(t =>
        similarity(normalized, t.title_name_en?.toLowerCase()) > 0.8 ||
        similarity(normalized, t.title_name_kr?.toLowerCase()) > 0.8
      );

      if (!fuzzyMatch) {
        invalidTitles.push(quotedTitle);
      }
    }
  }

  if (invalidTitles.length > 0) {
    return {
      valid: false,
      error: `AI mentioned unknown titles: ${invalidTitles.join(', ')}`,
      sanitized: response.replace(
        new RegExp(invalidTitles.map(t => `"${t}"`).join('|'), 'g'),
        '[Title not found]'
      )
    };
  }

  return { valid: true };
}

// Usage in generateChatResponse()
const validation = validateTitleMentions(aiResponse, relevantTitles);
if (!validation.valid) {
  console.error('❌ Hallucination detected:', validation.error);
  // Option A: Retry with stronger prompt
  // Option B: Return sanitized response
  // Option C: Generic fallback message
}
```

**Solution 2: Stronger Prompt Constraints**

```typescript
const ANTI_HALLUCINATION_PROMPT = `
CRITICAL CONSTRAINT - READ CAREFULLY:
You MUST ONLY mention titles from the numbered list above.
Before mentioning any title name, verify it exists in the numbered list.
If a title is not in the list, you MUST NOT invent or guess a title name.

Instead, say:
- "We don't have that specific title in our collection yet"
- "I couldn't find an exact match, but here are similar titles from our database:"
- "Based on your interests, you might enjoy these titles from our catalog:"

NEVER create fictional title names. NEVER make up Korean titles.
If you're unsure, acknowledge the gap gracefully and recommend from the list.
`;

// Add this to the system prompt in buildMasterPrompt()
```

**Solution 3: Structured Output (GPT-4 Feature)**

```typescript
// Use OpenAI's structured output feature (GPT-4 only)
const completion = await openai.chat.completions.create({
  model: "gpt-4-turbo-preview",
  messages: [...],
  response_format: {
    type: "json_schema",
    json_schema: {
      name: "chatbot_response",
      schema: {
        type: "object",
        properties: {
          message: { type: "string" },
          recommended_title_ids: {
            type: "array",
            items: { type: "string" },
            description: "Array of title_id UUIDs from the provided list"
          },
          suggested_queries: {
            type: "array",
            items: { type: "string" }
          }
        },
        required: ["message", "recommended_title_ids"]
      }
    }
  }
});

// Then fetch titles by IDs (guaranteed to exist)
const recommendedTitles = await titlesService.getTitlesByIds(
  response.recommended_title_ids
);
```

#### 2. Search Quality Improvement

**Issue**: Vector search threshold (0.65) too high, misses relevant titles

**Current Behavior**:
```
Query: "romantic comedy webtoons"
Threshold: 0.65
Results: 2-3 titles (too few)

Query: "action thriller with revenge"
Threshold: 0.65
Results: 1 title (too restrictive)
```

**Solution: Dynamic Threshold**

```typescript
// Add to vectorSearchService.ts
async adaptiveVectorSearch(
  query: string,
  options?: {
    minResults?: number;      // Default: 5
    maxResults?: number;      // Default: 10
    startThreshold?: number;  // Default: 0.70
    minThreshold?: number;    // Default: 0.50
  }
): Promise<VectorSearchResult[]> {

  const config = {
    minResults: options?.minResults || 5,
    maxResults: options?.maxResults || 10,
    startThreshold: options?.startThreshold || 0.70,
    minThreshold: options?.minThreshold || 0.50
  };

  let threshold = config.startThreshold;
  let results: VectorSearchResult[] = [];

  // Gradually lower threshold until we get enough results
  while (results.length < config.minResults && threshold >= config.minThreshold) {
    results = await this.vectorSearch(query, undefined, {
      threshold,
      limit: config.maxResults
    });

    if (results.length < config.minResults) {
      threshold -= 0.05; // Lower by 5% each iteration
      console.log(`🔄 Lowering threshold to ${threshold} (found ${results.length} results)`);
    }
  }

  // Fallback to text search if still not enough
  if (results.length < config.minResults) {
    console.warn('⚠️ Vector search insufficient, using hybrid approach');
    const textResults = await textSearch(query);
    results = [...results, ...textResults].slice(0, config.maxResults);
  }

  return results.slice(0, config.maxResults);
}
```

**Solution: Query Expansion**

```typescript
// Add to embeddingService.ts
async expandQuery(query: string): Promise<string[]> {
  const synonyms: Record<string, string[]> = {
    'romantic': ['romance', 'love story', 'relationship'],
    'comedy': ['funny', 'humorous', 'lighthearted', 'romcom'],
    'action': ['fighting', 'combat', 'martial arts', 'adventure'],
    'thriller': ['suspense', 'mystery', 'psychological'],
    'fantasy': ['magic', 'supernatural', 'otherworld'],
    'drama': ['emotional', 'slice of life', 'realistic']
  };

  const queryWords = query.toLowerCase().split(/\s+/);
  const expanded = new Set([query]);

  queryWords.forEach(word => {
    if (synonyms[word]) {
      synonyms[word].forEach(syn => {
        const expandedQuery = query.toLowerCase().replace(word, syn);
        expanded.add(expandedQuery);
      });
    }
  });

  return Array.from(expanded);
}

// Usage: Search multiple query variations and merge results
const queryVariations = await expandQuery(userQuery);
const allResults = await Promise.all(
  queryVariations.map(q => vectorSearch(q))
);
const mergedResults = deduplicateAndRankResults(allResults.flat());
```

#### 3. Context Management

**Issue**: Only last 6 messages used; loses conversation thread

**Solution: Conversation Summarization**

```typescript
// Add to chatOrchestratorService.ts
async summarizeConversationHistory(
  messages: ChatMessage[]
): Promise<string> {

  // Only summarize if history is long enough
  if (messages.length <= 10) {
    return messages.map(m => `${m.role}: ${m.content}`).join('\n');
  }

  // Separate old messages from recent context
  const oldMessages = messages.slice(0, -10);
  const recentMessages = messages.slice(-10);

  // Generate summary of old messages
  const summaryPrompt = `Summarize this conversation history in 2-3 sentences, focusing on:
- User's content preferences (genres, tones, themes)
- Previously recommended titles
- User feedback (liked/disliked)

Conversation:
${oldMessages.map(m => `${m.role}: ${m.content}`).join('\n')}

Provide a concise summary:`;

  const summary = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: summaryPrompt }],
    max_tokens: 200,
    temperature: 0.3
  });

  // Combine summary with recent messages
  return `
CONVERSATION SUMMARY:
${summary.choices[0].message.content}

RECENT EXCHANGES:
${recentMessages.map(m => `${m.role}: ${m.content}`).join('\n')}
`;
}
```

### 🟡 MEDIUM PRIORITY

#### 4. User Personalization

**Current**: Basic tier-based context only

**Enhancement**: Track detailed user preferences

```typescript
// Create new table: user_content_preferences
interface UserContentPreferences {
  user_id: string;
  preferred_genres: string[];       // ["Romance", "Comedy", "Action"]
  preferred_tones: string[];        // ["Lighthearted", "Intense"]
  preferred_formats: string[];      // ["Webtoon", "Manhwa"]
  disliked_genres: string[];        // User explicitly dislikes
  view_history: string[];           // title_ids user has viewed
  click_patterns: Record<string, number>;  // title_id -> click count
  search_patterns: string[];        // Common search queries
  last_updated: timestamp;
}

// Update preferences based on user behavior
async function updateUserPreferences(userId: string, interaction: {
  titleId?: string;
  query?: string;
  clicked?: boolean;
  rated?: number;
}) {
  const prefs = await getUserPreferences(userId);

  // Update based on interaction
  if (interaction.clicked && interaction.titleId) {
    const title = await titlesService.getTitleById(interaction.titleId);

    // Boost preferred genres
    title.genre.forEach(genre => {
      prefs.preferred_genres = addToPreferences(prefs.preferred_genres, genre);
    });

    // Track click patterns
    prefs.click_patterns[interaction.titleId] =
      (prefs.click_patterns[interaction.titleId] || 0) + 1;
  }

  await saveUserPreferences(userId, prefs);
}

// Use in search boosting
function applyPersonalizationBoost(
  results: VectorSearchResult[],
  userPrefs: UserContentPreferences
): VectorSearchResult[] {

  return results.map(result => {
    let boost = 1.0;

    // Boost preferred genres (+20%)
    if (result.genre?.some(g => userPrefs.preferred_genres.includes(g))) {
      boost *= 1.2;
    }

    // Penalize disliked genres (-30%)
    if (result.genre?.some(g => userPrefs.disliked_genres.includes(g))) {
      boost *= 0.7;
    }

    // Boost preferred tones (+15%)
    if (userPrefs.preferred_tones.includes(result.tone)) {
      boost *= 1.15;
    }

    // Penalize recently viewed titles (-40%)
    if (userPrefs.view_history.includes(result.title_id)) {
      boost *= 0.6;
    }

    return {
      ...result,
      similarity: result.similarity * boost,
      personalization_boost: boost
    };
  }).sort((a, b) => b.similarity - a.similarity);
}
```

#### 5. Feedback Loop Integration

**Current**: Feedback collected but not used

**Enhancement**: Training data pipeline

```typescript
// Collect structured training data
interface TrainingExample {
  query: string;
  context: {
    user_tier: string;
    conversation_history: string[];
    search_results: string[];       // title_ids
  };
  response: string;                 // AI-generated response
  feedback: {
    rating: number;                 // 1-5 stars
    helpful_votes: number;
    not_helpful_votes: number;
    clicked_titles: string[];       // title_ids user clicked
    time_spent_reading: number;     // seconds
  };
  outcome: 'positive' | 'negative' | 'neutral';
}

// Save training examples
async function saveTrainingExample(example: TrainingExample) {
  await supabase.from('chatbot_training_data').insert({
    query: example.query,
    context: example.context,
    response: example.response,
    feedback: example.feedback,
    outcome: example.outcome,
    created_at: new Date().toISOString()
  });
}

// Export for fine-tuning
async function exportTrainingData(options: {
  minRating?: number;
  outcomeFilter?: 'positive' | 'negative' | 'neutral';
  limit?: number;
}) {
  const { data } = await supabase
    .from('chatbot_training_data')
    .select('*')
    .gte('feedback->rating', options.minRating || 4)
    .eq('outcome', options.outcomeFilter || 'positive')
    .limit(options.limit || 1000);

  // Format for OpenAI fine-tuning
  const trainingFile = data.map(example => ({
    messages: [
      {
        role: "system",
        content: buildMasterPrompt({
          searchResults: example.context.search_results,
          conversationHistory: example.context.conversation_history,
          userQuery: example.query
        })
      },
      {
        role: "assistant",
        content: example.response
      }
    ]
  }));

  // Save as JSONL
  const jsonl = trainingFile.map(t => JSON.stringify(t)).join('\n');
  await fs.writeFile('training_data.jsonl', jsonl);

  console.log(`✅ Exported ${trainingFile.length} training examples`);
}
```

#### 6. Performance Optimization

**Cache Common Queries**:

```typescript
// Pre-generate embeddings for popular queries
const COMMON_QUERIES = [
  "romantic comedy webtoons",
  "action thriller manhwa",
  "fantasy novels with magic",
  "slice of life stories",
  "revenge thriller"
];

async function warmUpCache() {
  console.log('🔥 Warming up cache with common queries...');

  for (const query of COMMON_QUERIES) {
    const embedding = await embeddingService.generateEmbedding(query);
    UnifiedCacheManager.set(`embedding:${query}`, embedding, 'production');

    const results = await vectorSearchService.vectorSearch(query);
    UnifiedCacheManager.set(`results:${query}`, results, 'production');

    console.log(`✅ Cached: "${query}" (${results.length} results)`);
  }
}

// Run on server startup or cron job
warmUpCache();
```

### 🟢 LOW PRIORITY / FUTURE

#### 7. Multimodal Search
- Image-based search (upload cover image, find similar)
- Voice input support with speech-to-text
- Visual similarity clustering

#### 8. Advanced Analytics
- A/B test different prompts
- Conversion tracking (chat → title view → pitch download)
- Query intent classification (browsing vs. purchasing intent)

#### 9. Collaborative Filtering
- "Users who liked X also liked Y"
- Implicit recommendations without explicit queries
- Social features (share recommendations)

---

## 🎯 RECOMMENDED NEXT STEPS

### Immediate Actions (This Week)

1. **Deploy Hallucination Prevention**
   - [ ] Add post-processing validation to `openaiService.ts`
   - [ ] Strengthen prompt constraints in `buildMasterPrompt()`
   - [ ] Test with 50 diverse queries
   - [ ] Monitor hallucination rate (target: < 2%)

2. **Optimize Search Threshold**
   - [ ] Implement adaptive threshold in `vectorSearchService.ts`
   - [ ] Lower default threshold from 0.65 to 0.55
   - [ ] Add query expansion for common terms
   - [ ] Measure accuracy improvement

3. **Improve Logging**
   - [ ] Add structured logging for all AI requests
   - [ ] Track hallucination occurrences
   - [ ] Monitor search quality metrics
   - [ ] Set up alerting for errors

### Short-Term (This Month)

1. **Conversation Summarization**
   - [ ] Implement `summarizeConversationHistory()`
   - [ ] Update `buildMasterPrompt()` to use summaries
   - [ ] Test with long conversations (20+ messages)
   - [ ] Measure context quality improvement

2. **User Preference Tracking**
   - [ ] Create `user_content_preferences` table
   - [ ] Track click patterns and view history
   - [ ] Implement preference-based search boosting
   - [ ] A/B test personalized vs. non-personalized

3. **Feedback Training Pipeline**
   - [ ] Create `chatbot_training_data` table
   - [ ] Implement training data collection
   - [ ] Export 1000 examples for analysis
   - [ ] Evaluate fine-tuning viability

### Medium-Term (Next Quarter)

1. **Model Fine-Tuning**
   - [ ] Collect 5000+ rated examples
   - [ ] Fine-tune GPT-4o-mini on KStoryBridge data
   - [ ] Compare fine-tuned vs. base model performance
   - [ ] Deploy if accuracy improvement > 10%

2. **Advanced Search Features**
   - [ ] Hybrid search (vector + text combined)
   - [ ] Multi-query expansion
   - [ ] Semantic clustering of results
   - [ ] Contextual re-ranking

3. **Analytics Dashboard**
   - [ ] Build internal analytics UI
   - [ ] Track query patterns and trends
   - [ ] Monitor model performance metrics
   - [ ] A/B testing framework

---

## 📚 RELATED DOCUMENTATION

- **Database Schema**: `DATABASE_SCHEMA.md`
- **API Documentation**: `API_DOCUMENTATION.md`
- **Deployment Guide**: `DEPLOYMENT_GUIDE.md`
- **Testing Strategy**: `TESTING_STRATEGY.md`

---

## 🤝 CONTRIBUTING

When making changes to the chatbot system:

1. **Test Thoroughly**: Test with at least 20 diverse queries
2. **Monitor Hallucinations**: Check for invented titles
3. **Measure Performance**: Track response times and accuracy
4. **Update Documentation**: Keep this file up-to-date
5. **Log Everything**: Use structured logging for debugging

---

## 📞 SUPPORT

For issues or questions:
- **Technical**: Review logs in Supabase Edge Function dashboard
- **Model Issues**: Check OpenAI API status and quotas
- **Database**: Verify pgvector extension and indexes
- **Performance**: Review cache hit rates and query times

**Last Updated**: 2025-01-26 by AI Analysis