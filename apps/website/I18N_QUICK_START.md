# Website i18n Quick Start Guide

**For**: Developers continuing the i18n implementation
**Status**: Phase 2 Complete (Infrastructure Ready)
**Next**: Phase 3 - Content Extraction

---

## 🚀 Quick Start

The i18n infrastructure is **100% ready**. You can immediately start translating page content.

### What's Already Done ✅
- i18next installed and configured
- 9 namespaces created (18 JSON files)
- All components migrated to i18next
- Language switcher working
- Build passing

### What's Next ⏳
Extract hardcoded strings from 8 production pages and add translations.

---

## 📝 How to Translate a Page (Step-by-Step)

### Example: Translating CreatorsPage

**Step 1: Open the page file**
```bash
code apps/website/src/pages/CreatorsPage.tsx
```

**Step 2: Add useTranslation hook**
```tsx
import { useTranslation } from 'react-i18next';

const CreatorsPage = () => {
  const { t } = useTranslation('creators'); // Use 'creators' namespace
  // ... rest of component
```

**Step 3: Find hardcoded strings**
```tsx
// BEFORE (hardcoded)
<h1>For Creators: Get Your Story Discovered</h1>
<p>Publish a verified pitch deck and reach decision-makers</p>
<button>Apply to List Your IP</button>
```

**Step 4: Add keys to JSON files**

`apps/website/src/i18n/locales/en/creators.json`:
```json
{
  "hero": {
    "title": "For Creators: Get Your Story Discovered",
    "subtitle": "Publish a verified pitch deck and reach decision-makers",
    "cta": "Apply to List Your IP"
  }
}
```

`apps/website/src/i18n/locales/ko/creators.json`:
```json
{
  "hero": {
    "title": "작가를 위해: 당신의 스토리를 발견시키세요",
    "subtitle": "검증된 피치 덱을 게시하고 의사결정권자들에게 도달하세요",
    "cta": "IP 등록 신청"
  }
}
```

**Step 5: Replace hardcoded strings with t() calls**
```tsx
// AFTER (translated)
<h1>{t('hero.title')}</h1>
<p>{t('hero.subtitle')}</p>
<button>{t('hero.cta')}</button>
```

**Step 6: Test**
```bash
npm run dev:website
# Visit http://localhost:5173/creators
# Click language switcher in header
# Verify content changes between EN/KR
```

**Step 7: Commit**
```bash
git add apps/website/src/pages/CreatorsPage.tsx
git add apps/website/src/i18n/locales/en/creators.json
git add apps/website/src/i18n/locales/ko/creators.json
git commit -m "feat(website): Translate CreatorsPage content"
```

---

## 🎯 8 Pages to Translate (Priority Order)

| # | Page | File | Namespace | Est. Keys | Priority |
|---|------|------|-----------|-----------|----------|
| 1 | HomePage | `src/pages/HomePage.tsx` | `home` | 300 | 🔴 High |
| 2 | CreatorsPage | `src/pages/CreatorsPage.tsx` | `creators` | 400 | 🔴 High |
| 3 | BuyersPage | `src/pages/BuyersPage.tsx` | `buyers` | 400 | 🔴 High |
| 4 | AboutPage | `src/pages/AboutPage.tsx` | `about` | 150 | 🟡 Medium |
| 5 | NewsPage | `src/pages/NewsPage.tsx` | `news` | 50 | 🟡 Medium |
| 6 | TitleDetailPage | `src/pages/TitleDetailPage.tsx` | `titles` | 100 | 🟡 Medium |
| 7 | OnboardingPage | `src/pages/BuyersOnboardingPage.tsx` | `onboarding` | 80 | 🟢 Low |
| 8 | SigninPage | `src/pages/SigninPage.tsx` | `auth` | 30 | 🟢 Low |

**Total**: ~1,500 keys to add

---

## 💡 Translation Patterns

### Basic Translation
```tsx
const { t } = useTranslation('namespace');
<h1>{t('key')}</h1>
```

### Nested Keys
```tsx
// JSON: { "hero": { "title": "Hello" } }
<h1>{t('hero.title')}</h1>
```

### Multiple Namespaces
```tsx
const { t } = useTranslation(['creators', 'common']);
<h1>{t('creators:hero.title')}</h1>
<button>{t('common:cta.getStarted')}</button>
```

### With Variables
```tsx
// JSON: { "greeting": "Hello, {{name}}!" }
<p>{t('greeting', { name: 'User' })}</p>
```

### With Count (Plurals)
```tsx
// JSON: {
//   "items": "{{count}} item",
//   "items_plural": "{{count}} items"
// }
<p>{t('items', { count: 5 })}</p> // "5 items"
```

---

## 🗂️ Namespace Guide

| Namespace | Use For | Example Keys |
|-----------|---------|--------------|
| `common` | Shared content (nav, footer, CTAs) | `nav.home`, `cta.getStarted`, `footer.copyright` |
| `home` | HomePage content | `hero.title`, `howItWorks.step1` |
| `creators` | CreatorsPage content | `hero.title`, `features.item1.title` |
| `buyers` | BuyersPage content | `hero.title`, `pricing.pro` |
| `about` | AboutPage content | `mission.title`, `team.heading` |
| `news` | NewsPage content | `categories.all`, `readMore` |
| `titles` | Title detail page | `detail.synopsis`, `filters.genre` |
| `onboarding` | Onboarding flow | `welcome.title`, `steps.profile` |
| `auth` | Authentication | `signin.title`, `errors.invalidEmail` |

---

## 🔍 Finding Hardcoded Strings

### Manual Method
1. Open page file
2. Search for strings in quotes: `"text"` or `'text'`
3. Look in JSX return statement
4. Check button labels, headings, paragraphs

### Automated Method
```bash
# Search for likely hardcoded strings in a file
grep -E ">(.*?)<|['\"].*?['\"]" src/pages/CreatorsPage.tsx
```

### Common Locations
- Hero section titles and subtitles
- Feature card titles and descriptions
- Button labels (CTAs)
- Form labels and placeholders
- Error messages
- Empty state messages
- Section headings
- Footer text

---

## ✅ Testing Checklist (Per Page)

After translating each page:

- [ ] No hardcoded strings remaining (search for `"text"` and `'text'`)
- [ ] All t() calls use correct namespace
- [ ] English version displays correctly
- [ ] Korean version displays correctly
- [ ] Language switcher changes all content
- [ ] No console errors or warnings
- [ ] No "missing translation" warnings
- [ ] Build succeeds: `npm run build:website`
- [ ] Both JSON files committed (en + ko)

---

## 🚫 Common Mistakes

### ❌ Wrong: Hardcoding
```tsx
<h1>Welcome to KStoryBridge</h1>
```

### ✅ Right: Translation
```tsx
const { t } = useTranslation('home');
<h1>{t('hero.title')}</h1>
```

---

### ❌ Wrong: Wrong Namespace
```tsx
const { t } = useTranslation('common');
<h1>{t('hero.title')}</h1> // Key is in 'home', not 'common'
```

### ✅ Right: Correct Namespace
```tsx
const { t } = useTranslation('home');
<h1>{t('hero.title')}</h1>
```

---

### ❌ Wrong: Missing Korean Translation
```json
// en/creators.json
{ "hero": { "title": "For Creators" } }

// ko/creators.json (empty!)
{ }
```

### ✅ Right: Both Languages
```json
// en/creators.json
{ "hero": { "title": "For Creators" } }

// ko/creators.json
{ "hero": { "title": "작가를 위해" } }
```

---

## 🆘 Troubleshooting

### Build fails with "Could not resolve"
**Problem**: Importing from deleted LanguageContext
**Solution**: Use `import { useTranslation } from 'react-i18next'`

### Console shows "missing translation"
**Problem**: Key exists in code but not in JSON
**Solution**: Add key to both `en/*.json` and `ko/*.json`

### Language doesn't switch
**Problem**: Using wrong namespace or key
**Solution**: Check namespace matches JSON file name, verify key exists

### Korean text shows as "???"
**Problem**: Missing Korean translation
**Solution**: Add translation to `ko/*.json` file

---

## 📚 Reference Files

- **Full Documentation**: `apps/website/I18N_IMPLEMENTATION.md`
- **i18n Config**: `apps/website/src/i18n/config.ts`
- **Translation Files**: `apps/website/src/i18n/locales/{en,ko}/*.json`
- **Example Component**: `apps/website/src/components/UniversalHeader.tsx`
- **Creator App Reference**: `apps/creator/src/i18n/` (similar setup)

---

## 🎯 Current Progress

**Infrastructure**: 100% ✅
- All setup complete
- Ready to translate content

**Content**: 12% (200/1,700 keys)
- ✅ Common namespace (nav, footer, CTAs)
- ⏳ Page namespaces need expansion

**Next**: Pick a page from the priority list and start translating!

---

**Questions?** Check `I18N_IMPLEMENTATION.md` for detailed information.
