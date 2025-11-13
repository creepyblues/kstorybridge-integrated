/**
 * Content Editor Page (Admin)
 * Create or edit a CMS content post
 */

import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  getPost,
  createPost,
  updatePost,
  uploadImage,
  generateSlug,
  isSlugUnique,
  type ContentPostInsert,
} from '@/services/contentService';
import { Button, Input, Label, Textarea, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Card, CardContent, CardHeader, CardTitle } from '@kstorybridge/ui';
import { RichTextEditor } from '@/components/RichTextEditor';
import { ArrowLeft, Save, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

// Form validation schema
const postSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens only'),
  excerpt: z.string().max(500, 'Excerpt must be less than 500 characters').optional(),
  content: z.string().min(1, 'Content is required'),
  category: z.enum(['learning', 'news']),
  tags: z.string(), // Comma-separated, will be split into array
  featured_image_url: z.string().url().optional().or(z.literal('')),
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
      excerpt: '',
      content: '',
      category: 'learning',
      tags: '',
      featured_image_url: '',
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
      setValue('excerpt', existingPost.excerpt || '');
      setValue('content', existingPost.content);
      setValue('category', existingPost.category as 'learning' | 'news');
      setValue('tags', existingPost.tags?.join(', ') || '');
      setValue('featured_image_url', existingPost.featured_image_url || '');
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
        excerpt: data.excerpt || null,
        content: data.content,
        category: data.category,
        tags: tagsArray,
        featured_image_url: data.featured_image_url || null,
        status: data.status,
        author_email: user?.email || 'unknown',
        author_name: user?.user_metadata?.full_name || user?.email || 'Admin',
      };

      // Debug logging
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

      if (isEditMode) {
        console.log('🔄 Content Editor - Calling updatePost with:', {
          id: id,
          postData: {
            ...postData,
            content: `[${postData.content?.length || 0} chars] ${postData.content?.substring(0, 50)}...`
          }
        });
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

      navigate('/admin/content');
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

  const handleImageUpload = async (file: File): Promise<string> => {
    try {
      return await uploadImage(file, id);
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-gray-500">Loading post...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl">
        <CardHeader>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/admin/content')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <CardTitle className="text-2xl font-bold">
              {isEditMode ? 'Edit Post' : 'Create New Post'}
            </CardTitle>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Title */}
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

            {/* Slug */}
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
              <p className="text-xs text-gray-500 mt-1">
                Auto-generated from title. Use lowercase letters, numbers, and hyphens only.
              </p>
            </div>

            {/* Category & Status Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            </div>

            {/* Excerpt */}
            <div>
              <Label htmlFor="excerpt">Excerpt (Optional)</Label>
              <Textarea
                id="excerpt"
                {...register('excerpt')}
                placeholder="Short description for card previews (max 500 characters)"
                rows={3}
                className={errors.excerpt ? 'border-red-500' : ''}
              />
              {errors.excerpt && (
                <p className="text-sm text-red-500 mt-1">{errors.excerpt.message}</p>
              )}
            </div>

            {/* Featured Image */}
            <div>
              <Label htmlFor="featured_image_url">Featured Image URL (Optional)</Label>
              <Input
                id="featured_image_url"
                {...register('featured_image_url')}
                placeholder="https://example.com/image.jpg"
                className={errors.featured_image_url ? 'border-red-500' : ''}
              />
              {errors.featured_image_url && (
                <p className="text-sm text-red-500 mt-1">{errors.featured_image_url.message}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Upload images directly in the editor, or provide a URL here for the card preview.
              </p>
            </div>

            {/* Tags */}
            <div>
              <Label htmlFor="tags">Tags (Optional)</Label>
              <Input
                id="tags"
                {...register('tags')}
                placeholder="tag1, tag2, tag3"
              />
              <p className="text-xs text-gray-500 mt-1">
                Comma-separated tags for filtering and categorization.
              </p>
            </div>

            {/* Content Editor */}
            <div>
              <Label>Content *</Label>
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
              {errors.content && (
                <p className="text-sm text-red-500 mt-1">{errors.content.message}</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
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
            <div className="mt-8 p-6 border border-gray-300 rounded-lg bg-white">
              <h2 className="text-3xl font-bold mb-4">{watchTitle || 'Untitled'}</h2>
              <div
                className="prose prose-sm sm:prose lg:prose-lg max-w-none"
                dangerouslySetInnerHTML={{ __html: watchContent }}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
