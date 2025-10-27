import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@kstorybridge/ui';
import { StandardButton } from '@/components/StandardButton';
import { Label } from '@kstorybridge/ui';
import { X } from 'lucide-react';
import type { UXMessaging } from '@/services/uxMessagingService';

interface MessagingEditorProps {
  item: UXMessaging;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedItem: UXMessaging) => Promise<void>;
}

export const MessagingEditor: React.FC<MessagingEditorProps> = ({
  item,
  isOpen,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState<UXMessaging>(item);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setFormData(item);
    setHasChanges(false);
  }, [item]);

  const handleChange = (field: keyof UXMessaging, value: string | null) => {
    setFormData(prev => ({
      ...prev,
      [field]: value || null
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await onSave(formData);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setFormData(item);
    setHasChanges(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle>Edit Messaging: {item.page_name}</DialogTitle>
              <p className="text-sm text-gray-600 mt-1">
                Route: <code className="bg-gray-100 px-2 py-0.5 rounded text-xs">{item.page_route}</code>
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-semibold">
              Page Title *
            </Label>
            <input
              id="title"
              type="text"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Main page heading"
            />
            <p className="text-xs text-gray-500">Primary heading displayed at the top of the page</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subtitle" className="text-sm font-semibold">
              Subtitle
            </Label>
            <input
              id="subtitle"
              type="text"
              value={formData.subtitle || ''}
              onChange={(e) => handleChange('subtitle', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Secondary heading (optional)"
            />
            <p className="text-xs text-gray-500">Secondary heading below the main title</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-semibold">
              Description
            </Label>
            <textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              placeholder="Supporting text or page description (optional)"
            />
            <p className="text-xs text-gray-500">Explanatory text displayed below the subtitle</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cta_text" className="text-sm font-semibold">
              Call-to-Action (CTA) Text
            </Label>
            <input
              id="cta_text"
              type="text"
              value={formData.cta_text || ''}
              onChange={(e) => handleChange('cta_text', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Primary action button text (optional)"
            />
            <p className="text-xs text-gray-500">Text for the main action button on the page</p>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h4 className="font-semibold text-gray-900 mb-4">Empty State Messaging</h4>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="empty_state_title" className="text-sm font-semibold">
                  Empty State Title
                </Label>
                <input
                  id="empty_state_title"
                  type="text"
                  value={formData.empty_state_title || ''}
                  onChange={(e) => handleChange('empty_state_title', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Shown when no content is available (optional)"
                />
                <p className="text-xs text-gray-500">Title displayed when there's no data to show</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="empty_state_description" className="text-sm font-semibold">
                  Empty State Description
                </Label>
                <textarea
                  id="empty_state_description"
                  value={formData.empty_state_description || ''}
                  onChange={(e) => handleChange('empty_state_description', e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  placeholder="Message guiding users what to do (optional)"
                />
                <p className="text-xs text-gray-500">Guidance text for the empty state</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-3">Preview</h4>
            <div className="space-y-3">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{formData.title}</h2>
                {formData.subtitle && (
                  <p className="text-lg text-gray-700 mt-1">{formData.subtitle}</p>
                )}
                {formData.description && (
                  <p className="text-gray-600 mt-2">{formData.description}</p>
                )}
                {formData.cta_text && (
                  <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">
                    {formData.cta_text}
                  </button>
                )}
              </div>
              {(formData.empty_state_title || formData.empty_state_description) && (
                <div className="mt-6 pt-6 border-t border-gray-300">
                  <p className="text-xs text-gray-500 mb-2">Empty State:</p>
                  {formData.empty_state_title && (
                    <h3 className="text-lg font-medium text-gray-900">{formData.empty_state_title}</h3>
                  )}
                  {formData.empty_state_description && (
                    <p className="text-gray-600 text-sm mt-1">{formData.empty_state_description}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <div className="flex items-center justify-between w-full">
            <StandardButton
              variant="outline"
              onClick={handleReset}
              disabled={!hasChanges || isSaving}
            >
              Reset
            </StandardButton>
            <div className="flex gap-2">
              <StandardButton
                variant="outline"
                onClick={onClose}
                disabled={isSaving}
              >
                Cancel
              </StandardButton>
              <StandardButton
                onClick={handleSave}
                disabled={!hasChanges || isSaving || !formData.title.trim()}
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </StandardButton>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};