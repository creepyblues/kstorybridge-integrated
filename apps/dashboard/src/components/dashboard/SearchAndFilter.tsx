import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { 
  Search, 
  Filter, 
  X, 
  SlidersHorizontal,
  Star,
  Calendar,
  Eye
} from "lucide-react";

interface SearchAndFilterProps {
  onSearchSubmit: (search: string) => void;
  onFiltersChange: (filters: any) => void;
  totalResults?: number;
}

interface FilterState {
  genre: string;
  contentFormat: string;
  rating: string;
  sortBy: string;
  tags: string[];
}

const genres = [
  "All Genres", "Fantasy", "Romance", "Action", "Drama", "Comedy", 
  "Horror", "Mystery", "Sci-Fi", "Slice of Life", "Adventure"
];

const contentFormats = [
  "All Formats", "Webtoon", "Webnovel", "Video", "Audio"
];

const popularTags = [
  "School Life", "Supernatural", "Magic", "Time Travel", "Isekai",
  "Revenge", "Martial Arts", "System", "Regression", "Reincarnation"
];

export function SearchAndFilter({ 
  onSearchSubmit, 
  onFiltersChange, 
  totalResults = 0 
}: SearchAndFilterProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<FilterState>({
    genre: "All Genres",
    contentFormat: "All Formats",
    rating: "All Ratings",
    sortBy: "Most Popular",
    tags: []
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchSubmit(searchQuery.trim());
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    onSearchSubmit("");
  };

  const handleFilterChange = (key: keyof FilterState, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleTagToggle = (tag: string) => {
    const newTags = filters.tags.includes(tag)
      ? filters.tags.filter(t => t !== tag)
      : [...filters.tags, tag];
    
    handleFilterChange('tags', newTags);
  };

  const clearAllFilters = () => {
    const resetFilters = {
      genre: "All Genres",
      contentFormat: "All Formats",
      rating: "All Ratings",
      sortBy: "Most Popular",
      tags: []
    };
    setFilters(resetFilters);
    onFiltersChange(resetFilters);
  };

  const activeFilterCount = [
    filters.genre !== "All Genres",
    filters.contentFormat !== "All Formats", 
    filters.rating !== "All Ratings",
    filters.tags.length > 0
  ].filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-midnight-ink-500" />
        <Input
          type="text"
          placeholder="Search titles, authors, genres... (press Enter or click Search)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-12 pr-32 h-12 text-lg border-porcelain-blue-300 focus:border-hanok-teal focus:ring-hanok-teal/20 bg-snow-white"
        />
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-2">
          {searchQuery && (
            <Button
              type="button"
              onClick={handleClearSearch}
              variant="ghost"
              size="sm"
              className="text-midnight-ink-400 hover:text-midnight-ink-600"
            >
              Clear
            </Button>
          )}
          <Button
            type="submit"
            size="sm"
            className="bg-hanok-teal hover:bg-hanok-teal/90 text-white"
          >
            Search
          </Button>
        </div>
      </form>

      {/* Filter Controls */}
      <div className="flex flex-wrap items-center gap-6">
        {/* Quick Filters */}
        <Select value={filters.genre} onValueChange={(value) => handleFilterChange('genre', value)}>
          <SelectTrigger className="w-40 border-porcelain-blue-300 bg-snow-white">
            <SelectValue placeholder="Genre" />
          </SelectTrigger>
          <SelectContent>
            {genres.map((genre) => (
              <SelectItem key={genre} value={genre}>{genre}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.contentFormat} onValueChange={(value) => handleFilterChange('contentFormat', value)}>
          <SelectTrigger className="w-40 border-porcelain-blue-300 bg-snow-white">
            <SelectValue placeholder="Format" />
          </SelectTrigger>
          <SelectContent>
            {contentFormats.map((format) => (
              <SelectItem key={format} value={format}>{format}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.sortBy} onValueChange={(value) => handleFilterChange('sortBy', value)}>
          <SelectTrigger className="w-44 border-porcelain-blue-300 bg-snow-white">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Most Popular">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Most Popular
              </div>
            </SelectItem>
            <SelectItem value="Highest Rated">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4" />
                Highest Rated
              </div>
            </SelectItem>
            <SelectItem value="Recently Added">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Recently Added
              </div>
            </SelectItem>
            <SelectItem value="A-Z">A-Z</SelectItem>
          </SelectContent>
        </Select>

        {/* Advanced Filters */}
        <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              className="border-porcelain-blue-300 bg-snow-white hover:bg-porcelain-blue-50"
            >
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              More Filters
              {activeFilterCount > 0 && (
                <Badge className="ml-2 h-5 w-5 p-0 text-xs bg-sunrise-coral text-snow-white">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4 bg-snow-white border-porcelain-blue-300">
            <div className="space-y-4">
              <h4 className="font-semibold text-midnight-ink">Advanced Filters</h4>
              
              {/* Rating Filter */}
              <div>
                <label className="text-sm font-medium text-midnight-ink-700 mb-2 block">
                  Minimum Rating
                </label>
                <Select value={filters.rating} onValueChange={(value) => handleFilterChange('rating', value)}>
                  <SelectTrigger className="border-porcelain-blue-300">
                    <SelectValue placeholder="All Ratings" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All Ratings">All Ratings</SelectItem>
                    <SelectItem value="4.5+">4.5+ Stars</SelectItem>
                    <SelectItem value="4.0+">4.0+ Stars</SelectItem>
                    <SelectItem value="3.5+">3.5+ Stars</SelectItem>
                    <SelectItem value="3.0+">3.0+ Stars</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Tags */}
              <div>
                <label className="text-sm font-medium text-midnight-ink-700 mb-2 block">
                  Popular Tags
                </label>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                  {popularTags.map((tag) => (
                    <Button
                      key={tag}
                      variant="outline"
                      size="sm"
                      onClick={() => handleTagToggle(tag)}
                      className={`text-xs h-7 ${
                        filters.tags.includes(tag)
                          ? 'bg-hanok-teal text-snow-white border-hanok-teal hover:bg-hanok-teal-600'
                          : 'border-porcelain-blue-300 text-midnight-ink-600 hover:bg-porcelain-blue-50'
                      }`}
                    >
                      {tag}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Clear Filters */}
              {activeFilterCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                  className="w-full text-sunrise-coral hover:text-sunrise-coral-600 hover:bg-sunrise-coral/10"
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear All Filters
                </Button>
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* Clear All (visible when filters applied) */}
        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="text-sunrise-coral hover:text-sunrise-coral-600 hover:bg-sunrise-coral/10"
          >
            <X className="h-4 w-4 mr-2" />
            Clear
          </Button>
        )}
      </div>

      {/* Active Filters Display */}
      {(filters.tags.length > 0 || activeFilterCount > 0) && (
        <div className="flex flex-wrap gap-3 pt-2">
          {filters.genre !== "All Genres" && (
            <Badge variant="secondary" className="bg-hanok-teal-100 text-hanok-teal-700 border-0">
              Genre: {filters.genre}
              <button
                onClick={() => handleFilterChange('genre', 'All Genres')}
                className="ml-2 hover:text-sunrise-coral"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          
          {filters.contentFormat !== "All Formats" && (
            <Badge variant="secondary" className="bg-porcelain-blue-100 text-porcelain-blue-700 border-0">
              Format: {filters.contentFormat}
              <button
                onClick={() => handleFilterChange('contentFormat', 'All Formats')}
                className="ml-2 hover:text-sunrise-coral"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {filters.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="bg-warm-sand text-midnight-ink border-0">
              {tag}
              <button
                onClick={() => handleTagToggle(tag)}
                className="ml-2 hover:text-sunrise-coral"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Results Count */}
      <div className="text-sm text-midnight-ink-600 pt-2">
        {totalResults > 0 && (
          <span>Showing {totalResults.toLocaleString()} results</span>
        )}
      </div>
    </div>
  );
}