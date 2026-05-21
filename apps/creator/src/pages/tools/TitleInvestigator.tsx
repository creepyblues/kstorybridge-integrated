import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/hooks/useAuth';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useToast } from '@/hooks/use-toast';
import { collectIntelligenceByUrls, type ParsedUrl, type SupportedPlatform } from '@/services/intelligenceService';
import { Loader2, CheckCircle2, XCircle, AlertCircle, ShieldAlert } from 'lucide-react';

/**
 * Title Investigator - Main page for intelligence collection
 *
 * Features:
 * - Input multiple platform URLs (one per line)
 * - Auto-detect platform from URL domain
 * - Select content type
 * - Trigger intelligence collection for each URL
 * - Navigate to detail page with source comparison
 *
 * Supported URL Patterns (Korean Platforms):
 * - Naver Webtoon: comic.naver.com/webtoon/list?titleId=XXX
 * - Naver Series: series.naver.com/comic/detail.series?productNo=XXX
 * - Kakao Page: page.kakao.com/content/XXX
 *
 * Fan Engagement Sources (Title Name Search):
 * - Reddit: Searches for posts/subreddits mentioning the title
 * - AO3: Searches for fanfiction works for the title
 * - Comick: Searches for fan translations on Comick.live
 *
 * Updated: Supports both URL-based (Korean platforms) and title-name based (fan engagement)
 */

// URL parsing utilities
function parseUrl(url: string): ParsedUrl | null {
  try {
    const trimmedUrl = url.trim();
    if (!trimmedUrl) return null;

    // Add https:// if missing
    const fullUrl = trimmedUrl.startsWith('http') ? trimmedUrl : `https://${trimmedUrl}`;
    const parsed = new URL(fullUrl);

    // Naver Webtoon: comic.naver.com/webtoon/list?titleId=XXX
    if (parsed.hostname === 'comic.naver.com') {
      const titleId = parsed.searchParams.get('titleId');
      if (titleId) {
        return {
          platform: 'naver_webtoon',
          platformId: titleId,
          originalUrl: trimmedUrl,
          valid: true,
        };
      }
    }

    // Naver Series: series.naver.com/(comic|novel)/detail.series?productNo=XXX
    if (parsed.hostname === 'series.naver.com') {
      const productNo = parsed.searchParams.get('productNo');
      if (productNo) {
        const subKindMatch = parsed.pathname.match(/^\/(comic|novel)\//);
        return {
          platform: 'naver_series',
          platformId: productNo,
          originalUrl: trimmedUrl,
          valid: true,
          ...(subKindMatch ? { subKind: subKindMatch[1] as 'comic' | 'novel' } : {}),
        };
      }
    }

    // Kakao Page: page.kakao.com/content/XXX or page.kakao.com/home?seriesId=XXX
    if (parsed.hostname === 'page.kakao.com') {
      // Try path pattern first: /content/63062046
      const pathMatch = parsed.pathname.match(/\/content\/(\d+)/);
      if (pathMatch) {
        return {
          platform: 'kakao',
          platformId: pathMatch[1],
          originalUrl: trimmedUrl,
          valid: true,
        };
      }
      // Try query param: /home?seriesId=55929080
      const seriesIdParam = parsed.searchParams.get('seriesId');
      if (seriesIdParam) {
        return {
          platform: 'kakao',
          platformId: seriesIdParam,
          originalUrl: trimmedUrl,
          valid: true,
        };
      }
    }

    // Kakao Webtoon: webtoon.kakao.com/content/{slug}/{id}
    if (parsed.hostname === 'webtoon.kakao.com') {
      // URL format: /content/연습생/4463 or /content/%EC%97%B0%EC%8A%B5%EC%83%9D/4463
      const pathMatch = parsed.pathname.match(/\/content\/[^/]+\/(\d+)/);
      if (pathMatch) {
        return {
          platform: 'kakao_webtoon',
          platformId: pathMatch[1],
          originalUrl: trimmedUrl,
          valid: true,
        };
      }
    }

    // Manta: manta.net/en/series/{slug}?seriesId={id}
    if (parsed.hostname === 'manta.net') {
      // Try query param first
      const seriesIdParam = parsed.searchParams.get('seriesId');
      if (seriesIdParam) {
        return {
          platform: 'manta',
          platformId: seriesIdParam,
          originalUrl: trimmedUrl,
          valid: true,
        };
      }
      // Fallback: numeric slug /en/series/1173
      const pathMatch = parsed.pathname.match(/\/series\/(\d+)/);
      if (pathMatch) {
        return {
          platform: 'manta',
          platformId: pathMatch[1],
          originalUrl: trimmedUrl,
          valid: true,
        };
      }
    }

    // Ridibooks: ridibooks.com/books/{bookId}
    if (parsed.hostname === 'ridibooks.com') {
      const pathMatch = parsed.pathname.match(/\/books\/(\d+)/);
      if (pathMatch) {
        return {
          platform: 'ridibooks',
          platformId: pathMatch[1],
          originalUrl: trimmedUrl,
          valid: true,
        };
      }
    }

    // Bomtoon: bomtoon.com/detail/{slug} (current) or
    //          bomtoon.com/comic/ep_list/{slug} (legacy, still resolves)
    if (parsed.hostname === 'www.bomtoon.com' || parsed.hostname === 'bomtoon.com') {
      const pathMatch = parsed.pathname.match(/^\/(?:detail|comic\/ep_list)\/([^/?]+)/);
      if (pathMatch) {
        return {
          platform: 'bomtoon',
          platformId: pathMatch[1],
          originalUrl: trimmedUrl,
          valid: true,
        };
      }
    }

    // Unknown URL format
    return {
      platform: 'unknown',
      platformId: null,
      originalUrl: trimmedUrl,
      valid: false,
      error: 'Unsupported URL format',
    };
  } catch {
    return {
      platform: 'unknown',
      platformId: null,
      originalUrl: url.trim(),
      valid: false,
      error: 'Invalid URL',
    };
  }
}

function getPlatformLabel(platform: string): string {
  switch (platform) {
    case 'naver_webtoon':
      return 'Naver Webtoon';
    case 'naver_series':
      return 'Naver Series';
    case 'kakao':
      return 'Kakao Page';
    case 'kakao_webtoon':
      return 'Kakao Webtoon';
    case 'manta':
      return 'Manta';
    default:
      return 'Unknown';
  }
}

function getPlatformColor(platform: string): string {
  switch (platform) {
    case 'naver_webtoon':
    case 'naver_series':
      return 'text-green-600';
    case 'kakao':
    case 'kakao_webtoon':
      return 'text-amber-600';
    case 'manta':
      return 'text-purple-600';
    default:
      return 'text-gray-500';
  }
}

export function TitleInvestigator() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin, isLoading: isAdminLoading } = useAdminAuth();
  const { toast } = useToast();

  const [urlInput, setUrlInput] = useState('');
  const [contentType, setContentType] = useState<string>('webtoon');
  const [isCollecting, setIsCollecting] = useState(false);

  // Fan engagement sources (title name search)
  const [titleNameSearch, setTitleNameSearch] = useState('');
  const [enableReddit, setEnableReddit] = useState(false);
  const [enableAO3, setEnableAO3] = useState(false);
  const [enableComick, setEnableComick] = useState(false);

  // Redirect non-admins
  useEffect(() => {
    if (!isAdminLoading && !isAdmin) {
      toast({
        title: 'Access Denied',
        description: 'Admin access is required to use the Title Investigator tool.',
        variant: 'destructive',
      });
      navigate('/home');
    }
  }, [isAdmin, isAdminLoading, navigate, toast]);

  const contentTypes = [
    { value: 'webtoon', label: 'Webtoon' },
    { value: 'webnovel', label: 'Web Novel' },
    { value: 'light_novel', label: 'Light Novel' },
    { value: 'manga', label: 'Manga' },
    { value: 'mixed', label: 'Mixed / Other' },
  ];

  // Determine if any fan engagement source is selected
  const hasFanEngagementSources = enableReddit || enableAO3 || enableComick;
  const fanEngagementSources = [
    ...(enableReddit ? ['reddit'] : []),
    ...(enableAO3 ? ['ao3'] : []),
    ...(enableComick ? ['comick'] : []),
  ];

  // Parse URLs as user types
  const parsedUrls = useMemo(() => {
    const lines = urlInput.split('\n').filter(line => line.trim());
    return lines.map(line => parseUrl(line));
  }, [urlInput]);

  const validUrls = parsedUrls.filter((p): p is ParsedUrl => p !== null && p.valid);
  const invalidUrls = parsedUrls.filter((p): p is ParsedUrl => p !== null && !p.valid);

  const handleCollect = async () => {
    // Validate: need either URLs or fan engagement sources with title name
    const hasUrls = validUrls.length > 0;
    const hasFanSources = hasFanEngagementSources && titleNameSearch.trim();

    if (!hasUrls && !hasFanSources) {
      toast({
        title: 'No sources to collect',
        description: 'Enter platform URLs or enable fan engagement sources with a title name',
        variant: 'destructive',
      });
      return;
    }

    if (hasFanEngagementSources && !titleNameSearch.trim()) {
      toast({
        title: 'Title name required',
        description: 'Please enter a title name for Reddit/AO3 search',
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
      // Build request with both URL-based and fan engagement sources
      // The edge function handles both in a single intelligence title
      const result = await collectIntelligenceByUrls(
        {
          urls: validUrls,
          contentType: contentType,
          // Include fan engagement sources if enabled with title name
          fanEngagement: hasFanSources
            ? {
                titleName: titleNameSearch.trim(),
                sources: fanEngagementSources,
              }
            : undefined,
        },
        user.email
      );

      // Check for partial success (some sources collected, but also some errors)
      const errorCount = Object.keys(result.errors || {}).length;
      const successCount = result.sourcesCollected?.length || 0;

      if (errorCount > 0 && successCount > 0) {
        // Partial success
        const errorSources = Object.keys(result.errors).join(', ');
        toast({
          title: 'Partial Success',
          description: `Collected from ${successCount} source(s). Failed: ${errorSources}`,
          variant: 'default',
        });
      } else if (errorCount > 0 && successCount === 0) {
        // All failed
        const errorMessages = Object.entries(result.errors)
          .map(([source, msg]) => `${source}: ${msg}`)
          .join('; ');
        toast({
          title: 'Collection failed',
          description: errorMessages || 'All sources failed to collect',
          variant: 'destructive',
        });
      } else {
        // Full success
        toast({
          title: 'Collection complete',
          description: `Successfully collected data from ${successCount} source(s)`,
        });
      }

      // Navigate to detail page if we have any data
      if (result.intelligenceTitleId) {
        navigate(`/tools/intelligence/${result.intelligenceTitleId}`);
      }

    } catch (error) {
      console.error('Collection failed:', error);
      toast({
        title: 'Collection failed',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsCollecting(false);
    }
  };

  // Calculate total sources count
  const totalSourcesCount = validUrls.length + (hasFanEngagementSources && titleNameSearch.trim() ? fanEngagementSources.length : 0);

  // Show loading while checking admin status
  if (isAdminLoading) {
    return (
      <MainLayout>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            <span className="ml-3 text-gray-500">Verifying admin access...</span>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Show access denied if not admin (before redirect happens)
  if (!isAdmin) {
    return (
      <MainLayout>
        <div className="max-w-7xl mx-auto">
          <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl">
            <CardContent className="p-12 text-center">
              <ShieldAlert className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-black mb-2">Access Denied</h2>
              <p className="text-gray-600 mb-4">
                Admin access is required to use the Title Investigator tool.
              </p>
              <Button
                variant="outline"
                onClick={() => navigate('/home')}
                className="border-gray-300 hover:bg-gray-100"
              >
                Return to Home
              </Button>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-black">
            Title Investigator
          </h1>
          <p className="text-gray-600 mt-2">
            Collect popularity signals and metadata from platform URLs
          </p>
        </div>

        <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl mb-6">
          <CardContent className="p-6">
            {/* URL Input */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-black mb-2">
                Platform URLs <span className="text-red-500">*</span>
              </label>
              <Textarea
                placeholder={`Enter one URL per line, e.g.:\nhttps://comic.naver.com/webtoon/list?titleId=842977\nhttps://page.kakao.com/content/54589870\nhttps://series.naver.com/comic/detail.series?productNo=6387504`}
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="border-gray-300 min-h-[120px] font-mono text-sm"
                disabled={isCollecting}
              />
              <p className="text-xs text-gray-500 mt-1">
                Paste URLs from Naver Webtoon, Naver Series, or Kakao Page (one per line)
              </p>
            </div>

            {/* URL Validation Feedback */}
            {parsedUrls.length > 0 && (
              <div className="mb-6 space-y-2">
                <label className="block text-sm font-semibold text-black mb-2">
                  Detected Sources
                </label>
                <div className="space-y-1.5">
                  {parsedUrls.map((parsed, index) => {
                    if (!parsed) return null;
                    return (
                      <div
                        key={index}
                        className={`flex items-center gap-2 text-sm p-2 rounded-lg ${
                          parsed.valid ? 'bg-green-50' : 'bg-red-50'
                        }`}
                      >
                        {parsed.valid ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                        )}
                        <span className={`font-medium ${getPlatformColor(parsed.platform)}`}>
                          {getPlatformLabel(parsed.platform)}
                        </span>
                        {parsed.valid && parsed.platformId && (
                          <span className="text-gray-500">
                            ID: {parsed.platformId}
                          </span>
                        )}
                        {!parsed.valid && parsed.error && (
                          <span className="text-red-600">{parsed.error}</span>
                        )}
                        <span className="text-gray-400 text-xs truncate ml-auto max-w-[200px]">
                          {parsed.originalUrl}
                        </span>
                      </div>
                    );
                  })}
                </div>
                {validUrls.length > 0 && (
                  <p className="text-xs text-green-600 mt-2">
                    {validUrls.length} valid URL{validUrls.length > 1 ? 's' : ''} ready for collection
                  </p>
                )}
                {invalidUrls.length > 0 && (
                  <p className="text-xs text-red-600">
                    {invalidUrls.length} invalid URL{invalidUrls.length > 1 ? 's' : ''} will be skipped
                  </p>
                )}
              </div>
            )}

            {/* Fan Engagement Sources Section */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <label className="block text-sm font-semibold text-black mb-3">
                Fan Engagement Sources (Optional)
              </label>
              <p className="text-xs text-gray-500 mb-3">
                Search Reddit, AO3, and Comick for fan discussions, fanfiction, and translations
              </p>

              {/* Title Name Input for Fan Sources */}
              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Title Name (for fan engagement search)
                </label>
                <Input
                  placeholder="e.g., Solo Leveling, Tower of God"
                  value={titleNameSearch}
                  onChange={(e) => setTitleNameSearch(e.target.value)}
                  className="border-gray-300"
                  disabled={isCollecting}
                />
              </div>

              {/* Source Checkboxes */}
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={enableReddit}
                    onCheckedChange={(checked) => setEnableReddit(checked === true)}
                    disabled={isCollecting}
                  />
                  <span className="text-sm font-medium text-orange-600">Reddit</span>
                  <span className="text-xs text-gray-500">(Posts & discussions)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={enableAO3}
                    onCheckedChange={(checked) => setEnableAO3(checked === true)}
                    disabled={isCollecting}
                  />
                  <span className="text-sm font-medium text-red-600">AO3</span>
                  <span className="text-xs text-gray-500">(Fanfiction works)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={enableComick}
                    onCheckedChange={(checked) => setEnableComick(checked === true)}
                    disabled={isCollecting}
                  />
                  <span className="text-sm font-medium text-blue-600">Comick</span>
                  <span className="text-xs text-gray-500">(Fan translations)</span>
                </label>
              </div>

              {/* Warning if sources selected but no title */}
              {hasFanEngagementSources && !titleNameSearch.trim() && (
                <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Enter a title name above to search fan engagement sources
                </p>
              )}
            </div>

            {/* Content Type Selection */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-black mb-2">
                Content Type
              </label>
              <Select value={contentType} onValueChange={setContentType} disabled={isCollecting}>
                <SelectTrigger className="border-gray-300">
                  <SelectValue placeholder="Select content type" />
                </SelectTrigger>
                <SelectContent>
                  {contentTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Action Button */}
            <div className="flex justify-end">
              <Button
                onClick={handleCollect}
                disabled={isCollecting || totalSourcesCount === 0}
                className="bg-black text-white hover:bg-gray-800"
              >
                {isCollecting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Collecting...
                  </>
                ) : (
                  `Collect Intelligence${totalSourcesCount > 0 ? ` (${totalSourcesCount})` : ''}`
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Supported Platforms Card */}
        <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl mb-6">
          <CardContent className="p-6">
            <h3 className="text-sm font-semibold text-black mb-3">Supported Platforms</h3>

            {/* Korean Platforms (URL-based) */}
            <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Korean Platforms (paste URL)</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-4">
              <div className="p-3 rounded-lg bg-gray-50">
                <p className="font-medium text-green-600 text-sm">Naver Webtoon</p>
                <p className="text-xs text-gray-500 mt-1">comic.naver.com/webtoon/list?titleId=XXX</p>
              </div>
              <div className="p-3 rounded-lg bg-gray-50">
                <p className="font-medium text-green-600 text-sm">Naver Series</p>
                <p className="text-xs text-gray-500 mt-1">series.naver.com/comic/detail.series?productNo=XXX</p>
              </div>
              <div className="p-3 rounded-lg bg-gray-50">
                <p className="font-medium text-amber-600 text-sm">Kakao Page</p>
                <p className="text-xs text-gray-500 mt-1">page.kakao.com/content/XXX</p>
              </div>
              <div className="p-3 rounded-lg bg-gray-50">
                <p className="font-medium text-amber-600 text-sm">Kakao Webtoon</p>
                <p className="text-xs text-gray-500 mt-1">webtoon.kakao.com/content/slug/XXX</p>
              </div>
            </div>

            {/* English Platforms (URL-based) */}
            <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">English Platforms (paste URL)</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-4">
              <div className="p-3 rounded-lg bg-gray-50">
                <p className="font-medium text-purple-600 text-sm">Manta</p>
                <p className="text-xs text-gray-500 mt-1">manta.net/en/series/title?seriesId=XXX</p>
              </div>
            </div>

            {/* Fan Engagement (Title name search) */}
            <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Fan Engagement (search by title)</p>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="p-3 rounded-lg bg-gray-50">
                <p className="font-medium text-orange-600 text-sm">Reddit</p>
                <p className="text-xs text-gray-500 mt-1">Posts, discussions, subreddits mentioning the title</p>
              </div>
              <div className="p-3 rounded-lg bg-gray-50">
                <p className="font-medium text-red-600 text-sm">Archive of Our Own (AO3)</p>
                <p className="text-xs text-gray-500 mt-1">Fanfiction works, kudos, bookmarks, popular tags</p>
              </div>
              <div className="p-3 rounded-lg bg-gray-50">
                <p className="font-medium text-blue-600 text-sm">Comick.live</p>
                <p className="text-xs text-gray-500 mt-1">Fan translations, rankings, follower counts</p>
              </div>
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
                <span>Paste platform URLs (one per line) - platform is auto-detected</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 bg-black rounded-full mt-1.5" />
                <span>System extracts title ID and collects data (may take 10-30 seconds per URL)</span>
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
