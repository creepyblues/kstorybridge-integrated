import React from 'react';
import { X, Download, CheckCircle2, XCircle, Calendar, DollarSign } from 'lucide-react';
import type { MarketingAsset } from '@/types/asset-generation';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface AssetPreviewModalProps {
  asset: MarketingAsset;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * AssetPreviewModal Component
 * Full-screen preview of generated marketing assets
 */
export function AssetPreviewModal({ asset, isOpen, onClose }: AssetPreviewModalProps) {
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const handleDownload = async () => {
    if (!asset.image_url) return;

    try {
      const response = await fetch(asset.image_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${asset.title_name}-${asset.asset_type}-${asset.id.substring(0, 8)}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const getCategoryColor = () => {
    switch (asset.asset_category) {
      case 'social_media':
        return 'bg-blue-100 text-blue-800';
      case 'ad_creative':
        return 'bg-purple-100 text-purple-800';
      case 'pitch_material':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-300 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-black mb-1">
              {asset.asset_type.replace(/_/g, ' ').toUpperCase()}
            </h2>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={`${getCategoryColor()} hover:${getCategoryColor()}`}>
                {asset.asset_category.replace(/_/g, ' ')}
              </Badge>
              <span className="text-sm text-gray-500">{asset.asset_format}</span>
              {asset.approved && (
                <Badge className="bg-green-500 text-white hover:bg-green-500">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Approved
                </Badge>
              )}
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="border-gray-300 hover:bg-gray-100"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Image Preview */}
          {asset.image_url && (
            <div className="bg-gray-100 rounded-lg p-4 flex items-center justify-center">
              <img
                src={asset.image_url}
                alt={asset.description}
                className="max-w-full max-h-[500px] rounded-lg shadow-lg"
              />
            </div>
          )}

          {/* Asset Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Description */}
            <div className="col-span-2">
              <h3 className="text-sm font-semibold text-black mb-2">Description</h3>
              <p className="text-sm text-gray-600">{asset.description}</p>
            </div>

            {/* Prompt Used */}
            <div className="col-span-2">
              <h3 className="text-sm font-semibold text-black mb-2">
                {asset.prompt_used ? 'Prompt Used' : 'Prompt Template'}
              </h3>
              <p className="text-xs text-gray-600 font-mono bg-gray-50 p-3 rounded border border-gray-200">
                {asset.prompt_used || asset.prompt_template}
              </p>
            </div>

            {/* Metadata */}
            {asset.status === 'completed' && (
              <>
                <div>
                  <h3 className="text-sm font-semibold text-black mb-2">Generation Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <DollarSign className="w-4 h-4" />
                      <span>Cost: ${asset.generation_cost.toFixed(4)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <span className="font-medium">Model:</span>
                      <span>{asset.generation_model}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <span className="font-medium">Attempts:</span>
                      <span>{asset.generation_attempts}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-black mb-2">Timestamps</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span className="font-medium">Created:</span>
                      <span>{new Date(asset.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span className="font-medium">Updated:</span>
                      <span>{new Date(asset.updated_at).toLocaleDateString()}</span>
                    </div>
                    {asset.approved_at && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <span className="font-medium">Approved:</span>
                        <span>{new Date(asset.approved_at).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Approval Info */}
            {asset.approved && asset.approved_by_email && (
              <div className="col-span-2 bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-green-800">
                  <CheckCircle2 className="w-5 h-5" />
                  <div>
                    <p className="font-medium">Approved by</p>
                    <p className="text-sm">{asset.approved_by_email}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {asset.error_message && (
              <div className="col-span-2 bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-red-800">
                  <XCircle className="w-5 h-5" />
                  <div>
                    <p className="font-medium">Generation Failed</p>
                    <p className="text-sm">{asset.error_message}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-300 px-6 py-4 flex items-center justify-between rounded-b-2xl">
          <div className="text-sm text-gray-500">
            Asset ID: {asset.id.substring(0, 8)}...
          </div>
          <div className="flex gap-2">
            {asset.image_url && (
              <Button
                onClick={handleDownload}
                variant="outline"
                className="border-gray-300 hover:bg-gray-100"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            )}
            <Button
              onClick={onClose}
              variant="outline"
              className="border-gray-300 hover:bg-gray-100"
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
