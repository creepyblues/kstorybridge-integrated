import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '@/components/layout/AdminLayout';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from '@/hooks/use-toast';
import { titlesService, Title } from '@/services/titlesService';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';

export default function TitleEdit() {
  const { toast } = useToast();
  const { titleId } = useParams<{ titleId: string }>();
  const navigate = useNavigate();

  const [title, setTitle] = useState<Title | null>(null);
  const [formData, setFormData] = useState<Partial<Title>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
      setFormData(data || {});
    } catch (error: any) {
      console.error('Error loading title:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load title',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof Title, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!titleId) return;

    try {
      setSaving(true);
      await titlesService.updateTitle(titleId, formData);

      toast({
        title: 'Success',
        description: 'Title updated successfully',
      });

      navigate('/admin/titles');
    } catch (error: any) {
      console.error('Error updating title:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update title',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </AdminLayout>
    );
  }

  if (!title) {
    return (
      <AdminLayout>
        <div className="p-6 text-center text-gray-600">Title not found</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Button
              onClick={() => navigate('/admin/titles')}
              variant="ghost"
              className="text-gray-600 hover:text-gray-800 -ml-2 mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Titles
            </Button>
            <h1 className="text-3xl font-bold text-black">Edit Title</h1>
            <p className="text-gray-600 mt-1">
              {title.title_name_en || title.title_name_kr}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Basic Information */}
            <div className="space-y-6">
              <Card className="bg-transparent border-gray-300 shadow-none">
                <CardHeader>
                  <CardTitle className="text-black">Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Title (Korean)
                    </label>
                    <Input
                      value={formData.title_name_kr || ''}
                      onChange={(e) => handleInputChange('title_name_kr', e.target.value)}
                      placeholder="한국어 제목"
                      className="border-gray-300"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Title (English)
                    </label>
                    <Input
                      value={formData.title_name_en || ''}
                      onChange={(e) => handleInputChange('title_name_en', e.target.value)}
                      placeholder="English Title"
                      className="border-gray-300"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Tagline
                    </label>
                    <Input
                      value={formData.tagline || ''}
                      onChange={(e) => handleInputChange('tagline', e.target.value)}
                      placeholder="Brief tagline"
                      className="border-gray-300"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Genre
                    </label>
                    <Input
                      value={formData.genre || ''}
                      onChange={(e) => handleInputChange('genre', e.target.value)}
                      placeholder="Genre"
                      className="border-gray-300"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Content Format
                    </label>
                    <Select
                      value={formData.content_format || ''}
                      onValueChange={(value) => handleInputChange('content_format', value)}
                    >
                      <SelectTrigger className="border-gray-300">
                        <SelectValue placeholder="Select format" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="webtoon">Webtoon</SelectItem>
                        <SelectItem value="web_novel">Web Novel</SelectItem>
                        <SelectItem value="manhwa">Manhwa</SelectItem>
                        <SelectItem value="novel">Novel</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Tone
                    </label>
                    <Input
                      value={formData.tone || ''}
                      onChange={(e) => handleInputChange('tone', e.target.value)}
                      placeholder="Tone (e.g., Dark, Light, Serious)"
                      className="border-gray-300"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Audience
                    </label>
                    <Input
                      value={formData.audience || ''}
                      onChange={(e) => handleInputChange('audience', e.target.value)}
                      placeholder="Target audience"
                      className="border-gray-300"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-transparent border-gray-300 shadow-none">
                <CardHeader>
                  <CardTitle className="text-black">Media & Links</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Title Image URL
                    </label>
                    <Input
                      value={formData.title_image || ''}
                      onChange={(e) => handleInputChange('title_image', e.target.value)}
                      placeholder="https://..."
                      className="border-gray-300"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Title URL
                    </label>
                    <Input
                      value={formData.title_url || ''}
                      onChange={(e) => handleInputChange('title_url', e.target.value)}
                      placeholder="https://..."
                      className="border-gray-300"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Content & Metrics */}
            <div className="space-y-6">
              <Card className="bg-transparent border-gray-300 shadow-none">
                <CardHeader>
                  <CardTitle className="text-black">Content Description</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Synopsis
                    </label>
                    <Textarea
                      value={formData.synopsis || ''}
                      onChange={(e) => handleInputChange('synopsis', e.target.value)}
                      placeholder="Brief synopsis"
                      rows={4}
                      className="border-gray-300"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Perfect For
                    </label>
                    <Input
                      value={formData.perfect_for || ''}
                      onChange={(e) => handleInputChange('perfect_for', e.target.value)}
                      placeholder="Perfect for..."
                      className="border-gray-300"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-transparent border-gray-300 shadow-none">
                <CardHeader>
                  <CardTitle className="text-black">Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Views
                    </label>
                    <Input
                      type="number"
                      value={formData.views || 0}
                      onChange={(e) => handleInputChange('views', parseInt(e.target.value) || 0)}
                      className="border-gray-300"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Rating (0-10)
                    </label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      max="10"
                      value={formData.rating || 0}
                      onChange={(e) => handleInputChange('rating', parseFloat(e.target.value) || 0)}
                      className="border-gray-300"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Chapters
                    </label>
                    <Input
                      type="number"
                      value={formData.chapters || 0}
                      onChange={(e) => handleInputChange('chapters', parseInt(e.target.value) || 0)}
                      className="border-gray-300"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Status
                    </label>
                    <Select
                      value={formData.completed ? 'completed' : 'ongoing'}
                      onValueChange={(value) =>
                        handleInputChange('completed', value === 'completed')
                      }
                    >
                      <SelectTrigger className="border-gray-300">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ongoing">Ongoing</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-300">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/admin/titles')}
              className="border-gray-300"
            >
              Cancel
            </Button>
            <Button
              type="submit"
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
        </form>
      </div>
    </AdminLayout>
  );
}
