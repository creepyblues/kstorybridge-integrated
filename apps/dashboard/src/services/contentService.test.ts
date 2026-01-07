/**
 * ContentService Unit Tests
 *
 * Tests for CMS content post CRUD operations, image upload, and slug generation.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  generateSlug,
  listPosts,
  getPost,
  getPostBySlug,
  createPost,
  updatePost,
  deletePost,
  uploadImage,
  deleteImage,
  isSlugUnique,
} from './contentService';
import { supabase } from '@/lib/supabase';

// Mock Supabase client
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    storage: {
      from: vi.fn(),
    },
  },
}));

// Suppress console logs during tests
vi.spyOn(console, 'log').mockImplementation(() => {});
vi.spyOn(console, 'error').mockImplementation(() => {});

// Helper to create mock query builder
function createMockQueryBuilder(
  returnValue: { data?: unknown; error?: unknown; count?: number | null } = { data: null, error: null }
) {
  const builder = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    contains: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(returnValue),
    then: (resolve: (value: typeof returnValue) => void) => Promise.resolve(resolve(returnValue)),
  };

  // Make builder thenable
  Object.defineProperty(builder, 'then', {
    value: (resolve: (value: typeof returnValue) => void) => Promise.resolve(resolve(returnValue)),
    configurable: true,
  });

  return builder;
}

// Helper to create mock storage builder
function createMockStorageBuilder(returnValue: { data?: unknown; error?: unknown } = { data: null, error: null }) {
  return {
    upload: vi.fn().mockResolvedValue(returnValue),
    remove: vi.fn().mockResolvedValue(returnValue),
    getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://example.com/image.jpg' } }),
  };
}

describe('ContentService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mockPost = {
    id: 'post-1',
    title: 'Test Article',
    slug: 'test-article',
    excerpt: 'This is a test article',
    content: '<p>Full content here</p>',
    category: 'learning',
    status: 'published',
    tags: ['webtoon', 'tips'],
    featured_image: 'https://example.com/image.jpg',
    published_at: '2024-01-01T00:00:00Z',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  describe('generateSlug', () => {
    it('should convert title to lowercase slug', () => {
      expect(generateSlug('Hello World')).toBe('hello-world');
    });

    it('should replace special characters with hyphens', () => {
      expect(generateSlug('Hello! World?')).toBe('hello-world');
      expect(generateSlug('Test: Article #1')).toBe('test-article-1');
    });

    it('should remove leading/trailing hyphens', () => {
      expect(generateSlug('---Hello---')).toBe('hello');
      expect(generateSlug('!Hello World!')).toBe('hello-world');
    });

    it('should handle multiple spaces and special characters', () => {
      expect(generateSlug('Hello   World')).toBe('hello-world');
      expect(generateSlug('Test---Article')).toBe('test-article');
    });

    it('should limit slug length to 100 characters', () => {
      const longTitle = 'A'.repeat(150);
      expect(generateSlug(longTitle).length).toBeLessThanOrEqual(100);
    });

    it('should handle Korean characters', () => {
      expect(generateSlug('웹툰 가이드')).toBe('');
      expect(generateSlug('Webtoon 웹툰 Guide')).toBe('webtoon-guide');
    });
  });

  describe('listPosts', () => {
    it('should list all posts without filters', async () => {
      const mockBuilder = createMockQueryBuilder({ data: [mockPost], error: null, count: 1 });
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      const result = await listPosts();

      expect(supabase.from).toHaveBeenCalledWith('content_posts');
      expect(mockBuilder.select).toHaveBeenCalledWith('*', { count: 'exact' });
      expect(result.posts).toEqual([mockPost]);
      expect(result.count).toBe(1);
    });

    it('should apply category filter', async () => {
      const mockBuilder = createMockQueryBuilder({ data: [mockPost], error: null, count: 1 });
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      await listPosts({ category: 'learning' });

      expect(mockBuilder.eq).toHaveBeenCalledWith('category', 'learning');
    });

    it('should apply status filter', async () => {
      const mockBuilder = createMockQueryBuilder({ data: [mockPost], error: null, count: 1 });
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      await listPosts({ status: 'published' });

      expect(mockBuilder.eq).toHaveBeenCalledWith('status', 'published');
      expect(mockBuilder.order).toHaveBeenCalledWith('published_at', { ascending: false });
    });

    it('should apply search filter', async () => {
      const mockBuilder = createMockQueryBuilder({ data: [], error: null, count: 0 });
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      await listPosts({ search: 'webtoon' });

      expect(mockBuilder.or).toHaveBeenCalled();
    });

    it('should apply tags filter', async () => {
      const mockBuilder = createMockQueryBuilder({ data: [mockPost], error: null, count: 1 });
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      await listPosts({ tags: ['webtoon', 'tips'] });

      expect(mockBuilder.contains).toHaveBeenCalledWith('tags', ['webtoon', 'tips']);
    });

    it('should apply pagination', async () => {
      const mockBuilder = createMockQueryBuilder({ data: [mockPost], error: null, count: 50 });
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      await listPosts({ limit: 10, offset: 20 });

      expect(mockBuilder.limit).toHaveBeenCalledWith(10);
      expect(mockBuilder.range).toHaveBeenCalledWith(20, 29);
    });

    it('should throw error on database failure', async () => {
      const mockBuilder = createMockQueryBuilder({ data: null, error: { message: 'Query failed' } });
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      await expect(listPosts()).rejects.toEqual({ message: 'Query failed' });
    });
  });

  describe('getPost', () => {
    it('should get post by ID', async () => {
      const mockBuilder = createMockQueryBuilder({ data: mockPost, error: null });
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      const result = await getPost('post-1');

      expect(supabase.from).toHaveBeenCalledWith('content_posts');
      expect(mockBuilder.eq).toHaveBeenCalledWith('id', 'post-1');
      expect(result).toEqual(mockPost);
    });

    it('should throw error on database failure', async () => {
      const mockBuilder = createMockQueryBuilder({ data: null, error: { message: 'Post not found' } });
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      await expect(getPost('nonexistent')).rejects.toEqual({ message: 'Post not found' });
    });
  });

  describe('getPostBySlug', () => {
    it('should get published post by slug', async () => {
      const mockBuilder = createMockQueryBuilder({ data: mockPost, error: null });
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      const result = await getPostBySlug('test-article');

      expect(supabase.from).toHaveBeenCalledWith('content_posts');
      expect(mockBuilder.eq).toHaveBeenCalledWith('slug', 'test-article');
      expect(mockBuilder.eq).toHaveBeenCalledWith('status', 'published');
      expect(result).toEqual(mockPost);
    });

    it('should return null for not found (PGRST116)', async () => {
      const mockBuilder = createMockQueryBuilder({ data: null, error: { code: 'PGRST116', message: 'Row not found' } });
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      const result = await getPostBySlug('nonexistent');

      expect(result).toBeNull();
    });

    it('should throw error on other database failures', async () => {
      const mockBuilder = createMockQueryBuilder({ data: null, error: { code: '42P01', message: 'Table not found' } });
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      await expect(getPostBySlug('test')).rejects.toEqual({ code: '42P01', message: 'Table not found' });
    });
  });

  describe('createPost', () => {
    it('should create a new post', async () => {
      const mockBuilder = createMockQueryBuilder({ data: mockPost, error: null });
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      const newPost = {
        title: 'Test Article',
        content: '<p>Content</p>',
        category: 'learning',
        status: 'draft',
      };

      const result = await createPost(newPost);

      expect(supabase.from).toHaveBeenCalledWith('content_posts');
      expect(mockBuilder.insert).toHaveBeenCalled();
      expect(result).toEqual(mockPost);
    });

    it('should auto-generate slug from title', async () => {
      const mockBuilder = createMockQueryBuilder({ data: mockPost, error: null });
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      const newPost = {
        title: 'My New Article',
        content: '<p>Content</p>',
      };

      await createPost(newPost);

      expect(mockBuilder.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          slug: 'my-new-article',
        })
      );
    });

    it('should throw error on database failure', async () => {
      const mockBuilder = createMockQueryBuilder({ data: null, error: { message: 'Insert failed' } });
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      await expect(createPost({ title: 'Test' })).rejects.toEqual({ message: 'Insert failed' });
    });
  });

  describe('updatePost', () => {
    it('should update an existing post', async () => {
      const mockBuilder = createMockQueryBuilder({ data: mockPost, error: null });
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      const result = await updatePost('post-1', { title: 'Updated Title' });

      expect(supabase.from).toHaveBeenCalledWith('content_posts');
      expect(mockBuilder.update).toHaveBeenCalled();
      expect(mockBuilder.eq).toHaveBeenCalledWith('id', 'post-1');
      expect(result).toEqual(mockPost);
    });

    it('should regenerate slug when title changes', async () => {
      const mockBuilder = createMockQueryBuilder({ data: mockPost, error: null });
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      await updatePost('post-1', { title: 'New Title Here' });

      expect(mockBuilder.update).toHaveBeenCalledWith(
        expect.objectContaining({
          slug: 'new-title-here',
        })
      );
    });

    it('should set published_at when publishing', async () => {
      const mockBuilder = createMockQueryBuilder({ data: mockPost, error: null });
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      await updatePost('post-1', { status: 'published' });

      expect(mockBuilder.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'published',
          published_at: expect.any(String),
        })
      );
    });

    it('should throw error on database failure', async () => {
      const mockBuilder = createMockQueryBuilder({ data: null, error: { message: 'Update failed' } });
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      await expect(updatePost('post-1', { title: 'Test' })).rejects.toEqual({ message: 'Update failed' });
    });
  });

  describe('deletePost', () => {
    it('should delete a post', async () => {
      const mockBuilder = createMockQueryBuilder({ data: null, error: null });
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      await deletePost('post-1');

      expect(supabase.from).toHaveBeenCalledWith('content_posts');
      expect(mockBuilder.delete).toHaveBeenCalled();
      expect(mockBuilder.eq).toHaveBeenCalledWith('id', 'post-1');
    });

    it('should throw error on database failure', async () => {
      const mockBuilder = createMockQueryBuilder({ data: null, error: { message: 'Delete failed' } });
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      await expect(deletePost('post-1')).rejects.toEqual({ message: 'Delete failed' });
    });
  });

  describe('uploadImage', () => {
    it('should upload an image successfully', async () => {
      const mockStorageBuilder = createMockStorageBuilder({
        data: { path: 'test/image.jpg' },
        error: null,
      });
      vi.mocked(supabase.storage.from).mockReturnValue(mockStorageBuilder as any);

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const result = await uploadImage(file);

      expect(supabase.storage.from).toHaveBeenCalledWith('content-posts-images');
      expect(mockStorageBuilder.upload).toHaveBeenCalled();
      expect(result).toBe('https://example.com/image.jpg');
    });

    it('should include postId in path when provided', async () => {
      const mockStorageBuilder = createMockStorageBuilder({
        data: { path: 'post-1/image.jpg' },
        error: null,
      });
      vi.mocked(supabase.storage.from).mockReturnValue(mockStorageBuilder as any);

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      await uploadImage(file, 'post-1');

      expect(mockStorageBuilder.upload).toHaveBeenCalledWith(
        expect.stringContaining('post-1/'),
        file,
        expect.any(Object)
      );
    });

    it('should reject files over 10 MB', async () => {
      const largeFile = new File([new ArrayBuffer(11 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });

      await expect(uploadImage(largeFile)).rejects.toThrow('File size exceeds 10 MB limit');
    });

    it('should reject non-image file types', async () => {
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });

      await expect(uploadImage(file)).rejects.toThrow('Invalid file type');
    });

    it('should reject invalid file extensions', async () => {
      const file = new File(['test'], 'test.exe', { type: 'image/jpeg' });

      await expect(uploadImage(file)).rejects.toThrow('Invalid file extension');
    });

    it('should throw error on upload failure', async () => {
      const mockStorageBuilder = createMockStorageBuilder({
        data: null,
        error: { message: 'Upload failed' },
      });
      vi.mocked(supabase.storage.from).mockReturnValue(mockStorageBuilder as any);

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

      await expect(uploadImage(file)).rejects.toThrow('Upload failed');
    });
  });

  describe('deleteImage', () => {
    it('should delete an image', async () => {
      const mockStorageBuilder = createMockStorageBuilder({ data: null, error: null });
      vi.mocked(supabase.storage.from).mockReturnValue(mockStorageBuilder as any);

      await deleteImage('test/image.jpg');

      expect(supabase.storage.from).toHaveBeenCalledWith('content-posts-images');
      expect(mockStorageBuilder.remove).toHaveBeenCalledWith(['test/image.jpg']);
    });

    it('should extract path from full URL', async () => {
      const mockStorageBuilder = createMockStorageBuilder({ data: null, error: null });
      vi.mocked(supabase.storage.from).mockReturnValue(mockStorageBuilder as any);

      await deleteImage('https://example.com/storage/v1/object/public/content-posts-images/test/image.jpg');

      expect(mockStorageBuilder.remove).toHaveBeenCalledWith(['test/image.jpg']);
    });

    it('should throw error on delete failure', async () => {
      const mockStorageBuilder = createMockStorageBuilder({
        data: null,
        error: { message: 'Delete failed' },
      });
      vi.mocked(supabase.storage.from).mockReturnValue(mockStorageBuilder as any);

      await expect(deleteImage('test/image.jpg')).rejects.toEqual({ message: 'Delete failed' });
    });
  });

  describe('isSlugUnique', () => {
    it('should return true when slug is unique', async () => {
      const mockBuilder = createMockQueryBuilder({ data: [], error: null });
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      const result = await isSlugUnique('unique-slug');

      expect(supabase.from).toHaveBeenCalledWith('content_posts');
      expect(mockBuilder.eq).toHaveBeenCalledWith('slug', 'unique-slug');
      expect(result).toBe(true);
    });

    it('should return false when slug exists', async () => {
      const mockBuilder = createMockQueryBuilder({ data: [{ id: 'post-1' }], error: null });
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      const result = await isSlugUnique('existing-slug');

      expect(result).toBe(false);
    });

    it('should exclude specific ID when checking', async () => {
      const mockBuilder = createMockQueryBuilder({ data: [], error: null });
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      await isSlugUnique('test-slug', 'exclude-id');

      expect(mockBuilder.neq).toHaveBeenCalledWith('id', 'exclude-id');
    });

    it('should throw error on database failure', async () => {
      const mockBuilder = createMockQueryBuilder({ data: null, error: { message: 'Query failed' } });
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      await expect(isSlugUnique('test')).rejects.toEqual({ message: 'Query failed' });
    });
  });
});
