
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
    
    const matchesGenre = genreFilter === "all" || title.genre === genreFilter;
    const matchesFormat = formatFilter === "all" || title.content_format === formatFilter;
    
    return matchesSearch && matchesGenre && matchesFormat;
  });

  if (showForm) {
    return (
      <div className="space-y-6">
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">My Titles</h1>
          <p className="text-slate-400">Manage your intellectual property portfolio</p>
        </div>
        <Button 
          onClick={() => setShowForm(true)}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add New Title
        </Button>
      </div>

      <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white">Title Library</CardTitle>
          <CardDescription className="text-slate-400">
            Your intellectual property titles and content
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
              <Input
                placeholder="Search titles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-400"
              />
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="border-slate-600 text-slate-300 hover:text-white">
                  <Filter className="mr-2 h-4 w-4" />
                  Genre: {genreFilter === "all" ? "All" : genreFilter}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-slate-800 border-slate-700">
                <DropdownMenuItem 
                  onClick={() => setGenreFilter("all")}
                  className="text-slate-300 hover:text-white hover:bg-slate-700"
                >
                  All Genres
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setGenreFilter("romance")} className="text-slate-300 hover:text-white hover:bg-slate-700">Romance</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setGenreFilter("fantasy")} className="text-slate-300 hover:text-white hover:bg-slate-700">Fantasy</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setGenreFilter("action")} className="text-slate-300 hover:text-white hover:bg-slate-700">Action</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setGenreFilter("drama")} className="text-slate-300 hover:text-white hover:bg-slate-700">Drama</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="border-slate-600 text-slate-300 hover:text-white">
                  <Filter className="mr-2 h-4 w-4" />
                  Format: {formatFilter === "all" ? "All" : formatFilter}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-slate-800 border-slate-700">
                <DropdownMenuItem 
                  onClick={() => setFormatFilter("all")}
                  className="text-slate-300 hover:text-white hover:bg-slate-700"
                >
                  All Formats
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFormatFilter("webtoon")} className="text-slate-300 hover:text-white hover:bg-slate-700">Webtoon</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFormatFilter("web_novel")} className="text-slate-300 hover:text-white hover:bg-slate-700">Web Novel</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFormatFilter("book")} className="text-slate-300 hover:text-white hover:bg-slate-700">Book</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFormatFilter("script")} className="text-slate-300 hover:text-white hover:bg-slate-700">Script</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Titles Grid */}
          {loading ? (
            <div className="text-center text-slate-400 py-8">Loading titles...</div>
          ) : filteredTitles.length === 0 ? (
            <div className="text-center text-slate-400 py-8">
              {titles.length === 0 ? "No titles yet. Create your first title!" : "No titles match your filters."}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
