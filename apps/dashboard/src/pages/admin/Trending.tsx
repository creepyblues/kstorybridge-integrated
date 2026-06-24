import { useState, useEffect, useMemo, useRef } from 'react';
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
import { TitleEditModal } from '@/components/admin/TitleEditModal';
import { useToast } from '@/hooks/use-toast';
import { featuredService, type FeaturedWithTitle } from '@/services/featuredService';
import { titlesService, type Title } from '@/services/titlesService';
import { LowPriorityBadge } from '@/components/admin/LowPriorityBadge';
import type { FeaturedSection } from '@/types/featured';
import { Icon } from '@iconify/react';

type SortField = 'title' | 'section' | 'added';
type SortDirection = 'asc' | 'desc';

export default function AdminTrending() {
  const { toast } = useToast();
  const [featured, setFeatured] = useState<FeaturedWithTitle[]>([]);
  const [sections, setSections] = useState<FeaturedSection[]>([]);
  const [totalTitlesCount, setTotalTitlesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('uncategorized');

  // Note editing state
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editNoteValue, setEditNoteValue] = useState('');

  // Title edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedTitleId, setSelectedTitleId] = useState<string | null>(null);

  // Add title state
  const [selectedTitle, setSelectedTitle] = useState<Title | null>(null);
  const [addSearchQuery, setAddSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Title[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [newSectionId, setNewSectionId] = useState<string | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    loadData();
  }, []);

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

  // Search titles when query changes (debounced)
  useEffect(() => {
    const query = addSearchQuery.trim();
    if (!query) {
      setSearchResults([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await titlesService.getTitles({ search: query, includeAllPriorities: true });
        setSearchResults(results.slice(0, 10));
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [addSearchQuery]);

  async function loadData() {
    setLoading(true);
    try {
      const [featuredData, sectionsData] = await Promise.all([
        featuredService.getAllFeatured(),
        featuredService.getAllSections(),
      ]);
      setFeatured(featuredData);
      setSections(sectionsData);
      const allTitles = await titlesService.getTitles({ includeAllPriorities: true });
      setTotalTitlesCount(allTitles.length);
    } catch (error: any) {
      console.error('Error loading data:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  // Filter and sort titles for a specific section
  const getFilteredTitlesForSection = (sectionId: string | null) => {
    let result = featured.filter(f => f.section_id === sectionId);

    // Filter by search query
    if (searchQuery) {
      result = result.filter((item) => {
        const titleEn = item.titles?.title_name_en?.toLowerCase() || '';
        const titleKr = item.titles?.title_name_kr?.toLowerCase() || '';
        const note = item.note?.toLowerCase() || '';
        const query = searchQuery.toLowerCase();
        return titleEn.includes(query) || titleKr.includes(query) || note.includes(query);
      });
    }

    // Sort
    if (sortField) {
      result.sort((a, b) => {
        let aVal: string | number = '';
        let bVal: string | number = '';

        switch (sortField) {
          case 'title':
            aVal = a.titles?.title_name_en || a.titles?.title_name_kr || '';
            bVal = b.titles?.title_name_en || b.titles?.title_name_kr || '';
            break;
          case 'section':
            aVal = getSectionName(a.section_id);
            bVal = getSectionName(b.section_id);
            break;
          case 'added':
            aVal = new Date(a.created_at).getTime();
            bVal = new Date(b.created_at).getTime();
            break;
        }

        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return sortDirection === 'asc'
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);
        }

        return sortDirection === 'asc'
          ? (aVal as number) - (bVal as number)
          : (bVal as number) - (aVal as number);
      });
    }

    return result;
  };

  // Uncategorized titles count
  const uncategorizedTitles = useMemo(() =>
    featured.filter(f => f.section_id === null),
    [featured]
  );

  function getSectionName(sectionId: string | null): string {
    if (!sectionId) return 'Uncategorized';
    const section = sections.find((s) => s.id === sectionId);
    return section?.name || 'Unknown';
  }

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <Icon icon="solar:alt-arrow-up-bold-duotone" className="h-3 w-3 ml-1 opacity-50" />;
    }
    return sortDirection === 'asc'
      ? <Icon icon="solar:arrow-up-bold-duotone" className="h-3 w-3 ml-1" />
      : <Icon icon="solar:arrow-down-bold-duotone" className="h-3 w-3 ml-1" />;
  };

  async function handleDelete(featuredId: string, titleName: string) {
    if (!confirm(`Remove "${titleName}" from featured titles?`)) return;

    setDeletingId(featuredId);
    try {
      await featuredService.removeFeaturedTitle(featuredId);
      toast({ title: 'Success', description: 'Title removed from featured' });
      await loadData();
    } catch (error: any) {
      console.error('Error deleting featured:', error);
      toast({ title: 'Error', description: 'Failed to remove featured title', variant: 'destructive' });
    } finally {
      setDeletingId(null);
    }
  }

  // Note editing handlers
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

  // Title edit handler
  function handleEditTitle(titleId: string) {
    setSelectedTitleId(titleId);
    setEditModalOpen(true);
  }

  // Section assignment handler
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

  function handleSelectTitle(title: Title) {
    setSelectedTitle(title);
    setAddSearchQuery('');
    setShowResults(false);
  }

  function clearSelectedTitle() {
    setSelectedTitle(null);
    setAddSearchQuery('');
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

    setAdding(true);
    try {
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

      toast({ title: 'Success', description: 'Title added to featured' });
      setSelectedTitle(null);
      setAddSearchQuery('');
      setNewNote('');
      setNewSectionId(null);
      await loadData();
    } catch (error: any) {
      console.error('Error adding featured:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to add featured title',
        variant: 'destructive',
      });
    } finally {
      setAdding(false);
    }
  }

  // Section management handlers
  async function handleCreateSection(name: string, description?: string) {
    try {
      await featuredService.createSection(name, description);
      await loadData();
      toast({ title: 'Success', description: 'Section created' });
    } catch (error: any) {
      console.error('Error creating section:', error);
      toast({ title: 'Error', description: 'Failed to create section', variant: 'destructive' });
    }
  }

  async function handleUpdateSection(id: string, updates: Partial<FeaturedSection>) {
    try {
      await featuredService.updateSection(id, updates);
      await loadData();
    } catch (error: any) {
      console.error('Error updating section:', error);
      toast({ title: 'Error', description: 'Failed to update section', variant: 'destructive' });
    }
  }

  async function handleDeleteSection(id: string) {
    try {
      await featuredService.deleteSection(id);
      await loadData();
      toast({ title: 'Success', description: 'Section deleted' });
    } catch (error: any) {
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
    } catch (error: any) {
      console.error('Error reordering sections:', error);
      toast({ title: 'Error', description: 'Failed to reorder sections', variant: 'destructive' });
      await loadData();
    }
  }

  // Handle drag end for reordering titles within a section
  async function handleDragEnd(event: DragEndEvent, sectionId: string | null) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    // Get titles for this section
    const sectionTitles = featured.filter(f => f.section_id === sectionId);
    const oldIndex = sectionTitles.findIndex(f => f.id === active.id);
    const newIndex = sectionTitles.findIndex(f => f.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    // Reorder locally first for immediate feedback
    const reorderedTitles = arrayMove(sectionTitles, oldIndex, newIndex);
    const newFeaturedIds = reorderedTitles.map(f => f.id);

    // Update local state
    setFeatured(prev => {
      const otherTitles = prev.filter(f => f.section_id !== sectionId);
      return [...otherTitles, ...reorderedTitles];
    });

    // Persist to database
    try {
      await featuredService.reorderTitlesInSection(newFeaturedIds);
    } catch (error: any) {
      console.error('Error reordering titles:', error);
      toast({ title: 'Error', description: 'Failed to reorder titles', variant: 'destructive' });
      await loadData(); // Reload to reset state
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  const isTitleFeatured = (titleId: string) => featured.some((f) => f.title_id === titleId);

  // Sortable row component
  function SortableRow({ item }: { item: FeaturedWithTitle }) {
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

    const titleName = item.titles?.title_name_en || item.titles?.title_name_kr || 'Unknown';
    const titleNameKr = item.titles?.title_name_kr;
    const isEditingNote = editingNoteId === item.id;

    return (
      <tr ref={setNodeRef} style={style} className="hover:bg-gray-50 bg-white">
        {/* Drag Handle */}
        <td className="px-2 py-4 whitespace-nowrap">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 p-1"
          >
            <Icon icon="solar:menu-dots-bold-duotone" className="h-5 w-5" />
          </div>
        </td>

        {/* Title */}
        <td className="px-4 py-4 whitespace-nowrap">
          <button
            onClick={() => item.title_id && handleEditTitle(item.title_id)}
            className="flex items-center text-left hover:bg-gray-100 rounded-lg p-1 -m-1 transition-colors"
          >
            {item.titles?.title_image && (
              <div className="flex-shrink-0 h-10 w-10 rounded overflow-hidden bg-gray-100 mr-3">
                <img
                  src={item.titles.title_image}
                  alt={titleName}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <div className="text-sm font-medium text-gray-900 hover:text-hanok-teal">{titleName}</div>
                <LowPriorityBadge priority={item.titles?.priority} />
              </div>
              {item.titles?.title_name_en && titleNameKr && (
                <div className="text-xs text-gray-500">{titleNameKr}</div>
              )}
            </div>
          </button>
        </td>

        {/* Section Dropdown */}
        <td className="px-4 py-4 whitespace-nowrap">
          <Select
            value={item.section_id || 'uncategorized'}
            onValueChange={(value) => handleAssignSection(item.id, value === 'uncategorized' ? null : value)}
          >
            <SelectTrigger className="h-8 w-[140px] text-xs">
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
        </td>

        {/* Editable Note */}
        <td className="px-4 py-4">
          {isEditingNote ? (
            <div className="flex items-center gap-2">
              <Input
                value={editNoteValue}
                onChange={(e) => setEditNoteValue(e.target.value)}
                placeholder="Enter note..."
                className="h-8 text-sm w-48"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    saveNote(item.id);
                  } else if (e.key === 'Escape') {
                    cancelEditingNote();
                  }
                }}
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => saveNote(item.id)}
                className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
              >
                <Icon icon="solar:check-read-bold-duotone" className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={cancelEditingNote}
                className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              >
                <Icon icon="solar:close-circle-bold-duotone" className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div
              className="flex items-center gap-2 group cursor-pointer"
              onClick={() => startEditingNote(item.id, item.note)}
            >
              <div className="text-sm text-gray-600 max-w-xs truncate">
                {item.note || <span className="text-gray-400 italic">No note</span>}
              </div>
              <Icon icon="solar:pen-bold-duotone" className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          )}
        </td>

        {/* Added Date */}
        <td className="px-4 py-4 whitespace-nowrap">
          <div className="text-sm text-gray-600">
            {formatDate(item.created_at)}
          </div>
        </td>

        {/* Actions */}
        <td className="px-4 py-4 whitespace-nowrap text-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(item.id, titleName)}
            disabled={deletingId === item.id}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            {deletingId === item.id ? (
              <Icon icon="solar:refresh-circle-bold-duotone" className="h-4 w-4 animate-spin" />
            ) : (
              <Icon icon="solar:trash-bin-trash-bold-duotone" className="h-4 w-4" />
            )}
          </Button>
        </td>
      </tr>
    );
  }

  // Render table for a section
  const renderTitlesTable = (titles: FeaturedWithTitle[], sectionId: string | null) => {
    if (titles.length === 0) {
      return (
        <div className="text-center py-12 text-gray-500">
          {searchQuery ? 'No matching titles found' : 'No titles in this section'}
        </div>
      );
    }

    return (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={(event) => handleDragEnd(event, sectionId)}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider w-10">
                  <span className="sr-only">Drag</span>
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                  onClick={() => handleSort('title')}
                >
                  <div className="flex items-center">
                    Title
                    <SortIcon field="title" />
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Section
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Note
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                  onClick={() => handleSort('added')}
                >
                  <div className="flex items-center">
                    Added
                    <SortIcon field="added" />
                  </div>
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <SortableContext
              items={titles.map(t => t.id)}
              strategy={verticalListSortingStrategy}
            >
              <tbody className="bg-white divide-y divide-gray-200">
                {titles.map((item) => (
                  <SortableRow key={item.id} item={item} />
                ))}
              </tbody>
            </SortableContext>
          </table>
        </div>
        <p className="text-xs text-gray-400 px-4 py-2">
          Drag rows to reorder titles within this section.
        </p>
      </DndContext>
    );
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-black">Trending Titles</h1>
            <p className="text-sm text-gray-600 mt-1">
              Manage featured/trending titles displayed on the homepage
            </p>
          </div>
          <Button
            variant="outline"
            onClick={loadData}
            disabled={loading}
            className="border-gray-300"
          >
            <Icon icon="solar:refresh-bold-duotone" className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
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
                {sections.filter((s) => s.is_active).length}
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
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-medium text-black truncate">
                          {selectedTitle.title_name_en || selectedTitle.title_name_kr}
                        </div>
                        <LowPriorityBadge priority={selectedTitle.priority} />
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
                      <Icon icon="solar:close-circle-bold-duotone" className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div ref={searchRef} className="relative">
                    <Icon icon="solar:magnifer-bold-duotone" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Search titles..."
                      value={addSearchQuery}
                      onChange={(e) => {
                        setAddSearchQuery(e.target.value);
                        setShowResults(true);
                      }}
                      onFocus={() => setShowResults(true)}
                      disabled={adding || loading}
                      className="pl-10"
                    />

                    {showResults && addSearchQuery.trim() && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                        {searching ? (
                          <div className="px-4 py-3 text-sm text-gray-500 flex items-center gap-2">
                            <Icon icon="solar:refresh-circle-bold-duotone" className="h-4 w-4 animate-spin" />
                            Searching...
                          </div>
                        ) : searchResults.length > 0 ? (
                          searchResults.map(title => {
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
                                  <div className="flex items-center gap-2">
                                    <div className="text-sm font-medium text-gray-900">
                                      {title.title_name_en || title.title_name_kr}
                                    </div>
                                    <LowPriorityBadge priority={title.priority} />
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
                    <Icon icon="solar:refresh-circle-bold-duotone" className="h-4 w-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Icon icon="solar:add-circle-bold-duotone" className="h-4 w-4 mr-2" />
                    Add Featured Title
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Search Filter */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Icon icon="solar:magnifer-bold-duotone" className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Filter featured titles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Featured Titles with Tab Navigation */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Icon icon="solar:refresh-circle-bold-duotone" className="h-8 w-8 animate-spin text-gray-400" />
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
                      <Icon icon="solar:folder-bold-duotone" className="w-4 h-4 mr-2" />
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
                          <Icon icon="solar:widget-2-bold-duotone" className="w-4 h-4 mr-2" />
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
                  {renderTitlesTable(getFilteredTitlesForSection(null), null)}
                </TabsContent>

                {sections.map((section) => (
                  <TabsContent key={section.id} value={section.id} className="mt-0">
                    {renderTitlesTable(getFilteredTitlesForSection(section.id), section.id)}
                  </TabsContent>
                ))}
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Title Edit Modal */}
      <TitleEditModal
        titleId={selectedTitleId}
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        onSaved={loadData}
      />
    </AdminLayout>
  );
}
