import { z } from 'zod'

/**
 * Zod validation schema for the 5-step title survey
 * Matches database schema and UI requirements
 */

// Platform data schema
export const platformSchema = z.object({
  id: z.string(),
  platform_name: z.string().min(1, 'Platform name is required'),
  platform_url: z.string().url('Invalid URL').min(1, 'Platform URL is required'),
  views: z.number().optional(),
  subscribers: z.number().optional(),
  other_metrics: z.record(z.any()).optional(),
})

// Character details schema
export const characterSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Character name is required'),
  age: z.string().optional(),
  gender: z.string().optional(),
  sexuality: z.string().optional(),
  ethnicity: z.string().optional(),
  background: z.string().optional(),
  traits: z.string().optional(),
  arc: z.string().optional(),
})

// Uploaded file schema
export const uploadedFileSchema = z.object({
  id: z.string(),
  file: z.any().optional(),
  file_name: z.string(),
  file_size: z.number(),
  file_url: z.string().optional(),
  document_type: z.string(),
  shareable_with_nda: z.boolean(),
  uploading: z.boolean().optional(),
  error: z.string().optional(),
})

// External link schema
export const externalLinkSchema = z.object({
  id: z.string(),
  url: z.string().url('Invalid URL'),
  type: z.enum(['interview', 'review', 'wiki', 'press_release', 'other']),
  description: z.string().optional(),
  shareable_with_nda: z.boolean(),
})

// Creator achievements schema
export const creatorAchievementsSchema = z.object({
  total_titles: z.number().optional(),
  total_views: z.string().optional(),
  notable_works: z.array(z.string()).optional(),
  awards_received: z.array(z.string()).optional(),
  industry_recognition: z.string().optional(),
})

// Main survey form schema
export const surveyFormSchema = z.object({
  // Step 1: Basic Info - Required fields (from AddTitle merge)
  title_name_en: z.string().min(1, 'English title is required'),
  title_name_kr: z.string().min(1, 'Korean title is required'),
  title_url: z.string().url('Invalid URL').min(1, 'Title URL is required'),
  title_image: z.string().url('Invalid URL').min(1, 'Cover image URL is required'),
  story_author: z.string().min(1, 'Story author is required'),
  genre: z.array(z.string()).min(1, 'At least one genre is required'),
  content_format: z.string().optional(),
  keywords: z.string().optional(),
  tone: z.string().optional(),

  // Step 1: Credits (additional authors)
  art_author: z.string().optional(),
  author: z.string().optional(),
  writer: z.string().optional(),
  illustrator: z.string().optional(),

  // Step 1: English title classification
  is_official_english_title: z.boolean().default(false),
  english_title_type: z.enum(['official', 'translation']).optional(),
  script_title_kr: z.string().optional(),
  script_title_en: z.string().optional(),
  art_title_kr: z.string().optional(),
  art_title_en: z.string().optional(),
  underlying_novel_kr: z.string().optional(),
  underlying_novel_en: z.string().optional(),

  // Step 1: Rights holder
  rights_holder_name: z.string().optional(),
  rights_holder_company: z.string().optional(),

  // Step 1: Rights & business
  rights: z.string().optional(), // @deprecated - Use rights_available instead
  rights_available: z.array(z.string()).optional(), // Multi-select rights: film_tv, animation, publication, merchandising, game, other
  perfect_for: z.string().optional(),
  audience: z.string().optional(),

  // Step 1: Platforms
  platforms: z.array(platformSchema).default([]),

  // Step 2: Content details (from AddTitle merge)
  synopsis: z.string().optional(),
  description: z.string().optional(),
  tagline: z.string().optional(),
  note: z.string().optional(),
  chapters: z.number().optional(),

  // Step 2: Story Details
  inspiration: z.string().optional(),
  comparables: z.array(z.string()).default([]),
  important_issues: z.string().optional(),
  setting_description: z
    .string()
    .min(10, 'Setting description must be at least 10 characters')
    .optional()
    .or(z.literal('')),
  world_lore: z.string().optional(),
  supernatural_concepts: z.string().optional(),
  character_details: z
    .array(characterSchema)
    .min(1, 'At least one character is required')
    .optional()
    .or(z.array(characterSchema).length(0)),

  // Step 3: Narrative
  story_structure: z
    .string()
    .min(100, 'Story structure must be at least 100 characters')
    .optional()
    .or(z.literal('')),
  planned_ending: z.string().optional(),
  narrative_arc: z.string().optional(),
  completed: z.boolean().default(false), // Used for conditional validation

  // Step 4: Materials
  uploaded_files: z.array(uploadedFileSchema).default([]),
  external_links: z.array(externalLinkSchema).default([]),

  // Step 5: Profile
  awards: z.array(z.string()).default([]),
  sales_records: z.string().optional(),
  merchandise_deals: z.string().optional(),
  print_editions: z.boolean().default(false),
  print_edition_details: z.string().optional(),
  media_coverage: z.string().optional(),
  celebrity_endorsements: z.string().optional(),
  creator_achievements: creatorAchievementsSchema.optional(),
})

// Conditional validation for step 1
export const validateStep1 = (data: any) => {
  const errors: Record<string, string> = {}

  // Required fields validation
  if (!data.title_name_en || data.title_name_en.trim() === '') {
    errors.title_name_en = 'English title is required'
  }

  if (!data.title_name_kr || data.title_name_kr.trim() === '') {
    errors.title_name_kr = 'Korean title is required'
  }

  if (!data.title_url || data.title_url.trim() === '') {
    errors.title_url = 'Title URL is required'
  }

  if (!data.title_image || data.title_image.trim() === '') {
    errors.title_image = 'Cover image URL is required'
  }

  if (!data.story_author || data.story_author.trim() === '') {
    errors.story_author = 'Story author is required'
  }

  if (!data.genre || data.genre.length === 0) {
    errors.genre = 'At least one genre is required'
  }

  return errors
}

// Conditional validation for step 2
export const validateStep2 = (data: any) => {
  const errors: Record<string, string> = {}

  // Setting description required
  if (!data.setting_description || data.setting_description.length < 10) {
    errors.setting_description = 'Setting description is required (minimum 10 characters)'
  }

  // At least one character required
  if (!data.character_details || data.character_details.length === 0) {
    errors.character_details = 'At least one character is required'
  } else {
    // Check that characters have names
    const invalidCharacters = data.character_details.filter(
      (char: any) => !char.name || char.name.trim() === ''
    )
    if (invalidCharacters.length > 0) {
      errors.character_details = 'All characters must have a name'
    }
  }

  return errors
}

// Conditional validation for step 3
export const validateStep3 = (data: any) => {
  const errors: Record<string, string> = {}

  // Story structure is always required
  if (!data.story_structure || data.story_structure.length < 100) {
    errors.story_structure = 'Story structure is required (minimum 100 characters)'
  }

  // Planned ending required if not completed
  if (!data.completed && (!data.planned_ending || data.planned_ending.length < 50)) {
    errors.planned_ending = 'Planned ending is required for ongoing titles (minimum 50 characters)'
  }

  return errors
}

// Type inference
export type SurveyFormData = z.infer<typeof surveyFormSchema>
export type PlatformData = z.infer<typeof platformSchema>
export type CharacterDetail = z.infer<typeof characterSchema>
export type UploadedFile = z.infer<typeof uploadedFileSchema>
export type ExternalLink = z.infer<typeof externalLinkSchema>
export type CreatorAchievements = z.infer<typeof creatorAchievementsSchema>
