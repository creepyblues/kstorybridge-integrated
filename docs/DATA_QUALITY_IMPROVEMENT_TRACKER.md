# Titles Data Quality Improvement Tracker

**Started**: 2025-12-17
**Last Updated**: 2025-12-17
**Total Titles**: 244

---

## Overview

This document tracks the systematic improvement of data quality in the `titles` table. The goal is to fill missing fields and normalize inconsistent values to improve buyer experience, AI features, and business operations.

---

## Phase 1: Metadata Normalization ✅ COMPLETED

**Date**: 2025-12-17
**Migration**: `supabase/migrations/20251217_normalize_metadata_fields.sql`

### Changes Applied

#### 1. `tone` Field - Normalized
| Issue | Action | Result |
|-------|--------|--------|
| 43 different value variants | Converted all to lowercase | 37 unique values |
| Inconsistent casing (EXCITING vs exciting) | `LOWER(TRIM(tone))` | All lowercase |
| Truncated values ("HEART-", "CHARACTER-") | Fixed to full values | "heartwarming", "character-driven" |
| "Not Specified" placeholder | Converted to NULL | 12 titles need review |

**Current Distribution (Top 10)**:
| Value | Count |
|-------|-------|
| exciting | 53 |
| romantic | 49 |
| quirky | 22 |
| intense | 19 |
| funny | 18 |
| suspenseful | 13 |
| NULL | 12 |
| rom-com | 9 |
| heartwarming | 7 |
| epic | 5 |

#### 2. `audience` Field - Cleaned
| Issue | Action | Result |
|-------|--------|--------|
| 63 "N/A" placeholders | Converted to NULL | Ready for AI assignment |
| Inconsistent formats | Normalized to standard | Clean values |

**Current Distribution**:
| Value | Count |
|-------|-------|
| NULL | 124 |
| ADULTS 18-34 | 115 |
| KIDS 3-8 | 2 |
| ADULTS 16-34 | 1 |
| KIDS/TEENS 8-14 | 1 |
| TEENS 12-18 | 1 |

#### 3. `age_rating` Field - Standardized
| Issue | Action | Result |
|-------|--------|--------|
| Korean notation (전체이용가, 15세, 19세) | Converted to English | ALL, 15+, 19+ |
| Alternate Korean (전체연령가) | Converted to ALL | Consistent |
| "N/A" and "NONE" placeholders | Converted to NULL | Ready for assignment |

**Current Distribution**:
| Value | Count |
|-------|-------|
| NULL | 202 |
| ALL | 33 |
| 15+ | 8 |
| 19+ | 1 |

#### 4. `content_format` Field - Filled ✅
| Issue | Action | Result |
|-------|--------|--------|
| 115 NULL values (47%) | Set to 'webtoon' (default for this dataset) | **100% complete** |

**Current Distribution**:
| Value | Count |
|-------|-------|
| webtoon | 244 |

---

## Current Data Completeness Summary

### After Phase 3 (2025-12-17)

| Field | Filled | Rate | Status | Next Action |
|-------|--------|------|--------|-------------|
| `content_format` | 244/244 | **100%** | ✅ Complete | None |
| `audience` | 244/244 | **100%** | ✅ Complete | None |
| `age_rating` | 244/244 | **100%** | ✅ Complete | None |
| `tone` | 244/244 | **100%** | ✅ Complete | None |
| `rights_available` | 244/244 | **100%** | ✅ Complete | None |

### Comparison: Before vs After Phase 1

| Field | Before | After | Improvement |
|-------|--------|-------|-------------|
| `tone` | 43 variants, inconsistent | 37 clean lowercase | Normalized |
| `audience` | 75% (with "N/A" junk) | 49% (clean values only) | Quality improved |
| `age_rating` | 28% (Korean mixed) | 17% (English notation) | Standardized |
| `content_format` | 53% | **100%** | +47% filled |

---

## Phase 2: AI-Assisted Field Completion ✅ COMPLETED

**Status**: Complete
**Goal**: Use AI/rules to infer missing values from existing data (synopsis, genre, tone)

### Tasks

| # | Task | Titles | Method | Status |
|---|------|--------|--------|--------|
| 2.1 | Fill `audience` NULL | 124 → 0 | Rules-based inference | ✅ **COMPLETED** (2025-12-17) |
| 2.2 | Fill `age_rating` NULL | 202 → 0 | Rules-based inference | ✅ **COMPLETED** (2025-12-17) |
| 2.3 | Fill `tone` NULL | 12 → 0 | Manual assignment | ✅ **COMPLETED** (2025-12-17) |

### Phase 2.1 Results: Audience Inference

**Date**: 2025-12-17
**Script**: `scripts/infer-audience-rules.js`
**Method**: Rules-based inference using genre, tone, and age_rating

**Distribution After Inference**:
| Value | Count | Percentage |
|-------|-------|------------|
| ADULTS 18-34 | 219 | 89.8% |
| ALL AGES | 13 | 5.3% |
| TEENS 12-18 | 7 | 2.9% |
| KIDS 3-8 | 2 | 0.8% |
| ADULTS 35+ | 1 | 0.4% |
| KIDS/TEENS 8-14 | 1 | 0.4% |
| ADULTS 16-34 | 1 | 0.4% |

**Rules Applied** (top 5):
1. `genre_romance`: 49 titles
2. `genre_drama`: 22 titles
3. `genre_fantasy_action`: 16 titles
4. `age_all_comedy`: 8 titles
5. `age_15plus_action`: 5 titles

### Phase 2.2 Results: Age Rating Inference

**Date**: 2025-12-17
**Script**: `scripts/infer-age-rating-rules.js`
**Method**: Rules-based inference using audience, genre, and tone

**Distribution After Inference**:
| Value | Count | Percentage |
|-------|-------|------------|
| 15+ | 165 | 67.6% |
| ALL | 41 | 16.8% |
| 12+ | 27 | 11.1% |
| 19+ | 11 | 4.5% |

**Rules Applied** (top 5):
1. `genre_romance_adult`: 107 titles
2. `genre_fantasy_action`: 17 titles
3. `genre_comedy_adult`: 16 titles
4. `audience_adults_explicit`: 10 titles
5. `genre_mature_thriller`: 9 titles

### Proposed Standard Values

**audience** (standardized):
- `KIDS 3-8`
- `KIDS 8-12`
- `TEENS 12-18`
- `ADULTS 18-34`
- `ADULTS 35+`
- `ALL AGES`

**age_rating** (standardized):
- `ALL` (All Ages)
- `7+`
- `12+`
- `15+`
- `17+`
- `19+` (Adults Only)

---

## Phase 3: Rights Data Entry ✅ COMPLETED

**Status**: Complete
**Goal**: Fill critical business fields for buyer deal-making

### Tasks

| # | Task | Titles | Method | Status |
|---|------|--------|--------|--------|
| 3.1 | Fill `rights_available` | 235 → 0 | Bulk assignment | ✅ **COMPLETED** (2025-12-17) |
| 3.2 | Fill `rights_holder_name` | 243 | Manual from CPs | ⏳ Future |
| 3.3 | Fill `rights_holder_company` | 244 | Manual from CPs | ⏳ Future |

### Phase 3.1 Results: Rights Available

**Date**: 2025-12-17
**Method**: Bulk SQL assignment with default rights

**Default Rights Applied**: `['film_tv', 'animation', 'microdrama', 'audio']`

**Distribution After Assignment**:
| Rights | Count | % |
|--------|-------|---|
| `['film_tv', 'animation', 'microdrama', 'audio']` | 238 | 97.5% |
| `['film_tv', 'microdrama']` | 3 | 1.2% |
| `['film_tv', 'animation']` | 1 | 0.4% |
| `['film_tv']` | 1 | 0.4% |
| `['microdrama', 'film_tv']` | 1 | 0.4% |

**Note**: 6 titles had pre-existing specific rights assignments that were preserved.

### Note on Legacy `rights` Field
The `rights` field currently contains **Content Provider names** (Manwha Family: 126, MANTA/RIDI: 118), NOT available rights. This is a data quality issue that should be addressed:
- Consider renaming to `cp_source` or similar
- Or migrate data to the correct `cp` field

---

## Phase 4: Platform Metrics (PARTIAL)

**Status**: In Progress
**Goal**: Populate metrics from platform scraping via Intelligence system

### Tasks

| # | Task | Titles | Method | Status |
|---|------|--------|--------|--------|
| 4.1 | Collect Kakao Webtoon metrics (Manwha Family) | 4 | Direct scraping | ✅ **COMPLETED** (2025-12-18) |
| 4.2 | Link `intelligence_titles` to `titles` | TBD | Mapping script | ⏳ Pending |
| 4.3 | Populate `title_platforms` | 244 | From intelligence data | ⏳ Pending |
| 4.4 | Fill remaining `views`, `likes`, `rating` | Variable | Batch update | ⏳ Pending |
| 4.5 | Fill `chapters` | 108 | From platforms | ⏳ Pending |

### Phase 4.1 Results: Kakao Webtoon Metrics

**Date**: 2025-12-18
**Script**: `scripts/batch-collect-kakao-metrics.js`
**Scope**: Manwha Family titles with Kakao Webtoon URLs and no existing metrics

**Titles Updated** (4):
| Title | Korean | Views | Likes |
|-------|--------|-------|-------|
| A good relationship | 염라의 숨결 | 362,341 | 17,691 |
| Betelgeuse | 베텔게우스 | 202,854 | 10,496 |
| Jujak Academy | 주작학원 | 913,139 | 26,374 |
| Samgaksan Fairy Bath | 삼각산 선녀탕 | 676,971 | 22,488 |

**Platform Support Note**:
The Title Intelligence system currently supports: Naver Webtoon, Naver Series, Kakao Page, Kakao Webtoon, Manta.
Other platforms (Bomtoon, Ridibooks, Toptoon, Lezhin) are not yet supported.

---

## Phase 5: AI Analysis Tables (PENDING)

**Status**: Not Started
**Goal**: Run batch AI analysis for all titles

### Tasks

| # | Task | Titles | Method | Status |
|---|------|--------|--------|--------|
| 5.1 | Generate `title_format_fit` | 189 | Format Fit Edge Function | ⏳ Pending |
| 5.2 | Generate `title_content_analysis` | 213 | Content Analysis Edge Function | ⏳ Pending |

---

## Related Documentation

- **Full Inspection Report**: `/Users/sungholee/.claude/plans/floofy-toasting-emerson.md`
- **Migration File**: `supabase/migrations/20251217_normalize_metadata_fields.sql`
- **Database Schema**: `docs/active/DATABASE_SCHEMA.md`

---

## Changelog

### 2025-12-18 (Phase 4.1)
- Completed Phase 4.1: Kakao Webtoon metrics collection
  - Created `scripts/batch-collect-kakao-metrics.js` for scraping Kakao Webtoon
  - Collected views and likes for 4 Manwha Family titles on Kakao Webtoon
  - Updated titles: A good relationship, Betelgeuse, Jujak Academy, Samgaksan Fairy Bath
  - Note: 25 other titles on unsupported platforms (Bomtoon, Ridibooks, Toptoon) skipped

### 2025-12-17 (Phase 2.3)
- Completed Phase 2.3: Tone completion
  - Manually assigned tone to 12 remaining NULL titles
  - `tone` field now 100% complete (244/244)
  - Assignments: 6 romantic, 2 quirky, 2 intense, 1 heartwarming, 1 dramatic

### 2025-12-17 (Phase 2.2)
- Completed Phase 2.2: Age rating inference
  - Created `scripts/infer-age-rating-rules.js` for rules-based inference
  - Filled all 202 NULL age_rating values
  - `age_rating` field now 100% complete (244/244)
  - Distribution: 67.6% 15+, 16.8% ALL, 11.1% 12+, 4.5% 19+

### 2025-12-17 (Phase 2.1)
- Completed Phase 2.1: Audience inference
  - Created `scripts/infer-audience-rules.js` for rules-based inference
  - Filled all 124 NULL audience values
  - `audience` field now 100% complete (244/244)
  - Distribution: 89.8% ADULTS 18-34, 5.3% ALL AGES, 2.9% TEENS 12-18

### 2025-12-17 (Phase 1)
- Created initial data quality inspection report
- Completed Phase 1: Metadata normalization
  - Normalized `tone` to lowercase (43 → 37 variants)
  - Cleaned `audience` (removed "N/A" placeholders)
  - Standardized `age_rating` (Korean → English notation)
  - Filled `content_format` to 100% (all NULL → 'webtoon')
