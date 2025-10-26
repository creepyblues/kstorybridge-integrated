import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { titlesService, Title } from '@/services/titlesService';
import { Button } from '@/components/ui/button';
import { BuyerLayout } from '@/components/layout/BuyerLayout';
import { TitleCard } from '@/components/title/TitleCard';
import { Heart, Loader2 } from 'lucide-react';

export default function Saved() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [favorites, setFavorites] = useState<Title[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchFavorites = async () => {
      if (!user?.id) return;

      setLoading(true);
      try {
        const data = await titlesService.getFavorites(user.id);
        setFavorites(data);
      } catch (error: any) {
        console.error('Error fetching favorites:', error);
        toast({
          title: 'Error',
          description: error.message || 'Failed to fetch saved titles',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, [user?.id, toast]);

  const handleRemoveFavorite = async (titleId: string) => {
    if (!user?.id) return;

    setRemovingId(titleId);
    try {
      await titlesService.removeFavorite(titleId, user.id);
      setFavorites((prev) => prev.filter((t) => t.title_id !== titleId));
      toast({
        title: 'Removed from favorites',
        description: 'Title removed from your saved list',
      });
    } catch (error: any) {
      console.error('Error removing favorite:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove favorite',
        variant: 'destructive',
      });
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <BuyerLayout>
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-black">Saved Titles</h1>
          <p className="text-sm text-gray-600 mt-1">Your favorite Korean content</p>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : favorites.length === 0 ? (
          <div className="text-center py-12">
            <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-2">No saved titles yet</p>
            <p className="text-gray-400 text-sm mb-6">
              Save titles to find them easily later
            </p>
            <Button
              variant="outline"
              onClick={() => navigate('/buyers/titles')}
              className="border-gray-300"
            >
              Browse Titles
            </Button>
          </div>
        ) : (
          <>
            <div className="mb-4 text-sm text-gray-600">
              {favorites.length} saved title{favorites.length !== 1 ? 's' : ''}
            </div>

            {/* Favorites Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {favorites.map((title) => (
                <TitleCard
                  key={title.title_id}
                  title={title}
                  variant="grid"
                  onRemove={handleRemoveFavorite}
                  removing={removingId === title.title_id}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </BuyerLayout>
  );
}
