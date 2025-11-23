/**
 * Content Editor Page (Admin)
 * Create or edit a CMS content post
 */

import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import DOMPurify from 'dompurify';
import {
  getPost,
  createPost,
  updatePost,
  uploadImage,
  generateSlug,
  isSlugUnique,
  type ContentPostInsert,
} from '@/services/contentService';
import { RichTextEditor } from '@/components/RichTextEditor';
import { ArrowLeft, Save, Eye, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Form validation schema
const postSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens only'),
  content: z.string().min(1, 'Content is required'),
  category: z.enum(['learning', 'news']),
  tags: z.string(), // Comma-separated, will be split into array
  status: z.enum(['draft', 'published', 'archived']),
});

type PostFormData = z.infer<typeof postSchema>;

export const ContentEditor = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const { user } = useAuth();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  const isEditMode = !!id;

  // Fetch existing post if editing
  const { data: existingPost, isLoading } = useQuery({
    queryKey: ['content-post', id],
    queryFn: () => getPost(id!),
    enabled: isEditMode,
  });

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PostFormData>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      title: '',
      slug: '',
      content: '',
      category: 'learning',
      tags: '',
      status: 'draft',
    },
  });

  const watchTitle = watch('title');
  const watchContent = watch('content');

  // Populate form with existing data
  useEffect(() => {
    if (existingPost) {
      setValue('title', existingPost.title);
      setValue('slug', existingPost.slug);
      setValue('content', existingPost.content);
      setValue('category', existingPost.category as 'learning' | 'news');
      setValue('tags', existingPost.tags?.join(', ') || '');
      setValue('status', existingPost.status as 'draft' | 'published' | 'archived');
    }
  }, [existingPost, setValue]);

  // Auto-generate slug from title
  useEffect(() => {
    if (watchTitle && !isEditMode) {
      const newSlug = generateSlug(watchTitle);
      setValue('slug', newSlug);
    }
  }, [watchTitle, isEditMode, setValue]);

  const onSubmit = async (data: PostFormData) => {
    setIsSubmitting(true);

    try {
      // Validate slug uniqueness
      const slugIsUnique = await isSlugUnique(data.slug, id);
      if (!slugIsUnique) {
        toast({
          title: 'Slug already exists',
          description: 'Please choose a different slug.',
          variant: 'destructive',
        });
        setIsSubmitting(false);
        return;
      }

      // Parse tags
      const tagsArray = data.tags
        ? data.tags.split(',').map((tag) => tag.trim()).filter((tag) => tag.length > 0)
        : [];

      // Prepare post data
      const postData: ContentPostInsert = {
        title: data.title,
        slug: data.slug,
        excerpt: null,
        content: data.content,
        category: data.category,
        tags: tagsArray,
        featured_image_url: null,
        status: data.status,
        author_email: user?.email || 'unknown',
        author_name: user?.user_metadata?.full_name || user?.email || 'Admin',
      };

      // Debug logging (development only)
      if (import.meta.env.DEV) {
        console.log('📝 Content Editor - Preparing to submit post:', {
          id: id,
          mode: isEditMode ? 'UPDATE' : 'CREATE',
          title: postData.title,
          slug: postData.slug,
          status: postData.status,
          category: postData.category,
          contentLength: postData.content?.length || 0,
          contentPreview: postData.content ? postData.content.substring(0, 100) + '...' : 'NO CONTENT',
          hasExcerpt: !!postData.excerpt,
          hasFeaturedImage: !!postData.featured_image_url,
          tagsCount: postData.tags?.length || 0,
        });
      }

      if (isEditMode) {
        if (import.meta.env.DEV) {
          console.log('🔄 Content Editor - Calling updatePost with:', {
            id: id,
            postData: {
              ...postData,
              content: `[${postData.content?.length || 0} chars] ${postData.content?.substring(0, 50)}...`
            }
          });
        }
        await updatePost(id!, postData);
        toast({
          title: 'Post updated',
          description: `"${data.title}" has been updated successfully.`,
        });
      } else {
        await createPost(postData);
        toast({
          title: 'Post created',
          description: `"${data.title}" has been created successfully.`,
        });
      }

      // Don't navigate away - stay on the page
    } catch (error) {
      console.error('Error saving post:', error);
      toast({
        title: 'Error',
        description: 'Failed to save post. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePublish = async () => {
    const data = watch();
    setIsSubmitting(true);

    try {
      // Validate slug uniqueness
      const slugIsUnique = await isSlugUnique(data.slug, id);
      if (!slugIsUnique) {
        toast({
          title: 'Slug already exists',
          description: 'Please choose a different slug.',
          variant: 'destructive',
        });
        setIsSubmitting(false);
        return;
      }

      // Parse tags
      const tagsArray = data.tags
        ? data.tags.split(',').map((tag) => tag.trim()).filter((tag) => tag.length > 0)
        : [];

      // Prepare post data with status set to 'published'
      const postData: ContentPostInsert = {
        title: data.title,
        slug: data.slug,
        excerpt: null,
        content: data.content,
        category: data.category,
        tags: tagsArray,
        featured_image_url: null,
        status: 'published', // Always set to published
        author_email: user?.email || 'unknown',
        author_name: user?.user_metadata?.full_name || user?.email || 'Admin',
      };

      if (isEditMode) {
        await updatePost(id!, postData);
        setValue('status', 'published'); // Update form status
        toast({
          title: 'Post published',
          description: `"${data.title}" has been published successfully.`,
        });
      } else {
        await createPost(postData);
        setValue('status', 'published'); // Update form status
        toast({
          title: 'Post published',
          description: `"${data.title}" has been created and published successfully.`,
        });
      }

      // Don't navigate away - stay on the page
    } catch (error) {
      console.error('Error publishing post:', error);
      toast({
        title: 'Error',
        description: 'Failed to publish post. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageUpload = async (file: File): Promise<string> => {
    try {
      return await uploadImage(file, id);
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  };

  // Sanitize content for preview to prevent XSS attacks
  const sanitizedContent = useMemo(() => {
    if (!watchContent) return '';

    return DOMPurify.sanitize(watchContent, {
      ALLOWED_TAGS: [
        'p', 'br', 'strong', 'em', 'u', 's', 'code', 'pre',
        'h1', 'h2', 'h3', 'ul', 'ol', 'li',
        'blockquote', 'a', 'img', 'hr'
      ],
      ALLOWED_ATTR: ['href', 'src', 'alt', 'class', 'target', 'rel'],
      ALLOW_DATA_ATTR: false,
    });
  }, [watchContent]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-gray-500">Loading post...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <div className="container mx-auto px-4 py-4 max-w-5xl flex-shrink-0">
        <div className="flex items-center gap-4 mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/admin/content')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">
            {isEditMode ? 'Edit Post' : 'Create New Post'}
          </h1>
        </div>
      </div>

      <div className="flex-1 overflow-hidden container mx-auto px-4 max-w-5xl">
        <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl h-full flex flex-col overflow-hidden">
        <CardContent className="p-4 sm:p-6 flex-1 overflow-hidden flex flex-col">
          <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col overflow-hidden gap-6">
            {/* Scrollable metadata fields */}
            <div className="overflow-y-auto flex-shrink-0 space-y-6 max-h-[15vh] lg:max-h-[40vh]">
            {/* Title & Slug Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  {...register('title')}
                  placeholder="Enter post title"
                  className={errors.title ? 'border-red-500' : ''}
                />
                {errors.title && (
                  <p className="text-sm text-red-500 mt-1">{errors.title.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="slug">Slug (URL) *</Label>
                <Input
                  id="slug"
                  {...register('slug')}
                  placeholder="url-friendly-slug"
                  className={errors.slug ? 'border-red-500' : ''}
                />
                {errors.slug && (
                  <p className="text-sm text-red-500 mt-1">{errors.slug.message}</p>
                )}
              </div>
            </div>

            {/* Category, Status & Tags Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="category">Category *</Label>
                <Controller
                  name="category"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="learning">Learning Center</SelectItem>
                        <SelectItem value="news">News & Updates</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div>
                <Label htmlFor="status">Status *</Label>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="published">Published</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div>
                <Label htmlFor="tags">Tags (Optional)</Label>
                <Input
                  id="tags"
                  {...register('tags')}
                  placeholder="tag1, tag2, tag3"
                />
              </div>
            </div>
            </div>

            {/* Content Editor - fills remaining space */}
            <div className="flex-1 overflow-hidden flex flex-col min-h-0 gap-2">
              <Label>Content *</Label>
              <div className="flex-1 overflow-hidden min-h-0">
                <Controller
                  name="content"
                  control={control}
                  render={({ field }) => (
                    <RichTextEditor
                      content={field.value}
                      onChange={field.onChange}
                      onImageUpload={handleImageUpload}
                      placeholder="Start writing your post content..."
                    />
                  )}
                />
              </div>
              {errors.content && (
                <p className="text-sm text-red-500 mt-1">{errors.content.message}</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 flex-shrink-0">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-black text-white hover:bg-gray-800 flex-1"
              >
                <Save className="h-4 w-4 mr-2" />
                {isSubmitting ? 'Saving...' : isEditMode ? 'Update Post' : 'Create Post'}
              </Button>

              <Button
                type="button"
                onClick={handlePublish}
                disabled={isSubmitting}
                className="bg-green-600 text-white hover:bg-green-700 flex-1"
              >
                <Upload className="h-4 w-4 mr-2" />
                Publish
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => setPreviewMode(!previewMode)}
                className="border-gray-300 hover:bg-gray-100"
              >
                <Eye className="h-4 w-4 mr-2" />
                {previewMode ? 'Edit' : 'Preview'}
              </Button>
            </div>
          </form>

          {/* Preview Mode */}
          {previewMode && (
            <div className="mt-4 border border-gray-300 rounded-lg bg-white overflow-y-auto" style={{ maxHeight: '60vh' }}>
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-600">Preview Mode</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPreviewMode(false)}
                  className="border-gray-300 hover:bg-gray-100"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Edit
                </Button>
              </div>
              <div className="p-6">
                <h2 className="text-3xl font-bold mb-4">{watchTitle || 'Untitled'}</h2>
                <div
                  className="prose prose-sm sm:prose lg:prose-lg max-w-none"
                  dangerouslySetInnerHTML={{ __html: sanitizedContent }}
                />
              </div>
            </div>
          )}
        </CardContent>
        </Card>
      </div>
    </div>
  );
};
