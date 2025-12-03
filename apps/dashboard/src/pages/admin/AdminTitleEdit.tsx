import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import AdminLayout from '@/components/layout/AdminLayout';
import { useToast } from '@/hooks/use-toast';
import { titlesService, Title } from '@/services/titlesService';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';

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
  'film_tv', 'animation', 'publication', 'merchandising', 'game', 'other'
];

export default function AdminTitleEdit() {
  const { titleId } = useParams<{ titleId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState<Title | null>(null);
  const [formData, setFormData] = useState<Partial<Title>>({});

  useEffect(() => {
    if (titleId) {
      fetchTitle(titleId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [titleId]);

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
        navigate('/admin/titles');
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
    // Convert comma-separated string to array
    const arrayValue = value.split(',').map((item) => item.trim()).filter(Boolean);
    setFormData((prev) => ({ ...prev, [field]: arrayValue }));
  };

  const handleSave = async () => {
    if (!titleId) return;

    setSaving(true);
    try {
      // Remove read-only and related table fields before saving
      const {
        title_id,
        created_at,
        updated_at,
        creator_id,
        platforms,
        documents,
        pitch_analysis,
        processing_confidence,
        title_content_analysis, // Related table, not a column
        ...updates
      } = formData as Record<string, unknown>;

      console.log('🔄 Saving title:', titleId);
      console.log('📝 Updates:', updates);

      await titlesService.updateTitle(titleId, updates);
      console.log('✅ Title saved successfully');

      toast({
        title: 'Success',
        description: 'Title updated successfully',
      });

      navigate('/admin/titles');
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

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </AdminLayout>
    );
  }

  if (!title) {
    return (
      <AdminLayout>
        <div className="p-6">
          <div className="text-center py-12 text-gray-500">
            Title not found
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/admin/titles')}
              className="h-8 w-8 p-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-black">Edit Title</h1>
              <p className="text-sm text-gray-600 mt-1">
                {title.title_name_en || title.title_name_kr || 'Untitled'}
              </p>
            </div>
          </div>
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

        {/* System Info */}
        <Card className="bg-gray-50">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-500">ID:</span>
                <span className="ml-2 font-mono text-xs">{title.title_id}</span>
              </div>
              <div>
                <span className="text-gray-500">Created:</span>
                <span className="ml-2">{title.created_at ? new Date(title.created_at).toLocaleDateString() : '-'}</span>
              </div>
              <div>
                <span className="text-gray-500">Updated:</span>
                <span className="ml-2">{title.updated_at ? new Date(title.updated_at).toLocaleDateString() : '-'}</span>
              </div>
              <div>
                <span className="text-gray-500">Creator ID:</span>
                <span className="ml-2 font-mono text-xs">{title.creator_id || '-'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Accordion Sections */}
        <Card>
          <CardContent className="p-6">
            <Accordion type="multiple" defaultValue={['basic-info']} className="w-full">

              {/* Basic Info Section */}
              <AccordionItem value="basic-info">
                <AccordionTrigger className="text-lg font-semibold">
                  Basic Info
                </AccordionTrigger>
                <AccordionContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="title_name_en">English Name</Label>
                      <Input
                        id="title_name_en"
                        value={formData.title_name_en || ''}
                        onChange={(e) => handleInputChange('title_name_en', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="title_name_kr">Korean Name</Label>
                      <Input
                        id="title_name_kr"
                        value={formData.title_name_kr || ''}
                        onChange={(e) => handleInputChange('title_name_kr', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="title_url">Title URL</Label>
                      <Input
                        id="title_url"
                        value={formData.title_url || ''}
                        onChange={(e) => handleInputChange('title_url', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="title_url_en">English URL</Label>
                      <Input
                        id="title_url_en"
                        value={formData.title_url_en || ''}
                        onChange={(e) => handleInputChange('title_url_en', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="title_image">Image URL</Label>
                      <Input
                        id="title_image"
                        value={formData.title_image || ''}
                        onChange={(e) => handleInputChange('title_image', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="priority">Priority</Label>
                      <Select
                        value={formData.priority || '2'}
                        onValueChange={(value) => handleInputChange('priority', value)}
                      >
                        <SelectTrigger>
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
                    <div className="space-y-2">
                      <Label htmlFor="verified">Verified</Label>
                      <Select
                        value={formData.verified ? 'true' : 'false'}
                        onValueChange={(value) => handleInputChange('verified', value === 'true')}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select verification status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">Yes</SelectItem>
                          <SelectItem value="false">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Classification Section */}
              <AccordionItem value="classification">
                <AccordionTrigger className="text-lg font-semibold">
                  Classification
                </AccordionTrigger>
                <AccordionContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="genre">Genre (comma-separated)</Label>
                      <Input
                        id="genre"
                        value={arrayToString(formData.genre)}
                        onChange={(e) => handleArrayChange('genre', e.target.value)}
                        placeholder="romance, fantasy, action"
                      />
                      <p className="text-xs text-gray-500">
                        Options: {GENRE_OPTIONS.join(', ')}
                      </p>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="genre_kr">Korean Genre (comma-separated)</Label>
                      <Input
                        id="genre_kr"
                        value={arrayToString(formData.genre_kr)}
                        onChange={(e) => handleArrayChange('genre_kr', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="content_format">Content Format</Label>
                      <Select
                        value={formData.content_format || ''}
                        onValueChange={(value) => handleInputChange('content_format', value)}
                      >
                        <SelectTrigger>
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
                    <div className="space-y-2">
                      <Label htmlFor="tone">Tone</Label>
                      <Input
                        id="tone"
                        value={formData.tone || ''}
                        onChange={(e) => handleInputChange('tone', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="audience">Audience</Label>
                      <Input
                        id="audience"
                        value={formData.audience || ''}
                        onChange={(e) => handleInputChange('audience', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="age_rating">Age Rating</Label>
                      <Input
                        id="age_rating"
                        value={formData.age_rating || ''}
                        onChange={(e) => handleInputChange('age_rating', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="keywords">Keywords (comma-separated)</Label>
                      <Input
                        id="keywords"
                        value={arrayToString(formData.keywords)}
                        onChange={(e) => handleArrayChange('keywords', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="comps">Comps (comma-separated)</Label>
                      <Input
                        id="comps"
                        value={arrayToString(formData.comps)}
                        onChange={(e) => handleArrayChange('comps', e.target.value)}
                        placeholder="Similar titles for comparison"
                      />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Metrics Section */}
              <AccordionItem value="metrics">
                <AccordionTrigger className="text-lg font-semibold">
                  Metrics
                </AccordionTrigger>
                <AccordionContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="views">Views</Label>
                      <Input
                        id="views"
                        type="number"
                        value={formData.views ?? ''}
                        onChange={(e) => handleInputChange('views', e.target.value ? parseInt(e.target.value) : null)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="likes">Likes</Label>
                      <Input
                        id="likes"
                        type="number"
                        value={formData.likes ?? ''}
                        onChange={(e) => handleInputChange('likes', e.target.value ? parseInt(e.target.value) : null)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rating">Rating (0-5)</Label>
                      <Input
                        id="rating"
                        type="number"
                        step="0.1"
                        min="0"
                        max="5"
                        value={formData.rating ?? ''}
                        onChange={(e) => handleInputChange('rating', e.target.value ? parseFloat(e.target.value) : null)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rating_count">Rating Count</Label>
                      <Input
                        id="rating_count"
                        type="number"
                        value={formData.rating_count ?? ''}
                        onChange={(e) => handleInputChange('rating_count', e.target.value ? parseInt(e.target.value) : null)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="chapters">Chapters</Label>
                      <Input
                        id="chapters"
                        type="number"
                        value={formData.chapters ?? ''}
                        onChange={(e) => handleInputChange('chapters', e.target.value ? parseInt(e.target.value) : null)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="completed">Completed</Label>
                      <Select
                        value={formData.completed ? 'true' : 'false'}
                        onValueChange={(value) => handleInputChange('completed', value === 'true')}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">Yes</SelectItem>
                          <SelectItem value="false">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 md:col-span-3">
                      <Label htmlFor="perfect_for">Perfect For</Label>
                      <Input
                        id="perfect_for"
                        value={formData.perfect_for || ''}
                        onChange={(e) => handleInputChange('perfect_for', e.target.value)}
                        placeholder="e.g., Fans of romance, K-drama lovers"
                      />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Authors & Credits Section */}
              <AccordionItem value="authors">
                <AccordionTrigger className="text-lg font-semibold">
                  Authors & Credits
                </AccordionTrigger>
                <AccordionContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="story_author">Story Author</Label>
                      <Input
                        id="story_author"
                        value={formData.story_author || ''}
                        onChange={(e) => handleInputChange('story_author', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="story_author_kr">Story Author (Korean)</Label>
                      <Input
                        id="story_author_kr"
                        value={formData.story_author_kr || ''}
                        onChange={(e) => handleInputChange('story_author_kr', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="art_author">Art Author</Label>
                      <Input
                        id="art_author"
                        value={formData.art_author || ''}
                        onChange={(e) => handleInputChange('art_author', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="art_author_kr">Art Author (Korean)</Label>
                      <Input
                        id="art_author_kr"
                        value={formData.art_author_kr || ''}
                        onChange={(e) => handleInputChange('art_author_kr', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="original_author">Original Author</Label>
                      <Input
                        id="original_author"
                        value={formData.original_author || ''}
                        onChange={(e) => handleInputChange('original_author', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="original_author_kr">Original Author (Korean)</Label>
                      <Input
                        id="original_author_kr"
                        value={formData.original_author_kr || ''}
                        onChange={(e) => handleInputChange('original_author_kr', e.target.value)}
                      />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Content Section */}
              <AccordionItem value="content">
                <AccordionTrigger className="text-lg font-semibold">
                  Content
                </AccordionTrigger>
                <AccordionContent>
                  <div className="grid grid-cols-1 gap-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="synopsis">Synopsis</Label>
                      <Textarea
                        id="synopsis"
                        value={formData.synopsis || ''}
                        onChange={(e) => handleInputChange('synopsis', e.target.value)}
                        rows={4}
                        className="resize-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description_kr">Description (Korean)</Label>
                      <Textarea
                        id="description_kr"
                        value={formData.description_kr || ''}
                        onChange={(e) => handleInputChange('description_kr', e.target.value)}
                        rows={4}
                        className="resize-none"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="tagline">Tagline</Label>
                        <Input
                          id="tagline"
                          value={formData.tagline || ''}
                          onChange={(e) => handleInputChange('tagline', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="tagline_kr">Tagline (Korean)</Label>
                        <Input
                          id="tagline_kr"
                          value={formData.tagline_kr || ''}
                          onChange={(e) => handleInputChange('tagline_kr', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pitch">Pitch</Label>
                      <Textarea
                        id="pitch"
                        value={formData.pitch || ''}
                        onChange={(e) => handleInputChange('pitch', e.target.value)}
                        rows={4}
                        className="resize-none"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="note">Note</Label>
                        <Textarea
                          id="note"
                          value={formData.note || ''}
                          onChange={(e) => handleInputChange('note', e.target.value)}
                          rows={2}
                          className="resize-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="note_kr">Note (Korean)</Label>
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
                </AccordionContent>
              </AccordionItem>

              {/* Story Details Section */}
              <AccordionItem value="story-details">
                <AccordionTrigger className="text-lg font-semibold">
                  Story Details
                </AccordionTrigger>
                <AccordionContent>
                  <div className="grid grid-cols-1 gap-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="inspiration">Inspiration</Label>
                      <Textarea
                        id="inspiration"
                        value={formData.inspiration || ''}
                        onChange={(e) => handleInputChange('inspiration', e.target.value)}
                        rows={3}
                        className="resize-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="important_issues">Important Issues</Label>
                      <Textarea
                        id="important_issues"
                        value={formData.important_issues || ''}
                        onChange={(e) => handleInputChange('important_issues', e.target.value)}
                        rows={3}
                        className="resize-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="setting_description">Setting Description</Label>
                      <Textarea
                        id="setting_description"
                        value={formData.setting_description || ''}
                        onChange={(e) => handleInputChange('setting_description', e.target.value)}
                        rows={3}
                        className="resize-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="world_lore">World Lore</Label>
                      <Textarea
                        id="world_lore"
                        value={formData.world_lore || ''}
                        onChange={(e) => handleInputChange('world_lore', e.target.value)}
                        rows={3}
                        className="resize-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="supernatural_concepts">Supernatural Concepts</Label>
                      <Textarea
                        id="supernatural_concepts"
                        value={formData.supernatural_concepts || ''}
                        onChange={(e) => handleInputChange('supernatural_concepts', e.target.value)}
                        rows={3}
                        className="resize-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="character_details">Character Details (JSON)</Label>
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
                        rows={6}
                        className="resize-none font-mono text-sm"
                        placeholder='[{"name": "Character Name", "role": "protagonist"}]'
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="story_structure">Story Structure</Label>
                        <Input
                          id="story_structure"
                          value={formData.story_structure || ''}
                          onChange={(e) => handleInputChange('story_structure', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="planned_ending">Planned Ending</Label>
                        <Input
                          id="planned_ending"
                          value={formData.planned_ending || ''}
                          onChange={(e) => handleInputChange('planned_ending', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="narrative_arc">Narrative Arc</Label>
                        <Input
                          id="narrative_arc"
                          value={formData.narrative_arc || ''}
                          onChange={(e) => handleInputChange('narrative_arc', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Rights & Business Section */}
              <AccordionItem value="rights">
                <AccordionTrigger className="text-lg font-semibold">
                  Rights & Business
                </AccordionTrigger>
                <AccordionContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="rights_available">Rights Available (comma-separated)</Label>
                      <Input
                        id="rights_available"
                        value={arrayToString(formData.rights_available)}
                        onChange={(e) => handleArrayChange('rights_available', e.target.value)}
                        placeholder="film_tv, animation, publication"
                      />
                      <p className="text-xs text-gray-500">
                        Options: {RIGHTS_OPTIONS.join(', ')}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rights_holder_name">Rights Holder Name</Label>
                      <Input
                        id="rights_holder_name"
                        value={formData.rights_holder_name || ''}
                        onChange={(e) => handleInputChange('rights_holder_name', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rights_holder_company">Rights Holder Company</Label>
                      <Input
                        id="rights_holder_company"
                        value={formData.rights_holder_company || ''}
                        onChange={(e) => handleInputChange('rights_holder_company', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="cp">CP (Copyright Info)</Label>
                      <Input
                        id="cp"
                        value={formData.cp || ''}
                        onChange={(e) => handleInputChange('cp', e.target.value)}
                      />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Achievements Section */}
              <AccordionItem value="achievements">
                <AccordionTrigger className="text-lg font-semibold">
                  Achievements
                </AccordionTrigger>
                <AccordionContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="awards">Awards (comma-separated)</Label>
                      <Input
                        id="awards"
                        value={arrayToString(formData.awards)}
                        onChange={(e) => handleArrayChange('awards', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sales_records">Sales Records</Label>
                      <Input
                        id="sales_records"
                        value={formData.sales_records || ''}
                        onChange={(e) => handleInputChange('sales_records', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="merchandise_deals">Merchandise Deals</Label>
                      <Input
                        id="merchandise_deals"
                        value={formData.merchandise_deals || ''}
                        onChange={(e) => handleInputChange('merchandise_deals', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="print_editions">Print Editions</Label>
                      <Select
                        value={formData.print_editions ? 'true' : 'false'}
                        onValueChange={(value) => handleInputChange('print_editions', value === 'true')}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">Yes</SelectItem>
                          <SelectItem value="false">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="print_edition_details">Print Edition Details</Label>
                      <Input
                        id="print_edition_details"
                        value={formData.print_edition_details || ''}
                        onChange={(e) => handleInputChange('print_edition_details', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="media_coverage">Media Coverage</Label>
                      <Textarea
                        id="media_coverage"
                        value={formData.media_coverage || ''}
                        onChange={(e) => handleInputChange('media_coverage', e.target.value)}
                        rows={2}
                        className="resize-none"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="celebrity_endorsements">Celebrity Endorsements</Label>
                      <Textarea
                        id="celebrity_endorsements"
                        value={formData.celebrity_endorsements || ''}
                        onChange={(e) => handleInputChange('celebrity_endorsements', e.target.value)}
                        rows={2}
                        className="resize-none"
                      />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

            </Accordion>
          </CardContent>
        </Card>

        {/* Bottom Save Button */}
        <div className="flex justify-end">
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
    </AdminLayout>
  );
}
