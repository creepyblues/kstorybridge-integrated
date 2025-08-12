import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Eye, Heart, Star, ExternalLink, Crown, FileText, X } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import SecurePDFViewer from "@/components/SecurePDFViewer";
import OptimizedTierGatedContent from "@/components/OptimizedTierGatedContent";
import { TierProvider } from "@/contexts/TierContext";

function SampleTitleDetailContent() {
  const { toast } = useToast();
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [samplePopupOpen, setSamplePopupOpen] = useState(false);

  // Sample data for "Werewolves Going Crazy Over Me"
  const sampleTitle = {
    title_id: "a51ba8cc-1234-4804-8c61-61084f7830a1",
    title_name_en: "Werewolves Going Crazy Over Me",
    title_name_kr: null,
    title_url: null,
    title_image: null,
    views: 2000000,
    likes: 0,
    rating: null,
    rating_count: null,
    tags: [],
    genre: "SUPERNATURAL",
    art_author: "Manta Comics",
    content_format: null,
    synopsis: null,
    pitch: "https://drive.google.com/file/d/1dho4WVYIoWUSujM2xQVv-h2l2df3_KH9/view?usp=sharing",
    creator_id: "e05e353c-60c7-4253-a7da-e0da35f3cf44",
    created_at: "2025-07-23 08:56:59.827661+00",
    updated_at: "2025-07-23 11:00:01.848497+00",
    story_author: "Manta Comics",
    comps: ["Vampire Diaries"],
    tagline: "A medical drama mixed with a supernatural soap – a truly original idea",
    description: "A dangerous love affair with a werewolf.",
    completed: null,
    chapters: null,
    perfect_for: null,
    tone: null,
    audience: null,
    rights: null,
    rights_owner: null,
    author: null,
    writer: null,
    illustrator: null,
    note: null,
    keywords: []
  };

  const handleSamplePopup = (feature: string) => {
    setSamplePopupOpen(true);
    toast({ 
      title: "Sample Page",
      description: `This is a sample page. "${feature}" feature is not available in demo mode.`
    });
  };

  const formatGenre = (genre: string | string[]) => {
    if (Array.isArray(genre)) {
      return genre.map(g => g.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()));
    }
    return genre.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatContentFormat = (format: string) => {
    return format.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatViews = (views: number) => {
    if (!views) return '0';
    return views.toLocaleString();
  };

  const formatLikes = (likes: number) => {
    if (!likes || likes === 0) return 'N/A';
    return likes.toLocaleString();
  };

  return (
    <div>
      {/* Sample Page Banner */}
      <div className="mb-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
          <span className="font-semibold text-amber-800">Sample Page</span>
        </div>
        <p className="text-sm text-amber-700 mt-1">
          This is a demo page showing how "Werewolves Going Crazy Over Me" would appear in the dashboard.
        </p>
      </div>

      {/* Title Card */}
      <Card className="bg-white border-gray-200 shadow-lg rounded-2xl mb-12">
        <CardContent className="p-8">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-midnight-ink mb-2">
                {sampleTitle.title_name_en || sampleTitle.title_name_kr}
              </h1>
              {sampleTitle.title_name_kr && sampleTitle.title_name_en && (
                <p className="text-lg text-gray-500 font-medium mb-4">
                  {sampleTitle.title_name_kr}
                </p>
              )}
              
              {/* Story and Art Authors */}
              <div className="flex flex-wrap gap-4 text-sm text-gray-500 mt-4">
                {sampleTitle.story_author && (
                  <div>
                    <span className="font-semibold text-hanok-teal">Story by</span> <span className="text-gray-600">{sampleTitle.story_author}</span>
                  </div>
                )}
                {sampleTitle.art_author && (
                  <div>
                    <span className="font-semibold text-hanok-teal">Art by</span> <span className="text-gray-600">{sampleTitle.art_author}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex flex-col items-end gap-3 ml-6">
              <Button
                onClick={() => handleSamplePopup("Add to Favorites")}
                variant="outline"
                className="border-gray-300 text-gray-600 hover:border-hanok-teal hover:text-hanok-teal hover:bg-hanok-teal/5 shadow-lg rounded-2xl px-6 py-3"
              >
                <Heart className="h-5 w-5 mr-2" />
                Add to Favorites
              </Button>
              
              <Button 
                onClick={() => handleSamplePopup("Contact Creator")}
                variant="outline" 
                className="border-gray-300 text-gray-700 hover:bg-gray-50 shadow-lg rounded-2xl px-6 py-3"
              >
                Contact Creator
              </Button>
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
              {sampleTitle.title_image ? (
                <div className="w-full h-96 bg-gray-100 overflow-hidden">
                  <img 
                    src={sampleTitle.title_image} 
                    alt={sampleTitle.title_name_en || sampleTitle.title_name_kr}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.parentElement!.classList.add('flex', 'items-center', 'justify-center');
                      e.currentTarget.parentElement!.innerHTML = '<span class="text-gray-500">No Image Available</span>';
                    }}
                  />
                </div>
              ) : (
                <div className="w-full h-96 bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 flex items-center justify-center">
                  <div className="text-center">
                    <div className="flex justify-center space-x-2 mb-4">
                      <div className="w-16 h-20 bg-purple-300 rounded-lg opacity-70"></div>
                      <div className="w-20 h-24 bg-pink-300 rounded-lg"></div>
                      <div className="w-16 h-20 bg-blue-300 rounded-lg opacity-70"></div>
                    </div>
                    <p className="text-gray-600 font-medium">Werewolves Going Crazy Over Me</p>
                    <p className="text-gray-500 text-sm">Sample Title Cover</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* View Original Content */}
          {sampleTitle.title_url && (
            <div className="relative bg-gradient-to-r from-blue-500 via-blue-600 to-purple-600 rounded-xl p-1 shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300 group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-xl blur-sm opacity-75 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
              
              <button 
                onClick={() => handleSamplePopup("View Original Content")}
                className="block bg-white rounded-lg p-4 text-center relative overflow-hidden group-hover:bg-gray-50 transition-colors duration-300 w-full"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-100/30 to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-700"></div>
                
                <div className="relative flex items-center justify-center gap-3">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-full">
                    <ExternalLink className="h-5 w-5 text-white" />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-lg text-gray-800 mb-1">View Original Content</div>
                    <div className="text-sm text-gray-600">Read the full story on original platform</div>
                  </div>
                </div>
              </button>
            </div>
          )}

          {/* Tagline */}
          {sampleTitle.tagline && (
            <div className="py-3 px-4 bg-hanok-teal/5 rounded-lg border-l-4 border-hanok-teal">
              <p className="text-gray-700 font-medium italic">
                "{sampleTitle.tagline}"
              </p>
            </div>
          )}

          {/* Format Badge */}
          <div className="flex flex-wrap gap-2">
            {sampleTitle.content_format && (
              <Badge variant="outline" className="border-blue-500 text-blue-500 bg-blue-50 px-3 py-1">
                {formatContentFormat(sampleTitle.content_format)}
              </Badge>
            )}
          </div>

          {/* Note Card - Only show if note exists */}
          {sampleTitle.note && (
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
                    {sampleTitle.note}
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
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {sampleTitle.description ? (
                  <p className="text-gray-600 leading-relaxed text-base">{sampleTitle.description}</p>
                ) : (
                  <p className="text-gray-500 italic text-sm">No description available for this title.</p>
                )}

                {/* Keywords Section */}
                <div className="pt-4 border-t border-gray-200">
                  <h5 className="font-bold text-hanok-teal mb-3">Keywords</h5>
                  <div className="flex flex-wrap gap-2">
                    {(sampleTitle.keywords || sampleTitle.tags) && (sampleTitle.keywords || sampleTitle.tags).length > 0 ? (
                      (sampleTitle.keywords || sampleTitle.tags).map((tag, idx) => (
                        <div key={`synopsis-keyword-${idx}`} className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                          {tag}
                        </div>
                      ))
                    ) : (
                      <div className="inline-block bg-gray-100 text-gray-500 px-2 py-1 rounded-full text-xs">
                        No keywords available
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Premium Feature Notice */}
                {sampleTitle.pitch && (
                  <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Crown className="h-5 w-5 text-purple-600" />
                        <span className="font-semibold text-purple-800">Premium Content Available</span>
                      </div>
                      <Dialog open={isPdfModalOpen} onOpenChange={setIsPdfModalOpen}>
                        <DialogTrigger asChild>
                          <Button className="bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-600 hover:from-purple-700 hover:via-purple-800 hover:to-indigo-700 text-white shadow-xl border-0 rounded-full px-4 py-2 text-sm font-bold transition-all duration-300 transform hover:scale-105 hover:shadow-2xl relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-700 pointer-events-none"></div>
                            
                            <Crown className="h-3 w-3 mr-1 text-yellow-300 animate-pulse pointer-events-none" />
                            <FileText className="h-3 w-3 mr-1 pointer-events-none" />
                            
                            <span className="relative z-10 pointer-events-none">View Pitch</span>
                            
                            <div className="absolute inset-0 rounded-full bg-purple-400/50 blur-md group-hover:bg-purple-300/60 transition-colors duration-300 pointer-events-none"></div>
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-6xl max-h-[90vh] p-0">
                          <DialogHeader className="p-6 pb-0">
                            <DialogTitle>
                              Pitch Document - {sampleTitle.title_name_en || sampleTitle.title_name_kr}
                            </DialogTitle>
                          </DialogHeader>
                          <div className="p-6 pt-0">
                            <SecurePDFViewer 
                              pdfUrl={sampleTitle.pitch}
                            />
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                    <p className="text-sm text-purple-700">
                      Premium Content Available by request. Request a detailed pitch document with comprehensive information about the story, target audience, and market positioning.
                    </p>
                  </div>
                )}
                
                {!sampleTitle.pitch && (
                  <div className="mt-6 p-4 bg-gradient-to-r from-hanok-teal/10 to-blue-50 border border-hanok-teal/30 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-hanok-teal" />
                        <span className="font-semibold text-hanok-teal">Premium Content Available</span>
                      </div>
                      <Button 
                        onClick={() => handleSamplePopup("Request Pitch")}
                        className="bg-gradient-to-r from-hanok-teal via-hanok-teal to-blue-600 hover:from-hanok-teal/90 hover:via-hanok-teal/90 hover:to-blue-700 text-white shadow-xl border-0 rounded-full px-4 py-2 text-sm font-bold transition-all duration-300 transform hover:scale-105 hover:shadow-2xl relative overflow-hidden group"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-700 pointer-events-none"></div>
                        
                        <FileText className="h-3 w-3 mr-1 pointer-events-none" />
                        
                        <span className="relative z-10 pointer-events-none">Request Pitch</span>
                        
                        <div className="absolute inset-0 rounded-full bg-hanok-teal/50 blur-md group-hover:bg-hanok-teal/60 transition-colors duration-300 pointer-events-none"></div>
                      </Button>
                    </div>
                    <p className="text-sm text-hanok-teal/80">
                      Premium Content Available by request. Request a detailed pitch document with comprehensive information about the story, target audience, and market positioning.
                    </p>
                  </div>
                )}

                {/* Market Information */}
                <div className="pt-6 border-t border-gray-200 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <h5 className="font-bold text-hanok-teal">Perfect For</h5>
                        <span className="bg-gray-200 text-gray-600 text-[7px] px-1.5 py-0.5 rounded-full font-medium">
                          PRO PLAN
                        </span>
                      </div>
                      <OptimizedTierGatedContent requiredTier="pro">
                        {sampleTitle.perfect_for ? (
                          <div className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                            {sampleTitle.perfect_for}
                          </div>
                        ) : (
                          <div className="inline-block bg-gray-100 text-gray-500 px-2 py-1 rounded-full text-xs">
                            Not specified
                          </div>
                        )}
                      </OptimizedTierGatedContent>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <h5 className="font-bold text-hanok-teal">Comps</h5>
                        <span className="bg-gray-200 text-gray-600 text-[7px] px-1.5 py-0.5 rounded-full font-medium">
                          PRO PLAN
                        </span>
                      </div>
                      <OptimizedTierGatedContent requiredTier="pro">
                        {sampleTitle.comps && sampleTitle.comps.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {sampleTitle.comps.map((comp, index) => (
                              <div key={index} className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                                {comp}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="inline-block bg-gray-100 text-gray-500 px-2 py-1 rounded-full text-xs">
                            Not specified
                          </div>
                        )}
                      </OptimizedTierGatedContent>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h5 className="font-bold text-hanok-teal mb-3">Tone</h5>
                      {sampleTitle.tone ? (
                        <div className="inline-block bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium">
                          {sampleTitle.tone}
                        </div>
                      ) : (
                        <div className="inline-block bg-gray-100 text-gray-500 px-2 py-1 rounded-full text-xs">
                          Not specified
                        </div>
                      )}
                    </div>
                    <div>
                      <h5 className="font-bold text-hanok-teal mb-3">Genre</h5>
                      {sampleTitle.genre && (Array.isArray(sampleTitle.genre) ? sampleTitle.genre.length > 0 : true) ? (
                        <div className="flex flex-wrap gap-2">
                          {Array.isArray(sampleTitle.genre) ? (
                            sampleTitle.genre.map((g, idx) => (
                              <div key={idx} className="inline-block bg-cyan-100 text-cyan-800 px-2 py-1 rounded-full text-xs font-medium">
                                {formatGenre(g)}
                              </div>
                            ))
                          ) : (
                            <div className="inline-block bg-cyan-100 text-cyan-800 px-2 py-1 rounded-full text-xs font-medium">
                              {formatGenre(sampleTitle.genre)}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="inline-block bg-gray-100 text-gray-500 px-2 py-1 rounded-full text-xs">
                          Not specified
                        </div>
                      )}
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
                  {/* Views */}
                  <div>
                    <h5 className="font-semibold text-hanok-teal mb-1">Views</h5>
                    <p className="text-gray-600 text-sm">{formatViews(sampleTitle.views || 0)}</p>
                  </div>
                  
                  {/* Series Status */}
                  <div>
                    <h5 className="font-semibold text-hanok-teal mb-1">Series Status</h5>
                    <p className="text-gray-600 text-sm">
                      {sampleTitle.completed !== null && sampleTitle.completed !== undefined 
                        ? (sampleTitle.completed ? 'Completed' : 'Ongoing') 
                        : 'Unknown'}
                    </p>
                  </div>
                  
                  {/* Rating */}
                  {sampleTitle.rating && sampleTitle.rating_count && sampleTitle.rating_count > 0 && (
                    <div>
                      <h5 className="font-semibold text-hanok-teal mb-1">Rating</h5>
                      <p className="text-gray-600 text-sm">{sampleTitle.rating.toFixed(1)} ({sampleTitle.rating_count} reviews)</p>
                    </div>
                  )}
                  
                  {sampleTitle.author && (
                    <div>
                      <h5 className="font-semibold text-hanok-teal mb-1">Story Author (Original Author)</h5>
                      <p className="text-gray-600 text-sm">{sampleTitle.author}</p>
                    </div>
                  )}
                  {sampleTitle.writer && (
                    <div>
                      <h5 className="font-semibold text-hanok-teal mb-1">Writer</h5>
                      <p className="text-gray-600 text-sm">{sampleTitle.writer}</p>
                    </div>
                  )}
                  {sampleTitle.illustrator && (
                    <div>
                      <h5 className="font-semibold text-hanok-teal mb-1">Art Author (Artist)</h5>
                      <p className="text-gray-600 text-sm">{sampleTitle.illustrator}</p>
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h5 className="font-semibold text-hanok-teal">Rights Owner</h5>
                      <span className="bg-gray-200 text-gray-600 text-[7px] px-1.5 py-0.5 rounded-full font-medium">
                        PRO PLAN
                      </span>
                    </div>
                    <OptimizedTierGatedContent requiredTier="pro">
                      {(sampleTitle.rights_owner || sampleTitle.rights) ? (
                        <div className="inline-block bg-rose-100 text-rose-800 px-2 py-1 rounded-full text-xs font-medium">
                          {sampleTitle.rights_owner || sampleTitle.rights}
                        </div>
                      ) : (
                        <div className="inline-block bg-gray-100 text-gray-500 px-2 py-1 rounded-full text-xs">
                          Not specified
                        </div>
                      )}
                    </OptimizedTierGatedContent>
                  </div>
                </div>

                {/* Right Column - Content Details */}
                <div className="space-y-4">
                  {/* Likes */}
                  <div>
                    <h5 className="font-semibold text-hanok-teal mb-1">Likes</h5>
                    <p className="text-gray-600 text-sm">{formatLikes(sampleTitle.likes || 0)}</p>
                  </div>
                  <div>
                    <h5 className="font-semibold text-hanok-teal mb-1">Number of Chapters</h5>
                    <p className="text-gray-600 text-sm">
                      {sampleTitle.chapters ? (
                        `${sampleTitle.chapters.toLocaleString()}${sampleTitle.completed !== 'completed' ? '+' : ''}`
                      ) : (
                        'Not specified'
                      )}
                    </p>
                  </div>
                  
                  {/* Audience */}
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h5 className="font-semibold text-hanok-teal">Audience</h5>
                      <span className="bg-gray-200 text-gray-600 text-[7px] px-1.5 py-0.5 rounded-full font-medium">
                        PRO PLAN
                      </span>
                    </div>
                    <OptimizedTierGatedContent requiredTier="pro">
                      {sampleTitle.audience ? (
                        <div className="inline-block bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-medium">
                          {sampleTitle.audience}
                        </div>
                      ) : (
                        <div className="inline-block bg-gray-100 text-gray-500 px-2 py-1 rounded-full text-xs">
                          Not specified
                        </div>
                      )}
                    </OptimizedTierGatedContent>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Sample Popup Dialog */}
      <Dialog open={samplePopupOpen} onOpenChange={setSamplePopupOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
              Sample Page
            </DialogTitle>
          </DialogHeader>
          <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg border border-amber-200">
            <p className="text-amber-800 text-center">
              This is a sample page showcasing the dashboard design and functionality for "Werewolves Going Crazy Over Me".
            </p>
          </div>
          <div className="flex justify-center pt-4">
            <Button 
              onClick={() => setSamplePopupOpen(false)}
              className="bg-amber-500 hover:bg-amber-600 text-white"
            >
              Got it
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function SampleTitleDetail() {
  return (
    <TierProvider>
      <SampleTitleDetailContent />
    </TierProvider>
  );
}