export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      admin: {
        Row: {
          active: boolean
          created_at: string
          email: string
          full_name: string
          id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          email: string
          full_name: string
          id?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_type: Database["public"]["Enums"]["account_type"]
          buyer_company: string | null
          buyer_role: Database["public"]["Enums"]["buyer_role"] | null
          created_at: string
          email: string
          full_name: string
          id: string
          invitation_status: string | null
          ip_owner_company: string | null
          ip_owner_role: Database["public"]["Enums"]["ip_owner_role"] | null
          linkedin_url: string | null
          pen_name: string | null
          updated_at: string
          website_url: string | null
        }
        Insert: {
          account_type: Database["public"]["Enums"]["account_type"]
          buyer_company?: string | null
          buyer_role?: Database["public"]["Enums"]["buyer_role"] | null
          created_at?: string
          email: string
          full_name: string
          id: string
          invitation_status?: string | null
          ip_owner_company?: string | null
          ip_owner_role?: Database["public"]["Enums"]["ip_owner_role"] | null
          linkedin_url?: string | null
          pen_name?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          account_type?: Database["public"]["Enums"]["account_type"]
          buyer_company?: string | null
          buyer_role?: Database["public"]["Enums"]["buyer_role"] | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          invitation_status?: string | null
          ip_owner_company?: string | null
          ip_owner_role?: Database["public"]["Enums"]["ip_owner_role"] | null
          linkedin_url?: string | null
          pen_name?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      titles: {
        Row: {
          art_author: string | null
          audience: string | null
          author: string | null
          chapters: number | null
          completed: boolean | null
          comps: string[] | null
          content_format: Database["public"]["Enums"]["content_format"] | null
          created_at: string
          creator_id: string
          description: string | null
          genre: Database["public"]["Enums"]["genre"] | null
          illustrator: string | null
          likes: number | null
          note: string | null
          perfect_for: string | null
          pitch: string | null
          rating: number | null
          rating_count: number | null
          rights: string | null
          rights_owner: string | null
          story_author: string | null
          synopsis: string | null
          tagline: string | null
          tags: string[] | null
          title_id: string
          title_image: string | null
          title_name_en: string | null
          title_name_kr: string
          title_url: string | null
          tone: string | null
          updated_at: string
          views: number | null
          writer: string | null
        }
        Insert: {
          art_author?: string | null
          audience?: string | null
          author?: string | null
          chapters?: number | null
          completed?: boolean | null
          comps?: string[] | null
          content_format?: Database["public"]["Enums"]["content_format"] | null
          created_at?: string
          creator_id: string
          description?: string | null
          genre?: Database["public"]["Enums"]["genre"] | null
          illustrator?: string | null
          likes?: number | null
          note?: string | null
          perfect_for?: string | null
          pitch?: string | null
          rating?: number | null
          rating_count?: number | null
          rights?: string | null
          rights_owner?: string | null
          story_author?: string | null
          synopsis?: string | null
          tagline?: string | null
          tags?: string[] | null
          title_id?: string
          title_image?: string | null
          title_name_en?: string | null
          title_name_kr: string
          title_url?: string | null
          tone?: string | null
          updated_at?: string
          views?: number | null
          writer?: string | null
        }
        Update: {
          art_author?: string | null
          audience?: string | null
          author?: string | null
          chapters?: number | null
          completed?: boolean | null
          comps?: string[] | null
          content_format?: Database["public"]["Enums"]["content_format"] | null
          created_at?: string
          creator_id?: string
          description?: string | null
          genre?: Database["public"]["Enums"]["genre"] | null
          illustrator?: string | null
          likes?: number | null
          note?: string | null
          perfect_for?: string | null
          pitch?: string | null
          rating?: number | null
          rating_count?: number | null
          rights?: string | null
          rights_owner?: string | null
          story_author?: string | null
          synopsis?: string | null
          tagline?: string | null
          tags?: string[] | null
          title_id?: string
          title_image?: string | null
          title_name_en?: string | null
          title_name_kr?: string
          title_url?: string | null
          tone?: string | null
          updated_at?: string
          views?: number | null
          writer?: string | null
        }
        Relationships: []
      }
      user_buyers: {
        Row: {
          created_at: string
          id: string
          requested: boolean | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          requested?: boolean | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          requested?: boolean | null
          user_id?: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      account_type: "ip_owner" | "buyer"
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
> = DefaultSchemaEnumNameOptions extends {
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
      account_type: ["ip_owner", "buyer"],
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
    },
  },
} as const