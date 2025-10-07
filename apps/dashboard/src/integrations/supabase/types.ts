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
          character_types: string[] | null
          complexity_score: number | null
          content_quality_score: number | null
          content_warnings: string[] | null
          created_at: string | null
          cultural_elements: string[] | null
          id: string
          keyword_density: Json | null
          mood_analysis: Json | null
          plot_elements: string[] | null
          search_boost_factor: number | null
          semantic_tags: string[] | null
          target_demographics: Json | null
          title_id: string
          updated_at: string | null
        }
        Insert: {
          character_types?: string[] | null
          complexity_score?: number | null
          content_quality_score?: number | null
          content_warnings?: string[] | null
          created_at?: string | null
          cultural_elements?: string[] | null
          id?: string
          keyword_density?: Json | null
          mood_analysis?: Json | null
          plot_elements?: string[] | null
          search_boost_factor?: number | null
          semantic_tags?: string[] | null
          target_demographics?: Json | null
          title_id: string
          updated_at?: string | null
        }
        Update: {
          character_types?: string[] | null
          complexity_score?: number | null
          content_quality_score?: number | null
          content_warnings?: string[] | null
          created_at?: string | null
          cultural_elements?: string[] | null
          id?: string
          keyword_density?: Json | null
          mood_analysis?: Json | null
          plot_elements?: string[] | null
          search_boost_factor?: number | null
          semantic_tags?: string[] | null
          target_demographics?: Json | null
          title_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      titles: {
        Row: {
          age_rating: string | null
          art_author: string | null
          art_author_kr: string | null
          audience: string | null
          chapters: number | null
          combined_embedding: string | null
          completed: string | null
          comps: string[] | null
          content_embedding: string | null
          content_format: Database["public"]["Enums"]["content_format"] | null
          cp: string | null
          created_at: string
          creator_id: string
          description_embedding: string | null
          description_kr: string | null
          embedding_created_at: string | null
          embedding_model: string | null
          embedding_updated_at: string | null
          genre: string[] | null
          genre_kr: string[] | null
          keywords: string[] | null
          likes: number | null
          note: string | null
          note_kr: string | null
          original_author: string | null
          original_author_kr: string | null
          perfect_for: string | null
          pitch: string | null
          priority: Database["public"]["Enums"]["priority"]
          rating: number | null
          rating_count: number | null
          rights: string | null
          story_author: string | null
          story_author_kr: string | null
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
          updated_at: string
          views: number | null
        }
        Insert: {
          age_rating?: string | null
          art_author?: string | null
          art_author_kr?: string | null
          audience?: string | null
          chapters?: number | null
          combined_embedding?: string | null
          completed?: string | null
          comps?: string[] | null
          content_embedding?: string | null
          content_format?: Database["public"]["Enums"]["content_format"] | null
          cp?: string | null
          created_at?: string
          creator_id: string
          description_embedding?: string | null
          description_kr?: string | null
          embedding_created_at?: string | null
          embedding_model?: string | null
          embedding_updated_at?: string | null
          genre?: string[] | null
          genre_kr?: string[] | null
          keywords?: string[] | null
          likes?: number | null
          note?: string | null
          note_kr?: string | null
          original_author?: string | null
          original_author_kr?: string | null
          perfect_for?: string | null
          pitch?: string | null
          priority?: Database["public"]["Enums"]["priority"]
          rating?: number | null
          rating_count?: number | null
          rights?: string | null
          story_author?: string | null
          story_author_kr?: string | null
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
          updated_at?: string
          views?: number | null
        }
        Update: {
          age_rating?: string | null
          art_author?: string | null
          art_author_kr?: string | null
          audience?: string | null
          chapters?: number | null
          combined_embedding?: string | null
          completed?: string | null
          comps?: string[] | null
          content_embedding?: string | null
          content_format?: Database["public"]["Enums"]["content_format"] | null
          cp?: string | null
          created_at?: string
          creator_id?: string
          description_embedding?: string | null
          description_kr?: string | null
          embedding_created_at?: string | null
          embedding_model?: string | null
          embedding_updated_at?: string | null
          genre?: string[] | null
          genre_kr?: string[] | null
          keywords?: string[] | null
          likes?: number | null
          note?: string | null
          note_kr?: string | null
          original_author?: string | null
          original_author_kr?: string | null
          perfect_for?: string | null
          pitch?: string | null
          priority?: Database["public"]["Enums"]["priority"]
          rating?: number | null
          rating_count?: number | null
          rights?: string | null
          story_author?: string | null
          story_author_kr?: string | null
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
          updated_at?: string
          views?: number | null
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
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      create_missing_creator_profiles: {
        Args: Record<PropertyKey, never>
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
        Args: Record<PropertyKey, never>
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
      halfvec_avg: {
        Args: { "": number[] }
        Returns: unknown
      }
      halfvec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_send: {
        Args: { "": unknown }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      hnsw_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnswhandler: {
        Args: { "": unknown }
        Returns: unknown
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
      ivfflat_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflathandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      l2_norm: {
        Args: { "": unknown } | { "": unknown }
        Returns: number
      }
      l2_normalize: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: unknown
      }
      match_titles_by_embedding: {
        Args: {
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          title_id: string
          title_name_en: string
          title_name_kr: string
          description: string
          similarity: number
          synopsis: string
          genre: string[]
          tone: string
          content_format: string
          perfect_for: string
          audience: string
          age_rating: string
          story_author: string
          art_author: string
          comps: string[]
        }[]
      }
      process_title_for_vector_search: {
        Args: { target_title_id: string }
        Returns: undefined
      }
      sparsevec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      sparsevec_send: {
        Args: { "": unknown }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      test_admin_connectivity: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      update_session_messages: {
        Args: { p_messages: Json; p_session_id: string }
        Returns: boolean
      }
      vector_avg: {
        Args: { "": number[] }
        Returns: string
      }
      vector_dims: {
        Args: { "": string } | { "": unknown }
        Returns: number
      }
      vector_norm: {
        Args: { "": string }
        Returns: number
      }
      vector_out: {
        Args: { "": string }
        Returns: unknown
      }
      vector_send: {
        Args: { "": string }
        Returns: string
      }
      vector_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
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
