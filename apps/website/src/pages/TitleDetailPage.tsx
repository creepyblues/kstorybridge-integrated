import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@kstorybridge/ui';
import { Badge } from '@kstorybridge/ui';
import { Button } from '@kstorybridge/ui';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@kstorybridge/ui';
import { ArrowLeft, Eye, Heart, Star, FileText, Crown, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '../hooks/useAuth';
import PageHeader from '../components/PageHeader';
import SecurePDFViewer from '../components/SecurePDFViewer';

type Title = {
  title_id: string;
  title_name_en: string | null;
  title_name_kr: string;
  title_image: string | null;
  tagline: string | null;
  pitch: string | null;
  description: string | null;
  genre: string | null;
  content_format: string | null;
  story_author: string | null;
  views: number | null;
  likes: number | null;
  rating: number | null;
  rating_count: number | null;
};

export default function TitleDetailPage() {
  const { titleId } = useParams<{ titleId: string }>();
  const { user } = useAuth();
  const [title, setTitle] = useState<Title | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

  useEffect(() => {
    if (titleId) {
      loadTitle(titleId);
    }
  }, [titleId]);

  const loadTitle = async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('titles')
        .select('*')
        .eq('title_id', id)
        .single();

      if (fetchError) throw fetchError;
      setTitle(data);
    } catch (err) {
      console.error('Error loading title:', err);
      setError('Failed to load title details');
    } finally {
      setLoading(false);
    }
  };

  const formatGenre = (genre: string | string[] | null) => {
    if (!genre) return '';
    if (Array.isArray(genre)) {
      return genre.map(g => g.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())).join(', ');
    }
    return genre.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatContentFormat = (format: string | null) => {
    if (!format) return '';
    return format.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-porcelain-blue-50">
        <PageHeader />
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="text-center text-gray-600">Loading title...</div>
        </div>
      </div>
    );
  }

  if (error || !title) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-porcelain-blue-50">
        <PageHeader />
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="text-center text-red-600">{error || 'Title not found'}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-porcelain-blue-50">
      <PageHeader />
      
      <main className="max-w-7xl mx-auto px-6 py-16">
        {/* Back Button */}
        <div className="mb-8">
          <Link to="/">
            <Button variant="ghost" className="text-gray-600 hover:text-gray-800">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>

        {/* Title Header */}
        <Card className="bg-white border-gray-200 shadow-lg rounded-2xl mb-8">
          <CardContent className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Cover Image */}
              <div className="lg:col-span-1">
                {title.title_image ? (
                  <div className="w-full h-96 bg-gray-100 rounded-lg overflow-hidden">
                    <img 
                      src={title.title_image} 
                      alt={title.title_name_en || title.title_name_kr}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-full h-96 bg-gradient-to-br from-blue-100 to-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-gray-500">No Image Available</span>
                  </div>
                )}
              </div>

              {/* Title Info */}
              <div className="lg:col-span-2">
                <h1 className="text-4xl font-bold text-midnight-ink mb-4">
                  {title.title_name_en || title.title_name_kr}
                </h1>
                
                {title.title_name_en && title.title_name_kr && (
                  <p className="text-xl text-gray-600 mb-4">{title.title_name_kr}</p>
                )}

                {title.story_author && (
                  <p className="text-lg text-gray-600 mb-4">
                    <span className="font-medium">Story by</span> {title.story_author}
                  </p>
                )}

                {title.tagline && (
                  <p className="text-lg text-gray-700 italic mb-6">"{title.tagline}"</p>
                )}

                {/* Badges */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {title.genre && (
                    <Badge variant="outline" className="border-hanok-teal text-hanok-teal bg-hanok-teal/5">
                      {formatGenre(title.genre)}
                    </Badge>
                  )}
                  {title.content_format && (
                    <Badge variant="outline" className="border-blue-500 text-blue-500 bg-blue-50">
                      {formatContentFormat(title.content_format)}
                    </Badge>
                  )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <Eye className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                    <p className="text-sm text-gray-600">Views</p>
                    <p className="font-bold text-gray-800">{title.views?.toLocaleString() || '0'}</p>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <Heart className="h-5 w-5 text-red-500 mx-auto mb-1" />
                    <p className="text-sm text-gray-600">Likes</p>
                    <p className="font-bold text-gray-800">{title.likes?.toLocaleString() || '0'}</p>
                  </div>
                  {title.rating && title.rating_count && title.rating_count > 0 && (
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <Star className="h-5 w-5 text-blue-500 mx-auto mb-1" />
                      <p className="text-sm text-gray-600">Rating</p>
                      <p className="font-bold text-gray-800">{title.rating.toFixed(1)}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Synopsis Section */}
        <Card className="bg-white border-gray-200 shadow-lg rounded-2xl mb-8">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-gray-800 text-xl">Synopsis</CardTitle>
            {title.pitch && user && (
              <Dialog open={isPdfModalOpen} onOpenChange={setIsPdfModalOpen}>
                <DialogTrigger id="title-detail-view-pitch-btn" asChild>
                  <Button id="title-detail-view-pitch-btn" className="bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-600 hover:from-purple-700 hover:via-purple-800 hover:to-indigo-700 text-white shadow-xl border-0 rounded-full px-5 py-2.5 text-sm font-bold transition-all duration-300 transform hover:scale-110 hover:shadow-2xl relative overflow-hidden group">
                    {/* Shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-700 pointer-events-none"></div>
                    
                    {/* Icons */}
                    <Crown className="h-4 w-4 mr-2 text-blue-400 animate-pulse pointer-events-none" />
                    <FileText className="h-4 w-4 mr-2 pointer-events-none" />
                    
                    {/* Text */}
                    <span className="relative z-10 pointer-events-none">View Pitch (Premium)</span>
                    
                    {/* Glow effect */}
                    <div className="absolute inset-0 rounded-full bg-purple-400/50 blur-md group-hover:bg-purple-300/60 transition-colors duration-300 pointer-events-none"></div>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-6xl max-h-[90vh] p-0">
                  <DialogHeader className="p-6 pb-0">
                    <DialogTitle className="flex items-center justify-between">
                      <span>Pitch Document - {title.title_name_en || title.title_name_kr}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsPdfModalOpen(false)}
                        className="h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Close</span>
                      </Button>
                    </DialogTitle>
                    <DialogDescription>
                      View the complete pitch document with comprehensive information about this title, including market positioning, target audience, and story details.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="p-6 pt-0">
                    <SecurePDFViewer 
                      pdfUrl={title.pitch} 
                      title={`${title.title_name_en || title.title_name_kr} - Pitch Document`}
                    />
                  </div>
                </DialogContent>
              </Dialog>
            )}
            
            {title.pitch && !user && (
              <Button
                id="title-detail-view-pitch-disabled-btn"
                disabled
                className="bg-gray-400 text-gray-600 shadow-lg border-0 rounded-full px-5 py-2.5 text-sm font-medium cursor-not-allowed relative"
              >
                <Crown className="h-4 w-4 mr-2 text-gray-500" />
                <FileText className="h-4 w-4 mr-2" />
                View Pitch (Premium)
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">!</span>
                </div>
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <div className="text-gray-700 leading-relaxed">
              {title.description ? (
                <p className="text-lg mb-4">{title.description}</p>
              ) : title.tagline ? (
                <p className="text-lg italic mb-4">"{title.tagline}"</p>
              ) : (
                <p className="text-gray-500 italic">No synopsis available for this title.</p>
              )}
              
              {/* Premium Feature Notice */}
              {title.pitch && (
                <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Crown className="h-5 w-5 text-purple-600" />
                    <span className="font-semibold text-purple-800">Premium Content Available</span>
                  </div>
                  <p className="text-sm text-purple-700">
                    This title includes a detailed pitch document with comprehensive information about the story, 
                    target audience, and market positioning. Click "View Pitch (Premium)" to access the full document.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>


        {/* Authentication Required Notice */}
        {!user && title.pitch && (
          <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
            <CardContent className="p-8 text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Crown className="h-6 w-6 text-purple-600" />
                <FileText className="h-6 w-6 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Premium Content Available</h3>
              <p className="text-gray-600 mb-4">Please sign in to view the detailed pitch document for this title.</p>
              <Link to="/signin">
                <Button className="bg-hanok-teal hover:bg-hanok-teal-600 text-white">
                  Sign In to View Pitch
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}