import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Eye, Heart, Star, ArrowLeft, Crown, FileText, X, Edit } from "lucide-react";
import { titlesService, type Title } from "@/services/titlesService";
import { useToast } from "@/components/ui/use-toast";
import AdminLayout from "@/components/layout/AdminLayout";

export default function AdminTitleDetail() {
  const { titleId } = useParams<{ titleId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [title, setTitle] = useState<Title | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

  useEffect(() => {
    if (titleId) {
      loadTitle(titleId);
    }
  }, [titleId]);

  const loadTitle = async (id: string) => {
    try {
      setLoading(true);
      const data = await titlesService.getTitleById(id);
      setTitle(data);
    } catch (error) {
      console.error("Error loading title:", error);
      toast({ title: "Error loading title", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const formatGenre = (genre: string | string[]) => {
    if (Array.isArray(genre)) {
      return genre.map(g => g.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())).join(', ');
    }
    return genre.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatContentFormat = (format: string) => {
    return format.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatViews = (views: number) => {
    if (!views) return '0';
    const formatted = views.toLocaleString();
    if (views >= 1000 && views % 1000 === 0) {
      return `${formatted} (est)`;
    }
    return formatted;
  };

  const formatLikes = (likes: number) => {
    if (!likes || likes === 0) return 'N/A';
    return likes.toLocaleString();
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="text-center text-gray-600 py-8">Loading title...</div>
      </AdminLayout>
    );
  }

  if (!title) {
    return (
      <AdminLayout>
        <div className="text-center text-gray-600 py-8">Title not found</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6">
        {/* Back Button */}
        <div className="mb-8">
          <Button
            onClick={() => navigate('/titles')}
            variant="ghost"
            className="text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Titles
          </Button>
        </div>

        {/* Title Card */}
        <Card className="bg-white border-gray-200 shadow-lg rounded-2xl mb-12">
          <CardContent className="p-8">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h1 className="text-4xl font-bold text-midnight-ink mb-2">
                  {title.title_name_en || title.title_name_kr}
                </h1>
                {title.title_name_kr && title.title_name_en && (
                  <p className="text-lg text-gray-500 font-medium mb-4">
                    {title.title_name_kr}
                  </p>
                )}
                
                {/* Story and Art Authors */}
                <div className="flex flex-wrap gap-4 text-sm text-gray-500 mt-4">
                  {title.story_author && (
                    <div>
                      <span className="font-semibold text-hanok-teal">Story by</span> <span className="text-gray-600">{title.story_author}</span>
                    </div>
                  )}
                  {title.art_author && (
                    <div>
                      <span className="font-semibold text-hanok-teal">Art by</span> <span className="text-gray-600">{title.art_author}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex flex-col items-end gap-3 ml-6">
                <div className="flex gap-2">
                  <Button
                    onClick={() => navigate(`/titles/${title.title_id}/edit`)}
                    className="bg-hanok-teal hover:bg-hanok-teal/90 text-white"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Title
                  </Button>
                </div>
                <Badge variant="outline" className="border-blue-500 text-blue-500 bg-blue-50">
                  Admin View
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          {/* Left Column - Cover Image and Title Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Cover Image */}
            <Card className="bg-white border-gray-200 shadow-lg rounded-2xl overflow-hidden">
              <CardContent className="p-0">
                {title.title_image ? (
                  <div className="w-full h-96 bg-gray-100 overflow-hidden">
                    <img 
                      src={title.title_image} 
                      alt={title.title_name_en || title.title_name_kr}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.parentElement!.classList.add('flex', 'items-center', 'justify-center');
                        e.currentTarget.parentElement!.innerHTML = '<span class="text-gray-500">No Image Available</span>';
                      }}
                    />
                  </div>
                ) : (
                  <div className="w-full h-96 bg-gradient-to-br from-blue-100 to-green-100 flex items-center justify-center">
                    <div className="flex space-x-4">
                      <div className="w-16 h-20 bg-gray-300 rounded-lg"></div>
                      <div className="w-20 h-24 bg-gray-200 rounded-lg"></div>
                      <div className="w-16 h-20 bg-gray-300 rounded-lg"></div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* View Original Content */}
            {title.title_url && (
              <div className="border border-gray-200 rounded-lg p-3">
                <a 
                  href={title.title_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 text-hanok-teal hover:text-hanok-teal/80 font-medium text-sm transition-colors"
                >
                  <Eye className="h-4 w-4" />
                  View Original Content
                </a>
              </div>
            )}

            {/* Tagline */}
            {title.tagline && (
              <div className="py-3 px-4 bg-hanok-teal/5 rounded-lg border-l-4 border-hanok-teal">
                <p className="text-gray-700 font-medium italic">
                  "{title.tagline}"
                </p>
              </div>
            )}

            {/* Genre and Format Badges */}
            <div className="flex flex-wrap gap-2">
              {title.genre && (Array.isArray(title.genre) ? title.genre.length > 0 : true) && (
                <div className="flex flex-wrap gap-2">
                  {Array.isArray(title.genre) ? (
                    title.genre.map((g, idx) => (
                      <Badge key={idx} variant="outline" className="border-hanok-teal text-hanok-teal bg-hanok-teal/5 px-3 py-1">
                        {formatGenre(g)}
                      </Badge>
                    ))
                  ) : (
                    <Badge variant="outline" className="border-hanok-teal text-hanok-teal bg-hanok-teal/5 px-3 py-1">
                      {formatGenre(title.genre)}
                    </Badge>
                  )}
                </div>
              )}
              {title.content_format && (
                <Badge variant="outline" className="border-blue-500 text-blue-500 bg-blue-50 px-3 py-1">
                  {formatContentFormat(title.content_format)}
                </Badge>
              )}
            </div>

            {/* Statistics Card */}
            <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <h4 className="font-bold text-midnight-ink text-sm uppercase tracking-wide">Statistics</h4>
                  <div className="space-y-3">
                    {/* Views and Likes */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                        <Eye className="h-4 w-4 text-blue-600" />
                        <div>
                          <p className="text-xs font-semibold text-hanok-teal">Views</p>
                          <p className="font-medium text-gray-600 text-sm">{formatViews(title.views || 0)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg">
                        <Heart className="h-4 w-4 text-red-500" />
                        <div>
                          <p className="text-xs font-semibold text-hanok-teal">Likes</p>
                          <p className="font-medium text-gray-600 text-sm">{formatLikes(title.likes || 0)}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Rating */}
                    {title.rating && title.rating_count && title.rating_count > 0 && (
                      <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                        <Star className="h-5 w-5 text-yellow-500" />
                        <div>
                          <p className="text-xs font-semibold text-hanok-teal">Rating</p>
                          <p className="font-medium text-gray-600 text-sm">{title.rating.toFixed(1)} ({title.rating_count} reviews)</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Note Card */}
            {title.note && (
              <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-midnight-ink text-xl flex items-center gap-2">
                    <FileText className="h-5 w-5 text-hanok-teal" />
                    Note
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-4 bg-gradient-to-r from-hanok-teal/5 to-porcelain-blue-50 rounded-lg border-l-4 border-hanok-teal">
                    <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
                      {title.note}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Description and Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Synopsis */}
            <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="text-midnight-ink text-xl">Synopsis</CardTitle>
                {title.pitch && (
                  <Dialog open={isPdfModalOpen} onOpenChange={setIsPdfModalOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-600 hover:from-purple-700 hover:via-purple-800 hover:to-indigo-700 text-white shadow-xl border-0 rounded-full px-5 py-2.5 text-sm font-bold transition-all duration-300 transform hover:scale-110 hover:shadow-2xl relative overflow-hidden group">
                        <Crown className="h-4 w-4 mr-2 text-yellow-300 animate-pulse" />
                        <FileText className="h-4 w-4 mr-2" />
                        <span className="relative z-10">View Pitch Document</span>
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
                      </DialogHeader>
                      <div className="p-6 pt-0">
                        <iframe
                          src={title.pitch}
                          className="w-full h-[80vh] border-0 rounded-lg"
                          title={`${title.title_name_en || title.title_name_kr} - Pitch Document`}
                        />
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {title.description ? (
                    <p className="text-gray-600 leading-relaxed text-base">{title.description}</p>
                  ) : (
                    <p className="text-gray-500 italic text-sm">No description available for this title.</p>
                  )}
                  
                  {/* Market Information */}
                  <div className="pt-6 border-t border-gray-200 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h5 className="font-bold text-hanok-teal mb-1">Perfect For</h5>
                        <p className="text-gray-600 text-sm">{title.perfect_for || 'Not specified'}</p>
                      </div>
                      <div>
                        <h5 className="font-bold text-hanok-teal mb-1">Comps</h5>
                        {title.comps && title.comps.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {title.comps.map((comp, index) => (
                              <span key={index} className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs">
                                {comp}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-600 text-sm">Not specified</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h5 className="font-bold text-hanok-teal mb-1">Tone</h5>
                        <p className="text-gray-600 text-sm">{title.tone || 'Not specified'}</p>
                      </div>
                      <div>
                        <h5 className="font-bold text-hanok-teal mb-1">Audience</h5>
                        <p className="text-gray-600 text-sm">{title.audience || 'Not specified'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Title Information and Details */}
            <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
              <CardHeader>
                <CardTitle className="text-midnight-ink text-xl">Title Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Left Column - Creator Information */}
                  <div className="space-y-4">
                    {title.author && (
                      <div>
                        <h5 className="font-semibold text-hanok-teal mb-1">Story Author (Original Author)</h5>
                        <p className="text-gray-600 text-sm">{title.author}</p>
                      </div>
                    )}
                    {title.writer && (
                      <div>
                        <h5 className="font-semibold text-hanok-teal mb-1">Writer</h5>
                        <p className="text-gray-600 text-sm">{title.writer}</p>
                      </div>
                    )}
                    {title.illustrator && (
                      <div>
                        <h5 className="font-semibold text-hanok-teal mb-1">Art Author (Artist)</h5>
                        <p className="text-gray-600 text-sm">{title.illustrator}</p>
                      </div>
                    )}
                    <div>
                      <h5 className="font-bold text-hanok-teal mb-1">Rights Owner</h5>
                      <p className="text-gray-600 text-sm">{title.rights || 'Not specified'}</p>
                    </div>
                  </div>

                  {/* Right Column - Content Details */}
                  <div className="space-y-4">
                    <div>
                      <h5 className="font-bold text-hanok-teal mb-1">Series Status</h5>
                      <p className="text-gray-600 text-sm">
                        {title.completed !== null && title.completed !== undefined ? String(title.completed) : 'null'}
                      </p>
                    </div>
                    <div>
                      <h5 className="font-bold text-hanok-teal mb-1">Number of Chapters</h5>
                      <p className="text-gray-600 text-sm">{title.chapters?.toLocaleString() || 'Not specified'}</p>
                    </div>
                    <div>
                      <h5 className="font-bold text-hanok-teal mb-1">Creator ID</h5>
                      <p className="text-gray-600 text-sm font-mono text-xs">{title.creator_id}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tags */}
            {title.tags && title.tags.length > 0 && (
              <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-midnight-ink text-xl">Tags</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3">
                    {title.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="bg-gray-100 text-gray-600 px-3 py-1 text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}