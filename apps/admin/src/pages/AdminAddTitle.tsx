import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save, AlertCircle } from "lucide-react";
import { titlesService, type TitleInsert } from "@/services/titlesService";
import AdminLayout from "@/components/layout/AdminLayout";
import { toast } from "sonner";

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
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form state
  const [formData, setFormData] = useState<Partial<TitleInsert>>({
    title_name_kr: "",
    title_name_en: "",
    creator_id: "", // Will need to be set - for now admin will input it
    genre: undefined,
    content_format: undefined,
    tagline: "",
    description: "",
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
    comps: "",
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
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Required fields
    if (!formData.title_name_kr?.trim()) {
      newErrors.title_name_kr = "Korean title is required";
    }
    if (!formData.creator_id?.trim()) {
      newErrors.creator_id = "Creator ID is required";
    }

    // Optional validations
    if (formData.chapters && formData.chapters < 0) {
      newErrors.chapters = "Chapters must be a positive number";
    }
    if (formData.title_image && !isValidUrl(formData.title_image)) {
      newErrors.title_image = "Please enter a valid image URL";
    }
    if (formData.title_url && !isValidUrl(formData.title_url)) {
      newErrors.title_url = "Please enter a valid URL";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (string: string): boolean => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    setIsLoading(true);

    try {
      // Clean up the form data - remove empty strings and convert to appropriate types
      const cleanedData: TitleInsert = {
        ...formData,
        title_name_kr: formData.title_name_kr!,
        creator_id: formData.creator_id!,
        // Convert empty strings to null for optional fields
        title_name_en: formData.title_name_en?.trim() || null,
        tagline: formData.tagline?.trim() || null,
        description: formData.description?.trim() || null,
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
        comps: formData.comps?.trim() || null,
        tone: formData.tone?.trim() || null,
        audience: formData.audience?.trim() || null,
        title_image: formData.title_image?.trim() || null,
        title_url: formData.title_url?.trim() || null,
        note: formData.note?.trim() || null,
        chapters: formData.chapters || null,
        completed: formData.completed || false,
      };

      const newTitle = await titlesService.createTitle(cleanedData);
      toast.success("Title created successfully!");
      navigate(`/titles/${newTitle.title_id}`);
    } catch (error) {
      console.error("Error creating title:", error);
      toast.error("Failed to create title. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/titles')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Titles
          </Button>
          <div>
            <h1 className="text-4xl font-bold text-midnight-ink">Add New Title</h1>
            <p className="text-midnight-ink-600 mt-2">
              Create a new title entry in the system
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Data Collection Section */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
            <div className="bg-sunrise-coral px-6 py-4 border-b-4 border-sunrise-coral">
              <h2 className="text-xl font-bold text-white">Auto Data Collection</h2>
              <p className="text-sunrise-coral-50 text-sm mt-1">Automatically populate fields from an existing title URL</p>
            </div>
            <div className="px-6 py-6">
              <table className="w-full">
                <tbody>
                  <tr className="group hover:bg-gray-50">
                    <td className="py-4 w-48 text-sm font-semibold text-gray-700">Title Link</td>
                    <td className="py-4 pl-6">
                      <div className="flex gap-3">
                        <Input
                          id="title_link_scrape"
                          placeholder="https://example.com/title-page"
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          disabled={true}
                          className="bg-sunrise-coral hover:bg-sunrise-coral/90 text-white opacity-50 cursor-not-allowed"
                        >
                          Collect Data
                        </Button>
                      </div>
                      <p className="text-gray-500 text-xs mt-2">
                        Feature coming soon - will automatically fill form fields from the provided URL
                      </p>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            {/* Basic Information Section */}
            <div className="bg-gray-50 px-6 py-4 border-b-4 border-hanok-teal">
              <h2 className="text-xl font-bold text-midnight-ink flex items-center gap-2">
                Basic Information
                <span className="text-red-500">*</span>
              </h2>
            </div>
            <div className="px-6 py-6">
              <table className="w-full">
                <tbody className="divide-y divide-gray-100">
                  <tr className="group hover:bg-gray-50">
                    <td className="py-4 w-48 text-sm font-semibold text-gray-700">
                      Korean Title <span className="text-red-500">*</span>
                    </td>
                    <td className="py-4 pl-6">
                      <Input
                        id="title_name_kr"
                        value={formData.title_name_kr || ""}
                        onChange={(e) => handleInputChange("title_name_kr", e.target.value)}
                        placeholder="한국어 제목"
                        className={errors.title_name_kr ? "border-red-500" : ""}
                      />
                      {errors.title_name_kr && (
                        <p className="text-red-500 text-sm flex items-center gap-1 mt-1">
                          <AlertCircle className="w-3 h-3" />
                          {errors.title_name_kr}
                        </p>
                      )}
                    </td>
                  </tr>
                  <tr className="group hover:bg-gray-50">
                    <td className="py-4 w-48 text-sm font-semibold text-gray-700">English Title</td>
                    <td className="py-4 pl-6">
                      <Input
                        id="title_name_en"
                        value={formData.title_name_en || ""}
                        onChange={(e) => handleInputChange("title_name_en", e.target.value)}
                        placeholder="English Title"
                      />
                    </td>
                  </tr>
                  <tr className="group hover:bg-gray-50">
                    <td className="py-4 w-48 text-sm font-semibold text-gray-700">
                      Creator ID <span className="text-red-500">*</span>
                    </td>
                    <td className="py-4 pl-6">
                      <Input
                        id="creator_id"
                        value={formData.creator_id || ""}
                        onChange={(e) => handleInputChange("creator_id", e.target.value)}
                        placeholder="UUID of the creator"
                        className={errors.creator_id ? "border-red-500" : ""}
                      />
                      {errors.creator_id && (
                        <p className="text-red-500 text-sm flex items-center gap-1 mt-1">
                          <AlertCircle className="w-3 h-3" />
                          {errors.creator_id}
                        </p>
                      )}
                    </td>
                  </tr>
                  <tr className="group hover:bg-gray-50">
                    <td className="py-4 w-48 text-sm font-semibold text-gray-700">Genre</td>
                    <td className="py-4 pl-6">
                      <Select 
                        value={formData.genre || ""} 
                        onValueChange={(value) => handleInputChange("genre", value)}
                      >
                        <SelectTrigger className="w-80">
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
                    </td>
                  </tr>
                  <tr className="group hover:bg-gray-50">
                    <td className="py-4 w-48 text-sm font-semibold text-gray-700">Content Format</td>
                    <td className="py-4 pl-6">
                      <Select 
                        value={formData.content_format || ""} 
                        onValueChange={(value) => handleInputChange("content_format", value)}
                      >
                        <SelectTrigger className="w-80">
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
                    </td>
                  </tr>
                  <tr className="group hover:bg-gray-50">
                    <td className="py-4 w-48 text-sm font-semibold text-gray-700">Chapters</td>
                    <td className="py-4 pl-6">
                      <Input
                        id="chapters"
                        type="number"
                        min="0"
                        value={formData.chapters || ""}
                        onChange={(e) => handleInputChange("chapters", parseInt(e.target.value) || undefined)}
                        placeholder="Number of chapters"
                        className={`w-80 ${errors.chapters ? "border-red-500" : ""}`}
                      />
                      {errors.chapters && (
                        <p className="text-red-500 text-sm flex items-center gap-1 mt-1">
                          <AlertCircle className="w-3 h-3" />
                          {errors.chapters}
                        </p>
                      )}
                    </td>
                  </tr>
                  <tr className="group hover:bg-gray-50">
                    <td className="py-4 w-48 text-sm font-semibold text-gray-700">Status</td>
                    <td className="py-4 pl-6">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="completed"
                          checked={formData.completed || false}
                          onCheckedChange={(checked) => handleInputChange("completed", checked)}
                        />
                        <Label htmlFor="completed">Mark as completed</Label>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Content Details Section */}
            <div className="bg-gray-50 px-6 py-4 border-b-4 border-hanok-teal border-t-4">
              <h2 className="text-xl font-bold text-midnight-ink">Content Details</h2>
            </div>
            <div className="px-6 py-6">
              <table className="w-full">
                <tbody className="divide-y divide-gray-100">
                  <tr className="group hover:bg-gray-50">
                    <td className="py-4 w-48 text-sm font-semibold text-gray-700">Tagline</td>
                    <td className="py-4 pl-6">
                      <Input
                        id="tagline"
                        value={formData.tagline || ""}
                        onChange={(e) => handleInputChange("tagline", e.target.value)}
                        placeholder="Brief catchy tagline"
                      />
                    </td>
                  </tr>
                  <tr className="group hover:bg-gray-50">
                    <td className="py-4 w-48 text-sm font-semibold text-gray-700 align-top">Description</td>
                    <td className="py-4 pl-6">
                      <Textarea
                        id="description"
                        value={formData.description || ""}
                        onChange={(e) => handleInputChange("description", e.target.value)}
                        placeholder="Detailed description of the title"
                        rows={4}
                      />
                    </td>
                  </tr>
                  <tr className="group hover:bg-gray-50">
                    <td className="py-4 w-48 text-sm font-semibold text-gray-700 align-top">Synopsis</td>
                    <td className="py-4 pl-6">
                      <Textarea
                        id="synopsis"
                        value={formData.synopsis || ""}
                        onChange={(e) => handleInputChange("synopsis", e.target.value)}
                        placeholder="Story synopsis"
                        rows={4}
                      />
                    </td>
                  </tr>
                  <tr className="group hover:bg-gray-50">
                    <td className="py-4 w-48 text-sm font-semibold text-gray-700 align-top">Pitch</td>
                    <td className="py-4 pl-6">
                      <Textarea
                        id="pitch"
                        value={formData.pitch || ""}
                        onChange={(e) => handleInputChange("pitch", e.target.value)}
                        placeholder="Sales pitch for potential buyers"
                        rows={3}
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Creator Information Section */}
            <div className="bg-gray-50 px-6 py-4 border-b-4 border-hanok-teal border-t-4">
              <h2 className="text-xl font-bold text-midnight-ink">Creator Information</h2>
            </div>
            <div className="px-6 py-6">
              <table className="w-full">
                <tbody className="divide-y divide-gray-100">
                  <tr className="group hover:bg-gray-50">
                    <td className="py-4 w-48 text-sm font-semibold text-gray-700">Author</td>
                    <td className="py-4 pl-6">
                      <Input
                        id="author"
                        value={formData.author || ""}
                        onChange={(e) => handleInputChange("author", e.target.value)}
                        placeholder="Main author"
                      />
                    </td>
                  </tr>
                  <tr className="group hover:bg-gray-50">
                    <td className="py-4 w-48 text-sm font-semibold text-gray-700">Story Author</td>
                    <td className="py-4 pl-6">
                      <Input
                        id="story_author"
                        value={formData.story_author || ""}
                        onChange={(e) => handleInputChange("story_author", e.target.value)}
                        placeholder="Story author (if different)"
                      />
                    </td>
                  </tr>
                  <tr className="group hover:bg-gray-50">
                    <td className="py-4 w-48 text-sm font-semibold text-gray-700">Art Author</td>
                    <td className="py-4 pl-6">
                      <Input
                        id="art_author"
                        value={formData.art_author || ""}
                        onChange={(e) => handleInputChange("art_author", e.target.value)}
                        placeholder="Artist/illustrator"
                      />
                    </td>
                  </tr>
                  <tr className="group hover:bg-gray-50">
                    <td className="py-4 w-48 text-sm font-semibold text-gray-700">Writer</td>
                    <td className="py-4 pl-6">
                      <Input
                        id="writer"
                        value={formData.writer || ""}
                        onChange={(e) => handleInputChange("writer", e.target.value)}
                        placeholder="Writer"
                      />
                    </td>
                  </tr>
                  <tr className="group hover:bg-gray-50">
                    <td className="py-4 w-48 text-sm font-semibold text-gray-700">Illustrator</td>
                    <td className="py-4 pl-6">
                      <Input
                        id="illustrator"
                        value={formData.illustrator || ""}
                        onChange={(e) => handleInputChange("illustrator", e.target.value)}
                        placeholder="Illustrator"
                      />
                    </td>
                  </tr>
                  <tr className="group hover:bg-gray-50">
                    <td className="py-4 w-48 text-sm font-semibold text-gray-700">Rights Owner</td>
                    <td className="py-4 pl-6">
                      <Input
                        id="rights_owner"
                        value={formData.rights_owner || ""}
                        onChange={(e) => handleInputChange("rights_owner", e.target.value)}
                        placeholder="Rights owner"
                      />
                    </td>
                  </tr>
                  <tr className="group hover:bg-gray-50">
                    <td className="py-4 w-48 text-sm font-semibold text-gray-700 align-top">Rights Information</td>
                    <td className="py-4 pl-6">
                      <Textarea
                        id="rights"
                        value={formData.rights || ""}
                        onChange={(e) => handleInputChange("rights", e.target.value)}
                        placeholder="Detailed rights information"
                        rows={3}
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Market Information Section */}
            <div className="bg-gray-50 px-6 py-4 border-b-4 border-hanok-teal border-t-4">
              <h2 className="text-xl font-bold text-midnight-ink">Market Information</h2>
            </div>
            <div className="px-6 py-6">
              <table className="w-full">
                <tbody className="divide-y divide-gray-100">
                  <tr className="group hover:bg-gray-50">
                    <td className="py-4 w-48 text-sm font-semibold text-gray-700 align-top">Perfect For</td>
                    <td className="py-4 pl-6">
                      <Textarea
                        id="perfect_for"
                        value={formData.perfect_for || ""}
                        onChange={(e) => handleInputChange("perfect_for", e.target.value)}
                        placeholder="What type of adaptation/market is this perfect for?"
                        rows={3}
                      />
                    </td>
                  </tr>
                  <tr className="group hover:bg-gray-50">
                    <td className="py-4 w-48 text-sm font-semibold text-gray-700 align-top">Comparisons</td>
                    <td className="py-4 pl-6">
                      <Textarea
                        id="comps"
                        value={formData.comps || ""}
                        onChange={(e) => handleInputChange("comps", e.target.value)}
                        placeholder="Similar titles or comparable content"
                        rows={3}
                      />
                    </td>
                  </tr>
                  <tr className="group hover:bg-gray-50">
                    <td className="py-4 w-48 text-sm font-semibold text-gray-700">Tone</td>
                    <td className="py-4 pl-6">
                      <Input
                        id="tone"
                        value={formData.tone || ""}
                        onChange={(e) => handleInputChange("tone", e.target.value)}
                        placeholder="e.g., Dark, Light-hearted, Serious"
                      />
                    </td>
                  </tr>
                  <tr className="group hover:bg-gray-50">
                    <td className="py-4 w-48 text-sm font-semibold text-gray-700">Target Audience</td>
                    <td className="py-4 pl-6">
                      <Input
                        id="audience"
                        value={formData.audience || ""}
                        onChange={(e) => handleInputChange("audience", e.target.value)}
                        placeholder="e.g., Young Adults, Adults, All Ages"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Media & Links Section */}
            <div className="bg-gray-50 px-6 py-4 border-b-4 border-hanok-teal border-t-4">
              <h2 className="text-xl font-bold text-midnight-ink">Media & Links</h2>
            </div>
            <div className="px-6 py-6">
              <table className="w-full">
                <tbody className="divide-y divide-gray-100">
                  <tr className="group hover:bg-gray-50">
                    <td className="py-4 w-48 text-sm font-semibold text-gray-700">Title Image URL</td>
                    <td className="py-4 pl-6">
                      <Input
                        id="title_image"
                        value={formData.title_image || ""}
                        onChange={(e) => handleInputChange("title_image", e.target.value)}
                        placeholder="https://example.com/image.jpg"
                        className={errors.title_image ? "border-red-500" : ""}
                      />
                      {errors.title_image && (
                        <p className="text-red-500 text-sm flex items-center gap-1 mt-1">
                          <AlertCircle className="w-3 h-3" />
                          {errors.title_image}
                        </p>
                      )}
                    </td>
                  </tr>
                  <tr className="group hover:bg-gray-50">
                    <td className="py-4 w-48 text-sm font-semibold text-gray-700">Title URL</td>
                    <td className="py-4 pl-6">
                      <Input
                        id="title_url"
                        value={formData.title_url || ""}
                        onChange={(e) => handleInputChange("title_url", e.target.value)}
                        placeholder="https://example.com/title"
                        className={errors.title_url ? "border-red-500" : ""}
                      />
                      {errors.title_url && (
                        <p className="text-red-500 text-sm flex items-center gap-1 mt-1">
                          <AlertCircle className="w-3 h-3" />
                          {errors.title_url}
                        </p>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Admin Notes Section */}
            <div className="bg-gray-50 px-6 py-4 border-b-4 border-hanok-teal border-t-4">
              <h2 className="text-xl font-bold text-midnight-ink">Admin Notes</h2>
            </div>
            <div className="px-6 py-6">
              <table className="w-full">
                <tbody>
                  <tr className="group hover:bg-gray-50">
                    <td className="py-4 w-48 text-sm font-semibold text-gray-700 align-top">Internal Notes</td>
                    <td className="py-4 pl-6">
                      <Textarea
                        id="note"
                        value={formData.note || ""}
                        onChange={(e) => handleInputChange("note", e.target.value)}
                        placeholder="Internal notes for admin use only"
                        rows={3}
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-4 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/titles')}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-sunrise-coral hover:bg-sunrise-coral/90 text-white"
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
    </AdminLayout>
  );
}