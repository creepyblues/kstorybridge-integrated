import { useState, useEffect } from "react";
import { Card, CardContent } from "@kstorybridge/ui";
import { Heart, Loader2 } from "lucide-react";
import { featuredService } from "@/services/featuredService";
import { favoritesService } from "@/services/favoritesService";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface RealTitleCardProps {
  onComplete: () => void;
}

export default function RealTitleCard({ onComplete }: RealTitleCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [title, setTitle] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    loadFeaturedTitle();
  }, []);

  const loadFeaturedTitle = async () => {
    try {
      const featured = await featuredService.getFeaturedTitles();
      if (featured && featured.length > 0) {
        // Get the first featured title
        setTitle(featured[0].title);
      }
    } catch (error) {
      console.error('Failed to load featured title:', error);
      // Fallback: create a sample title for demo
      setTitle({
        title_id: 'demo-onboarding',
        title_name_en: 'Business Proposal',
        title_name_kr: '사내맞선',
        genre: ['Romance', 'Comedy'],
        content_format: 'Webtoon',
        synopsis: 'A refreshing romantic comedy about an employee who goes on a blind date pretending to be her friend, only to meet her company CEO.',
        title_image: 'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=400'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveTitle = async () => {
    if (!user || !title || isSaving || isSaved) return;

    setIsSaving(true);

    try {
      // Actually save to database
      await favoritesService.addFavorite(user.id, title.title_id);

      setIsSaved(true);

      toast({
        title: "Title saved! 💖",
        description: "You can find this in your saved titles"
      });

      // Complete the step after successful save
      setTimeout(() => {
        onComplete();
      }, 1500);
    } catch (error) {
      console.error('Failed to save title:', error);
      toast({
        title: "Save failed",
        description: "You can skip this step or try again",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-hanok-teal" />
      </div>
    );
  }

  if (!title) {
    return (
      <div className="text-center py-8 text-gray-600">
        <p>Unable to load title. Please skip this step.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="group hover:shadow-lg transition-all duration-300 border-2 border-hanok-teal/20">
        <CardContent className="p-0">
          {/* Image Section */}
          <div className="relative h-48 bg-gradient-to-br from-porcelain-blue-100 to-hanok-teal/10 overflow-hidden">
            {title.title_image && (
              <img
                src={title.title_image}
                alt={title.title_name_en || title.title_name_kr}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback if image fails to load
                  e.currentTarget.style.display = 'none';
                }}
              />
            )}
          </div>

          {/* Content Section */}
          <div className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                {/* Title */}
                <h3 className="font-semibold text-lg text-midnight-ink mb-1">
                  {title.title_name_en || title.title_name_kr}
                </h3>

                {/* Korean title (if both exist) */}
                {title.title_name_en && title.title_name_kr && (
                  <p className="text-sm text-midnight-ink-600 mb-2">
                    {title.title_name_kr}
                  </p>
                )}

                {/* Badges */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {Array.isArray(title.genre) && title.genre.slice(0, 2).map((g: string, idx: number) => (
                    <span key={idx} className="inline-block bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                      {g}
                    </span>
                  ))}
                  {title.content_format && (
                    <span className="inline-block bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs">
                      {title.content_format}
                    </span>
                  )}
                </div>

                {/* Synopsis */}
                {title.synopsis && (
                  <p className="text-sm text-midnight-ink-600 line-clamp-2 leading-relaxed">
                    {title.synopsis}
                  </p>
                )}
              </div>

              {/* Heart Icon */}
              <button
                onClick={handleSaveTitle}
                disabled={isSaving || isSaved}
                className={`transition-all duration-300 flex-shrink-0 ${
                  isSaved
                    ? 'text-pink-500 scale-125'
                    : 'text-gray-400 hover:text-pink-500 hover:scale-110'
                } disabled:opacity-50`}
              >
                {isSaving ? (
                  <Loader2 className="w-8 h-8 animate-spin" />
                ) : (
                  <Heart
                    className={`w-8 h-8 ${isSaved ? 'fill-current' : ''}`}
                  />
                )}
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <p className="text-center text-sm text-gray-600">
        {isSaved ? (
          <span className="text-hanok-teal font-medium">✓ Title saved to your favorites!</span>
        ) : (
          'Click the heart icon above to save this title'
        )}
      </p>

      <p className="text-xs text-gray-500 text-center">
        This will actually save the title to your account
      </p>
    </div>
  );
}
