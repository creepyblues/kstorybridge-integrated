# Title Intelligence System - Quick Start Guide

**For Admin Users** | Last Updated: 2025-11-23

---

## Quick Access

- **Tools Dashboard**: http://localhost:8084/tools (or `/tools` in production)
- **Edge Function**: Deployed to `title-intelligence`
- **Database Table**: `title_intelligence_data`

---

## How to Use

### 1. Access Tools Dashboard

1. Sign in to Creator app as admin user
2. Look for "⚡ Tools" menu item in sidebar (only visible to admins)
3. Click to navigate to Tools Dashboard

### 2. Collect Intelligence

**From Tools Dashboard:**
1. Click "Title Investigator" card

**Or navigate directly:**
- URL: `/tools/title-investigator`

**Fill out the form:**
1. Enter title name (Korean or English)
   - Example: "나 혼자만 레벨업" or "Solo Leveling"
2. Select data sources (checkboxes):
   - ✅ Naver Webtoon (default)
   - ✅ Kakao Page (default)
   - ☐ Reddit
   - ☐ Archive of Our Own
3. Click "Collect Intelligence"

**What happens:**
- Edge function triggers
- Scrapers execute sequentially (10-30 seconds)
- You're automatically redirected to results page

### 3. View Results

**Investigation Detail Page:**
- Shows collection metadata (who, when, status)
- Displays raw data from each source (JSON format)
- Shows any collection errors
- Provides verification button

**Status Badges:**
- 🟢 **Completed**: All sources succeeded
- 🟡 **Partial**: Some sources succeeded, some failed
- 🔴 **Failed**: All sources failed
- 🔵 **In Progress**: Currently collecting

### 4. Verify Data

1. Review raw data from each source
2. Check for errors or anomalies
3. Click "Mark as Verified" when ready
4. Record updates to `verification_status: completed`

### 5. View Collection History

**From Tools Dashboard:**
- Scroll to "Recent Intelligence Collections" section
- Click any record to view details
- See status, date, sources, and ingestion status

---

## Current Limitations (Placeholder Scrapers)

⚠️ **Important**: All scrapers currently return mock/placeholder data:

- **Naver**: Returns empty data structure
- **Kakao**: Returns empty data structure
- **Reddit**: Returns empty data structure
- **AO3**: Returns empty data structure

**Why?**
- System architecture and UI are fully functional
- Real scraping requires Playwright (Naver/Kakao) and API credentials (Reddit)
- Placeholder data allows testing the complete workflow

**What works:**
- ✅ Admin access control
- ✅ Collection triggering
- ✅ Database record creation
- ✅ Sequential execution with rate limiting
- ✅ Status tracking
- ✅ Error handling
- ✅ UI display
- ✅ Verification workflow

**What's next:**
- Phase 5: Implement real scraping with Playwright and APIs

---

## Data Structure

### Raw Data Format (Placeholder)

```json
{
  "naver": {
    "source": "naver",
    "scraped_at": "2025-11-23T10:00:00Z",
    "title_found": false,
    "data": {
      "views": null,
      "rating": null,
      "subscribers": null,
      "chapters": null
    },
    "metadata": {
      "search_query": "Solo Leveling",
      "scraping_method": "placeholder"
    }
  },
  "kakao": {
    "source": "kakao",
    "scraped_at": "2025-11-23T10:03:00Z",
    "title_found": false,
    "data": {
      "views": null,
      "rating": null,
      "likes": null
    }
  }
}
```

### Expected Real Data Format

```json
{
  "naver": {
    "source": "naver",
    "scraped_at": "2025-11-23T10:00:00Z",
    "title_found": true,
    "data": {
      "views": 15000000,
      "rating": 9.8,
      "subscribers": 500000,
      "chapters": 179,
      "platform_url": "https://comic.naver.com/...",
      "genre": ["action", "fantasy"],
      "author": "Chugong"
    }
  },
  "reddit": {
    "source": "reddit",
    "scraped_at": "2025-11-23T10:03:00Z",
    "title_found": true,
    "data": {
      "posts": 2500,
      "avg_upvotes": 850,
      "avg_comments": 120,
      "top_posts": [
        {
          "title": "Solo Leveling finale discussion",
          "upvotes": 5200,
          "comments": 890,
          "url": "https://reddit.com/..."
        }
      ],
      "subreddits": ["sololeveling", "manhwa", "anime"],
      "sentiment": "positive"
    }
  }
}
```

---

## Admin Users

Current admin emails (check `admin` table):
- sungho@dadble.com
- kevin@sandstoneartists.com

**To add new admin:**
```sql
INSERT INTO admin (email, active)
VALUES ('new-admin@example.com', true);
```

---

## Testing Tips

### Test with Popular Titles
- "Solo Leveling" / "나 혼자만 레벨업"
- "Tower of God" / "신의 탑"
- "The Beginning After The End"

### Test All Sources
- Try all four sources together
- Try individual sources
- Test with invalid title names

### Test Error Scenarios
- Enter non-existent title
- Trigger collection multiple times
- Check partial failure handling

### Verify Database Records
```sql
-- View all collections
SELECT title_name_input, collection_status, created_at
FROM title_intelligence_data
ORDER BY created_at DESC;

-- View raw data for specific collection
SELECT raw_data
FROM title_intelligence_data
WHERE id = 'your-intelligence-id';

-- View collection errors
SELECT title_name_input, collection_errors
FROM title_intelligence_data
WHERE collection_status = 'partial_failure';
```

---

## Deployment Checklist

### Before Production Deploy

- [ ] Edge function deployed: `npx supabase functions deploy title-intelligence`
- [ ] Database migration applied: `npx supabase db push`
- [ ] Admin users configured in `admin` table
- [ ] Creator app built: `npm run build:creator`
- [ ] Test in staging first

### After Production Deploy

- [ ] Sign in as admin
- [ ] Verify Tools menu appears
- [ ] Test intelligence collection
- [ ] Check edge function logs
- [ ] Verify database records
- [ ] Test verification workflow

---

## Monitoring

### Edge Function Logs
Dashboard: https://supabase.com/dashboard/project/dlrnrgcoguxlkkcitlpd/functions/title-intelligence/details

### Database Queries

**Collection success rate:**
```sql
SELECT
  collection_status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM title_intelligence_data
GROUP BY collection_status;
```

**Average collection time:**
```sql
SELECT
  AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) as avg_seconds
FROM title_intelligence_data
WHERE collection_status = 'completed';
```

**Recent failures:**
```sql
SELECT
  title_name_input,
  collection_errors,
  created_at
FROM title_intelligence_data
WHERE collection_status = 'failed'
ORDER BY created_at DESC
LIMIT 10;
```

---

## Support

### Common Issues

**"Tools menu not showing"**
- Check you're signed in as admin
- Verify your email in `admin` table with `active=true`
- Clear browser cache

**"Collection failed"**
- Check edge function logs
- Verify database permissions
- Check collection_errors in database

**"Admin access required"**
- Verify JWT token is valid
- Check RLS policies on `title_intelligence_data`
- Ensure admin table has correct email

### Getting Help

1. Check edge function logs in Supabase dashboard
2. Check browser console for frontend errors
3. Query database for error details
4. Review [TITLE_INTELLIGENCE_IMPLEMENTATION.md](./TITLE_INTELLIGENCE_IMPLEMENTATION.md)

---

**Ready to test?** Navigate to http://localhost:8084/tools and start collecting intelligence! 🚀
