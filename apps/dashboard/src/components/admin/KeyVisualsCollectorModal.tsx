/**
 * Key Visuals Collector Modal
 *
 * Allows admins to:
 * 1. Collect key visual images from platform URLs and search
 * 2. Preview and select images to save
 * 3. Classify images by type (cover, character, scene, etc.)
 * 4. Save selected images to Supabase storage
 */

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  Loader2,
  Image as ImageIcon,
  Check,
  Download,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import {
  collectKeyVisuals,
  saveKeyVisual,
  getKeyVisuals,
  deleteKeyVisual,
  type DiscoveredImage,
  type ImageType,
  type KeyVisual,
} from '@/services/keyVisualsService';

const IMAGE_TYPE_OPTIONS: { value: ImageType; label: string }[] = [
  { value: 'cover', label: 'Cover' },
  { value: 'character', label: 'Character' },
  { value: 'scene', label: 'Scene' },
  { value: 'promotional', label: 'Promotional' },
  { value: 'other', label: 'Other' },
];

interface KeyVisualsCollectorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  titleId: string;
  titleName?: string;
  titleNameKr?: string;
  titleUrl?: string;
  titleUrlEn?: string;
  userEmail: string;
  onSaved?: () => void;
}

interface SelectableImage extends DiscoveredImage {
  selected: boolean;
  saving: boolean;
  saved: boolean;
  error?: string;
  selectedType: ImageType;
}

export function KeyVisualsCollectorModal({
  open,
  onOpenChange,
  titleId,
  titleName,
  titleNameKr,
  titleUrl,
  titleUrlEn,
  userEmail,
  onSaved,
}: KeyVisualsCollectorModalProps) {
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<SelectableImage[]>([]);
  const [existingVisuals, setExistingVisuals] = useState<KeyVisual[]>([]);
  const [loadingExisting, setLoadingExisting] = useState(false);
  const [savingSelected, setSavingSelected] = useState(false);
  const [displayCount, setDisplayCount] = useState(20);
  const [activeTab, setActiveTab] = useState<'discover' | 'existing'>('discover');

  // Load existing visuals when modal opens
  useEffect(() => {
    if (open && titleId) {
      loadExistingVisuals();
    }
  }, [open, titleId]);

  const loadExistingVisuals = async () => {
    setLoadingExisting(true);
    try {
      const visuals = await getKeyVisuals(titleId);
      setExistingVisuals(visuals);
    } catch (error) {
      console.error('Error loading existing visuals:', error);
    } finally {
      setLoadingExisting(false);
    }
  };

  const handleCollect = async () => {
    setLoading(true);
    setImages([]);

    try {
      const response = await collectKeyVisuals(
        {
          titleId,
          titleName,
          titleNameKr,
          titleUrl,
          titleUrlEn,
          collectedBy: userEmail,
          limit: 30,
        },
        userEmail
      );

      if (response.success) {
        const selectableImages: SelectableImage[] = response.images.map((img) => ({
          ...img,
          selected: false,
          saving: false,
          saved: false,
          selectedType: img.imageType,
        }));
        setImages(selectableImages);

        if (selectableImages.length === 0) {
          toast({
            title: 'No Images Found',
            description: 'Could not find any key visuals. Try adding platform URLs.',
          });
        } else {
          toast({
            title: 'Images Collected',
            description: `Found ${selectableImages.length} images`,
          });
        }
      } else {
        toast({
          title: 'Collection Failed',
          description: 'Failed to collect images',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error collecting images:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleImageSelection = (index: number) => {
    setImages((prev) =>
      prev.map((img, i) =>
        i === index ? { ...img, selected: !img.selected } : img
      )
    );
  };

  const updateImageType = (index: number, type: ImageType) => {
    setImages((prev) =>
      prev.map((img, i) =>
        i === index ? { ...img, selectedType: type } : img
      )
    );
  };

  const handleSaveSelected = async () => {
    const selectedImages = images.filter((img) => img.selected && !img.saved);

    if (selectedImages.length === 0) {
      toast({
        title: 'No Images Selected',
        description: 'Please select at least one image to save',
      });
      return;
    }

    setSavingSelected(true);

    let savedCount = 0;
    let errorCount = 0;

    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      if (!img.selected || img.saved) continue;

      // Mark as saving
      setImages((prev) =>
        prev.map((item, idx) =>
          idx === i ? { ...item, saving: true } : item
        )
      );

      try {
        // Save to storage and database (uses edge function proxy to avoid CORS)
        await saveKeyVisual({
          titleId,
          originalUrl: img.url,
          imageType: img.selectedType,
          description: img.title,
          displayOrder: existingVisuals.length + savedCount,
          isPrimary: existingVisuals.length === 0 && savedCount === 0,
          collectedBy: userEmail,
        });

        savedCount++;

        // Mark as saved
        setImages((prev) =>
          prev.map((item, idx) =>
            idx === i ? { ...item, saving: false, saved: true } : item
          )
        );
      } catch (error) {
        errorCount++;
        const message = error instanceof Error ? error.message : 'Failed to save';
        console.error(`Error saving image ${i}:`, error);

        // Mark error
        setImages((prev) =>
          prev.map((item, idx) =>
            idx === i ? { ...item, saving: false, error: message } : item
          )
        );
      }
    }

    setSavingSelected(false);

    // Reload existing visuals
    await loadExistingVisuals();

    if (savedCount > 0) {
      toast({
        title: 'Images Saved',
        description: `Successfully saved ${savedCount} image${savedCount > 1 ? 's' : ''}${errorCount > 0 ? ` (${errorCount} failed)` : ''}`,
      });
      onSaved?.();
    } else if (errorCount > 0) {
      toast({
        title: 'Save Failed',
        description: `Failed to save ${errorCount} image${errorCount > 1 ? 's' : ''}`,
        variant: 'destructive',
      });
    }
  };

  const handleDeleteExisting = async (keyVisualId: string) => {
    try {
      await deleteKeyVisual(keyVisualId);
      setExistingVisuals((prev) => prev.filter((v) => v.id !== keyVisualId));
      toast({
        title: 'Deleted',
        description: 'Key visual removed',
      });
    } catch (error) {
      console.error('Error deleting key visual:', error);
      const message = error instanceof Error ? error.message : 'Failed to delete';
      toast({
        title: 'Delete Failed',
        description: message,
        variant: 'destructive',
      });
    }
  };

  const loadMore = () => {
    setDisplayCount((prev) => Math.min(prev + 10, images.length));
  };

  const selectedCount = images.filter((img) => img.selected && !img.saved).length;
  const displayedImages = images.slice(0, displayCount);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-[#4C9C9B]" />
            Key Visuals Collector
            {titleName && (
              <span className="text-sm font-normal text-gray-500 ml-2">
                for "{titleName || titleNameKr}"
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex gap-2 border-b pb-2">
          <Button
            variant={activeTab === 'discover' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('discover')}
            className={activeTab === 'discover' ? 'bg-[#4C9C9B] hover:bg-[#4C9C9B]/90' : ''}
          >
            Discover Images
          </Button>
          <Button
            variant={activeTab === 'existing' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('existing')}
            className={activeTab === 'existing' ? 'bg-[#4C9C9B] hover:bg-[#4C9C9B]/90' : ''}
          >
            Existing ({existingVisuals.length})
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {activeTab === 'discover' ? (
            <div className="space-y-4">
              {/* Collection Controls */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Button
                  onClick={handleCollect}
                  disabled={loading}
                  className="bg-[#4C9C9B] hover:bg-[#4C9C9B]/90"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Collecting...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Collect Images
                    </>
                  )}
                </Button>
                {images.length > 0 && (
                  <span className="text-sm text-gray-600">
                    Found {images.length} images • {selectedCount} selected
                  </span>
                )}
              </div>

              {/* Image Grid */}
              {images.length > 0 ? (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {displayedImages.map((img, index) => (
                      <div
                        key={index}
                        className={`relative border rounded-lg overflow-hidden cursor-pointer transition-all ${
                          img.selected
                            ? 'ring-2 ring-[#4C9C9B] border-[#4C9C9B]'
                            : 'border-gray-200 hover:border-gray-300'
                        } ${img.saved ? 'opacity-60' : ''}`}
                        onClick={() => !img.saved && toggleImageSelection(index)}
                      >
                        {/* Image */}
                        <div className="aspect-[3/4] bg-gray-100">
                          <img
                            src={img.thumbnailUrl || img.url}
                            alt={img.title || `Image ${index + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23f3f4f6" width="100" height="100"/><text x="50" y="50" text-anchor="middle" dy=".3em" fill="%239ca3af">No Image</text></svg>';
                            }}
                          />
                        </div>

                        {/* Selection Checkbox */}
                        <div className="absolute top-2 left-2">
                          <div
                            className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                              img.selected
                                ? 'bg-[#4C9C9B] border-[#4C9C9B]'
                                : 'bg-white border-gray-300'
                            }`}
                          >
                            {img.selected && <Check className="h-3 w-3 text-white" />}
                          </div>
                        </div>

                        {/* Status Badge */}
                        {img.saving && (
                          <div className="absolute top-2 right-2">
                            <Loader2 className="h-4 w-4 animate-spin text-[#4C9C9B]" />
                          </div>
                        )}
                        {img.saved && (
                          <div className="absolute top-2 right-2">
                            <Badge className="bg-green-500 text-white text-xs">Saved</Badge>
                          </div>
                        )}
                        {img.error && (
                          <div className="absolute top-2 right-2">
                            <Badge variant="destructive" className="text-xs">Error</Badge>
                          </div>
                        )}

                        {/* Image Type Selector */}
                        {img.selected && !img.saved && (
                          <div className="absolute bottom-0 left-0 right-0 bg-white/95 p-1">
                            <Select
                              value={img.selectedType}
                              onValueChange={(value: ImageType) => {
                                updateImageType(index, value);
                              }}
                            >
                              <SelectTrigger
                                className="h-6 text-xs"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {IMAGE_TYPE_OPTIONS.map((opt) => (
                                  <SelectItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        {/* Source Badge */}
                        <div className="absolute bottom-2 left-2 right-2">
                          {!img.selected && (
                            <Badge variant="secondary" className="text-xs truncate max-w-full">
                              {img.sourceDomain}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Load More */}
                  {displayCount < images.length && (
                    <div className="text-center pt-2">
                      <Button variant="outline" size="sm" onClick={loadMore}>
                        Load More ({images.length - displayCount} remaining)
                      </Button>
                    </div>
                  )}
                </>
              ) : !loading ? (
                <div className="text-center py-12 text-gray-500">
                  <ImageIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>Click "Collect Images" to discover key visuals</p>
                  <p className="text-sm mt-1">
                    Images will be collected from platform URLs and search
                  </p>
                </div>
              ) : null}
            </div>
          ) : (
            /* Existing Visuals Tab */
            <div className="space-y-4">
              {loadingExisting ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : existingVisuals.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {existingVisuals.map((visual) => (
                    <div
                      key={visual.id}
                      className="relative border rounded-lg overflow-hidden group"
                    >
                      <div className="aspect-[3/4] bg-gray-100">
                        <img
                          src={visual.storage_url}
                          alt={visual.description || 'Key visual'}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Primary Badge */}
                      {visual.is_primary && (
                        <div className="absolute top-2 left-2">
                          <Badge className="bg-[#4C9C9B] text-white text-xs">Primary</Badge>
                        </div>
                      )}

                      {/* Type Badge */}
                      <div className="absolute bottom-2 left-2">
                        <Badge variant="secondary" className="text-xs capitalize">
                          {visual.image_type}
                        </Badge>
                      </div>

                      {/* Delete Button */}
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleDeleteExisting(visual.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <ImageIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No key visuals saved yet</p>
                  <p className="text-sm mt-1">
                    Switch to "Discover Images" to collect and save visuals
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="mt-4 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {activeTab === 'discover' && selectedCount > 0 && (
            <Button
              onClick={handleSaveSelected}
              disabled={savingSelected}
              className="bg-[#4C9C9B] hover:bg-[#4C9C9B]/90"
            >
              {savingSelected ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Save Selected ({selectedCount})
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
