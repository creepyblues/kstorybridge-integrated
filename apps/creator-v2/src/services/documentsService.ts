import { supabase } from '@/lib/supabase'

/**
 * Document types supported by the system
 */
export type DocumentType =
  | 'source_pdf'          // Source material PDF (can share with NDA)
  | 'story_bible'         // Story bible document
  | 'outline'             // Story outline
  | 'script'              // Script/screenplay
  | 'press_release'       // Press release
  | 'interview'           // Creator interview (external link)
  | 'review'              // Review with story content (external link)
  | 'wiki'                // Fan wiki (external link)
  | 'other'               // Other creative documents

/**
 * Title document data structure
 */
export interface TitleDocument {
  id: string
  title_id: string
  document_type: DocumentType
  file_url: string
  file_name: string
  file_size: number | null
  shareable_with_nda: boolean
  external_url: string | null
  created_at?: string
  updated_at?: string
}

/**
 * Input for uploading a new document
 */
export interface UploadDocumentInput {
  title_id: string
  document_type: DocumentType
  file: File
  shareable_with_nda?: boolean
}

/**
 * Input for adding an external link as document
 */
export interface AddExternalLinkInput {
  title_id: string
  document_type: DocumentType
  external_url: string
  file_name: string // Display name for the link
  shareable_with_nda?: boolean
}

/**
 * Allowed MIME types for document uploads
 */
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]

/**
 * Maximum file size: 10MB
 */
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB in bytes

/**
 * Supabase Storage bucket name
 */
const STORAGE_BUCKET = 'title-documents'

/**
 * Service for managing title documents
 * Handles file uploads to Supabase Storage and metadata in title_documents table
 */
export const documentsService = {
  /**
   * Upload a document file to Supabase Storage and create metadata record
   *
   * @param input - Document upload data including file
   * @returns Created document record
   */
  async uploadDocument(input: UploadDocumentInput): Promise<TitleDocument> {
    const { title_id, document_type, file, shareable_with_nda = false } = input

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`File size exceeds 10MB limit. File size: ${(file.size / 1024 / 1024).toFixed(2)}MB`)
    }

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      throw new Error(`File type not allowed. Allowed types: PDF, Word, Excel, TXT`)
    }

    try {
      // Generate unique file path: {titleId}/{timestamp}_{filename}
      const timestamp = Date.now()
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      const filePath = `${title_id}/${timestamp}_${sanitizedFileName}`

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) {
        console.error('Error uploading file:', uploadError)
        throw new Error(`Failed to upload file: ${uploadError.message}`)
      }

      // Get public URL for the uploaded file
      const { data: urlData } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(uploadData.path)

      // Create metadata record in database
      const { data: documentData, error: dbError } = await supabase
        .from('title_documents')
        .insert([
          {
            title_id,
            document_type,
            file_url: urlData.publicUrl,
            file_name: file.name,
            file_size: file.size,
            shareable_with_nda,
            external_url: null,
          },
        ])
        .select()
        .single()

      if (dbError) {
        console.error('Error creating document record:', dbError)
        // Attempt to clean up uploaded file
        await supabase.storage.from(STORAGE_BUCKET).remove([uploadData.path])
        throw new Error(`Failed to create document record: ${dbError.message}`)
      }

      return documentData
    } catch (error) {
      console.error('Error in uploadDocument:', error)
      throw error
    }
  },

  /**
   * Add an external link as a document (e.g., Google Drive, interview URL)
   *
   * @param input - External link data
   * @returns Created document record
   */
  async addExternalLink(input: AddExternalLinkInput): Promise<TitleDocument> {
    const { title_id, document_type, external_url, file_name, shareable_with_nda = false } = input

    try {
      const { data, error } = await supabase
        .from('title_documents')
        .insert([
          {
            title_id,
            document_type,
            file_url: external_url, // Store external URL in file_url field
            file_name,
            file_size: null, // No file size for external links
            shareable_with_nda,
            external_url,
          },
        ])
        .select()
        .single()

      if (error) {
        console.error('Error adding external link:', error)
        throw new Error(`Failed to add external link: ${error.message}`)
      }

      return data
    } catch (error) {
      console.error('Error in addExternalLink:', error)
      throw error
    }
  },

  /**
   * Get all documents for a specific title
   *
   * @param titleId - UUID of the title
   * @returns Array of document records
   */
  async getDocumentsByTitleId(titleId: string): Promise<TitleDocument[]> {
    try {
      const { data, error } = await supabase
        .from('title_documents')
        .select('*')
        .eq('title_id', titleId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching documents:', error)
        throw new Error(`Failed to fetch documents: ${error.message}`)
      }

      return data || []
    } catch (error) {
      console.error('Error in getDocumentsByTitleId:', error)
      throw error
    }
  },

  /**
   * Delete a document (removes file from storage if applicable and deletes metadata)
   *
   * @param id - Document record ID
   */
  async deleteDocument(id: string): Promise<void> {
    try {
      // First, get the document record to find the file path
      const { data: document, error: fetchError } = await supabase
        .from('title_documents')
        .select('*')
        .eq('id', id)
        .single()

      if (fetchError) {
        console.error('Error fetching document for deletion:', fetchError)
        throw new Error(`Failed to fetch document: ${fetchError.message}`)
      }

      // Delete metadata record from database
      const { error: dbError } = await supabase
        .from('title_documents')
        .delete()
        .eq('id', id)

      if (dbError) {
        console.error('Error deleting document record:', dbError)
        throw new Error(`Failed to delete document record: ${dbError.message}`)
      }

      // If it's a file upload (not external link), delete from storage
      if (document.file_size !== null && !document.external_url) {
        // Extract file path from URL
        const url = new URL(document.file_url)
        const pathMatch = url.pathname.match(/\/storage\/v1\/object\/public\/title-documents\/(.+)$/)

        if (pathMatch && pathMatch[1]) {
          const filePath = pathMatch[1]

          const { error: storageError } = await supabase.storage
            .from(STORAGE_BUCKET)
            .remove([filePath])

          if (storageError) {
            console.error('Error deleting file from storage:', storageError)
            // Don't throw - metadata already deleted, file cleanup is best-effort
          }
        }
      }
    } catch (error) {
      console.error('Error in deleteDocument:', error)
      throw error
    }
  },

  /**
   * Delete all documents for a specific title
   * Used during title deletion
   *
   * @param titleId - UUID of the title
   */
  async deleteDocumentsByTitleId(titleId: string): Promise<void> {
    try {
      // Get all documents for the title
      const documents = await this.getDocumentsByTitleId(titleId)

      // Delete each document (includes storage cleanup)
      for (const doc of documents) {
        await this.deleteDocument(doc.id)
      }
    } catch (error) {
      console.error('Error in deleteDocumentsByTitleId:', error)
      throw error
    }
  },

  /**
   * Generate a signed URL for private document access
   * Useful for sharing documents with buyers who sign NDA
   *
   * @param filePath - Path to file in storage
   * @param expiresIn - Expiration time in seconds (default: 1 hour)
   * @returns Signed URL
   */
  async generateSignedUrl(filePath: string, expiresIn: number = 3600): Promise<string> {
    try {
      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .createSignedUrl(filePath, expiresIn)

      if (error) {
        console.error('Error generating signed URL:', error)
        throw new Error(`Failed to generate signed URL: ${error.message}`)
      }

      return data.signedUrl
    } catch (error) {
      console.error('Error in generateSignedUrl:', error)
      throw error
    }
  },

  /**
   * Update document metadata (e.g., toggle shareable_with_nda)
   *
   * @param id - Document record ID
   * @param updates - Partial document data to update
   * @returns Updated document record
   */
  async updateDocument(
    id: string,
    updates: Partial<Pick<TitleDocument, 'document_type' | 'shareable_with_nda' | 'file_name'>>
  ): Promise<TitleDocument> {
    try {
      const { data, error } = await supabase
        .from('title_documents')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Error updating document:', error)
        throw new Error(`Failed to update document: ${error.message}`)
      }

      return data
    } catch (error) {
      console.error('Error in updateDocument:', error)
      throw error
    }
  },
}
