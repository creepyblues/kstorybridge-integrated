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
  tagline?: string | null
  pitch?: string | null
  views?: number | null
  chapters?: number | null
  completed?: boolean | null
  rights_owner?: string | null
  rights?: string | null
  perfect_for?: string | null
  audience?: string | null
  comps?: string[] | null
  content_format?: string | null
  tags?: string[] | null
  keywords?: string[] | null
  note?: string | null
  creator_id?: string | null
  created_at?: string
  updated_at?: string
  // Extended fields
  author?: string | null
  writer?: string | null
  illustrator?: string | null
}

export interface CreateTitleInput {
  title_name_en: string
  title_name_kr: string
  title_url: string
  title_image: string
  story_author: string
  genre?: string[] | null
  synopsis?: string | null
  tagline?: string | null
  creator_id: string
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
   * Get single title by ID
   */
  async getTitleById(titleId: string): Promise<Title | null> {
    const { data, error } = await supabase
      .from('titles')
      .select('*')
      .eq('title_id', titleId)
      .single()

    if (error) {
      console.error('Error fetching title:', error)
      throw error
    }

    return data
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
  }
}
