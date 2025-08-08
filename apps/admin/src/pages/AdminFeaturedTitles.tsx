import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Search, Plus, Trash2, Edit3, X } from "lucide-react";
import { titlesService, type Title } from "@/services/titlesService";
import { featuredService, type FeaturedWithTitle } from "@/services/featuredService";
import AdminLayout from "@/components/layout/AdminLayout";
import { toast } from "sonner";

export default function AdminFeaturedTitles() {
  const [featuredTitles, setFeaturedTitles] = useState<FeaturedWithTitle[]>([]);
  const [allTitles, setAllTitles] = useState<Title[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [editNoteValue, setEditNoteValue] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [addTitleSearch, setAddTitleSearch] = useState("");
  const [selectedTitle, setSelectedTitle] = useState<Title | null>(null);
  const [newTitleNote, setNewTitleNote] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load featured titles and all titles
      const [featured, titles] = await Promise.all([
        featuredService.getAllFeatured(),
        titlesService.getAllTitles()
      ]);
      
      setFeaturedTitles(featured);
      setAllTitles(titles);
      
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFeatured = async (featuredId: string, titleName: string) => {
    if (!confirm(`Remove "${titleName}" from featured titles?`)) return;

    try {
      await featuredService.removeFeaturedTitle(featuredId);
      await loadData();
      toast.success("Title removed from featured");
    } catch (error) {
      console.error("Error removing featured title:", error);
      toast.error("Failed to remove featured title");
    }
  };

  const handleUpdateNote = async (featuredId: string) => {
    try {
      await featuredService.updateFeaturedNote(featuredId, editNoteValue);
      setEditingNote(null);
      setEditNoteValue("");
      await loadData();
      toast.success("Note updated successfully");
    } catch (error) {
      console.error("Error updating note:", error);
      toast.error("Failed to update note");
    }
  };

  const handleAddFeatured = async () => {
    if (!selectedTitle) {
      toast.error("Please select a title");
      return;
    }

    try {
      // Check if already featured
      const isAlreadyFeatured = await featuredService.isTitleFeatured(selectedTitle.title_id);
      if (isAlreadyFeatured) {
        toast.error("This title is already featured");
        return;
      }

      await featuredService.addFeaturedTitle(selectedTitle.title_id, newTitleNote);
      setIsAddDialogOpen(false);
      setSelectedTitle(null);
      setNewTitleNote("");
      setAddTitleSearch("");
      await loadData();
      toast.success("Title added to featured");
    } catch (error) {
      console.error("Error adding featured title:", error);
      toast.error("Failed to add featured title");
    }
  };

  const startEditingNote = (featuredId: string, currentNote: string | null) => {
    setEditingNote(featuredId);
    setEditNoteValue(currentNote || "");
  };

  const cancelEditingNote = () => {
    setEditingNote(null);
    setEditNoteValue("");
  };

  const filteredFeaturedTitles = featuredTitles.filter(featured => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    const title = featured.titles;
    return (
      title.title_name_en?.toLowerCase().includes(searchLower) ||
      title.title_name_kr?.toLowerCase().includes(searchLower) ||
      featured.note?.toLowerCase().includes(searchLower) ||
      title.genre?.toLowerCase().includes(searchLower)
    );
  });

  const availableTitles = allTitles.filter(title => {
    const isNotFeatured = !featuredTitles.some(featured => featured.title_id === title.title_id);
    if (!addTitleSearch) return isNotFeatured;
    
    const searchLower = addTitleSearch.toLowerCase();
    return isNotFeatured && (
      title.title_name_en?.toLowerCase().includes(searchLower) ||
      title.title_name_kr?.toLowerCase().includes(searchLower)
    );
  });

  const formatGenre = (genre: string | string[]) => {
    if (Array.isArray(genre)) {
      return genre.map(g => g.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())).join(', ');
    }
    return genre.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-5xl lg:text-6xl font-bold text-midnight-ink leading-tight mb-4">
              FEATURED TITLES
            </h1>
            <p className="text-xl text-midnight-ink-600 leading-relaxed">
              Manage which titles are featured on the homepage.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-midnight-ink-600 text-lg font-medium">
              {filteredFeaturedTitles.length} featured titles
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-hanok-teal hover:bg-hanok-teal/90 text-white px-6 py-3 rounded-lg font-medium">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Featured Title
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add Featured Title</DialogTitle>
                  <DialogDescription>
                    Search and select a title to add to the featured collection.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Search Titles
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Search for titles to add..."
                        value={addTitleSearch}
                        onChange={(e) => setAddTitleSearch(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="max-h-60 overflow-y-auto border rounded-lg">
                    {availableTitles.slice(0, 20).map((title) => (
                      <div
                        key={title.title_id}
                        className={`p-3 border-b cursor-pointer hover:bg-gray-50 ${
                          selectedTitle?.title_id === title.title_id ? 'bg-hanok-teal/10' : ''
                        }`}
                        onClick={() => setSelectedTitle(title)}
                      >
                        <div className="font-medium text-gray-800">
                          {title.title_name_en || title.title_name_kr}
                        </div>
                        {title.title_name_en && title.title_name_kr && (
                          <div className="text-sm text-gray-500">{title.title_name_kr}</div>
                        )}
                        {title.genre && (Array.isArray(title.genre) ? title.genre.length > 0 : true) && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {Array.isArray(title.genre) ? (
                              title.genre.slice(0, 2).map((g, idx) => (
                                <span key={idx} className="inline-block px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                                  {formatGenre(g)}
                                </span>
                              ))
                            ) : (
                              <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                                {formatGenre(title.genre)}
                              </span>
                            )}
                            {Array.isArray(title.genre) && title.genre.length > 2 && (
                              <span className="text-xs text-gray-500">+{title.genre.length - 2}</span>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                    {availableTitles.length === 0 && (
                      <div className="p-4 text-center text-gray-500">
                        No available titles found
                      </div>
                    )}
                  </div>

                  {selectedTitle && (
                    <div className="p-3 bg-hanok-teal/5 border border-hanok-teal/20 rounded-lg">
                      <div className="font-medium text-gray-800 mb-2">
                        Selected: {selectedTitle.title_name_en || selectedTitle.title_name_kr}
                      </div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Note (optional)
                      </label>
                      <Textarea
                        placeholder="Add a note about why this title is featured..."
                        value={newTitleNote}
                        onChange={(e) => setNewTitleNote(e.target.value)}
                        className="min-h-[80px]"
                      />
                    </div>
                  )}
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleAddFeatured}
                    disabled={!selectedTitle}
                    className="bg-hanok-teal hover:bg-hanok-teal/90"
                  >
                    Add to Featured
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-midnight-ink-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Search featured titles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 text-lg bg-porcelain-blue-50 border-0 rounded-2xl outline-none focus:ring-2 focus:ring-hanok-teal text-midnight-ink"
          />
        </div>

        {/* Featured Titles Table */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {loading ? (
            <div className="px-6 py-12 text-center text-gray-500">
              Loading featured titles...
            </div>
          ) : filteredFeaturedTitles.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="w-20">Image</TableHead>
                  <TableHead className="w-80">Title</TableHead>
                  <TableHead className="w-32">Genre</TableHead>
                  <TableHead className="flex-1">Note</TableHead>
                  <TableHead className="w-32">Added</TableHead>
                  <TableHead className="w-32">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFeaturedTitles.map((featured) => {
                  const title = featured.titles;
                  return (
                    <TableRow key={featured.id} className="hover:bg-gray-50">
                      <TableCell>
                        <Link to={`/titles/${title.title_id}`}>
                          {title.title_image ? (
                            <div className="w-12 h-16 bg-gray-200 rounded-lg overflow-hidden">
                              <img 
                                src={title.title_image} 
                                alt={title.title_name_en || title.title_name_kr}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  e.currentTarget.parentElement!.classList.add('flex', 'items-center', 'justify-center');
                                  e.currentTarget.parentElement!.innerHTML = '<span class="text-xs text-gray-400">No Image</span>';
                                }}
                              />
                            </div>
                          ) : (
                            <div className="w-12 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                              <span className="text-xs text-gray-400">No Image</span>
                            </div>
                          )}
                        </Link>
                      </TableCell>
                      
                      <TableCell>
                        <Link to={`/titles/${title.title_id}`} className="hover:text-hanok-teal">
                          <div className="font-medium text-gray-800">
                            {title.title_name_en || title.title_name_kr}
                          </div>
                          {title.title_name_en && title.title_name_kr && (
                            <div className="text-sm text-gray-500 mt-1">
                              {title.title_name_kr}
                            </div>
                          )}
                        </Link>
                      </TableCell>
                      
                      <TableCell>
                        {title.genre && (Array.isArray(title.genre) ? title.genre.length > 0 : true) ? (
                          <div className="flex flex-wrap gap-1">
                            {Array.isArray(title.genre) ? (
                              title.genre.slice(0, 2).map((g, idx) => (
                                <span key={idx} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-hanok-teal/10 text-hanok-teal">
                                  {formatGenre(g)}
                                </span>
                              ))
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-hanok-teal/10 text-hanok-teal">
                                {formatGenre(title.genre)}
                              </span>
                            )}
                            {Array.isArray(title.genre) && title.genre.length > 2 && (
                              <span className="text-xs text-gray-500">+{title.genre.length - 2}</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        {editingNote === featured.id ? (
                          <div className="space-y-2">
                            <Textarea
                              value={editNoteValue}
                              onChange={(e) => setEditNoteValue(e.target.value)}
                              className="min-h-[60px] text-sm"
                              placeholder="Add a note..."
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleUpdateNote(featured.id)}
                                className="bg-hanok-teal hover:bg-hanok-teal/90 text-white px-3 py-1 text-xs"
                              >
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={cancelEditingNote}
                                className="px-3 py-1 text-xs"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm text-gray-600">
                            {featured.note || (
                              <span className="text-gray-400 italic">No note</span>
                            )}
                          </div>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        <div className="text-sm text-gray-500">
                          {new Date(featured.created_at).toLocaleDateString()}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => startEditingNote(featured.id, featured.note)}
                            disabled={editingNote === featured.id}
                            className="p-2"
                          >
                            <Edit3 className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRemoveFeatured(
                              featured.id, 
                              title.title_name_en || title.title_name_kr || 'Unknown Title'
                            )}
                            className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="px-6 py-12 text-center text-gray-500">
              {searchTerm ? "No featured titles found matching your search." : "No featured titles available."}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}