# Admin Page Design Guide

**Last Updated**: 2025-12-08
**Reference Implementation**: `src/pages/admin/AdminTitles.tsx`

This guide documents the standard design pattern for admin pages in the KStoryBridge Dashboard. All new admin pages should follow this pattern for consistency.

---

## Page Structure

Every admin page follows this layout structure:

```
┌─────────────────────────────────────────────────────────┐
│ AdminLayout (sidebar + header)                          │
├─────────────────────────────────────────────────────────┤
│ <div className="p-6 space-y-6">                        │
│                                                         │
│   ┌─────────────────────────────────────────────────┐  │
│   │ HEADER: Title + Description + Primary Action    │  │
│   └─────────────────────────────────────────────────┘  │
│                                                         │
│   ┌─────────────────────────────────────────────────┐  │
│   │ SEARCH & FILTERS (Card)                         │  │
│   └─────────────────────────────────────────────────┘  │
│                                                         │
│   ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                     │
│   │Stat │ │Stat │ │Stat │ │Stat │  STATS CARDS       │
│   └─────┘ └─────┘ └─────┘ └─────┘                     │
│                                                         │
│   ┌─────────────────────────────────────────────────┐  │
│   │ DATA TABLE (Card)                               │  │
│   │ - Sortable columns                              │  │
│   │ - Clickable rows for edit                       │  │
│   │ - Action buttons                                │  │
│   └─────────────────────────────────────────────────┘  │
│                                                         │
│ </div>                                                  │
│                                                         │
│ MODALS (Edit/Add dialogs)                              │
└─────────────────────────────────────────────────────────┘
```

---

## Code Template

### 1. Imports

```tsx
import { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Loader2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Pencil,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import AdminLayout from '@/components/layout/AdminLayout';
import { useToast } from '@/hooks/use-toast';
```

### 2. Types

```tsx
type SortField = 'fieldA' | 'fieldB' | 'fieldC';
type SortDirection = 'asc' | 'desc';
```

### 3. State Management

```tsx
const [data, setData] = useState<DataType[]>([]);
const [loading, setLoading] = useState(true);
const [searchQuery, setSearchQuery] = useState('');
const [sortField, setSortField] = useState<SortField | null>(null);
const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

// Modal state
const [editModalOpen, setEditModalOpen] = useState(false);
const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
```

### 4. Filtering & Sorting with useMemo

```tsx
const filteredData = useMemo(() => {
  let result = [...data];

  // Filter by search
  if (searchQuery) {
    result = result.filter((item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  // Sort
  if (sortField) {
    result.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];

      if (typeof aVal === 'string') {
        return sortDirection === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    });
  }

  return result;
}, [data, searchQuery, sortField, sortDirection]);
```

### 5. Sort Handler & Icon Component

```tsx
const handleSort = (field: SortField) => {
  if (sortField === field) {
    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
  } else {
    setSortField(field);
    setSortDirection('asc');
  }
};

const SortIcon = ({ field }: { field: SortField }) => {
  if (sortField !== field) {
    return <ArrowUpDown className="h-3 w-3 ml-1 opacity-50" />;
  }
  return sortDirection === 'asc'
    ? <ArrowUp className="h-3 w-3 ml-1" />
    : <ArrowDown className="h-3 w-3 ml-1" />;
};
```

---

## Component Sections

### Header Section

```tsx
{/* Header */}
<div className="flex items-center justify-between">
  <div>
    <h1 className="text-2xl font-bold text-black">[Page Title]</h1>
    <p className="text-sm text-gray-600 mt-1">
      [Brief description of what this page manages]
    </p>
  </div>
  <Button className="bg-hanok-teal hover:bg-hanok-teal/90">
    <Plus className="h-4 w-4 mr-2" />
    Add New [Item]
  </Button>
</div>
```

### Search & Filters Card

```tsx
{/* Search & Filters */}
<Card>
  <CardContent className="p-4">
    <div className="flex items-center gap-4">
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Search by name or ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>
      <Button variant="outline" onClick={fetchData} className="border-gray-300">
        Refresh
      </Button>
    </div>
  </CardContent>
</Card>
```

### Stats Cards

```tsx
{/* Stats Cards */}
<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
  <Card>
    <CardContent className="p-4">
      <div className="text-sm text-gray-600">Total Items</div>
      <div className="text-2xl font-bold text-black mt-1">{data.length}</div>
    </CardContent>
  </Card>
  {/* Add more stat cards as needed */}
</div>
```

### Data Table

```tsx
{/* Data Table */}
<Card>
  <CardContent className="p-0">
    {loading ? (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    ) : filteredData.length === 0 ? (
      <div className="text-center py-12 text-gray-500">
        No items found
      </div>
    ) : (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                onClick={() => handleSort('fieldA')}
              >
                <div className="flex items-center">
                  Column Name
                  <SortIcon field="fieldA" />
                </div>
              </th>
              {/* More columns... */}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredData.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => handleEdit(item.id)}
                    className="text-sm font-medium text-black hover:text-hanok-teal transition-colors"
                  >
                    {item.name}
                  </button>
                </td>
                {/* More cells... */}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </CardContent>
</Card>
```

---

## Styling Conventions

### Colors
- **Primary button**: `bg-hanok-teal hover:bg-hanok-teal/90`
- **Outline button**: `variant="outline" className="border-gray-300"`
- **Delete button**: `hover:bg-red-50` with `text-red-500` icon
- **Text colors**: `text-black` (headings), `text-gray-600` (descriptions), `text-gray-700` (body)

### Table Header
```tsx
className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
```

### Table Row
```tsx
className="hover:bg-gray-50"
```

### Badge/Tag Styles
```tsx
// Category badge
<span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-700">
  Category
</span>

// Generic tag
<span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-700">
  Tag
</span>
```

### Action Buttons in Table
```tsx
<div className="flex items-center justify-end gap-2">
  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-gray-100">
    <Pencil className="h-4 w-4 text-gray-500" />
  </Button>
  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-red-50">
    <Trash2 className="h-4 w-4 text-red-500" />
  </Button>
</div>
```

---

## Modal Pattern

Use Dialog components from shadcn/ui:

```tsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent className="max-w-lg">
    <DialogHeader>
      <DialogTitle>Modal Title</DialogTitle>
    </DialogHeader>
    <div className="space-y-4 py-4">
      {/* Form fields */}
    </div>
    <DialogFooter>
      <Button variant="outline" onClick={closeModal}>
        Cancel
      </Button>
      <Button onClick={handleSave} className="bg-hanok-teal hover:bg-hanok-teal/90">
        Save
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

## Adding New Admin Pages

### Checklist

1. **Create the page file**: `src/pages/admin/[PageName].tsx`
2. **Follow the template structure** above
3. **Add to AdminLayout navigation**: `src/components/layout/AdminLayout.tsx`
   ```tsx
   {
     name: 'Page Name',
     href: '/admin/page-path',
     icon: IconName,
     description: 'Brief description'
   }
   ```
4. **Add route in App.tsx**:
   ```tsx
   <Route
     path="/admin/page-path"
     element={
       <AdminProtectedRoute>
         <AdminLayout>
           <PageComponent />
         </AdminLayout>
       </AdminProtectedRoute>
     }
   />
   ```
5. **Test**: Verify sorting, filtering, CRUD operations, and responsive layout

---

## Reference Implementations

| Page | File | Features |
|------|------|----------|
| **AdminTitles** | `src/pages/admin/AdminTitles.tsx` | Full CRUD, sortable columns, inline priority/verified toggles |
| **MandateSamples** | `src/pages/admin/MandateSamples.tsx` | JSON config editing, copy-to-clipboard workflow |
| **Featured** | `src/pages/admin/Featured.tsx` | Drag-and-drop reordering, section management |
| **DraftApproval** | `src/pages/admin/DraftApproval.tsx` | Status filtering, approval workflow |

---

## Common Patterns

### Toast Notifications
```tsx
const { toast } = useToast();

// Success
toast({
  title: 'Success',
  description: 'Item saved successfully',
});

// Error
toast({
  title: 'Error',
  description: error.message || 'Something went wrong',
  variant: 'destructive',
});
```

### Confirmation Dialog
```tsx
if (!confirm('Are you sure you want to delete this item?')) return;
```

### Loading State in Table
```tsx
{loading ? (
  <div className="flex items-center justify-center py-12">
    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
  </div>
) : (
  // Table content
)}
```

---

**Note**: This guide should be updated when significant changes are made to the admin page patterns. Reference the AdminTitles page as the canonical implementation.
