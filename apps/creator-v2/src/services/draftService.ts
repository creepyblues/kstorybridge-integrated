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
 * Service for managing auto-saved title drafts
 * Supports one draft per creator (UNIQUE constraint on creator_id)
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
      const { data, error } = await supabase
        .from('title_drafts')
        .upsert(
          {
            creator_id,
            draft_data,
            current_step,
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
   * Used after successful title submission
   *
   * @param creatorId - UUID of the creator
   */
  async deleteDraft(creatorId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('title_drafts')
        .delete()
        .eq('creator_id', creatorId)

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
}
