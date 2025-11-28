Using workdir /Users/sungholee/code/kstorybridge
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
       