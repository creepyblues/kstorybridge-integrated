# Title Database Audit - January 2026

## Summary
Comparison of provided title list (~100 titles) against `titles` table in Supabase database.

**Results**: ✅ All issues resolved (2026-01-06)
- 9 missing titles → **ADDED**
- 2 titles with missing URLs → **UPDATED**
- ~90 titles matched

---

## Missing Titles (9 total) - ✅ ADDED

| # | Korean Title | Platform | URL | Status |
|---|--------------|----------|-----|--------|
| 1 | 1초에 100만원 | Naver Webtoon | https://comic.naver.com/webtoon/list?titleId=842977 | ✅ Added |
| 2 | 김 대리는 아이돌이 싫어 | Naver Webtoon | https://comic.naver.com/webtoon/list?titleId=842974 | ✅ Added |
| 3 | 얼굴천재 0살 톱스타 | Kakao Page | https://page.kakao.com/content/67394591 | ✅ Added |
| 4 | 2차원 개그 | Unknown | - (no URL provided) | ✅ Added (no URL) |
| 5 | 냠냠의철학 | Kakao Page | https://page.kakao.com/content/64641963 | ✅ Added |
| 6 | 살아서 만납시다 | Ridibooks | https://ridibooks.com/books/3097001749 | ✅ Added |
| 7 | 내가 죽기 일주일 전 | Kakao Page | https://page.kakao.com/content/66085495 | ✅ Added |
| 8 | 금쪽이가 사랑하는 방법 | Bomtoon | https://www.bomtoon.com/detail/howGlovee | ✅ Added |
| 9 | 오! my GOD | Naver Series | https://series.naver.com/comic/detail.series?productNo=11852633 | ✅ Added |

**Creator**: Associated with `sleekr21@gmail.com` (ID: `162f949f-1747-4aa3-aaa2-79f682045ccd`)

---

## Titles Needing URL Updates (2 total) - ✅ UPDATED

| Korean Title | New URL | Status |
|--------------|---------|--------|
| 우리 모두는 누군가의 첫사랑이었다 | https://page.kakao.com/content/63611875 | ✅ Updated |
| 마녀는 사랑하지 않아도 괜찮아요 | https://page.kakao.com/content/58437842 | ✅ Updated |

---

## Data Enrichment Status

| Title | Platform Data | Embeddings | Comps | Format Fit |
|-------|---------------|------------|-------|------------|
| 1초에 100만원 | ⏳ Pending | ⏳ Pending | ⏳ Pending | ⏳ Pending |
| 김 대리는 아이돌이 싫어 | ⏳ Pending | ⏳ Pending | ⏳ Pending | ⏳ Pending |
| 얼굴천재 0살 톱스타 | ⏳ Pending | ⏳ Pending | ⏳ Pending | ⏳ Pending |
| 2차원 개그 | ❌ No URL | ⏳ Pending | ⏳ Pending | ⏳ Pending |
| 냠냠의철학 | ⏳ Pending | ⏳ Pending | ⏳ Pending | ⏳ Pending |
| 살아서 만납시다 | ⏳ Pending | ⏳ Pending | ⏳ Pending | ⏳ Pending |
| 내가 죽기 일주일 전 | ⏳ Pending | ⏳ Pending | ⏳ Pending | ⏳ Pending |
| 금쪽이가 사랑하는 방법 | ⏳ Pending | ⏳ Pending | ⏳ Pending | ⏳ Pending |
| 오! my GOD | ⏳ Pending | ⏳ Pending | ⏳ Pending | ⏳ Pending |
| 우리 모두는 누군가의 첫사랑이었다 | ⏳ Pending | ✅ Done | ⏳ Pending | ⏳ Pending |
| 마녀는 사랑하지 않아도 괜찮아요 | ⏳ Pending | ✅ Done | ⏳ Pending | ⏳ Pending |

**Next Step**: Run data enrichment via Dashboard Admin UI (Titles → Edit → "Collect Data")

---

## Notes on Name Variations

| User List Name | DB Name | Status |
|----------------|---------|--------|
| 웽툰 | 웽툰 시즌4, 웽툰 시즌5 | Partial match (seasons exist) |
| 애착인형 | 애착 인형 | Match (spacing difference) |
| 애증과 애정사이 | - Heaven Sent - | Match (different KR title, EN: Love Hate Relationship) |

---

## Audit Metadata
- **Audit Date**: 2026-01-05
- **Resolution Date**: 2026-01-06
- **Database**: Supabase project `dlrnrgcoguxlkkcitlpd`
- **Table**: `titles`
- **Total titles in DB**: ~210+
- **Titles matched from list**: ~100
