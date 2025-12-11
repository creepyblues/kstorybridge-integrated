/**
 * Key Visuals Gallery Component
 *
 * Displays key visual images for a title with lightbox support.
 * Shows a grid of thumbnails that can be expanded to full view.
 */

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, X, ChevronLeft, ChevronRight, Image as ImageIcon, Expand } from 'lucide-react';
import { getKeyVisuals, type KeyVisual } from '@/services/keyVisualsService';

interface KeyVisualsGalleryProps {
  titleId: string;
  maxDisplay?: number;
}

const IMAGE_TYPE_LABELS: Record<string, string> = {
  cover: 'Cover',
  character: 'Character',
  scene: 'Scene',
  promotional: 'Promotional',
  other: 'Image',
};

export function KeyVisualsGallery({ titleId, maxDisplay = 10 }: KeyVisualsGalleryProps) {
  const [visuals, setVisuals] = useState<KeyVisual[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    loadVisuals();
  }, [titleId]);

  const loadVisuals = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getKeyVisuals(titleId);
      setVisuals(data);
    } catch (err) {
      console.error('Error loading key visuals:', err);
      setError('Failed to load key visuals');
    } finally {
      setLoading(false);
    }
  };

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    setLightboxIndex(null);
    document.body.style.overflow = '';
  };

  const goToPrevious = () => {
    if (lightboxIndex !== null) {
      setLightboxIndex(lightboxIndex === 0 ? visuals.length - 1 : lightboxIndex - 1);
    }
  };

  const goToNext = () => {
    if (lightboxIndex !== null) {
      setLightboxIndex(lightboxIndex === visuals.length - 1 ? 0 : lightboxIndex + 1);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (lightboxIndex === null) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') goToPrevious();
    if (e.key === 'ArrowRight') goToNext();
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex]);

  if (loading) {
    return (
      <Card className="bg-white border border-gray-200 shadow-sm rounded-2xl">
        <CardContent className="p-5">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || visuals.length === 0) {
    return null; // Don't show the section if there are no visuals
  }

  const displayVisuals = showAll ? visuals : visuals.slice(0, maxDisplay);
  const hasMore = visuals.length > maxDisplay && !showAll;

  return (
    <>
      <Card className="bg-white border border-gray-200 shadow-sm rounded-2xl">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-[#4C9C9B]" />
              <h3 className="text-lg font-semibold text-black">Key Visuals</h3>
              <Badge variant="secondary" className="text-xs">
                {visuals.length} images
              </Badge>
            </div>
          </div>

          {/* Grid of thumbnails */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {displayVisuals.map((visual, index) => (
              <div
                key={visual.id}
                className="relative group cursor-pointer rounded-lg overflow-hidden border border-gray-200 hover:border-[#4C9C9B] transition-all"
                onClick={() => openLightbox(index)}
              >
                <div className="aspect-[3/4] bg-gray-100">
                  <img
                    src={visual.storage_url}
                    alt={visual.description || `Key visual ${index + 1}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
                  <Expand className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>

                {/* Primary badge */}
                {visual.is_primary && (
                  <div className="absolute top-2 left-2">
                    <Badge className="bg-[#4C9C9B] text-white text-xs">Primary</Badge>
                  </div>
                )}

                {/* Type badge */}
                <div className="absolute bottom-2 left-2">
                  <Badge variant="secondary" className="text-xs bg-white/90 capitalize">
                    {IMAGE_TYPE_LABELS[visual.image_type] || visual.image_type}
                  </Badge>
                </div>
              </div>
            ))}
          </div>

          {/* Show more button */}
          {hasMore && (
            <div className="mt-4 text-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAll(true)}
                className="text-[#4C9C9B] border-[#4C9C9B] hover:bg-[#4C9C9B]/10"
              >
                Show All ({visuals.length - maxDisplay} more)
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center"
          onClick={closeLightbox}
        >
          {/* Close button */}
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-4 right-4 z-10 text-white hover:bg-white/20"
            onClick={(e) => {
              e.stopPropagation();
              closeLightbox();
            }}
          >
            <X className="h-6 w-6" />
          </Button>

          {/* Previous button */}
          {visuals.length > 1 && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20 h-12 w-12"
              onClick={(e) => {
                e.stopPropagation();
                goToPrevious();
              }}
            >
              <ChevronLeft className="h-8 w-8" />
            </Button>
          )}

          {/* Image */}
          <div
            className="max-w-[90vw] max-h-[90vh] relative"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={visuals[lightboxIndex].storage_url}
              alt={visuals[lightboxIndex].description || `Key visual ${lightboxIndex + 1}`}
              className="max-w-full max-h-[90vh] object-contain"
            />

            {/* Image info */}
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge className="bg-black/60 text-white capitalize">
                  {IMAGE_TYPE_LABELS[visuals[lightboxIndex].image_type] || visuals[lightboxIndex].image_type}
                </Badge>
                {visuals[lightboxIndex].is_primary && (
                  <Badge className="bg-[#4C9C9B] text-white">Primary</Badge>
                )}
              </div>
              <span className="text-white/80 text-sm">
                {lightboxIndex + 1} / {visuals.length}
              </span>
            </div>
          </div>

          {/* Next button */}
          {visuals.length > 1 && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20 h-12 w-12"
              onClick={(e) => {
                e.stopPropagation();
                goToNext();
              }}
            >
              <ChevronRight className="h-8 w-8" />
            </Button>
          )}
        </div>
      )}
    </>
  );
}
