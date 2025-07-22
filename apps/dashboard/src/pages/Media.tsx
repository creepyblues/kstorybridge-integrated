
import { useState } from "react";
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
import { 
  Upload, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Download, 
  Trash2, 
  Eye,
  Grid3X3,
  List,
  File,
  Image as ImageIcon,
  Video,
  FileText
} from "lucide-react";

const mediaFiles = [
  {
    id: 1,
    name: "hero-banner.jpg",
    type: "image",
    size: "2.4 MB",
    dimensions: "1920x1080",
    uploadDate: "2024-01-15",
    url: "/placeholder.svg"
  },
  {
    id: 2,
    name: "tutorial-video.mp4",
    type: "video",
    size: "45.2 MB",
    duration: "5:23",
    uploadDate: "2024-01-14",
    url: "/placeholder.svg"
  },
  {
    id: 3,
    name: "user-guide.pdf",
    type: "document",
    size: "1.8 MB",
    pages: "24",
    uploadDate: "2024-01-13",
    url: "/placeholder.svg"
  },
  {
    id: 4,
    name: "product-screenshot.png",
    type: "image",
    size: "856 KB",
    dimensions: "1440x900",
    uploadDate: "2024-01-12",
    url: "/placeholder.svg"
  },
  {
    id: 5,
    name: "presentation.pptx",
    type: "document",
    size: "3.2 MB",
    slides: "18",
    uploadDate: "2024-01-11",
    url: "/placeholder.svg"
  },
  {
    id: 6,
    name: "icon-set.svg",
    type: "image",
    size: "124 KB",
    dimensions: "512x512",
    uploadDate: "2024-01-10",
    url: "/placeholder.svg"
  },
];

export default function Media() {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const filteredMedia = mediaFiles.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || file.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const getFileIcon = (type: string) => {
    switch (type) {
      case "image":
        return ImageIcon;
      case "video":
        return Video;
      case "document":
        return FileText;
      default:
        return File;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "image":
        return <Badge className="bg-green-600/20 text-green-400 border-green-600/30">Image</Badge>;
      case "video":
        return <Badge className="bg-blue-600/20 text-blue-400 border-blue-600/30">Video</Badge>;
      case "document":
        return <Badge className="bg-purple-600/20 text-purple-400 border-purple-600/30">Document</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Media Library</h1>
          <p className="text-slate-400">Manage your images, videos, and documents</p>
        </div>
        <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
          <Upload className="mr-2 h-4 w-4" />
          Upload Files
        </Button>
      </div>

      <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white">Media Files</CardTitle>
              <CardDescription className="text-slate-400">
                Browse and manage your uploaded files
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className={viewMode === "grid" ? "" : "border-slate-600 text-slate-300"}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("list")}
                className={viewMode === "list" ? "" : "border-slate-600 text-slate-300"}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
              <Input
                placeholder="Search files..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-400"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="border-slate-600 text-slate-300 hover:text-white">
                  <Filter className="mr-2 h-4 w-4" />
                  Type: {typeFilter === "all" ? "All" : typeFilter}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-slate-800 border-slate-700">
                <DropdownMenuItem 
                  onClick={() => setTypeFilter("all")}
                  className="text-slate-300 hover:text-white hover:bg-slate-700"
                >
                  All Types
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setTypeFilter("image")}
                  className="text-slate-300 hover:text-white hover:bg-slate-700"
                >
                  Images
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setTypeFilter("video")}
                  className="text-slate-300 hover:text-white hover:bg-slate-700"
                >
                  Videos
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setTypeFilter("document")}
                  className="text-slate-300 hover:text-white hover:bg-slate-700"
                >
                  Documents
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Media Grid/List */}
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredMedia.map((file) => {
                const FileIcon = getFileIcon(file.type);
                return (
                  <Card key={file.id} className="bg-slate-900/50 border-slate-700 hover:bg-slate-800/50 transition-colors group">
                    <CardContent className="p-4">
                      <div className="aspect-square bg-slate-800 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                        {file.type === "image" ? (
                          <img 
                            src={file.url} 
                            alt={file.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <FileIcon className="h-12 w-12 text-slate-400" />
                        )}
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-white text-sm font-medium truncate">{file.name}</h3>
                        <div className="flex items-center justify-between">
                          {getTypeBadge(file.type)}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-white">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="bg-slate-800 border-slate-700">
                              <DropdownMenuItem className="text-slate-300 hover:text-white hover:bg-slate-700">
                                <Eye className="mr-2 h-4 w-4" />
                                View
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-slate-300 hover:text-white hover:bg-slate-700">
                                <Download className="mr-2 h-4 w-4" />
                                Download
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-400 hover:text-red-300 hover:bg-slate-700">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <div className="text-xs text-slate-400">
                          <div>{file.size}</div>
                          {file.dimensions && <div>{file.dimensions}</div>}
                          {file.duration && <div>{file.duration}</div>}
                          {file.pages && <div>{file.pages} pages</div>}
                          {file.slides && <div>{file.slides} slides</div>}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredMedia.map((file) => {
                const FileIcon = getFileIcon(file.type);
                return (
                  <div key={file.id} className="flex items-center gap-4 p-4 rounded-lg bg-slate-900/50 hover:bg-slate-800/50 transition-colors">
                    <div className="w-12 h-12 bg-slate-800 rounded-lg flex items-center justify-center flex-shrink-0">
                      {file.type === "image" ? (
                        <img 
                          src={file.url} 
                          alt={file.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <FileIcon className="h-6 w-6 text-slate-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-medium truncate">{file.name}</h3>
                      <div className="flex items-center gap-4 text-sm text-slate-400">
                        <span>{file.size}</span>
                        {file.dimensions && <span>{file.dimensions}</span>}
                        {file.duration && <span>{file.duration}</span>}
                        {file.pages && <span>{file.pages} pages</span>}
                        {file.slides && <span>{file.slides} slides</span>}
                        <span>{file.uploadDate}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getTypeBadge(file.type)}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-slate-800 border-slate-700">
                          <DropdownMenuItem className="text-slate-300 hover:text-white hover:bg-slate-700">
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-slate-300 hover:text-white hover:bg-slate-700">
                            <Download className="mr-2 h-4 w-4" />
                            Download
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-400 hover:text-red-300 hover:bg-slate-700">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
