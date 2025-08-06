
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Search, Filter } from "lucide-react";
import { TitleCard } from "@/components/TitleCard";
import { TitleForm } from "@/components/TitleForm";
import { titlesService, type Title } from "@/services/titlesService";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/use-toast";

export default function Content() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [titles, setTitles] = useState<Title[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [genreFilter, setGenreFilter] = useState("all");
  const [formatFilter, setFormatFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editingTitle, setEditingTitle] = useState<Title | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadTitles();
    }
  }, [user]);

  const loadTitles = async () => {
    try {
      setLoading(true);
      const data = await titlesService.getTitlesByCreator(user!.id);
      setTitles(data);
    } catch (error) {
      console.error("Error loading titles:", error);
      toast({ title: "Error loading titles", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTitle = (savedTitle: Title) => {
    if (editingTitle) {
      setTitles(titles.map(t => t.title_id === savedTitle.title_id ? savedTitle : t));
    } else {
      setTitles([savedTitle, ...titles]);
    }
    setShowForm(false);
    setEditingTitle(null);
  };

  const handleEditTitle = (title: Title) => {
    setEditingTitle(title);
    setShowForm(true);
  };

  const handleDeleteTitle = async (titleId: string) => {
    if (!confirm("Are you sure you want to delete this title?")) return;

    try {
      await titlesService.deleteTitle(titleId);
      setTitles(titles.filter(t => t.title_id !== titleId));
      toast({ title: "Title deleted successfully" });
    } catch (error) {
      console.error("Error deleting title:", error);
      toast({ title: "Error deleting title", variant: "destructive" });
    }
  };

  const filteredTitles = titles.filter(title => {
    const matchesSearch = searchTerm === "" || 
      title.title_name_kr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      title.title_name_en?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      title.author?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesGenre = genreFilter === "all" || 
      (Array.isArray(title.genre) ? title.genre.includes(genreFilter) : title.genre === genreFilter);
    const matchesFormat = formatFilter === "all" || title.content_format === formatFilter;
    
    return matchesSearch && matchesGenre && matchesFormat;
  });

  if (showForm) {
    return (
      <div>
        <TitleForm
          title={editingTitle || undefined}
          onSave={handleSaveTitle}
          onCancel={() => {
            setShowForm(false);
            setEditingTitle(null);
          }}
        />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-12">
        <div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">My Titles</h1>
          <p className="text-gray-600">Manage your intellectual property portfolio</p>
        </div>
        <div className="flex items-center gap-4">
          <Button 
            onClick={() => setShowForm(true)}
            className="bg-hanok-teal hover:bg-hanok-teal/90 text-white"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add New Title
          </Button>
          <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
        </div>
      </div>

      <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
        <CardHeader>
          <CardTitle className="text-gray-800">Title Library</CardTitle>
          <CardDescription className="text-gray-600">
            Your intellectual property titles and content
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search titles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                  }
                }}
                className="pl-10 py-2 bg-gray-50 border-0 rounded-lg outline-none focus:ring-2 focus:ring-hanok-teal text-gray-800 w-full"
              />
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="border-gray-300 text-gray-700 hover:text-gray-800 hover:bg-gray-50">
                  <Filter className="mr-2 h-4 w-4" />
                  Genre: {genreFilter === "all" ? "All" : genreFilter}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-white border-gray-200">
                <DropdownMenuItem 
                  onClick={() => setGenreFilter("all")}
                  className="text-gray-700 hover:text-gray-800 hover:bg-gray-50"
                >
                  All Genres
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setGenreFilter("romance")} className="text-gray-700 hover:text-gray-800 hover:bg-gray-50">Romance</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setGenreFilter("fantasy")} className="text-gray-700 hover:text-gray-800 hover:bg-gray-50">Fantasy</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setGenreFilter("action")} className="text-gray-700 hover:text-gray-800 hover:bg-gray-50">Action</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setGenreFilter("drama")} className="text-gray-700 hover:text-gray-800 hover:bg-gray-50">Drama</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="border-gray-300 text-gray-700 hover:text-gray-800 hover:bg-gray-50">
                  <Filter className="mr-2 h-4 w-4" />
                  Format: {formatFilter === "all" ? "All" : formatFilter}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-white border-gray-200">
                <DropdownMenuItem 
                  onClick={() => setFormatFilter("all")}
                  className="text-gray-700 hover:text-gray-800 hover:bg-gray-50"
                >
                  All Formats
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFormatFilter("webtoon")} className="text-gray-700 hover:text-gray-800 hover:bg-gray-50">Webtoon</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFormatFilter("web_novel")} className="text-gray-700 hover:text-gray-800 hover:bg-gray-50">Web Novel</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFormatFilter("book")} className="text-gray-700 hover:text-gray-800 hover:bg-gray-50">Book</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFormatFilter("script")} className="text-gray-700 hover:text-gray-800 hover:bg-gray-50">Script</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Titles Grid */}
          {loading ? (
            <div className="text-center text-gray-600 py-8">Loading titles...</div>
          ) : filteredTitles.length === 0 ? (
            <div className="text-center text-gray-600 py-8">
              {titles.length === 0 ? "No titles yet. Create your first title!" : "No titles match your filters."}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredTitles.map((title) => (
                <TitleCard
                  key={title.title_id}
                  title={title}
                  onEdit={handleEditTitle}
                  onDelete={handleDeleteTitle}
                  showActions={true}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
