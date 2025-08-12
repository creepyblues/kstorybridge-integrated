import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@kstorybridge/ui';
import { Badge } from '@kstorybridge/ui';
import { Button } from '@kstorybridge/ui';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@kstorybridge/ui';
import { ArrowLeft, Eye, Heart, Star, FileText, Crown, X } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import SecurePDFViewer from '../components/SecurePDFViewer';
import { useToast } from '@kstorybridge/ui';

export default function SampleTitleDetailPage() {
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [samplePopupOpen, setSamplePopupOpen] = useState(false);
  const { toast } = useToast();

  // Sample data for "Werewolves Going Crazy Over Me"
  const sampleTitle = {
    title_id: "a51ba8cc-1234-4804-8c61-61084f7830a1",
    title_name_en: "Werewolves Going Crazy Over Me",
    title_name_kr: null,
    title_image: null,
    tagline: "A medical drama mixed with a supernatural soap – a truly original idea",
    pitch: "https://drive.google.com/file/d/1dho4WVYIoWUSujM2xQVv-h2l2df3_KH9/view?usp=sharing",
    description: "A dangerous love affair with a werewolf.",
    genre: "SUPERNATURAL",
    content_format: "webtoon",
    story_author: "Manta Comics",
    views: 2000000,
    likes: 0,
    rating: null,
    rating_count: null,
  };

  const handleSamplePopup = (feature: string) => {
    setSamplePopupOpen(true);
    if (toast) {
      toast({ 
        title: "Sample Page",
        description: `This is a sample page. "${feature}" feature is not available in demo mode.`
      });
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-porcelain-blue-50">
      <PageHeader />
      
      <main className="max-w-7xl mx-auto px-6 py-16">
        {/* Sample Page Banner */}
        <div className="mb-8 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
            <span className="font-semibold text-amber-800">Sample Page</span>
          </div>
          <p className="text-sm text-amber-700 mt-1">
            This is a demo page showing how "Werewolves Going Crazy Over Me" would appear on the KStoryBridge platform.
          </p>
        </div>

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
                {sampleTitle.title_image ? (
                  <div className="w-full h-96 bg-gray-100 rounded-lg overflow-hidden">
                    <img 
                      src={sampleTitle.title_image} 
                      alt={sampleTitle.title_name_en || sampleTitle.title_name_kr}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-full h-96 bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 rounded-lg flex items-center justify-center">
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
              </div>

              {/* Title Info */}
              <div className="lg:col-span-2">
                <h1 className="text-4xl font-bold text-midnight-ink mb-4">
                  {sampleTitle.title_name_en || sampleTitle.title_name_kr}
                </h1>
                
                {sampleTitle.title_name_en && sampleTitle.title_name_kr && (
                  <p className="text-xl text-gray-600 mb-4">{sampleTitle.title_name_kr}</p>
                )}

                {sampleTitle.story_author && (
                  <p className="text-lg text-gray-600 mb-4">
                    <span className="font-medium">Story by</span> {sampleTitle.story_author}
                  </p>
                )}

                {sampleTitle.tagline && (
                  <p className="text-lg text-gray-700 italic mb-6">"{sampleTitle.tagline}"</p>
                )}

                {/* Badges */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {sampleTitle.genre && (
                    <Badge variant="outline" className="border-hanok-teal text-hanok-teal bg-hanok-teal/5">
                      {formatGenre(sampleTitle.genre)}
                    </Badge>
                  )}
                  {sampleTitle.content_format && (
                    <Badge variant="outline" className="border-blue-500 text-blue-500 bg-blue-50">
                      {formatContentFormat(sampleTitle.content_format)}
                    </Badge>
                  )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <Eye className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                    <p className="text-sm text-gray-600">Views</p>
                    <p className="font-bold text-gray-800">{sampleTitle.views?.toLocaleString() || '0'}</p>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <Heart className="h-5 w-5 text-red-500 mx-auto mb-1" />
                    <p className="text-sm text-gray-600">Likes</p>
                    <p className="font-bold text-gray-800">{sampleTitle.likes?.toLocaleString() || '0'}</p>
                  </div>
                  {sampleTitle.rating && sampleTitle.rating_count && sampleTitle.rating_count > 0 && (
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <Star className="h-5 w-5 text-blue-500 mx-auto mb-1" />
                      <p className="text-sm text-gray-600">Rating</p>
                      <p className="font-bold text-gray-800">{sampleTitle.rating.toFixed(1)}</p>
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
            {sampleTitle.pitch && (
              <Dialog open={isPdfModalOpen} onOpenChange={setIsPdfModalOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-600 hover:from-purple-700 hover:via-purple-800 hover:to-indigo-700 text-white shadow-xl border-0 rounded-full px-5 py-2.5 text-sm font-bold transition-all duration-300 transform hover:scale-110 hover:shadow-2xl relative overflow-hidden group">
                    {/* Shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-700 pointer-events-none"></div>
                    
                    {/* Icons */}
                    <Crown className="h-4 w-4 mr-2 text-blue-400 animate-pulse pointer-events-none" />
                    <FileText className="h-4 w-4 mr-2 pointer-events-none" />
                    
                    {/* Text */}
                    <span className="relative z-10 pointer-events-none">View Pitch</span>
                    
                    {/* Glow effect */}
                    <div className="absolute inset-0 rounded-full bg-purple-400/50 blur-md group-hover:bg-purple-300/60 transition-colors duration-300 pointer-events-none"></div>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-6xl max-h-[90vh] p-0">
                  <DialogHeader className="p-6 pb-0">
                    <DialogTitle className="flex items-center justify-between">
                      <span>Pitch Document - {sampleTitle.title_name_en || sampleTitle.title_name_kr}</span>
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
                    <SecurePDFViewer 
                      pdfUrl={sampleTitle.pitch} 
                      title={`${sampleTitle.title_name_en || sampleTitle.title_name_kr} - Pitch Document`}
                    />
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </CardHeader>
          <CardContent>
            <div className="text-gray-700 leading-relaxed">
              {sampleTitle.description ? (
                <p className="text-lg mb-4">{sampleTitle.description}</p>
              ) : sampleTitle.tagline ? (
                <p className="text-lg italic mb-4">"{sampleTitle.tagline}"</p>
              ) : (
                <p className="text-gray-500 italic">No synopsis available for this title.</p>
              )}
              
              {/* Premium Feature Notice */}
              {sampleTitle.pitch && (
                <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Crown className="h-5 w-5 text-purple-600" />
                    <span className="font-semibold text-purple-800">Premium Content Available</span>
                  </div>
                  <p className="text-sm text-purple-700">
                    This title includes a detailed pitch document with comprehensive information about the story, 
                    target audience, and market positioning. Click "View Pitch" to access the full document.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <Card className="bg-white border-gray-200 shadow-lg rounded-2xl mb-8">
          <CardContent className="p-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Interested in this title?</h3>
            <div className="flex flex-wrap gap-4">
              <Button 
                onClick={() => handleSamplePopup("Add to Favorites")}
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                <Heart className="h-4 w-4 mr-2" />
                Add to Favorites
              </Button>
              <Button 
                onClick={() => handleSamplePopup("Contact Creator")}
                variant="outline"
                className="border-hanok-teal text-hanok-teal hover:bg-hanok-teal hover:text-white"
              >
                Contact Creator
              </Button>
              <Button 
                onClick={() => handleSamplePopup("Request License")}
                className="bg-hanok-teal hover:bg-hanok-teal/90 text-white"
              >
                Request License
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <Card className="bg-gradient-to-r from-hanok-teal to-blue-600 text-white rounded-2xl">
          <CardContent className="p-8 text-center">
            <h3 className="text-2xl font-bold mb-4">Ready to discover more Korean content?</h3>
            <p className="text-lg mb-6 opacity-90">
              Join KStoryBridge to access our full catalog of premium Korean titles and connect with creators.
            </p>
            <div className="flex justify-center gap-4">
              <Link to="/signup">
                <Button size="lg" className="bg-white text-hanok-teal hover:bg-gray-100">
                  Sign Up Now
                </Button>
              </Link>
              <Link to="/">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-hanok-teal">
                  Browse More Titles
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>

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
              This is a sample page showcasing how Korean content appears on KStoryBridge.
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