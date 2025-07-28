import { supabase } from '@/integrations/supabase/client';

export const pdfService = {
  /**
   * Upload PDF to Supabase storage
   * Note: This requires service role key or admin authentication
   */
  async uploadPDF(file: File, titleId: string): Promise<string> {
    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${titleId}/pitch.${fileExt}`;

      // Upload to storage
      const { data, error } = await supabase.storage
        .from('pitch-pdfs')
        .upload(fileName, file, {
          upsert: true, // Overwrite if exists
          contentType: 'application/pdf'
        });

      if (error) throw error;

      // Get the public URL (will require authentication to access)
      const { data: urlData } = supabase.storage
        .from('pitch-pdfs')
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading PDF:', error);
      throw new Error('Failed to upload PDF');
    }
  },

  /**
   * Update title's pitch field with PDF URL
   */
  async updateTitlePitch(titleId: string, pdfUrl: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('titles')
        .update({ pitch: pdfUrl })
        .eq('title_id', titleId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating title pitch:', error);
      throw new Error('Failed to update title pitch');
    }
  },

  /**
   * Delete PDF from storage
   */
  async deletePDF(titleId: string): Promise<void> {
    try {
      const fileName = `${titleId}/pitch.pdf`;
      
      const { error } = await supabase.storage
        .from('pitch-pdfs')
        .remove([fileName]);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting PDF:', error);
      throw new Error('Failed to delete PDF');
    }
  },

  /**
   * Get signed URL for PDF access (for authenticated users)
   */
  async getSignedPDFUrl(pdfPath: string, expiresIn: number = 3600): Promise<string> {
    try {
      const { data, error } = await supabase.storage
        .from('pitch-pdfs')
        .createSignedUrl(pdfPath, expiresIn);

      if (error) throw error;
      if (!data?.signedUrl) throw new Error('No signed URL received');

      return data.signedUrl;
    } catch (error) {
      console.error('Error getting signed URL:', error);
      throw new Error('Failed to get PDF access URL');
    }
  }
};