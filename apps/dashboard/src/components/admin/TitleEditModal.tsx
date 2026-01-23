import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { titlesService, Title } from '@/services/titlesService';
import {
  parseUrl,
  collectIntelligenceByUrls,
  getIntelligenceTitleWithSources,
  ingestToTitleWithAudit,
  collectFanEngagement,
  type IntelligenceTitleWithSources,
  type ExtractedIntelligenceData,
  type FanSignalData,
} from '@/services/intelligenceService';
import { IntelligenceResultsModal } from './IntelligenceResultsModal';
import { FanSignalResultsModal } from './FanSignalResultsModal';
import { KeyVisualsCollectorModal } from './KeyVisualsCollectorModal';
import { CompsGeneratorModal } from './CompsGeneratorModal';
import { FormatFitGeneratorModal } from '@/components/format-fit/FormatFitGeneratorModal';
import { CompsAnalysisCard } from '@/components/title-detail/CompsAnalysisCard';
import { type SuggestedComp } from '@/services/compsGeneratorService';
import {
  formatFitService,
  type FormatFitRecord,
  type FormatType,
  FORMAT_DISPLAY_NAMES,
  getFitLevelLabel,
} from '@/services/formatFitService';
import { Icon } from '@iconify/react';
import {
  CharacterDetailsInput,
  serializeCharacters,
  deserializeCharacters,
  type CharacterFormDetail,
} from '@/components/admin/CharacterDetailsInput';

// Genre options
const GENRE_OPTIONS = [
  'romance', 'fantasy', 'action', 'drama', 'comedy', 'thriller',
  'horror', 'sci_fi', 'slice_of_life', 'historical', 'mystery', 'sports', 'other'
];

// Content format options
const FORMAT_OPTIONS = [
  'webtoon', 'web_novel', 'book', 'script', 'game', 'animation', 'other'
];

// Priority options
const PRIORITY_OPTIONS = [
  { value: '1', label: 'High' },
  { value: '2', label: 'Medium' },
  { value: '3', label: 'Low' },
];

// Rights available options
const RIGHTS_OPTIONS = [
  { value: 'film_tv', label: 'Film and TV' },
  { value: 'animation', label: 'Animation' },
  { value: 'publication', label: 'Publication' },
  { value: 'game', label: 'Game' },
  { value: 'merchandising', label: 'Merchandising' },
  { value: 'audio', label: 'Audio' },
  { value: 'microdrama', label: 'Microdrama' },
  { value: 'other', label: 'Other' },
];

// Section keys for collapsible state
const ALL_SECTIONS = [
  'basic-info',
  'classification',
  'metrics',
  'authors',
  'content',
  'story-details',
  'rights',
  'achievements',
];

interface TitleEditModalProps {
  titleId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
}

export function TitleEditModal({
  titleId,
  open,
  onOpenChange,
  onSaved,
}: TitleEditModalProps) {
  const { toast } = useToast();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState<Title | null>(null);
  const [formData, setFormData] = useState<Partial<Title>>({});
  const [openSections, setOpenSections] = useState<string[]>(ALL_SECTIONS);

  // Intelligence collection state
  const [collectingUrl, setCollectingUrl] = useState<'kr' | 'en' | null>(null);
  const [intelligenceResults, setIntelligenceResults] = useState<IntelligenceTitleWithSources | null>(null);
  const [resultsModalOpen, setResultsModalOpen] = useState(false);
  const [isIngesting, setIsIngesting] = useState(false);

  // Fan signal collection state
  const [collectingFanSignal, setCollectingFanSignal] = useState(false);
  const [fanSignalResults, setFanSignalResults] = useState<FanSignalData | null>(null);
  const [fanSignalModalOpen, setFanSignalModalOpen] = useState(false);

  // Key visuals collection state
  const [keyVisualsModalOpen, setKeyVisualsModalOpen] = useState(false);

  // Comps generator state
  const [compsModalOpen, setCompsModalOpen] = useState(false);

  // Format fit analyzer state
  const [formatFitModalOpen, setFormatFitModalOpen] = useState(false);

  // Analyzer data existence state (to show filled buttons when data exists)
  const [hasKeyVisuals, setHasKeyVisuals] = useState(false);
  const [hasComps, setHasComps] = useState(false);
  const [hasFormatFit, setHasFormatFit] = useState(false);
  const [formatFitData, setFormatFitData] = useState<FormatFitRecord | null>(null);

  // Character details state for structured input
  const [inputCharacters, setInputCharacters] = useState<CharacterFormDetail[]>([]);

  // Check which analyzers have data for this title
  const checkAnalyzerDataExists = async (id: string, titleData: Title | null) => {
    try {
      // Check Key Visuals
      const { count: keyVisualsCount } = await supabase
        .from('title_key_visuals')
        .select('*', { count: 'exact', head: true })
        .eq('title_id', id);
      setHasKeyVisuals((keyVisualsCount || 0) > 0);

      // Check Comps (from title data)
      const compsData = (titleData as Title & { comps_analysis?: unknown[] })?.comps_analysis;
      setHasComps(Array.isArray(compsData) && compsData.length > 0);

      // Check and fetch Format Fit data
      const formatFit = await formatFitService.getFormatFit(id);
      setHasFormatFit(!!formatFit);
      setFormatFitData(formatFit);
    } catch (error) {
      console.error('Error checking analyzer data:', error);
    }
  };

  useEffect(() => {
    if (titleId && open) {
      fetchTitle(titleId);
      setOpenSections(ALL_SECTIONS); // Reset to all open when modal opens
    }
  }, [titleId, open]);

  const fetchTitle = async (id: string) => {
    setLoading(true);
    // Reset analyzer states
    setHasKeyVisuals(false);
    setHasComps(false);
    setHasFormatFit(false);
    setFormatFitData(null);
    try {
      const data = await titlesService.getTitleById(id);
      if (data) {
        setTitle(data);
        setFormData(data);
        // Initialize character details for structured input
        setInputCharacters(deserializeCharacters(data.character_details ?? null));
        // Check which analyzers have data
        checkAnalyzerDataExists(id, data);
      } else {
        toast({
          title: 'Error',
          description: 'Title not found',
          variant: 'destructive',
        });
        onOpenChange(false);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to fetch title';
      console.error('Error fetching title:', error);
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof Title, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleArrayChange = (field: keyof Title, value: string) => {
    const arrayValue = value.split(',').map((item) => item.trim()).filter(Boolean);
    setFormData((prev) => ({ ...prev, [field]: arrayValue }));
  };

  const handleSave = async () => {
    if (!titleId || !user?.email) return;

    setSaving(true);
    try {
      const {
        title_id,
        created_at,
        updated_at,
        creator_id,
        platforms,
        documents,
        pitch_analysis,
        processing_confidence,
        title_content_analysis,
        ...updates
      } = formData as Record<string, unknown>;

      // Build changed fields audit record by comparing formData with original title
      const changedFields: Record<string, { old: unknown; new: unknown }> = {};
      if (title) {
        const originalTitle = title as unknown as Record<string, unknown>;
        for (const [key, newValue] of Object.entries(updates)) {
          const oldValue = originalTitle[key];
          // Only track fields that actually changed
          if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
            changedFields[key] = { old: oldValue ?? null, new: newValue };
          }
        }
      }

      // Serialize characters from structured input
      const serializedCharacters = serializeCharacters(inputCharacters);

      // Update the title with provenance tracking
      // Cast to Record to include new provenance columns not yet in generated types
      const updateWithProvenance = {
        ...updates,
        // Override character_details with serialized data from structured input
        character_details: serializedCharacters.length > 0 ? serializedCharacters : null,
        last_modified_by: user.email,
        last_modified_source: 'admin',
      } as Record<string, unknown>;
      await titlesService.updateTitle(titleId, updateWithProvenance);

      // Log to title_edit_history if there were changes
      if (Object.keys(changedFields).length > 0) {
        const { error: auditError } = await supabase.from('title_edit_history').insert({
          title_id: titleId,
          edited_by: user.email,
          edit_source: 'admin',
          changed_fields: changedFields,
          edit_reason: null, // Could add a reason input field in the future
        });

        if (auditError) {
          console.error('Failed to log edit history:', auditError.message);
          // Don't fail the save, just log the error
        }
      }

      toast({
        title: 'Success',
        description: `Title updated successfully${Object.keys(changedFields).length > 0 ? ` (${Object.keys(changedFields).length} field${Object.keys(changedFields).length !== 1 ? 's' : ''} changed)` : ''}`,
      });

      onSaved?.();
      onOpenChange(false);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update title';
      console.error('Error updating title:', error);
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const arrayToString = (arr?: string[] | null): string => {
    if (!arr || !Array.isArray(arr)) return '';
    return arr.join(', ');
  };

  const toggleSection = (section: string) => {
    setOpenSections((prev) =>
      prev.includes(section)
        ? prev.filter((s) => s !== section)
        : [...prev, section]
    );
  };

  const toggleAllSections = () => {
    if (openSections.length === ALL_SECTIONS.length) {
      setOpenSections([]);
    } else {
      setOpenSections(ALL_SECTIONS);
    }
  };

  // Intelligence collection handlers
  const handleCollectData = async (urlType: 'kr' | 'en') => {
    const url = urlType === 'kr' ? formData.title_url : formData.title_url_en;
    if (!url || !user?.email) {
      toast({
        title: 'Error',
        description: !url ? 'No URL provided' : 'User not authenticated',
        variant: 'destructive',
      });
      return;
    }

    setCollectingUrl(urlType);
    try {
      const parsedUrl = parseUrl(url);
      if (!parsedUrl.valid) {
        toast({
          title: 'Invalid URL',
          description: parsedUrl.error || 'Could not parse URL',
          variant: 'destructive',
        });
        return;
      }

      // Collect intelligence
      const response = await collectIntelligenceByUrls(
        {
          urls: [parsedUrl],
          contentType: formData.content_format || 'webtoon',
        },
        user.email
      );

      if (!response.success) {
        const errorDetails = response.errors
          ? Object.entries(response.errors).map(([k, v]) => `${k}: ${v}`).join(', ')
          : 'Unknown error';
        throw new Error(`Collection failed: ${errorDetails}`);
      }

      // Fetch the results
      const results = await getIntelligenceTitleWithSources(response.intelligenceTitleId);
      setIntelligenceResults(results);
      setResultsModalOpen(true);

      toast({
        title: 'Data Collected',
        description: `Successfully collected data from ${response.sourcesCollected.length} source(s)`,
      });
    } catch (error) {
      console.error('Error collecting intelligence:', error);
      const message = error instanceof Error ? error.message : 'Failed to collect data';
      toast({
        title: 'Collection Failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setCollectingUrl(null);
    }
  };

  const handleIngest = async (selectedFields: Partial<ExtractedIntelligenceData>) => {
    if (!titleId || !intelligenceResults?.id || !user?.email) {
      toast({
        title: 'Error',
        description: 'Missing required information for ingestion',
        variant: 'destructive',
      });
      return;
    }

    setIsIngesting(true);
    try {
      // Use audited ingestion with full tracking
      await ingestToTitleWithAudit(
        titleId,
        selectedFields,
        intelligenceResults.id, // intelligence_title_id
        user.email, // ingestedBy
        `Admin ingestion via TitleEditModal` // notes
      );

      // Refresh form data
      const updatedTitle = await titlesService.getTitleById(titleId);
      if (updatedTitle) {
        setTitle(updatedTitle);
        setFormData(updatedTitle);
      }

      toast({
        title: 'Success',
        description: `Successfully ingested ${Object.keys(selectedFields).length} field(s) with audit log`,
      });
      setResultsModalOpen(false);
      setIntelligenceResults(null);
    } catch (error) {
      console.error('Error ingesting data:', error);
      const message = error instanceof Error ? error.message : 'Failed to ingest data';
      toast({
        title: 'Ingestion Failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsIngesting(false);
    }
  };

  // Fan signal collection handler
  const handleCollectFanSignal = async () => {
    const titleName = formData.title_name_en || formData.title_name_kr;
    if (!titleName || !user?.email) {
      toast({
        title: 'Error',
        description: !titleName ? 'No title name available' : 'User not authenticated',
        variant: 'destructive',
      });
      return;
    }

    setCollectingFanSignal(true);
    try {
      const results = await collectFanEngagement(
        {
          titleName,
          sources: ['reddit', 'ao3', 'comick'],
        },
        user.email
      );

      setFanSignalResults(results);
      setFanSignalModalOpen(true);

      const sourcesCollected = [
        results.reddit ? 'Reddit' : null,
        results.ao3 ? 'AO3' : null,
        results.comick ? 'Comick' : null,
      ].filter(Boolean);

      toast({
        title: 'Fan Signal Collected',
        description: `Successfully collected data from ${sourcesCollected.length} source(s): ${sourcesCollected.join(', ')}`,
      });
    } catch (error) {
      console.error('Error collecting fan signal:', error);
      const message = error instanceof Error ? error.message : 'Failed to collect fan signal';
      toast({
        title: 'Collection Failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setCollectingFanSignal(false);
    }
  };

  const SectionHeader = ({ id, title }: { id: string; title: string }) => (
    <CollapsibleTrigger
      className="flex items-center justify-between w-full py-3 text-left hover:bg-gray-50 rounded px-2 -mx-2"
      onClick={() => toggleSection(id)}
    >
      <span className="text-lg font-semibold">{title}</span>
      {openSections.includes(id) ? (
        <Icon icon="solar:alt-arrow-up-bold-duotone" className="h-5 w-5 text-gray-500" />
      ) : (
        <Icon icon="solar:alt-arrow-down-bold-duotone" className="h-5 w-5 text-gray-500" />
      )}
    </CollapsibleTrigger>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center justify-between">
            <span>Edit Title: {title?.title_name_en || title?.title_name_kr || 'Loading...'}</span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setKeyVisualsModalOpen(true)}
                disabled={!titleId}
                className={`whitespace-nowrap text-xs ${
                  hasKeyVisuals
                    ? 'bg-blue-50 border-2 border-blue-500 text-blue-700 hover:bg-blue-100'
                    : ''
                }`}
              >
                <Icon icon="solar:gallery-bold-duotone" className="h-3.5 w-3.5 mr-1" />
                Key Visuals
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCollectFanSignal}
                disabled={collectingFanSignal || (!formData.title_name_en && !formData.title_name_kr)}
                className="whitespace-nowrap text-xs"
              >
                {collectingFanSignal ? (
                  <>
                    <Icon icon="solar:refresh-circle-bold-duotone" className="h-3.5 w-3.5 mr-1 animate-spin" />
                    Collecting...
                  </>
                ) : (
                  <>
                    <Icon icon="solar:users-group-rounded-bold-duotone" className="h-3.5 w-3.5 mr-1" />
                    Collect Fan Signal
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCompsModalOpen(true)}
                disabled={!titleId}
                className={`whitespace-nowrap text-xs ${
                  hasComps
                    ? 'bg-blue-50 border-2 border-blue-500 text-blue-700 hover:bg-blue-100'
                    : ''
                }`}
              >
                <Icon icon="solar:stars-bold-duotone" className="h-3.5 w-3.5 mr-1" />
                Generate Comps
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setFormatFitModalOpen(true)}
                disabled={!titleId}
                className={`whitespace-nowrap text-xs ${
                  hasFormatFit
                    ? 'bg-blue-50 border-2 border-blue-500 text-blue-700 hover:bg-blue-100'
                    : ''
                }`}
              >
                <Icon icon="solar:chart-bold-duotone" className="h-3.5 w-3.5 mr-1" />
                Format Fit
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Icon icon="solar:refresh-circle-bold-duotone" className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : !title ? (
          <div className="text-center py-12 text-gray-500">
            Title not found
          </div>
        ) : (
          <div className="space-y-4">
            {/* Toggle All Button */}
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleAllSections}
                className="text-xs"
              >
                {openSections.length === ALL_SECTIONS.length ? 'Collapse All' : 'Expand All'}
              </Button>
            </div>

            {/* System Info */}
            <div className="bg-gray-50 rounded-lg p-3 text-sm">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <div>
                  <span className="text-gray-500">ID:</span>
                  <span className="ml-1 font-mono text-xs">{title.title_id.slice(0, 8)}...</span>
                </div>
                <div>
                  <span className="text-gray-500">Created:</span>
                  <span className="ml-1">{title.created_at ? new Date(title.created_at).toLocaleDateString() : '-'}</span>
                </div>
                <div>
                  <span className="text-gray-500">Updated:</span>
                  <span className="ml-1">{title.updated_at ? new Date(title.updated_at).toLocaleDateString() : '-'}</span>
                </div>
                <div>
                  <span className="text-gray-500">Creator:</span>
                  <span className="ml-1 font-mono text-xs">{title.creator_id ? title.creator_id.slice(0, 8) + '...' : '-'}</span>
                </div>
              </div>
            </div>

            {/* Collapsible Sections */}
            <div className="space-y-2 border rounded-lg p-4">

              {/* Basic Info Section */}
              <Collapsible open={openSections.includes('basic-info')}>
                <SectionHeader id="basic-info" title="Basic Info" />
                <CollapsibleContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 pb-4 border-b">
                    <div className="space-y-1">
                      <Label htmlFor="title_name_en" className="text-sm">English Name <span className="text-gray-400 font-normal">{'{title_name_en}'}</span></Label>
                      <Input
                        id="title_name_en"
                        value={formData.title_name_en || ''}
                        onChange={(e) => handleInputChange('title_name_en', e.target.value)}
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="title_name_kr" className="text-sm">Korean Name <span className="text-gray-400 font-normal">{'{title_name_kr}'}</span></Label>
                      <Input
                        id="title_name_kr"
                        value={formData.title_name_kr || ''}
                        onChange={(e) => handleInputChange('title_name_kr', e.target.value)}
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="title_url" className="text-sm">Title URL <span className="text-gray-400 font-normal">{'{title_url}'}</span></Label>
                      <div className="flex gap-2">
                        <Input
                          id="title_url"
                          value={formData.title_url || ''}
                          onChange={(e) => handleInputChange('title_url', e.target.value)}
                          className="h-9 flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleCollectData('kr')}
                          disabled={!formData.title_url || collectingUrl !== null}
                          className="h-9 whitespace-nowrap text-xs px-2"
                        >
                          {collectingUrl === 'kr' ? (
                            <Icon icon="solar:refresh-circle-bold-duotone" className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <>
                              <Icon icon="solar:database-bold-duotone" className="h-3.5 w-3.5 mr-1" />
                              Collect
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="title_url_en" className="text-sm">English URL <span className="text-gray-400 font-normal">{'{title_url_en}'}</span></Label>
                      <div className="flex gap-2">
                        <Input
                          id="title_url_en"
                          value={formData.title_url_en || ''}
                          onChange={(e) => handleInputChange('title_url_en', e.target.value)}
                          className="h-9 flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleCollectData('en')}
                          disabled={!formData.title_url_en || collectingUrl !== null}
                          className="h-9 whitespace-nowrap text-xs px-2"
                        >
                          {collectingUrl === 'en' ? (
                            <Icon icon="solar:refresh-circle-bold-duotone" className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <>
                              <Icon icon="solar:database-bold-duotone" className="h-3.5 w-3.5 mr-1" />
                              Collect
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <Label htmlFor="title_image" className="text-sm">Image URL <span className="text-gray-400 font-normal">{'{title_image}'}</span></Label>
                      <Input
                        id="title_image"
                        value={formData.title_image || ''}
                        onChange={(e) => handleInputChange('title_image', e.target.value)}
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="priority" className="text-sm">Priority <span className="text-gray-400 font-normal">{'{priority}'}</span></Label>
                      <Select
                        value={formData.priority || '2'}
                        onValueChange={(value) => handleInputChange('priority', value)}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                          {PRIORITY_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="verified" className="text-sm">Verified <span className="text-gray-400 font-normal">{'{verified}'}</span></Label>
                      <Select
                        value={formData.verified ? 'true' : 'false'}
                        onValueChange={(value) => handleInputChange('verified', value === 'true')}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Select verification status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">Yes</SelectItem>
                          <SelectItem value="false">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Classification Section */}
              <Collapsible open={openSections.includes('classification')}>
                <SectionHeader id="classification" title="Classification" />
                <CollapsibleContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 pb-4 border-b">
                    <div className="space-y-1 md:col-span-2">
                      <Label htmlFor="genre" className="text-sm">Genre (comma-separated) <span className="text-gray-400 font-normal">{'{genre}'}</span></Label>
                      <Input
                        id="genre"
                        value={arrayToString(formData.genre)}
                        onChange={(e) => handleArrayChange('genre', e.target.value)}
                        placeholder="romance, fantasy, action"
                        className="h-9"
                      />
                      <p className="text-xs text-gray-500">
                        Options: {GENRE_OPTIONS.join(', ')}
                      </p>
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <Label htmlFor="genre_kr" className="text-sm">Korean Genre (comma-separated) <span className="text-gray-400 font-normal">{'{genre_kr}'}</span></Label>
                      <Input
                        id="genre_kr"
                        value={arrayToString(formData.genre_kr)}
                        onChange={(e) => handleArrayChange('genre_kr', e.target.value)}
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="content_format" className="text-sm">Content Format <span className="text-gray-400 font-normal">{'{content_format}'}</span></Label>
                      <Select
                        value={formData.content_format || ''}
                        onValueChange={(value) => handleInputChange('content_format', value)}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Select format" />
                        </SelectTrigger>
                        <SelectContent>
                          {FORMAT_OPTIONS.map((format) => (
                            <SelectItem key={format} value={format}>
                              {format.replace('_', ' ')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="tone" className="text-sm">Tone <span className="text-gray-400 font-normal">{'{tone}'}</span></Label>
                      <Input
                        id="tone"
                        value={formData.tone || ''}
                        onChange={(e) => handleInputChange('tone', e.target.value)}
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="audience" className="text-sm">Audience <span className="text-gray-400 font-normal">{'{audience}'}</span></Label>
                      <Input
                        id="audience"
                        value={formData.audience || ''}
                        onChange={(e) => handleInputChange('audience', e.target.value)}
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="age_rating" className="text-sm">Age Rating <span className="text-gray-400 font-normal">{'{age_rating}'}</span></Label>
                      <Input
                        id="age_rating"
                        value={formData.age_rating || ''}
                        onChange={(e) => handleInputChange('age_rating', e.target.value)}
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <Label htmlFor="keywords" className="text-sm">Keywords (comma-separated) <span className="text-gray-400 font-normal">{'{keywords}'}</span></Label>
                      <Input
                        id="keywords"
                        value={arrayToString(formData.keywords)}
                        onChange={(e) => handleArrayChange('keywords', e.target.value)}
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <Label htmlFor="comps" className="text-sm">Comps (comma-separated) <span className="text-gray-400 font-normal">{'{comps}'}</span></Label>
                      <Input
                        id="comps"
                        value={arrayToString(formData.comps)}
                        onChange={(e) => handleArrayChange('comps', e.target.value)}
                        placeholder="Similar titles for comparison"
                        className="h-9"
                      />
                    </div>

                    {/* Show saved comps analysis if available */}
                    {(formData as Title & { comps_analysis?: SuggestedComp[] }).comps_analysis &&
                      (formData as Title & { comps_analysis?: SuggestedComp[] }).comps_analysis!.length > 0 && (
                      <div className="md:col-span-2 mt-2">
                        <Label className="text-sm text-gray-500 mb-2 block">
                          Saved AI Analysis ({(formData as Title & { comps_analysis?: SuggestedComp[] }).comps_analysis!.length} comp{(formData as Title & { comps_analysis?: SuggestedComp[] }).comps_analysis!.length !== 1 ? 's' : ''})
                        </Label>
                        <CompsAnalysisCard
                          compsAnalysis={(formData as Title & { comps_analysis?: SuggestedComp[] }).comps_analysis!}
                          showTitle={false}
                          className="border-purple-200"
                        />
                      </div>
                    )}

                    {/* Show format fit analysis if available */}
                    {formatFitData && (
                      <div className="md:col-span-2 mt-2">
                        <Label className="text-sm text-gray-500 mb-2 block">
                          Format Fit Analysis
                        </Label>
                        <div className="border border-blue-200 rounded-lg p-3 bg-blue-50/30">
                          {/* Best Format Highlight */}
                          <div className="flex items-center gap-3 mb-3 pb-3 border-b border-blue-200">
                            <div className="bg-blue-100 p-2 rounded-lg">
                              <Icon icon="solar:cup-star-bold-duotone" className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="text-xs text-blue-600 font-medium">Best Format</p>
                              <p className="font-semibold text-gray-900">
                                {FORMAT_DISPLAY_NAMES[
                                  (['film', 'tv_series', 'animation', 'microdrama', 'audio_drama'] as FormatType[])
                                    .reduce((best, format) => {
                                      const scores: Record<FormatType, number> = {
                                        film: formatFitData.film_score,
                                        tv_series: formatFitData.tv_series_score,
                                        animation: formatFitData.animation_score,
                                        microdrama: formatFitData.microdrama_score,
                                        audio_drama: formatFitData.audio_drama_score,
                                      };
                                      return scores[format] > scores[best] ? format : best;
                                    }, 'film' as FormatType)
                                ]}
                                <span className="ml-2 text-sm text-blue-600">
                                  ({Math.max(
                                    formatFitData.film_score,
                                    formatFitData.tv_series_score,
                                    formatFitData.animation_score,
                                    formatFitData.microdrama_score,
                                    formatFitData.audio_drama_score
                                  )}%)
                                </span>
                              </p>
                            </div>
                          </div>

                          {/* All Format Scores */}
                          <div className="grid grid-cols-5 gap-2">
                            {([
                              { key: 'film' as FormatType, icon: 'solar:clapperboard-bold-duotone', score: formatFitData.film_score },
                              { key: 'tv_series' as FormatType, icon: 'solar:tv-bold-duotone', score: formatFitData.tv_series_score },
                              { key: 'animation' as FormatType, icon: 'solar:pallete-bold-duotone', score: formatFitData.animation_score },
                              { key: 'microdrama' as FormatType, icon: 'solar:smartphone-bold-duotone', score: formatFitData.microdrama_score },
                              { key: 'audio_drama' as FormatType, icon: 'solar:headphones-bold-duotone', score: formatFitData.audio_drama_score },
                            ]).map(({ key, icon, score }) => (
                              <div
                                key={key}
                                className="text-center p-2 bg-white rounded-lg border border-gray-200"
                              >
                                <Icon icon={icon} className="h-4 w-4 mx-auto text-gray-500 mb-1" />
                                <p className="text-[10px] text-gray-500 leading-tight mb-0.5">
                                  {FORMAT_DISPLAY_NAMES[key]}
                                </p>
                                <p className={`text-sm font-bold ${
                                  score >= 80 ? 'text-green-600' :
                                  score >= 60 ? 'text-blue-600' :
                                  score >= 40 ? 'text-yellow-600' : 'text-gray-500'
                                }`}>
                                  {score}
                                </p>
                                <p className="text-[9px] text-gray-400">
                                  {getFitLevelLabel(score)}
                                </p>
                              </div>
                            ))}
                          </div>

                          {/* Data Completeness */}
                          <div className="mt-2 text-[10px] text-gray-400 text-center">
                            Based on {formatFitData.data_completeness}% data completeness
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Metrics Section */}
              <Collapsible open={openSections.includes('metrics')}>
                <SectionHeader id="metrics" title="Metrics" />
                <CollapsibleContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 pb-4 border-b">
                    <div className="space-y-1">
                      <Label htmlFor="views" className="text-sm">Views <span className="text-gray-400 font-normal">{'{views}'}</span></Label>
                      <Input
                        id="views"
                        type="number"
                        value={formData.views ?? ''}
                        onChange={(e) => handleInputChange('views', e.target.value ? parseInt(e.target.value) : null)}
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="likes" className="text-sm">Likes <span className="text-gray-400 font-normal">{'{likes}'}</span></Label>
                      <Input
                        id="likes"
                        type="number"
                        value={formData.likes ?? ''}
                        onChange={(e) => handleInputChange('likes', e.target.value ? parseInt(e.target.value) : null)}
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="rating" className="text-sm">Rating (1-10) <span className="text-gray-400 font-normal">{'{rating}'}</span></Label>
                      <Input
                        id="rating"
                        type="number"
                        step="0.1"
                        min="0"
                        max="10"
                        value={formData.rating ?? ''}
                        onChange={(e) => handleInputChange('rating', e.target.value ? parseFloat(e.target.value) : null)}
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="rating_count" className="text-sm">Rating Count <span className="text-gray-400 font-normal">{'{rating_count}'}</span></Label>
                      <Input
                        id="rating_count"
                        type="number"
                        value={formData.rating_count ?? ''}
                        onChange={(e) => handleInputChange('rating_count', e.target.value ? parseInt(e.target.value) : null)}
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="chapters" className="text-sm">Chapters <span className="text-gray-400 font-normal">{'{chapters}'}</span></Label>
                      <Input
                        id="chapters"
                        type="number"
                        value={formData.chapters ?? ''}
                        onChange={(e) => handleInputChange('chapters', e.target.value ? parseInt(e.target.value) : null)}
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="completed" className="text-sm">Completed <span className="text-gray-400 font-normal">{'{completed}'}</span></Label>
                      <Select
                        value={formData.completed ? 'true' : 'false'}
                        onValueChange={(value) => handleInputChange('completed', value === 'true')}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">Yes</SelectItem>
                          <SelectItem value="false">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1 md:col-span-3">
                      <Label htmlFor="perfect_for" className="text-sm">Perfect For <span className="text-gray-400 font-normal">{'{perfect_for}'}</span></Label>
                      <Input
                        id="perfect_for"
                        value={formData.perfect_for || ''}
                        onChange={(e) => handleInputChange('perfect_for', e.target.value)}
                        placeholder="e.g., Fans of romance, K-drama lovers"
                        className="h-9"
                      />
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Authors & Credits Section */}
              <Collapsible open={openSections.includes('authors')}>
                <SectionHeader id="authors" title="Authors & Credits" />
                <CollapsibleContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 pb-4 border-b">
                    <div className="space-y-1">
                      <Label htmlFor="story_author" className="text-sm">Story Author <span className="text-gray-400 font-normal">{'{story_author}'}</span></Label>
                      <Input
                        id="story_author"
                        value={formData.story_author || ''}
                        onChange={(e) => handleInputChange('story_author', e.target.value)}
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="story_author_kr" className="text-sm">Story Author (Korean) <span className="text-gray-400 font-normal">{'{story_author_kr}'}</span></Label>
                      <Input
                        id="story_author_kr"
                        value={formData.story_author_kr || ''}
                        onChange={(e) => handleInputChange('story_author_kr', e.target.value)}
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="art_author" className="text-sm">Art Author <span className="text-gray-400 font-normal">{'{art_author}'}</span></Label>
                      <Input
                        id="art_author"
                        value={formData.art_author || ''}
                        onChange={(e) => handleInputChange('art_author', e.target.value)}
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="art_author_kr" className="text-sm">Art Author (Korean) <span className="text-gray-400 font-normal">{'{art_author_kr}'}</span></Label>
                      <Input
                        id="art_author_kr"
                        value={formData.art_author_kr || ''}
                        onChange={(e) => handleInputChange('art_author_kr', e.target.value)}
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="original_author" className="text-sm">Original Author <span className="text-gray-400 font-normal">{'{original_author}'}</span></Label>
                      <Input
                        id="original_author"
                        value={formData.original_author || ''}
                        onChange={(e) => handleInputChange('original_author', e.target.value)}
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="original_author_kr" className="text-sm">Original Author (Korean) <span className="text-gray-400 font-normal">{'{original_author_kr}'}</span></Label>
                      <Input
                        id="original_author_kr"
                        value={formData.original_author_kr || ''}
                        onChange={(e) => handleInputChange('original_author_kr', e.target.value)}
                        className="h-9"
                      />
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Content Section */}
              <Collapsible open={openSections.includes('content')}>
                <SectionHeader id="content" title="Content" />
                <CollapsibleContent>
                  <div className="grid grid-cols-1 gap-3 pt-3 pb-4 border-b">
                    <div className="space-y-1">
                      <Label htmlFor="synopsis" className="text-sm">Synopsis <span className="text-gray-400 font-normal">{'{synopsis}'}</span></Label>
                      <Textarea
                        id="synopsis"
                        value={formData.synopsis || ''}
                        onChange={(e) => handleInputChange('synopsis', e.target.value)}
                        rows={6}
                        className="resize-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="synopsis_kr" className="text-sm">Synopsis (Korean) <span className="text-gray-400 font-normal">{'{synopsis_kr}'}</span></Label>
                      <Textarea
                        id="synopsis_kr"
                        value={formData.synopsis_kr || ''}
                        onChange={(e) => handleInputChange('synopsis_kr', e.target.value)}
                        rows={6}
                        className="resize-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="description" className="text-sm text-purple-700 font-medium flex items-center gap-2">
                        Full Description
                        <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-purple-600 text-white uppercase">Admin</span>
                        <span className="text-purple-400 font-normal">{'{description}'}</span>
                      </Label>
                      <Textarea
                        id="description"
                        value={formData.description || ''}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        rows={8}
                        placeholder="Full description for admin use..."
                        className="resize-none border-purple-400 bg-purple-50 focus:border-purple-500 focus:ring-purple-500"
                      />
                    </div>
                    {/* Character Details - using structured input */}
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-gray-700">
                        Character Details <span className="text-gray-400 font-normal">{'{character_details}'}</span>
                      </Label>
                      <CharacterDetailsInput
                        characters={inputCharacters}
                        onChange={setInputCharacters}
                      />
                    </div>

                    {/* Selling Points */}
                    <div className="space-y-1">
                      <Label htmlFor="selling_points" className="text-sm">
                        Selling Points <span className="text-gray-400 font-normal">{'{selling_points}'}</span>
                      </Label>
                      <Textarea
                        id="selling_points"
                        placeholder="Key reasons why this title is marketable..."
                        value={formData.selling_points || ''}
                        onChange={(e) => handleInputChange('selling_points', e.target.value)}
                        rows={3}
                        className="resize-none mt-1 bg-white border-gray-300 text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="tagline" className="text-sm">Tagline <span className="text-gray-400 font-normal">{'{tagline}'}</span></Label>
                        <Input
                          id="tagline"
                          value={formData.tagline || ''}
                          onChange={(e) => handleInputChange('tagline', e.target.value)}
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="tagline_kr" className="text-sm">Tagline (Korean) <span className="text-gray-400 font-normal">{'{tagline_kr}'}</span></Label>
                        <Input
                          id="tagline_kr"
                          value={formData.tagline_kr || ''}
                          onChange={(e) => handleInputChange('tagline_kr', e.target.value)}
                          className="h-9"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="pitch" className="text-sm">Pitch <span className="text-gray-400 font-normal">{'{pitch}'}</span></Label>
                      <Textarea
                        id="pitch"
                        value={formData.pitch || ''}
                        onChange={(e) => handleInputChange('pitch', e.target.value)}
                        rows={3}
                        className="resize-none"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="note" className="text-sm">Note <span className="text-gray-400 font-normal">{'{note}'}</span></Label>
                        <Textarea
                          id="note"
                          value={formData.note || ''}
                          onChange={(e) => handleInputChange('note', e.target.value)}
                          rows={2}
                          className="resize-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="note_kr" className="text-sm">Note (Korean) <span className="text-gray-400 font-normal">{'{note_kr}'}</span></Label>
                        <Textarea
                          id="note_kr"
                          value={formData.note_kr || ''}
                          onChange={(e) => handleInputChange('note_kr', e.target.value)}
                          rows={2}
                          className="resize-none"
                        />
                      </div>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Story Details Section */}
              <Collapsible open={openSections.includes('story-details')}>
                <SectionHeader id="story-details" title="Story Details" />
                <CollapsibleContent>
                  <div className="grid grid-cols-1 gap-3 pt-3 pb-4 border-b">
                    <div className="space-y-1">
                      <Label htmlFor="inspiration" className="text-sm">Inspiration <span className="text-gray-400 font-normal">{'{inspiration}'}</span></Label>
                      <Textarea
                        id="inspiration"
                        value={formData.inspiration || ''}
                        onChange={(e) => handleInputChange('inspiration', e.target.value)}
                        rows={2}
                        className="resize-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="important_issues" className="text-sm">Important Issues <span className="text-gray-400 font-normal">{'{important_issues}'}</span></Label>
                      <Textarea
                        id="important_issues"
                        value={formData.important_issues || ''}
                        onChange={(e) => handleInputChange('important_issues', e.target.value)}
                        rows={2}
                        className="resize-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="setting_description" className="text-sm">Setting Description <span className="text-gray-400 font-normal">{'{setting_description}'}</span></Label>
                      <Textarea
                        id="setting_description"
                        value={formData.setting_description || ''}
                        onChange={(e) => handleInputChange('setting_description', e.target.value)}
                        rows={2}
                        className="resize-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="world_lore" className="text-sm">World Lore <span className="text-gray-400 font-normal">{'{world_lore}'}</span></Label>
                      <Textarea
                        id="world_lore"
                        value={formData.world_lore || ''}
                        onChange={(e) => handleInputChange('world_lore', e.target.value)}
                        rows={2}
                        className="resize-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="supernatural_concepts" className="text-sm">Supernatural Concepts <span className="text-gray-400 font-normal">{'{supernatural_concepts}'}</span></Label>
                      <Textarea
                        id="supernatural_concepts"
                        value={formData.supernatural_concepts || ''}
                        onChange={(e) => handleInputChange('supernatural_concepts', e.target.value)}
                        rows={2}
                        className="resize-none"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="story_structure" className="text-sm">Story Structure <span className="text-gray-400 font-normal">{'{story_structure}'}</span></Label>
                        <Input
                          id="story_structure"
                          value={formData.story_structure || ''}
                          onChange={(e) => handleInputChange('story_structure', e.target.value)}
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="planned_ending" className="text-sm">Planned Ending <span className="text-gray-400 font-normal">{'{planned_ending}'}</span></Label>
                        <Input
                          id="planned_ending"
                          value={formData.planned_ending || ''}
                          onChange={(e) => handleInputChange('planned_ending', e.target.value)}
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="narrative_arc" className="text-sm">Narrative Arc <span className="text-gray-400 font-normal">{'{narrative_arc}'}</span></Label>
                        <Input
                          id="narrative_arc"
                          value={formData.narrative_arc || ''}
                          onChange={(e) => handleInputChange('narrative_arc', e.target.value)}
                          className="h-9"
                        />
                      </div>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Rights & Business Section */}
              <Collapsible open={openSections.includes('rights')}>
                <SectionHeader id="rights" title="Rights & Business" />
                <CollapsibleContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 pb-4 border-b">
                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-sm">Rights Available <span className="text-gray-400 font-normal">{'{rights_available}'}</span></Label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                        {RIGHTS_OPTIONS.map((option) => (
                          <div key={option.value} className="flex items-center space-x-2">
                            <Checkbox
                              id={`rights-${option.value}`}
                              checked={(formData.rights_available || []).includes(option.value)}
                              onCheckedChange={(checked) => {
                                const current = formData.rights_available || [];
                                if (checked) {
                                  setFormData({ ...formData, rights_available: [...current, option.value] });
                                } else {
                                  setFormData({ ...formData, rights_available: current.filter(v => v !== option.value) });
                                }
                              }}
                            />
                            <Label
                              htmlFor={`rights-${option.value}`}
                              className="text-sm font-normal cursor-pointer"
                            >
                              {option.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="rights_holder_name" className="text-sm">Rights Holder Name <span className="text-gray-400 font-normal">{'{rights_holder_name}'}</span></Label>
                      <Input
                        id="rights_holder_name"
                        value={formData.rights_holder_name || ''}
                        onChange={(e) => handleInputChange('rights_holder_name', e.target.value)}
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="rights_holder_company" className="text-sm">Rights Holder Company <span className="text-gray-400 font-normal">{'{rights_holder_company}'}</span></Label>
                      <Input
                        id="rights_holder_company"
                        value={formData.rights_holder_company || ''}
                        onChange={(e) => handleInputChange('rights_holder_company', e.target.value)}
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <Label htmlFor="cp" className="text-sm">CP (Copyright Info) <span className="text-gray-400 font-normal">{'{cp}'}</span></Label>
                      <Input
                        id="cp"
                        value={formData.cp || ''}
                        onChange={(e) => handleInputChange('cp', e.target.value)}
                        className="h-9"
                      />
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Achievements Section */}
              <Collapsible open={openSections.includes('achievements')}>
                <SectionHeader id="achievements" title="Achievements" />
                <CollapsibleContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 pb-4">
                    <div className="space-y-1 md:col-span-2">
                      <Label htmlFor="awards" className="text-sm">Awards (comma-separated) <span className="text-gray-400 font-normal">{'{awards}'}</span></Label>
                      <Input
                        id="awards"
                        value={arrayToString(formData.awards)}
                        onChange={(e) => handleArrayChange('awards', e.target.value)}
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="sales_records" className="text-sm">Sales Records <span className="text-gray-400 font-normal">{'{sales_records}'}</span></Label>
                      <Input
                        id="sales_records"
                        value={formData.sales_records || ''}
                        onChange={(e) => handleInputChange('sales_records', e.target.value)}
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="merchandise_deals" className="text-sm">Merchandise Deals <span className="text-gray-400 font-normal">{'{merchandise_deals}'}</span></Label>
                      <Input
                        id="merchandise_deals"
                        value={formData.merchandise_deals || ''}
                        onChange={(e) => handleInputChange('merchandise_deals', e.target.value)}
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="print_editions" className="text-sm">Print Editions <span className="text-gray-400 font-normal">{'{print_editions}'}</span></Label>
                      <Select
                        value={formData.print_editions ? 'true' : 'false'}
                        onValueChange={(value) => handleInputChange('print_editions', value === 'true')}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">Yes</SelectItem>
                          <SelectItem value="false">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="print_edition_details" className="text-sm">Print Edition Details <span className="text-gray-400 font-normal">{'{print_edition_details}'}</span></Label>
                      <Input
                        id="print_edition_details"
                        value={formData.print_edition_details || ''}
                        onChange={(e) => handleInputChange('print_edition_details', e.target.value)}
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <Label htmlFor="media_coverage" className="text-sm">Media Coverage <span className="text-gray-400 font-normal">{'{media_coverage}'}</span></Label>
                      <Textarea
                        id="media_coverage"
                        value={formData.media_coverage || ''}
                        onChange={(e) => handleInputChange('media_coverage', e.target.value)}
                        rows={2}
                        className="resize-none"
                      />
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <Label htmlFor="celebrity_endorsements" className="text-sm">Celebrity Endorsements <span className="text-gray-400 font-normal">{'{celebrity_endorsements}'}</span></Label>
                      <Textarea
                        id="celebrity_endorsements"
                        value={formData.celebrity_endorsements || ''}
                        onChange={(e) => handleInputChange('celebrity_endorsements', e.target.value)}
                        rows={2}
                        className="resize-none"
                      />
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-4 border-t">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-hanok-teal hover:bg-hanok-teal/90"
              >
                {saving ? (
                  <>
                    <Icon icon="solar:refresh-circle-bold-duotone" className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Icon icon="solar:diskette-bold-duotone" className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>

      {/* Intelligence Results Modal */}
      <IntelligenceResultsModal
        open={resultsModalOpen}
        onOpenChange={setResultsModalOpen}
        results={intelligenceResults}
        onIngest={handleIngest}
        isIngesting={isIngesting}
      />

      {/* Fan Signal Results Modal */}
      <FanSignalResultsModal
        open={fanSignalModalOpen}
        onOpenChange={setFanSignalModalOpen}
        results={fanSignalResults}
      />

      {/* Key Visuals Collector Modal */}
      {titleId && (
        <KeyVisualsCollectorModal
          open={keyVisualsModalOpen}
          onOpenChange={setKeyVisualsModalOpen}
          titleId={titleId}
          titleName={formData.title_name_en}
          titleNameKr={formData.title_name_kr}
          titleUrl={formData.title_url}
          titleUrlEn={formData.title_url_en}
          userEmail={user?.email || ''}
          onSaved={() => setHasKeyVisuals(true)}
        />
      )}

      {/* Comps Generator Modal */}
      <CompsGeneratorModal
        titleId={titleId}
        titleName={formData.title_name_en || formData.title_name_kr || undefined}
        open={compsModalOpen}
        onOpenChange={setCompsModalOpen}
        onSaved={() => {
          // Refresh form data to show new comps
          if (titleId) {
            fetchTitle(titleId);
          }
        }}
      />

      {/* Format Fit Generator Modal */}
      <FormatFitGeneratorModal
        titleId={titleId}
        titleName={formData.title_name_en || formData.title_name_kr || undefined}
        open={formatFitModalOpen}
        onOpenChange={setFormatFitModalOpen}
        onComplete={async () => {
          setHasFormatFit(true);
          // Refresh format fit data to show in the modal
          if (titleId) {
            const updatedData = await formatFitService.getFormatFit(titleId);
            setFormatFitData(updatedData);
          }
        }}
      />
    </Dialog>
  );
}
