import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { titlesService, Title } from '@/services/titlesService';
import { TierGatedContent } from '@/components/tier/TierGatedContent';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Heart, ExternalLink, Loader2, FileText } from 'lucide-react';

export default function TitleDetail() {
  const { titleId } = useParams<{ titleId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [title, setTitle] = useState<Title | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  useEffect(() => {
    const fetchTitle = async () => {
      if (!titleId) return;

      setLoading(true);
      try {
        const data = await titlesService.getTitleById(titleId);
        setTitle(data);

        // Check if favorited
        if (data && user?.id) {
          const favorited = await titlesService.isFavorited(titleId, user.id);
          setIsFavorited(favorited);
        }
      } catch (error: any) {
        console.error('Error fetching title:', error);
        toast({
          title: 'Error',
          description: error.message || 'Failed to fetch title details',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTitle();
  }, [titleId, user?.id, toast]);

  const handleFavoriteToggle = async () => {
    if (!title || !user?.id) return;

    setFavoriteLoading(true);
    try {
      if (isFavorited) {
        await titlesService.removeFavorite(title.title_id, user.id);
        setIsFavorited(false);
        toast({
          title: 'Removed from favorites',
          description: 'Title removed from your saved list',
        });
      } else {
        await titlesService.addFavorite(title.title_id, user.id);
        setIsFavorited(true);
        toast({
          title: 'Added to favorites',
          description: 'Title saved to your list',
        });
      }
    } catch (error: any) {
      console.error('Error toggling favorite:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update favorites',
        variant: 'destructive',
      });
    } finally {
      setFavoriteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!title) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <p className="text-gray-500 text-lg mb-4">Title not found</p>
        <Button variant="outline" onClick={() => navigate('/buyers/titles')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Titles
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b border-gray-300 bg-white px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/buyers/titles')}
            className="border-gray-300"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleFavoriteToggle}
            disabled={favoriteLoading}
            className={`border-gray-300 ${
              isFavorited ? 'bg-red-50 text-red-600 hover:bg-red-100' : ''
            }`}
          >
            <Heart
              className={`h-4 w-4 mr-1 ${isFavorited ? 'fill-current' : ''}`}
            />
            {isFavorited ? 'Saved' : 'Save'}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Image */}
          <div className="lg:col-span-1">
            {title.title_image && (
              <div className="w-full rounded-2xl overflow-hidden bg-gray-100 sticky top-6">
                <img
                  src={title.title_image}
                  alt={title.title_name_en || title.title_name_kr || 'Title'}
                  className="w-full h-auto object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>

          {/* Right Column - Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title Header */}
            <div>
              <h1 className="text-3xl font-bold text-black mb-2">
                {title.title_name_en || title.title_name_kr}
              </h1>
              {title.title_name_kr && title.title_name_en && (
                <p className="text-xl text-gray-600">{title.title_name_kr}</p>
              )}
              {title.tagline && (
                <p className="text-lg text-gray-500 italic mt-2">{title.tagline}</p>
              )}
            </div>

            {/* Metadata Badges */}
            <div className="flex flex-wrap gap-2">
              {title.genre && (
                <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                  {title.genre}
                </span>
              )}
              {title.content_format && (
                <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                  {title.content_format}
                </span>
              )}
              {title.completed !== undefined && (
                <span
                  className={`px-3 py-1 text-sm rounded-full ${
                    title.completed
                      ? 'bg-green-100 text-green-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  {title.completed ? 'Completed' : 'Ongoing'}
                </span>
              )}
            </div>

            {/* Stats */}
            <Card>
              <CardContent className="p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  {title.views !== undefined && (
                    <div>
                      <div className="text-2xl font-bold text-black">
                        {titlesService.formatNumber(title.views)}
                      </div>
                      <div className="text-sm text-gray-500">Views</div>
                    </div>
                  )}
                  {title.rating !== undefined && (
                    <div>
                      <div className="text-2xl font-bold text-black">
                        {title.rating.toFixed(1)}
                      </div>
                      <div className="text-sm text-gray-500">Rating</div>
                    </div>
                  )}
                  {title.chapters !== undefined && (
                    <div>
                      <div className="text-2xl font-bold text-black">
                        {title.chapters}
                      </div>
                      <div className="text-sm text-gray-500">Chapters</div>
                    </div>
                  )}
                  {title.rating_count !== undefined && (
                    <div>
                      <div className="text-2xl font-bold text-black">
                        {titlesService.formatNumber(title.rating_count)}
                      </div>
                      <div className="text-sm text-gray-500">Ratings</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Synopsis */}
            {title.synopsis && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-lg font-bold text-black mb-3">Synopsis</h2>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {title.synopsis}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Author Info */}
            {title.author && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-lg font-bold text-black mb-3">Credits</h2>
                  <div className="space-y-2 text-gray-700">
                    <p>
                      <span className="font-medium">Author:</span> {title.author}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tags */}
            {title.tags && title.tags.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-lg font-bold text-black mb-3">Tags</h2>
                  <div className="flex flex-wrap gap-2">
                    {title.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-100 text-gray-600 text-sm rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tier-Gated Pitch Deck */}
            {title.pitch && (
              <TierGatedContent requiredTier="pro">
                <Card className="border-pro-purple/30">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <FileText className="h-5 w-5 text-pro-purple" />
                      <h2 className="text-lg font-bold text-black">Pitch Deck</h2>
                      <span className="ml-auto px-2 py-0.5 bg-pro-purple/10 text-pro-purple text-xs font-semibold rounded-full">
                        PRO
                      </span>
                    </div>
                    <div className="prose prose-sm max-w-none">
                      <div
                        className="text-gray-700 leading-relaxed whitespace-pre-wrap"
                        dangerouslySetInnerHTML={{ __html: title.pitch }}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TierGatedContent>
            )}

            {/* External Link */}
            {title.title_url && (
              <Card>
                <CardContent className="p-6">
                  <Button
                    variant="outline"
                    onClick={() => window.open(title.title_url, '_blank')}
                    className="w-full border-gray-300"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Original Source
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
