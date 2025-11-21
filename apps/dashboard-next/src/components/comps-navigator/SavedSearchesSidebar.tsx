/**
 * SavedSearchesSidebar Component
 *
 * Shows recent searches and bookmarked searches
 * Allows loading previous searches
 */

import { useEffect, useState } from 'react';
import { Clock, Bookmark, Trash2, Star } from 'lucide-react';
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
        compsNavigatorService.getRecentSearches(userEmail, 5),
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
      loadSearches(); // Refresh lists
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
      loadSearches(); // Refresh lists
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
      <div className="w-80 border-l border-gray-200 p-4">
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="w-80 border-l border-gray-300 bg-gray-50 p-6 space-y-6 overflow-y-auto">
      {/* Bookmarked Searches */}
      {bookmarkedSearches.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2 uppercase tracking-wide">
            <Bookmark className="h-4 w-4 text-hanok-teal" />
            Bookmarked
          </h3>
          <div className="space-y-3">
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
          <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2 uppercase tracking-wide">
            <Clock className="h-4 w-4 text-hanok-teal" />
            Recent
          </h3>
          <div className="space-y-3">
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

      {recentSearches.length === 0 && bookmarkedSearches.length === 0 && (
        <div className="text-center py-12">
          <Clock className="h-8 w-8 text-gray-400 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-600">No saved searches yet</p>
          <p className="text-xs text-gray-500 mt-1">Your searches will appear here</p>
        </div>
      )}
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
    <div className="p-4 bg-white border border-gray-300 rounded-xl hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group cursor-pointer">
      <div className="flex items-start justify-between mb-3" onClick={onLoad}>
        <div className="flex-1">
          <p className="text-sm font-bold text-gray-900 mb-1.5 line-clamp-2 group-hover:text-hanok-teal transition-colors">
            {search.search_name || search.comp_titles.join(' + ')}
          </p>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {search.comp_titles.map((title, idx) => (
              <span
                key={idx}
                className="bg-gradient-to-r from-cyan-100 to-cyan-50 text-cyan-800 px-2 py-0.5 rounded-md text-xs font-medium border border-cyan-200"
              >
                {title}
              </span>
            ))}
          </div>
          {search.refinement_text && (
            <p className="text-xs text-gray-500 italic line-clamp-2 mt-2">
              "{search.refinement_text}"
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-gray-200">
        <div className="flex items-center gap-2 text-xs font-medium text-gray-600">
          <span className="bg-gradient-to-r from-emerald-100 to-emerald-50 text-emerald-800 px-2 py-0.5 rounded-md border border-emerald-200">
            {search.result_count} matches
          </span>
          <span>•</span>
          <span>{Math.round(search.avg_match_score)}%</span>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleBookmark();
            }}
            className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
            title={search.is_bookmarked ? 'Remove bookmark' : 'Bookmark'}
          >
            <Star
              className={`h-4 w-4 ${search.is_bookmarked ? 'fill-hanok-teal text-hanok-teal' : 'text-gray-400'}`}
            />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1.5 hover:bg-red-100 rounded-md transition-colors"
            title="Delete"
          >
            <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-500 transition-colors" />
          </button>
        </div>
      </div>
    </div>
  );
}
