import { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Search, X, GripVertical, Loader2, RefreshCw, LayoutGrid, FolderOpen, ExternalLink } from 'lucide-react';
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
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AdminLayout from '@/components/layout/AdminLayout';
import SectionManager from '@/components/admin/SectionManager';
import { featuredService, type FeaturedWithTitle } from '@/services/featuredService';
import { titlesService, type Title } from '@/services/titlesService';
import { useToast } from '@/hooks/use-toast';
import type { FeaturedSection } from '@/types/featured';

// Draggable title card component (mandate-style design)
function DraggableTitleCard({
  item,
  sections,
  onEditNote,
  onDelete,
  onAssignSection,
  editingNoteId,
  editNoteValue,
  setEditNoteValue,
  onSaveNote,
  onCancelNote,
  deleting,
}: {
  item: FeaturedWithTitle;
  sections: FeaturedSection[];
  onEditNote: (id: string, note: string | null) => void;
  onDelete: (id: string, titleName: string) => void;
  onAssignSection: (featuredId: string, sectionId: string | null) => void;
  editingNoteId: string | null;
  editNoteValue: string;
  setEditNoteValue: (value: string) => void;
  onSaveNote: (id: string) => void;
  onCancelNote: () => void;
  deleting: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const title = item.titles;
  const titleNameEn = title?.title_name_en;
  const titleNameKr = title?.title_name_kr;
  const titleImage = title?.title_image;

  const handleCardClick = () => {
    window.open(`/buyers/titles/${item.title_id}`, '_blank');
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card className="bg-white border border-gray-300 rounded-2xl hover:shadow-lg transition-all duration-300 group overflow-hidden h-full flex flex-col">
        <CardContent className="p-0 flex flex-col h-full">
          {/* Image Section */}
          <div className="relative w-full aspect-[3/4] bg-gray-100 overflow-hidden flex-shrink-0">
            {titleImage ? (
              <img
                src={titleImage}
                alt={titleNameEn || titleNameKr || 'Title'}
                className="absolute inset-0 w-full h-full object-cover object-center cursor-pointer"
                onClick={handleCardClick}
                onError={(e) => {
                  e.currentTarget.src = 'https://via.placeholder.com/400x600?text=No+Image';
                }}
              />
            ) : (
              <div
                className="absolute inset-0 w-full h-full flex items-center justify-center cursor-pointer"
                onClick={handleCardClick}
              >
                <span className="text-gray-400 text-sm">No Image</span>
              </div>
            )}

            {/* Drag Handle - Top Left */}
            <div
              {...attributes}
              {...listeners}
              className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm rounded-lg p-1.5 cursor-grab active:cursor-grabbing shadow-sm hover:bg-white"
            >
              <GripVertical className="h-4 w-4 text-gray-600" />
            </div>

            {/* External Link - Top Right */}
            <button
              onClick={handleCardClick}
              className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-lg p-1.5 shadow-sm hover:bg-white"
            >
              <ExternalLink className="h-4 w-4 text-gray-600" />
            </button>

            {/* Delete Button - Bottom Right */}
            <Button
              variant="ghost"
              size="sm"
              className="absolute bottom-2 right-2 h-8 w-8 p-0 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm hover:bg-red-50 text-red-600 hover:text-red-700"
              onClick={() => onDelete(item.id, titleNameEn || titleNameKr || 'Unknown Title')}
              disabled={deleting}
              title="Remove from featured"
            >
              {deleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Content Section */}
          <div className="p-4 flex flex-col flex-grow">
            {/* Title */}
            <h3
              className="text-base font-bold text-gray-900 mb-1 line-clamp-2 cursor-pointer hover:text-hanok-teal transition-colors"
              onClick={handleCardClick}
            >
              {titleNameEn || titleNameKr || 'Unknown Title'}
            </h3>
            {titleNameEn && titleNameKr && (
              <p className="text-xs text-gray-500 mb-2 truncate">{titleNameKr}</p>
            )}

            {/* Divider */}
            <div className="w-full h-px bg-gray-200 mb-3"></div>

            {/* Genre Tags */}
            {title?.genre && (
              <div className="flex flex-wrap gap-1 mb-3">
                {(Array.isArray(title.genre) ? title.genre.slice(0, 2) : [title.genre]).map((g, idx) => (
                  <span
                    key={idx}
                    className="bg-gradient-to-r from-cyan-100 to-cyan-50 text-cyan-800 px-2 py-0.5 rounded-md text-xs font-medium border border-cyan-200"
                  >
                    {g}
                  </span>
                ))}
                {title?.content_format && (
                  <span className="bg-gradient-to-r from-blue-100 to-blue-50 text-blue-800 px-2 py-0.5 rounded-md text-xs font-medium border border-blue-200">
                    {title.content_format}
                  </span>
                )}
              </div>
            )}

            {/* Section Selector */}
            <div className="mb-3">
              <Select
                value={item.section_id || 'uncategorized'}
                onValueChange={(value) => onAssignSection(item.id, value === 'uncategorized' ? null : value)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Select section" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="uncategorized">Uncategorized</SelectItem>
                  {sections.map((section) => (
                    <SelectItem key={section.id} value={section.id}>
                      {section.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Note Section */}
            <div className="mt-auto">
              {editingNoteId === item.id ? (
                <div className="space-y-2">
                  <textarea
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-hanok-teal focus:border-hanok-teal text-xs"
                    rows={2}
                    value={editNoteValue}
                    onChange={(e) => setEditNoteValue(e.target.value)}
                    autoFocus
                    placeholder="Add a note..."
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => onSaveNote(item.id)}
                      className="bg-hanok-teal hover:bg-hanok-teal/90 text-white px-3 py-1 text-xs h-7"
                    >
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={onCancelNote}
                      className="px-3 py-1 text-xs h-7"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  className="bg-gray-50 rounded-lg p-2 cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => onEditNote(item.id, item.note)}
                >
                  <p className="text-xs text-gray-500 mb-0.5">Note</p>
                  <p className="text-xs text-gray-700 line-clamp-2">
                    {item.note || <span className="italic text-gray-400">Click to add note...</span>}
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminFeatured() {
  const { toast } = useToast();
  const [featured, setFeatured] = useState<FeaturedWithTitle[]>([]);
  const [sections, setSections] = useState<FeaturedSection[]>([]);
  const [totalTitlesCount, setTotalTitlesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedTitle, setSelectedTitle] = useState<Title | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [newSectionId, setNewSectionId] = useState<string | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editNoteValue, setEditNoteValue] = useState('');
  const [activeTab, setActiveTab] = useState<string>('uncategorized');
  const searchRef = useRef<HTMLDivElement>(null);

  // Drag sensors for title reordering
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [featuredData, sectionsData] = await Promise.all([
        featuredService.getAllFeatured(),
        featuredService.getAllSections(),
      ]);
      setFeatured(featuredData);
      setSections(sectionsData);
      const allTitles = await titlesService.getTitles();
      setTotalTitlesCount(allTitles.length);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleAddFeatured() {
    if (!selectedTitle) {
      toast({
        title: 'Error',
        description: 'Please select a title',
        variant: 'destructive',
      });
      return;
    }

    try {
      setAdding(true);

      const isAlreadyFeatured = await featuredService.isTitleFeatured(selectedTitle.title_id);
      if (isAlreadyFeatured) {
        toast({
          title: 'Error',
          description: 'This title is already featured',
          variant: 'destructive',
        });
        return;
      }

      await featuredService.addFeaturedTitle(
        selectedTitle.title_id,
        newNote || undefined,
        newSectionId || undefined
      );

      toast({
        title: 'Success',
        description: 'Title added to featured',
      });

      setSelectedTitle(null);
      setSearchQuery('');
      setNewNote('');
      setNewSectionId(null);
      await loadData();
    } catch (error) {
      console.error('Error adding featured:', error);
      toast({
        title: 'Error',
        description: 'Failed to add featured title',
        variant: 'destructive',
      });
    } finally {
      setAdding(false);
    }
  }

  // Close search results when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // State for search results
  const [searchResults, setSearchResults] = useState<Title[]>([]);
  const [searching, setSearching] = useState(false);

  // Search titles when query changes (debounced)
  useEffect(() => {
    const query = searchQuery.trim();
    if (!query) {
      setSearchResults([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await titlesService.getTitles({ search: query });
        setSearchResults(results.slice(0, 10));
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, featured]);

  const filteredTitles = searchResults;
  const isTitleFeatured = (titleId: string) => featured.some(f => f.title_id === titleId);

  function handleSelectTitle(title: Title) {
    setSelectedTitle(title);
    setSearchQuery('');
    setShowResults(false);
  }

  function clearSelectedTitle() {
    setSelectedTitle(null);
    setSearchQuery('');
  }

  function startEditingNote(featuredId: string, currentNote: string | null) {
    setEditingNoteId(featuredId);
    setEditNoteValue(currentNote || '');
  }

  function cancelEditingNote() {
    setEditingNoteId(null);
    setEditNoteValue('');
  }

  async function saveNote(featuredId: string) {
    try {
      await featuredService.updateFeaturedNote(featuredId, editNoteValue);
      setFeatured(prev => prev.map(item =>
        item.id === featuredId ? { ...item, note: editNoteValue } : item
      ));
      toast({ title: 'Success', description: 'Note updated' });
      setEditingNoteId(null);
      setEditNoteValue('');
    } catch (error) {
      console.error('Error updating note:', error);
      toast({ title: 'Error', description: 'Failed to update note', variant: 'destructive' });
    }
  }

  async function handleDelete(featuredId: string, titleName: string) {
    if (!confirm(`Remove "${titleName}" from featured titles?`)) return;

    setDeletingId(featuredId);
    try {
      await featuredService.removeFeaturedTitle(featuredId);
      toast({ title: 'Success', description: 'Title removed from featured' });
      await loadData();
    } catch (error) {
      console.error('Error deleting featured:', error);
      toast({ title: 'Error', description: 'Failed to remove featured title', variant: 'destructive' });
    } finally {
      setDeletingId(null);
    }
  }

  async function handleAssignSection(featuredId: string, sectionId: string | null) {
    try {
      await featuredService.assignTitleToSection(featuredId, sectionId);
      await loadData();
      toast({ title: 'Success', description: 'Title moved to section' });
    } catch (error) {
      console.error('Error assigning section:', error);
      toast({ title: 'Error', description: 'Failed to assign section', variant: 'destructive' });
    }
  }

  // Section management handlers
  async function handleCreateSection(name: string, description?: string) {
    try {
      await featuredService.createSection(name, description);
      await loadData();
      toast({ title: 'Success', description: 'Section created' });
    } catch (error) {
      console.error('Error creating section:', error);
      toast({ title: 'Error', description: 'Failed to create section', variant: 'destructive' });
    }
  }

  async function handleUpdateSection(id: string, updates: Partial<FeaturedSection>) {
    try {
      await featuredService.updateSection(id, updates);
      await loadData();
    } catch (error) {
      console.error('Error updating section:', error);
      toast({ title: 'Error', description: 'Failed to update section', variant: 'destructive' });
    }
  }

  async function handleDeleteSection(id: string) {
    try {
      await featuredService.deleteSection(id);
      await loadData();
      toast({ title: 'Success', description: 'Section deleted' });
    } catch (error) {
      console.error('Error deleting section:', error);
      toast({ title: 'Error', description: 'Failed to delete section', variant: 'destructive' });
    }
  }

  async function handleReorderSections(sectionIds: string[]) {
    try {
      const reorderedSections = sectionIds.map((id, index) => {
        const section = sections.find(s => s.id === id)!;
        return { ...section, display_order: index };
      });
      setSections(reorderedSections);
      await featuredService.reorderSections(sectionIds);
    } catch (error) {
      console.error('Error reordering sections:', error);
      toast({ title: 'Error', description: 'Failed to reorder sections', variant: 'destructive' });
      await loadData();
    }
  }

  // Title drag-and-drop within a section
  function handleTitleDragEnd(event: DragEndEvent, sectionId: string | null) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const titlesInSection = featured
      .filter(f => f.section_id === sectionId)
      .sort((a, b) => a.display_order - b.display_order);

    const oldIndex = titlesInSection.findIndex(f => f.id === active.id);
    const newIndex = titlesInSection.findIndex(f => f.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const newOrder = arrayMove(titlesInSection, oldIndex, newIndex);
    const newFeaturedIds = newOrder.map(f => f.id);

    setFeatured(prev => {
      const updated = [...prev];
      newOrder.forEach((item, index) => {
        const idx = updated.findIndex(f => f.id === item.id);
        if (idx !== -1) {
          updated[idx] = { ...updated[idx], display_order: index };
        }
      });
      return updated;
    });

    featuredService.reorderTitlesInSection(newFeaturedIds).catch((error) => {
      console.error('Error reordering titles:', error);
      toast({ title: 'Error', description: 'Failed to reorder titles', variant: 'destructive' });
      loadData();
    });
  }

  const uncategorizedTitles = featured
    .filter(f => f.section_id === null)
    .sort((a, b) => a.display_order - b.display_order);

  // Render card grid for a group of titles
  const renderTitlesGrid = (titles: FeaturedWithTitle[], sectionId: string | null) => (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={(event) => handleTitleDragEnd(event, sectionId)}
    >
      <SortableContext
        items={titles.map(t => t.id)}
        strategy={rectSortingStrategy}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
          {titles.map((item) => (
            <DraggableTitleCard
              key={item.id}
              item={item}
              sections={sections}
              onEditNote={startEditingNote}
              onDelete={handleDelete}
              onAssignSection={handleAssignSection}
              editingNoteId={editingNoteId}
              editNoteValue={editNoteValue}
              setEditNoteValue={setEditNoteValue}
              onSaveNote={saveNote}
              onCancelNote={cancelEditingNote}
              deleting={deletingId === item.id}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-black">Featured Titles Management</h1>
            <p className="text-sm text-gray-600 mt-1">
              Manage featured titles and sections displayed on the homepage
            </p>
          </div>
          <Button
            variant="outline"
            onClick={loadData}
            className="border-gray-300"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-gray-600">Featured Titles</div>
              <div className="text-2xl font-bold text-black mt-1">{featured.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-gray-600">Sections</div>
              <div className="text-2xl font-bold text-black mt-1">{sections.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-gray-600">Active Sections</div>
              <div className="text-2xl font-bold text-black mt-1">
                {sections.filter(s => s.is_active).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-gray-600">Total Titles</div>
              <div className="text-2xl font-bold text-black mt-1">{totalTitlesCount}</div>
            </CardContent>
          </Card>
        </div>

        {/* Section Manager */}
        <SectionManager
          sections={sections}
          onCreateSection={handleCreateSection}
          onUpdateSection={handleUpdateSection}
          onDeleteSection={handleDeleteSection}
          onReorderSections={handleReorderSections}
        />

        {/* Add Featured Title */}
        <Card>
          <CardContent className="p-4">
            <h2 className="text-lg font-semibold text-black mb-4">Add Featured Title</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Title Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title
                </label>
                {selectedTitle ? (
                  <div className="flex items-center gap-2 p-2 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-black truncate">
                        {selectedTitle.title_name_en || selectedTitle.title_name_kr}
                      </div>
                      {selectedTitle.title_name_en && selectedTitle.title_name_kr && (
                        <div className="text-xs text-gray-500 truncate">{selectedTitle.title_name_kr}</div>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={clearSelectedTitle}
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div ref={searchRef} className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Search titles..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setShowResults(true);
                      }}
                      onFocus={() => setShowResults(true)}
                      disabled={adding || loading}
                      className="pl-10"
                    />

                    {showResults && searchQuery.trim() && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                        {searching ? (
                          <div className="px-4 py-3 text-sm text-gray-500 flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Searching...
                          </div>
                        ) : filteredTitles.length > 0 ? (
                          filteredTitles.map(title => {
                            const isAlreadyFeatured = isTitleFeatured(title.title_id);
                            return (
                              <button
                                key={title.title_id}
                                type="button"
                                onClick={() => !isAlreadyFeatured && handleSelectTitle(title)}
                                disabled={isAlreadyFeatured}
                                className={`w-full px-4 py-2 text-left border-b border-gray-100 last:border-b-0 ${
                                  isAlreadyFeatured
                                    ? 'bg-gray-50 cursor-not-allowed opacity-60'
                                    : 'hover:bg-gray-50'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="text-sm font-medium text-gray-900">
                                    {title.title_name_en || title.title_name_kr}
                                  </div>
                                  {isAlreadyFeatured && (
                                    <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                                      Featured
                                    </span>
                                  )}
                                </div>
                                {title.title_name_en && title.title_name_kr && (
                                  <div className="text-xs text-gray-500">{title.title_name_kr}</div>
                                )}
                              </button>
                            );
                          })
                        ) : (
                          <div className="px-4 py-3 text-sm text-gray-500">
                            No titles found
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Section Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Section
                </label>
                <Select
                  value={newSectionId || 'uncategorized'}
                  onValueChange={(value) => setNewSectionId(value === 'uncategorized' ? null : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select section" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="uncategorized">Uncategorized</SelectItem>
                    {sections.map((section) => (
                      <SelectItem key={section.id} value={section.id}>
                        {section.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Note */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Note (Optional)
                </label>
                <Input
                  placeholder="Why is this title featured?"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  disabled={adding || loading}
                />
              </div>
            </div>

            <div className="mt-4">
              <Button
                onClick={handleAddFeatured}
                disabled={!selectedTitle || adding || loading}
                className="bg-hanok-teal hover:bg-hanok-teal/90"
              >
                {adding ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Featured Title
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Featured Titles with Tab Navigation */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : featured.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No featured titles yet. Add titles above to feature them.
              </div>
            ) : (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="border-b border-gray-200 px-4">
                  <TabsList className="w-full justify-start bg-transparent rounded-none h-auto p-0 gap-0 flex-wrap">
                    {/* Uncategorized Tab */}
                    <TabsTrigger
                      value="uncategorized"
                      className="data-[state=active]:border-b-2 data-[state=active]:border-hanok-teal data-[state=active]:text-hanok-teal data-[state=active]:bg-transparent rounded-none px-4 py-3 text-gray-600 hover:text-gray-900"
                    >
                      <FolderOpen className="w-4 h-4 mr-2" />
                      Uncategorized
                      <span className="ml-2 px-1.5 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">
                        {uncategorizedTitles.length}
                      </span>
                    </TabsTrigger>

                    {/* Section Tabs */}
                    {sections.map((section) => {
                      const sectionTitles = featured.filter(f => f.section_id === section.id);
                      return (
                        <TabsTrigger
                          key={section.id}
                          value={section.id}
                          className="data-[state=active]:border-b-2 data-[state=active]:border-hanok-teal data-[state=active]:text-hanok-teal data-[state=active]:bg-transparent rounded-none px-4 py-3 text-gray-600 hover:text-gray-900"
                        >
                          <LayoutGrid className="w-4 h-4 mr-2" />
                          {section.name}
                          <span className="ml-2 px-1.5 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">
                            {sectionTitles.length}
                          </span>
                          {!section.is_active && (
                            <span className="ml-1.5 px-1.5 py-0.5 text-xs rounded-full bg-gray-200 text-gray-500">
                              Hidden
                            </span>
                          )}
                        </TabsTrigger>
                      );
                    })}
                  </TabsList>
                </div>

                {/* Tab Contents */}
                <TabsContent value="uncategorized" className="mt-0">
                  {uncategorizedTitles.length > 0 ? (
                    renderTitlesGrid(uncategorizedTitles, null)
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      No uncategorized titles
                    </div>
                  )}
                </TabsContent>

                {sections.map((section) => {
                  const sectionTitles = featured
                    .filter(f => f.section_id === section.id)
                    .sort((a, b) => a.display_order - b.display_order);
                  return (
                    <TabsContent key={section.id} value={section.id} className="mt-0">
                      {sectionTitles.length > 0 ? (
                        renderTitlesGrid(sectionTitles, section.id)
                      ) : (
                        <div className="text-center py-12 text-gray-500">
                          No titles in this section
                        </div>
                      )}
                    </TabsContent>
                  );
                })}
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
