# i18n Usage Guide - Creator App

**Last Updated**: 2025-11-07

## Overview

The Creator app uses **i18next** and **react-i18next** for internationalization (i18n), supporting English (EN) and Korean (KO) languages. This guide explains how to use translations in new and existing pages.

---

## Quick Start

### 1. Add Translations to a Page

```typescript
import { useTranslation } from 'react-i18next'

export default function MyPage() {
  const { t } = useTranslation(['namespace1', 'namespace2'])

  return (
    <div>
      <h1>{t('namespace1:section.key')}</h1>
      <p>{t('namespace2:section.anotherKey')}</p>
    </div>
  )
}
```

### 2. Translation Key Syntax

```typescript
t('namespace:section.key')           // Basic usage
t('namespace:section.key', { count: 5 })  // With variables
t('namespace:section.key_plural', { count: 2 })  // Pluralization
```

---

## Translation Namespaces

Translations are organized into **7 namespaces**:

| Namespace | Purpose | Files |
|-----------|---------|-------|
| **auth** | Authentication pages (SignIn, SignUp, CompleteProfile) | `auth.json` |
| **titles** | Title management (list, detail, edit, card) | `titles.json` |
| **profile** | Profile page | `profile.json` |
| **survey** | Multi-step survey form (Add Title) | `survey.json` |
| **navigation** | Sidebar, menus, page headers | `navigation.json` |
| **common** | Shared UI elements (buttons, labels, messages) | `common.json` |
| **validation** | Form validation errors | `validation.json` |

---

## File Structure

```
src/i18n/
├── config.ts                      # i18n configuration (DO NOT EDIT)
└── locales/
    ├── en/                        # English translations
    │   ├── auth.json
    │   ├── titles.json
    │   ├── profile.json
    │   ├── survey.json
    │   ├── navigation.json
    │   ├── common.json
    │   └── validation.json
    └── ko/                        # Korean translations
        ├── auth.json
        ├── titles.json
        ├── profile.json
        ├── survey.json
        ├── navigation.json
        ├── common.json
        └── validation.json
```

---

## How to Add Translations to a New Page

### Step 1: Identify the Namespace

Determine which namespace your page belongs to:

- **Auth-related page?** → Use `auth` namespace
- **Title management page?** → Use `titles` namespace
- **Profile page?** → Use `profile` namespace
- **Navigation/menu?** → Use `navigation` namespace
- **General UI elements?** → Use `common` namespace

### Step 2: Add Translation Keys (EN + KO)

**Example**: Adding a new "Settings" page

**File**: `src/i18n/locales/en/navigation.json`
```json
{
  "pageHeaders": {
    "dashboard": "Creator Dashboard",
    "settings": "Settings"  // ← ADD THIS
  }
}
```

**File**: `src/i18n/locales/ko/navigation.json`
```json
{
  "pageHeaders": {
    "dashboard": "크리에이터 대시보드",
    "settings": "설정"  // ← ADD THIS
  }
}
```

### Step 3: Use Translations in Your Page

```typescript
import { useTranslation } from 'react-i18next'

export default function Settings() {
  const { t } = useTranslation(['navigation', 'common'])

  return (
    <div>
      <h1>{t('navigation:pageHeaders.settings')}</h1>
      <p>{t('common:messages.comingSoon')}</p>
    </div>
  )
}
```

---

## How to Update Existing Pages

If you add new text to an existing page:

### Step 1: Add the Translation Key

**File**: `src/i18n/locales/en/titles.json`
```json
{
  "list": {
    "title": "My Titles",
    "newFeatureButton": "Export Titles"  // ← ADD THIS
  }
}
```

**File**: `src/i18n/locales/ko/titles.json`
```json
{
  "list": {
    "title": "내 작품",
    "newFeatureButton": "작품 내보내기"  // ← ADD THIS
  }
}
```

### Step 2: Use the Key

```typescript
export default function Titles() {
  const { t } = useTranslation(['titles'])

  return (
    <div>
      <h1>{t('titles:list.title')}</h1>
      <Button>{t('titles:list.newFeatureButton')}</Button>  // ← USE THIS
    </div>
  )
}
```

---

## Advanced Features

### 1. Variables

```typescript
// Translation key
{
  "welcome": "Welcome, {{name}}!"
}

// Usage
t('welcome', { name: 'John' })
// Output: "Welcome, John!"
```

### 2. Pluralization

```typescript
// Translation keys (English)
{
  "itemCount": "{{count}} item",
  "itemCount_plural": "{{count}} items"
}

// Translation keys (Korean)
{
  "itemCount": "{{count}}개",
  "itemCount_plural": "{{count}}개"
}

// Usage
t('itemCount', { count: 1 })   // "1 item" or "1개"
t('itemCount', { count: 5 })   // "5 items" or "5개"
```

### 3. Multiple Namespaces

```typescript
const { t } = useTranslation(['titles', 'common', 'navigation'])

return (
  <div>
    <h1>{t('navigation:pageHeaders.myTitles')}</h1>
    <Button>{t('common:buttons.save')}</Button>
    <p>{t('titles:list.subtitle')}</p>
  </div>
)
```

---

## Best Practices

### ✅ DO

- **Use translation keys** for all user-facing text
- **Organize keys** by feature/section (e.g., `titles:list.title`)
- **Add both EN and KO** translations when adding new keys
- **Use existing keys** when possible (search before adding new ones)
- **Test language toggle** after adding translations

### ❌ DON'T

- **Hardcode strings** - Always use `t()` function
- **Mix languages** - Keep EN in `en/` files, KO in `ko/` files
- **Create duplicate keys** - Search existing translations first
- **Edit config.ts** - This file is auto-configured
- **Skip Korean translation** - Always provide both languages

---

## Common Translation Keys (Reuse These!)

### Buttons (`common:buttons.*`)
```typescript
t('common:buttons.save')          // "Save" / "저장"
t('common:buttons.cancel')        // "Cancel" / "취소"
t('common:buttons.edit')          // "Edit" / "수정"
t('common:buttons.delete')        // "Delete" / "삭제"
t('common:buttons.submit')        // "Submit" / "제출"
t('common:buttons.back')          // "Back" / "뒤로"
```

### Messages (`common:messages.*`)
```typescript
t('common:messages.loading')      // "Loading..." / "로딩 중..."
t('common:messages.saving')       // "Saving..." / "저장 중..."
t('common:messages.saved')        // "Saved successfully" / "저장되었습니다"
t('common:messages.error')        // "An error occurred" / "오류가 발생했습니다"
t('common:messages.comingSoon')   // "Coming soon" / "곧 출시 예정"
```

### Status (`common:status.*`)
```typescript
t('common:status.draft')          // "DRAFT" / "초안"
t('common:status.pending')        // "PENDING" / "검토 중"
t('common:status.approved')       // "APPROVED" / "승인됨"
t('common:status.rejected')       // "REJECTED" / "거절됨"
```

---

## Testing Translations

### 1. Build Test
```bash
npm run build
```
Should complete without errors.

### 2. Visual Test

1. Start dev server: `npm run dev`
2. Navigate to your page
3. Click the **language toggle** (Globe icon in sidebar)
4. Verify all text changes from EN → KO and back

### 3. Missing Key Detection

If a translation key is missing, you'll see:
- Console warning: `Missing translation key: namespace:section.key`
- UI shows the key itself: `namespace:section.key`

**Fix**: Add the missing key to both `en/*.json` and `ko/*.json`

---

## Debugging

### Issue: Translation not showing

**Check**:
1. Did you add `useTranslation()` hook?
2. Is the namespace imported? `useTranslation(['namespace'])`
3. Does the key exist in both EN and KO files?
4. Is the key path correct? `namespace:section.key`

### Issue: Language toggle not working

**Check**:
1. Is i18n initialized in `main.tsx`? (Should have `import './i18n/config'`)
2. Is LanguageSwitcher component in CMSSidebar?
3. Check browser console for errors

---

## Reference: Fully Translated Pages

These pages serve as examples:

| Page | File | Namespaces Used |
|------|------|-----------------|
| **SignIn** | `pages/auth/SignIn.tsx` | auth, common |
| **SignUp** | `pages/auth/SignUp.tsx` | auth, common |
| **Home** | `pages/Home.tsx` | titles, navigation, common |
| **Titles** | `pages/Titles.tsx` | titles, common |
| **Profile** | `pages/Profile.tsx` | profile, common |
| **Requests** | `pages/Requests.tsx` | navigation, common |
| **News** | `pages/News.tsx` | navigation, common |

---

## Quick Checklist for New Pages

- [ ] Import `useTranslation` from `react-i18next`
- [ ] Call `useTranslation(['namespace'])` hook
- [ ] Add translation keys to `en/*.json` and `ko/*.json`
- [ ] Replace hardcoded strings with `t('namespace:section.key')`
- [ ] Run `npm run build` to verify
- [ ] Test language toggle in browser

---

## Summary

**Translation workflow**:
1. **Add keys** to EN and KO JSON files
2. **Import hook** in component: `useTranslation(['namespace'])`
3. **Use translations**: `t('namespace:section.key')`
4. **Test** by toggling language in UI

**Key principle**: All user-facing text should go through the `t()` function!

---

For questions or issues, refer to:
- [i18next Documentation](https://www.i18next.com/)
- [react-i18next Documentation](https://react.i18next.com/)
- Existing translated pages in `src/pages/`
