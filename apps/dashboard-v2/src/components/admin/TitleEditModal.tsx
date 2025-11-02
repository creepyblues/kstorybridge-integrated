import { useState } from 'react';
import { Title } from '@/services/titlesService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { X } from 'lucide-react';

interface TitleEditModalProps {
  title: Title;
  onSave: (title: Partial<Title>) => Promise<void>;
  onClose: () => void;
}

export function TitleEditModal({ title, onSave, onClose }: TitleEditModalProps) {
  const [formData, setFormData] = useState({
    title_name_en: title.title_name_en || '',
    title_name_kr: title.title_name_kr || '',
    synopsis: title.synopsis || '',
    genre: title.genre || '',
    content_format: title.content_format || '',
  });

  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-black">Edit Title</h2>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* English Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                English Name
              </label>
              <Input
                value={formData.title_name_en}
                onChange={(e) =>
                  setFormData({ ...formData, title_name_en: e.target.value })
                }
                placeholder="Enter English title"
              />
            </div>

            {/* Korean Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Korean Name
              </label>
              <Input
                value={formData.title_name_kr}
                onChange={(e) =>
                  setFormData({ ...formData, title_name_kr: e.target.value })
                }
                placeholder="Enter Korean title"
              />
            </div>

            {/* Synopsis */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Synopsis
              </label>
              <textarea
                value={formData.synopsis}
                onChange={(e) =>
                  setFormData({ ...formData, synopsis: e.target.value })
                }
                placeholder="Enter synopsis"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            {/* Genre */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Genre
              </label>
              <Input
                value={formData.genre}
                onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                placeholder="e.g., Romance, Action, Fantasy"
              />
            </div>

            {/* Content Format */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Content Format
              </label>
              <Input
                value={formData.content_format}
                onChange={(e) =>
                  setFormData({ ...formData, content_format: e.target.value })
                }
                placeholder="e.g., Webtoon, Web Novel"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-4">
              <Button
                type="submit"
                disabled={saving}
                className="flex-1 bg-hanok-teal hover:bg-hanok-teal/90"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1 border-gray-300"
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
