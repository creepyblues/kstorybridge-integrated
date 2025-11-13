export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      admin: {
        Row: {
          active: boolean | null
          created_at: string | null
          email: string
          full_name: string
          id: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          email: string
          full_name: string
          id: string
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
        }
        Relationships: []
      }
      chat_interactions: {
        Row: {
          created_at: string
          id: string
          interaction_type: string
          metadata: Json | null
          session_id: string
          target_id: string | null
          target_title: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          interaction_type: string
          metadata?: Json | null
          session_id: string
          target_id?: string | null
          target_title?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          interaction_type?: string
          metadata?: Json | null
          session_id?: string
          target_id?: string | null
          target_title?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_interactions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_message_feedback: {
        Row: {
          created_at: string | null
          general_feedback: string | null
          id: string
          message_id: string
          overall_rating: number
          response_quality: string
          session_id: string
          suggested_improvements: string | null
          title_feedback: Json | null
          title_relevance: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          general_feedback?: string | null
          id?: string
          message_id: string
          overall_rating: number
          response_quality: string
          session_id: string
          suggested_improvements?: string | null
          title_feedback?: Json | null
          title_relevance: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          general_feedback?: string | null
          id?: string
          message_id?: string
          overall_rating?: number
          response_quality?: string
          session_id?: string
          suggested_improvements?: string | null
          title_feedback?: Json | null
          title_relevance?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_message_feedback_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_message_feedback_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          message_type: string
          response_time_ms: number | null
          session_id: string
          tokens_used: number | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          message_type: string
          response_time_ms?: number | null
          session_id: string
          tokens_used?: number | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          message_type?: string
          response_time_ms?: number | null
          session_id?: string
          tokens_used?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_sessions: {
        Row: {
          created_at: string
          ended_at: string | null
          id: string
          messages: Json | null
          session_type: string
          started_at: string
          updated_at: string
          user_email: string
          user_id: string
        }
        Insert: {
          created_at?: string
          ended_at?: string | null
          id?: string
          messages?: Json | null
          session_type?: string
          started_at?: string
          updated_at?: string
          user_email: string
          user_id: string
        }
        Update: {
          created_at?: string
          ended_at?: string | null
          id?: string
          messages?: Json | null
          session_type?: string
          started_at?: string
          updated_at?: string
          user_email?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_suggested_queries: {
        Row: {
          clicked: boolean | null
          created_at: string
          id: string
          message_id: string
          query_position: number | null
          session_id: string
          suggested_query: string
        }
        Insert: {
          clicked?: boolean | null
          created_at?: string
          id?: string
          message_id: string
          query_position?: number | null
          session_id: string
          suggested_query: string
        }
        Update: {
          clicked?: boolean | null
          created_at?: string
          id?: string
          message_id?: string
          query_position?: number | null
          session_id?: string
          suggested_query?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_suggested_queries_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_suggested_queries_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_title_recommendations: {
        Row: {
          created_at: string
          id: string
          message_id: string
          recommendation_reason: string | null
          recommendation_score: number | null
          session_id: string
          title_id: string
          title_name_en: string | null
          title_name_kr: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          message_id: string
          recommendation_reason?: string | null
          recommendation_score?: number | null
          session_id: string
          title_id: string
          title_name_en?: string | null
          title_name_kr?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          message_id?: string
          recommendation_reason?: string | null
          recommendation_score?: number | null
          session_id?: string
          title_id?: string
          title_name_en?: string | null
          title_name_kr?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_title_recommendations_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_title_recommendations_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      content_posts: {
        Row: {
          author_email: string
          author_name: string
          category: string
          content: string
          created_at: string | null
          excerpt: string | null
          featured_image_url: string | null
          id: string
          meta_description: string | null
          meta_keywords: string[] | null
          published_at: string | null
          slug: string
          status: string
          tags: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          author_email: string
          author_name: string
          category: string
          content: string
          created_at?: string | null
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          meta_description?: string | null
          meta_keywords?: string[] | null
          published_at?: string | null
          slug: string
          status?: string
          tags?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          author_email?: string
          author_name?: string
          category?: string
          content?: string
          created_at?: string | null
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          meta_description?: string | null
          meta_keywords?: string[] | null
          published_at?: string | null
          slug?: string
          status?: string
          tags?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      featured: {
        Row: {
          created_at: string
          id: string
          note: string | null
          title_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          note?: string | null
          title_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          note?: string | null
          title_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "featured_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "titles"
            referencedColumns: ["title_id"]
          },
        ]
      }
      feedback_buyer: {
        Row: {
          created_at: string
          feedback: string | null
          id: number
          user_id: string | null
        }
        Insert: {
          created_at?: string
          feedback?: string | null
          id?: number
          user_id?: string | null
        }
        Update: {
          created_at?: string
          feedback?: string | null
          id?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feedback_buyer_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_buyers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_buyer_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_buyers_with_email"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_buyer_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_buyers_with_email"
            referencedColumns: ["user_id"]
          },
        ]
      }
      request: {
        Row: {
          created_at: string
          id: number
          title_id: string | null
          type: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          title_id?: string | null
          type?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          title_id?: string | null
          type?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      stripe_customers: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string | null
          current_period_end: string | null
          id: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          id?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          id?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      title_content_analysis: {
        Row: {
          accessibility_features: string[] | null
          analysis_version: string | null
          character_types: string[] | null
          complexity_score: number | null
          content_quality_score: number | null
          content_warnings: string[] | null
          created_at: string
          cultural_elements: string[] | null
          id: string
          keyword_density: Json | null
          mood_analysis: Json | null
          pitch_analysis: Json | null
          plot_elements: string[] | null
          processed_by: string | null
          processing_confidence: number | null
          reading_time_minutes: number | null
          search_boost_factor: number | null
          semantic_tags: Json | null
          target_demographics: Json | null
          title_id: string
          updated_at: string
        }
        Insert: {
          accessibility_features?: string[] | null
          analysis_version?: string | null
          character_types?: string[] | null
          complexity_score?: number | null
          content_quality_score?: number | null
          content_warnings?: string[] | null
          created_at?: string
          cultural_elements?: string[] | null
          id?: string
          keyword_density?: Json | null
          mood_analysis?: Json | null
          pitch_analysis?: Json | null
          plot_elements?: string[] | null
          processed_by?: string | null
          processing_confidence?: number | null
          reading_time_minutes?: number | null
          search_boost_factor?: number | null
          semantic_tags?: Json | null
          target_demographics?: Json | null
          title_id: string
          updated_at?: string
        }
        Update: {
          accessibility_features?: string[] | null
          analysis_version?: string | null
          character_types?: string[] | null
          complexity_score?: number | null
          content_quality_score?: number | null
          content_warnings?: string[] | null
          created_at?: string
          cultural_elements?: string[] | null
          id?: string
          keyword_density?: Json | null
          mood_analysis?: Json | null
          pitch_analysis?: Json | null
          plot_elements?: string[] | null
          processed_by?: string | null
          processing_confidence?: number | null
          reading_time_minutes?: number | null
          search_boost_factor?: number | null
          semantic_tags?: Json | null
          target_demographics?: Json | null
          title_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "title_content_analysis_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: true
            referencedRelation: "titles"
            referencedColumns: ["title_id"]
          },
        ]
      }
      title_documents: {
        Row: {
          created_at: string
          document_type: string
          external_url: string | null
          file_name: string
          file_size: number | null
          file_url: string
          id: string
          shareable_with_nda: boolean | null
          title_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          document_type: string
          external_url?: string | null
          file_name: string
          file_size?: number | null
          file_url: string
          id?: string
          shareable_with_nda?: boolean | null
          title_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          document_type?: string
          external_url?: string | null
          file_name?: string
          file_size?: number | null
          file_url?: string
          id?: string
          shareable_with_nda?: boolean | null
          title_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "title_documents_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "titles"
            referencedColumns: ["title_id"]
          },
        ]
      }
      title_drafts: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          creator_id: string
          current_step: number | null
          draft_data: Json
          id: string
          last_saved_at: string
          rejected_at: string | null
          rejection_reason: string | null
          status: string | null
          submitted_at: string | null
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          creator_id: string
          current_step?: number | null
          draft_data?: Json
          id?: string
          last_saved_at?: string
          rejected_at?: string | null
          rejection_reason?: string | null
          status?: string | null
          submitted_at?: string | null
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          creator_id?: string
          current_step?: number | null
          draft_data?: Json
          id?: string
          last_saved_at?: string
          rejected_at?: string | null
          rejection_reason?: string | null
          status?: string | null
          submitted_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      title_marketing_assets: {
        Row: {
          approved: boolean | null
          approved_at: string | null
          approved_by_email: string | null
          asset_category: string
          asset_format: string | null
          asset_type: string
          created_at: string | null
          description: string
          error_message: string | null
          generation_api: string | null
          generation_attempts: number | null
          generation_cost: number | null
          generation_model: string | null
          id: string
          image_url: string | null
          prompt_template: string
          prompt_used: string | null
          status: string
          title_id: string
          title_name: string
          updated_at: string | null
          video_url: string | null
        }
        Insert: {
          approved?: boolean | null
          approved_at?: string | null
          approved_by_email?: string | null
          asset_category: string
          asset_format?: string | null
          asset_type: string
          created_at?: string | null
          description: string
          error_message?: string | null
          generation_api?: string | null
          generation_attempts?: number | null
          generation_cost?: number | null
          generation_model?: string | null
          id?: string
          image_url?: string | null
          prompt_template: string
          prompt_used?: string | null
          status?: string
          title_id: string
          title_name: string
          updated_at?: string | null
          video_url?: string | null
        }
        Update: {
          approved?: boolean | null
          approved_at?: string | null
          approved_by_email?: string | null
          asset_category?: string
          asset_format?: string | null
          asset_type?: string
          created_at?: string | null
          description?: string
          error_message?: string | null
          generation_api?: string | null
          generation_attempts?: number | null
          generation_cost?: number | null
          generation_model?: string | null
          id?: string
          image_url?: string | null
          prompt_template?: string
          prompt_used?: string | null
          status?: string
          title_id?: string
          title_name?: string
          updated_at?: string | null
          video_url?: string | null
        }
        Relationships: []
      }
      title_platforms: {
        Row: {
          created_at: string
          id: string
          other_metrics: Json | null
          platform_name: string
          platform_url: string
          subscribers: number | null
          title_id: string
          updated_at: string
          views: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          other_metrics?: Json | null
          platform_name: string
          platform_url: string
          subscribers?: number | null
          title_id: string
          updated_at?: string
          views?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          other_metrics?: Json | null
          platform_name?: string
          platform_url?: string
          subscribers?: number | null
          title_id?: string
          updated_at?: string
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "title_platforms_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "titles"
            referencedColumns: ["title_id"]
          },
        ]
      }
      titles: {
        Row: {
          age_rating: string | null
          art_author: string | null
          art_author_kr: string | null
          art_title_en: string | null
          art_title_kr: string | null
          audience: string | null
          awards: string[] | null
          celebrity_endorsements: string | null
          chapters: number | null
          character_details: Json | null
          combined_embedding: string | null
          completed: string | null
          comps: string[] | null
          content_embedding: string | null
          content_format: Database["public"]["Enums"]["content_format"] | null
          cp: string | null
          created_at: string
          creator_achievements: Json | null
          creator_id: string
          description_embedding: string | null
          description_kr: string | null
          embedding_created_at: string | null
          embedding_model: string | null
          embedding_updated_at: string | null
          english_title_type: string | null
          genre: string[] | null
          genre_kr: string[] | null
          important_issues: string | null
          inspiration: string | null
          is_official_english_title: boolean | null
          keywords: string[] | null
          likes: number | null
          media_coverage: string | null
          merchandise_deals: string | null
          narrative_arc: string | null
          note: string | null
          note_kr: string | null
          original_author: string | null
          original_author_kr: string | null
          perfect_for: string | null
          pitch: string | null
          planned_ending: string | null
          print_edition_details: string | null
          print_editions: boolean | null
          priority: Database["public"]["Enums"]["priority"]
          rating: number | null
          rating_count: number | null
          rights: string | null
          rights_holder_company: string | null
          rights_holder_name: string | null
          sales_records: string | null
          script_title_en: string | null
          script_title_kr: string | null
          setting_description: string | null
          story_author: string | null
          story_author_kr: string | null
          story_structure: string | null
          supernatural_concepts: string | null
          synopsis: string | null
          synopsis_embedding: string | null
          tagline: string | null
          tagline_kr: string | null
          title_embedding: string | null
          title_id: string
          title_image: string | null
          title_name_en: string | null
          title_name_kr: string | null
          title_url: string | null
          tone: string | null
          underlying_novel_en: string | null
          underlying_novel_kr: string | null
          updated_at: string
          verified: boolean | null
          views: number | null
          world_lore: string | null
        }
        Insert: {
          age_rating?: string | null
          art_author?: string | null
          art_author_kr?: string | null
          art_title_en?: string | null
          art_title_kr?: string | null
          audience?: string | null
          awards?: string[] | null
          celebrity_endorsements?: string | null
          chapters?: number | null
          character_details?: Json | null
          combined_embedding?: string | null
          completed?: string | null
          comps?: string[] | null
          content_embedding?: string | null
          content_format?: Database["public"]["Enums"]["content_format"] | null
          cp?: string | null
          created_at?: string
          creator_achievements?: Json | null
          creator_id: string
          description_embedding?: string | null
          description_kr?: string | null
          embedding_created_at?: string | null
          embedding_model?: string | null
          embedding_updated_at?: string | null
          english_title_type?: string | null
          genre?: string[] | null
          genre_kr?: string[] | null
          important_issues?: string | null
          inspiration?: string | null
          is_official_english_title?: boolean | null
          keywords?: string[] | null
          likes?: number | null
          media_coverage?: string | null
          merchandise_deals?: string | null
          narrative_arc?: string | null
          note?: string | null
          note_kr?: string | null
          original_author?: string | null
          original_author_kr?: string | null
          perfect_for?: string | null
          pitch?: string | null
          planned_ending?: string | null
          print_edition_details?: string | null
          print_editions?: boolean | null
          priority?: Database["public"]["Enums"]["priority"]
          rating?: number | null
          rating_count?: number | null
          rights?: string | null
          rights_holder_company?: string | null
          rights_holder_name?: string | null
          sales_records?: string | null
          script_title_en?: string | null
          script_title_kr?: string | null
          setting_description?: string | null
          story_author?: string | null
          story_author_kr?: string | null
          story_structure?: string | null
          supernatural_concepts?: string | null
          synopsis?: string | null
          synopsis_embedding?: string | null
          tagline?: string | null
          tagline_kr?: string | null
          title_embedding?: string | null
          title_id?: string
          title_image?: string | null
          title_name_en?: string | null
          title_name_kr?: string | null
          title_url?: string | null
          tone?: string | null
          underlying_novel_en?: string | null
          underlying_novel_kr?: string | null
          updated_at?: string
          verified?: boolean | null
          views?: number | null
          world_lore?: string | null
        }
        Update: {
          age_rating?: string | null
          art_author?: string | null
          art_author_kr?: string | null
          art_title_en?: string | null
          art_title_kr?: string | null
          audience?: string | null
          awards?: string[] | null
          celebrity_endorsements?: string | null
          chapters?: number | null
          character_details?: Json | null
          combined_embedding?: string | null
          completed?: string | null
          comps?: string[] | null
          content_embedding?: string | null
          content_format?: Database["public"]["Enums"]["content_format"] | null
          cp?: string | null
          created_at?: string
          creator_achievements?: Json | null
          creator_id?: string
          description_embedding?: string | null
          description_kr?: string | null
          embedding_created_at?: string | null
          embedding_model?: string | null
          embedding_updated_at?: string | null
          english_title_type?: string | null
          genre?: string[] | null
          genre_kr?: string[] | null
          important_issues?: string | null
          inspiration?: string | null
          is_official_english_title?: boolean | null
          keywords?: string[] | null
          likes?: number | null
          media_coverage?: string | null
          merchandise_deals?: string | null
          narrative_arc?: string | null
          note?: string | null
          note_kr?: string | null
          original_author?: string | null
          original_author_kr?: string | null
          perfect_for?: string | null
          pitch?: string | null
          planned_ending?: string | null
          print_edition_details?: string | null
          print_editions?: boolean | null
          priority?: Database["public"]["Enums"]["priority"]
          rating?: number | null
          rating_count?: number | null
          rights?: string | null
          rights_holder_company?: string | null
          rights_holder_name?: string | null
          sales_records?: string | null
          script_title_en?: string | null
          script_title_kr?: string | null
          setting_description?: string | null
          story_author?: string | null
          story_author_kr?: string | null
          story_structure?: string | null
          supernatural_concepts?: string | null
          synopsis?: string | null
          synopsis_embedding?: string | null
          tagline?: string | null
          tagline_kr?: string | null
          title_embedding?: string | null
          title_id?: string
          title_image?: string | null
          title_name_en?: string | null
          title_name_kr?: string | null
          title_url?: string | null
          tone?: string | null
          underlying_novel_en?: string | null
          underlying_novel_kr?: string | null
          updated_at?: string
          verified?: boolean | null
          views?: number | null
          world_lore?: string | null
        }
        Relationships: []
      }
      user_buyers: {
        Row: {
          buyer_company: string | null
          buyer_role: Database["public"]["Enums"]["buyer_role"] | null
          created_at: string
          email: string
          full_name: string
          id: string
          linkedin_url: string | null
          requested: boolean | null
          tier: Database["public"]["Enums"]["user_tier"] | null
          updated_at: string
        }
        Insert: {
          buyer_company?: string | null
          buyer_role?: Database["public"]["Enums"]["buyer_role"] | null
          created_at?: string
          email: string
          full_name: string
          id: string
          linkedin_url?: string | null
          requested?: boolean | null
          tier?: Database["public"]["Enums"]["user_tier"] | null
          updated_at?: string
        }
        Update: {
          buyer_company?: string | null
          buyer_role?: Database["public"]["Enums"]["buyer_role"] | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          linkedin_url?: string | null
          requested?: boolean | null
          tier?: Database["public"]["Enums"]["user_tier"] | null
          updated_at?: string
        }
        Relationships: []
      }
      user_creators: {
        Row: {
          created_at: string | null
          email: string
          full_name: string
          id: string
          invitation_status: string | null
          ip_owner_company: string | null
          ip_owner_role: Database["public"]["Enums"]["ip_owner_role"] | null
          pen_name: string | null
          tier: Database["public"]["Enums"]["user_tier"] | null
          updated_at: string | null
          website_url: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name: string
          id: string
          invitation_status?: string | null
          ip_owner_company?: string | null
          ip_owner_role?: Database["public"]["Enums"]["ip_owner_role"] | null
          pen_name?: string | null
          tier?: Database["public"]["Enums"]["user_tier"] | null
          updated_at?: string | null
          website_url?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          invitation_status?: string | null
          ip_owner_company?: string | null
          ip_owner_role?: Database["public"]["Enums"]["ip_owner_role"] | null
          pen_name?: string | null
          tier?: Database["public"]["Enums"]["user_tier"] | null
          updated_at?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      user_favorites: {
        Row: {
          created_at: string
          id: string
          title_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_favorites_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "titles"
            referencedColumns: ["title_id"]
          },
        ]
      }
      user_onboarding: {
        Row: {
          created_at: string | null
          current_step: number | null
          has_seen_welcome_video: boolean | null
          id: string
          onboarding_completed: boolean | null
          onboarding_completed_at: string | null
          onboarding_started_at: string | null
          skipped: boolean | null
          updated_at: string | null
          user_email: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_step?: number | null
          has_seen_welcome_video?: boolean | null
          id?: string
          onboarding_completed?: boolean | null
          onboarding_completed_at?: string | null
          onboarding_started_at?: string | null
          skipped?: boolean | null
          updated_at?: string | null
          user_email: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_step?: number | null
          has_seen_welcome_video?: boolean | null
          id?: string
          onboarding_completed?: boolean | null
          onboarding_completed_at?: string | null
          onboarding_started_at?: string | null
          skipped?: boolean | null
          updated_at?: string | null
          user_email?: string
          user_id?: string
        }
        Relationships: []
      }
      vector_search_analytics: {
        Row: {
          click_position: number | null
          clicked_title_id: string | null
          created_at: string | null
          id: string
          query: string
          query_complexity: string | null
          query_intent: string | null
          refinements: string[] | null
          result_count: number | null
          search_duration_ms: number | null
          search_type: string | null
          session_id: string
          user_id: string | null
          user_satisfaction_score: number | null
        }
        Insert: {
          click_position?: number | null
          clicked_title_id?: string | null
          created_at?: string | null
          id?: string
          query: string
          query_complexity?: string | null
          query_intent?: string | null
          refinements?: string[] | null
          result_count?: number | null
          search_duration_ms?: number | null
          search_type?: string | null
          session_id: string
          user_id?: string | null
          user_satisfaction_score?: number | null
        }
        Update: {
          click_position?: number | null
          clicked_title_id?: string | null
          created_at?: string | null
          id?: string
          query?: string
          query_complexity?: string | null
          query_intent?: string | null
          refinements?: string[] | null
          result_count?: number | null
          search_duration_ms?: number | null
          search_type?: string | null
          session_id?: string
          user_id?: string | null
          user_satisfaction_score?: number | null
        }
        Relationships: []
      }
      webhook_events: {
        Row: {
          created_at: string | null
          id: string
          processed_at: string | null
          stripe_event_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          processed_at?: string | null
          stripe_event_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          processed_at?: string | null
          stripe_event_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      feedback_analysis: {
        Row: {
          avg_title_relevance_score: number | null
          created_at: string | null
          general_feedback: string | null
          id: string | null
          message_content: string | null
          message_id: string | null
          message_type: string | null
          overall_rating: number | null
          response_quality: string | null
          response_time_ms: number | null
          session_id: string | null
          session_started: string | null
          session_type: string | null
          suggested_improvements: string | null
          title_count: number | null
          title_feedback: Json | null
          title_relevance: string | null
          tokens_used: number | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_message_feedback_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_message_feedback_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_buyers_with_email: {
        Row: {
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string | null
          requested: boolean | null
          tier: Database["public"]["Enums"]["user_tier"] | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email?: never
          full_name?: never
          id?: string | null
          requested?: boolean | null
          tier?: Database["public"]["Enums"]["user_tier"] | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: never
          full_name?: never
          id?: string | null
          requested?: boolean | null
          tier?: Database["public"]["Enums"]["user_tier"] | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      append_session_message: {
        Args: { p_message: Json; p_session_id: string }
        Returns: boolean
      }
      cleanup_old_webhook_events: { Args: never; Returns: number }
      create_missing_creator_profiles: {
        Args: never
        Returns: {
          action: string
          email: string
          user_id: string
        }[]
      }
      create_user_profile: {
        Args: {
          account_type: string
          profile_data?: Json
          user_email: string
          user_id: string
        }
        Returns: boolean
      }
      fix_missing_oauth_profiles: {
        Args: never
        Returns: {
          account_type: string
          profile_created: boolean
          user_email: string
          user_id: string
        }[]
      }
      get_conversation_with_titles: {
        Args: { p_session_id: string }
        Returns: {
          content: string
          created_at: string
          message_id: string
          message_type: string
          suggested_queries: Json
          titles: Json
        }[]
      }
      get_recent_messages: {
        Args: { p_limit?: number; p_user_id: string }
        Returns: {
          messages: Json
          session_id: string
          session_type: string
          started_at: string
          updated_at: string
          user_email: string
          user_id: string
        }[]
      }
      hybrid_search_titles: {
        Args: {
          match_count?: number
          query_embedding: string
          query_text: string
          text_weight?: number
          vector_weight?: number
        }
        Returns: {
          combined_score: number
          description: string
          text_score: number
          title_id: string
          title_name_en: string
          title_name_kr: string
          vector_score: number
        }[]
      }
      match_titles_by_embedding: {
        Args: {
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          age_rating: string
          art_author: string
          audience: string
          comps: string[]
          content_format: string
          description: string
          genre: string[]
          perfect_for: string
          pitch_analysis: Json
          processing_confidence: number
          similarity: number
          story_author: string
          synopsis: string
          title_id: string
          title_name_en: string
          title_name_kr: string
          tone: string
        }[]
      }
      process_title_for_vector_search: {
        Args: { target_title_id: string }
        Returns: undefined
      }
      test_admin_connectivity: { Args: never; Returns: Json }
      update_session_messages: {
        Args: { p_messages: Json; p_session_id: string }
        Returns: boolean
      }
    }
    Enums: {
      account_type: "creator" | "buyer"
      buyer_role: "producer" | "executive" | "agent" | "content_scout" | "other"
      content_format:
        | "webtoon"
        | "web_novel"
        | "book"
        | "script"
        | "game"
        | "animation"
        | "other"
      genre:
        | "romance"
        | "fantasy"
        | "action"
        | "drama"
        | "comedy"
        | "thriller"
        | "horror"
        | "sci_fi"
        | "slice_of_life"
        | "historical"
        | "mystery"
        | "sports"
        | "other"
      ip_owner_role: "author" | "agent"
      priority: "1" | "2" | "3"
      user_tier: "invited" | "basic" | "pro" | "suite"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      account_type: ["creator", "buyer"],
      buyer_role: ["producer", "executive", "agent", "content_scout", "other"],
      content_format: [
        "webtoon",
        "web_novel",
        "book",
        "script",
        "game",
        "animation",
        "other",
      ],
      genre: [
        "romance",
        "fantasy",
        "action",
        "drama",
        "comedy",
        "thriller",
        "horror",
        "sci_fi",
        "slice_of_life",
        "historical",
        "mystery",
        "sports",
        "other",
      ],
      ip_owner_role: ["author", "agent"],
      priority: ["1", "2", "3"],
      user_tier: ["invited", "basic", "pro", "suite"],
    },
  },
} as const
