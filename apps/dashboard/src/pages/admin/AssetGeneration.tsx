import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { Sparkles, AlertCircle, Wand2 } from 'lucide-react';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Alert, AlertDescription, AlertTitle } from '@kstorybridge/ui';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useAssetsByTitle, useAnalyzePitch } from '@/hooks/useAssetGeneration';
import { TitleSelector } from '@/components/admin/TitleSelector';
import { AssetIdeaList } from '@/components/admin/AssetIdeaList';
import { GenerationStats } from '@/components/admin/GenerationStats';
import { supabase } from '@/integrations/supabase/client';
import type { TitleWithPitch } from '@/types/asset-generation';

/**
 * AssetGeneration Page
 * Admin interface for generating marketing assets from pitch decks
 */
export default function AssetGeneration() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [selectedTitle, setSelectedTitle] = React.useState<TitleWithPitch | null>(null);
  const [isLoadingTitle, setIsLoadingTitle] = React.useState(false);

  const { data: assets, isLoading: isLoadingAssets } = useAssetsByTitle(selectedTitle?.title_id || null);
  const analyzePitch = useAnalyzePitch();

  const adminEmail = user?.email || '';
  const titleIdFromUrl = searchParams.get('titleId');

  // Auto-load title if titleId is in URL parameter
  React.useEffect(() => {
    if (titleIdFromUrl && !selectedTitle) {
      setIsLoadingTitle(true);

      // Fetch the title from database
      supabase
        .from('titles')
        .select('title_id, title_name_en, title_name_kr, views, pitch')
        .eq('title_id', titleIdFromUrl)
        .single()
        .then(({ data, error }) => {
          if (error) {
            console.error('Error loading title from URL:', error);
            toast({
              title: 'Error',
              description: 'Could not load the requested title',
              variant: 'destructive',
            });
          } else if (data) {
            setSelectedTitle(data as TitleWithPitch);
          }
          setIsLoadingTitle(false);
        });
    }
  }, [titleIdFromUrl, selectedTitle, toast]);

  const handleAnalyzePitch = () => {
    if (!selectedTitle || !adminEmail) return;

    // Validate pitch deck URL is not empty
    const pitchDeckUrl = selectedTitle.pitch?.trim();
    if (!pitchDeckUrl) {
      toast({
        title: 'Missing Pitch Deck',
        description: 'This title does not have a pitch deck URL. Please upload a pitch deck first.',
        variant: 'destructive',
      });
      return;
    }

    analyzePitch.mutate({
      title_id: selectedTitle.title_id,
      title_name: selectedTitle.title_name_en || selectedTitle.title_name_kr || 'Untitled',
      pitch_deck_url: pitchDeckUrl,
      admin_email: adminEmail,
    });
  };

  const hasAssets = assets && assets.length > 0;
  const canAnalyze = selectedTitle && selectedTitle.pitch && !analyzePitch.isPending;

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-purple-100 p-2 rounded-lg">
            <Sparkles className="w-6 h-6 text-purple-600" />
          </div>
          <h1 className="text-3xl font-bold text-black">Creative Asset Generation</h1>
        </div>
        <p className="text-gray-600">
          Generate marketing assets from pitch decks using AI-powered analysis
        </p>
      </div>

      {/* Title Selection Card */}
      <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl mb-6">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-black">Select Title</CardTitle>
          <CardDescription>
            Choose a title with pitch analysis data to generate marketing assets
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <TitleSelector
            selectedTitleId={selectedTitle?.title_id || null}
            onSelectTitle={setSelectedTitle}
          />

          {selectedTitle && (
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <div className="text-sm text-gray-600">
                  <p className="font-medium text-black mb-1">
                    {selectedTitle.title_name_en || selectedTitle.title_name_kr}
                  </p>
                  {selectedTitle.views && (
                    <p className="text-xs text-gray-500">
                      {selectedTitle.views.toLocaleString()} views
                    </p>
                  )}
                </div>
              </div>

              <Button
                onClick={handleAnalyzePitch}
                disabled={!canAnalyze}
                variant="outline"
                className="border-gray-300 hover:bg-gray-100"
              >
                {analyzePitch.isPending ? (
                  <>
                    <Wand2 className="w-4 h-4 mr-2 animate-pulse" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4 mr-2" />
                    Analyze Pitch & Generate Ideas
                  </>
                )}
              </Button>
            </div>
          )}

          {selectedTitle && !selectedTitle.pitch && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No Pitch Data</AlertTitle>
              <AlertDescription>
                This title does not have pitch deck data. Please upload a pitch deck first.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Generation Stats */}
      {selectedTitle && hasAssets && (
        <div className="mb-6">
          <GenerationStats assets={assets} />
        </div>
      )}

      {/* Asset Ideas List */}
      {selectedTitle && (
        <div>
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-black">Generated Assets</h2>
            <p className="text-sm text-gray-600">
              {hasAssets
                ? `${assets.length} asset idea${assets.length !== 1 ? 's' : ''} for this title`
                : 'No assets generated yet. Click "Analyze Pitch" to get started.'}
            </p>
          </div>

          <AssetIdeaList
            assets={assets || []}
            isLoading={isLoadingAssets}
          />
        </div>
      )}

      {/* Empty State */}
      {!selectedTitle && (
        <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl">
          <CardContent className="p-12">
            <div className="text-center">
              <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-black mb-2">
                Select a Title to Get Started
              </h3>
              <p className="text-sm text-gray-500 max-w-md mx-auto">
                Choose a title from the dropdown above to analyze its pitch deck and generate
                marketing asset ideas using AI.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200 shadow-none rounded-2xl mt-8">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-medium mb-1">How it works</p>
              <ol className="list-decimal list-inside space-y-1 text-blue-800">
                <li>Select a title with pitch deck data</li>
                <li>Click "Analyze Pitch" to generate 10-15 asset ideas (~$0.05-0.08 cost)</li>
                <li>Review the generated ideas grouped by category</li>
                <li>Click "Generate Image" on any asset to create it with DALL-E 3 (~$0.04-0.12 per image)</li>
                <li>Approve assets for use in marketing materials</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
