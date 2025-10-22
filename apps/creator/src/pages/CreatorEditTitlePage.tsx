import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Textarea,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  useToast
} from "@kstorybridge/ui";

import { useAuth } from "@/hooks/useAuth";
import { directApiService, setDirectApiAccessToken } from "@/services/directApiService";
import { titlesService, type Title } from "@/services/titlesService";
import type { Database } from "@/integrations/supabase/types";

interface FormValues {
  title_name_en: string;
  title_name_kr: string;
  title_url: string;
  title_image: string;
  story_author: string;
  art_author?: string;
  genre: Database["public"]["Enums"]["genre"] | "";
  content_format: Database["public"]["Enums"]["content_format"] | "";
  synopsis?: string;
  tagline?: string;
  note?: string;
  chapters?: number;
  completed?: Database["public"]["Enums"]["completed"];
  tone?: string;
  audience?: string;
  perfect_for?: string;
  rights?: string;
  tags?: string; // comma-separated
  comps?: string; // comma-separated
}

const GENRE_OPTIONS: Database["public"]["Enums"]["genre"][] = [
  "romance",
  "fantasy",
  "action",
  "drama",
  "comedy",
  "thriller",
  "horror",
  "sci_fi",
  "slice_of_life",
  "historical",
  "mystery",
  "sports",
  "other"
];

const CONTENT_FORMAT_OPTIONS: Database["public"]["Enums"]["content_format"][] = [
  "webtoon",
  "web_novel",
  "book",
  "movie",
  "tv_series"
];

const COMPLETED_OPTIONS: Database["public"]["Enums"]["completed"][] = [
  "completed",
  "ongoing",
  "hiatus"
];

export default function CreatorEditTitlePage() {
  const { titleId } = useParams<{ titleId: string }>();
  const { user, session } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [title, setTitle] = useState<Title | null>(null);

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<FormValues>();

  // Load title data on component mount
  useEffect(() => {
    if (titleId) {
      loadTitle(titleId);
    }
  }, [titleId]);

  const loadTitle = async (id: string) => {
    try {
      setIsLoading(true);
      const titleData = await titlesService.getTitleById(id);
      setTitle(titleData);

      // Populate form with existing data
      reset({
        title_name_en: titleData.title_name_en || "",
        title_name_kr: titleData.title_name_kr || "",
        title_url: titleData.title_url || "",
        title_image: titleData.title_image || "",
        story_author: titleData.story_author || "",
        art_author: titleData.art_author || "",
        genre: (Array.isArray(titleData.genre) ? titleData.genre[0] : titleData.genre) || "",
        content_format: titleData.content_format || "",
        synopsis: titleData.synopsis || "",
        tagline: titleData.tagline || "",
        note: titleData.note || "",
        chapters: titleData.chapters || undefined,
        completed: titleData.completed || undefined,
        tone: titleData.tone || "",
        audience: titleData.audience || "",
        perfect_for: titleData.perfect_for || "",
        rights: titleData.rights || "",
        tags: Array.isArray(titleData.keywords) ? titleData.keywords.join(", ") : "",
        comps: Array.isArray(titleData.comps) ? titleData.comps.join(", ") : ""
      });
    } catch (error) {
      console.error("Error loading title:", error);
      toast({
        title: "Error loading title",
        description: "Failed to load title data for editing.",
        variant: "destructive"
      });
      navigate("/titles");
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (values: FormValues) => {
    if (!user || !titleId) {
      toast({
        title: "Authentication required",
        description: "Please sign in again to update the title.",
        variant: "destructive"
      });
      return;
    }

    try {
      const accessToken = session?.access_token;
      if (!accessToken) {
        toast({
          title: "Session expired",
          description: "Please sign in again to continue.",
          variant: "destructive"
        });
        return;
      }

      setDirectApiAccessToken(accessToken);
      setIsSubmitting(true);

      // Prepare update payload
      const updatePayload: Record<string, unknown> = {
        title_name_en: values.title_name_en.trim(),
        title_name_kr: values.title_name_kr.trim(),
        title_url: values.title_url.trim(),
        title_image: values.title_image.trim(),
        story_author: values.story_author.trim(),
        art_author: values.art_author?.trim() || null,
        synopsis: values.synopsis?.trim() || null,
        tagline: values.tagline?.trim() || null,
        note: values.note?.trim() || null,
        chapters: values.chapters || null,
        completed: values.completed || null,
        tone: values.tone?.trim() || null,
        audience: values.audience?.trim() || null,
        perfect_for: values.perfect_for?.trim() || null,
        rights: values.rights?.trim() || null,
        updated_at: new Date().toISOString()
      };

      // Handle genre (convert to array if not empty)
      if (values.genre) {
        updatePayload.genre = [values.genre];
      } else {
        updatePayload.genre = null;
      }

      // Handle content format
      if (values.content_format) {
        updatePayload.content_format = values.content_format;
      } else {
        updatePayload.content_format = null;
      }

      // Handle keywords (comma-separated string to array) - note: field is called 'keywords' not 'tags'
      if (values.tags?.trim()) {
        updatePayload.keywords = values.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      } else {
        updatePayload.keywords = null;
      }

      // Handle comps (comma-separated string to array)
      if (values.comps?.trim()) {
        updatePayload.comps = values.comps.split(',').map(comp => comp.trim()).filter(comp => comp);
      } else {
        updatePayload.comps = null;
      }

      await directApiService.updateTitle(titleId, updatePayload);

      toast({
        title: "Title updated",
        description: "Your title was updated successfully."
      });

      navigate(`/titles/${titleId}`);
    } catch (error) {
      console.error("Failed to update title", error);
      toast({
        title: "Unable to update title",
        description: "Please verify the form details and try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-hanok-teal mx-auto mb-4"></div>
          <p className="text-gray-600">Loading title data...</p>
        </div>
      </div>
    );
  }

  if (!title) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Title not found.</p>
          <Button onClick={() => navigate("/titles")} className="mt-4">
            Back to Titles
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="max-w-7xl mx-auto py-4 sm:py-6 lg:py-8 px-3 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 gap-4 sm:gap-0">
          <div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl xl:text-3xl font-bold text-midnight-ink leading-tight mb-2 sm:mb-4">
              EDIT TITLE
            </h2>
            <p className="text-sm sm:text-base lg:text-xl text-midnight-ink-600 leading-relaxed">
              Update your title information and details.
            </p>
            {title && (
              <p className="text-sm text-gray-500 mt-2">
                Editing: {title.title_name_en || title.title_name_kr}
              </p>
            )}
          </div>
        </div>

        {/* Form Section */}
        <div className="mb-8 sm:mb-12">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">
            Title Details
          </h2>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6 sm:p-8">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Basic Information */}
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <Label htmlFor="title_name_en">English Title *</Label>
                    <Input
                      id="title_name_en"
                      placeholder="I Became a Doting Father"
                      className="text-[#4C9C9B]"
                      {...register("title_name_en", { required: true })}
                    />
                    {errors.title_name_en && (
                      <p className="text-sm text-red-500 mt-1">English title is required.</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="title_name_kr">Korean Title *</Label>
                    <Input
                      id="title_name_kr"
                      placeholder="한국어 제목"
                      className="text-[#4C9C9B]"
                      {...register("title_name_kr", { required: true })}
                    />
                    {errors.title_name_kr && (
                      <p className="text-sm text-red-500 mt-1">Korean title is required.</p>
                    )}
                  </div>
                </div>

                {/* URLs and Images */}
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <Label htmlFor="title_url">Title URL *</Label>
                    <Input
                      id="title_url"
                      type="url"
                      placeholder="https://example.com"
                      className="text-[#4C9C9B]"
                      {...register("title_url", { required: true })}
                    />
                    {errors.title_url && (
                      <p className="text-sm text-red-500 mt-1">A valid URL is required.</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="title_image">Cover Image URL *</Label>
                    <Input
                      id="title_image"
                      type="url"
                      placeholder="https://.../cover.jpg"
                      className="text-[#4C9C9B]"
                      {...register("title_image", { required: true })}
                    />
                    {errors.title_image && (
                      <p className="text-sm text-red-500 mt-1">Cover image URL is required.</p>
                    )}
                  </div>
                </div>

                {/* Authors */}
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <Label htmlFor="story_author">Story Author *</Label>
                    <Input
                      id="story_author"
                      placeholder="Author name"
                      className="text-[#4C9C9B]"
                      {...register("story_author", { required: true })}
                    />
                    {errors.story_author && (
                      <p className="text-sm text-red-500 mt-1">Story author is required.</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="art_author">Art Author</Label>
                    <Input
                      id="art_author"
                      placeholder="Artist name"
                      className="text-[#4C9C9B]"
                      {...register("art_author")}
                    />
                  </div>
                </div>

                {/* Genre and Format */}
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <Label>Genre *</Label>
                    <Controller
                      name="genre"
                      control={control}
                      rules={{ required: true }}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select genre" />
                          </SelectTrigger>
                          <SelectContent>
                            {GENRE_OPTIONS.map(option => (
                              <SelectItem key={option} value={option}>
                                {option.replace(/_/g, " ")}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.genre && (
                      <p className="text-sm text-red-500 mt-1">Genre is required.</p>
                    )}
                  </div>
                  <div>
                    <Label>Content Format</Label>
                    <Controller
                      name="content_format"
                      control={control}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select format" />
                          </SelectTrigger>
                          <SelectContent>
                            {CONTENT_FORMAT_OPTIONS.map(option => (
                              <SelectItem key={option} value={option}>
                                {option.replace(/_/g, " ")}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                </div>

                {/* Chapters and Completion Status */}
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <Label htmlFor="chapters">Number of Chapters</Label>
                    <Input
                      id="chapters"
                      type="number"
                      placeholder="68"
                      className="text-[#4C9C9B]"
                      {...register("chapters", { valueAsNumber: true })}
                    />
                  </div>
                  <div>
                    <Label>Completion Status</Label>
                    <Controller
                      name="completed"
                      control={control}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            {COMPLETED_OPTIONS.map(option => (
                              <SelectItem key={option} value={option}>
                                {option.replace(/_/g, " ")}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                </div>

                {/* Market Information */}
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <Label htmlFor="tone">Tone</Label>
                    <Input
                      id="tone"
                      placeholder="EXCITING"
                      className="text-[#4C9C9B]"
                      {...register("tone")}
                    />
                  </div>
                  <div>
                    <Label htmlFor="audience">Target Audience</Label>
                    <Input
                      id="audience"
                      placeholder="ADULTS 18-34"
                      className="text-[#4C9C9B]"
                      {...register("audience")}
                    />
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <Label htmlFor="perfect_for">Perfect For</Label>
                    <Input
                      id="perfect_for"
                      placeholder="DRAMA SERIES"
                      className="text-[#4C9C9B]"
                      {...register("perfect_for")}
                    />
                  </div>
                  <div>
                    <Label htmlFor="rights">Rights</Label>
                    <Input
                      id="rights"
                      placeholder="MANTA/RIDI"
                      className="text-[#4C9C9B]"
                      {...register("rights")}
                    />
                  </div>
                </div>

                {/* Tags and Comps */}
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <Label htmlFor="tags">Tags (comma-separated)</Label>
                    <Input
                      id="tags"
                      placeholder="contemporary, supernatural, horror"
                      className="text-[#4C9C9B]"
                      {...register("tags")}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Separate multiple tags with commas
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="comps">Comparable Titles (comma-separated)</Label>
                    <Input
                      id="comps"
                      placeholder="The Grudge, Train to Busan"
                      className="text-[#4C9C9B]"
                      {...register("comps")}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Separate multiple titles with commas
                    </p>
                  </div>
                </div>

                {/* Text Fields */}
                <div>
                  <Label htmlFor="tagline">Tagline</Label>
                  <Input
                    id="tagline"
                    placeholder="A compelling one-line description"
                    className="text-[#4C9C9B]"
                    {...register("tagline")}
                  />
                </div>

                <div>
                  <Label htmlFor="synopsis">Synopsis</Label>
                  <Textarea
                    id="synopsis"
                    rows={4}
                    placeholder="Brief synopsis of the title"
                    className="text-[#4C9C9B]"
                    {...register("synopsis")}
                  />
                </div>

                <div>
                  <Label htmlFor="note">Internal Notes</Label>
                  <Textarea
                    id="note"
                    rows={3}
                    placeholder="Internal notes about this title"
                    className="text-[#4C9C9B]"
                    {...register("note")}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-6 border-t border-gray-300">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate(`/titles/${titleId}`)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-hanok-teal hover:bg-hanok-teal/90 text-white"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Updating..." : "Update Title"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}