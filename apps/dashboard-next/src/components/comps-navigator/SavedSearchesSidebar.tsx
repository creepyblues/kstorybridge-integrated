/**
 * SavedSearchesSidebar Component
 *
 * Floating sidebar displaying saved comp searches
 * Unified design pattern across Chat, Comps Navigator, and Mandates pages
 */

import { useEffect, useState } from 'react';
import { Compass, Clock, Bookmark, Trash2, Star } from 'lucide-react';
import { CompSearch, compsNavigatorService } from '@/services/compsNavigatorService';
import { useToast } from '@/hooks/use-toast';

interface SavedSearchesSidebarProps {
  userEmail: string;
  onLoadSearch: (search: CompSearch) => void;
}

export default function SavedSearchesSidebar({ userEmail, onLoadSearch }: SavedSearchesSidebarProps) {
  const [recentSearches, setRecentSearches] = useState<CompSearch[]>([]);
  const [bookmarkedSearches, setBookmarkedSearches] = useState<CompSearch[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadSearches();
  }, [userEmail]);

  const loadSearches = async () => {
    try {
      setLoading(true);
      const [recent, bookmarked] = await Promise.all([
        compsNavigatorService.getRecentSearches(userEmail, 10),
        compsNavigatorService.getBookmarkedSearches(userEmail)
      ]);
      setRecentSearches(recent);
      setBookmarkedSearches(bookmarked);
    } catch (error) {
      console.error('Failed to load searches:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSearch = async (searchId: string) => {
    try {
      await compsNavigatorService.deleteSearch(searchId);
      toast({
        title: "Search Deleted",
        description: "The search has been removed from your history"
      });
      loadSearches();
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: "Failed to delete search. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleToggleBookmark = async (search: CompSearch) => {
    try {
      if (search.is_bookmarked) {
        await compsNavigatorService.unbookmarkSearch(search.id);
        toast({
          title: "Bookmark Removed",
          description: "Search removed from bookmarks"
        });
      } else {
        const name = prompt('Name this search:', search.comp_titles.join(' + '));
        if (name) {
          await compsNavigatorService.bookmarkSearch(search.id, name);
          toast({
            title: "Search Bookmarked",
            description: "You can find this search in your bookmarks"
          });
        }
      }
      loadSearches();
    } catch (error) {
      toast({
        title: "Bookmark Failed",
        description: "Failed to update bookmark. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="fixed right-0 top-0 h-screen w-80 bg-white shadow-2xl flex items-center justify-center z-40">
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="hidden md:flex fixed right-0 top-0 h-screen w-80 bg-white shadow-2xl flex-col z-40">
      {/* Header */}
      <div className="bg-gradient-to-r from-hanok-teal/5 to-hanok-teal/10 border-b border-gray-200 px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="bg-hanok-teal/10 p-2 rounded-lg">
            <Compass className="h-5 w-5 text-hanok-teal" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Search History</h2>
            <p className="text-xs text-gray-600">Saved & recent searches</p>
          </div>
        </div>
      </div>

      {/* Searches List - Scrollable */}
      <div className="flex-1 overflow-y-auto px-6 py-4 scrollbar-hide space-y-6">
        {/* Bookmarked Searches */}
        {bookmarkedSearches.length > 0 && (
          <div>
            <h3 className="text-xs font-bold text-gray-600 mb-3 flex items-center gap-2 uppercase tracking-wide">
              <Bookmark className="h-3.5 w-3.5" />
              Bookmarked
            </h3>
            <div className="space-y-2">
              {bookmarkedSearches.map((search) => (
                <SearchItem
                  key={search.id}
                  search={search}
                  onLoad={() => onLoadSearch(search)}
                  onDelete={() => handleDeleteSearch(search.id)}
                  onToggleBookmark={() => handleToggleBookmark(search)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Recent Searches */}
        {recentSearches.length > 0 && (
          <div>
            <h3 className="text-xs font-bold text-gray-600 mb-3 flex items-center gap-2 uppercase tracking-wide">
              <Clock className="h-3.5 w-3.5" />
              Recent
            </h3>
            <div className="space-y-2">
              {recentSearches.map((search) => (
                <SearchItem
                  key={search.id}
                  search={search}
                  onLoad={() => onLoadSearch(search)}
                  onDelete={() => handleDeleteSearch(search.id)}
                  onToggleBookmark={() => handleToggleBookmark(search)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {recentSearches.length === 0 && bookmarkedSearches.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="bg-gray-100 rounded-full p-4 mb-4">
              <Compass className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-sm font-semibold text-gray-900 mb-1">No saved searches</p>
            <p className="text-xs text-gray-500">Your searches will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Individual Search Item Component
interface SearchItemProps {
  search: CompSearch;
  onLoad: () => void;
  onDelete: () => void;
  onToggleBookmark: () => void;
}

function SearchItem({ search, onLoad, onDelete, onToggleBookmark }: SearchItemProps) {
  return (
    <div className="group p-3 rounded-lg border border-gray-200 hover:border-hanok-teal/50 hover:shadow-sm transition-all duration-200 cursor-pointer bg-white">
      <div className="flex items-start justify-between mb-2" onClick={onLoad}>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 mb-1.5 line-clamp-1 group-hover:text-hanok-teal transition-colors">
            {search.search_name || search.comp_titles.join(' + ')}
          </p>
          <div className="flex flex-wrap gap-1 mb-2">
            {search.comp_titles.slice(0, 2).map((title, idx) => (
              <span
                key={idx}
                className="bg-hanok-teal/10 text-hanok-teal px-1.5 py-0.5 rounded text-xs font-medium"
              >
                {title.length > 12 ? title.substring(0, 12) + '...' : title}
              </span>
            ))}
            {search.comp_titles.length > 2 && (
              <span className="text-xs text-gray-500">+{search.comp_titles.length - 2}</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <span className="font-medium">{search.result_count} matches</span>
          <span className="text-gray-300">•</span>
          <span>{Math.round(search.avg_match_score)}%</span>
        </div>

        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleBookmark();
            }}
            className="p-1 hover:bg-hanok-teal/10 rounded transition-colors"
            title={search.is_bookmarked ? 'Remove bookmark' : 'Bookmark'}
          >
            <Star
              className={`h-3.5 w-3.5 ${search.is_bookmarked ? 'fill-hanok-teal text-hanok-teal' : 'text-gray-400'}`}
            />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1 hover:bg-red-50 rounded transition-colors"
            title="Delete"
          >
            <Trash2 className="h-3.5 w-3.5 text-gray-400 hover:text-red-600" />
          </button>
        </div>
      </div>
    </div>
  );
}
