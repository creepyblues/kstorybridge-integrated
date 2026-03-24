/**
 * Weekly Title Admin Page
 *
 * Allows admins to assign one title per week, input editorial content,
 * run analyzer tools, and update title data with conflict resolution.
 */

import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { TitleEditModal } from '@/components/admin/TitleEditModal';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Icon } from '@iconify/react';
import { titlesService, type Title } from '@/services/titlesService';
import {
  weeklyTitleService,
  type WeeklyTitleWithTitle,
  getMondayOfWeek,
  formatDateToISO,
} from '@/services/weeklyTitleService';
import { CompsGeneratorModal } from '@/components/admin/CompsGeneratorModal';
import { FormatFitGeneratorModal } from '@/components/format-fit/FormatFitGeneratorModal';

export default function WeeklyTitle() {
  const { toast } = useToast();
  const { user } = useAuth();
  const searchRef = useRef<HTMLDivElement>(null);

  // Week selection state
  const [selectedWeek, setSelectedWeek] = useState<Date>(() => getMondayOfWeek(new Date()));

  // Weekly title data
  const [weeklyTitle, setWeeklyTitle] = useState<WeeklyTitleWithTitle | null>(null);

  // Title search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Title[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedTitle, setSelectedTitle] = useState<Title | null>(null);

  // Save state
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Analyzer modals
  const [compsModalOpen, setCompsModalOpen] = useState(false);
  const [formatFitModalOpen, setFormatFitModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  // Load weekly title when week changes
  useEffect(() => {
    loadWeeklyTitle();
  }, [selectedWeek]);

  // Search titles debounced
  useEffect(() => {
    const query = searchQuery.trim();
    if (!query) {
      setSearchResults([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setSearching(true);
      try {
        // Use prioritizeTitleName for admin search - title name matches appear first
        const results = await titlesService.getTitles({
          search: query,
          prioritizeTitleName: true
        });
        setSearchResults(results.slice(0, 10));
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

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

  const loadWeeklyTitle = async () => {
    try {
      const weekOf = formatDateToISO(selectedWeek);
      const data = await weeklyTitleService.getWeeklyTitleByWeek(weekOf);
      setWeeklyTitle(data);

      if (data) {
        // Populate form with existing data
        setSelectedTitle(data.titles);
      } else {
        // Clear form
        setSelectedTitle(null);
      }
    } catch (error) {
      console.error('Error loading weekly title:', error);
      toast({
        title: 'Error',
        description: 'Failed to load weekly title data',
        variant: 'destructive',
      });
    }
  };

  const handleSelectTitle = (title: Title) => {
    setSelectedTitle(title);
    setSearchQuery('');
    setShowResults(false);
    // Auto-open TitleEditModal when title is selected
    setEditModalOpen(true);
  };

  const handleRemoveWeeklyTitle = async () => {
    if (weeklyTitle) {
      const confirmed = window.confirm('Remove this weekly title? This will delete it from the database.');
      if (!confirmed) return;

      setDeleting(true);
      try {
        await weeklyTitleService.deleteWeeklyTitle(weeklyTitle.id);
        toast({
          title: 'Removed',
          description: 'Weekly title has been removed',
        });
        await loadWeeklyTitle();
      } catch (error) {
        console.error('Error deleting weekly title:', error);
        toast({
          title: 'Error',
          description: 'Failed to remove weekly title',
          variant: 'destructive',
        });
      } finally {
        setDeleting(false);
      }
    } else {
      setSelectedTitle(null);
    }
    setSearchQuery('');
  };

  const handlePrevWeek = () => {
    const prevWeek = new Date(selectedWeek);
    prevWeek.setDate(prevWeek.getDate() - 7);
    setSelectedWeek(getMondayOfWeek(prevWeek));
  };

  const handleNextWeek = () => {
    const nextWeek = new Date(selectedWeek);
    nextWeek.setDate(nextWeek.getDate() + 7);
    setSelectedWeek(getMondayOfWeek(nextWeek));
  };

  const handleSaveWeeklyTitle = async () => {
    if (!selectedTitle || !user?.email) {
      toast({
        title: 'Error',
        description: 'Please select a title first',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const weekOf = formatDateToISO(selectedWeek);
      const inputData = {
        week_of: weekOf,
        title_id: selectedTitle.title_id,
        created_by: user.email,
      };

      if (weeklyTitle) {
        // Update existing - just update title_id
        await weeklyTitleService.updateWeeklyTitle(weeklyTitle.id, {
          title_id: selectedTitle.title_id,
        });
      } else {
        // Create new
        await weeklyTitleService.createWeeklyTitle(inputData);
      }

      toast({
        title: 'Success',
        description: 'Weekly title saved successfully',
      });

      await loadWeeklyTitle();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to save weekly title';
      console.error('Error saving weekly title:', error);
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const formatWeekDisplay = (date: Date): string => {
    const endOfWeek = new Date(date);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    return `${date.toLocaleDateString('en-US', options)} - ${endOfWeek.toLocaleDateString('en-US', options)}, ${date.getFullYear()}`;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-black">Weekly Title</h1>
        <p className="text-sm text-gray-600 mt-1">
          Curate a featured title for each week with editorial content
        </p>
      </div>

      {/* Week Selector */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePrevWeek}
              className="border-gray-300"
            >
              <Icon icon="solar:arrow-left-bold-duotone" className="h-4 w-4" />
            </Button>
            <div className="text-center min-w-[250px]">
              <div className="flex items-center justify-center gap-2">
                <Icon icon="solar:calendar-bold-duotone" className="h-5 w-5 text-hanok-teal" />
                <span className="text-lg font-semibold text-black">
                  {formatWeekDisplay(selectedWeek)}
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Week of {formatDateToISO(selectedWeek)}
              </div>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={handleNextWeek}
              className="border-gray-300"
            >
              <Icon icon="solar:arrow-right-bold-duotone" className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Select Title */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Icon icon="solar:bookmark-bold-duotone" className="h-5 w-5 text-hanok-teal" />
            Select Title
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {selectedTitle ? (
            <>
              <div className="flex items-center gap-4 p-4 bg-gray-50 border border-gray-200 rounded-xl">
                {selectedTitle.title_image && (
                  <img
                    src={selectedTitle.title_image}
                    alt={selectedTitle.title_name_en || selectedTitle.title_name_kr || ''}
                    className="w-16 h-20 object-cover rounded-lg"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <Link
                    to={`/buyers/titles/${selectedTitle.slug || selectedTitle.title_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-black truncate hover:text-hanok-teal hover:underline flex items-center gap-1"
                  >
                    {selectedTitle.title_name_en || selectedTitle.title_name_kr}
                    <Icon icon="solar:arrow-right-up-linear" className="h-3 w-3 text-gray-400" />
                  </Link>
                  {selectedTitle.title_name_en && selectedTitle.title_name_kr && (
                    <div className="text-sm text-gray-600 truncate">
                      {selectedTitle.title_name_kr}
                    </div>
                  )}
                  <div className="text-xs text-gray-500 mt-1">
                    {selectedTitle.content_format} • {(selectedTitle.genre as string[])?.join(', ') || 'No genre'}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditModalOpen(true)}
                    className="border-gray-300"
                  >
                    <Icon icon="solar:pen-bold-duotone" className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRemoveWeeklyTitle}
                    disabled={deleting}
                    className="border-gray-300"
                  >
                    {deleting ? (
                      <Icon icon="solar:refresh-circle-bold-duotone" className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <Icon icon="solar:close-circle-bold-duotone" className="h-4 w-4 mr-1" />
                    )}
                    {deleting ? 'Removing...' : 'Remove'}
                  </Button>
                </div>
              </div>

              {/* Save & Submit Section */}
              {!weeklyTitle ? (
                <Button
                  onClick={handleSaveWeeklyTitle}
                  disabled={!selectedTitle || saving}
                  className="w-full bg-hanok-teal hover:bg-hanok-teal/90"
                >
                  {saving ? (
                    <>
                      <Icon icon="solar:refresh-circle-bold-duotone" className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Icon icon="solar:diskette-bold-duotone" className="h-4 w-4 mr-2" />
                      Save as Weekly Title
                    </>
                  )}
                </Button>
              ) : weeklyTitle.submitted ? (
                <Button
                  disabled
                  className="w-full bg-green-600 hover:bg-green-600 cursor-default"
                >
                  <Icon icon="solar:check-circle-bold" className="h-4 w-4 mr-2" />
                  Submitted
                </Button>
              ) : (
                <Button
                  disabled
                  className="w-full bg-gray-500 hover:bg-gray-500 cursor-default"
                >
                  <Icon icon="solar:check-circle-bold" className="h-4 w-4 mr-2" />
                  Saved as Weekly Title
                </Button>
              )}
            </>
          ) : (
            <div ref={searchRef} className="relative">
              <Icon icon="solar:magnifer-bold-duotone" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search titles..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowResults(true);
                }}
                onFocus={() => setShowResults(true)}
                className="pl-10"
              />

              {showResults && searchQuery.trim() && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                  {searching ? (
                    <div className="px-4 py-3 text-sm text-gray-500 flex items-center gap-2">
                      <Icon icon="solar:refresh-circle-bold-duotone" className="h-4 w-4 animate-spin" />
                      Searching...
                    </div>
                  ) : searchResults.length > 0 ? (
                    searchResults.map((title) => (
                      <button
                        key={title.title_id}
                        onClick={() => handleSelectTitle(title)}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                      >
                        <div className="font-medium text-gray-900">
                          {title.title_name_en || title.title_name_kr}
                        </div>
                        {title.title_name_en && title.title_name_kr && (
                          <div className="text-xs text-gray-500">{title.title_name_kr}</div>
                        )}
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-sm text-gray-500">
                      No titles found
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Analyzer Modals */}
      {selectedTitle && (
        <>
          <CompsGeneratorModal
            titleId={selectedTitle.title_id}
            open={compsModalOpen}
            onOpenChange={setCompsModalOpen}
            onSaved={loadWeeklyTitle}
          />

          <FormatFitGeneratorModal
            titleId={selectedTitle.title_id}
            open={formatFitModalOpen}
            onOpenChange={setFormatFitModalOpen}
            onComplete={loadWeeklyTitle}
          />

          <TitleEditModal
            titleId={selectedTitle.title_id}
            open={editModalOpen}
            onOpenChange={setEditModalOpen}
            onSaved={loadWeeklyTitle}
          />
        </>
      )}
    </div>
  );
}
