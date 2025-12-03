import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import SectionItem from './SectionItem';
import type { FeaturedSection } from '@/types/featured';

interface SectionManagerProps {
  sections: FeaturedSection[];
  onCreateSection: (name: string, description?: string) => Promise<void>;
  onUpdateSection: (id: string, updates: Partial<FeaturedSection>) => Promise<void>;
  onDeleteSection: (id: string) => Promise<void>;
  onReorderSections: (sectionIds: string[]) => Promise<void>;
}

export default function SectionManager({
  sections,
  onCreateSection,
  onUpdateSection,
  onDeleteSection,
  onReorderSections,
}: SectionManagerProps) {
  const [newSectionName, setNewSectionName] = useState('');
  const [newSectionDescription, setNewSectionDescription] = useState('');
  const [creating, setCreating] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  async function handleCreate() {
    if (!newSectionName.trim()) return;
    setCreating(true);
    try {
      await onCreateSection(newSectionName.trim(), newSectionDescription.trim() || undefined);
      setNewSectionName('');
      setNewSectionDescription('');
    } finally {
      setCreating(false);
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = sections.findIndex(s => s.id === active.id);
      const newIndex = sections.findIndex(s => s.id === over.id);
      const newOrder = arrayMove(sections, oldIndex, newIndex);
      onReorderSections(newOrder.map(s => s.id));
    }
  }

  return (
    <Card>
      <CardContent className="p-4">
        <h2 className="text-lg font-semibold text-black mb-4">Manage Sections</h2>

        {/* Create new section */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1">
            <Input
              placeholder="Section name (e.g., 'Action Thrillers')"
              value={newSectionName}
              onChange={(e) => setNewSectionName(e.target.value)}
              disabled={creating}
            />
          </div>
          <div className="flex-1">
            <Input
              placeholder="Description (optional)"
              value={newSectionDescription}
              onChange={(e) => setNewSectionDescription(e.target.value)}
              disabled={creating}
            />
          </div>
          <Button
            onClick={handleCreate}
            disabled={!newSectionName.trim() || creating}
            className="bg-hanok-teal hover:bg-hanok-teal/90"
          >
            {creating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Add Section
              </>
            )}
          </Button>
        </div>

        {/* Sections list with drag-and-drop */}
        {sections.length === 0 ? (
          <p className="text-gray-500 text-center py-6">
            No sections yet. Create one above.
          </p>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={sections.map(s => s.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {sections.map((section) => (
                  <SectionItem
                    key={section.id}
                    section={section}
                    onUpdate={onUpdateSection}
                    onDelete={onDeleteSection}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}

        {sections.length > 0 && (
          <p className="text-xs text-gray-400 mt-3">
            Drag sections to reorder. Hidden sections won't appear on the buyer page.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
