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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { TitleEditModal } from '@/components/admin/TitleEditModal';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
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
import { IntelligenceResultsModal } from '@/components/admin/IntelligenceResultsModal';
import { KeyVisualsCollectorModal } from '@/components/admin/KeyVisualsCollectorModal';
import { FanSignalResultsModal } from '@/components/admin/FanSignalResultsModal';
import {
  collectIntelligenceByUrls,
  getIntelligenceTitleWithSources,
  collectFanEngagement,
  ingestToTitleWithAudit,
  parseUrl,
  type IntelligenceTitleWithSources,
  type FanSignalData,
  type ExtractedIntelligenceData,
} from '@/services/intelligenceService';
import { CompsAnalysisCard } from '@/components/title-detail/CompsAnalysisCard';
import { FormatFitDetailPanel } from '@/components/format-fit/FormatFitDetailPanel';
import {
  compsGeneratorService,
  type SuggestedComp,
} from '@/services/compsGeneratorService';

export default function WeeklyTitle() {
  const { toast } = useToast();
  const { user } = useAuth();
  const searchRef = useRef<HTMLDivElement>(null);

  // Week selection state
  const [selectedWeek, setSelectedWeek] = useState<Date>(() => getMondayOfWeek(new Date()));

  // Weekly title data
  const [weeklyTitle, setWeeklyTitle] = useState<WeeklyTitleWithTitle | null>(null);
  const [loading, setLoading] = useState(true);

  // Title search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Title[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedTitle, setSelectedTitle] = useState<Title | null>(null);

  // Step 6: Why This Title (description)
  const [inputDescription, setInputDescription] = useState('');

  // Save state
  const [saving, setSaving] = useState(false);
  const [savingDescription, setSavingDescription] = useState(false);
  const [isSavedDescription, setIsSavedDescription] = useState(false);

  // Analyzer modals
  const [compsModalOpen, setCompsModalOpen] = useState(false);
  const [formatFitModalOpen, setFormatFitModalOpen] = useState(false);
  const [intelligenceModalOpen, setIntelligenceModalOpen] = useState(false);
  const [keyVisualsModalOpen, setKeyVisualsModalOpen] = useState(false);
  const [fanSignalModalOpen, setFanSignalModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  // Submit state
  const [submitting, setSubmitting] = useState(false);

  // Intelligence data
  const [intelligenceResults, setIntelligenceResults] = useState<IntelligenceTitleWithSources | null>(null);
  const [fanSignalResults, setFanSignalResults] = useState<FanSignalData | null>(null);
  const [collectingIntelligence, setCollectingIntelligence] = useState(false);
  const [_collectingFanSignal, _setCollectingFanSignal] = useState(false); // Disabled feature
  const [isIngesting, setIsIngesting] = useState(false);

  // Analyzer results state
  const [compsAnalysis, setCompsAnalysis] = useState<SuggestedComp[] | null>(null);
  const [loadingComps, setLoadingComps] = useState(false);

  // Title display sections
  const [openSections, setOpenSections] = useState<string[]>(['basic', 'content', 'metrics']);

  // Analyzer running state
  const [runningAll, setRunningAll] = useState(false);
  const [currentAnalyzer, setCurrentAnalyzer] = useState<string | null>(null);

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
    setLoading(true);
    try {
      const weekOf = formatDateToISO(selectedWeek);
      const data = await weeklyTitleService.getWeeklyTitleByWeek(weekOf);
      setWeeklyTitle(data);

      // Reset save indicators on load
      setIsSavedDescription(false);

      if (data) {
        // Populate form with existing data
        setSelectedTitle(data.titles);
        setInputDescription(data.titles?.description || '');
        // Load comps analysis
        if (data.titles?.title_id) {
          loadCompsAnalysis(data.titles.title_id);
        }
      } else {
        // Clear form
        setSelectedTitle(null);
        setInputDescription('');
        setCompsAnalysis(null);
      }
    } catch (error) {
      console.error('Error loading weekly title:', error);
      toast({
        title: 'Error',
        description: 'Failed to load weekly title data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadCompsAnalysis = async (titleId: string) => {
    setLoadingComps(true);
    try {
      const { analysis } = await compsGeneratorService.getCompsWithAnalysis(titleId);
      setCompsAnalysis(analysis);
    } catch (error) {
      console.error('Error loading comps analysis:', error);
      setCompsAnalysis(null);
    } finally {
      setLoadingComps(false);
    }
  };

  const handleSelectTitle = (title: Title) => {
    setSelectedTitle(title);
    setSearchQuery('');
    setShowResults(false);
    loadCompsAnalysis(title.title_id);
    // Auto-open TitleEditModal when title is selected
    setEditModalOpen(true);
  };

  const clearSelectedTitle = () => {
    setSelectedTitle(null);
    setSearchQuery('');
    setCompsAnalysis(null);
  };

  const handleSubmitWeeklyTitle = async () => {
    if (!weeklyTitle) {
      toast({
        title: 'Error',
        description: 'Please save the weekly title first',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      await weeklyTitleService.submitWeeklyTitle(weeklyTitle.id);
      toast({
        title: 'Success',
        description: 'Weekly title submitted successfully',
      });
      await loadWeeklyTitle();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to submit weekly title';
      console.error('Error submitting weekly title:', error);
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
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

  // Step 7: Save description to titles table
  const handleSaveDescription = async () => {
    if (!selectedTitle) {
      toast({
        title: 'Error',
        description: 'Please select a title first',
        variant: 'destructive',
      });
      return;
    }

    setSavingDescription(true);
    try {
      await titlesService.updateTitle(selectedTitle.title_id, {
        description: inputDescription || undefined,
      });

      toast({
        title: 'Success',
        description: 'Description saved successfully',
      });

      setIsSavedDescription(true);
      await loadWeeklyTitle();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to save description';
      console.error('Error saving description:', error);
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setSavingDescription(false);
    }
  };

  // Analyzer handlers
  const handleCollectIntelligence = async () => {
    if (!selectedTitle?.title_url && !selectedTitle?.title_url_en) {
      toast({
        title: 'Error',
        description: 'No platform URL available for this title',
        variant: 'destructive',
      });
      return;
    }

    setCollectingIntelligence(true);
    try {
      const urlStrings = [selectedTitle.title_url, selectedTitle.title_url_en].filter(Boolean) as string[];
      const parsedUrls = urlStrings.map(url => parseUrl(url));
      const response = await collectIntelligenceByUrls(
        { urls: parsedUrls },
        user?.email || 'admin'
      );

      if (response.intelligenceTitleId) {
        const results = await getIntelligenceTitleWithSources(response.intelligenceTitleId);
        setIntelligenceResults(results);
        setIntelligenceModalOpen(true);
      }
    } catch (error) {
      console.error('Error collecting intelligence:', error);
      toast({
        title: 'Error',
        description: 'Failed to collect intelligence data',
        variant: 'destructive',
      });
    } finally {
      setCollectingIntelligence(false);
    }
  };

  const handleIngestIntelligence = async (selectedFields: Partial<ExtractedIntelligenceData>) => {
    if (!selectedTitle || !intelligenceResults) return;

    setIsIngesting(true);
    try {
      await ingestToTitleWithAudit(
        selectedTitle.title_id,
        selectedFields,
        intelligenceResults.id,
        user?.email || 'admin',
        'Ingested from Weekly Title page'
      );

      toast({
        title: 'Success',
        description: 'Intelligence data ingested successfully',
      });

      setIntelligenceModalOpen(false);
      await loadWeeklyTitle();
    } catch (error) {
      console.error('Error ingesting intelligence:', error);
      toast({
        title: 'Error',
        description: 'Failed to ingest intelligence data',
        variant: 'destructive',
      });
    } finally {
      setIsIngesting(false);
    }
  };

  // Disabled feature - kept for future use
  const handleCollectFanSignal = async () => {
    if (!selectedTitle) return;

    _setCollectingFanSignal(true);
    try {
      const titleName = selectedTitle.title_name_en || selectedTitle.title_name_kr || '';
      const results = await collectFanEngagement(
        {
          titleName,
          sources: ['reddit', 'ao3', 'comick'],
        },
        user?.email || 'admin'
      );

      setFanSignalResults(results);
      setFanSignalModalOpen(true);
    } catch (error) {
      console.error('Error collecting fan signals:', error);
      toast({
        title: 'Error',
        description: 'Failed to collect fan engagement data',
        variant: 'destructive',
      });
    } finally {
      _setCollectingFanSignal(false);
    }
  };

  const handleRunAllAnalyzers = async () => {
    if (!selectedTitle) return;

    setRunningAll(true);
    const analyzers = [
      { name: 'Comps Generator', action: () => setCompsModalOpen(true) },
      { name: 'Format Fit', action: () => setFormatFitModalOpen(true) },
      { name: 'Title Scraper', action: handleCollectIntelligence },
    ];

    for (const analyzer of analyzers) {
      setCurrentAnalyzer(analyzer.name);
      await analyzer.action();
      // Wait a bit between analyzers
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    setCurrentAnalyzer(null);
    setRunningAll(false);

    toast({
      title: 'Complete',
      description: 'All analyzers have been triggered',
    });
  };

  const toggleSection = (section: string) => {
    setOpenSections((prev) =>
      prev.includes(section)
        ? prev.filter((s) => s !== section)
        : [...prev, section]
    );
  };

  const formatWeekDisplay = (date: Date): string => {
    const endOfWeek = new Date(date);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    return `${date.toLocaleDateString('en-US', options)} - ${endOfWeek.toLocaleDateString('en-US', options)}, ${date.getFullYear()}`;
  };

  const formatFieldValue = (value: unknown): string => {
    if (value === null || value === undefined) return '-';
    if (Array.isArray(value)) {
      if (value.length === 0) return '-';
      return value.join(', ');
    }
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-black">Weekly Title</h1>
          <p className="text-sm text-gray-600 mt-1">
            Curate a featured title for each week with editorial content
          </p>
        </div>
        <Button
          variant="outline"
          onClick={loadWeeklyTitle}
          disabled={loading}
          className="border-gray-300"
        >
          <Icon icon="solar:refresh-bold-duotone" className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
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
            Step 1. Select Title
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedTitle ? (
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
                  to={`/buyers/titles/${selectedTitle.title_id}`}
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
                  onClick={clearSelectedTitle}
                  className="border-gray-300"
                >
                  <Icon icon="solar:close-circle-bold-duotone" className="h-4 w-4 mr-1" />
                  Remove
                </Button>
              </div>
            </div>
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

      {/* Step 2. Save & Submit */}
      {selectedTitle && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Icon icon="solar:check-circle-bold-duotone" className="h-5 w-5 text-hanok-teal" />
              Step 2. Save & Submit
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!weeklyTitle ? (
              <>
                <p className="text-sm text-gray-600">
                  Save this title as the weekly featured title. You can edit the title details using the Edit button above.
                </p>
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
              </>
            ) : weeklyTitle.submitted ? (
              <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                <div className="flex items-center gap-2 text-green-700">
                  <Icon icon="solar:check-circle-bold" className="h-5 w-5" />
                  <span className="font-medium">Submitted</span>
                </div>
                {weeklyTitle.submitted_at && (
                  <p className="text-sm text-green-600 mt-1">
                    Submitted on {new Date(weeklyTitle.submitted_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                )}
              </div>
            ) : (
              <>
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
                  <div className="flex items-center gap-2 text-gray-700">
                    <Icon icon="solar:diskette-bold" className="h-5 w-5" />
                    <span className="font-medium">Saved as Weekly Title</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    The title data will be pulled from the database. Use the Edit button to update title details before submitting.
                  </p>
                </div>
                <Button
                  onClick={handleSubmitWeeklyTitle}
                  disabled={submitting}
                  className="w-full bg-hanok-teal hover:bg-hanok-teal/90"
                >
                  {submitting ? (
                    <>
                      <Icon icon="solar:refresh-circle-bold-duotone" className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Icon icon="solar:check-circle-bold-duotone" className="h-4 w-4 mr-2" />
                      Submit Weekly Title
                    </>
                  )}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Analyzer Tools */}
      {selectedTitle && weeklyTitle && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Icon icon="solar:magic-stick-3-bold-duotone" className="h-5 w-5 text-hanok-teal" />
              Step 3. Analyzer Tools
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
              <Button
                variant="outline"
                onClick={() => setCompsModalOpen(true)}
                disabled={runningAll}
                className="border-gray-300 justify-start"
              >
                <Icon icon="solar:clapperboard-open-play-bold-duotone" className="h-4 w-4 mr-2" />
                Comps Generator
              </Button>

              <Button
                variant="outline"
                onClick={() => setFormatFitModalOpen(true)}
                disabled={runningAll}
                className="border-gray-300 justify-start"
              >
                <Icon icon="solar:chart-square-bold-duotone" className="h-4 w-4 mr-2" />
                Format Fit
              </Button>

              <Button
                variant="outline"
                onClick={handleCollectIntelligence}
                disabled={collectingIntelligence || runningAll}
                className="border-gray-300 justify-start"
              >
                {collectingIntelligence ? (
                  <Icon icon="solar:refresh-circle-bold-duotone" className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Icon icon="solar:link-bold-duotone" className="h-4 w-4 mr-2" />
                )}
                Title Scraper
              </Button>

              <Button
                variant="outline"
                onClick={() => setKeyVisualsModalOpen(true)}
                disabled={true}
                className="border-gray-300 justify-start opacity-50 cursor-not-allowed"
              >
                <Icon icon="solar:gallery-bold-duotone" className="h-4 w-4 mr-2" />
                Key Visuals
              </Button>

              <Button
                variant="outline"
                onClick={handleCollectFanSignal}
                disabled={true}
                className="border-gray-300 justify-start opacity-50 cursor-not-allowed"
              >
                <Icon icon="solar:users-group-rounded-bold-duotone" className="h-4 w-4 mr-2" />
                Fan Signals
              </Button>

              <Button
                variant="outline"
                onClick={handleRunAllAnalyzers}
                disabled={runningAll}
                className="border-hanok-teal text-hanok-teal hover:bg-hanok-teal/10 justify-start"
              >
                {runningAll ? (
                  <>
                    <Icon icon="solar:refresh-circle-bold-duotone" className="h-4 w-4 mr-2 animate-spin" />
                    {currentAnalyzer}...
                  </>
                ) : (
                  <>
                    <Icon icon="solar:play-bold-duotone" className="h-4 w-4 mr-2" />
                    Run All
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analyzer Results - Step 4 */}
      {selectedTitle && weeklyTitle && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Icon icon="solar:chart-2-bold-duotone" className="h-5 w-5 text-hanok-teal" />
              Step 4. Analyzer Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Comps Analysis Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Icon icon="solar:clapperboard-open-play-bold-duotone" className="h-4 w-4 text-purple-500" />
                  Comparable Titles
                </h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCompsModalOpen(true)}
                  className="text-xs text-purple-600 hover:text-purple-700"
                >
                  <Icon icon="solar:refresh-bold-duotone" className="h-3 w-3 mr-1" />
                  {compsAnalysis && compsAnalysis.length > 0 ? 'Regenerate' : 'Generate'}
                </Button>
              </div>

              {loadingComps ? (
                <div className="flex items-center justify-center py-8">
                  <Icon icon="solar:refresh-circle-bold-duotone" className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : compsAnalysis && compsAnalysis.length > 0 ? (
                <CompsAnalysisCard
                  compsAnalysis={compsAnalysis}
                  showTitle={false}
                />
              ) : (
                <div className="border border-dashed border-gray-300 rounded-xl p-6 text-center">
                  <Icon icon="solar:clapperboard-open-play-bold-duotone" className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No comps analysis yet</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCompsModalOpen(true)}
                    className="mt-3 border-purple-300 text-purple-600 hover:bg-purple-50"
                  >
                    <Icon icon="solar:play-bold-duotone" className="h-3.5 w-3.5 mr-1.5" />
                    Run Comps Generator
                  </Button>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200" />

            {/* Format Fit Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Icon icon="solar:chart-square-bold-duotone" className="h-4 w-4 text-blue-500" />
                  Format Fit Analysis
                </h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFormatFitModalOpen(true)}
                  className="text-xs text-blue-600 hover:text-blue-700"
                >
                  <Icon icon="solar:refresh-bold-duotone" className="h-3 w-3 mr-1" />
                  Regenerate
                </Button>
              </div>

              <FormatFitDetailPanel
                titleId={selectedTitle.title_id}
                className="border-blue-200"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Title Data Display */}
      {selectedTitle && weeklyTitle && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Icon icon="solar:database-bold-duotone" className="h-5 w-5 text-hanok-teal" />
              Step 5. Confirm Title Data
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Basic Info */}
            <Collapsible
              open={openSections.includes('basic')}
              onOpenChange={() => toggleSection('basic')}
            >
              <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                <span className="font-medium">Basic Info</span>
                <Icon
                  icon={openSections.includes('basic') ? 'solar:alt-arrow-up-bold-duotone' : 'solar:alt-arrow-down-bold-duotone'}
                  className="h-4 w-4"
                />
              </CollapsibleTrigger>
              <CollapsibleContent className="p-4 space-y-2 text-sm">
                <div><strong>English Title:</strong> {selectedTitle.title_name_en || '-'}</div>
                <div><strong>Korean Title:</strong> {selectedTitle.title_name_kr || '-'}</div>
                <div><strong>Format:</strong> {selectedTitle.content_format || '-'}</div>
                <div><strong>Genre:</strong> {formatFieldValue(selectedTitle.genre)}</div>
                <div><strong>Tagline:</strong> {selectedTitle.tagline || '-'}</div>
              </CollapsibleContent>
            </Collapsible>

            {/* Content */}
            <Collapsible
              open={openSections.includes('content')}
              onOpenChange={() => toggleSection('content')}
            >
              <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                <span className="font-medium">Content</span>
                <Icon
                  icon={openSections.includes('content') ? 'solar:alt-arrow-up-bold-duotone' : 'solar:alt-arrow-down-bold-duotone'}
                  className="h-4 w-4"
                />
              </CollapsibleTrigger>
              <CollapsibleContent className="p-4 space-y-2 text-sm">
                <div><strong>Synopsis:</strong> {selectedTitle.synopsis || '-'}</div>
                <div><strong>Comps:</strong> {formatFieldValue(selectedTitle.comps)}</div>
                <div><strong>Character Details:</strong> {formatFieldValue(selectedTitle.character_details)}</div>
                <div><strong>Selling Points:</strong> {(selectedTitle as Title & { selling_points?: string }).selling_points || '-'}</div>
              </CollapsibleContent>
            </Collapsible>

            {/* Metrics */}
            <Collapsible
              open={openSections.includes('metrics')}
              onOpenChange={() => toggleSection('metrics')}
            >
              <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                <span className="font-medium">Metrics</span>
                <Icon
                  icon={openSections.includes('metrics') ? 'solar:alt-arrow-up-bold-duotone' : 'solar:alt-arrow-down-bold-duotone'}
                  className="h-4 w-4"
                />
              </CollapsibleTrigger>
              <CollapsibleContent className="p-4 space-y-2 text-sm">
                <div><strong>Views:</strong> {selectedTitle.views?.toLocaleString() || '-'}</div>
                <div><strong>Rating:</strong> {selectedTitle.rating || '-'}</div>
                <div><strong>Chapters:</strong> {selectedTitle.chapters || '-'}</div>
              </CollapsibleContent>
            </Collapsible>

            {/* Authors */}
            <Collapsible
              open={openSections.includes('authors')}
              onOpenChange={() => toggleSection('authors')}
            >
              <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                <span className="font-medium">Authors</span>
                <Icon
                  icon={openSections.includes('authors') ? 'solar:alt-arrow-up-bold-duotone' : 'solar:alt-arrow-down-bold-duotone'}
                  className="h-4 w-4"
                />
              </CollapsibleTrigger>
              <CollapsibleContent className="p-4 space-y-2 text-sm">
                <div><strong>Story Author:</strong> {selectedTitle.story_author || '-'}</div>
                <div><strong>Art Author:</strong> {selectedTitle.art_author || '-'}</div>
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        </Card>
      )}

      {/* Why This Title */}
      {selectedTitle && weeklyTitle && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Icon icon="solar:document-text-bold-duotone" className="h-5 w-5 text-hanok-teal" />
              Step 6. Why This Title
            </CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              A source for marketing asset generation
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Description by Admin</Label>
                <Textarea
                  placeholder="Explain why this title stands out and what makes it appealing for adaptation. This content will be used to generate marketing materials..."
                  value={inputDescription}
                  onChange={(e) => setInputDescription(e.target.value)}
                  className="mt-1"
                  rows={10}
                />
                <p className="text-xs text-gray-500 mt-1">Maps to: description</p>
              </div>

              <Button
                onClick={handleSaveDescription}
                disabled={savingDescription}
                className="w-full bg-hanok-teal hover:bg-hanok-teal/90"
              >
                {savingDescription ? (
                  <>
                    <Icon icon="solar:refresh-circle-bold-duotone" className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Icon icon="solar:diskette-bold-duotone" className="h-4 w-4 mr-2" />
                    Save Description
                  </>
                )}
              </Button>
              {isSavedDescription && (
                <div className="flex items-center justify-center gap-1.5 mt-3 text-green-600">
                  <Icon icon="solar:check-circle-bold" className="h-4 w-4" />
                  <span className="text-sm">Description saved</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analyzer Modals */}
      {selectedTitle && (
        <>
          <CompsGeneratorModal
            titleId={selectedTitle.title_id}
            open={compsModalOpen}
            onOpenChange={setCompsModalOpen}
            onSaved={() => {
              loadWeeklyTitle();
              loadCompsAnalysis(selectedTitle.title_id);
            }}
          />

          <FormatFitGeneratorModal
            titleId={selectedTitle.title_id}
            open={formatFitModalOpen}
            onOpenChange={setFormatFitModalOpen}
            onComplete={loadWeeklyTitle}
          />

          <KeyVisualsCollectorModal
            titleId={selectedTitle.title_id}
            open={keyVisualsModalOpen}
            onOpenChange={setKeyVisualsModalOpen}
            userEmail={user?.email || 'admin'}
            titleName={selectedTitle.title_name_en}
            titleNameKr={selectedTitle.title_name_kr}
            titleUrl={selectedTitle.title_url}
            titleUrlEn={selectedTitle.title_url_en}
            onSaved={loadWeeklyTitle}
          />

          {intelligenceResults && (
            <IntelligenceResultsModal
              open={intelligenceModalOpen}
              onOpenChange={setIntelligenceModalOpen}
              results={intelligenceResults}
              onIngest={handleIngestIntelligence}
              isIngesting={isIngesting}
            />
          )}

          {fanSignalResults && (
            <FanSignalResultsModal
              open={fanSignalModalOpen}
              onOpenChange={setFanSignalModalOpen}
              results={fanSignalResults}
            />
          )}

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
