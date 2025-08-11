import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ArrowLeft, Save } from "lucide-react";
import { titlesService, type Title, type TitleUpdate } from "@/services/titlesService";
import { useToast } from "@/components/ui/use-toast";
import AdminLayout from "@/components/layout/AdminLayout";

export default function AdminTitleEdit() {
  const { titleId } = useParams<{ titleId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [title, setTitle] = useState<Title | null>(null);
  const [formData, setFormData] = useState<Partial<Title>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [changes, setChanges] = useState<Array<{ field: string, oldValue: any, newValue: any }>>([]);

  useEffect(() => {
    if (titleId) {
      loadTitle(titleId);
    }
  }, [titleId]);

  const loadTitle = async (id: string) => {
    try {
      setLoading(true);
      const data = await titlesService.getTitleById(id);
      setTitle(data);
      setFormData(data);
    } catch (error) {
      console.error("Error loading title:", error);
      toast({ title: "Error loading title", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof Title, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTagsChange = (value: string) => {
    const tags = value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    handleInputChange('tags', tags);
  };

  const detectChanges = () => {
    if (!title) return [];
    
    const changesDetected: Array<{ field: string, oldValue: any, newValue: any }> = [];
    
    Object.keys(formData).forEach(key => {
      const field = key as keyof Title;
      const oldValue = title[field];
      const newValue = formData[field];
      
      // Skip system fields
      if (['title_id', 'created_at', 'updated_at'].includes(field)) return;
      
      // Compare values, handling arrays and null/undefined
      let hasChanged = false;
      
      if (Array.isArray(oldValue) && Array.isArray(newValue)) {
        hasChanged = JSON.stringify(oldValue.sort()) !== JSON.stringify(newValue.sort());
      } else {
        hasChanged = oldValue !== newValue;
      }
      
      if (hasChanged) {
        changesDetected.push({
          field: field,
          oldValue: oldValue,
          newValue: newValue
        });
      }
    });
    
    return changesDetected;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const detectedChanges = detectChanges();
    
    if (detectedChanges.length === 0) {
      toast({ title: "No changes detected", description: "The form has not been modified." });
      return;
    }
    
    setChanges(detectedChanges);
    setShowConfirmDialog(true);
  };

  const confirmSave = async () => {
    if (!titleId || !title) return;
    
    try {
      setSaving(true);
      
      // Prepare update data excluding system fields
      const updateData: TitleUpdate = {};
      changes.forEach(change => {
        if (!['title_id', 'created_at', 'updated_at'].includes(change.field)) {
          (updateData as any)[change.field] = change.newValue;
        }
      });
      
      await titlesService.updateTitle(titleId, updateData);
      
      toast({ 
        title: "Title updated successfully", 
        description: `Updated ${changes.length} field${changes.length > 1 ? 's' : ''}` 
      });
      
      setShowConfirmDialog(false);
      navigate(`/titles/${titleId}`);
    } catch (error) {
      console.error("Error updating title:", error);
      toast({ title: "Error updating title", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const formatFieldName = (field: string) => {
    return field
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatValue = (value: any) => {
    if (value === null || value === undefined || value === '') return 'Empty';
    if (Array.isArray(value)) return value.join(', ');
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    return String(value);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="text-center text-gray-600 py-8">Loading title...</div>
      </AdminLayout>
    );
  }

  if (!title) {
    return (
      <AdminLayout>
        <div className="text-center text-gray-600 py-8">Title not found</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6">
        {/* Back Button */}
        <div className="mb-8">
          <Button
            onClick={() => navigate(`/titles/${titleId}`)}
            variant="ghost"
            className="text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Title Detail
          </Button>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-midnight-ink mb-2">
            Edit Title
          </h1>
          <p className="text-lg text-gray-500">
            {title.title_name_en || title.title_name_kr}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Basic Information */}
            <div className="space-y-6">
              <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-midnight-ink text-xl">Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-hanok-teal mb-2">
                      Title Name (Korean)
                    </label>
                    <Input
                      value={formData.title_name_kr || ''}
                      onChange={(e) => handleInputChange('title_name_kr', e.target.value)}
                      placeholder="한국어 제목"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-hanok-teal mb-2">
                      Title Name (English)
                    </label>
                    <Input
                      value={formData.title_name_en || ''}
                      onChange={(e) => handleInputChange('title_name_en', e.target.value)}
                      placeholder="English Title"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-hanok-teal mb-2">
                      Tagline
                    </label>
                    <Input
                      value={formData.tagline || ''}
                      onChange={(e) => handleInputChange('tagline', e.target.value)}
                      placeholder="Brief tagline"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-hanok-teal mb-2">
                      Genre
                    </label>
                    <Select
                      value={formData.genre || ''}
                      onValueChange={(value) => handleInputChange('genre', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select genre" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="romance">Romance</SelectItem>
                        <SelectItem value="action">Action</SelectItem>
                        <SelectItem value="drama">Drama</SelectItem>
                        <SelectItem value="comedy">Comedy</SelectItem>
                        <SelectItem value="thriller">Thriller</SelectItem>
                        <SelectItem value="fantasy">Fantasy</SelectItem>
                        <SelectItem value="sci_fi">Sci-Fi</SelectItem>
                        <SelectItem value="horror">Horror</SelectItem>
                        <SelectItem value="slice_of_life">Slice of Life</SelectItem>
                        <SelectItem value="historical">Historical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-hanok-teal mb-2">
                      Content Format
                    </label>
                    <Select
                      value={formData.content_format || ''}
                      onValueChange={(value) => handleInputChange('content_format', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select format" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="webtoon">Webtoon</SelectItem>
                        <SelectItem value="web_novel">Web Novel</SelectItem>
                        <SelectItem value="manhwa">Manhwa</SelectItem>
                        <SelectItem value="novel">Novel</SelectItem>
                        <SelectItem value="short_story">Short Story</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Authors */}
              <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-midnight-ink text-xl">Authors & Rights</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-hanok-teal mb-2">
                      Author (Original)
                    </label>
                    <Input
                      value={formData.author || ''}
                      onChange={(e) => handleInputChange('author', e.target.value)}
                      placeholder="Original author name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-hanok-teal mb-2">
                      Story Author
                    </label>
                    <Input
                      value={formData.story_author || ''}
                      onChange={(e) => handleInputChange('story_author', e.target.value)}
                      placeholder="Story author name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-hanok-teal mb-2">
                      Art Author
                    </label>
                    <Input
                      value={formData.art_author || ''}
                      onChange={(e) => handleInputChange('art_author', e.target.value)}
                      placeholder="Art author name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-hanok-teal mb-2">
                      Writer
                    </label>
                    <Input
                      value={formData.writer || ''}
                      onChange={(e) => handleInputChange('writer', e.target.value)}
                      placeholder="Writer name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-hanok-teal mb-2">
                      Illustrator
                    </label>
                    <Input
                      value={formData.illustrator || ''}
                      onChange={(e) => handleInputChange('illustrator', e.target.value)}
                      placeholder="Illustrator name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-hanok-teal mb-2">
                      Rights
                    </label>
                    <Input
                      value={formData.rights || ''}
                      onChange={(e) => handleInputChange('rights', e.target.value)}
                      placeholder="Rights information"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-hanok-teal mb-2">
                      Rights Owner
                    </label>
                    <Input
                      value={formData.rights_owner || ''}
                      onChange={(e) => handleInputChange('rights_owner', e.target.value)}
                      placeholder="Rights owner information"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Content & Market Info */}
            <div className="space-y-6">
              <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-midnight-ink text-xl">Content Description</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-hanok-teal mb-2">
                      Synopsis
                    </label>
                    <Textarea
                      value={formData.synopsis || ''}
                      onChange={(e) => handleInputChange('synopsis', e.target.value)}
                      placeholder="Brief synopsis of the content"
                      rows={3}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-hanok-teal mb-2">
                      Description
                    </label>
                    <Textarea
                      value={formData.description || ''}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Detailed description of the content"
                      rows={4}
                    />
                  </div>
                  
                  
                  <div>
                    <label className="block text-sm font-semibold text-hanok-teal mb-2">
                      Note
                    </label>
                    <Textarea
                      value={formData.note || ''}
                      onChange={(e) => handleInputChange('note', e.target.value)}
                      placeholder="Additional notes"
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-midnight-ink text-xl">Market Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-hanok-teal mb-2">
                      Perfect For
                    </label>
                    <Input
                      value={formData.perfect_for || ''}
                      onChange={(e) => handleInputChange('perfect_for', e.target.value)}
                      placeholder="Target market or adaptation"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-hanok-teal mb-2">
                      Comps
                    </label>
                    <Input
                      value={formData.comps || ''}
                      onChange={(e) => handleInputChange('comps', e.target.value)}
                      placeholder="Comparable titles"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-hanok-teal mb-2">
                      Tone
                    </label>
                    <Input
                      value={formData.tone || ''}
                      onChange={(e) => handleInputChange('tone', e.target.value)}
                      placeholder="Tone and mood"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-hanok-teal mb-2">
                      Audience
                    </label>
                    <Input
                      value={formData.audience || ''}
                      onChange={(e) => handleInputChange('audience', e.target.value)}
                      placeholder="Target audience"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-midnight-ink text-xl">Content Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-hanok-teal mb-2">
                      Title Image URL
                    </label>
                    <Input
                      value={formData.title_image || ''}
                      onChange={(e) => handleInputChange('title_image', e.target.value)}
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-hanok-teal mb-2">
                      Title URL
                    </label>
                    <Input
                      value={formData.title_url || ''}
                      onChange={(e) => handleInputChange('title_url', e.target.value)}
                      placeholder="https://example.com/title"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-hanok-teal mb-2">
                      Pitch Document URL
                    </label>
                    <Input
                      value={formData.pitch || ''}
                      onChange={(e) => handleInputChange('pitch', e.target.value)}
                      placeholder="https://example.com/pitch.pdf"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-hanok-teal mb-2">
                        Views
                      </label>
                      <Input
                        type="number"
                        value={formData.views || ''}
                        onChange={(e) => handleInputChange('views', parseInt(e.target.value) || null)}
                        placeholder="0"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-hanok-teal mb-2">
                        Likes
                      </label>
                      <Input
                        type="number"
                        value={formData.likes || ''}
                        onChange={(e) => handleInputChange('likes', parseInt(e.target.value) || null)}
                        placeholder="0"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-hanok-teal mb-2">
                        Rating
                      </label>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        max="10"
                        value={formData.rating || ''}
                        onChange={(e) => handleInputChange('rating', parseFloat(e.target.value) || null)}
                        placeholder="0.0"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-hanok-teal mb-2">
                        Rating Count
                      </label>
                      <Input
                        type="number"
                        value={formData.rating_count || ''}
                        onChange={(e) => handleInputChange('rating_count', parseInt(e.target.value) || null)}
                        placeholder="0"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-hanok-teal mb-2">
                      Chapters
                    </label>
                    <Input
                      type="number"
                      value={formData.chapters || ''}
                      onChange={(e) => handleInputChange('chapters', parseInt(e.target.value) || null)}
                      placeholder="0"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-hanok-teal mb-2">
                      Completed
                    </label>
                    <Select
                      value={formData.completed === null ? 'null' : String(formData.completed)}
                      onValueChange={(value) => handleInputChange('completed', value === 'null' ? null : value === 'true')}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="null">Not Specified</SelectItem>
                        <SelectItem value="true">Completed</SelectItem>
                        <SelectItem value="false">Ongoing</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-hanok-teal mb-2">
                      Tags (comma-separated)
                    </label>
                    <Input
                      value={Array.isArray(formData.tags) ? formData.tags.join(', ') : ''}
                      onChange={(e) => handleTagsChange(e.target.value)}
                      placeholder="tag1, tag2, tag3"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end mt-8">
            <Button
              type="submit"
              className="bg-hanok-teal hover:bg-hanok-teal/90 text-white px-8 py-3"
              disabled={saving}
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>

        {/* Confirmation Dialog */}
        <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Confirm Changes</DialogTitle>
            </DialogHeader>
            
            <div className="py-4">
              <p className="text-gray-600 mb-4">
                You are about to make the following changes to "{title.title_name_en || title.title_name_kr}":
              </p>
              
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {changes.map((change, index) => (
                  <div key={index} className="border rounded-lg p-3 bg-gray-50">
                    <h4 className="font-semibold text-hanok-teal mb-2">
                      {formatFieldName(change.field)}
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-red-600">Old:</span>
                        <div className="mt-1 p-2 bg-red-50 rounded border-l-2 border-red-200">
                          {formatValue(change.oldValue)}
                        </div>
                      </div>
                      <div>
                        <span className="font-medium text-green-600">New:</span>
                        <div className="mt-1 p-2 bg-green-50 rounded border-l-2 border-green-200">
                          {formatValue(change.newValue)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setShowConfirmDialog(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button 
                onClick={confirmSave}
                className="bg-hanok-teal hover:bg-hanok-teal/90 text-white"
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Confirm Changes'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}