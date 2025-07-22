
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search } from "lucide-react";
import { titlesService, type Title } from "@/services/titlesService";
import { useToast } from "@/components/ui/use-toast";

export default function Titles() {
  const { toast } = useToast();
  const [titles, setTitles] = useState<Title[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
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

  const filteredTitles = titles.filter(title => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      title.title_name_kr.toLowerCase().includes(searchLower) ||
      title.title_name_en?.toLowerCase().includes(searchLower) ||
      title.author?.toLowerCase().includes(searchLower) ||
      title.genre?.toLowerCase().includes(searchLower)
    );
  });

  const formatGenre = (genre: string) => {
    return genre.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatContentFormat = (format: string) => {
    return format.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Titles</h1>
        <p className="text-slate-400">Browse and discover amazing content</p>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
        <Input
          placeholder="Search titles, authors, genres..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-400"
        />
      </div>

      <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white">All Titles</CardTitle>
          <CardDescription className="text-slate-400">
            {filteredTitles.length} titles found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center text-slate-400 py-8">Loading titles...</div>
          ) : filteredTitles.length === 0 ? (
            <div className="text-center text-slate-400 py-8">
              {searchTerm ? "No titles match your search." : "No titles available."}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700">
                  <TableHead className="text-slate-300">Title</TableHead>
                  <TableHead className="text-slate-300">Author</TableHead>
                  <TableHead className="text-slate-300">Genre</TableHead>
                  <TableHead className="text-slate-300">Format</TableHead>
                  <TableHead className="text-slate-300">Views</TableHead>
                  <TableHead className="text-slate-300">Likes</TableHead>
                  <TableHead className="text-slate-300">Rating</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTitles.map((title) => (
                  <TableRow key={title.title_id} className="border-slate-700 hover:bg-slate-800/30">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {title.title_image ? (
                          <div className="w-12 h-16 bg-slate-700 rounded border border-slate-600 flex-shrink-0 overflow-hidden">
                            <img 
                              src={title.title_image} 
                              alt={title.title_name_en || title.title_name_kr}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.parentElement!.classList.add('flex', 'items-center', 'justify-center');
                                e.currentTarget.parentElement!.innerHTML = '<span class="text-xs text-slate-500">No Image</span>';
                              }}
                            />
                          </div>
                        ) : (
                          <div className="w-12 h-16 bg-slate-700 rounded border border-slate-600 flex-shrink-0 flex items-center justify-center">
                            <span className="text-xs text-slate-500">No Image</span>
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-white">
                            <Link 
                              to={`/titles/${title.title_id}`}
                              className="text-blue-400 hover:text-blue-300"
                            >
                              {title.title_name_en || title.title_name_kr}
                            </Link>
                          </div>
                          {title.title_name_en && title.title_name_kr && (
                            <div className="text-sm text-slate-400">{title.title_name_kr}</div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-300">
                      {title.author || '-'}
                    </TableCell>
                    <TableCell>
                      {title.genre ? (
                        <Badge variant="outline" className="border-blue-600/30 text-blue-400">
                          {formatGenre(title.genre)}
                        </Badge>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      {title.content_format ? (
                        <Badge variant="outline" className="border-purple-600/30 text-purple-400">
                          {formatContentFormat(title.content_format)}
                        </Badge>
                      ) : '-'}
                    </TableCell>
                    <TableCell className="text-slate-300">
                      {title.views?.toLocaleString() || '0'}
                    </TableCell>
                    <TableCell className="text-slate-300">
                      {title.likes?.toLocaleString() || '0'}
                    </TableCell>
                    <TableCell className="text-slate-300">
                      {title.rating && title.rating_count && title.rating_count > 0 
                        ? `${title.rating.toFixed(1)} (${title.rating_count})` 
                        : '-'
                      }
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
