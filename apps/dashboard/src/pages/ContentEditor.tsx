import { useState } from "react";
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@kstorybridge/ui";

import { 
  Save, 
  Eye, 
  X, 
  Bold, 
  Italic, 
  Link, 
  Image,
  List,
  Quote,
  Code
} from "lucide-react";
import { NavLink } from "react-router-dom";

export default function ContentEditor() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("draft");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const editorButtons = [
    { icon: Bold, label: "Bold" },
    { icon: Italic, label: "Italic" },
    { icon: Link, label: "Link" },
    { icon: Image, label: "Image" },
    { icon: List, label: "List" },
    { icon: Quote, label: "Quote" },
    { icon: Code, label: "Code" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Content Editor</h1>
          <p className="text-slate-400">Create and edit your content with our powerful editor</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="border-slate-600 text-slate-300 hover:text-white">
            <Eye className="mr-2 h-4 w-4" />
            Preview
          </Button>
          <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
            <Save className="mr-2 h-4 w-4" />
            Save Content
          </Button>
          <NavLink to="/content">
            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
              <X className="h-4 w-4" />
            </Button>
          </NavLink>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Editor */}
        <div className="lg:col-span-3 space-y-6">
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Content Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-slate-300">Title</Label>
                <Input
                  id="title"
                  placeholder="Enter your content title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-400"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content" className="text-slate-300">Content</Label>
                <div className="border border-slate-600 rounded-lg overflow-hidden bg-slate-900/50">
                  {/* Editor Toolbar */}
                  <div className="flex items-center gap-1 p-3 border-b border-slate-600 bg-slate-800/50">
                    {editorButtons.map((button, index) => (
                      <Button
                        key={index}
                        variant="ghost"
                        size="sm"
                        className="text-slate-400 hover:text-white hover:bg-slate-700"
                        title={button.label}
                      >
                        <button.icon className="h-4 w-4" />
                      </Button>
                    ))}
                  </div>
                  {/* Editor Content */}
                  <Textarea
                    id="content"
                    placeholder="Start writing your content..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="min-h-[400px] border-0 bg-transparent text-white placeholder:text-slate-400 resize-none focus:ring-0"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Publish Settings */}
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white text-lg">Publish Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="bg-slate-900/50 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="draft" className="text-slate-300">Draft</SelectItem>
                    <SelectItem value="review" className="text-slate-300">Under Review</SelectItem>
                    <SelectItem value="published" className="text-slate-300">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="bg-slate-900/50 border-slate-600 text-white">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="tutorial" className="text-slate-300">Tutorial</SelectItem>
                    <SelectItem value="guide" className="text-slate-300">Guide</SelectItem>
                    <SelectItem value="article" className="text-slate-300">Article</SelectItem>
                    <SelectItem value="news" className="text-slate-300">News</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Tags */}
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white text-lg">Tags</CardTitle>
              <CardDescription className="text-slate-400">
                Add tags to help organize your content
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Add tag..."
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && addTag()}
                  className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-400"
                />
                <Button onClick={addTag} size="sm" variant="outline" className="border-slate-600 text-slate-300">
                  Add
                </Button>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge 
                    key={tag} 
                    variant="secondary" 
                    className="bg-slate-700 text-slate-300 hover:bg-slate-600"
                  >
                    {tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="ml-2 text-slate-400 hover:text-white"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* SEO */}
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white text-lg">SEO Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Meta Description</Label>
                <Textarea
                  placeholder="Brief description for search engines..."
                  className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-400"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
