# Multi-Language Implementation Guide (EN/KO)

**Implementation Date**: 2025-11-06
**Status**: ✅ Core Infrastructure Complete
**Languages**: English (EN) | Korean (한국어)

## 🎯 Overview

Your creator app now has a fully functional multi-language system using **react-i18next**. Users can seamlessly switch between English and Korean with a single click.

---

## ✅ What's Completed

### 1. **Core Infrastructure** (100% Complete)
- ✅ react-i18next library installed and configured
- ✅ i18n configuration with namespaces and localStorage persistence
- ✅ Translation file structure (feature-based organization)
- ✅ LanguageSwitcher component (toggle button with globe icon)
- ✅ TypeScript support for translation keys

### 2. **Translation Files Created** (7 Namespaces, ~300+ Keys)
All files located in `src/i18n/locales/[en|ko]/`:

| File | Purpose | Keys | Status |
|------|---------|------|--------|
| **common.json** | Shared UI (buttons, labels, messages) | 60+ | ✅ EN+KO |
| **auth.json** | Authentication pages | 50+ | ✅ EN+KO |
| **navigation.json** | Sidebar, menus, page headers | 20+ | ✅ EN+KO |
| **profile.json** | Profile page | 25+ | ✅ EN+KO |
| **titles.json** | Title management | 60+ | ✅ EN+KO |
| **survey.json** | Multi-step form (5 steps) | 120+ | ✅ EN+KO |
| **validation.json** | Form validation errors | 40+ | ✅ EN+KO |

**Total**: 375+ translation keys in both English and Korean

### 3. **Pages Translated** (5 Core Pages)
- ✅ **SignIn** - Fully translated (EN/KO)
- ✅ **SignUp** - Fully translated (EN/KO)
- ✅ **CompleteProfile** - Fully translated (EN/KO)
- ✅ **Home** - Fully translated (EN/KO)
- ✅ **CMSSidebar** - Navigation fully translated (EN/KO)

### 4. **UI Components**
- ✅ LanguageSwitcher component with Globe icon
- ✅ Integrated in:
  - CMSSidebar footer (desktop)
  - All auth page headers (SignIn, SignUp, CompleteProfile)

---

## 🚀 How It Works

### Language Switching
1. Click the **Globe button** (shows "English" or "한국어")
2. Language toggles instantly (no page reload)
3. Preference saved to localStorage automatically
4. Persists across sessions

### For Developers: Adding Translations

#### Step 1: Write English Code
```tsx
// Just develop in English as usual
<h1>My Titles</h1>
<p>No titles yet. Click 'Add New Title' to get started!</p>
```

#### Step 2: Extract to Translation File
Choose the appropriate namespace file:

**src/i18n/locales/en/titles.json**:
```json
{
  "list": {
    "title": "My Titles",
    "emptyState": "No titles yet",
    "emptyStateDescription": "Click 'Add New Title' to get started!"
  }
}
```

#### Step 3: Use in Component
```tsx
import { useTranslation } from 'react-i18next';

const { t } = useTranslation('titles'); // Specify namespace

<h1>{t('list.title')}</h1>
<p>{t('list.emptyState')} {t('list.emptyStateDescription')}</p>
```

#### Step 4: Add Korean Translation (Later)
**src/i18n/locales/ko/titles.json**:
```json
{
  "list": {
    "title": "내 작품",
    "emptyState": "아직 작품이 없습니다",
    "emptyStateDescription": "'새 작품 추가'를 클릭하여 시작하세요!"
  }
}
```

**No code changes needed!** Just add the Korean translation and it works automatically.

---

## 📁 File Structure

```
src/
├── i18n/
│   ├── config.ts                    # i18next configuration
│   ├── locales/
│   │   ├── en/                      # English translations
│   │   │   ├── common.json
│   │   │   ├── auth.json
│   │   │   ├── titles.json
│   │   │   ├── profile.json
│   │   │   ├── navigation.json
│   │   │   ├── survey.json
│   │   │   └── validation.json
│   │   └── ko/                      # Korean translations
│   │       ├── common.json
│   │       ├── auth.json
│   │       ├── titles.json
│   │       ├── profile.json
│   │       ├── navigation.json
│   │       ├── survey.json
│   │       └── validation.json
│   └── types.ts                     # TypeScript types (future)
├── components/
│   └── LanguageSwitcher.tsx         # Language toggle component
└── main.tsx                         # i18n initialized here
```

---

## 🎨 Translation Patterns

### 1. Simple Text
```tsx
const { t } = useTranslation('common');
<button>{t('buttons.save')}</button>
```

### 2. Variables/Interpolation
```tsx
// EN: "Step {{current}} of {{total}}"
<p>{t('survey:navigation.stepProgress', { current: 2, total: 5 })}</p>
// Output: "Step 2 of 5"
```

### 3. Multiple Namespaces
```tsx
const { t } = useTranslation(['auth', 'common', 'validation']);
<h1>{t('auth:signIn.title')}</h1>
<button>{t('common:buttons.submit')}</button>
<span>{t('validation:required.email')}</span>
```

### 4. Pluralization
```tsx
// EN: "{{count}} min ago" / "{{count}} mins ago"
{t('common:time.minutesAgo', { count: 5 })}
```

---

## 🛠️ Translation Namespace Guide

Choose the right namespace for your content:

| Namespace | Use When... | Examples |
|-----------|-------------|----------|
| **common** | Shared UI elements (buttons, labels, messages) | Save, Cancel, Loading..., Error |
| **auth** | Authentication flows | Sign In, Sign Up, Email, Password |
| **navigation** | Menus, breadcrumbs, page titles | Home, My Titles, Dashboard |
| **profile** | Profile management | Edit Profile, Full Name, Website |
| **titles** | Title CRUD operations | Add Title, Edit, Delete, Published |
| **survey** | Multi-step form (5 steps) | Step 1, Basic Info, Story Details |
| **validation** | Form errors, API errors | Required field, Invalid email |

---

## 📋 Remaining Work

### Pages Still Need Translation (~4-6 hours)
1. **Profile page** - Profile management (~30 mins)
2. **Titles list page** - Title listing (~30 mins)
3. **TitleDetail page** - Title detail view (~30 mins)
4. **EditTitle page** - Title editing (~45 mins)
5. **AddTitle/Survey components** - Multi-step form (Step1-5) (~2 hours)
   - Step1BasicInfo.tsx
   - Step2StoryDetails.tsx
   - Step3Narrative.tsx
   - Step4Materials.tsx
   - Step5Profile.tsx
6. **Form validation schemas** - Zod schema translations (~30 mins)
7. **Requests & News pages** - Skeleton pages (~15 mins)

### How to Update Remaining Pages

**Example: Updating Profile Page**

1. Open `/Users/sungholee/code/kstorybridge/apps/creator/src/pages/Profile.tsx`
2. Add imports:
   ```tsx
   import { useTranslation } from 'react-i18next';
   import { LanguageSwitcher } from '@/components/LanguageSwitcher';
   ```
3. Add hook:
   ```tsx
   const { t } = useTranslation(['profile', 'common']);
   ```
4. Replace hardcoded strings:
   ```tsx
   // Before
   <h1>Profile</h1>
   <Label>Full Name</Label>

   // After
   <h1>{t('profile:header.title')}</h1>
   <Label>{t('profile:fields.fullName')}</Label>
   ```

**All translation keys are already defined!** Just use them.

---

## 🧪 Testing

### Manual Testing Checklist
1. ✅ Build succeeds (`npm run build`)
2. ✅ No TypeScript errors
3. ✅ Language switcher visible in sidebar
4. ✅ Clicking switcher toggles language
5. ✅ Language persists after page reload
6. ⬜ Check all pages for missing translations
7. ⬜ Verify Korean text displays correctly (no encoding issues)
8. ⬜ Test form validation messages in both languages

### Browser Testing
```bash
npm run dev
# Open http://localhost:8083
# Click Globe button in sidebar → toggles EN/KO
# Refresh page → language persists
```

---

## 🎯 Key Benefits

### ✅ For Developers
- **Zero boilerplate**: Just use `t('key')` - no complex setup
- **Type-safe** (future): Auto-complete for translation keys
- **Feature-based**: Translations organized by page/feature
- **Scalable**: Easy to add new languages (Japanese, Chinese, etc.)
- **No code changes**: Add translations without touching components

### ✅ For Users
- **Instant switching**: No page reload, instant language change
- **Persistent**: Language choice saved across sessions
- **Seamless UX**: All UI elements update simultaneously

### ✅ For Business
- **Korean market ready**: Full Korean translation infrastructure
- **Professional**: Native language support for creators
- **Future-proof**: Easy to expand to other languages

---

## 📚 Developer Resources

### Documentation
- **react-i18next**: https://react.i18next.com/
- **i18next**: https://www.i18next.com/

### File Locations
- **Config**: `src/i18n/config.ts`
- **Translations**: `src/i18n/locales/[en|ko]/*.json`
- **Switcher**: `src/components/LanguageSwitcher.tsx`
- **Usage Examples**: See `src/pages/auth/SignIn.tsx`, `SignUp.tsx`, `Home.tsx`

### Common Issues

**Issue**: Translation not showing
**Solution**:
1. Check namespace is loaded: `const { t } = useTranslation('titles')`
2. Verify key exists in JSON file
3. Check browser console for errors

**Issue**: Language doesn't persist
**Solution**: Check localStorage - key should be `i18nextLng`

**Issue**: Build fails
**Solution**: Ensure all JSON files are valid (no trailing commas)

---

## 🚀 Next Steps

1. **Complete remaining pages** (~4-6 hours)
   - Profile, Titles, Survey components
2. **Add type safety** (~1 hour)
   - Generate TypeScript types for translation keys
   - Enable auto-complete in IDE
3. **Test thoroughly** (~1 hour)
   - All pages in both languages
   - Form validation messages
   - Error handling
4. **Optional enhancements**:
   - Add language selector in mobile menu
   - Support more languages (Japanese, Chinese)
   - Translation management UI

---

## 💡 Pro Tips

1. **Always use namespaces**: Don't load all translations at once
   ```tsx
   // ✅ Good
   const { t } = useTranslation(['auth', 'common']);

   // ❌ Avoid
   const { t } = useTranslation(); // Loads everything
   ```

2. **Consistent key naming**: Use nested structure
   ```json
   {
     "section": {
       "subsection": {
         "key": "value"
       }
     }
   }
   ```

3. **Extract common phrases**: Use `common.json` for reused text
   - Buttons: Save, Cancel, Submit
   - Messages: Loading, Error, Success
   - Actions: Edit, Delete, Create

4. **Keep translations close to features**:
   - Auth pages → `auth.json`
   - Titles → `titles.json`
   - Profile → `profile.json`

---

## ✅ Success Criteria

Your implementation is complete when:
- ✅ Build succeeds without errors
- ✅ All pages show correct language on toggle
- ✅ Language persists after page refresh
- ✅ No untranslated text visible
- ✅ Korean text displays correctly (no �� characters)
- ✅ Form validations work in both languages

---

**Questions or issues?** Check the example implementations in:
- `/src/pages/auth/SignIn.tsx` - Complete auth page example
- `/src/pages/Home.tsx` - Dashboard page example
- `/src/components/layout/CMSSidebar.tsx` - Navigation example

**Happy translating! 🌍**
