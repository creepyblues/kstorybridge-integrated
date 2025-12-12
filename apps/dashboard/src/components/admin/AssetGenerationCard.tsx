import React from 'react';
import { Icon } from '@iconify/react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { useGenerateAsset, useDeleteAsset, useUpdateAssetApproval } from '@/hooks/useAssetGeneration';
import { AssetPreviewModal } from './AssetPreviewModal';
import type { MarketingAsset } from '@/types/asset-generation';

interface AssetGenerationCardProps {
  asset: MarketingAsset;
}

/**
 * AssetGenerationCard Component
 * Displays individual marketing asset with generation controls
 */
export function AssetGenerationCard({ asset }: AssetGenerationCardProps) {
  const { user } = useAuth();
  const generateAsset = useGenerateAsset();
  const deleteAsset = useDeleteAsset();
  const updateApproval = useUpdateAssetApproval();

  const [isPreviewOpen, setIsPreviewOpen] = React.useState(false);
  const [isEditingPrompt, setIsEditingPrompt] = React.useState(false);
  const [customPrompt, setCustomPrompt] = React.useState(asset.prompt_template);

  const adminEmail = user?.email || '';

  const handleGenerate = (useCustomPrompt = false) => {
    if (!adminEmail) return;

    generateAsset.mutate({
      asset_id: asset.id,
      admin_email: adminEmail,
      use_hd: false, // Default to standard quality
      custom_prompt: useCustomPrompt ? customPrompt : undefined,
    });

    if (useCustomPrompt) {
      setIsEditingPrompt(false);
    }
  };

  const handleRetry = () => {
    setIsEditingPrompt(true);
  };

  const handleDelete = () => {
    if (!confirm('Are you sure you want to delete this asset?')) return;
    deleteAsset.mutate(asset.id);
  };

  const handleToggleApproval = () => {
    if (!adminEmail) return;

    updateApproval.mutate({
      assetId: asset.id,
      approved: !asset.approved,
      adminEmail: adminEmail,
    });
  };

  const getStatusBadge = () => {
    switch (asset.status) {
      case 'completed':
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            <Icon icon="solar:check-circle-bold-duotone" className="w-3 h-3 mr-1" />
            Completed
          </Badge>
        );
      case 'generating':
        return (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
            <Icon icon="solar:refresh-circle-bold-duotone" className="w-3 h-3 mr-1 animate-spin" />
            Generating
          </Badge>
        );
      case 'failed':
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
            <Icon icon="solar:close-circle-bold-duotone" className="w-3 h-3 mr-1" />
            Failed
          </Badge>
        );
      case 'pending':
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">
            <Icon icon="solar:clock-circle-bold-duotone" className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
    }
  };

  const getCategoryColor = () => {
    switch (asset.asset_category) {
      case 'social_media':
        return 'text-blue-600';
      case 'ad_creative':
        return 'text-purple-600';
      case 'pitch_material':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  const isGenerating = generateAsset.isPending || asset.status === 'generating';
  const isDeleting = deleteAsset.isPending;
  const isUpdatingApproval = updateApproval.isPending;

  return (
    <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold text-black flex items-center gap-2">
              <span className={getCategoryColor()}>
                {asset.asset_type.replace(/_/g, ' ').toUpperCase()}
              </span>
              {asset.approved && (
                <Badge className="bg-green-500 text-white hover:bg-green-500">
                  Approved
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="text-sm text-gray-500 mt-1">
              {asset.asset_format} · {asset.asset_category.replace(/_/g, ' ')}
            </CardDescription>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Description */}
        <div>
          <h4 className="text-sm font-medium text-black mb-1">Description</h4>
          <p className="text-sm text-gray-600">{asset.description}</p>
        </div>

        {/* Prompt Template / Editing */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <h4 className="text-sm font-medium text-black">
              {isEditingPrompt ? 'Edit Prompt' : 'Prompt Template'}
            </h4>
            {!isEditingPrompt && asset.status !== 'completed' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditingPrompt(true)}
                className="h-auto py-0 text-xs text-gray-500 hover:text-black"
              >
                <Icon icon="solar:pen-bold-duotone" className="w-3 h-3 mr-1" />
                Edit
              </Button>
            )}
          </div>
          {isEditingPrompt ? (
            <>
              <Textarea
                value={customPrompt}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCustomPrompt(e.target.value)}
                className="text-xs font-mono border-gray-300"
                rows={6}
              />
              <div className="flex gap-2 mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleGenerate(true)}
                  disabled={isGenerating || !adminEmail}
                  className="border-gray-300 hover:bg-gray-100"
                >
                  {isGenerating ? (
                    <>
                      <Icon icon="solar:refresh-circle-bold-duotone" className="w-3 h-3 mr-1 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Icon icon="solar:magic-stick-bold-duotone" className="w-3 h-3 mr-1" />
                      Generate with Custom Prompt
                    </>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsEditingPrompt(false);
                    setCustomPrompt(asset.prompt_template);
                  }}
                  className="text-gray-500 hover:text-black"
                >
                  Cancel
                </Button>
              </div>
            </>
          ) : (
            <p className="text-xs text-gray-500 font-mono bg-gray-50 p-2 rounded border border-gray-200">
              {asset.prompt_template}
            </p>
          )}
        </div>

        {/* Image Preview */}
        {asset.image_url && (
          <div>
            <h4 className="text-sm font-medium text-black mb-2">Generated Image</h4>
            <button
              onClick={() => setIsPreviewOpen(true)}
              className="w-full group relative cursor-pointer"
            >
              <img
                src={asset.image_url}
                alt={asset.description}
                className="w-full rounded-lg border border-gray-300 transition-opacity group-hover:opacity-80"
              />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-20 rounded-lg">
                <div className="bg-white rounded-full p-3 shadow-lg">
                  <Icon icon="solar:eye-bold-duotone" className="w-5 h-5 text-gray-900" />
                </div>
              </div>
            </button>
          </div>
        )}

        {/* Error Message */}
        {asset.error_message && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-600">{asset.error_message}</p>
          </div>
        )}

        {/* Generation Metadata */}
        {asset.status === 'completed' && (
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span>Cost: ${asset.generation_cost.toFixed(4)}</span>
            <span>Model: {asset.generation_model}</span>
            <span>Attempts: {asset.generation_attempts}</span>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex flex-wrap gap-2">
        {/* Generate Button */}
        {asset.status !== 'completed' && !isEditingPrompt && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleGenerate(false)}
            disabled={isGenerating || !adminEmail}
            className="border-gray-300 hover:bg-gray-100"
          >
            {isGenerating ? (
              <>
                <Icon icon="solar:refresh-circle-bold-duotone" className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Icon icon="solar:magic-stick-bold-duotone" className="w-4 h-4 mr-2" />
                Generate Image
              </>
            )}
          </Button>
        )}

        {/* View Button */}
        {asset.status === 'completed' && asset.image_url && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPreviewOpen(true)}
            className="border-gray-300 hover:bg-gray-100"
          >
            <Icon icon="solar:eye-bold-duotone" className="w-4 h-4 mr-2" />
            View
          </Button>
        )}

        {/* Retry Button */}
        {asset.status === 'completed' && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleRetry}
            disabled={isGenerating || !adminEmail}
            className="border-gray-300 hover:bg-gray-100"
          >
            <Icon icon="solar:restart-bold-duotone" className="w-4 h-4 mr-2" />
            Retry
          </Button>
        )}

        {/* Approval Toggle */}
        {asset.status === 'completed' && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleApproval}
            disabled={isUpdatingApproval || !adminEmail}
            className="border-gray-300 hover:bg-gray-100"
          >
            {isUpdatingApproval ? (
              <Icon icon="solar:refresh-circle-bold-duotone" className="w-4 h-4 mr-2 animate-spin" />
            ) : asset.approved ? (
              <Icon icon="solar:close-circle-bold-duotone" className="w-4 h-4 mr-2" />
            ) : (
              <Icon icon="solar:check-circle-bold-duotone" className="w-4 h-4 mr-2" />
            )}
            {asset.approved ? 'Remove Approval' : 'Approve'}
          </Button>
        )}

        {/* Delete Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleDelete}
          disabled={isDeleting}
          className="border-red-300 hover:bg-red-50 text-red-600 ml-auto"
        >
          {isDeleting ? (
            <>
              <Icon icon="solar:refresh-circle-bold-duotone" className="w-4 h-4 mr-2 animate-spin" />
              Deleting...
            </>
          ) : (
            <>
              <Icon icon="solar:trash-bin-trash-bold-duotone" className="w-4 h-4 mr-2" />
              Delete
            </>
          )}
        </Button>
      </CardFooter>

      {/* Preview Modal */}
      <AssetPreviewModal
        asset={asset}
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
      />
    </Card>
  );
}
