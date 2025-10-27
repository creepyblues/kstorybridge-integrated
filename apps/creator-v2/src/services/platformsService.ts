import { supabase } from '@/lib/supabase'

/**
 * Platform names supported by the system
 */
export type PlatformName =
  | 'naver'
  | 'kakao'
  | 'lezhin'
  | 'ridibooks'
  | 'toomics'
  | 'bomtoon'
  | 'ktoon'
  | 'kakaopage'
  | 'munpia'
  | 'joara'
  | 'novelpia'
  | 'other'

/**
 * Title platform data structure
 */
export interface TitlePlatform {
  id: string
  title_id: string
  platform_name: PlatformName
  platform_url: string
  views: number
  subscribers: number
  other_metrics?: Record<string, any>
  created_at?: string
  updated_at?: string
}

/**
 * Input for creating a new platform entry
 */
export interface CreatePlatformInput {
  title_id: string
  platform_name: PlatformName
  platform_url: string
  views?: number
  subscribers?: number
  other_metrics?: Record<string, any>
}

/**
 * Service for managing title platforms (Naver, Kakao, Lezhin, etc.)
 * Supports multiple platforms per title with metrics tracking
 */
export const platformsService = {
  /**
   * Add multiple platforms for a title (batch insert)
   * Used during initial title creation with questionnaire data
   *
   * @param platforms - Array of platform data to insert
   * @returns Array of created platform records
   */
  async addPlatforms(platforms: CreatePlatformInput[]): Promise<TitlePlatform[]> {
    if (platforms.length === 0) {
      return []
    }

    try {
      const { data, error } = await supabase
        .from('title_platforms')
        .insert(platforms)
        .select()

      if (error) {
        console.error('Error adding platforms:', error)
        throw new Error(`Failed to add platforms: ${error.message}`)
      }

      return data || []
    } catch (error) {
      console.error('Error in addPlatforms:', error)
      throw error
    }
  },

  /**
   * Add a single platform for a title
   * Used for dynamically adding platforms in the UI
   *
   * @param input - Platform data to insert
   * @returns Created platform record
   */
  async addPlatform(input: CreatePlatformInput): Promise<TitlePlatform> {
    try {
      const { data, error } = await supabase
        .from('title_platforms')
        .insert([input])
        .select()
        .single()

      if (error) {
        console.error('Error adding platform:', error)
        throw new Error(`Failed to add platform: ${error.message}`)
      }

      return data
    } catch (error) {
      console.error('Error in addPlatform:', error)
      throw error
    }
  },

  /**
   * Get all platforms for a specific title
   *
   * @param titleId - UUID of the title
   * @returns Array of platform records
   */
  async getPlatformsByTitleId(titleId: string): Promise<TitlePlatform[]> {
    try {
      const { data, error } = await supabase
        .from('title_platforms')
        .select('*')
        .eq('title_id', titleId)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error fetching platforms:', error)
        throw new Error(`Failed to fetch platforms: ${error.message}`)
      }

      return data || []
    } catch (error) {
      console.error('Error in getPlatformsByTitleId:', error)
      throw error
    }
  },

  /**
   * Update an existing platform entry
   * Used for updating metrics or URL
   *
   * @param id - Platform record ID
   * @param updates - Partial platform data to update
   * @returns Updated platform record
   */
  async updatePlatform(
    id: string,
    updates: Partial<Omit<TitlePlatform, 'id' | 'title_id' | 'created_at' | 'updated_at'>>
  ): Promise<TitlePlatform> {
    try {
      const { data, error } = await supabase
        .from('title_platforms')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Error updating platform:', error)
        throw new Error(`Failed to update platform: ${error.message}`)
      }

      return data
    } catch (error) {
      console.error('Error in updatePlatform:', error)
      throw error
    }
  },

  /**
   * Delete a platform entry
   * Used when creator removes a platform from their title
   *
   * @param id - Platform record ID
   */
  async deletePlatform(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('title_platforms')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting platform:', error)
        throw new Error(`Failed to delete platform: ${error.message}`)
      }
    } catch (error) {
      console.error('Error in deletePlatform:', error)
      throw error
    }
  },

  /**
   * Delete all platforms for a specific title
   * Used during title deletion or when resetting platforms
   *
   * @param titleId - UUID of the title
   */
  async deletePlatformsByTitleId(titleId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('title_platforms')
        .delete()
        .eq('title_id', titleId)

      if (error) {
        console.error('Error deleting platforms by title:', error)
        throw new Error(`Failed to delete platforms: ${error.message}`)
      }
    } catch (error) {
      console.error('Error in deletePlatformsByTitleId:', error)
      throw error
    }
  },
}
