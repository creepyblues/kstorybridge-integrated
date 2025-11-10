import { supabase } from '@/lib/supabase'

const BUCKET_NAME = 'pitch-pdfs'
const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

interface UploadPitchDeckParams {
  titleId: string
  file: File
  onProgress?: (progress: number) => void
}

interface UploadPitchDeckResult {
  url: string
  path: string
}

/**
 * Pitch Deck Service
 *
 * Handles upload, replacement, and deletion of pitch deck PDFs
 *
 * Storage bucket: pitch-pdfs
 * Path structure: {title_id}/pitch.pdf
 * Database field: titles.pitch (stores URL)
 */
export const pitchDeckService = {
  /**
   * Upload a new pitch deck PDF
   * Replaces existing pitch deck if present
   */
  async uploadPitchDeck({ titleId, file, onProgress }: UploadPitchDeckParams): Promise<UploadPitchDeckResult> {
    try {
      // Validate file type
      if (file.type !== 'application/pdf') {
        throw new Error('Only PDF files are allowed')
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        throw new Error(`File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB`)
      }

      // Delete existing pitch deck if present
      await this.deleteExistingPitchDeck(titleId)

      // Upload new pitch deck
      const filePath = `${titleId}/pitch.pdf`

      // Simulate progress if callback provided
      onProgress?.(10)

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true // Allow replacing if file exists
        })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        throw new Error(`Upload failed: ${uploadError.message}`)
      }

      onProgress?.(70)

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(uploadData.path)

      onProgress?.(90)

      // Update titles table with new pitch URL
      const { error: updateError } = await supabase
        .from('titles')
        .update({ pitch: urlData.publicUrl })
        .eq('title_id', titleId)

      if (updateError) {
        console.error('Database update error:', updateError)
        // Try to clean up uploaded file
        await supabase.storage.from(BUCKET_NAME).remove([filePath])
        throw new Error(`Failed to update title: ${updateError.message}`)
      }

      onProgress?.(100)

      return {
        url: urlData.publicUrl,
        path: uploadData.path
      }
    } catch (error) {
      console.error('Error uploading pitch deck:', error)
      throw error
    }
  },

  /**
   * Delete existing pitch deck for a title
   * Does not throw error if no pitch deck exists
   */
  async deleteExistingPitchDeck(titleId: string): Promise<void> {
    try {
      // Get current pitch deck URL from database
      const { data: title, error: fetchError } = await supabase
        .from('titles')
        .select('pitch')
        .eq('title_id', titleId)
        .single()

      if (fetchError || !title?.pitch) {
        // No existing pitch deck, nothing to delete
        return
      }

      // Extract file path from URL
      const pathMatch = title.pitch.match(/\/storage\/v1\/object\/(?:public\/)?pitch-pdfs\/(.+)$/)
      if (pathMatch) {
        const filePath = pathMatch[1]

        // Delete file from storage (don't throw error if file doesn't exist)
        const { error: deleteError } = await supabase.storage
          .from(BUCKET_NAME)
          .remove([filePath])

        if (deleteError) {
          console.warn('Failed to delete old pitch deck file:', deleteError)
          // Continue anyway - we'll update the database
        }
      }
    } catch (error) {
      console.warn('Error during pitch deck deletion:', error)
      // Don't throw - allow upload to continue
    }
  },

  /**
   * Remove pitch deck from a title
   * Deletes file and clears database field
   */
  async removePitchDeck(titleId: string): Promise<void> {
    try {
      // Delete file from storage
      await this.deleteExistingPitchDeck(titleId)

      // Clear pitch field in database
      const { error: updateError } = await supabase
        .from('titles')
        .update({ pitch: null })
        .eq('title_id', titleId)

      if (updateError) {
        throw new Error(`Failed to update title: ${updateError.message}`)
      }
    } catch (error) {
      console.error('Error removing pitch deck:', error)
      throw error
    }
  },

  /**
   * Get pitch deck URL for a title
   */
  async getPitchDeckUrl(titleId: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('titles')
        .select('pitch')
        .eq('title_id', titleId)
        .single()

      if (error || !data) {
        return null
      }

      return data.pitch
    } catch (error) {
      console.error('Error fetching pitch deck URL:', error)
      return null
    }
  },

  /**
   * Validate file before upload
   */
  validateFile(file: File): { valid: boolean; error?: string } {
    if (file.type !== 'application/pdf') {
      return { valid: false, error: 'Only PDF files are allowed' }
    }

    if (file.size > MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB`
      }
    }

    return { valid: true }
  }
}
