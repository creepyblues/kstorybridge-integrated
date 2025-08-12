import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card, CardContent, CardHeader, CardTitle, Checkbox, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, useToast } from "@kstorybridge/ui";

import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Save, FileText, Users, Palette, BookOpen, Globe } from "lucide-react";
import { Database } from "@/integrations/supabase/types";
type TitleInsert = Database["public"]["Tables"]["titles"]["Insert"];

export default function AddTitle() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<TitleInsert>>({
    title_name_kr: "",
    title_name_en: "",
    creator_id: user?.id || "",
    genre: undefined,
    content_format: undefined,
    completed: false,
    chapters: undefined,
    tags: [],
  });

  const handleInputChange = (field: keyof TitleInsert, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value === "" ? null : value,
    }));
  };

  const handleTagsChange = (tagString: string) => {
    const tags = tagString.split(",").map(tag => tag.trim()).filter(tag => tag.length > 0);
    setFormData(prev => ({
      ...prev,
      tags: tags.length > 0 ? tags : null,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create a title",
        variant: "destructive",
      });
      return;
    }

    if (!formData.title_name_kr) {
      toast({
        title: "Error",
        description: "Korean title name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      const titleData: TitleInsert = {
        ...formData,
        creator_id: user.id,
      };

      const { data, error } = await supabase
        .from("titles")
        .insert(titleData)
        .select()
        .single();

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: "Title created successfully!",
      });

      navigate("/creators/titles");
    } catch (error) {
      console.error("Error creating title:", error);
      toast({
        title: "Error",
        description: "Failed to create title. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-porcelain-blue-50">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/creators/titles")}
            className="text-midnight-ink-600 hover:text-midnight-ink"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to My Titles
          </Button>
        </div>

        <div className="flex items-center gap-3 mb-8">
          <FileText className="w-8 h-8 text-hanok-teal" />
          <h1 className="text-4xl font-bold text-midnight-ink">Add New Title</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-hanok-teal to-porcelain-blue-600 text-white">
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="title_name_kr">Korean Title *</Label>
                  <Input
                    id="title_name_kr"
                    value={formData.title_name_kr || ""}
                    onChange={(e) => handleInputChange("title_name_kr", e.target.value)}
                    placeholder="한국어 제목"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="title_name_en">English Title</Label>
                  <Input
                    id="title_name_en"
                    value={formData.title_name_en || ""}
                    onChange={(e) => handleInputChange("title_name_en", e.target.value)}
                    placeholder="English Title"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="tagline">Tagline</Label>
                <Input
                  id="tagline"
                  value={formData.tagline || ""}
                  onChange={(e) => handleInputChange("tagline", e.target.value)}
                  placeholder="A compelling one-line description"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description || ""}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="Brief description of the title"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="synopsis">Synopsis</Label>
                <Textarea
                  id="synopsis"
                  value={formData.synopsis || ""}
                  onChange={(e) => handleInputChange("synopsis", e.target.value)}
                  placeholder="Detailed synopsis of the story"
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Content Details */}
          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-porcelain-blue-600 to-hanok-teal text-white">
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Content Details
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="genre">Genre</Label>
                  <Select
                    value={formData.genre || ""}
                    onValueChange={(value) => handleInputChange("genre", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select genre" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="romance">Romance</SelectItem>
                      <SelectItem value="fantasy">Fantasy</SelectItem>
                      <SelectItem value="action">Action</SelectItem>
                      <SelectItem value="drama">Drama</SelectItem>
                      <SelectItem value="comedy">Comedy</SelectItem>
                      <SelectItem value="thriller">Thriller</SelectItem>
                      <SelectItem value="horror">Horror</SelectItem>
                      <SelectItem value="sci_fi">Sci-Fi</SelectItem>
                      <SelectItem value="slice_of_life">Slice of Life</SelectItem>
                      <SelectItem value="historical">Historical</SelectItem>
                      <SelectItem value="mystery">Mystery</SelectItem>
                      <SelectItem value="sports">Sports</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="content_format">Content Format</Label>
                  <Select
                    value={formData.content_format || ""}
                    onValueChange={(value) => handleInputChange("content_format", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="webtoon">Webtoon</SelectItem>
                      <SelectItem value="web_novel">Web Novel</SelectItem>
                      <SelectItem value="book">Book</SelectItem>
                      <SelectItem value="script">Script</SelectItem>
                      <SelectItem value="game">Game</SelectItem>
                      <SelectItem value="animation">Animation</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <Label htmlFor="chapters">Chapters</Label>
                  <Input
                    id="chapters"
                    type="number"
                    value={formData.chapters || ""}
                    onChange={(e) => handleInputChange("chapters", e.target.value ? parseInt(e.target.value) : null)}
                    placeholder="Number of chapters"
                    min="1"
                  />
                </div>
                
                <div className="flex items-center space-x-2 pt-8">
                  <Checkbox
                    id="completed"
                    checked={formData.completed || false}
                    onCheckedChange={(checked) => handleInputChange("completed", checked)}
                  />
                  <Label htmlFor="completed">Completed</Label>
                </div>
              </div>

              <div>
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  value={formData.tags?.join(", ") || ""}
                  onChange={(e) => handleTagsChange(e.target.value)}
                  placeholder="e.g., romance, modern, office, comedy"
                />
              </div>
            </CardContent>
          </Card>

          {/* Creator Information */}
          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-sunrise-coral to-hanok-teal text-white">
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Creator Information
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="author">Author</Label>
                  <Input
                    id="author"
                    value={formData.author || ""}
                    onChange={(e) => handleInputChange("author", e.target.value)}
                    placeholder="Main author name"
                  />
                </div>
                <div>
                  <Label htmlFor="story_author">Story Author</Label>
                  <Input
                    id="story_author"
                    value={formData.story_author || ""}
                    onChange={(e) => handleInputChange("story_author", e.target.value)}
                    placeholder="Story writer"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="art_author">Art Author</Label>
                  <Input
                    id="art_author"
                    value={formData.art_author || ""}
                    onChange={(e) => handleInputChange("art_author", e.target.value)}
                    placeholder="Artist name"
                  />
                </div>
                <div>
                  <Label htmlFor="illustrator">Illustrator</Label>
                  <Input
                    id="illustrator"
                    value={formData.illustrator || ""}
                    onChange={(e) => handleInputChange("illustrator", e.target.value)}
                    placeholder="Illustrator name"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="writer">Writer</Label>
                <Input
                  id="writer"
                  value={formData.writer || ""}
                  onChange={(e) => handleInputChange("writer", e.target.value)}
                  placeholder="Writer name"
                />
              </div>
            </CardContent>
          </Card>

          {/* Rights & Business */}
          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-slate-600 to-slate-700 text-white">
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Rights & Business Information
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="rights">Rights</Label>
                  <Input
                    id="rights"
                    value={formData.rights || ""}
                    onChange={(e) => handleInputChange("rights", e.target.value)}
                    placeholder="Rights information"
                  />
                </div>
                <div>
                  <Label htmlFor="rights_owner">Rights Owner</Label>
                  <Input
                    id="rights_owner"
                    value={formData.rights_owner || ""}
                    onChange={(e) => handleInputChange("rights_owner", e.target.value)}
                    placeholder="Rights owner name"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Market Information */}
          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Market Information
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div>
                <Label htmlFor="audience">Target Audience</Label>
                <Input
                  id="audience"
                  value={formData.audience || ""}
                  onChange={(e) => handleInputChange("audience", e.target.value)}
                  placeholder="e.g., Young adults, teens, adults"
                />
              </div>

              <div>
                <Label htmlFor="perfect_for">Perfect For</Label>
                <Textarea
                  id="perfect_for"
                  value={formData.perfect_for || ""}
                  onChange={(e) => handleInputChange("perfect_for", e.target.value)}
                  placeholder="What type of adaptation or market this is perfect for"
                  rows={2}
                />
              </div>

              <StringArrayInput
                id="comps"
                label="Comparable Titles"
                placeholder="Add similar successful titles"
                value={formData.comps}
                onChange={(value) => handleInputChange("comps", value)}
              />

              <div>
                <Label htmlFor="tone">Tone</Label>
                <Input
                  id="tone"
                  value={formData.tone || ""}
                  onChange={(e) => handleInputChange("tone", e.target.value)}
                  placeholder="e.g., Light-hearted, dramatic, suspenseful"
                />
              </div>
            </CardContent>
          </Card>

          {/* Additional Information */}
          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-green-600 to-teal-600 text-white">
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Additional Information
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="title_image">Title Image URL</Label>
                  <Input
                    id="title_image"
                    value={formData.title_image || ""}
                    onChange={(e) => handleInputChange("title_image", e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    type="url"
                  />
                </div>
                <div>
                  <Label htmlFor="title_url">Title URL</Label>
                  <Input
                    id="title_url"
                    value={formData.title_url || ""}
                    onChange={(e) => handleInputChange("title_url", e.target.value)}
                    placeholder="https://example.com/title"
                    type="url"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="pitch">Pitch Document URL</Label>
                <Input
                  id="pitch"
                  value={formData.pitch || ""}
                  onChange={(e) => handleInputChange("pitch", e.target.value)}
                  placeholder="https://example.com/pitch.pdf"
                  type="url"
                />
              </div>

              <div>
                <Label htmlFor="note">Internal Notes</Label>
                <Textarea
                  id="note"
                  value={formData.note || ""}
                  onChange={(e) => handleInputChange("note", e.target.value)}
                  placeholder="Any additional notes or comments"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/creators/titles")}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-hanok-teal hover:bg-hanok-teal-600 text-white px-8"
            >
              <Save className="w-4 h-4 mr-2" />
              {loading ? "Creating..." : "Create Title"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}