import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, useToast } from "@kstorybridge/ui";
import { X, Plus } from "lucide-react";
import { titlesService, type Title } from "@/services/titlesService";
import { useAuth } from "@/hooks/useAuth";
import type { Database } from "@/integrations/supabase/types";

interface TitleFormProps {
  title?: Title;
  onSave: (title: Title) => void;
  onCancel: () => void;
}

interface FormData {
  title_name_en: string;
  title_name_kr: string;
  title_image: string;
  author: string;
  writer: string;
  illustrator: string;
  synopsis: string;
  pitch: string;
  title_url: string;
  genre: string[] | null;
  content_format: string | null;
  views: number;
  likes: number;
  rating: number;
  rating_count: number;
}

export function TitleForm({ title, onSave, onCancel }: TitleFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [tags, setTags] = useState<string[]>(title?.tags || []);
  const [genres, setGenres] = useState<string[]>(title?.genre || []);
  const [newTag, setNewTag] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      title_name_en: title?.title_name_en || "",
      title_name_kr: title?.title_name_kr || "",
      title_image: title?.title_image || "",
      author: title?.author || "",
      writer: title?.writer || "",
      illustrator: title?.illustrator || "",
      synopsis: title?.synopsis || "",
      pitch: title?.pitch || "",
      title_url: title?.title_url || "",
      genre: title?.genre || [],
      content_format: title?.content_format || null,
      views: title?.views || 0,
      likes: title?.likes || 0,
      rating: title?.rating || 0,
      rating_count: title?.rating_count || 0,
    },
  });

  useEffect(() => {
    if (title) {
      setTags(title.tags || []);
      setGenres(title.genre || []);
    }
  }, [title]);

  const handleTagAdd = () => {
    if (newTag.trim() !== "") {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const handleTagDelete = (tagToDelete: string) => {
    setTags(tags.filter((tag) => tag !== tagToDelete));
  };

  const handleGenreAdd = (genreToAdd: string) => {
    if (!genres.includes(genreToAdd)) {
      const newGenres = [...genres, genreToAdd];
      setGenres(newGenres);
      setValue("genre", newGenres);
    }
  };

  const handleGenreRemove = (genreToRemove: string) => {
    const newGenres = genres.filter((genre) => genre !== genreToRemove);
    setGenres(newGenres);
    setValue("genre", newGenres);
  };

  const onSubmit = async (data: FormData) => {
    if (
      !data.title_name_en &&
      !data.title_name_kr
    ) {
      toast({
        title: "Error",
        description: "At least one title (English or Korean) is required.",
        variant: "destructive",
      });
      return;
    }

    handleConfirmedSubmit(data);
  };

  const handleConfirmedSubmit = async (data: FormData) => {
    if (!user) return;

    try {
      setIsSubmitting(true);
      
      const titleData = {
        ...data,
        tags,
        genres,
        creator_id: user.id,
        genre: genres.length > 0 ? genres : null,
        content_format: (data.content_format && data.content_format !== "") ? data.content_format as Database['public']['Enums']['content_format'] : null,
      };

      let savedTitle: Title;
      if (title) {
        savedTitle = await titlesService.updateTitle(title.title_id, titleData);
        toast({ title: "Title updated successfully" });
      } else {
        savedTitle = await titlesService.createTitle(titleData);
        toast({ title: "Title created successfully" });
      }

      onSave(savedTitle);
      navigate(`/titles/${savedTitle.title_id}`);
    } catch (error) {
      console.error("Error saving title:", error);
      toast({ title: "Error saving title", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white">{title ? "Edit Title" : "Create New Title"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="title_name_en" className="text-slate-300">
              Title (English)
            </Label>
            <Input
              id="title_name_en"
              className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-400"
              placeholder="Enter English title"
              {...register("title_name_en")}
            />
          </div>
          <div>
            <Label htmlFor="title_name_kr" className="text-slate-300">
              Title (Korean)
            </Label>
            <Input
              id="title_name_kr"
              className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-400"
              placeholder="Enter Korean title"
              {...register("title_name_kr")}
            />
          </div>
          <div>
            <Label htmlFor="title_image" className="text-slate-300">
              Title Image URL
            </Label>
            <Input
              id="title_image"
              className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-400"
              placeholder="Enter image URL"
              {...register("title_image")}
            />
          </div>
          <div>
            <Label htmlFor="author" className="text-slate-300">
              Author
            </Label>
            <Input
              id="author"
              className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-400"
              placeholder="Enter author"
              {...register("author")}
            />
          </div>
          <div>
            <Label htmlFor="writer" className="text-slate-300">
              Writer
            </Label>
            <Input
              id="writer"
              className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-400"
              placeholder="Enter writer"
              {...register("writer")}
            />
          </div>
          <div>
            <Label htmlFor="illustrator" className="text-slate-300">
              Illustrator
            </Label>
            <Input
              id="illustrator"
              className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-400"
              placeholder="Enter illustrator"
              {...register("illustrator")}
            />
          </div>
          <div>
            <Label htmlFor="synopsis" className="text-slate-300">
              Synopsis
            </Label>
            <Textarea
              id="synopsis"
              className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-400 resize-none"
              placeholder="Enter synopsis"
              {...register("synopsis")}
            />
          </div>
          <div>
            <Label htmlFor="pitch" className="text-slate-300">
              Pitch
            </Label>
            <Textarea
              id="pitch"
              className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-400 resize-none"
              placeholder="Enter pitch"
              {...register("pitch")}
            />
          </div>
          <div>
            <Label htmlFor="title_url" className="text-slate-300">
              Title URL
            </Label>
            <Input
              id="title_url"
              className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-400"
              placeholder="Enter title URL"
              {...register("title_url")}
            />
          </div>
          <div>
            <Label htmlFor="genre" className="text-slate-300">Genres</Label>
            <Select onValueChange={handleGenreAdd}>
              <SelectTrigger className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-400">
                <SelectValue placeholder="Add a genre" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800/80 border-slate-700 backdrop-blur-sm">
                <SelectItem value="action">Action</SelectItem>
                <SelectItem value="adventure">Adventure</SelectItem>
                <SelectItem value="comedy">Comedy</SelectItem>
                <SelectItem value="drama">Drama</SelectItem>
                <SelectItem value="fantasy">Fantasy</SelectItem>
                <SelectItem value="horror">Horror</SelectItem>
                <SelectItem value="mystery">Mystery</SelectItem>
                <SelectItem value="romance">Romance</SelectItem>
                <SelectItem value="sci_fi">Sci-Fi</SelectItem>
                <SelectItem value="slice_of_life">Slice of Life</SelectItem>
                <SelectItem value="sports">Sports</SelectItem>
                <SelectItem value="thriller">Thriller</SelectItem>
              </SelectContent>
            </Select>
            {genres.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {genres.map((genre, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="bg-slate-700 text-slate-200 hover:bg-slate-600"
                  >
                    {genre.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    <button
                      type="button"
                      onClick={() => handleGenreRemove(genre)}
                      className="ml-2 text-slate-400 hover:text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <div>
            <Label htmlFor="content_format" className="text-slate-300">Content Format</Label>
            <Select onValueChange={(value) => setValue("content_format", value)}>
              <SelectTrigger className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-400">
                <SelectValue placeholder="Select content format" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800/80 border-slate-700 backdrop-blur-sm">
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
          <div>
            <Label className="text-slate-300">Tags</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 cursor-pointer"
                  onClick={() => handleTagDelete(tag)}
                >
                  {tag}
                  <X className="h-3 w-3 ml-1" />
                </Badge>
              ))}
            </div>
            <div className="flex items-center space-x-2">
              <Input
                type="text"
                placeholder="Add a tag"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-400"
              />
              <Button type="button" variant="outline" size="sm" onClick={handleTagAdd}>
                <Plus className="h-4 w-4 mr-2" />
                Add Tag
              </Button>
            </div>
          </div>
          <div className="flex justify-between">
            <Button variant="ghost" onClick={onCancel} className="text-slate-400 hover:text-white">
              Cancel
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Save"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-slate-900/80 border-slate-700 backdrop-blur-sm">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-white">
                    {title ? "Update Title" : "Create New Title"}?
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-slate-400">
                    Are you sure you want to {title ? "update" : "create"} this title?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="text-slate-400 hover:text-white">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction>{title ? "Update" : "Create"}</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
