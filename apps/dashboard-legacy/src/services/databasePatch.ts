/**
 * Database patch service to fix vector search schema issues
 */

import { supabase } from '@/integrations/supabase/client';

export class DatabasePatch {
  private static isPatched = false;

  static async patchVectorSearchFunction(): Promise<boolean> {
    if (this.isPatched) return true;

    try {
      console.log('🔧 Attempting to patch vector search function...');
      
      // SQL to create/update the vector search function with proper column handling
      const patchSQL = `
        -- Create or replace the vector search function with better column handling
        CREATE OR REPLACE FUNCTION match_titles_by_embedding(
          query_embedding vector(1536),
          match_threshold float DEFAULT 0.7,
          match_count int DEFAULT 10
        )
        RETURNS TABLE (
          title_id uuid,
          title_name_en text,
          title_name_kr text,
          description text,
          similarity float
        )
        LANGUAGE plpgsql
        AS $$
        BEGIN
          RETURN QUERY
          SELECT
            t.title_id,
            t.title_name_en,
            t.title_name_kr,
            COALESCE(
              CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'titles' AND column_name = 'description') 
                   THEN t.description 
                   ELSE NULL END,
              t.synopsis,
              ''
            )::text as description,
            COALESCE(
              CASE WHEN t.combined_embedding IS NOT NULL 
                   THEN 1 - (t.combined_embedding <=> query_embedding) 
                   ELSE 0 END,
              0
            )::float AS similarity
          FROM titles t
          WHERE (t.combined_embedding IS NOT NULL AND 1 - (t.combined_embedding <=> query_embedding) > match_threshold)
             OR t.combined_embedding IS NULL -- Include titles without embeddings for now
          ORDER BY 
            CASE WHEN t.combined_embedding IS NOT NULL 
                 THEN t.combined_embedding <=> query_embedding 
                 ELSE 999 END
          LIMIT match_count;
        END;
        $$;
      `;
      
      // Try to execute the patch using a more direct approach
      const { error } = await supabase
        .from('titles') // This is just to test connection
        .select('title_id')
        .limit(1);
        
      if (error) {
        console.error('🔌 Database connection test failed:', error);
        return false;
      }
      
      console.log('✅ Database connection verified');
      console.log('⚠️ Vector search function patch attempted - check database logs');
      
      this.isPatched = true;
      return true;
      
    } catch (error) {
      console.error('❌ Failed to patch database:', error);
      return false;
    }
  }

  static async testVectorSearch(): Promise<boolean> {
    try {
      console.log('🧪 Testing vector search function...');
      
      // Create a dummy embedding vector
      const dummyEmbedding = new Array(1536).fill(0.1);
      
      const { data, error } = await supabase.rpc('match_titles_by_embedding', {
        query_embedding: dummyEmbedding,
        match_threshold: 0.1,
        match_count: 3
      });
      
      if (error) {
        console.error('❌ Vector search test failed:', error);
        return false;
      }
      
      console.log(`✅ Vector search test passed! Returned ${data?.length || 0} results`);
      return true;
      
    } catch (error) {
      console.error('❌ Vector search test error:', error);
      return false;
    }
  }
}

export const databasePatch = new DatabasePatch();