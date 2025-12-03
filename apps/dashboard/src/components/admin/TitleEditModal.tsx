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
import { titlesService, Title } from '@/services/titlesService';
import {
  parseUrl,
  collectIntelligenceByUrls,
  getIntelligenceTitleWithSources,
  directIngestToTitle,
  type IntelligenceTitleWithSources,
  type ExtractedIntelligenceData,
} from '@/services/intelligenceService';
import { IntelligenceResultsModal } from './IntelligenceResultsModal';
import { Save, Loader2, ChevronDown, ChevronUp, Database } from 'lucide-react';

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

  useEffect(() => {
    if (titleId && open) {
      fetchTitle(titleId);
      setOpenSections(ALL_SECTIONS); // Reset to all open when modal opens
    }
  }, [titleId, open]);

  const fetchTitle = async (id: string) => {
    setLoading(true);
    try {
      const data = await titlesService.getTitleById(id);
      if (data) {
        setTitle(data);
        setFormData(data);
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
    if (!titleId) return;

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

      await titlesService.updateTitle(titleId, updates);

      toast({
        title: 'Success',
        description: 'Title updated successfully',
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
    if (!titleId) return;

    setIsIngesting(true);
    try {
      await directIngestToTitle(titleId, selectedFields);

      // Refresh form data
      const updatedTitle = await titlesService.getTitleById(titleId);
      if (updatedTitle) {
        setTitle(updatedTitle);
        setFormData(updatedTitle);
      }

      toast({
        title: 'Success',
        description: `Successfully ingested ${Object.keys(selectedFields).length} field(s)`,
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

  const SectionHeader = ({ id, title }: { id: string; title: string }) => (
    <CollapsibleTrigger
      className="flex items-center justify-between w-full py-3 text-left hover:bg-gray-50 rounded px-2 -mx-2"
      onClick={() => toggleSection(id)}
    >
      <span className="text-lg font-semibold">{title}</span>
      {openSections.includes(id) ? (
        <ChevronUp className="h-5 w-5 text-gray-500" />
      ) : (
        <ChevronDown className="h-5 w-5 text-gray-500" />
      )}
    </CollapsibleTrigger>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            Edit Title: {title?.title_name_en || title?.title_name_kr || 'Loading...'}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
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
                      <Label htmlFor="title_name_en" className="text-sm">English Name</Label>
                      <Input
                        id="title_name_en"
                        value={formData.title_name_en || ''}
                        onChange={(e) => handleInputChange('title_name_en', e.target.value)}
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="title_name_kr" className="text-sm">Korean Name</Label>
                      <Input
                        id="title_name_kr"
                        value={formData.title_name_kr || ''}
                        onChange={(e) => handleInputChange('title_name_kr', e.target.value)}
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="title_url" className="text-sm">Title URL</Label>
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
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <>
                              <Database className="h-3.5 w-3.5 mr-1" />
                              Collect
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="title_url_en" className="text-sm">English URL</Label>
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
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <>
                              <Database className="h-3.5 w-3.5 mr-1" />
                              Collect
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <Label htmlFor="title_image" className="text-sm">Image URL</Label>
                      <Input
                        id="title_image"
                        value={formData.title_image || ''}
                        onChange={(e) => handleInputChange('title_image', e.target.value)}
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="priority" className="text-sm">Priority</Label>
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
                      <Label htmlFor="verified" className="text-sm">Verified</Label>
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
                      <Label htmlFor="genre" className="text-sm">Genre (comma-separated)</Label>
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
                      <Label htmlFor="genre_kr" className="text-sm">Korean Genre (comma-separated)</Label>
                      <Input
                        id="genre_kr"
                        value={arrayToString(formData.genre_kr)}
                        onChange={(e) => handleArrayChange('genre_kr', e.target.value)}
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="content_format" className="text-sm">Content Format</Label>
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
                      <Label htmlFor="tone" className="text-sm">Tone</Label>
                      <Input
                        id="tone"
                        value={formData.tone || ''}
                        onChange={(e) => handleInputChange('tone', e.target.value)}
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="audience" className="text-sm">Audience</Label>
                      <Input
                        id="audience"
                        value={formData.audience || ''}
                        onChange={(e) => handleInputChange('audience', e.target.value)}
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="age_rating" className="text-sm">Age Rating</Label>
                      <Input
                        id="age_rating"
                        value={formData.age_rating || ''}
                        onChange={(e) => handleInputChange('age_rating', e.target.value)}
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <Label htmlFor="keywords" className="text-sm">Keywords (comma-separated)</Label>
                      <Input
                        id="keywords"
                        value={arrayToString(formData.keywords)}
                        onChange={(e) => handleArrayChange('keywords', e.target.value)}
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <Label htmlFor="comps" className="text-sm">Comps (comma-separated)</Label>
                      <Input
                        id="comps"
                        value={arrayToString(formData.comps)}
                        onChange={(e) => handleArrayChange('comps', e.target.value)}
                        placeholder="Similar titles for comparison"
                        className="h-9"
                      />
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Metrics Section */}
              <Collapsible open={openSections.includes('metrics')}>
                <SectionHeader id="metrics" title="Metrics" />
                <CollapsibleContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 pb-4 border-b">
                    <div className="space-y-1">
                      <Label htmlFor="views" className="text-sm">Views</Label>
                      <Input
                        id="views"
                        type="number"
                        value={formData.views ?? ''}
                        onChange={(e) => handleInputChange('views', e.target.value ? parseInt(e.target.value) : null)}
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="likes" className="text-sm">Likes</Label>
                      <Input
                        id="likes"
                        type="number"
                        value={formData.likes ?? ''}
                        onChange={(e) => handleInputChange('likes', e.target.value ? parseInt(e.target.value) : null)}
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="rating" className="text-sm">Rating (0-5)</Label>
                      <Input
                        id="rating"
                        type="number"
                        step="0.1"
                        min="0"
                        max="5"
                        value={formData.rating ?? ''}
                        onChange={(e) => handleInputChange('rating', e.target.value ? parseFloat(e.target.value) : null)}
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="rating_count" className="text-sm">Rating Count</Label>
                      <Input
                        id="rating_count"
                        type="number"
                        value={formData.rating_count ?? ''}
                        onChange={(e) => handleInputChange('rating_count', e.target.value ? parseInt(e.target.value) : null)}
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="chapters" className="text-sm">Chapters</Label>
                      <Input
                        id="chapters"
                        type="number"
                        value={formData.chapters ?? ''}
                        onChange={(e) => handleInputChange('chapters', e.target.value ? parseInt(e.target.value) : null)}
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="completed" className="text-sm">Completed</Label>
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
                      <Label htmlFor="perfect_for" className="text-sm">Perfect For</Label>
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
                      <Label htmlFor="story_author" className="text-sm">Story Author</Label>
                      <Input
                        id="story_author"
                        value={formData.story_author || ''}
                        onChange={(e) => handleInputChange('story_author', e.target.value)}
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="story_author_kr" className="text-sm">Story Author (Korean)</Label>
                      <Input
                        id="story_author_kr"
                        value={formData.story_author_kr || ''}
                        onChange={(e) => handleInputChange('story_author_kr', e.target.value)}
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="art_author" className="text-sm">Art Author</Label>
                      <Input
                        id="art_author"
                        value={formData.art_author || ''}
                        onChange={(e) => handleInputChange('art_author', e.target.value)}
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="art_author_kr" className="text-sm">Art Author (Korean)</Label>
                      <Input
                        id="art_author_kr"
                        value={formData.art_author_kr || ''}
                        onChange={(e) => handleInputChange('art_author_kr', e.target.value)}
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="original_author" className="text-sm">Original Author</Label>
                      <Input
                        id="original_author"
                        value={formData.original_author || ''}
                        onChange={(e) => handleInputChange('original_author', e.target.value)}
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="original_author_kr" className="text-sm">Original Author (Korean)</Label>
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
                      <Label htmlFor="synopsis" className="text-sm">Synopsis</Label>
                      <Textarea
                        id="synopsis"
                        value={formData.synopsis || ''}
                        onChange={(e) => handleInputChange('synopsis', e.target.value)}
                        rows={3}
                        className="resize-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="description_kr" className="text-sm">Description (Korean)</Label>
                      <Textarea
                        id="description_kr"
                        value={formData.description_kr || ''}
                        onChange={(e) => handleInputChange('description_kr', e.target.value)}
                        rows={3}
                        className="resize-none"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="tagline" className="text-sm">Tagline</Label>
                        <Input
                          id="tagline"
                          value={formData.tagline || ''}
                          onChange={(e) => handleInputChange('tagline', e.target.value)}
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="tagline_kr" className="text-sm">Tagline (Korean)</Label>
                        <Input
                          id="tagline_kr"
                          value={formData.tagline_kr || ''}
                          onChange={(e) => handleInputChange('tagline_kr', e.target.value)}
                          className="h-9"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="pitch" className="text-sm">Pitch</Label>
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
                        <Label htmlFor="note" className="text-sm">Note</Label>
                        <Textarea
                          id="note"
                          value={formData.note || ''}
                          onChange={(e) => handleInputChange('note', e.target.value)}
                          rows={2}
                          className="resize-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="note_kr" className="text-sm">Note (Korean)</Label>
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
                      <Label htmlFor="inspiration" className="text-sm">Inspiration</Label>
                      <Textarea
                        id="inspiration"
                        value={formData.inspiration || ''}
                        onChange={(e) => handleInputChange('inspiration', e.target.value)}
                        rows={2}
                        className="resize-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="important_issues" className="text-sm">Important Issues</Label>
                      <Textarea
                        id="important_issues"
                        value={formData.important_issues || ''}
                        onChange={(e) => handleInputChange('important_issues', e.target.value)}
                        rows={2}
                        className="resize-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="setting_description" className="text-sm">Setting Description</Label>
                      <Textarea
                        id="setting_description"
                        value={formData.setting_description || ''}
                        onChange={(e) => handleInputChange('setting_description', e.target.value)}
                        rows={2}
                        className="resize-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="world_lore" className="text-sm">World Lore</Label>
                      <Textarea
                        id="world_lore"
                        value={formData.world_lore || ''}
                        onChange={(e) => handleInputChange('world_lore', e.target.value)}
                        rows={2}
                        className="resize-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="supernatural_concepts" className="text-sm">Supernatural Concepts</Label>
                      <Textarea
                        id="supernatural_concepts"
                        value={formData.supernatural_concepts || ''}
                        onChange={(e) => handleInputChange('supernatural_concepts', e.target.value)}
                        rows={2}
                        className="resize-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="character_details" className="text-sm">Character Details (JSON)</Label>
                      <Textarea
                        id="character_details"
                        value={formData.character_details ? JSON.stringify(formData.character_details, null, 2) : ''}
                        onChange={(e) => {
                          try {
                            const parsed = e.target.value ? JSON.parse(e.target.value) : [];
                            handleInputChange('character_details', parsed);
                          } catch {
                            // Keep raw value for continued editing
                          }
                        }}
                        rows={4}
                        className="resize-none font-mono text-sm"
                        placeholder='[{"name": "Character Name", "role": "protagonist"}]'
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="story_structure" className="text-sm">Story Structure</Label>
                        <Input
                          id="story_structure"
                          value={formData.story_structure || ''}
                          onChange={(e) => handleInputChange('story_structure', e.target.value)}
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="planned_ending" className="text-sm">Planned Ending</Label>
                        <Input
                          id="planned_ending"
                          value={formData.planned_ending || ''}
                          onChange={(e) => handleInputChange('planned_ending', e.target.value)}
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="narrative_arc" className="text-sm">Narrative Arc</Label>
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
                      <Label className="text-sm">Rights Available</Label>
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
                      <Label htmlFor="rights_holder_name" className="text-sm">Rights Holder Name</Label>
                      <Input
                        id="rights_holder_name"
                        value={formData.rights_holder_name || ''}
                        onChange={(e) => handleInputChange('rights_holder_name', e.target.value)}
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="rights_holder_company" className="text-sm">Rights Holder Company</Label>
                      <Input
                        id="rights_holder_company"
                        value={formData.rights_holder_company || ''}
                        onChange={(e) => handleInputChange('rights_holder_company', e.target.value)}
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <Label htmlFor="cp" className="text-sm">CP (Copyright Info)</Label>
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
                      <Label htmlFor="awards" className="text-sm">Awards (comma-separated)</Label>
                      <Input
                        id="awards"
                        value={arrayToString(formData.awards)}
                        onChange={(e) => handleArrayChange('awards', e.target.value)}
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="sales_records" className="text-sm">Sales Records</Label>
                      <Input
                        id="sales_records"
                        value={formData.sales_records || ''}
                        onChange={(e) => handleInputChange('sales_records', e.target.value)}
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="merchandise_deals" className="text-sm">Merchandise Deals</Label>
                      <Input
                        id="merchandise_deals"
                        value={formData.merchandise_deals || ''}
                        onChange={(e) => handleInputChange('merchandise_deals', e.target.value)}
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="print_editions" className="text-sm">Print Editions</Label>
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
                      <Label htmlFor="print_edition_details" className="text-sm">Print Edition Details</Label>
                      <Input
                        id="print_edition_details"
                        value={formData.print_edition_details || ''}
                        onChange={(e) => handleInputChange('print_edition_details', e.target.value)}
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <Label htmlFor="media_coverage" className="text-sm">Media Coverage</Label>
                      <Textarea
                        id="media_coverage"
                        value={formData.media_coverage || ''}
                        onChange={(e) => handleInputChange('media_coverage', e.target.value)}
                        rows={2}
                        className="resize-none"
                      />
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <Label htmlFor="celebrity_endorsements" className="text-sm">Celebrity Endorsements</Label>
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
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
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
    </Dialog>
  );
}
