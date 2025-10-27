# Pitch Deck Extraction System

**Last Updated**: 2025-01-19
**Status**: ✅ v2.0 Enhanced Comprehensive Extraction

---

## Overview

Automated pitch deck analysis system that extracts 50+ structured fields from Korean IP pitch decks (webtoons, web novels, manhwa) using GPT-4o.

### Key Capabilities

- **14 data categories** extracted per deck (story world, characters, themes, market positioning, source metrics, Korean cultural elements, etc.)
- **9+ character profiles** with archetypes and relationships
- **7+ comparable titles** with platforms and context
- **Source material metrics** (views, chapters, platform)
- **Processing confidence score** (0-1) for quality assurance
- **Database integration** - Populates `title_content_analysis` table for enhanced search

---

## Quick Reference

| Component | Location/Value |
|-----------|----------------|
| **Admin UI** | `/admin/pitch-extraction-test` |
| **Edge Function** | `extract-pitch-test` (v7-comprehensive-extraction) |
| **Database Table** | `title_content_analysis` (12/15 fields populated) |
| **Cost** | ~$0.15-0.20 per deck (GPT-4o API) |
| **Data Richness** | 70-85% of deck content captured (vs 15-20% in v1.0) |

---

## Version Comparison

| Feature | v1.0 (Legacy) | v2.0 (Enhanced) |
|---------|---------------|-----------------|
| **Fields Extracted** | 6 basic | 50+ comprehensive |
| **Database Fields** | 4/15 (27%) | 12/15 (80%) |
| **Characters** | None | 9 profiles |
| **Source Metrics** | None | Views/chapters/platform |
| **Cultural Context** | None | Korean elements |
| **Comparable Titles** | 2 | 7+ with context |
| **Processing Confidence** | None | 0-1 quality score |
| **Cost** | $0.12 | $0.15-0.20 |

---

## Usage

1. **Navigate to admin UI**: `/admin/pitch-extraction-test`
2. **Select title** with pitch deck uploaded
3. **Preview extraction**: Click "Test Extract (Preview Only)"
4. **Review results**: Check all 14 data sections + confidence score
5. **Save if good**: Click "Extract & Save to Database"

---

## Documentation

- **[Complete Guide](../PITCH_DECK_EXTRACTION_GUIDE.md)** - Full system architecture, usage, troubleshooting
- **[Changelog](../PITCH_DECK_EXTRACTION_CHANGELOG.md)** - Version history, improvements, migration notes
- **[Python PDF Extractor](../../../python-pdf-extractor/README.md)** - Microservice for text extraction
- **Edge Function**: `supabase/functions/extract-pitch-test/` - GPT-4 analysis and database save

---

## Key Files

- `src/pages/admin/PitchExtractionTest.tsx` - Admin test UI
- `supabase/functions/extract-pitch-test/index.ts` - Edge function (v7)
- `python-pdf-extractor/` - PDF text extraction microservice (Vercel)
- Database: `title_content_analysis` table

---

## Chatbot Integration

The pitch deck analytics are integrated into the AI chatbot system to provide richer responses. See:

- **[Chatbot Documentation](/docs/features/chatbot/OVERVIEW.md)** - AI chatbot system overview
- **[Pitch Analytics Integration](/docs/features/chatbot/PITCH_ANALYTICS.md)** - Phase 3 chatbot enhancement

The chatbot uses pitch analytics data when available to answer queries about:
- Character details and relationships
- Story themes and mood
- Market positioning and comparable titles
- Source material metrics
- Korean cultural elements
- IP value and franchise potential

---

**For complete system documentation, see [PITCH_DECK_EXTRACTION_GUIDE.md](../PITCH_DECK_EXTRACTION_GUIDE.md)**
