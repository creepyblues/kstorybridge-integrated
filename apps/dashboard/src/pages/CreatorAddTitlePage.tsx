import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { useNavigate } from "react-router-dom";
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
import type { Database } from "@/integrations/supabase/types";

interface FormValues {
  title_name_en: string;
  title_name_kr: string;
  title_url: string;
  title_image: string;
  story_author: string;
  genre: Database["public"]["Enums"]["genre"] | "";
  synopsis?: string;
  tagline?: string;
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

export default function CreatorAddTitlePage() {
  const { user, session } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<FormValues>({
    defaultValues: {
      title_name_en: "",
      title_name_kr: "",
      title_url: "",
      title_image: "",
      story_author: "",
      genre: ""
    }
  });

  const onSubmit = async (values: FormValues) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in again to create a title.",
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
      const payload = {
        title_name_en: values.title_name_en.trim(),
        title_name_kr: values.title_name_kr.trim(),
        title_url: values.title_url.trim(),
        title_image: values.title_image.trim(),
        story_author: values.story_author.trim(),
        synopsis: values.synopsis?.trim() || null,
        tagline: values.tagline?.trim() || null,
        genre: values.genre ? [values.genre] : null,
        creator_id: user.id
      };

      await directApiService.createTitle(payload);

      toast({
        title: "Title created",
        description: "Your title was added successfully."
      });

      navigate("/creators/titles");
    } catch (error) {
      console.error("Failed to create title", error);
      toast({
        title: "Unable to create title",
        description: "Please verify the form details and try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="max-w-7xl mx-auto py-4 sm:py-6 lg:py-8 px-3 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 gap-4 sm:gap-0">
          <div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl xl:text-3xl font-bold text-midnight-ink leading-tight mb-2 sm:mb-4">ADD NEW TITLE</h2>
            <p className="text-sm sm:text-base lg:text-xl text-midnight-ink-600 leading-relaxed">
              Provide accurate information so buyers can discover your work quickly.
            </p>
          </div>
        </div>

        {/* Form Section */}
        <div className="mb-8 sm:mb-12">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">Title Details</h2>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6 sm:p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <Label htmlFor="title_name_en">English Title *</Label>
                  <Input
                    id="title_name_en"
                    placeholder="I Became a Doting Father"
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
                    {...register("title_name_kr", { required: true })}
                  />
                  {errors.title_name_kr && (
                    <p className="text-sm text-red-500 mt-1">Korean title is required.</p>
                  )}
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <Label htmlFor="title_url">Title URL *</Label>
                  <Input
                    id="title_url"
                    type="url"
                    placeholder="https://example.com"
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
                    {...register("title_image", { required: true })}
                  />
                  {errors.title_image && (
                    <p className="text-sm text-red-500 mt-1">Cover image URL is required.</p>
                  )}
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <Label htmlFor="story_author">Story Author *</Label>
                  <Input
                    id="story_author"
                    placeholder="Author name"
                    {...register("story_author", { required: true })}
                  />
                  {errors.story_author && (
                    <p className="text-sm text-red-500 mt-1">Story author is required.</p>
                  )}
                </div>
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
              </div>

              <div>
                <Label htmlFor="tagline">Tagline</Label>
                <Input
                  id="tagline"
                  placeholder="A compelling one-line description"
                  {...register("tagline")}
                />
              </div>

              <div>
                <Label htmlFor="synopsis">Synopsis</Label>
                <Textarea
                  id="synopsis"
                  rows={4}
                  placeholder="Brief synopsis of the title"
                  {...register("synopsis")}
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(-1)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-hanok-teal hover:bg-hanok-teal/90 text-white"
                  disabled={isSubmitting}
                >
                  Save Title
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
