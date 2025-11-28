import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Checkbox, Label, Input, Textarea, Card, CardContent, CardHeader, CardTitle } from "@kstorybridge/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@kstorybridge/ui';
import { ArrowLeft, Save } from "lucide-react";
import { titlesService, type TitleInsert } from "@/services/titlesService";
import AdminLayout from "@/components/layout/AdminLayout";
import { PageContainer } from "@/components/layout/PageContainer";
import { useToast } from "@/hooks/use-toast";

const GENRE_OPTIONS = [
  { value: "romance", label: "Romance" },
  { value: "fantasy", label: "Fantasy" },
  { value: "action", label: "Action" },
  { value: "drama", label: "Drama" },
  { value: "comedy", label: "Comedy" },
  { value: "thriller", label: "Thriller" },
  { value: "horror", label: "Horror" },
  { value: "sci_fi", label: "Sci-Fi" },
  { value: "slice_of_life", label: "Slice of Life" },
  { value: "historical", label: "Historical" },
  { value: "mystery", label: "Mystery" },
  { value: "sports", label: "Sports" },
  { value: "other", label: "Other" },
];

const CONTENT_FORMAT_OPTIONS = [
  { value: "webtoon", label: "Webtoon" },
  { value: "web_novel", label: "Web Novel" },
  { value: "book", label: "Book" },
  { value: "script", label: "Script" },
  { value: "game", label: "Game" },
  { value: "animation", label: "Animation" },
  { value: "other", label: "Other" },
];

export default function AdminAddTitle() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState<Partial<TitleInsert>>({
    title_name_kr: "",
    title_name_en: "",
    creator_id: "",
    genre: undefined,
    content_format: undefined,
    tagline: "",
    synopsis: "",
    pitch: "",
    author: "",
    story_author: "",
    art_author: "",
    writer: "",
    illustrator: "",
    rights: "",
    rights_owner: "",
    perfect_for: "",
    comps: null,
    tone: "",
    audience: "",
    title_image: "",
    title_url: "",
    chapters: undefined,
    completed: false,
    note: "",
  });

  const handleInputChange = (field: keyof TitleInsert, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title_name_kr?.trim()) {
      toast({ title: "Error", description: "Korean title is required" });
      return;
    }

    if (!formData.creator_id?.trim()) {
      toast({ title: "Error", description: "Creator ID is required" });
      return;
    }

    setIsLoading(true);

    try {
      const cleanedData: TitleInsert = {
        ...formData,
        title_name_kr: formData.title_name_kr!,
        creator_id: formData.creator_id!,
        title_name_en: formData.title_name_en?.trim() || null,
        tagline: formData.tagline?.trim() || null,
        synopsis: formData.synopsis?.trim() || null,
        pitch: formData.pitch?.trim() || null,
        author: formData.author?.trim() || null,
        story_author: formData.story_author?.trim() || null,
        art_author: formData.art_author?.trim() || null,
        writer: formData.writer?.trim() || null,
        illustrator: formData.illustrator?.trim() || null,
        rights: formData.rights?.trim() || null,
        rights_owner: formData.rights_owner?.trim() || null,
        perfect_for: formData.perfect_for?.trim() || null,
        comps: formData.comps || null,
        tone: formData.tone?.trim() || null,
        audience: formData.audience?.trim() || null,
        title_image: formData.title_image?.trim() || null,
        title_url: formData.title_url?.trim() || null,
        note: formData.note?.trim() || null,
        chapters: formData.chapters || null,
        completed: formData.completed || false,
      };

      const newTitle = await titlesService.createTitle(cleanedData);
      toast({ title: "Success", description: "Title created successfully!" });
      navigate(`/admin/titles/${newTitle.title_id}`);
    } catch (error) {
      console.error("Error creating title:", error);
      toast({ title: "Error", description: "Failed to create title. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdminLayout>
      <PageContainer>
        <div className="max-w-4xl mx-auto">
          {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-gray-800">Add New Title</h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-purple-500 text-white">
              ADMIN ONLY
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Create a new title entry in the system
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/admin/titles')}
            className="border-gray-300 hover:bg-gray-100"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Titles
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl">
            <CardHeader>
              <CardTitle className="text-gray-800">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title_name_kr" className="text-sm font-medium text-gray-700">
                  Korean Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title_name_kr"
                  value={formData.title_name_kr || ""}
                  onChange={(e) => handleInputChange("title_name_kr", e.target.value)}
                  placeholder="한국어 제목"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="title_name_en" className="text-sm font-medium text-gray-700">
                  English Title
                </Label>
                <Input
                  id="title_name_en"
                  value={formData.title_name_en || ""}
                  onChange={(e) => handleInputChange("title_name_en", e.target.value)}
                  placeholder="English Title"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="creator_id" className="text-sm font-medium text-gray-700">
                  Creator ID <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="creator_id"
                  value={formData.creator_id || ""}
                  onChange={(e) => handleInputChange("creator_id", e.target.value)}
                  placeholder="UUID of the creator"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="genre" className="text-sm font-medium text-gray-700">
                  Genre
                </Label>
                <Select
                  value={formData.genre || ""}
                  onValueChange={(value) => handleInputChange("genre", value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select genre" />
                  </SelectTrigger>
                  <SelectContent>
                    {GENRE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="content_format" className="text-sm font-medium text-gray-700">
                  Content Format
                </Label>
                <Select
                  value={formData.content_format || ""}
                  onValueChange={(value) => handleInputChange("content_format", value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTENT_FORMAT_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="chapters" className="text-sm font-medium text-gray-700">
                  Chapters
                </Label>
                <Input
                  id="chapters"
                  type="number"
                  min="0"
                  value={formData.chapters || ""}
                  onChange={(e) => handleInputChange("chapters", parseInt(e.target.value) || undefined)}
                  placeholder="Number of chapters"
                  className="mt-1"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="completed"
                  checked={formData.completed || false}
                  onCheckedChange={(checked) => handleInputChange("completed", checked)}
                />
                <Label htmlFor="completed" className="text-sm font-medium text-gray-700">
                  Mark as completed
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Content Details */}
          <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl">
            <CardHeader>
              <CardTitle className="text-gray-800">Content Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="tagline" className="text-sm font-medium text-gray-700">
                  Tagline
                </Label>
                <Input
                  id="tagline"
                  value={formData.tagline || ""}
                  onChange={(e) => handleInputChange("tagline", e.target.value)}
                  placeholder="Brief catchy tagline"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="synopsis" className="text-sm font-medium text-gray-700">
                  Synopsis
                </Label>
                <Textarea
                  id="synopsis"
                  value={formData.synopsis || ""}
                  onChange={(e) => handleInputChange("synopsis", e.target.value)}
                  placeholder="Story synopsis"
                  rows={4}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="pitch" className="text-sm font-medium text-gray-700">
                  Pitch
                </Label>
                <Textarea
                  id="pitch"
                  value={formData.pitch || ""}
                  onChange={(e) => handleInputChange("pitch", e.target.value)}
                  placeholder="Sales pitch for potential buyers"
                  rows={3}
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>

          {/* Creator Information */}
          <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl">
            <CardHeader>
              <CardTitle className="text-gray-800">Creator Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="author" className="text-sm font-medium text-gray-700">
                  Author
                </Label>
                <Input
                  id="author"
                  value={formData.author || ""}
                  onChange={(e) => handleInputChange("author", e.target.value)}
                  placeholder="Main author"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="story_author" className="text-sm font-medium text-gray-700">
                  Story Author
                </Label>
                <Input
                  id="story_author"
                  value={formData.story_author || ""}
                  onChange={(e) => handleInputChange("story_author", e.target.value)}
                  placeholder="Story author (if different)"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="art_author" className="text-sm font-medium text-gray-700">
                  Art Author
                </Label>
                <Input
                  id="art_author"
                  value={formData.art_author || ""}
                  onChange={(e) => handleInputChange("art_author", e.target.value)}
                  placeholder="Artist/illustrator"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="writer" className="text-sm font-medium text-gray-700">
                  Writer
                </Label>
                <Input
                  id="writer"
                  value={formData.writer || ""}
                  onChange={(e) => handleInputChange("writer", e.target.value)}
                  placeholder="Writer"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="illustrator" className="text-sm font-medium text-gray-700">
                  Illustrator
                </Label>
                <Input
                  id="illustrator"
                  value={formData.illustrator || ""}
                  onChange={(e) => handleInputChange("illustrator", e.target.value)}
                  placeholder="Illustrator"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="rights_owner" className="text-sm font-medium text-gray-700">
                  Rights Owner
                </Label>
                <Input
                  id="rights_owner"
                  value={formData.rights_owner || ""}
                  onChange={(e) => handleInputChange("rights_owner", e.target.value)}
                  placeholder="Rights owner"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="rights" className="text-sm font-medium text-gray-700">
                  Rights Information
                </Label>
                <Textarea
                  id="rights"
                  value={formData.rights || ""}
                  onChange={(e) => handleInputChange("rights", e.target.value)}
                  placeholder="Detailed rights information"
                  rows={3}
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>

          {/* Market Information */}
          <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl">
            <CardHeader>
              <CardTitle className="text-gray-800">Market Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="perfect_for" className="text-sm font-medium text-gray-700">
                  Perfect For
                </Label>
                <Textarea
                  id="perfect_for"
                  value={formData.perfect_for || ""}
                  onChange={(e) => handleInputChange("perfect_for", e.target.value)}
                  placeholder="What type of adaptation/market is this perfect for?"
                  rows={3}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="tone" className="text-sm font-medium text-gray-700">
                  Tone
                </Label>
                <Input
                  id="tone"
                  value={formData.tone || ""}
                  onChange={(e) => handleInputChange("tone", e.target.value)}
                  placeholder="e.g., Dark, Light-hearted, Serious"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="audience" className="text-sm font-medium text-gray-700">
                  Target Audience
                </Label>
                <Input
                  id="audience"
                  value={formData.audience || ""}
                  onChange={(e) => handleInputChange("audience", e.target.value)}
                  placeholder="e.g., Young Adults, Adults, All Ages"
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>

          {/* Media & Links */}
          <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl">
            <CardHeader>
              <CardTitle className="text-gray-800">Media & Links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title_image" className="text-sm font-medium text-gray-700">
                  Title Image URL
                </Label>
                <Input
                  id="title_image"
                  value={formData.title_image || ""}
                  onChange={(e) => handleInputChange("title_image", e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="title_url" className="text-sm font-medium text-gray-700">
                  Title URL
                </Label>
                <Input
                  id="title_url"
                  value={formData.title_url || ""}
                  onChange={(e) => handleInputChange("title_url", e.target.value)}
                  placeholder="https://example.com/title"
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>

          {/* Admin Notes */}
          <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl">
            <CardHeader>
              <CardTitle className="text-gray-800">Admin Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="note" className="text-sm font-medium text-gray-700">
                  Internal Notes
                </Label>
                <Textarea
                  id="note"
                  value={formData.note || ""}
                  onChange={(e) => handleInputChange("note", e.target.value)}
                  placeholder="Internal notes for admin use only"
                  rows={3}
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-4 pt-6 border-t border-gray-300">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/admin/titles')}
              disabled={isLoading}
              className="border-gray-300 hover:bg-gray-100"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-gray-800 hover:bg-gray-700 text-white"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  Create Title
                </div>
              )}
            </Button>
          </div>
        </form>
        </div>
      </PageContainer>
    </AdminLayout>
  );
}
