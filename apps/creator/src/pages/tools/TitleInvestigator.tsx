import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { collectIntelligence } from '@/services/intelligenceService';
import { Loader2 } from 'lucide-react';

/**
 * Title Investigator - Main page for intelligence collection
 *
 * Features:
 * - Input title name
 * - Select data sources (Naver, Kakao, Reddit, AO3)
 * - Trigger intelligence collection
 * - Navigate to results page
 */
export function TitleInvestigator() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [titleName, setTitleName] = useState('');
  const [selectedSources, setSelectedSources] = useState<string[]>(['naver', 'kakao']);
  const [isCollecting, setIsCollecting] = useState(false);

  const sources = [
    { id: 'naver', label: 'Naver Webtoon', description: 'Views, rating, subscribers' },
    { id: 'kakao', label: 'Kakao Page', description: 'Views, rating, likes' },
    { id: 'reddit', label: 'Reddit', description: 'Fan posts, upvotes, sentiment' },
    { id: 'ao3', label: 'Archive of Our Own', description: 'Fanfiction works, kudos' },
  ];

  const handleSourceToggle = (sourceId: string) => {
    setSelectedSources(prev =>
      prev.includes(sourceId)
        ? prev.filter(s => s !== sourceId)
        : [...prev, sourceId]
    );
  };

  const handleCollect = async () => {
    if (!titleName.trim()) {
      toast({
        title: 'Title name required',
        description: 'Please enter a title name to search for',
        variant: 'destructive',
      });
      return;
    }

    if (selectedSources.length === 0) {
      toast({
        title: 'No sources selected',
        description: 'Please select at least one data source',
        variant: 'destructive',
      });
      return;
    }

    if (!user?.email) {
      toast({
        title: 'Authentication error',
        description: 'User email not found',
        variant: 'destructive',
      });
      return;
    }

    setIsCollecting(true);

    try {
      const result = await collectIntelligence(
        {
          titleNameInput: titleName,
          sources: selectedSources,
        },
        user.email
      );

      toast({
        title: 'Collection started',
        description: `Collecting data from ${result.sourcesCollected.length} source(s)`,
      });

      // Navigate to detail page
      navigate(`/tools/intelligence/${result.intelligenceId}`);

    } catch (error) {
      console.error('Collection failed:', error);
      toast({
        title: 'Collection failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsCollecting(false);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-black">
            Title Investigator
          </h1>
          <p className="text-gray-600 mt-2">
            Collect popularity signals and metadata from multiple sources
          </p>
        </div>

        <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl mb-6">
          <CardContent className="p-6">
            {/* Title Input */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-black mb-2">
                Title Name
              </label>
              <Input
                type="text"
                placeholder="Enter title name (Korean or English)"
                value={titleName}
                onChange={(e) => setTitleName(e.target.value)}
                className="border-gray-300"
                disabled={isCollecting}
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter the title exactly as it appears on platforms for best results
              </p>
            </div>

            {/* Source Selection */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-black mb-3">
                Data Sources
              </label>
              <div className="space-y-3">
                {sources.map((source) => (
                  <div key={source.id} className="flex items-start gap-3">
                    <Checkbox
                      id={source.id}
                      checked={selectedSources.includes(source.id)}
                      onCheckedChange={() => handleSourceToggle(source.id)}
                      disabled={isCollecting}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <label
                        htmlFor={source.id}
                        className="text-sm font-medium text-black cursor-pointer"
                      >
                        {source.label}
                      </label>
                      <p className="text-xs text-gray-500">{source.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Button */}
            <div className="flex justify-end">
              <Button
                onClick={handleCollect}
                disabled={isCollecting}
                className="bg-black text-white hover:bg-gray-800"
              >
                {isCollecting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Collecting...
                  </>
                ) : (
                  'Collect Intelligence'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl">
          <CardContent className="p-6">
            <h3 className="text-sm font-semibold text-black mb-2">How it works</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 bg-black rounded-full mt-1.5" />
                <span>Enter the title name and select data sources</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 bg-black rounded-full mt-1.5" />
                <span>System collects data from each source (may take 10-30 seconds)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 bg-black rounded-full mt-1.5" />
                <span>Review and verify collected data field by field</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 bg-black rounded-full mt-1.5" />
                <span>Approved fields are ingested into title database</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 bg-black rounded-full mt-1.5" />
                <span>Raw data is kept permanently for reference</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
