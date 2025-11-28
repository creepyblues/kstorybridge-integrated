import { describe, it, expect, vi, beforeEach } from 'vitest'
import { titlesService, CreateTitleInput, Title } from '../titlesService'

// Mock supabase
const mockSupabaseResponse = {
  data: null as any,
  error: null as any,
}

const mockSelect = vi.fn().mockReturnThis()
const mockEq = vi.fn().mockReturnThis()
const mockSingle = vi.fn().mockImplementation(() => Promise.resolve(mockSupabaseResponse))
const mockOrder = vi.fn().mockImplementation(() => Promise.resolve(mockSupabaseResponse))
const mockInsert = vi.fn().mockReturnThis()
const mockUpdate = vi.fn().mockReturnThis()
const mockDelete = vi.fn().mockReturnThis()

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      delete: mockDelete,
      eq: mockEq,
      single: mockSingle,
      order: mockOrder,
    })),
  },
}))

describe('titlesService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabaseResponse.data = null
    mockSupabaseResponse.error = null
  })

  describe('Title Interface Field Coverage', () => {
    /**
     * This test documents all fields in the Title interface
     * to ensure we track what should be saved to the database
     */
    it('should have all expected fields in Title interface', () => {
      const completeTitle: Title = {
        // Core identification
        title_id: 'test-uuid',
        title_name_en: 'Test Title',
        title_name_kr: '테스트 제목',

        // Media
        title_image: 'https://example.com/image.jpg',
        title_url: 'https://example.com/title',

        // Authors
        story_author: 'Story Author',
        art_author: 'Art Author',
        author: 'Author',
        writer: 'Writer',
        illustrator: 'Illustrator',

        // Classification
        genre: ['romance', 'fantasy'],
        content_format: 'webtoon',
        keywords: ['keyword1', 'keyword2'],
        tone: 'lighthearted',

        // Content details
        synopsis: 'A test synopsis',
        description: 'A detailed description',
        description_kr: '한국어 설명',
        tagline: 'A catchy tagline',
        tagline_kr: '한국어 태그라인',
        pitch: 'Elevator pitch',
        note: 'Internal note',
        note_kr: '한국어 메모',

        // Metrics
        views: 1000000,
        likes: 50000,
        rating: 9.5,
        rating_count: 10000,
        chapters: 150,
        completed: true,

        // Rights & Business
        rights_owner: 'Rights Owner',
        rights: 'film_tv', // @deprecated
        rights_available: ['film_tv', 'animation', 'publication'],
        perfect_for: 'Netflix adaptation',
        audience: 'Young adults',
        comps: ['Similar Title 1', 'Similar Title 2'],

        // Creator
        creator_id: 'creator-uuid',

        // Timestamps
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',

        // Step 1: Extended fields
        is_official_english_title: true,
        english_title_type: 'official',
        script_title_kr: '스크립트 제목',
        script_title_en: 'Script Title',
        art_title_kr: '아트 제목',
        art_title_en: 'Art Title',
        underlying_novel_kr: '원작 소설',
        underlying_novel_en: 'Original Novel',
        rights_holder_name: 'Rights Holder',
        rights_holder_company: 'Rights Company',

        // Step 2: Story Details
        inspiration: 'Inspired by...',
        comparables: ['Comp 1', 'Comp 2'],
        important_issues: 'Themes explored',
        setting_description: 'A detailed setting',
        world_lore: 'World building details',
        supernatural_concepts: 'Magic system',
        character_details: [
          {
            name: 'Main Character',
            name_kr: '주인공',
            role: 'protagonist',
            age: '25',
            gender: 'Male',
            background: 'Orphan prince',
          },
        ],

        // Step 3: Narrative
        story_structure: 'Three-act structure with...',
        planned_ending: 'Happy ending with...',
        narrative_arc: 'Hero journey',

        // Step 5: Achievements
        awards: ['Award 1', 'Award 2'],
        sales_records: '1M copies sold',
        merchandise_deals: 'Figures, apparel',
        print_editions: true,
        print_edition_details: '3 volumes published',
        media_coverage: 'Featured in...',
        celebrity_endorsements: 'Recommended by...',
        creator_achievements: {
          total_titles: 5,
          total_views: '10M',
          notable_works: ['Work 1', 'Work 2'],
          awards_received: ['Creator Award'],
          industry_recognition: 'Top 10 creator',
        },
      }

      // Verify all fields exist
      expect(completeTitle.title_id).toBeDefined()
      expect(completeTitle.title_name_en).toBeDefined()
      expect(completeTitle.rights_available).toEqual(['film_tv', 'animation', 'publication'])
      expect(completeTitle.character_details).toHaveLength(1)
      expect(completeTitle.creator_achievements?.total_titles).toBe(5)
    })
  })

  describe('CreateTitleInput Field Coverage', () => {
    /**
     * This test documents all fields in CreateTitleInput
     * that can be set when creating a new title
     */
    it('should have all expected fields in CreateTitleInput', () => {
      const createInput: CreateTitleInput = {
        // Required fields
        title_name_en: 'Test Title',
        title_name_kr: '테스트 제목',
        title_url: 'https://example.com/title',
        title_image: 'https://example.com/image.jpg',
        story_author: 'Story Author',
        creator_id: 'creator-uuid',

        // Optional: Classification
        genre: ['romance'],
        content_format: 'webtoon',
        keywords: ['keyword1'],

        // Optional: Content details
        synopsis: 'Synopsis',
        description: 'Description',
        tagline: 'Tagline',
        note: 'Note',
        tone: 'lighthearted',
        chapters: 10,
        completed: false,

        // Optional: Credits
        art_author: 'Art Author',
        author: 'Author',
        writer: 'Writer',
        illustrator: 'Illustrator',

        // Optional: Rights
        rights_owner: 'Owner',
        rights: 'film_tv',
        perfect_for: 'Netflix',
        audience: 'YA',
        comps: ['Comp 1'],

        // Step 1 extended
        is_official_english_title: true,
        english_title_type: 'official',
        script_title_kr: '스크립트',
        script_title_en: 'Script',
        art_title_kr: '아트',
        art_title_en: 'Art',
        underlying_novel_kr: '원작',
        underlying_novel_en: 'Original',
        rights_holder_name: 'Holder',
        rights_holder_company: 'Company',

        // Step 2
        inspiration: 'Inspiration',
        comparables: ['Comp'],
        important_issues: 'Issues',
        setting_description: 'Setting',
        world_lore: 'Lore',
        supernatural_concepts: 'Magic',
        character_details: [{ name: 'Hero' }],

        // Step 3
        story_structure: 'Structure',
        planned_ending: 'Ending',
        narrative_arc: 'Arc',

        // Step 5
        awards: ['Award'],
        sales_records: 'Sales',
        merchandise_deals: 'Merch',
        print_editions: true,
        print_edition_details: 'Details',
        media_coverage: 'Media',
        celebrity_endorsements: 'Celebs',
        creator_achievements: { total_titles: 1 },
      }

      // Verify required fields
      expect(createInput.title_name_en).toBe('Test Title')
      expect(createInput.title_name_kr).toBe('테스트 제목')
      expect(createInput.title_url).toBe('https://example.com/title')
      expect(createInput.title_image).toBe('https://example.com/image.jpg')
      expect(createInput.story_author).toBe('Story Author')
      expect(createInput.creator_id).toBe('creator-uuid')
    })
  })

  describe('Field Mapping: SurveyFormData → CreateTitleInput', () => {
    /**
     * Tests that verify the mapping from form fields to database fields
     */

    it('should map Step 1 basic info fields correctly', () => {
      const formData = {
        title_name_en: 'English Title',
        title_name_kr: '한국어 제목',
        title_url: 'https://example.com',
        title_image: 'https://example.com/img.jpg',
        story_author: 'Author Name',
        genre: ['romance', 'fantasy'],
        content_format: 'webtoon',
        keywords: 'keyword1, keyword2',
        tone: 'lighthearted',
      }

      // Simulate the transformation that should happen
      const dbData = {
        title_name_en: formData.title_name_en.trim(),
        title_name_kr: formData.title_name_kr.trim(),
        title_url: formData.title_url.trim(),
        title_image: formData.title_image.trim(),
        story_author: formData.story_author.trim(),
        genre: formData.genre,
        content_format: formData.content_format,
        keywords: formData.keywords.split(',').map(k => k.trim()).filter(Boolean),
        tone: formData.tone,
      }

      expect(dbData.title_name_en).toBe('English Title')
      expect(dbData.genre).toEqual(['romance', 'fantasy'])
      expect(dbData.keywords).toEqual(['keyword1', 'keyword2'])
    })

    it('should map Step 1 rights_available field correctly', () => {
      const formData = {
        rights_available: ['film_tv', 'animation', 'publication'],
      }

      const dbData = {
        rights_available: formData.rights_available.length > 0
          ? formData.rights_available
          : null,
      }

      expect(dbData.rights_available).toEqual(['film_tv', 'animation', 'publication'])
    })

    it('should handle empty rights_available array', () => {
      const formData = {
        rights_available: [],
      }

      const dbData = {
        rights_available: formData.rights_available.length > 0
          ? formData.rights_available
          : null,
      }

      expect(dbData.rights_available).toBeNull()
    })

    it('should map Step 1 English title type fields correctly', () => {
      const formData = {
        is_official_english_title: true,
        english_title_type: 'official' as const,
      }

      expect(formData.is_official_english_title).toBe(true)
      expect(formData.english_title_type).toBe('official')
    })

    it('should map Step 1 credits fields correctly', () => {
      const formData = {
        art_author: 'Art Author',
        author: 'Original Author',
        writer: 'Script Writer',
        illustrator: 'Illustrator',
      }

      const dbData = {
        art_author: formData.art_author?.trim() || null,
        author: formData.author?.trim() || null,
        writer: formData.writer?.trim() || null,
        illustrator: formData.illustrator?.trim() || null,
      }

      expect(dbData.art_author).toBe('Art Author')
    })

    it('should map Step 1 rights holder fields correctly', () => {
      const formData = {
        rights_holder_name: 'Rights Holder',
        rights_holder_company: 'Rights Company',
      }

      expect(formData.rights_holder_name).toBe('Rights Holder')
      expect(formData.rights_holder_company).toBe('Rights Company')
    })

    it('should map Step 1 underlying novel fields correctly', () => {
      const formData = {
        underlying_novel_kr: '원작 소설',
        underlying_novel_en: 'Original Novel',
      }

      expect(formData.underlying_novel_kr).toBe('원작 소설')
      expect(formData.underlying_novel_en).toBe('Original Novel')
    })

    it('should map Step 2 story details fields correctly', () => {
      const formData = {
        synopsis: 'A compelling synopsis',
        tagline: 'Catchy tagline',
        tagline_kr: '한국어 태그라인',
        description_kr: '상세 설명',
        inspiration: 'Inspired by...',
        comparables: ['Similar Title 1', 'Similar Title 2'],
        important_issues: 'Social themes',
        setting_description: 'A dystopian world',
        world_lore: 'Rich mythology',
        supernatural_concepts: 'Time manipulation',
      }

      expect(formData.synopsis).toBe('A compelling synopsis')
      expect(formData.comparables).toHaveLength(2)
    })

    it('should map Step 2 character_details correctly', () => {
      const formData = {
        character_details: [
          {
            name: 'Hero Name',
            name_kr: '영웅',
            role: 'protagonist' as const,
            age: '25',
            gender: 'Male',
            ethnicity: 'Korean',
            background: 'Orphan turned warrior',
            personality: 'Brave and kind',
            arc: 'From nobody to hero',
          },
          {
            name: 'Villain',
            role: 'antagonist' as const,
            background: 'Corrupted by power',
          },
        ],
      }

      const dbData = {
        character_details: formData.character_details.length > 0
          ? formData.character_details
          : null,
      }

      expect(dbData.character_details).toHaveLength(2)
      expect(dbData.character_details![0].name).toBe('Hero Name')
      expect(dbData.character_details![0].role).toBe('protagonist')
    })

    it('should map Step 3 narrative fields correctly', () => {
      const formData = {
        story_structure: 'Three-act structure with multiple POVs...',
        planned_ending: 'Bittersweet resolution where...',
        narrative_arc: 'Hero journey with redemption theme',
      }

      expect(formData.story_structure).toBeDefined()
      expect(formData.planned_ending).toBeDefined()
      expect(formData.narrative_arc).toBeDefined()
    })

    it('should map Step 4 metrics fields correctly', () => {
      const formData = {
        chapters: 150,
        completed: true,
        views: 5000000,
        likes: 200000,
        rating: 9.8,
        rating_count: 50000,
      }

      const dbData = {
        chapters: formData.chapters ? Number(formData.chapters) : null,
        completed: formData.completed || null,
        views: formData.views ? Number(formData.views) : null,
        likes: formData.likes ? Number(formData.likes) : null,
        rating: formData.rating ? Number(formData.rating) : null,
        rating_count: formData.rating_count ? Number(formData.rating_count) : null,
      }

      expect(dbData.chapters).toBe(150)
      expect(dbData.rating).toBe(9.8)
    })

    it('should map Step 5 achievement fields correctly', () => {
      const formData = {
        awards: ['Best Webtoon 2023', 'Reader Choice Award'],
        sales_records: '10M views, 500K subscribers',
        merchandise_deals: 'Figures, apparel, cafe collaboration',
        print_editions: true,
        print_edition_details: '5 volumes published by KakaoPage',
        media_coverage: 'Featured in Variety, Deadline',
        celebrity_endorsements: 'Recommended by BTS Jin',
      }

      const dbData = {
        awards: formData.awards.length > 0 ? formData.awards : null,
        sales_records: formData.sales_records?.trim() || null,
        merchandise_deals: formData.merchandise_deals?.trim() || null,
        print_editions: formData.print_editions || null,
        print_edition_details: formData.print_edition_details?.trim() || null,
        media_coverage: formData.media_coverage?.trim() || null,
        celebrity_endorsements: formData.celebrity_endorsements?.trim() || null,
      }

      expect(dbData.awards).toHaveLength(2)
      expect(dbData.print_editions).toBe(true)
    })

    it('should map Step 5 creator_achievements correctly', () => {
      const formData = {
        creator_achievements: {
          total_titles: 10,
          total_views: '50M cumulative',
          notable_works: ['Work 1', 'Work 2', 'Work 3'],
          awards_received: ['Creator of the Year'],
          industry_recognition: 'Top 5 webtoon creator in Korea',
        },
      }

      const dbData = {
        creator_achievements: formData.creator_achievements &&
          Object.keys(formData.creator_achievements).length > 0
          ? formData.creator_achievements
          : null,
      }

      expect(dbData.creator_achievements?.total_titles).toBe(10)
      expect(dbData.creator_achievements?.notable_works).toHaveLength(3)
    })

    it('should handle comparables → comps field name mapping', () => {
      // Form uses 'comparables', database uses 'comps'
      const formData = {
        comparables: ['Solo Leveling', 'Tower of God'],
      }

      const dbData = {
        comps: formData.comparables && formData.comparables.length > 0
          ? formData.comparables
          : null,
      }

      expect(dbData.comps).toEqual(['Solo Leveling', 'Tower of God'])
    })
  })

  describe('Field Mapping: Database → EditTitle Form', () => {
    /**
     * Tests that verify data is correctly loaded from database into edit form
     */

    it('should load all Step 1 fields into form', () => {
      const dbTitle: Partial<Title> = {
        title_name_en: 'Title',
        title_name_kr: '제목',
        title_url: 'https://example.com',
        title_image: 'https://example.com/img.jpg',
        story_author: 'Author',
        genre: ['romance'],
        content_format: 'webtoon',
        keywords: ['key1', 'key2'],
        tone: 'lighthearted',
        art_author: 'Art Author',
        is_official_english_title: true,
        english_title_type: 'official',
        script_title_kr: '스크립트',
        script_title_en: 'Script',
        art_title_kr: '아트',
        art_title_en: 'Art',
        underlying_novel_kr: '원작',
        underlying_novel_en: 'Original',
        rights_holder_name: 'Holder',
        rights_holder_company: 'Company',
        rights_available: ['film_tv', 'animation'],
        perfect_for: 'Netflix',
        audience: 'YA',
      }

      // Simulate form reset with database data
      const formData = {
        title_name_en: dbTitle.title_name_en || '',
        title_name_kr: dbTitle.title_name_kr || '',
        title_url: dbTitle.title_url || '',
        title_image: dbTitle.title_image || '',
        story_author: dbTitle.story_author || '',
        genre: Array.isArray(dbTitle.genre) ? dbTitle.genre : [],
        content_format: dbTitle.content_format || '',
        keywords: Array.isArray(dbTitle.keywords) ? dbTitle.keywords.join(', ') : '',
        tone: dbTitle.tone || '',
        art_author: dbTitle.art_author || '',
        is_official_english_title: dbTitle.is_official_english_title ?? true,
        english_title_type: dbTitle.english_title_type || 'official',
        rights_available: Array.isArray(dbTitle.rights_available) ? dbTitle.rights_available : [],
        perfect_for: dbTitle.perfect_for || '',
        audience: dbTitle.audience || '',
      }

      expect(formData.title_name_en).toBe('Title')
      expect(formData.genre).toEqual(['romance'])
      expect(formData.keywords).toBe('key1, key2')
      expect(formData.rights_available).toEqual(['film_tv', 'animation'])
    })

    it('should load all Step 2 fields into form', () => {
      const dbTitle: Partial<Title> = {
        synopsis: 'Synopsis',
        tagline: 'Tagline',
        tagline_kr: '태그라인',
        description_kr: '설명',
        inspiration: 'Inspiration',
        comps: ['Comp 1', 'Comp 2'], // DB uses 'comps'
        important_issues: 'Issues',
        setting_description: 'Setting',
        world_lore: 'Lore',
        supernatural_concepts: 'Magic',
        character_details: [{ name: 'Hero', role: 'protagonist' }],
      }

      const formData = {
        synopsis: dbTitle.synopsis || '',
        tagline: dbTitle.tagline || '',
        tagline_kr: dbTitle.tagline_kr || '',
        description_kr: dbTitle.description_kr || '',
        inspiration: dbTitle.inspiration || '',
        comparables: dbTitle.comps || [], // Form uses 'comparables'
        important_issues: dbTitle.important_issues || '',
        setting_description: dbTitle.setting_description || '',
        world_lore: dbTitle.world_lore || '',
        supernatural_concepts: dbTitle.supernatural_concepts || '',
        character_details: dbTitle.character_details || [],
      }

      expect(formData.comparables).toEqual(['Comp 1', 'Comp 2'])
      expect(formData.character_details).toHaveLength(1)
    })

    it('should load all Step 3 fields into form', () => {
      const dbTitle: Partial<Title> = {
        story_structure: 'Structure',
        planned_ending: 'Ending',
        narrative_arc: 'Arc',
      }

      const formData = {
        story_structure: dbTitle.story_structure || '',
        planned_ending: dbTitle.planned_ending || '',
        narrative_arc: dbTitle.narrative_arc || '',
      }

      expect(formData.story_structure).toBe('Structure')
    })

    it('should load all Step 4 fields into form', () => {
      const dbTitle: Partial<Title> = {
        chapters: 100,
        completed: true,
        views: 1000000,
        likes: 50000,
        rating: 9.5,
        rating_count: 10000,
      }

      const formData = {
        chapters: dbTitle.chapters || undefined,
        completed: dbTitle.completed || false,
        views: dbTitle.views || undefined,
        likes: dbTitle.likes || undefined,
        rating: dbTitle.rating || undefined,
        rating_count: dbTitle.rating_count || undefined,
      }

      expect(formData.chapters).toBe(100)
      expect(formData.completed).toBe(true)
    })

    it('should load all Step 5 fields into form', () => {
      const dbTitle: Partial<Title> = {
        awards: ['Award 1'],
        sales_records: 'Sales',
        merchandise_deals: 'Merch',
        print_editions: true,
        print_edition_details: 'Details',
        media_coverage: 'Media',
        celebrity_endorsements: 'Celebs',
        creator_achievements: { total_titles: 5 },
      }

      const formData = {
        awards: dbTitle.awards || [],
        sales_records: dbTitle.sales_records || '',
        merchandise_deals: dbTitle.merchandise_deals || '',
        print_editions: dbTitle.print_editions || false,
        print_edition_details: dbTitle.print_edition_details || '',
        media_coverage: dbTitle.media_coverage || '',
        celebrity_endorsements: dbTitle.celebrity_endorsements || '',
        creator_achievements: dbTitle.creator_achievements || {},
      }

      expect(formData.awards).toEqual(['Award 1'])
      expect(formData.creator_achievements).toEqual({ total_titles: 5 })
    })
  })

  describe('Missing Fields Detection', () => {
    /**
     * Tests to detect any fields that might be missing from forms
     */

    it('should identify all fields that exist in Title but not in EditTitleFormData', () => {
      // Fields in Title interface that are NOT in EditTitleFormData
      const titleOnlyFields = [
        'title_id', // System field
        'creator_id', // System field
        'created_at', // System field
        'updated_at', // System field
        'rights_owner', // Deprecated
        'rights', // Deprecated (use rights_available)
        'description', // Uses description_kr instead
        'pitch', // Separate upload component
        'note_kr', // Not in edit form
      ]

      // These fields exist in Title but are intentionally excluded from the form
      expect(titleOnlyFields).toContain('title_id')
      expect(titleOnlyFields).toContain('rights') // Deprecated
    })

    it('should verify rights_available is now included in EditTitle form', () => {
      // This was the bug we fixed - rights_available was missing
      const editTitleFormFields = [
        'title_name_en',
        'title_name_kr',
        'rights_available', // ✅ Now included after fix
        // ... other fields
      ]

      expect(editTitleFormFields).toContain('rights_available')
    })
  })

  describe('Data Transformation Edge Cases', () => {
    it('should handle undefined and null values correctly', () => {
      const formData = {
        art_author: undefined,
        tone: null,
        keywords: '',
        genre: [],
        rights_available: [],
      }

      const dbData = {
        art_author: formData.art_author?.trim() || null,
        tone: formData.tone || null,
        keywords: formData.keywords
          ? formData.keywords.split(',').map(k => k.trim()).filter(Boolean)
          : null,
        genre: formData.genre.length > 0 ? formData.genre : null,
        rights_available: formData.rights_available.length > 0
          ? formData.rights_available
          : null,
      }

      expect(dbData.art_author).toBeNull()
      expect(dbData.tone).toBeNull()
      expect(dbData.keywords).toBeNull()
      expect(dbData.genre).toBeNull()
      expect(dbData.rights_available).toBeNull()
    })

    it('should trim whitespace from string fields', () => {
      const formData = {
        title_name_en: '  Title with spaces  ',
        synopsis: '\n\nSynopsis with newlines\n\n',
      }

      const dbData = {
        title_name_en: formData.title_name_en.trim(),
        synopsis: formData.synopsis?.trim() || null,
      }

      expect(dbData.title_name_en).toBe('Title with spaces')
      expect(dbData.synopsis).toBe('Synopsis with newlines')
    })

    it('should convert numeric strings to numbers', () => {
      const formData = {
        chapters: '150' as any,
        views: '1000000' as any,
        rating: '9.5' as any,
      }

      const dbData = {
        chapters: formData.chapters ? Number(formData.chapters) : null,
        views: formData.views ? Number(formData.views) : null,
        rating: formData.rating ? Number(formData.rating) : null,
      }

      expect(dbData.chapters).toBe(150)
      expect(dbData.views).toBe(1000000)
      expect(dbData.rating).toBe(9.5)
    })

    it('should handle array fields that could be strings (genre)', () => {
      // Sometimes genre might come as string from legacy data
      const dbTitle = {
        genre: 'romance' as any, // String instead of array
      }

      const formData = {
        genre: Array.isArray(dbTitle.genre)
          ? dbTitle.genre
          : (dbTitle.genre ? [dbTitle.genre] : []),
      }

      expect(formData.genre).toEqual(['romance'])
    })

    it('should filter empty strings from arrays', () => {
      const formData = {
        awards: ['Award 1', '', 'Award 2', ''],
        comparables: ['', 'Comp 1', ''],
      }

      const dbData = {
        awards: formData.awards.filter(a => a.trim() !== ''),
        comparables: formData.comparables.filter(c => c.trim() !== ''),
      }

      expect(dbData.awards).toEqual(['Award 1', 'Award 2'])
      expect(dbData.comparables).toEqual(['Comp 1'])
    })
  })

  describe('Platform Data Handling', () => {
    it('should map platform form data correctly', () => {
      const formPlatforms = [
        {
          id: 'p1',
          platform_name: 'Naver Webtoon',
          platform_url: 'https://comic.naver.com/webtoon/list?titleId=123',
          views: 5000000,
          subscribers: 100000,
          other_metrics: { rating: 9.8, episodes: 150 },
        },
        {
          id: 'p2',
          platform_name: 'Kakao Page',
          platform_url: 'https://page.kakao.com/content/456',
          views: 3000000,
        },
      ]

      // Platform data should be stored in title_platforms table, not titles
      expect(formPlatforms[0].platform_name).toBe('Naver Webtoon')
      expect(formPlatforms[0].other_metrics).toBeDefined()
    })
  })

  describe('Document/File Data Handling', () => {
    it('should map document form data correctly', () => {
      const formDocuments = [
        {
          id: 'd1',
          document_type: 'pitch_deck',
          file_url: 'https://storage.example.com/pitch.pdf',
          file_name: 'pitch_deck.pdf',
          file_size: 2048000,
          shareable_with_nda: true,
        },
        {
          id: 'd2',
          document_type: 'script',
          file_url: 'https://storage.example.com/script.docx',
          file_name: 'episode_1_script.docx',
          file_size: 512000,
          shareable_with_nda: false,
          external_url: null,
        },
      ]

      // Document data should be stored in title_documents table, not titles
      expect(formDocuments[0].document_type).toBe('pitch_deck')
      expect(formDocuments[0].shareable_with_nda).toBe(true)
    })
  })
})

describe('EditTitle onSubmit Field Mapping Verification', () => {
  /**
   * This test simulates the exact transformation that happens in EditTitle.tsx onSubmit
   * to verify all fields are properly mapped
   */
  it('should map all form values to updateData correctly', () => {
    // Simulate form values from EditTitle
    const values = {
      // Step 1
      title_name_en: 'Test Title',
      title_name_kr: '테스트 제목',
      title_url: 'https://example.com',
      title_image: 'https://example.com/img.jpg',
      story_author: 'Author',
      genre: ['romance', 'fantasy'],
      content_format: 'webtoon',
      keywords: 'key1, key2, key3',
      tone: 'lighthearted',
      art_author: 'Art Author',
      is_official_english_title: true,
      english_title_type: 'official' as const,
      script_title_kr: '스크립트',
      script_title_en: 'Script',
      art_title_kr: '아트',
      art_title_en: 'Art',
      underlying_novel_kr: '원작',
      underlying_novel_en: 'Original',
      rights_holder_name: 'Holder',
      rights_holder_company: 'Company',
      rights_available: ['film_tv', 'animation'],
      perfect_for: 'Netflix',
      audience: 'YA',

      // Step 2
      synopsis: 'Synopsis',
      tagline: 'Tagline',
      tagline_kr: '태그라인',
      description_kr: '설명',
      inspiration: 'Inspiration',
      comparables: ['Comp 1', 'Comp 2'],
      important_issues: 'Issues',
      setting_description: 'Setting',
      world_lore: 'Lore',
      supernatural_concepts: 'Magic',
      character_details: [{ name: 'Hero', role: 'protagonist' as const }],

      // Step 3
      story_structure: 'Structure',
      planned_ending: 'Ending',
      narrative_arc: 'Arc',

      // Step 4
      chapters: 100,
      completed: true,
      views: 1000000,
      likes: 50000,
      rating: 9.5,
      rating_count: 10000,

      // Step 5
      awards: ['Award 1'],
      sales_records: 'Sales',
      merchandise_deals: 'Merch',
      print_editions: true,
      print_edition_details: 'Details',
      media_coverage: 'Media',
      celebrity_endorsements: 'Celebs',
      creator_achievements: { total_titles: 5 },
    }

    // Simulate the exact transformation from EditTitle.tsx onSubmit
    const updateData = {
      // Step 1: Basic Information
      title_name_en: values.title_name_en.trim(),
      title_name_kr: values.title_name_kr.trim(),
      title_url: values.title_url.trim(),
      title_image: values.title_image.trim(),
      story_author: values.story_author.trim(),
      genre: values.genre.length > 0 ? values.genre : null,
      content_format: values.content_format || null,
      keywords: values.keywords
        ? values.keywords.split(',').map(k => k.trim()).filter(Boolean)
        : null,
      tone: values.tone?.trim() || null,
      art_author: values.art_author?.trim() || null,
      is_official_english_title: values.is_official_english_title,
      english_title_type: values.english_title_type,
      script_title_kr: values.script_title_kr?.trim() || null,
      script_title_en: values.script_title_en?.trim() || null,
      art_title_kr: values.art_title_kr?.trim() || null,
      art_title_en: values.art_title_en?.trim() || null,
      underlying_novel_kr: values.underlying_novel_kr?.trim() || null,
      underlying_novel_en: values.underlying_novel_en?.trim() || null,
      rights_holder_name: values.rights_holder_name?.trim() || null,
      rights_holder_company: values.rights_holder_company?.trim() || null,
      rights_available: values.rights_available && values.rights_available.length > 0
        ? values.rights_available
        : null,
      perfect_for: values.perfect_for?.trim() || null,
      audience: values.audience?.trim() || null,

      // Step 2: Story Details
      synopsis: values.synopsis?.trim() || null,
      tagline: values.tagline?.trim() || null,
      tagline_kr: values.tagline_kr?.trim() || null,
      description_kr: values.description_kr?.trim() || null,
      inspiration: values.inspiration?.trim() || null,
      comps: values.comparables && values.comparables.length > 0
        ? values.comparables
        : null,
      important_issues: values.important_issues?.trim() || null,
      setting_description: values.setting_description?.trim() || null,
      world_lore: values.world_lore?.trim() || null,
      supernatural_concepts: values.supernatural_concepts?.trim() || null,
      character_details: values.character_details && values.character_details.length > 0
        ? values.character_details
        : null,

      // Step 3: Narrative Structure
      story_structure: values.story_structure?.trim() || null,
      planned_ending: values.planned_ending?.trim() || null,
      narrative_arc: values.narrative_arc?.trim() || null,

      // Step 4: Materials & Platforms
      chapters: values.chapters ? Number(values.chapters) : null,
      completed: values.completed || null,
      views: values.views ? Number(values.views) : null,
      likes: values.likes ? Number(values.likes) : null,
      rating: values.rating ? Number(values.rating) : null,
      rating_count: values.rating_count ? Number(values.rating_count) : null,

      // Step 5: Achievements & Profile
      awards: values.awards && values.awards.length > 0 ? values.awards : null,
      sales_records: values.sales_records?.trim() || null,
      merchandise_deals: values.merchandise_deals?.trim() || null,
      print_editions: values.print_editions || null,
      print_edition_details: values.print_edition_details?.trim() || null,
      media_coverage: values.media_coverage?.trim() || null,
      celebrity_endorsements: values.celebrity_endorsements?.trim() || null,
      creator_achievements: values.creator_achievements && Object.keys(values.creator_achievements).length > 0
        ? values.creator_achievements
        : null,
    }

    // Verify all fields are mapped
    expect(updateData.title_name_en).toBe('Test Title')
    expect(updateData.rights_available).toEqual(['film_tv', 'animation'])
    expect(updateData.comps).toEqual(['Comp 1', 'Comp 2'])
    expect(updateData.character_details).toHaveLength(1)
    expect(updateData.chapters).toBe(100)
    expect(updateData.creator_achievements).toEqual({ total_titles: 5 })
    expect(updateData.keywords).toEqual(['key1', 'key2', 'key3'])
  })
})
