/**
 * Content Service
 * Handles CRUD operations for CMS content posts (Learning Center & News)
 */

import { supabase } from "@/lib/supabase";

export interface ContentPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  featured_image_url: string | null;
  category: 'learning' | 'news';
  tags: string[] | null;
  author_email: string;
  author_name: string;
  status: 'draft' | 'published' | 'archived';
  published_at: string | null;
  meta_description: string | null;
  meta_keywords: string[] | null;
  created_at: string;
  updated_at: string;
}

export type ContentPostInsert = Omit<ContentPost, 'id' | 'created_at' | 'updated_at'>;
export type ContentPostUpdate = Partial<ContentPostInsert>;

/**
 * Generate URL-friendly slug from title
 */
export const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')  // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, '')       // Remove leading/trailing hyphens
    .substring(0, 100);             // Limit length
};

/**
 * List all content posts with optional filters
 */
export const listPosts = async (filters?: {
  category?: 'learning' | 'news';
  status?: 'draft' | 'published' | 'archived';
  search?: string;
  tags?: string[];
  limit?: number;
  offset?: number;
}) => {
  try {
    let query = supabase
      .from('content_posts')
      .select('*', { count: 'exact' });

    // Apply filters
    if (filters?.category) {
      query = query.eq('category', filters.category);
    }

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.search) {
      query = query.or(`title.ilike.%${filters.search}%,excerpt.ilike.%${filters.search}%`);
    }

    if (filters?.tags && filters.tags.length > 0) {
      query = query.contains('tags', filters.tags);
    }

    // Order by published date (desc) for published, created date (desc) for drafts
    if (filters?.status === 'published') {
      query = query.order('published_at', { ascending: false });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    // Pagination
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Error listing posts:', error);
      throw error;
    }

    return { posts: data || [], count: count || 0 };
  } catch (error) {
    console.error('Exception in listPosts:', error);
    throw error;
  }
};

/**
 * Get a single post by ID
 */
export const getPost = async (id: string): Promise<ContentPost | null> => {
  try {
    const { data, error } = await supabase
      .from('content_posts')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching post:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Exception in getPost:', error);
    throw error;
  }
};

/**
 * Get a single post by slug (for public display)
 */
export const getPostBySlug = async (slug: string): Promise<ContentPost | null> => {
  try {
    const { data, error } = await supabase
      .from('content_posts')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'published')  // Only return published posts
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found
        return null;
      }
      console.error('Error fetching post by slug:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Exception in getPostBySlug:', error);
    throw error;
  }
};

/**
 * Create a new content post
 */
export const createPost = async (post: ContentPostInsert): Promise<ContentPost> => {
  try {
    // Generate slug if not provided
    if (!post.slug && post.title) {
      post.slug = generateSlug(post.title);
    }

    const { data, error } = await supabase
      .from('content_posts')
      .insert(post)
      .select()
      .single();

    if (error) {
      console.error('Error creating post:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Exception in createPost:', error);
    throw error;
  }
};

/**
 * Update an existing content post
 */
export const updatePost = async (
  id: string,
  updates: ContentPostUpdate
): Promise<ContentPost> => {
  try {
    // Regenerate slug if title changed
    if (updates.title && !updates.slug) {
      updates.slug = generateSlug(updates.title);
    }

    // Auto-set published_at when publishing (handled by trigger, but can set manually)
    if (updates.status === 'published' && !updates.published_at) {
      updates.published_at = new Date().toISOString();
    }

    // Debug logging
    console.log('🔄 contentService.updatePost - Received update request:', {
      id: id,
      updateFields: Object.keys(updates),
      title: updates.title,
      slug: updates.slug,
      status: updates.status,
      category: updates.category,
      hasContent: !!updates.content,
      contentLength: updates.content?.length || 0,
      contentPreview: updates.content
        ? `[${updates.content.length} chars] ${updates.content.substring(0, 50)}...`
        : 'NO CONTENT IN UPDATE',
    });

    const { data, error } = await supabase
      .from('content_posts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ contentService.updatePost - Supabase error:', error);
      throw error;
    }

    console.log('✅ contentService.updatePost - Update successful:', {
      id: data.id,
      title: data.title,
      status: data.status,
      contentLength: data.content?.length || 0,
      contentPreview: data.content ? `${data.content.substring(0, 50)}...` : 'NO CONTENT',
      updated_at: data.updated_at,
    });

    return data;
  } catch (error) {
    console.error('Exception in updatePost:', error);
    throw error;
  }
};

/**
 * Delete a content post
 */
export const deletePost = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('content_posts')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting post:', error);
      throw error;
    }
  } catch (error) {
    console.error('Exception in deletePost:', error);
    throw error;
  }
};

/**
 * Upload an image to Supabase Storage
 * Returns the public URL of the uploaded image
 */
export const uploadImage = async (
  file: File,
  postId?: string
): Promise<string> => {
  try {
    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = postId
      ? `${postId}/${timestamp}_${sanitizedName}`
      : `temp/${timestamp}_${sanitizedName}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('content-posts-images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Error uploading image:', error);
      throw error;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('content-posts-images')
      .getPublicUrl(data.path);

    return publicUrl;
  } catch (error) {
    console.error('Exception in uploadImage:', error);
    throw error;
  }
};

/**
 * Delete an image from Supabase Storage
 */
export const deleteImage = async (imagePath: string): Promise<void> => {
  try {
    // Extract path from full URL if needed
    const path = imagePath.includes('content-posts-images/')
      ? imagePath.split('content-posts-images/')[1]
      : imagePath;

    const { error } = await supabase.storage
      .from('content-posts-images')
      .remove([path]);

    if (error) {
      console.error('Error deleting image:', error);
      throw error;
    }
  } catch (error) {
    console.error('Exception in deleteImage:', error);
    throw error;
  }
};

/**
 * Check if slug is unique (for validation)
 */
export const isSlugUnique = async (slug: string, excludeId?: string): Promise<boolean> => {
  try {
    let query = supabase
      .from('content_posts')
      .select('id')
      .eq('slug', slug);

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error checking slug uniqueness:', error);
      throw error;
    }

    return data.length === 0;
  } catch (error) {
    console.error('Exception in isSlugUnique:', error);
    throw error;
  }
};
