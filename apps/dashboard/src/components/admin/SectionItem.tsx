import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { FeaturedSection } from '@/types/featured';

interface SectionItemProps {
  section: FeaturedSection;
  onUpdate: (id: string, updates: Partial<FeaturedSection>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export default function SectionItem({ section, onUpdate, onDelete }: SectionItemProps) {
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(section.name);
  const [editDescription, setEditDescription] = useState(section.description || '');
  const [saving, setSaving] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  async function handleSave() {
    setSaving(true);
    try {
      await onUpdate(section.id, {
        name: editName.trim(),
        description: editDescription.trim() || null,
      });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setEditName(section.name);
    setEditDescription(section.description || '');
    setEditing(false);
  }

  async function handleToggleActive() {
    await onUpdate(section.id, { is_active: !section.is_active });
  }

  async function handleDelete() {
    if (confirm(`Delete section "${section.name}"? Titles will be moved to Uncategorized.`)) {
      await onDelete(section.id);
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-3 bg-white border rounded-lg ${
        section.is_active ? 'border-gray-200' : 'border-gray-200 bg-gray-50 opacity-60'
      }`}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
      >
        <Icon icon="solar:hamburger-menu-bold-duotone" className="h-5 w-5" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {editing ? (
          <div className="space-y-2">
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Section name"
              className="h-8"
              disabled={saving}
            />
            <Input
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder="Description (optional)"
              className="h-8"
              disabled={saving}
            />
          </div>
        ) : (
          <>
            <div className="font-medium text-gray-900 truncate">{section.name}</div>
            {section.description && (
              <div className="text-sm text-gray-500 truncate">{section.description}</div>
            )}
          </>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        {editing ? (
          <>
            <Button size="sm" variant="ghost" onClick={handleSave} disabled={saving || !editName.trim()}>
              <Icon icon="solar:check-circle-bold-duotone" className="h-4 w-4 text-green-600" />
            </Button>
            <Button size="sm" variant="ghost" onClick={handleCancel} disabled={saving}>
              <Icon icon="solar:close-circle-bold-duotone" className="h-4 w-4 text-gray-500" />
            </Button>
          </>
        ) : (
          <>
            <Button size="sm" variant="ghost" onClick={handleToggleActive} title={section.is_active ? 'Hide section' : 'Show section'}>
              {section.is_active ? (
                <Icon icon="solar:eye-bold-duotone" className="h-4 w-4 text-green-600" />
              ) : (
                <Icon icon="solar:eye-closed-bold-duotone" className="h-4 w-4 text-gray-400" />
              )}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(true)} title="Edit section">
              <Icon icon="solar:pen-bold-duotone" className="h-4 w-4 text-gray-500" />
            </Button>
            <Button size="sm" variant="ghost" onClick={handleDelete} title="Delete section">
              <Icon icon="solar:trash-bin-trash-bold-duotone" className="h-4 w-4 text-red-500" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
