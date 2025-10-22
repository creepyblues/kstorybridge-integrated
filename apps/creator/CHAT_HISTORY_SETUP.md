# Chat History Recording System

This document describes the comprehensive chat history recording system implemented for the OpenAI chatbot.

## 🚀 Features Implemented

### ✅ Complete Chat Tracking
- **User Prompts**: Every message sent by users
- **AI Responses**: All OpenAI-generated responses  
- **Response Times**: AI processing time in milliseconds
- **Session Management**: Start/end times and session types
- **Token Usage**: Ready to track OpenAI token consumption

### ✅ Advanced Interaction Tracking
- **Title Clicks**: When users click on title names in AI responses
- **Title Views**: When users click on recommended title cards  
- **Suggestion Clicks**: When users click on AI-suggested queries
- **Session Events**: Session start/end tracking

### ✅ Recommendation Analytics
- **Title Recommendations**: All titles suggested by AI
- **Recommendation Scores**: AI confidence/relevance scores
- **Recommendation Context**: Why each title was recommended
- **Suggested Queries**: AI-generated follow-up questions

## 🗄️ Database Schema

### Core Tables Created:
1. **`chat_sessions`** - Session management and metadata
2. **`chat_messages`** - Individual user/AI messages  
3. **`chat_title_recommendations`** - AI-recommended titles
4. **`chat_interactions`** - User click/interaction tracking
5. **`chat_suggested_queries`** - AI-suggested follow-up queries

### Key Features:
- **RLS Security**: Row-level security ensures users only see their data
- **Optimized Indexes**: Fast queries for analytics and reporting
- **JSONB Metadata**: Flexible additional data storage
- **Audit Trail**: Complete timestamp tracking

## 🔧 Setup Instructions

### 1. Database Migration
```bash
# Run the migration to create chat history tables
supabase db push

# Or manually apply the migration file:
# apps/dashboard/supabase/migrations/20250829000000-create-chat-history.sql
```

### 2. Service Integration
The `chatHistoryService.ts` provides a complete API:

```typescript
import { chatHistoryService } from '@/services/chatHistoryService';

// Create session
const session = await chatHistoryService.createSession({
  user_id: user.id,
  user_email: user.email,
  session_type: 'openai'
});

// Record messages
await chatHistoryService.recordMessage({
  session_id: session.id,
  user_id: user.id,
  message_type: 'user_prompt',
  content: userMessage,
});

// Track interactions  
await chatHistoryService.recordInteraction({
  session_id: session.id,
  user_id: user.id,
  interaction_type: 'title_click',
  target_id: titleId,
  target_title: titleName
});
```

## 📊 Analytics & Reporting

### New Pages Added:
1. **`/chat-history`** - Complete chat history analytics dashboard
2. Updated **`/profile`** - Added "Chat History" button

### Analytics Features:
- **Session Overview**: Total sessions, messages, interactions
- **Session Details**: Individual conversation breakdowns  
- **Interaction Tracking**: Click patterns and user behavior
- **Title Analytics**: Most recommended and clicked titles
- **Time Analysis**: Session duration and response times

## 🎯 What Gets Tracked

### Every User Action:
- ✅ **Message Send**: User query → Database record
- ✅ **AI Response**: OpenAI response → Database record + timing
- ✅ **Title Click**: Click on title name in text → Interaction record
- ✅ **Card Click**: Click on recommended title card → View record  
- ✅ **Suggestion Click**: Click on suggested query → Suggestion record
- ✅ **Session End**: When user leaves → End timestamp

### Rich Metadata Captured:
- **User Context**: Email, account type, session info
- **AI Context**: Response time, token usage (when available)
- **Interaction Context**: Click position, source, matched titles
- **Title Context**: Recommendation scores, reasoning, match quality

## 🔍 Data Examples

### Session Record:
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "user_email": "user@example.com", 
  "session_type": "openai",
  "started_at": "2025-08-29T10:00:00Z",
  "ended_at": "2025-08-29T10:15:00Z"
}
```

### Interaction Record:
```json
{
  "interaction_type": "title_click",
  "target_title": "The Owner is Two-Time",
  "metadata": {
    "clicked_title_name": "The Owner is Two-Time (사장님은 투타임)",
    "found_match": true,
    "matched_title_id": "TITLE_123",
    "source": "ai_response_text"
  }
}
```

### Title Recommendation:
```json
{
  "title_id": "TITLE_123",
  "title_name_en": "The Owner is Two-Time",
  "title_name_kr": "사장님은 투타임", 
  "recommendation_score": 0.87,
  "recommendation_reason": "AI recommended based on user query: romantic fantasy stories"
}
```

## 🚀 Benefits

### For Product Analytics:
- **User Engagement**: Which titles generate most interest
- **AI Performance**: Response quality and accuracy tracking
- **Content Discovery**: How users find and interact with content
- **UX Optimization**: Click patterns and user journey analysis

### For Business Intelligence:
- **Content Popularity**: Most recommended/clicked titles
- **User Behavior**: Session lengths, interaction patterns
- **AI Effectiveness**: Recommendation success rates
- **Feature Usage**: Which chatbot features are most used

## 🔧 Technical Notes

### Performance Optimizations:
- **Async Recording**: All database writes are non-blocking
- **Batch Operations**: Multiple recommendations recorded together
- **Indexed Queries**: Fast analytics queries with proper indexes
- **Error Handling**: Robust error handling that won't break chat flow

### Privacy & Security:
- **RLS Policies**: Users can only access their own data
- **Data Retention**: Built-in cleanup functions for old sessions
- **GDPR Compliance**: User data isolated and deletable
- **Audit Trail**: Complete activity logging

## 🎉 Ready for Production

The system is production-ready with:
- ✅ Complete error handling
- ✅ Database security (RLS)  
- ✅ Performance optimizations
- ✅ Analytics dashboard
- ✅ TypeScript types
- ✅ Build verification

Users can now have fully tracked conversations with comprehensive analytics and insights into their AI interaction patterns!