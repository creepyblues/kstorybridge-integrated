import { supabase } from '@/lib/supabase'

/**
 * Title draft data structure
 * Stores auto-saved progress for incomplete title submissions
 */
export interface TitleDraft {
  id: string
  creator_id: string
  draft_data: Record<string, any>
  current_step: number
  last_saved_at: string
  created_at?: string
  updated_at?: string
  // Workflow fields
  status?: 'draft' | 'submitted' | 'approved' | 'rejected'
  submitted_at?: string
  approved_at?: string
  rejected_at?: string
  approved_by?: string
  rejection_reason?: string
}

/**
 * Input for saving/updating a draft
 */
export interface SaveDraftInput {
  creator_id: string
  draft_data: Record<string, any>
  current_step: number
}

/**
 * Get display name for a draft
 * Uses title_name_en or title_name_kr from draft_data, falls back to "Untitled Draft"
 *
 * @param draft - Draft object
 * @returns Display name for UI
 */
export function getDraftDisplayName(draft: TitleDraft): string {
  return draft.draft_data?.title_name_en
    || draft.draft_data?.title_name_kr
    || 'Untitled Draft'
}

/**
 * Service for managing auto-saved title drafts
 * Supports multiple drafts per creator (UNIQUE constraint removed 2025-11-04)
 */
export const draftService = {
  /**
   * Save or update a draft for a creator
   * Uses UPSERT to handle both create and update cases
   *
   * @param input - Draft data to save
   * @returns Saved draft record
   */
  async saveDraft(input: SaveDraftInput): Promise<TitleDraft> {
    const { creator_id, draft_data, current_step } = input

    // Validate current_step is within valid range
    if (current_step < 1 || current_step > 5) {
      throw new Error('current_step must be between 1 and 5')
    }

    try {
      // Use upsert to handle both insert and update
      // Always set status to 'draft' for in-progress work
      const { data, error } = await supabase
        .from('title_drafts')
        .upsert(
          {
            creator_id,
            draft_data,
            current_step,
            status: 'draft', // Always 'draft' for auto-save
            last_saved_at: new Date().toISOString(),
          },
          {
            onConflict: 'creator_id', // UNIQUE constraint field
          }
        )
        .select()
        .single()

      if (error) {
        console.error('Error saving draft:', error)
        throw new Error(`Failed to save draft: ${error.message}`)
      }

      return data
    } catch (error) {
      console.error('Error in saveDraft:', error)
      throw error
    }
  },

  /**
   * Load the existing draft for a creator
   * Returns null if no draft exists
   *
   * @param creatorId - UUID of the creator
   * @returns Draft record or null
   */
  async loadDraft(creatorId: string): Promise<TitleDraft | null> {
    try {
      const { data, error } = await supabase
        .from('title_drafts')
        .select('*')
        .eq('creator_id', creatorId)
        .maybeSingle()

      if (error) {
        // PGRST116 (not found) or PGRST301 (multiple rows) are expected
        if (error.code === 'PGRST116' || error.code === 'PGRST301') {
          return null
        }
        console.error('Error loading draft:', error)
        // Don't throw for table not found errors - just return null
        return null
      }

      return data
    } catch (error) {
      console.error('Error in loadDraft:', error)
      // Don't throw - return null if draft doesn't exist
      return null
    }
  },

  /**
   * Delete the draft for a creator
   * Only deletes drafts with status='draft' (not submitted/approved/rejected)
   *
   * @param creatorId - UUID of the creator
   */
  async deleteDraft(creatorId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('title_drafts')
        .delete()
        .eq('creator_id', creatorId)
        .eq('status', 'draft') // Only delete drafts, not submitted titles

      if (error) {
        console.error('Error deleting draft:', error)
        throw new Error(`Failed to delete draft: ${error.message}`)
      }
    } catch (error) {
      console.error('Error in deleteDraft:', error)
      throw error
    }
  },

  /**
   * Submit a draft for admin approval
   * Updates status to 'submitted' and sets submitted_at timestamp
   *
   * @param creatorId - UUID of the creator
   * @returns Updated draft record
   */
  async submitDraft(creatorId: string): Promise<TitleDraft> {
    try {
      const { data, error } = await supabase
        .from('title_drafts')
        .update({
          status: 'submitted',
          submitted_at: new Date().toISOString(),
        })
        .eq('creator_id', creatorId)
        .eq('status', 'draft') // Only submit if currently a draft
        .select()
        .single()

      if (error) {
        console.error('Error submitting draft:', error)
        throw new Error(`Failed to submit draft: ${error.message}`)
      }

      if (!data) {
        throw new Error('No draft found to submit')
      }

      return data
    } catch (error) {
      console.error('Error in submitDraft:', error)
      throw error
    }
  },

  /**
   * Get all submitted drafts for a creator (pending approval)
   * Returns drafts with status='submitted'
   *
   * @param creatorId - UUID of the creator
   * @returns Array of submitted draft records
   */
  async getPendingDrafts(creatorId: string): Promise<TitleDraft[]> {
    try {
      const { data, error } = await supabase
        .from('title_drafts')
        .select('*')
        .eq('creator_id', creatorId)
        .eq('status', 'submitted')
        .order('submitted_at', { ascending: false })

      if (error) {
        console.error('Error fetching pending drafts:', error)
        throw new Error(`Failed to fetch pending drafts: ${error.message}`)
      }

      return data || []
    } catch (error) {
      console.error('Error in getPendingDrafts:', error)
      throw error
    }
  },

  /**
   * Get all rejected drafts for a creator
   * Returns drafts with status='rejected' so creator can edit and resubmit
   *
   * @param creatorId - UUID of the creator
   * @returns Array of rejected draft records
   */
  async getRejectedDrafts(creatorId: string): Promise<TitleDraft[]> {
    try {
      const { data, error } = await supabase
        .from('title_drafts')
        .select('*')
        .eq('creator_id', creatorId)
        .eq('status', 'rejected')
        .order('rejected_at', { ascending: false })

      if (error) {
        console.error('Error fetching rejected drafts:', error)
        throw new Error(`Failed to fetch rejected drafts: ${error.message}`)
      }

      return data || []
    } catch (error) {
      console.error('Error in getRejectedDrafts:', error)
      throw error
    }
  },

  /**
   * Load only in-progress draft (status='draft')
   * Used on AddTitle page to resume editing
   *
   * @param creatorId - UUID of the creator
   * @returns Draft record or null
   */
  async loadInProgressDraft(creatorId: string): Promise<TitleDraft | null> {
    try {
      const { data, error } = await supabase
        .from('title_drafts')
        .select('*')
        .eq('creator_id', creatorId)
        .eq('status', 'draft')
        .maybeSingle()

      if (error) {
        if (error.code === 'PGRST116' || error.code === 'PGRST301') {
          return null
        }
        console.error('Error loading in-progress draft:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error in loadInProgressDraft:', error)
      return null
    }
  },

  /**
   * Check if a draft exists for a creator
   * Lightweight check without fetching full draft data
   *
   * @param creatorId - UUID of the creator
   * @returns True if draft exists, false otherwise
   */
  async hasDraft(creatorId: string): Promise<boolean> {
    try {
      const { count, error } = await supabase
        .from('title_drafts')
        .select('id', { count: 'exact', head: true })
        .eq('creator_id', creatorId)

      if (error) {
        console.error('Error checking draft existence:', error)
        throw new Error(`Failed to check draft: ${error.message}`)
      }

      return (count ?? 0) > 0
    } catch (error) {
      console.error('Error in hasDraft:', error)
      throw error
    }
  },

  /**
   * Get the last saved timestamp for a creator's draft
   * Useful for displaying "Last saved: X minutes ago" in UI
   *
   * @param creatorId - UUID of the creator
   * @returns ISO timestamp string or null if no draft exists
   */
  async getLastSavedAt(creatorId: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('title_drafts')
        .select('last_saved_at')
        .eq('creator_id', creatorId)
        .single()

      if (error) {
        // Not found is expected if no draft exists
        if (error.code === 'PGRST116') {
          return null
        }
        console.error('Error fetching last saved time:', error)
        throw new Error(`Failed to fetch last saved time: ${error.message}`)
      }

      return data.last_saved_at
    } catch (error) {
      console.error('Error in getLastSavedAt:', error)
      throw error
    }
  },

  /**
   * Update only the current step without changing draft data
   * Used when navigating between steps without form changes
   *
   * @param creatorId - UUID of the creator
   * @param currentStep - Step number (1-5)
   */
  async updateCurrentStep(creatorId: string, currentStep: number): Promise<void> {
    if (currentStep < 1 || currentStep > 5) {
      throw new Error('current_step must be between 1 and 5')
    }

    try {
      const { error } = await supabase
        .from('title_drafts')
        .update({
          current_step: currentStep,
          last_saved_at: new Date().toISOString(),
        })
        .eq('creator_id', creatorId)

      if (error) {
        console.error('Error updating current step:', error)
        throw new Error(`Failed to update current step: ${error.message}`)
      }
    } catch (error) {
      console.error('Error in updateCurrentStep:', error)
      throw error
    }
  },

  /**
   * Merge new data into existing draft data
   * Useful for incremental updates without replacing entire draft
   *
   * @param creatorId - UUID of the creator
   * @param newData - New data to merge
   * @param currentStep - Current step number
   * @returns Updated draft record
   */
  async mergeDraftData(
    creatorId: string,
    newData: Record<string, any>,
    currentStep: number
  ): Promise<TitleDraft> {
    try {
      // Load existing draft
      const existingDraft = await this.loadDraft(creatorId)

      // Merge data
      const mergedData = existingDraft
        ? { ...existingDraft.draft_data, ...newData }
        : newData

      // Save merged draft
      return await this.saveDraft({
        creator_id: creatorId,
        draft_data: mergedData,
        current_step: currentStep,
      })
    } catch (error) {
      console.error('Error in mergeDraftData:', error)
      throw error
    }
  },

  /**
   * MULTI-DRAFT FUNCTIONS (Added 2025-11-04)
   * Support for multiple drafts per creator
   */

  /**
   * Get all drafts for a creator, optionally filtered by status
   * Replaces loadDraft() and loadInProgressDraft()
   *
   * @param creatorId - UUID of the creator
   * @param status - Optional status filter ('draft', 'submitted', 'rejected')
   * @returns Array of draft records (empty array if none found)
   */
  async getAllDrafts(
    creatorId: string,
    status?: 'draft' | 'submitted' | 'approved' | 'rejected'
  ): Promise<TitleDraft[]> {
    try {
      let query = supabase
        .from('title_drafts')
        .select('*')
        .eq('creator_id', creatorId)
        .order('last_saved_at', { ascending: false })

      if (status) {
        query = query.eq('status', status)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching drafts:', error)
        throw new Error(`Failed to fetch drafts: ${error.message}`)
      }

      return data || []
    } catch (error) {
      console.error('Error in getAllDrafts:', error)
      throw error
    }
  },

  /**
   * Get a specific draft by its ID
   * Used when navigating to edit a specific draft
   *
   * @param draftId - UUID of the draft
   * @returns Draft record or null if not found
   */
  async getDraftById(draftId: string): Promise<TitleDraft | null> {
    try {
      const { data, error } = await supabase
        .from('title_drafts')
        .select('*')
        .eq('id', draftId)
        .maybeSingle()

      if (error) {
        if (error.code === 'PGRST116') {
          return null
        }
        console.error('Error fetching draft by ID:', error)
        throw new Error(`Failed to fetch draft: ${error.message}`)
      }

      return data
    } catch (error) {
      console.error('Error in getDraftById:', error)
      return null
    }
  },

  /**
   * Create a new draft (INSERT operation, no UPSERT)
   * Used when starting a new title submission
   *
   * @param input - Draft data to create
   * @returns Created draft record
   */
  async createDraft(input: SaveDraftInput): Promise<TitleDraft> {
    const { creator_id, draft_data, current_step } = input

    // Validate current_step is within valid range
    if (current_step < 1 || current_step > 5) {
      throw new Error('current_step must be between 1 and 5')
    }

    try {
      const { data, error } = await supabase
        .from('title_drafts')
        .insert({
          creator_id,
          draft_data,
          current_step,
          status: 'draft',
          last_saved_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating draft:', error)
        throw new Error(`Failed to create draft: ${error.message}`)
      }

      return data
    } catch (error) {
      console.error('Error in createDraft:', error)
      throw error
    }
  },

  /**
   * Update an existing draft by ID
   * Used by auto-save to update specific draft
   *
   * @param draftId - UUID of the draft to update
   * @param updates - Partial draft data to update
   * @returns Updated draft record
   */
  async updateDraftById(
    draftId: string,
    updates: Partial<Omit<SaveDraftInput, 'creator_id'>>
  ): Promise<TitleDraft> {
    try {
      // Validate current_step if provided
      if (updates.current_step && (updates.current_step < 1 || updates.current_step > 5)) {
        throw new Error('current_step must be between 1 and 5')
      }

      const updateData: any = {
        last_saved_at: new Date().toISOString(),
      }

      if (updates.draft_data) {
        updateData.draft_data = updates.draft_data
      }

      if (updates.current_step !== undefined) {
        updateData.current_step = updates.current_step
      }

      const { data, error } = await supabase
        .from('title_drafts')
        .update(updateData)
        .eq('id', draftId)
        .eq('status', 'draft') // Only update if status is still draft
        .select()
        .single()

      if (error) {
        console.error('Error updating draft by ID:', error)
        throw new Error(`Failed to update draft: ${error.message}`)
      }

      if (!data) {
        throw new Error('Draft not found or cannot be updated (may have been submitted)')
      }

      return data
    } catch (error) {
      console.error('Error in updateDraftById:', error)
      throw error
    }
  },

  /**
   * Delete a specific draft by ID
   * Replaces deleteDraft(creatorId)
   *
   * @param draftId - UUID of the draft to delete
   */
  async deleteDraftById(draftId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('title_drafts')
        .delete()
        .eq('id', draftId)
        .eq('status', 'draft') // Only delete if status='draft'

      if (error) {
        console.error('Error deleting draft by ID:', error)
        throw new Error(`Failed to delete draft: ${error.message}`)
      }
    } catch (error) {
      console.error('Error in deleteDraftById:', error)
      throw error
    }
  },

  /**
   * Submit a specific draft for approval by ID
   * Replaces submitDraft(creatorId)
   *
   * @param draftId - UUID of the draft to submit
   * @returns Updated draft record
   */
  async submitDraftById(draftId: string): Promise<TitleDraft> {
    try {
      const { data, error } = await supabase
        .from('title_drafts')
        .update({
          status: 'submitted',
          submitted_at: new Date().toISOString(),
        })
        .eq('id', draftId)
        .eq('status', 'draft') // Only submit if currently a draft
        .select()
        .single()

      if (error) {
        console.error('Error submitting draft by ID:', error)
        throw new Error(`Failed to submit draft: ${error.message}`)
      }

      if (!data) {
        throw new Error('Draft not found or already submitted')
      }

      return data
    } catch (error) {
      console.error('Error in submitDraftById:', error)
      throw error
    }
  },
}
