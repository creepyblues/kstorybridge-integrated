# Convert EnhancedSearchLoading to Modal/Popup

## Problem
The loading progress bar is rendered inline in the results area, which may not be visible to users who haven't scrolled down, especially on smaller devices.

## Solution
Wrap `EnhancedSearchLoading` in a Dialog modal that displays centered on screen, ensuring visibility regardless of scroll position.

---

## Implementation Plan

### Step 1: Create SearchLoadingModal Component

**New file**: `apps/dashboard/src/components/comps-navigator/SearchLoadingModal.tsx`

```typescript
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { EnhancedSearchLoading } from './EnhancedSearchLoading';

interface SearchLoadingModalProps {
  isOpen: boolean;
}

export function SearchLoadingModal({ isOpen }: SearchLoadingModalProps) {
  return (
    <Dialog open={isOpen}>
      <DialogContent className="max-w-md" hideCloseButton>
        <EnhancedSearchLoading />
      </DialogContent>
    </Dialog>
  );
}
```

**Notes**:
- `hideCloseButton` prevents user from dismissing during search
- No `onOpenChange` since closing is controlled by search completion

---

### Step 2: Update ResultsGrid.tsx

**File**: `apps/dashboard/src/components/comps-navigator/ResultsGrid.tsx`

**Change**: Remove the inline loading conditional - only show results or empty state

```typescript
// BEFORE:
if (isLoading) {
  return <EnhancedSearchLoading />;
}

// AFTER: Remove this block entirely
// The modal handles loading display now
```

Remove `isLoading` from props interface since it's no longer needed here.

---

### Step 3: Update TrialResultsGrid.tsx

**File**: `apps/dashboard/src/components/trial/TrialResultsGrid.tsx`

**Change**: Same as above - remove inline loading conditional

---

### Step 4: Update CompsNavigator Page

**File**: `apps/dashboard/src/pages/buyers/CompsNavigator.tsx`

**Change**: Add modal at page level

```typescript
import { SearchLoadingModal } from '@/components/comps-navigator/SearchLoadingModal';

// In component:
return (
  <>
    <SearchLoadingModal isOpen={isLoading} />
    {/* ...existing layout... */}
    <ResultsGrid results={results} />  {/* Remove isLoading prop */}
  </>
);
```

---

### Step 5: Update Trial Page/Components

**File**: `apps/dashboard/src/pages/Trial.tsx` or `apps/dashboard/src/components/trial/TrialCompsSection.tsx`

**Change**: Add modal where search is initiated, similar to Step 4.

---

### Step 6: Optional - Add hideCloseButton to Dialog

If the Dialog component doesn't support `hideCloseButton`, we may need to:
1. Add this prop to `dialog.tsx`, OR
2. Style the modal to hide the close button via className

---

## Files to Modify

| File | Action |
|------|--------|
| `components/comps-navigator/SearchLoadingModal.tsx` | **CREATE** - New modal wrapper |
| `components/comps-navigator/ResultsGrid.tsx` | Remove inline loading |
| `components/trial/TrialResultsGrid.tsx` | Remove inline loading |
| `pages/buyers/CompsNavigator.tsx` | Add modal at page level |
| `pages/Trial.tsx` or `components/trial/TrialCompsSection.tsx` | Add modal at page level |
| `components/ui/dialog.tsx` | Maybe add hideCloseButton support |

---

## Benefits

- **Guaranteed visibility**: Modal appears centered, above all content
- **No layout shift**: Results area stays stable
- **Consistent UX**: Matches existing modal patterns in the app
- **Accessible**: Radix Dialog handles focus management automatically
