
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, Filter, TrendingUp, Star } from "lucide-react";
import { TitleCard } from "@/components/TitleCard";
import { titlesService, type Title } from "@/services/titlesService";
import { useToast } from "@/components/ui/use-toast";

export default function Browse() {
  const { toast } = useToast();
  const [titles, setTitles] = useState<Title[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [genreFilter, setGenreFilter] = useState("all");
  const [formatFilter, setFormatFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTitles();
  }, []);

  const loadTitles = async () => {
    try {
      setLoading(true);
      const data = await titlesService.getAllTitles();
      setTitles(data);
    } catch (error) {
      console.error("Error loading titles:", error);
      toast({ title: "Error loading titles", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    try {
      setLoading(true);
      const filters: any = {};
      if (genreFilter !== "all") filters.genre = genreFilter;
      if (formatFilter !== "all") filters.content_format = formatFilter;

      const data = await titlesService.searchTitles(searchTerm, filters);
      setTitles(data);
    } catch (error) {
      console.error("Error searching titles:", error);
      toast({ title: "Error searching titles", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const sortedTitles = [...titles].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case "oldest":
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      case "views":
        return b.views - a.views;
      case "likes":
        return b.likes - a.likes;
      case "rating":
        return (b.rating || 0) - (a.rating || 0);
      default:
        return 0;
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Browse Titles</h1>
          <p className="text-slate-400">Discover intellectual property and content</p>
        </div>
      </div>

      <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white">Content Library</CardTitle>
          <CardDescription className="text-slate-400">
            Browse and search through available intellectual property
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
              <Input
                placeholder="Search titles, authors, or content..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                className="pl-10 bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-400"
              />
            </div>
            
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button id="browse-genre-filter-btn" variant="outline" className="border-slate-600 text-slate-300 hover:text-white">
                    <Filter className="mr-2 h-4 w-4" />
                    Genre
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-slate-800 border-slate-700">
                  <DropdownMenuItem onClick={() => setGenreFilter("all")} className="text-slate-300 hover:text-white hover:bg-slate-700">All Genres</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setGenreFilter("romance")} className="text-slate-300 hover:text-white hover:bg-slate-700">Romance</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setGenreFilter("fantasy")} className="text-slate-300 hover:text-white hover:bg-slate-700">Fantasy</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setGenreFilter("action")} className="text-slate-300 hover:text-white hover:bg-slate-700">Action</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setGenreFilter("drama")} className="text-slate-300 hover:text-white hover:bg-slate-700">Drama</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setGenreFilter("comedy")} className="text-slate-300 hover:text-white hover:bg-slate-700">Comedy</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setGenreFilter("thriller")} className="text-slate-300 hover:text-white hover:bg-slate-700">Thriller</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setGenreFilter("horror")} className="text-slate-300 hover:text-white hover:bg-slate-700">Horror</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button id="browse-format-filter-btn" variant="outline" className="border-slate-600 text-slate-300 hover:text-white">
                    <Filter className="mr-2 h-4 w-4" />
                    Format
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-slate-800 border-slate-700">
                  <DropdownMenuItem onClick={() => setFormatFilter("all")} className="text-slate-300 hover:text-white hover:bg-slate-700">All Formats</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFormatFilter("webtoon")} className="text-slate-300 hover:text-white hover:bg-slate-700">Webtoon</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFormatFilter("web_novel")} className="text-slate-300 hover:text-white hover:bg-slate-700">Web Novel</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFormatFilter("book")} className="text-slate-300 hover:text-white hover:bg-slate-700">Book</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFormatFilter("script")} className="text-slate-300 hover:text-white hover:bg-slate-700">Script</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFormatFilter("game")} className="text-slate-300 hover:text-white hover:bg-slate-700">Game</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFormatFilter("animation")} className="text-slate-300 hover:text-white hover:bg-slate-700">Animation</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button id="browse-sort-filter-btn" variant="outline" className="border-slate-600 text-slate-300 hover:text-white">
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Sort
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-slate-800 border-slate-700">
                  <DropdownMenuItem onClick={() => setSortBy("newest")} className="text-slate-300 hover:text-white hover:bg-slate-700">Newest First</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("oldest")} className="text-slate-300 hover:text-white hover:bg-slate-700">Oldest First</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("views")} className="text-slate-300 hover:text-white hover:bg-slate-700">Most Views</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("likes")} className="text-slate-300 hover:text-white hover:bg-slate-700">Most Likes</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("rating")} className="text-slate-300 hover:text-white hover:bg-slate-700">Highest Rating</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button 
                id="browse-search-btn"
                onClick={handleSearch}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                Search
              </Button>
            </div>
          </div>

          {/* Results */}
          {loading ? (
            <div className="text-center text-slate-400 py-8">Loading titles...</div>
          ) : sortedTitles.length === 0 ? (
            <div className="text-center text-slate-400 py-8">
              No titles found. Try adjusting your search criteria.
            </div>
          ) : (
            <>
              <div className="text-slate-400 mb-4">
                {sortedTitles.length} title{sortedTitles.length !== 1 ? 's' : ''} found
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedTitles.map((title) => (
                  <TitleCard
                    key={title.title_id}
                    title={title}
                    showActions={false}
                  />
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
