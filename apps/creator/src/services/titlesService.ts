import { supabase } from '@/lib/supabase'

export interface Title {
  title_id: string
  title_name_en: string
  title_name_kr: string
  title_image?: string | null
  title_url?: string | null
  story_author?: string | null
  art_author?: string | null
  genre?: string[] | string | null
  synopsis?: string | null
  synopsis_kr?: string | null
  description?: string | null
  tagline?: string | null
  tagline_kr?: string | null
  pitch?: string | null
  tone?: string | null
  note?: string | null
  note_kr?: string | null
  views?: number | null
  likes?: number | null
  rating?: number | null
  rating_count?: number | null
  chapters?: number | null
  completed?: boolean | null
  rights_owner?: string | null
  rights?: string | null // @deprecated - Use rights_available instead
  rights_available?: string[] | null // Multi-select rights: film_tv, animation, publication, merchandising, game, other
  perfect_for?: string | null
  audience?: string | null
  comps?: string[] | null
  content_format?: string | null
  keywords?: string[] | null
  creator_id?: string | null
  created_at?: string
  updated_at?: string
  // Extended fields
  author?: string | null
  writer?: string | null
  illustrator?: string | null

  // ===== Questionnaire Fields (Phase 1 Migration) =====
  // Step 1: Basic Information
  is_official_english_title?: boolean | null
  english_title_type?: 'official' | 'translation' | null
  script_title_kr?: string | null
  script_title_en?: string | null
  art_title_kr?: string | null
  art_title_en?: string | null
  underlying_novel_kr?: string | null
  underlying_novel_en?: string | null
  rights_holder_name?: string | null
  rights_holder_company?: string | null

  // Step 2: Story Details
  inspiration?: string | null
  comparables?: string[] | null
  important_issues?: string | null
  setting_description?: string | null
  world_lore?: string | null
  supernatural_concepts?: string | null
  character_details?: Array<{
    name: string
    name_kr?: string
    role?: 'protagonist' | 'antagonist' | 'supporting' | 'minor'
    age?: string | number
    gender?: string
    sexuality?: string
    ethnicity?: string
    occupation?: string
    background?: string
    personality?: string
    traits?: string
    arc?: string
    relationships?: string
  }> | null

  // Step 3: Narrative Structure
  story_structure?: string | null
  planned_ending?: string | null
  narrative_arc?: string | null

  // Step 5: Content & Creator Profile
  awards?: string[] | null
  sales_records?: string | null
  merchandise_deals?: string | null
  print_editions?: boolean | null
  print_edition_details?: string | null
  media_coverage?: string | null
  celebrity_endorsements?: string | null
  creator_achievements?: Record<string, any> | null
}

// Quick Add Title input (simplified form)
export interface QuickAddTitleInput {
  title_name_kr: string
  title_url: string
  rights_holder_name: string
  rights_available: string[]
  creator_id: string
  title_name_en?: string
  title_url_en?: string
}

export interface CreateTitleInput {
  // Required fields
  title_name_en: string
  title_name_kr: string
  title_url: string
  title_image: string
  story_author: string
  creator_id: string

  // Content classification
  genre?: string[] | null
  content_format?: string | null
  keywords?: string[] | null

  // Content details
  synopsis?: string | null
  description?: string | null
  tagline?: string | null
  note?: string | null
  tone?: string | null
  chapters?: number | null
  completed?: boolean | null

  // Credits (multiple author types for different formats)
  art_author?: string | null
  author?: string | null
  writer?: string | null
  illustrator?: string | null

  // Rights and business
  rights_owner?: string | null
  rights?: string | null
  perfect_for?: string | null
  audience?: string | null
  comps?: string[] | null

  // ===== Questionnaire Fields (5-Step Survey) =====
  // Step 1: Basic Information
  is_official_english_title?: boolean | null
  english_title_type?: 'official' | 'translation' | null
  script_title_kr?: string | null
  script_title_en?: string | null
  art_title_kr?: string | null
  art_title_en?: string | null
  underlying_novel_kr?: string | null
  underlying_novel_en?: string | null
  rights_holder_name?: string | null
  rights_holder_company?: string | null

  // Step 2: Story Details
  inspiration?: string | null
  comparables?: string[] | null
  important_issues?: string | null
  setting_description?: string | null // REQUIRED in UI
  world_lore?: string | null
  supernatural_concepts?: string | null
  character_details?: Array<{
    name: string
    name_kr?: string
    role?: 'protagonist' | 'antagonist' | 'supporting' | 'minor'
    age?: string | number
    gender?: string
    sexuality?: string
    ethnicity?: string
    occupation?: string
    background?: string
    personality?: string
    traits?: string
    arc?: string
    relationships?: string
  }> | null // REQUIRED in UI

  // Step 3: Narrative Structure
  story_structure?: string | null // REQUIRED in UI
  planned_ending?: string | null // REQUIRED in UI if completed=false
  narrative_arc?: string | null

  // Step 5: Content & Creator Profile
  awards?: string[] | null
  sales_records?: string | null
  merchandise_deals?: string | null
  print_editions?: boolean | null
  print_edition_details?: string | null
  media_coverage?: string | null
  celebrity_endorsements?: string | null
  creator_achievements?: Record<string, any> | null
}

export const titlesService = {
  /**
   * Get all titles
   */
  async getAllTitles(): Promise<Title[]> {
    const { data, error } = await supabase
      .from('titles')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching titles:', error)
      throw error
    }

    return data || []
  },

  /**
   * Get titles by creator
   */
  async getTitlesByCreator(creatorId: string): Promise<Title[]> {
    const { data, error } = await supabase
      .from('titles')
      .select('*')
      .eq('creator_id', creatorId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching creator titles:', error)
      throw error
    }

    return data || []
  },

  /**
   * Get single title by ID with platforms and documents
   */
  async getTitleById(titleId: string): Promise<Title & { platforms?: any[], documents?: any[] } | null> {
    // Fetch title data
    const { data: titleData, error: titleError } = await supabase
      .from('titles')
      .select('*')
      .eq('title_id', titleId)
      .single()

    if (titleError) {
      console.error('Error fetching title:', titleError)
      throw titleError
    }

    if (!titleData) {
      return null
    }

    // Fetch related platforms
    const { data: platforms, error: platformsError } = await supabase
      .from('title_platforms')
      .select('*')
      .eq('title_id', titleId)
      .order('created_at', { ascending: false })

    if (platformsError) {
      console.error('Error fetching platforms:', platformsError)
      // Don't throw, just log and continue
    }

    // Fetch related documents
    const { data: documents, error: documentsError } = await supabase
      .from('title_documents')
      .select('*')
      .eq('title_id', titleId)
      .order('created_at', { ascending: false })

    if (documentsError) {
      console.error('Error fetching documents:', documentsError)
      // Don't throw, just log and continue
    }

    // Return combined data
    return {
      ...titleData,
      platforms: platforms || [],
      documents: documents || [],
    }
  },

  /**
   * Create new title
   */
  async createTitle(input: CreateTitleInput): Promise<Title> {
    const { data, error } = await supabase
      .from('titles')
      .insert([input])
      .select()
      .single()

    if (error) {
      console.error('Error creating title:', error)
      throw error
    }

    return data
  },

  /**
   * Create title via quick add form (simplified input)
   * Sets verified: false by default
   */
  async createQuickTitle(input: QuickAddTitleInput): Promise<Title> {
    const { data, error } = await supabase
      .from('titles')
      .insert([{
        ...input,
        verified: false,
      }])
      .select()
      .single()

    if (error) {
      console.error('Error creating quick title:', error)
      throw error
    }

    return data
  },

  /**
   * Update existing title
   */
  async updateTitle(titleId: string, updates: Partial<Title>): Promise<Title> {
    const { data, error } = await supabase
      .from('titles')
      .update(updates)
      .eq('title_id', titleId)
      .select()
      .single()

    if (error) {
      console.error('Error updating title:', error)
      throw error
    }

    return data
  },

  /**
   * Delete title
   */
  async deleteTitle(titleId: string): Promise<void> {
    const { error } = await supabase
      .from('titles')
      .delete()
      .eq('title_id', titleId)

    if (error) {
      console.error('Error deleting title:', error)
      throw error
    }
  },

  /**
   * Create title with related data (platforms and documents) in a single transaction
   * This is the main function used by the 5-step survey form
   *
   * NOTE: Supabase JavaScript client doesn't support true transactions.
   * This function performs sequential operations with cleanup on error.
   * For true atomicity, use a database transaction via RPC function.
   *
   * @param titleInput - Title data
   * @param platforms - Array of platform data (optional)
   * @param documents - Array of document metadata (optional, files should be uploaded separately)
   * @returns Created title with related data
   */
  async createTitleWithRelated(
    titleInput: CreateTitleInput,
    platforms?: Array<{
      platform_name: string
      platform_url: string
      views?: number
      subscribers?: number
      other_metrics?: Record<string, any>
    }>,
    documents?: Array<{
      document_type: string
      file_url: string
      file_name: string
      file_size: number | null
      shareable_with_nda?: boolean
      external_url?: string | null
    }>
  ): Promise<{
    title: Title
    platforms: any[]
    documents: any[]
  }> {
    try {
      // Step 1: Create title
      const title = await this.createTitle(titleInput)

      const createdPlatforms: any[] = []
      const createdDocuments: any[] = []

      try {
        // Step 2: Create platforms (if provided)
        if (platforms && platforms.length > 0) {
          const platformsWithTitleId = platforms.map((p) => ({
            ...p,
            title_id: title.title_id,
          }))

          const { data: platformData, error: platformError } = await supabase
            .from('title_platforms')
            .insert(platformsWithTitleId)
            .select()

          if (platformError) {
            throw new Error(`Failed to create platforms: ${platformError.message}`)
          }

          createdPlatforms.push(...(platformData || []))
        }

        // Step 3: Create document metadata (if provided)
        if (documents && documents.length > 0) {
          const documentsWithTitleId = documents.map((d) => ({
            ...d,
            title_id: title.title_id,
          }))

          const { data: documentData, error: documentError } = await supabase
            .from('title_documents')
            .insert(documentsWithTitleId)
            .select()

          if (documentError) {
            throw new Error(`Failed to create documents: ${documentError.message}`)
          }

          createdDocuments.push(...(documentData || []))
        }

        return {
          title,
          platforms: createdPlatforms,
          documents: createdDocuments,
        }
      } catch (relatedError) {
        // Cleanup: Delete the created title if related data creation fails
        console.error('Error creating related data, cleaning up title:', relatedError)
        await this.deleteTitle(title.title_id)
        throw relatedError
      }
    } catch (error) {
      console.error('Error in createTitleWithRelated:', error)
      throw error
    }
  },

  /**
   * ADMIN FUNCTIONS - For admin approval workflow
   */

  /**
   * Get all submitted drafts (pending approval)
   * Admin function to view all titles awaiting review
   *
   * @returns Array of submitted drafts
   */
  async getAllSubmittedDrafts() {
    try {
      const { data, error } = await supabase
        .from('title_drafts')
        .select(`
          *,
          user_creators!title_drafts_creator_id_fkey (
            pen_name,
            full_name,
            email
          )
        `)
        .eq('status', 'submitted')
        .order('submitted_at', { ascending: false })

      if (error) {
        console.error('Error fetching submitted drafts:', error)
        throw new Error(`Failed to fetch submitted drafts: ${error.message}`)
      }

      return data || []
    } catch (error) {
      console.error('Error in getAllSubmittedDrafts:', error)
      throw error
    }
  },

  /**
   * Approve a draft and create the title in the titles table
   * Admin function to approve a submission
   *
   * @param draftId - UUID of the draft to approve
   * @param adminUserId - UUID of the admin approving the draft
   * @returns Created title record
   */
  async approveDraft(draftId: string, adminUserId: string) {
    try {
      // 1. Fetch the draft
      const { data: draft, error: fetchError } = await supabase
        .from('title_drafts')
        .select('*')
        .eq('id', draftId)
        .eq('status', 'submitted')
        .single()

      if (fetchError || !draft) {
        throw new Error('Draft not found or not in submitted status')
      }

      // 2. Create title in titles table using draft_data
      const titleData = draft.draft_data
      const result = await this.createTitleWithRelated(
        titleData,
        titleData.platforms || [],
        titleData.documents || []
      )

      // 3. Update draft status to 'approved'
      const { error: updateError } = await supabase
        .from('title_drafts')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: adminUserId,
        })
        .eq('id', draftId)

      if (updateError) {
        console.error('Error updating draft status:', updateError)
        // Note: Title was already created, so we don't rollback here
        // Admin can manually fix the draft status if needed
      }

      return result
    } catch (error) {
      console.error('Error in approveDraft:', error)
      throw error
    }
  },

  /**
   * Reject a draft with a reason
   * Admin function to reject a submission
   *
   * @param draftId - UUID of the draft to reject
   * @param rejectionReason - Reason for rejection (shown to creator)
   * @param adminUserId - UUID of the admin rejecting the draft
   */
  async rejectDraft(draftId: string, rejectionReason: string, adminUserId: string) {
    try {
      const { data, error } = await supabase
        .from('title_drafts')
        .update({
          status: 'rejected',
          rejected_at: new Date().toISOString(),
          approved_by: adminUserId, // Reusing field for "reviewed_by"
          rejection_reason: rejectionReason,
        })
        .eq('id', draftId)
        .eq('status', 'submitted')
        .select()
        .single()

      if (error) {
        console.error('Error rejecting draft:', error)
        throw new Error(`Failed to reject draft: ${error.message}`)
      }

      if (!data) {
        throw new Error('Draft not found or not in submitted status')
      }

      return data
    } catch (error) {
      console.error('Error in rejectDraft:', error)
      throw error
    }
  },
}
