/**
 * IntelligenceResultsModal Component
 *
 * Displays collected intelligence data and allows creator to select
 * which fields to ingest into their title.
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
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Icon } from '@iconify/react';
import {
  type IntelligenceTitleWithSources,
  type ExtractedIntelligenceData,
  extractIntelligenceData,
  formatNumber,
  getFieldLabel,
  getPlatformDisplayName,
  type SupportedPlatform,
} from '@/services/intelligenceService';

interface IntelligenceResultsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  results: IntelligenceTitleWithSources | null;
  onIngest: (selectedFields: Partial<ExtractedIntelligenceData>) => Promise<void>;
  isIngesting?: boolean;
}

type FieldKey = keyof ExtractedIntelligenceData;

// Helper to detect platform from domain
function detectPlatformFromDomain(domain: string): SupportedPlatform {
  if (domain.includes('kakao')) {
    return domain.includes('webtoon') ? 'kakao_webtoon' : 'kakao';
  }
  if (domain.includes('naver')) {
    return domain.includes('series') ? 'naver_series' : 'naver_webtoon';
  }
  if (domain.includes('manta')) return 'manta';
  if (domain.includes('lezhin')) return 'lezhin';
  if (domain.includes('ridibooks')) return 'ridibooks';
  if (domain.includes('bomtoon')) return 'bomtoon';
  return 'unknown';
}

export function IntelligenceResultsModal({
  open,
  onOpenChange,
  results,
  onIngest,
  isIngesting = false,
}: IntelligenceResultsModalProps) {
  const [selectedFields, setSelectedFields] = useState<Set<FieldKey>>(new Set());
  const [extractedData, setExtractedData] = useState<ExtractedIntelligenceData>({});

  // Extract data when results change
  useEffect(() => {
    if (results) {
      const data = extractIntelligenceData(results);
      setExtractedData(data);
      // Select all available fields by default
      setSelectedFields(new Set(Object.keys(data) as FieldKey[]));
    } else {
      setExtractedData({});
      setSelectedFields(new Set());
    }
  }, [results]);

  const availableFields = Object.keys(extractedData) as FieldKey[];

  const toggleField = (field: FieldKey) => {
    const newSelected = new Set(selectedFields);
    if (newSelected.has(field)) {
      newSelected.delete(field);
    } else {
      newSelected.add(field);
    }
    setSelectedFields(newSelected);
  };

  const selectAll = () => {
    setSelectedFields(new Set(availableFields));
  };

  const deselectAll = () => {
    setSelectedFields(new Set());
  };

  const handleIngest = async () => {
    const fieldsToIngest: Partial<ExtractedIntelligenceData> = {};
    for (const field of selectedFields) {
      if (field in extractedData) {
        (fieldsToIngest as Record<string, unknown>)[field] = extractedData[field];
      }
    }
    await onIngest(fieldsToIngest);
    onOpenChange(false);
  };

  const formatFieldValue = (field: FieldKey, value: unknown): string => {
    if (value == null) return '-';

    switch (field) {
      case 'views':
      case 'likes':
      case 'rating_count':
      case 'chapters':
        return formatNumber(value as number);
      case 'rating':
        return `${(value as number).toFixed(1)} / 10`;
      case 'genre':
      case 'keywords':
        return (value as string[]).join(', ');
      case 'completed':
        return (value as boolean) ? 'Yes' : 'No';
      case 'synopsis_kr': {
        const text = value as string;
        return text.length > 100 ? `${text.slice(0, 100)}...` : text;
      }
      default:
        return String(value);
    }
  };

  // Get source info
  const sourceDomain = results?.sources[0]?.domain || 'Unknown';
  const sourceCategory = results?.sources[0]?.category;
  const platform = results?.sources[0] ? detectPlatformFromDomain(results.sources[0].domain) : 'unknown';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon icon="solar:document-add-bold-duotone" className="h-5 w-5 text-[#4C9C9B]" />
            Intelligence Results
            {results && (
              <span className="ml-2 px-2 py-0.5 text-xs font-medium rounded-full bg-[#4C9C9B]/10 text-[#4C9C9B]">
                {getPlatformDisplayName(platform)}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        {!results ? (
          <div className="flex flex-col items-center justify-center py-8 text-gray-500">
            <Icon icon="solar:danger-circle-bold-duotone" className="h-8 w-8 mb-2" />
            <p>No results available</p>
          </div>
        ) : availableFields.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-gray-500">
            <Icon icon="solar:danger-circle-bold-duotone" className="h-8 w-8 mb-2" />
            <p>No data could be extracted from this source</p>
            <p className="text-sm mt-1">The scraper may not have found any data</p>
          </div>
        ) : (
          <>
            {/* Source info */}
            <div className="text-sm text-gray-500 mb-4">
              Source: <span className="font-medium text-gray-700">{sourceDomain}</span>
              {sourceCategory && (
                <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">
                  {sourceCategory.replace(/_/g, ' ')}
                </span>
              )}
            </div>

            {/* Field selection */}
            <div className="space-y-3 border rounded-lg p-4 bg-gray-50">
              {availableFields.map((field) => {
                const value = extractedData[field];
                const isSelected = selectedFields.has(field);

                return (
                  <div
                    key={field}
                    className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                      isSelected ? 'bg-white border-[#4C9C9B]/30' : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <Checkbox
                      id={field}
                      checked={isSelected}
                      onCheckedChange={() => toggleField(field)}
                      className="mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <Label
                        htmlFor={field}
                        className="font-medium text-gray-900 cursor-pointer"
                      >
                        {getFieldLabel(field)}
                      </Label>
                      <div className="text-sm text-gray-600 mt-1">
                        {field === 'title_image' && value ? (
                          <div className="flex items-center gap-2">
                            <Icon icon="solar:gallery-bold-duotone" className="h-4 w-4 text-gray-400" />
                            <a
                              href={value as string}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline truncate"
                            >
                              {(value as string).slice(0, 50)}...
                            </a>
                          </div>
                        ) : (
                          <span className="break-words">{formatFieldValue(field, value)}</span>
                        )}
                      </div>
                    </div>
                    {isSelected && (
                      <Icon icon="solar:check-circle-bold-duotone" className="h-4 w-4 text-[#4C9C9B] flex-shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Select/Deselect buttons */}
            <div className="flex gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={selectAll}
                className="border-gray-300 hover:bg-gray-100"
              >
                Select All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={deselectAll}
                className="border-gray-300 hover:bg-gray-100"
              >
                Deselect All
              </Button>
              <span className="ml-auto text-sm text-gray-500 self-center">
                {selectedFields.size} of {availableFields.length} fields selected
              </span>
            </div>
          </>
        )}

        <DialogFooter className="mt-6 gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isIngesting}
            className="border-gray-300 hover:bg-gray-100"
          >
            Cancel
          </Button>
          <Button
            onClick={handleIngest}
            disabled={selectedFields.size === 0 || isIngesting}
            className="bg-[#4C9C9B] text-white hover:bg-[#3a7a7a]"
          >
            {isIngesting ? (
              <>
                <Icon icon="solar:refresh-circle-bold-duotone" className="h-4 w-4 mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <Icon icon="solar:document-add-bold-duotone" className="h-4 w-4 mr-2" />
                Update {selectedFields.size} Field{selectedFields.size !== 1 ? 's' : ''}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default IntelligenceResultsModal;
