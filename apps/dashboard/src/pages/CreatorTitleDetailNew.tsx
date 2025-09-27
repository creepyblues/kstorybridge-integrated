import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

import { Eye, ExternalLink, FileText, X, Calendar, BookOpen, Edit } from "lucide-react";
import { Button, Card, CardContent, CardHeader, CardTitle, Badge } from "@kstorybridge/ui";
import { useToast } from "@/hooks/use-toast";import type { Title } from "@/services/titlesService";

import { useDataCache } from "@/contexts/DataCacheContext";
import SecurePDFViewer from "@/components/SecurePDFViewer";
import { directApiService, setDirectApiAccessToken } from "@/services/directApiService";
import { useAuth } from "@/hooks/useAuth";
import { PageContainer } from "@/components/layout/PageContainer";

// Creator profile type based on user_creators table schema
interface CreatorProfile {
  id: string;
  email: string;
  full_name: string;
  pen_name?: string;
  ip_owner_role?: string;
  ip_owner_company?: string;
  website_url?: string;
  invitation_status?: string;
  created_at: string;
  updated_at: string;
}

function CreatorTitleDetailContent() {
  const { titleId } = useParams<{ titleId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { session } = useAuth();
  const {
    getTitleDetail,
    setTitleDetail,
    isFresh,
    isSessionValid,
    getDbConnectivityStatus,
    setDbConnectivityStatus
  } = useDataCache();
  const [title, setTitle] = useState<Title | null>(null);
  const [creator, setCreator] = useState<CreatorProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [creatorLoading, setCreatorLoading] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [currentPdfUrl, setCurrentPdfUrl] = useState("");

  useEffect(() => {
    if (titleId) {
      const cachedTitle = getTitleDetail(titleId);
      // NEW POLICY: Check session validity and cache freshness
      if (cachedTitle && isSessionValid() && isFresh(`titleDetail:${titleId}`)) {
        setTitle(cachedTitle);
        setLoading(false);
      } else {
        loadTitle(titleId);
      }
    }
  }, [titleId, isSessionValid]); // Include session validity

  // Load creator data when title is loaded
  useEffect(() => {
    if (title?.creator_id) {
      loadCreator(title.creator_id);
    }
  }, [title?.creator_id]);

  const loadTitle = async (id: string) => {
    try {
      setLoading(true);
      setDbError(null);

      console.log('📖 Loading title detail from database (session-based policy)...', id);

      // Use directApiService for consistent API calls
      const data = await directApiService.getTitleById(id);
      setTitle(data);
      setTitleDetail(id, data);
      setDbConnectivityStatus({ isConnected: true });

      console.log('✅ Successfully loaded title detail from database');
    } catch (error) {
      console.error('❌ Database connectivity error loading title detail:', error);

      // Update connectivity status
      const errorMessage = error instanceof Error ? error.message : 'Unknown database error';
      setDbConnectivityStatus({ isConnected: false, error: errorMessage });
      setDbError(errorMessage);

      // NEW POLICY: Show database error to user instead of fallback
      toast({
        title: "Database Connection Error",
        description: "Unable to load title details. Please check your connection and try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadCreator = async (creatorId: string) => {
    try {
      setCreatorLoading(true);
      console.log('📖 Loading creator profile from database...', creatorId);

      // Set access token for authenticated requests
      if (session?.access_token) {
        setDirectApiAccessToken(session.access_token);
      }

      // Use directApiService to fetch creator data
      const data = await directApiService.getCreatorById(creatorId);

      if (data) {
        setCreator(data);
        console.log('✅ Successfully loaded creator profile', data);
      } else {
        console.log('⚠️ No creator profile found');
        setCreator(null);
      }
    } catch (error) {
      console.error('❌ Error loading creator profile:', error);
      setCreator(null);
    } finally {
      setCreatorLoading(false);
    }
  };

  const formatViews = (views: number) => {
    if (!views) return '0';
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return views.toLocaleString();
  };

  const formatContentFormat = (format: string) => {
    return format.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-hanok-teal"></div>
      </div>
    );
  }

  // NEW POLICY: Show database connectivity error if connection failed
  if (dbError && !getDbConnectivityStatus().isConnected) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <Card className="border-red-200 shadow-lg">
          <CardContent className="p-8 text-center">
            <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-red-600 text-xl font-bold">!</span>
            </div>
            <h3 className="text-lg font-medium text-red-600 mb-2">
              Database Connection Error
            </h3>
            <p className="text-red-500 mb-4">
              Unable to load title details. Please check your internet connection.
            </p>
            <p className="text-xs text-gray-500 mb-4">
              Error: {dbError}
            </p>
            <Button
              onClick={() => window.location.reload()}
              className="bg-red-600 hover:bg-red-700"
            >
              Retry Connection
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!title) {
    return (
      <div className="text-center text-gray-600 py-16">
        <h2 className="text-xl font-medium mb-2">Title not found</h2>
        <p className="text-sm">The requested title could not be found.</p>
      </div>
    );
  }


  return (
    <PageContainer>
      <div className="space-y-6">
        {/* Hero Section - Full Width */}
        <div>
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="flex-1 min-w-0">
              {/* Mobile: Full width image first */}
              <div className="sm:hidden mb-4">
                <div className="w-full h-48 bg-gray-100 rounded-xl overflow-hidden shadow-xl ring-1 ring-slate-200">
                  {title.title_image ? (
                    <img 
                      src={title.title_image} 
                      alt={title.title_name_en || title.title_name_kr}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-hanok-teal/10 to-hanok-teal/20 flex items-center justify-center">
                      <BookOpen className="w-10 h-10 text-hanok-teal" />
                    </div>
                  )}
                </div>
              </div>
              
              {/* Desktop: Side-by-side layout */}
              <div className="hidden sm:flex sm:items-start gap-4 sm:gap-6 mb-4">
                <div className="w-32 h-44 flex-shrink-0 bg-gray-100 rounded-xl overflow-hidden shadow-xl ring-1 ring-slate-200">
                  {title.title_image ? (
                    <img 
                      src={title.title_image} 
                      alt={title.title_name_en || title.title_name_kr}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-hanok-teal/10 to-hanok-teal/20 flex items-center justify-center">
                      <BookOpen className="w-10 h-10 text-hanok-teal" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0 text-center sm:text-left">
                  <h2 className="text-xl sm:text-2xl lg:text-3xl xl:text-3xl font-bold text-slate-900 mb-2 sm:mb-3 leading-tight">
                    {title.title_name_en || title.title_name_kr}
                  </h2>
                  {title.title_name_kr && title.title_name_en && (
                    <p className="text-lg sm:text-xl text-slate-600 font-medium mb-3 sm:mb-4">
                      {title.title_name_kr}
                    </p>
                  )}
                  
                  {/* Author info - Story and Art on same line */}
                  <div className="flex flex-row flex-wrap gap-4 sm:gap-6 text-sm sm:text-base text-slate-600 justify-center sm:justify-start">
                    {title.story_author && (
                      <span className="flex items-center gap-2">
                        <span className="font-semibold text-hanok-teal">Story:</span> 
                        <span className="font-medium">{title.story_author}</span>
                      </span>
                    )}
                    {title.art_author && (
                      <span className="flex items-center gap-2">
                        <span className="font-semibold text-hanok-teal">Art:</span> 
                        <span className="font-medium">{title.art_author}</span>
                      </span>
                    )}
                  </div>

                  {/* Quick stats - views/chapters/status in one line */}
                  <div className="flex flex-row items-center gap-3 sm:gap-6 mt-3 sm:mt-4 text-xs sm:text-sm text-slate-500 justify-center sm:justify-start flex-wrap">
                    <div className="flex items-center gap-2">
                      <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="font-medium">{formatViews(title.views || 0)} views</span>
                    </div>
                    {title.chapters && (
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="font-medium">{title.chapters.toLocaleString()} chapters</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="font-medium">{title.completed ? 'Completed' : 'Ongoing'}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Mobile: Content section */}
              <div className="sm:hidden">
                <h2 className="text-2xl font-bold text-slate-900 mb-2 leading-tight text-center">
                  {title.title_name_en || title.title_name_kr}
                </h2>
                {title.title_name_kr && title.title_name_en && (
                  <p className="text-lg text-slate-600 font-medium mb-3 text-center">
                    {title.title_name_kr}
                  </p>
                )}
                
                {/* Author info - Story and Art on same line */}
                <div className="flex flex-row flex-wrap gap-4 text-sm text-slate-600 justify-center">
                  {title.story_author && (
                    <span className="flex items-center gap-2">
                      <span className="font-semibold text-hanok-teal">Story:</span> 
                      <span className="font-medium">{title.story_author}</span>
                    </span>
                  )}
                  {title.art_author && (
                    <span className="flex items-center gap-2">
                      <span className="font-semibold text-hanok-teal">Art:</span> 
                      <span className="font-medium">{title.art_author}</span>
                    </span>
                  )}
                </div>

                {/* Quick stats - views/chapters/status in one line */}
                <div className="flex flex-row items-center gap-3 mt-3 text-xs text-slate-500 justify-center flex-wrap">
                  <div className="flex items-center gap-2">
                    <Eye className="h-3 w-3" />
                    <span className="font-medium">{formatViews(title.views || 0)} views</span>
                  </div>
                  {title.chapters && (
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-3 w-3" />
                      <span className="font-medium">{title.chapters.toLocaleString()} chapters</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    <span className="font-medium">{title.completed ? 'Completed' : 'Ongoing'}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-row gap-2 sm:gap-3 w-full lg:w-auto justify-center lg:justify-end">
                {/* Edit Button */}
                <Button
                  onClick={() => navigate(`/creators/titles/${title.title_id}/edit`)}
                  className="flex-1 bg-hanok-teal hover:bg-hanok-teal/90 text-white border-0 px-3 sm:px-5 py-2 sm:py-3 text-sm sm:text-base shadow-md hover:shadow-lg transition-all duration-200"
                >
                  <Edit className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  Edit
                </Button>

                {/* View Original Button */}
                {title.title_url && (
                  <Button
                    asChild
                    variant="outline"
                    className="flex-1 border-purple-500 text-slate-600 hover:bg-purple-50 hover:border-purple-600 px-3 sm:px-5 py-2 sm:py-3 text-sm sm:text-base shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    <a href={title.title_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      View Original
                    </a>
                  </Button>
                )}
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-6xl mx-auto px-3 sm:px-4">

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6">
        {/* Left Column - Business Critical Info (2/5) */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          
          {/* Key Business Info Panel */}
          <Card className="bg-white border-gray-300 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-semibold text-slate-900">
                Business Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
              
                {/* Rights Holder */}
                <div>
                  <div className="flex items-center justify-between">
                    <h5 className="font-medium text-slate-700">Rights Holder</h5>
                    <span className="font-bold text-[#4C9C9B] uppercase text-xs truncate max-w-[60%] text-right">
                      {title.rights_owner || title.rights || "Not specified"}
                    </span>
                  </div>
                </div>

                {/* Target Market Info */}
              <div className="space-y-4">
                {/* Perfect For */}
                <div className="flex items-center justify-between">
                  <h5 className="font-medium text-slate-700">Perfect For</h5>
                  <span className="font-bold text-[#4C9C9B] uppercase text-xs truncate max-w-[60%] text-right">
                    {title.perfect_for || "Not specified"}
                  </span>
                </div>

                {/* Audience */}
                <div className="flex items-center justify-between">
                  <h5 className="font-medium text-slate-700">Audience</h5>
                  <span className="font-bold text-[#4C9C9B] uppercase text-xs truncate max-w-[60%] text-right">
                    {title.audience || "Not specified"}
                  </span>
                </div>

                {/* Comps */}
                {title.comps && title.comps.length > 0 && (
                  <div className="flex items-center justify-between">
                    <h5 className="font-medium text-slate-700">Comps</h5>
                    <span className="font-bold text-[#4C9C9B] uppercase text-xs truncate max-w-[60%] text-right">
                      {title.comps.slice(0, 2).map(comp => 
                        comp.length > 12 ? comp.substring(0, 12) + '...' : comp
                      ).join(', ')}
                      {title.comps.length > 2 && ` +${title.comps.length - 2}`}
                    </span>
                  </div>
                )}
              </div>
              </div>
            </CardContent>
          </Card>

          {/* Format & Genre */}
          <Card className="bg-white border-gray-300 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-semibold text-slate-900">Content Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h5 className="font-medium text-slate-700">Format</h5>
                  {title.content_format && (
                    <span className="font-bold text-[#4C9C9B] uppercase text-xs truncate max-w-[60%] text-right">
                      {formatContentFormat(title.content_format)}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center justify-between">
                  <h5 className="font-medium text-slate-700">Series Status</h5>
                  <span className="font-bold text-[#4C9C9B] uppercase text-xs truncate max-w-[60%] text-right">
                    {title.completed ? 'Completed' : 'Ongoing'}
                  </span>
                </div>

                {title.genre && (
                  <div className="flex items-center justify-between">
                    <h5 className="font-medium text-slate-700">Genre</h5>
                    <span className="font-bold text-[#4C9C9B] uppercase text-xs truncate max-w-[60%] text-right">
                      {Array.isArray(title.genre) 
                        ? title.genre.slice(0, 2).map(g => g.replace('_', ' ')).join(', ')
                        : title.genre.replace('_', ' ')
                      }
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Creator Information */}
          <Card className="bg-white border-gray-300 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-semibold text-slate-900">Creator Information</CardTitle>
            </CardHeader>
            <CardContent>
              {creatorLoading ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-hanok-teal"></div>
                </div>
              ) : creator ? (
                <div className="space-y-4">
                  {/* Full Name */}
                  <div className="flex items-center justify-between">
                    <h5 className="font-medium text-slate-700">Full Name</h5>
                    <span className="font-bold text-[#4C9C9B] text-xs truncate max-w-[60%] text-right">
                      {creator.full_name || "Not specified"}
                    </span>
                  </div>

                  {/* Pen Name */}
                  <div className="flex items-center justify-between">
                    <h5 className="font-medium text-slate-700">Pen Name</h5>
                    <span className="font-bold text-[#4C9C9B] text-xs truncate max-w-[60%] text-right">
                      {creator.pen_name || "Not specified"}
                    </span>
                  </div>

                  {/* Email */}
                  <div className="flex items-center justify-between">
                    <h5 className="font-medium text-slate-700">Email</h5>
                    <span className="font-bold text-[#4C9C9B] text-xs truncate max-w-[60%] text-right">
                      {creator.email || "Not specified"}
                    </span>
                  </div>

                  {/* IP Owner Role */}
                  <div className="flex items-center justify-between">
                    <h5 className="font-medium text-slate-700">Role</h5>
                    <span className="font-bold text-[#4C9C9B] uppercase text-xs truncate max-w-[60%] text-right">
                      {creator.ip_owner_role ? creator.ip_owner_role.replace('_', ' ') : "Not specified"}
                    </span>
                  </div>

                  {/* Company */}
                  <div className="flex items-center justify-between">
                    <h5 className="font-medium text-slate-700">Company</h5>
                    <span className="font-bold text-[#4C9C9B] text-xs truncate max-w-[60%] text-right">
                      {creator.ip_owner_company || "Not specified"}
                    </span>
                  </div>

                  {/* Website */}
                  <div className="flex items-center justify-between">
                    <h5 className="font-medium text-slate-700">Website</h5>
                    <span className="font-bold text-[#4C9C9B] text-xs truncate max-w-[60%] text-right">
                      {creator.website_url ? (
                        <a
                          href={creator.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline"
                        >
                          {creator.website_url.replace(/https?:\/\//, '')}
                        </a>
                      ) : (
                        "Not specified"
                      )}
                    </span>
                  </div>

                  {/* Invitation Status */}
                  <div className="flex items-center justify-between">
                    <h5 className="font-medium text-slate-700">Status</h5>
                    <span className="font-bold text-[#4C9C9B] uppercase text-xs truncate max-w-[60%] text-right">
                      {creator.invitation_status || "Not specified"}
                    </span>
                  </div>

                  {/* Member Since */}
                  <div className="flex items-center justify-between">
                    <h5 className="font-medium text-slate-700">Member Since</h5>
                    <span className="font-bold text-[#4C9C9B] text-xs truncate max-w-[60%] text-right">
                      {creator.created_at ? new Date(creator.created_at).toLocaleDateString() : "Not specified"}
                    </span>
                  </div>

                  {/* Last Updated */}
                  <div className="flex items-center justify-between">
                    <h5 className="font-medium text-slate-700">Last Updated</h5>
                    <span className="font-bold text-[#4C9C9B] text-xs truncate max-w-[60%] text-right">
                      {creator.updated_at ? new Date(creator.updated_at).toLocaleDateString() : "Not specified"}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <p>Creator information not available</p>
                </div>
              )}
            </CardContent>
          </Card>

        </div>

        {/* Right Column - Content Overview (3/5) */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Synopsis - Compact with expand option */}
          <Card className="bg-white border-gray-300 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-semibold text-slate-900">Synopsis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {title.synopsis ? (
                  <p className="text-slate-700 leading-relaxed">
                    {title.synopsis}
                  </p>
                ) : (
                  <p className="text-slate-500 italic">No synopsis available for this title.</p>
                )}

                {/* Tagline */}
                {title.tagline && (
                  <div className="mt-4 p-4 bg-hanok-teal/5 border-l-4 border-hanok-teal rounded-r-lg">
                    <p className="text-slate-700 font-medium italic">
                      "{title.tagline}"
                    </p>
                  </div>
                )}

                {/* Pitch Deck */}
                <div className="pt-4">
                  <h5 className="font-bold text-slate-700 mb-3">Pitch Deck</h5>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                    <span className="text-slate-600 text-sm sm:text-base text-center sm:text-left">View the Pitch Deck</span>
                    <Button
                      disabled={!title.pitch}
                      onClick={() => {
                        if (!title.pitch) {
                          toast({
                            title: "Pitch deck unavailable",
                            description: "Upload a pitch deck for this title to preview it here.",
                          });
                          return;
                        }

                        setCurrentPdfUrl(title.pitch);
                        setTimeout(() => setIsPdfModalOpen(true), 10);
                      }}
                      className="bg-gradient-to-r from-purple-500 to-purple-600 text-white text-xs font-medium px-4 py-1.5 sm:px-3 sm:py-1 rounded-full shadow-sm hover:from-purple-600 hover:to-purple-700 transition-all duration-200 w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {title.pitch ? "View" : "No Deck"}
                    </Button>
                  </div>
                </div>

                {/* Keywords */}
                {(title.keywords || title.tags) && (title.keywords || title.tags).length > 0 && (
                  <div className="pt-4">
                    <h5 className="font-bold text-slate-700 mb-3">Keywords</h5>
                    <div className="flex flex-wrap gap-2">
                      {(title.keywords || title.tags).map((tag, idx) => (
                        <Badge key={idx} className="bg-slate-50 text-slate-600 border border-slate-200 font-medium px-2.5 py-1 rounded-md text-xs hover:bg-slate-100 transition-colors">
                          {tag.toUpperCase()}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Additional Details */}
          {title.note && (
            <Card className="bg-white border-gray-300 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-hanok-teal" />
                  Additional Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
                    {title.note}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Extended Author Information */}
          {(title.author || title.writer || title.illustrator) && (
            <Card className="bg-white border-gray-300 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-slate-900">Creator Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {title.author && (
                    <div className="flex justify-between items-center py-2 border-b border-slate-100 last:border-b-0">
                      <span className="text-sm font-medium text-slate-600">Original Author</span>
                      <span className="text-sm text-slate-900">{title.author}</span>
                    </div>
                  )}
                  {title.writer && (
                    <div className="flex justify-between items-center py-2 border-b border-slate-100 last:border-b-0">
                      <span className="text-sm font-medium text-slate-600">Writer</span>
                      <span className="text-sm text-slate-900">{title.writer}</span>
                    </div>
                  )}
                  {title.illustrator && (
                    <div className="flex justify-between items-center py-2 border-b border-slate-100 last:border-b-0">
                      <span className="text-sm font-medium text-slate-600">Illustrator</span>
                      <span className="text-sm text-slate-900">{title.illustrator}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* PDF Modal */}
      {isPdfModalOpen && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-2 sm:p-4"
          onClick={() => setIsPdfModalOpen(false)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] h-auto relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Floating Close Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsPdfModalOpen(false)}
              className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full w-10 h-10 p-0"
            >
              <X className="h-5 w-5" />
            </Button>

            <div className="h-full">
              <SecurePDFViewer pdfUrl={currentPdfUrl} />
            </div>
          </div>
        </div>
      )}

      </div>
    </PageContainer>
  );
}

export default function CreatorTitleDetailNew() {
  return <CreatorTitleDetailContent />;
}
